// Hill Climb Racing - Vehicle Roster & Procedural Vector Renderers v2
// 7 Distinct Vehicles: Hill Climber, Monster Truck, Dune Buggy, Motocross, Rally Car, Big Rig, and Battle Tank!
// Realistic physics, smooth air flips, suspension coils, driver Bill with fluttering scarf and headlights.

const VEHICLE_DEFS = {
  jeep: {
    id: 'jeep',
    name: 'Hill Climber',
    desc: 'The iconic 4x4 Jeep with balanced suspension and reliable hill climbing.',
    price: 0,
    headlightOffset: { x: 46, y: -2 },
    config: {
      wheelBase: 78,
      wheelRadius: 18,
      rideHeight: 28,
      chassisMass: 85,
      enginePower: 520,
      brakeTorque: 900,
      airControlTorque: 4.2, // Smoothed for realistic, non-dizzying flips (Req 3)
      fourWheelDrive: 0.65,
      maxSpeed: 720,
      suspensionStiffness: 210,
      suspensionDamping: 28,
      angularStiffness: 180,
      angularDamping: 30
    },
    drawChassis(ctx, physics) {
      // 1. Red Jeep Body Tub with Metallic Gloss
      const bodyGrad = ctx.createLinearGradient(-45, -20, 45, 12);
      bodyGrad.addColorStop(0, '#e74c3c');
      bodyGrad.addColorStop(0.5, '#ff6b6b');
      bodyGrad.addColorStop(1, '#c0392b');
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(-45, 12);
      ctx.lineTo(45, 12);
      ctx.lineTo(48, -2);
      ctx.lineTo(24, -4);
      ctx.lineTo(16, -18);
      ctx.lineTo(-24, -18);
      ctx.lineTo(-44, -4);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#962d22';
      ctx.stroke();

      // Top Highlight Rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-23, -17);
      ctx.lineTo(15, -17);
      ctx.stroke();

      // Side Fender Flares
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-45, 6, 20, 6);
      ctx.fillRect(25, 6, 20, 6);

      // Yellow Headlight
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(46, -2, 5, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();
      ctx.strokeStyle = '#d68910';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Roll Cage Bars (Heavy black tubular steel)
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#2d3436';
      ctx.beginPath();
      ctx.moveTo(-24, -18);
      ctx.lineTo(-14, -38);
      ctx.lineTo(10, -38);
      ctx.lineTo(18, -18);
      ctx.stroke();

      // Diagonal cross brace
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-14, -38);
      ctx.lineTo(14, -18);
      ctx.stroke();

      // Spare Tire on Back
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.ellipse(-48, -4, 8, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d4650';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  },

  bike: {
    id: 'bike',
    name: 'Motocross Bike',
    desc: 'Lightweight and ultra agile. Perform incredible stunts and glide over crests.',
    price: 15000,
    headlightOffset: { x: 38, y: -22 },
    config: {
      wheelBase: 68,
      wheelRadius: 17,
      rideHeight: 25,
      chassisMass: 55,
      enginePower: 490,
      brakeTorque: 950,
      airControlTorque: 5.2, // Quick agile stunt rotation (Req 3)
      fourWheelDrive: 0.15,
      maxSpeed: 780,
      suspensionStiffness: 220,
      suspensionDamping: 26,
      angularStiffness: 220,
      angularDamping: 32
    },
    drawChassis(ctx, physics) {
      // Tubular Steel Bike Frame (Kawasaki Racing Green)
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#2ed573';
      ctx.beginPath();
      ctx.moveTo(-32, 8);
      ctx.lineTo(-8, -12);
      ctx.lineTo(18, -12);
      ctx.lineTo(34, -22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(0, 8);
      ctx.lineTo(24, 8);
      ctx.lineTo(18, -12);
      ctx.stroke();

      // Gas Tank & Plastics
      ctx.fillStyle = '#2ed573';
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(18, -12);
      ctx.lineTo(14, -20);
      ctx.lineTo(-2, -20);
      ctx.closePath();
      ctx.fill();

      // Racing Number 7 Plate
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, -18, 12, 10);
      ctx.fillStyle = '#1e272e';
      ctx.font = '900 8px Nunito, sans-serif';
      ctx.fillText('7', 8, -10);

      // Black Padded Seat
      ctx.fillStyle = '#2f3542';
      ctx.beginPath();
      ctx.ellipse(-14, -14, 12, 4, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Chrome Exhaust Pipe
      ctx.strokeStyle = '#ced6e0';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.quadraticCurveTo(-18, 6, -30, -6);
      ctx.stroke();

      // Handlebars
      ctx.strokeStyle = '#747d8c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, -26);
      ctx.lineTo(36, -30);
      ctx.stroke();
    }
  },

  monster: {
    id: 'monster',
    name: 'Monster Truck',
    desc: 'Massive monster tires, high clearance, and immense suspension travel.',
    price: 35000,
    headlightOffset: { x: 50, y: -4 },
    config: {
      wheelBase: 92,
      wheelRadius: 28,
      rideHeight: 40,
      chassisMass: 130,
      enginePower: 680,
      brakeTorque: 950,
      airControlTorque: 3.6, // Heavy truck flips with smooth momentum (Req 3)
      fourWheelDrive: 1.0,
      maxSpeed: 760,
      suspensionStiffness: 270,
      suspensionDamping: 34,
      angularStiffness: 170,
      angularDamping: 28
    },
    drawChassis(ctx, physics) {
      // Heavy Truck Chassis Tube Frame
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-44, 18); ctx.lineTo(44, 18);
      ctx.moveTo(-25, 18); ctx.lineTo(-10, 4); ctx.lineTo(25, 18);
      ctx.stroke();

      // Electric Blue Pickup Cab
      const truckGrad = ctx.createLinearGradient(-48, -25, 48, 12);
      truckGrad.addColorStop(0, '#0984e3');
      truckGrad.addColorStop(0.5, '#74b9ff');
      truckGrad.addColorStop(1, '#0652dd');
      ctx.fillStyle = truckGrad;

      ctx.beginPath();
      ctx.moveTo(-46, 12);
      ctx.lineTo(48, 12);
      ctx.lineTo(50, -4);
      ctx.lineTo(26, -6);
      ctx.lineTo(16, -26);
      ctx.lineTo(-24, -26);
      ctx.lineTo(-44, -4);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#0652dd';
      ctx.stroke();

      // Flame Decal along side
      ctx.fillStyle = '#ffa502';
      ctx.beginPath();
      ctx.moveTo(10, 2);
      ctx.lineTo(36, 2);
      ctx.lineTo(20, -4);
      ctx.lineTo(30, -6);
      ctx.lineTo(2, -6);
      ctx.closePath();
      ctx.fill();

      // Quad Roof Fog Lights
      ctx.fillStyle = '#f1c40f';
      for (let i = -16; i <= 14; i += 10) {
        ctx.beginPath();
        ctx.arc(i, -28, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Chrome Heavy Bumpers
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(-52, 6, 8, 10);
      ctx.fillRect(44, 6, 8, 10);
    }
  },

  buggy: {
    id: 'buggy',
    name: 'Dune Buggy',
    desc: 'Rear-engine sand rails with wide wheelbase. Glides over sandy dunes.',
    price: 65000,
    headlightOffset: { x: 42, y: -4 },
    config: {
      wheelBase: 84,
      wheelRadius: 19,
      rideHeight: 26,
      chassisMass: 75,
      enginePower: 580,
      brakeTorque: 950,
      airControlTorque: 4.6,
      fourWheelDrive: 0.35,
      maxSpeed: 820,
      suspensionStiffness: 230,
      suspensionDamping: 28,
      angularStiffness: 200,
      angularDamping: 32
    },
    drawChassis(ctx, physics) {
      // Welded Tubular Spaceframe (Bright Orange)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#e67e22';
      ctx.beginPath();
      ctx.moveTo(-46, 8);
      ctx.lineTo(44, 8);
      ctx.lineTo(38, -6);
      ctx.lineTo(14, -8);
      ctx.lineTo(2, -32);
      ctx.lineTo(-24, -32);
      ctx.lineTo(-46, 8);
      ctx.stroke();

      // Interior Roof Cross Tubes
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-24, -32); ctx.lineTo(14, -8);
      ctx.moveTo(2, -32);   ctx.lineTo(-24, 0);
      ctx.stroke();

      // Side Paneling
      ctx.fillStyle = '#d35400';
      ctx.beginPath();
      ctx.moveTo(-26, 6);
      ctx.lineTo(28, 6);
      ctx.lineTo(20, -6);
      ctx.lineTo(-20, -6);
      ctx.closePath();
      ctx.fill();

      // Exposed Chrome V6 Engine Block with Air Filter
      ctx.fillStyle = '#95a5a6';
      ctx.fillRect(-46, -14, 18, 14);
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(-37, -18, 5, 0, Math.PI * 2);
      ctx.fill();

      // Rear Dune Flag on Flex Antenna
      ctx.strokeStyle = '#bdc3c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-44, -30);
      ctx.lineTo(-50, -56);
      ctx.stroke();
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.moveTo(-50, -56); ctx.lineTo(-64, -50); ctx.lineTo(-50, -44);
      ctx.fill();
    }
  },

  rally: {
    id: 'rally',
    name: 'Rally Car',
    desc: 'Aerodynamic turbo racer with front splitter, rear spoiler, and blazing top speed.',
    price: 110000,
    headlightOffset: { x: 48, y: -2 },
    config: {
      wheelBase: 80,
      wheelRadius: 18,
      rideHeight: 24,
      chassisMass: 88,
      enginePower: 690,
      brakeTorque: 1100,
      airControlTorque: 4.4,
      fourWheelDrive: 0.85,
      maxSpeed: 920,
      suspensionStiffness: 240,
      suspensionDamping: 30,
      angularStiffness: 210,
      angularDamping: 32
    },
    drawChassis(ctx, physics) {
      // Aerodynamic Rally Body (Bright Yellow with Racing Stripes)
      const rallyGrad = ctx.createLinearGradient(-48, -22, 48, 10);
      rallyGrad.addColorStop(0, '#f1c40f');
      rallyGrad.addColorStop(0.5, '#f39c12');
      rallyGrad.addColorStop(1, '#d68910');
      ctx.fillStyle = rallyGrad;

      ctx.beginPath();
      ctx.moveTo(-48, 10);
      ctx.lineTo(48, 10);
      ctx.lineTo(50, 0);
      ctx.lineTo(34, -4);
      ctx.lineTo(18, -22);
      ctx.lineTo(-24, -22);
      ctx.lineTo(-44, -2);
      ctx.lineTo(-48, 10);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#b7950b';
      ctx.stroke();

      // Bold Racing Stripe (Midnight Blue)
      ctx.fillStyle = '#1e3799';
      ctx.beginPath();
      ctx.moveTo(34, -4);
      ctx.lineTo(18, -22);
      ctx.lineTo(6, -22);
      ctx.lineTo(24, -4);
      ctx.closePath();
      ctx.fill();

      // Front Aero Splitter
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(42, 6, 12, 4);

      // Tinted Cockpit Windows
      ctx.fillStyle = 'rgba(47, 53, 66, 0.85)';
      ctx.beginPath();
      ctx.moveTo(16, -20);
      ctx.lineTo(30, -5);
      ctx.lineTo(-18, -5);
      ctx.lineTo(-20, -20);
      ctx.closePath();
      ctx.fill();

      // Roof Air Scoop
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(-4, -26, 14, 5);

      // Elevated GT Rear Wing Spoiler
      ctx.strokeStyle = '#1e272e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-44, -2); ctx.lineTo(-48, -22);
      ctx.stroke();
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-54, -24, 18, 5);

      // Dual Quad Exhaust Pipes with heat bluing
      ctx.fillStyle = '#747d8c';
      ctx.fillRect(-52, 4, 6, 5);
    }
  },

  truck: {
    id: 'truck',
    name: 'Big Rig Semi',
    desc: 'Heavy commercial semi-truck. Twin vertical chrome exhaust pipes and massive torque.',
    price: 160000,
    headlightOffset: { x: 50, y: 0 },
    config: {
      wheelBase: 96,
      wheelRadius: 24,
      rideHeight: 32,
      chassisMass: 160,
      enginePower: 820,
      brakeTorque: 1200,
      airControlTorque: 3.2,
      fourWheelDrive: 0.90,
      maxSpeed: 740,
      suspensionStiffness: 280,
      suspensionDamping: 36,
      angularStiffness: 170,
      angularDamping: 32
    },
    drawChassis(ctx, physics) {
      // Heavy Steel Truck Frame
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(-48, 8, 96, 8);

      // Crimson Cab Body
      const cabGrad = ctx.createLinearGradient(0, -38, 48, 12);
      cabGrad.addColorStop(0, '#c0392b');
      cabGrad.addColorStop(1, '#78281f');
      ctx.fillStyle = cabGrad;

      // Front Big Rig Snout & Hood
      ctx.beginPath();
      ctx.moveTo(48, 8);
      ctx.lineTo(48, -12);
      ctx.lineTo(16, -14);
      ctx.lineTo(16, -38);
      ctx.lineTo(-18, -38);
      ctx.lineTo(-18, 8);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#512e2e';
      ctx.stroke();

      // Chrome Front Grille with slats
      ctx.fillStyle = '#dfe4ea';
      ctx.fillRect(44, -10, 6, 18);
      ctx.strokeStyle = '#747d8c';
      ctx.lineWidth = 1;
      for (let y = -8; y <= 6; y += 3) {
        ctx.beginPath(); ctx.moveTo(44, y); ctx.lineTo(50, y); ctx.stroke();
      }

      // Windshield & Sunvisor
      ctx.fillStyle = '#74b9ff';
      ctx.fillRect(10, -34, 8, 16);
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(6, -38, 14, 4);

      // Twin Chrome Exhaust Stacks
      ctx.fillStyle = '#ced6e0';
      ctx.fillRect(-2, -48, 5, 34);
      ctx.fillRect(-8, -48, 5, 34);
      // Curved Tips
      ctx.strokeStyle = '#ced6e0';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -48); ctx.lineTo(-4, -54);
      ctx.moveTo(-6, -48); ctx.lineTo(-10, -54);
      ctx.stroke();

      // Fifth Wheel Hitch on rear
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(-42, 2, 20, 6);
    }
  },

  tank: {
    id: 'tank',
    name: 'Battle Tank',
    desc: 'Armored treads and a rotating 120mm cannon. Unstoppable climbing torque and massive weight.',
    price: 220000,
    headlightOffset: { x: 44, y: -2 },
    config: {
      wheelBase: 90,
      wheelRadius: 22,
      rideHeight: 28,
      chassisMass: 220,
      enginePower: 920,
      brakeTorque: 1400,
      airControlTorque: 2.8,
      fourWheelDrive: 1.0,
      maxSpeed: 680,
      suspensionStiffness: 320,
      suspensionDamping: 40,
      angularStiffness: 190,
      angularDamping: 36
    },
    drawChassis(ctx, physics) {
      // Military Olive-Drab Armored Hull
      ctx.fillStyle = '#4b6584';
      ctx.beginPath();
      ctx.moveTo(-52, 12);
      ctx.lineTo(52, 12);
      ctx.lineTo(46, -4);
      ctx.lineTo(-44, -4);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Upper Armor Hull Plate
      ctx.fillStyle = '#3867d6';
      ctx.beginPath();
      ctx.moveTo(-40, -4);
      ctx.lineTo(40, -4);
      ctx.lineTo(34, -18);
      ctx.lineTo(-34, -18);
      ctx.closePath();
      ctx.fill();

      // Revolving Gun Turret
      ctx.fillStyle = '#2b580c';
      ctx.beginPath();
      ctx.ellipse(-4, -22, 20, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e3308';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Commander Cupola
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.arc(-10, -28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Long 120mm Cannon Barrel with Muzzle Brake
      ctx.fillStyle = '#2b580c';
      ctx.fillRect(8, -25, 48, 5);
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(52, -27, 8, 9); // Muzzle brake

      // Continuous Track Tread Skirt
      ctx.strokeStyle = '#2d3436';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(-50, 4, 100, 10);
    }
  }
};

// Procedural Driver Bill with animated facial expressions, helmet/hat, and wind-fluttering scarf
function drawDriverBill(ctx, head, status = {}) {
  const isAirborne = status.isAirborne || false;
  const isCrashed = status.crashed || false;
  const speed = status.speed || 0;
  const isScared = isAirborne || isCrashed;

  ctx.save();
  ctx.translate(head.relX, head.relY);
  ctx.rotate(head.bobAngle || 0);

  // Animated Fluttering Scarf / Bandana trailing behind in the wind (Req 1)
  const time = Date.now() * 0.015;
  const wave1 = Math.sin(time) * 4;
  const wave2 = Math.cos(time * 1.4) * 6;
  const scarfLen = Math.min(32, 14 + (speed / 30));

  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.quadraticCurveTo(-12 - scarfLen * 0.5, 14 + wave1, -8 - scarfLen, 12 + wave2);
  ctx.stroke();

  // Torso / Blue Jean Overalls
  ctx.fillStyle = '#2980b9';
  ctx.beginPath();
  ctx.moveTo(-10, 14);
  ctx.lineTo(10, 14);
  ctx.lineTo(8, 28);
  ctx.lineTo(-8, 28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1b4f72';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Red Flannel Shirt Arms
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(-10, 18, 4, 8, 0.4, 0, Math.PI * 2);
  ctx.ellipse(10, 18, 4, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Animated Hands on Steering Wheel
  ctx.strokeStyle = '#1e272e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(14, 14, 8, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();

  // Head Base (Skin Tone)
  ctx.fillStyle = '#f5cd79';
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#cf6a87';
  ctx.stroke();

  // Eyes (Big animated cartoony eyes)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, -2, isScared ? 5 : 4, 0, Math.PI * 2);
  ctx.fill();

  // Pupils
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  const pupilX = isScared ? 4 : (status.isAirborne ? 3 : 5);
  const pupilY = isScared ? -3 : -2;
  ctx.arc(pupilX, pupilY, isScared ? 2 : 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows (Scared raised, or determined driving)
  ctx.strokeStyle = '#303952';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isScared) {
    ctx.moveTo(1, -7); ctx.lineTo(8, -5);
  } else {
    ctx.moveTo(1, -6); ctx.lineTo(8, -6);
  }
  ctx.stroke();

  // Mouth (smile, scream, or crash tongue)
  if (isCrashed) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-2, 4); ctx.lineTo(4, 4);
    ctx.stroke();
    // Tongue sticking out
    ctx.fillStyle = '#ff7675';
    ctx.beginPath();
    ctx.arc(2, 6, 3, 0, Math.PI);
    ctx.fill();
  } else if (isScared) {
    ctx.fillStyle = '#ea8685';
    ctx.beginPath();
    ctx.arc(4, 5, 4, 0, Math.PI); // Open screaming mouth!
    ctx.fill();
  } else {
    ctx.fillStyle = '#ea8685';
    ctx.beginPath();
    ctx.arc(3, 4, 3, 0, Math.PI); // Confident smile
    ctx.fill();
  }

  // Red Cap (Iconic Hill Climb trucker hat)
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(0, -3, 13, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();

  // Cap Visor / Brim with shading
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(8, -6, 11, 3.5, 0.22, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Procedural Wheel Renderer with deep rubber treads, alloy rims, and disc brakes
function drawWheel(ctx, wheel) {
  ctx.save();
  ctx.translate(wheel.x, wheel.y);
  ctx.rotate(wheel.angle);

  const r = wheel.radius;

  // Outer black rubber tire with gradient shadow
  const tireGrad = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r);
  tireGrad.addColorStop(0, '#2c3437');
  tireGrad.addColorStop(1, '#111618');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = tireGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#050708';
  ctx.stroke();

  // Deep Traction Treads
  const treads = 10;
  ctx.strokeStyle = '#3d4650';
  ctx.lineWidth = 2.8;
  for (let i = 0; i < treads; i++) {
    const a = (i / treads) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }

  // Silver Disc Brake Rotor inside rim
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = '#b2bec3';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#636e72';
  ctx.stroke();

  // Sporty Rim Spokes
  ctx.strokeStyle = '#dfe4ea';
  ctx.lineWidth = 2.8;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (r * 0.52), Math.sin(a) * (r * 0.52));
    ctx.stroke();
  }

  // Center Hub Nut
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();

  ctx.restore();
}

// Draw spring coil suspension strut with hydraulic cylinder
function drawSuspensionStrut(ctx, anchorWorld, wheel) {
  ctx.save();
  const dx = wheel.x - anchorWorld.x;
  const dy = wheel.y - anchorWorld.y;
  const dist = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);

  ctx.translate(anchorWorld.x, anchorWorld.y);
  ctx.rotate(angle);

  // Chrome hydraulic inner shaft
  ctx.fillStyle = '#ced6e0';
  ctx.fillRect(0, -2, dist, 4);

  // Shock absorber damper cylinder
  ctx.fillStyle = '#2f3542';
  ctx.fillRect(0, -4, dist * 0.45, 8);
  ctx.strokeStyle = '#747d8c';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, -4, dist * 0.45, 8);

  // Coil Spring zigzag with metallic shine
  ctx.strokeStyle = '#ffa502';
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  const coils = 6;
  const coilStart = dist * 0.15;
  const coilEnd = dist * 0.85;
  const coilLen = coilEnd - coilStart;
  ctx.moveTo(0, 0);
  ctx.lineTo(coilStart, 0);

  for (let i = 0; i < coils; i++) {
    const xMid = coilStart + ((i + 0.5) / coils) * coilLen;
    const xNext = coilStart + ((i + 1) / coils) * coilLen;
    const yOff = (i % 2 === 0 ? 7 : -7);
    ctx.lineTo(xMid, yOff);
    ctx.lineTo(xNext, 0);
  }
  ctx.lineTo(dist, 0);
  ctx.stroke();

  ctx.restore();
}
