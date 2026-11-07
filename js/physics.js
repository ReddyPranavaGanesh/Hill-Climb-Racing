// Hill Climb Racing - 2D Vehicle Physics Engine v5
// Robust Prismatic Suspension Constraint, Realistic Mass & Pitch Physics,
// True Ground Traction & In-Air Stunt Controls

class VehiclePhysics {
  constructor(config = {}) {
    this.config = Object.assign({
      wheelBase: 78,
      wheelRadius: 18,
      rideHeight: 28,
      chassisMass: 85,
      enginePower: 520,
      brakeTorque: 920,
      airControlTorque: 6.8,
      fourWheelDrive: 0.65,
      maxSpeed: 750,
      suspensionStiffness: 220,
      suspensionDamping: 26
    }, config);

    this.reset(20, 404);
  }

  reset(startX = 20, startY = 404) {
    const halfW = this.config.wheelBase * 0.5;
    const cfg = this.config;

    this.chassis = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      angle: 0,
      vAngle: 0
    };

    // Strut lengths (distance from anchor to wheel along the strut axis)
    this.rearSuspLen = cfg.rideHeight;
    this.frontSuspLen = cfg.rideHeight;
    this.rearSuspVel = 0;
    this.frontSuspVel = 0;

    this.rearWheel = {
      localX: -halfW,
      localY: 4,
      armX: -halfW,
      armY: 4,
      x: startX - halfW,
      y: startY + cfg.rideHeight,
      radius: cfg.wheelRadius,
      omega: 0,
      angle: 0,
      grounded: true,
      suspLen: cfg.rideHeight
    };

    this.frontWheel = {
      localX: halfW,
      localY: 4,
      armX: halfW,
      armY: 4,
      x: startX + halfW,
      y: startY + cfg.rideHeight,
      radius: cfg.wheelRadius,
      omega: 0,
      angle: 0,
      grounded: true,
      suspLen: cfg.rideHeight
    };

    this.driverHead = {
      relX: -4,
      relY: -32,
      x: startX - 4,
      y: startY - 32,
      radius: 12,
      bobAngle: 0
    };

    this.fuel = 100.0;
    this.timeAlive = 0;
    this.isAirborne = false;
    this.airTime = 0;
    this.totalAirRotation = 0;
    this.lastAngle = 0;
    this.crashed = false;
    this.crashReason = '';
    this.outOfFuel = false;
    this.stoppedOutOfFuelTimer = 0;
  }

  localToWorld(lx, ly) {
    const cos = Math.cos(this.chassis.angle);
    const sin = Math.sin(this.chassis.angle);
    return {
      x: this.chassis.x + lx * cos - ly * sin,
      y: this.chassis.y + lx * sin + ly * cos
    };
  }

  getChassisAnchorWorld(armX, armY) {
    return this.localToWorld(armX, armY);
  }

  update(dt, input, terrain, upgrades = {}) {
    if (this.crashed) {
      this.updateCrashed(dt, terrain);
      return;
    }

    this.timeAlive += dt;
    const cfg = this.config;

    // Upgrades
    const engineMult = 1.0 + (upgrades.engine || 0) * 0.18;
    const suspMult   = 1.0 + (upgrades.suspension || 0) * 0.15;
    const tireMult   = 1.0 + (upgrades.tires || 0) * 0.15;
    const airMult    = 1.0 + (upgrades.stability || 0) * 0.22;

    const enginePower = cfg.enginePower * engineMult;
    const brakeTorque = cfg.brakeTorque * tireMult;
    const airTorque   = cfg.airControlTorque * airMult;
    const maxSpeed    = cfg.maxSpeed * (1 + (upgrades.engine || 0) * 0.06);

    // Map modifiers (e.g. Moon low gravity 0.35x, Arctic low friction 0.74x)
    const mapGravMult = (terrain && terrain.mapConfig && terrain.mapConfig.gravityMult) || 1.0;
    const mapFricMult = (terrain && terrain.mapConfig && terrain.mapConfig.frictionMult) || 1.0;

    // 1. Fuel drain: Faster, realistic fuel burn (Requirement 5)
    // Full tank lasts ~22-26s under active gas, making fuel canisters rewarding and crucial!
    if (this.fuel > 0) {
      const isThrottling = input.gas;
      const isClimbing = Math.abs(this.chassis.vAngle) > 0.18 || this.chassis.vy < -60;
      const drain = (1.25 + (isThrottling ? 3.75 : 0) + (isClimbing ? 1.4 : 0) + (input.brake ? 0.6 : 0)) * dt;
      this.fuel = Math.max(0, this.fuel - drain);
      if (this.fuel <= 0 && !this.outOfFuel) this.outOfFuel = true;
    }

    // 2. Chassis unit vectors
    const angle = this.chassis.angle;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Forward vector along chassis floor: (cosA, sinA)
    // Downward vector perpendicular to floor: (-sinA, cosA)
    const downX = -sinA;
    const downY = cosA;

    const halfW = cfg.wheelBase * 0.5;
    const rAnchor = this.localToWorld(-halfW, 4);
    const fAnchor = this.localToWorld(halfW, 4);

    // 3. Strict Suspension Bounds
    const sRest = cfg.rideHeight;        // e.g. 28px
    const sMin  = sRest - 11;            // bump stop, e.g. 17px
    const sMax  = sRest + 9;             // full extension, e.g. 37px
    const R     = cfg.wheelRadius;

    // Ground clearance under anchors
    // For wheel contact: anchor.y + s * downY + R = groundY(anchor.x + s * downX)
    const isUpright = downY > 0.15;

    let rGrounded = false;
    let fGrounded = false;
    let rReqLen = sMax;
    let fReqLen = sMax;

    if (isUpright) {
      const rTestX = rAnchor.x + sRest * downX;
      const fTestX = fAnchor.x + sRest * downX;

      const rGroundY = terrain.getHeight(rTestX);
      const fGroundY = terrain.getHeight(fTestX);

      rReqLen = (rGroundY - R - rAnchor.y) / downY;
      fReqLen = (fGroundY - R - fAnchor.y) / downY;

      rGrounded = rReqLen <= sMax + 2;
      fGrounded = fReqLen <= sMax + 2;
    }

    this.rearWheel.grounded = rGrounded;
    this.frontWheel.grounded = fGrounded;
    const anyGrounded = rGrounded || fGrounded;
    const wasAirborne = this.isAirborne;

    if (anyGrounded) {
      this.isAirborne = false;
    } else if (this.chassis.vy < -15 || (rReqLen > sMax + 12 && fReqLen > sMax + 12)) {
      this.isAirborne = true;
    }

    // 4. Suspension spring-damper dynamics
    const kSusp = cfg.suspensionStiffness * suspMult;
    const cSusp = cfg.suspensionDamping * Math.sqrt(suspMult);

    let totalSuspForceY = 0;
    let totalSuspForceX = 0;

    // Rear suspension
    const targetRLen = rGrounded ? Math.max(sMin, Math.min(sMax, rReqLen)) : sMax;
    const rCompression = sRest - targetRLen;
    let rSpringForce = 0;
    if (rGrounded) {
      // Positive force pushes chassis away from ground (along -down vector)
      rSpringForce = Math.max(0, kSusp * rCompression - cSusp * this.chassis.vy);
      totalSuspForceX -= rSpringForce * downX;
      totalSuspForceY -= rSpringForce * downY;
    }
    // Smooth wheel strut movement
    this.rearSuspLen += (targetRLen - this.rearSuspLen) * Math.min(1.0, 24 * dt);
    this.rearSuspLen = Math.max(sMin, Math.min(sMax, this.rearSuspLen));

    // Front suspension
    const targetFLen = fGrounded ? Math.max(sMin, Math.min(sMax, fReqLen)) : sMax;
    const fCompression = sRest - targetFLen;
    let fSpringForce = 0;
    if (fGrounded) {
      fSpringForce = Math.max(0, kSusp * fCompression - cSusp * this.chassis.vy);
      totalSuspForceX -= fSpringForce * downX;
      totalSuspForceY -= fSpringForce * downY;
    }
    this.frontSuspLen += (targetFLen - this.frontSuspLen) * Math.min(1.0, 24 * dt);
    this.frontSuspLen = Math.max(sMin, Math.min(sMax, this.frontSuspLen));

    // Update wheel world coordinates strictly along strut axis
    this.rearWheel.x = rAnchor.x + this.rearSuspLen * downX;
    this.rearWheel.y = rAnchor.y + this.rearSuspLen * downY;
    this.rearWheel.suspLen = this.rearSuspLen;

    this.frontWheel.x = fAnchor.x + this.frontSuspLen * downX;
    this.frontWheel.y = fAnchor.y + this.frontSuspLen * downY;
    this.frontWheel.suspLen = this.frontSuspLen;

    // 5. Environmental Forces & Driving (Requirement 2 & 7: Map gravity & friction)
    const GRAVITY = 720 * mapGravMult;
    this.chassis.vy += GRAVITY * dt;

    if (anyGrounded) {
      // Apply suspension upward forces
      this.chassis.vx += (totalSuspForceX / cfg.chassisMass) * dt;
      this.chassis.vy += (totalSuspForceY / cfg.chassisMass) * dt;

      // Ground tangent & slope
      const tangent = terrain.getTangent(this.chassis.x);
      const slopeAngle = terrain.getSlopeAngle(this.chassis.x);

      let driveF = 0;
      let brakeF = 0;

      // Driving force along terrain
      if (input.gas && this.fuel > 0) {
        const speedRatio = Math.abs(this.chassis.vx) / maxSpeed;
        const powerCurve = Math.max(0.15, 1.0 - speedRatio * 0.5);
        driveF = enginePower * powerCurve;

        // Drive split (Rear vs Front)
        let traction = 0;
        if (rGrounded) traction += (1.0 - cfg.fourWheelDrive * 0.35);
        if (fGrounded) traction += cfg.fourWheelDrive;
        traction = Math.min(1.2, traction) * mapFricMult;

        this.chassis.vx += driveF * traction * tangent.x * dt;
        this.chassis.vy += driveF * traction * tangent.y * dt * 0.4;
      }
      // Braking & Reverse
      else if (input.brake) {
        if (this.chassis.vx > 10) {
          // Sharp brake
          brakeF = (brakeTorque * (rGrounded ? 0.6 : 0) + brakeTorque * (fGrounded ? 0.6 : 0)) * mapFricMult;
          this.chassis.vx -= brakeF * tangent.x * dt;
          if (this.chassis.vx < 0) this.chassis.vx = 0;
        } else if (this.chassis.vx >= -5) {
          this.chassis.vx *= 0.82;
          if (this.fuel > 0 && Math.abs(this.chassis.vx) < 8) {
            this.chassis.vx -= enginePower * 0.35 * dt * mapFricMult;
          }
        } else {
          // Reverse
          if (this.fuel > 0) {
            const revF = enginePower * 0.42 * mapFricMult;
            this.chassis.vx -= revF * tangent.x * dt;
            if (this.chassis.vx < -180) this.chassis.vx = -180;
          }
        }
      } else {
        // Coasting rolling resistance
        this.chassis.vx *= (1 - 0.55 * dt);
      }

      // Slope gravity assist/resistance
      this.chassis.vx += GRAVITY * Math.sin(slopeAngle) * tangent.x * dt;

      // Pitch Dynamics on Ground: Gas tilts BACKWARD (wheelie), Brake tilts FORWARD (stoppie)
      if (rGrounded && fGrounded) {
        // Both wheels on ground: align body to ground slope, with gas lifting nose and brake dipping nose
        const targetAngle = slopeAngle;
        const angleErr = this.chassis.angle - targetAngle;
        const angK = 110 * suspMult;
        const angC = 18 * Math.sqrt(suspMult);
        let groundTorque = -angK * angleErr - angC * this.chassis.vAngle;

        // Holding Gas tilts vehicle BACKWARD (wheelie pitch)
        if (input.gas && this.fuel > 0) {
          groundTorque -= (driveF * 0.007 + 2.2);
        }
        // Holding Brake dips vehicle FORWARD (nose dive pitch)
        if (input.brake && brakeF > 0) {
          groundTorque += (brakeF * 0.007 + 2.2);
        }

        this.chassis.vAngle += groundTorque * dt;
      } else if (rGrounded) {
        // Rear wheel only (WHEELIE): Gas strongly pulls nose UP/BACKWARD; Brake slams nose DOWN/FORWARD
        const relAngle = this.chassis.angle - slopeAngle;
        let wheelieTorque = 36 * Math.sin(-relAngle); // gravity pulling front down toward slope

        if (input.gas && this.fuel > 0) {
          // Pressing gas wheelies backward
          wheelieTorque -= (enginePower * 0.018 + 5.5);
        }
        if (input.brake) {
          // Pressing brake slams front down forward
          wheelieTorque += (brakeTorque * 0.020 + 6.5);
        }
        this.chassis.vAngle += wheelieTorque * dt;
        this.chassis.vAngle *= (1 - 0.55 * dt);
      } else if (fGrounded) {
        // Front wheel only (STOPPIE / NOSE DIVE): Brake strongly pitches FORWARD; Gas pulls rear DOWN/BACKWARD
        const relAngle = this.chassis.angle - slopeAngle;
        let stoppieTorque = -36 * Math.sin(relAngle); // gravity pulling rear down toward slope

        if (input.brake) {
          // Pressing brake pitches forward into stoppie/frontflip
          stoppieTorque += (brakeTorque * 0.020 + 6.5);
        }
        if (input.gas && this.fuel > 0) {
          // Pressing gas pulls rear down backward
          stoppieTorque -= (enginePower * 0.018 + 5.5);
        }
        this.chassis.vAngle += stoppieTorque * dt;
        this.chassis.vAngle *= (1 - 0.55 * dt);
      }
      this.chassis.angle += this.chassis.vAngle * dt;

      // Damp vertical velocity when firmly planted
      this.chassis.vy *= 0.88;

      // Ground floor safety: prevent chassis bottom from penetrating terrain (ONLY when upright)
      if (isUpright) {
        const midGroundY = terrain.getHeight(this.chassis.x);
        const floorLimit = midGroundY - R - 6;
        if (this.chassis.y > floorLimit) {
          this.chassis.y = floorLimit;
          if (this.chassis.vy > 0) this.chassis.vy = 0;
        }
      }

      // Landing from air
      if (wasAirborne) {
        this.evaluateLandedStunts();
        this.airTime = 0;
        this.totalAirRotation = 0;
        window.soundSystem.playLand(Math.min(1.0, this.airTime));
      }

    } else {
      // Airborne Stunts & Flips: Gas BACKFLIPS (counter-clockwise ↺), Brake FRONTFLIPS (clockwise ↻)
      this.airTime += dt;
      this.chassis.vx *= (1 - 0.08 * dt);

      const airFlipRate = airTorque * 3.4 * dt;
      if (input.gas) {
        // Pressing Gas = BACKFLIP (rotate counter-clockwise, nose UP)
        if (this.chassis.vAngle > 0) {
          this.chassis.vAngle *= (1 - 7.5 * dt); // rapidly cancel forward spin
        }
        this.chassis.vAngle -= airFlipRate;
      }
      if (input.brake) {
        // Pressing Brake = FRONTFLIP (rotate clockwise, nose DOWN)
        if (this.chassis.vAngle < 0) {
          this.chassis.vAngle *= (1 - 7.5 * dt); // rapidly cancel backward spin
        }
        this.chassis.vAngle += airFlipRate;
      }

      // Air stabilization drag when no pedals are pressed
      const airDrag = (input.gas || input.brake) ? 0.45 : 1.8;
      this.chassis.vAngle *= (1 - airDrag * dt);

      // Clamp max mid-air angular velocity
      const maxAirSpin = 5.8; // ~0.92 rotations/sec max
      this.chassis.vAngle = Math.max(-maxAirSpin, Math.min(maxAirSpin, this.chassis.vAngle));
      this.chassis.angle += this.chassis.vAngle * dt;

      // Track stunt rotation
      const dAngle = this.chassis.angle - this.lastAngle;
      this.totalAirRotation += dAngle;

      // Landing check: only land on wheels if upright!
      if (isUpright) {
        const rGroundY = terrain.getHeight(rAnchor.x);
        const fGroundY = terrain.getHeight(fAnchor.x);
        const avgGroundY = (rGroundY + fGroundY) * 0.5;

        if (this.chassis.y >= avgGroundY - sRest && this.chassis.vy > 0) {
          this.chassis.y = avgGroundY - sRest;
          this.chassis.vy = -Math.abs(this.chassis.vy) * 0.10;
          this.isAirborne = false;
          this.chassis.vAngle *= 0.35;
        }
      }
    }

    this.lastAngle = this.chassis.angle;

    // Move chassis position
    this.chassis.x += this.chassis.vx * dt;
    this.chassis.y += this.chassis.vy * dt;

    // Wheel rotation locked to velocity
    const wheelOmega = this.chassis.vx / R;
    this.rearWheel.omega = wheelOmega;
    this.frontWheel.omega = wheelOmega;
    this.rearWheel.angle += wheelOmega * dt;
    this.frontWheel.angle += wheelOmega * dt;

    // 6. Driver Bill Head Bobbing
    const headWorld = this.localToWorld(this.driverHead.relX, this.driverHead.relY);
    this.driverHead.x = headWorld.x;
    this.driverHead.y = headWorld.y;

    const targetBob = Math.max(-0.22, Math.min(0.22,
      -this.chassis.vAngle * 0.28 +
      (input.gas ? -0.06 : 0) +
      (input.brake ? 0.06 : 0)
    ));
    this.driverHead.bobAngle += (targetBob - this.driverHead.bobAngle) * 0.14;

    // 7. Crash detection: Player dies whenever Bill's head or car roof strikes the ground!
    if (this.timeAlive > 0.15) {
      const headR = this.driverHead.radius || 12;
      const headGY = terrain.getHeight(headWorld.x);

      // 1. Bill's head touches the ground
      const headStrikes = (headWorld.y + headR >= headGY);

      // 2. Roll cage / vehicle roof strikes ground when tilted/flipped
      const roofApex = this.localToWorld(0, -34);
      const roofGY = terrain.getHeight(roofApex.x);
      const isTilted = downY < 0.65; // tilted beyond ~50°
      const roofStrikes = isTilted && (roofApex.y >= roofGY);

      if (headStrikes || roofStrikes) {
        this.crashed = true;
        this.crashReason = 'DRIVER DOWN!';
        // Snap Bill's head back in crash reaction
        this.driverHead.bobAngle = (this.chassis.vAngle > 0 ? 0.95 : -0.95);
        if (window.soundSystem) window.soundSystem.playCrash();
        return;
      }
    }

    // 8. Collectibles & Sound
    this.checkCollectiblePickups(terrain);

    const curSpeed = Math.abs(this.chassis.vx);
    const rpmRatio = Math.min(1.0, (curSpeed / 400) + (input.gas && this.fuel > 0 ? 0.40 : 0.05));
    window.soundSystem.updateEngine(input.gas && this.fuel > 0, rpmRatio, Math.abs(this.chassis.vx));

    if (input.brake && this.chassis.vx > 180 && anyGrounded) {
      window.soundSystem.playTireSqueal();
    }

    if (this.fuel < 15 && this.fuel > 0) {
      window.soundSystem.playLowFuelWarning();
    }

    terrain.ensureGenerated(this.chassis.x + 2200);
  }

  updateCrashed(dt, terrain) {
    this.chassis.vy += 850 * dt;
    this.chassis.x += this.chassis.vx * dt;
    this.chassis.y += this.chassis.vy * dt;
    this.chassis.angle += this.chassis.vAngle * dt;
    this.chassis.vx *= 0.98;
    this.chassis.vAngle *= 0.95;

    const groundY = terrain.getHeight(this.chassis.x);
    if (this.chassis.y > groundY - 12) {
      this.chassis.y = groundY - 12;
      this.chassis.vy = -this.chassis.vy * 0.25;
      this.chassis.vx *= 0.7;
    }

    const cosA = Math.cos(this.chassis.angle);
    const sinA = Math.sin(this.chassis.angle);
    const downX = -sinA;
    const downY = cosA;
    const halfW = this.config.wheelBase * 0.5;
    const rAnchor = this.localToWorld(-halfW, 4);
    const fAnchor = this.localToWorld(halfW, 4);

    this.rearWheel.x = rAnchor.x + this.config.rideHeight * downX;
    this.rearWheel.y = rAnchor.y + this.config.rideHeight * downY;
    this.frontWheel.x = fAnchor.x + this.config.rideHeight * downX;
    this.frontWheel.y = fAnchor.y + this.config.rideHeight * downY;

    this.rearWheel.angle += (this.chassis.vx / this.config.wheelRadius) * dt;
    this.frontWheel.angle += (this.chassis.vx / this.config.wheelRadius) * dt;
  }

  evaluateLandedStunts() {
    const fullFlips = Math.round(this.totalAirRotation / (Math.PI * 2));
    if (window.gameInstance && window.gameInstance.triggerStunt) {
      if (fullFlips >= 1) {
        window.gameInstance.triggerStunt('FRONT FLIP!', 1000 * fullFlips);
      } else if (fullFlips <= -1) {
        window.gameInstance.triggerStunt('BACKFLIP!', 1000 * Math.abs(fullFlips));
      } else if (this.airTime > 1.2) {
        window.gameInstance.triggerStunt(`AIR TIME ${this.airTime.toFixed(1)}s!`, Math.floor(this.airTime * 350));
      }
    }
  }

  checkCollectiblePickups(terrain) {
    const pickupRadius = 48;
    for (const item of terrain.collectibles) {
      if (item.collected) continue;

      const dist = Math.hypot(this.chassis.x - item.x, this.chassis.y - item.y);
      if (dist < pickupRadius + item.radius) {
        item.collected = true;
        if (item.type === 'coin') {
          if (window.soundSystem) window.soundSystem.playCoin();
          if (window.gameInstance && window.gameInstance.addCoins) window.gameInstance.addCoins(item.value || 50);
        } else if (item.type === 'diamond') {
          if (window.soundSystem) window.soundSystem.playDiamond();
          if (window.gameInstance && window.gameInstance.addDiamond) window.gameInstance.addDiamond(item.value || 1);
          if (window.gameInstance && window.gameInstance.showStuntBanner) window.gameInstance.showStuntBanner('💎 DIAMOND!', '+1 DIAMOND  +500 COINS');
        } else if (item.type === 'fuel') {
          if (window.soundSystem) window.soundSystem.playFuel();
          this.fuel = 100.0;
          this.outOfFuel = false;
          this.stoppedOutOfFuelTimer = 0;
          if (window.gameInstance && window.gameInstance.showStuntBanner) window.gameInstance.showStuntBanner('⛽ FUEL TANK!', '+100% FUEL');
        }
      }
    }
  }
}
