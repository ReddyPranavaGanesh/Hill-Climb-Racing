// Hill Climb Racing - Vehicle Roster & Procedural Vector Renderers
// 4 Distinct Vehicles: Hill Climber, Monster Truck, Dune Buggy, and Motocross

const VEHICLE_DEFS = {
  jeep: {
    id: 'jeep',
    name: 'Hill Climber',
    desc: 'The iconic 4x4 Jeep with balanced suspension and reliable hill climbing.',
    price: 0,
    config: {
      wheelBase: 78,
      wheelRadius: 18,
      rideHeight: 28,
      chassisMass: 80,
      enginePower: 480,
      brakeTorque: 850,
      airControlTorque: 11.5,
      fourWheelDrive: 0.65,
      maxSpeed: 700,
      suspensionStiffness: 200,
      suspensionDamping: 26,
      angularStiffness: 180,
      angularDamping: 28
    },
    drawChassis(ctx, physics) {
      // 1. Red Jeep Body Tub
      ctx.fillStyle = '#e74c3c';
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
      ctx.strokeStyle = '#c0392b';
      ctx.stroke();

      // Side Fender Flare
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(-45, 6, 20, 6);
      ctx.fillRect(25, 6, 20, 6);

      // Yellow Headlight
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.arc(46, 2, 5, -Math.PI * 0.5, Math.PI * 0.5);
      ctx.fill();

      // Roll Cage Bars (Black tubing)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#2d3436';
      ctx.beginPath();
      ctx.moveTo(-24, -18);
      ctx.lineTo(-14, -38);
      ctx.lineTo(10, -38);
      ctx.lineTo(18, -18);
      ctx.stroke();

      // Diagonal cross brace
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, -38);
      ctx.lineTo(14, -18);
      ctx.stroke();

      // Spare Tire on Back
      ctx.fillStyle = '#1e272e';
      ctx.beginPath();
      ctx.ellipse(-48, -4, 8, 14, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  monster: {
    id: 'monster',
    name: 'Monster Truck',
    desc: 'Massive monster tires, high clearance, and immense suspension travel.',
    price: 15000,
    config: {
      wheelBase: 88,
      wheelRadius: 26,
      rideHeight: 38,
      chassisMass: 120,
      enginePower: 620,
      brakeTorque: 780,
      airControlTorque: 10.0,
      fourWheelDrive: 1.0,
      maxSpeed: 750,
      suspensionStiffness: 250,
      suspensionDamping: 32,
      angularStiffness: 160,
      angularDamping: 26
    },
    drawChassis(ctx, physics) {
      // Monster Truck Raised Pickup Body (Electric Blue)
      ctx.fillStyle = '#0984e3';
      ctx.beginPath();
      ctx.moveTo(-52, 10);
      ctx.lineTo(52, 10);
      ctx.lineTo(54, -6);
      ctx.lineTo(18, -6);
      ctx.lineTo(8, -26);
      ctx.lineTo(-30, -26);
      ctx.lineTo(-52, -6);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0652dd';
      ctx.stroke();

      // Flame decal
      ctx.fillStyle = '#f1c40f';
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(20, -2);
      ctx.lineTo(35, 2);
      ctx.lineTo(0, 5);
      ctx.fill();

      // Heavy Duty Chrome Rollbar with Roof Floodlights
      ctx.strokeStyle = '#dfe6e9';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-28, -26);
      ctx.lineTo(-24, -42);
      ctx.lineTo(4, -42);
      ctx.lineTo(8, -26);
      ctx.stroke();

      // 3 Roof Lights
      ctx.fillStyle = '#ffeaa7';
      for (let i = -18; i <= -2; i += 8) {
        ctx.beginPath();
        ctx.arc(i, -44, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  buggy: {
    id: 'buggy',
    name: 'Dune Buggy',
    desc: 'Lightweight sand buggy with rear engine, extreme agility, and top speed.',
    price: 35000,
    config: {
      wheelBase: 76,
      wheelRadius: 17,
      rideHeight: 25,
      chassisMass: 55,
      enginePower: 540,
      brakeTorque: 700,
      airControlTorque: 14.0,
      fourWheelDrive: 0.35,
      maxSpeed: 850,
      suspensionStiffness: 180,
      suspensionDamping: 22,
      angularStiffness: 200,
      angularDamping: 30
    },
    drawChassis(ctx, physics) {
      // Exposed tubular roll cage (Lime Green / Neon)
      ctx.strokeStyle = '#2ed573';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-44, 10);
      ctx.lineTo(42, 10);
      ctx.lineTo(38, -2);
      ctx.lineTo(6, -26);
      ctx.lineTo(-22, -26);
      ctx.lineTo(-44, 10);
      ctx.stroke();

      // Lower frame belly pan
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(-40, 4, 80, 7);

      // Rear engine block with twin exhaust pipes
      ctx.fillStyle = '#747d8c';
      ctx.fillRect(-48, -12, 12, 16);
      ctx.strokeStyle = '#a4b0be';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-48, -4);
      ctx.lineTo(-58, -12);
      ctx.stroke();

      // Rear racing spoiler
      ctx.fillStyle = '#2ed573';
      ctx.fillRect(-52, -28, 16, 4);
      ctx.strokeStyle = '#2f3542';
      ctx.lineWidth = 2;
      ctx.strokeRect(-52, -28, 16, 4);
      ctx.beginPath();
      ctx.moveTo(-44, -24);
      ctx.lineTo(-44, -12);
      ctx.stroke();
    }
  },

  bike: {
    id: 'bike',
    name: 'Motocross Bike',
    desc: 'Lightweight dirt bike. High air mobility for insane stunts and backflips!',
    price: 75000,
    config: {
      wheelBase: 60,
      wheelRadius: 16,
      rideHeight: 24,
      chassisMass: 40,
      enginePower: 420,
      brakeTorque: 580,
      airControlTorque: 16.5,
      fourWheelDrive: 0.0,
      maxSpeed: 750,
      suspensionStiffness: 160,
      suspensionDamping: 20,
      angularStiffness: 220,
      angularDamping: 32
    },
    drawChassis(ctx, physics) {
      // Motocross frame (Vibrant Orange KTM style)
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-28, 6);
      ctx.lineTo(0, -12);
      ctx.lineTo(28, 6);
      ctx.stroke();

      // Fuel Tank & Seat
      ctx.fillStyle = '#ff4757';
      ctx.beginPath();
      ctx.ellipse(4, -14, 18, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Black seat cushion
      ctx.fillStyle = '#2f3542';
      ctx.fillRect(-18, -19, 20, 5);

      // Handlebars
      ctx.strokeStyle = '#57606f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, -15);
      ctx.lineTo(19, -28);
      ctx.stroke();
      ctx.fillStyle = '#1e272e';
      ctx.fillRect(16, -30, 8, 4);
    }
  }
};

// Driver Bill Renderer with bobbing neck and animated cap
function drawDriverBill(ctx, driverHead, physics) {
  ctx.save();
  ctx.translate(driverHead.relX, driverHead.relY);
  ctx.rotate(driverHead.bobAngle);

  // Driver Torso (Green flannel / shirt)
  ctx.fillStyle = '#27ae60';
  ctx.fillRect(-8, 10, 16, 20);

  // Seatbelt strap
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.lineTo(8, 28);
  ctx.stroke();

  // Neck
  ctx.fillStyle = '#f5cd79';
  ctx.fillRect(-4, 4, 8, 8);

  // Face / Head circle
  ctx.beginPath();
  ctx.arc(0, 0, driverHead.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f5cd79';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#e77f67';
  ctx.stroke();

  // Eyes (Wide open or blink/squint on high speed)
  const isScared = physics.isAirborne || physics.crashed;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(4, -2, isScared ? 4 : 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e272e';
  ctx.beginPath();
  ctx.arc(5, -2, isScared ? 1.5 : 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.strokeStyle = '#303952';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isScared) {
    ctx.moveTo(1, -7);
    ctx.lineTo(8, -5);
  } else {
    ctx.moveTo(1, -6);
    ctx.lineTo(8, -6);
  }
  ctx.stroke();

  // Mouth (smile or scream)
  ctx.fillStyle = '#ea8685';
  ctx.beginPath();
  if (isScared) {
    ctx.arc(4, 5, 4, 0, Math.PI); // Open screaming mouth!
  } else {
    ctx.arc(3, 4, 3, 0, Math.PI); // Happy smile
  }
  ctx.fill();

  // Red Cap (Iconic Hill Climb trucker hat)
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath();
  ctx.arc(0, -3, 13, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();

  // Cap Visor / Brim
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.ellipse(8, -6, 10, 3, 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// Procedural Wheel Renderer with realistic tire treads & silver alloys
function drawWheel(ctx, wheel) {
  ctx.save();
  ctx.translate(wheel.x, wheel.y);
  ctx.rotate(wheel.angle);

  const r = wheel.radius;

  // Outer black rubber tire
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#1e272e';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0f1418';
  ctx.stroke();

  // Tire Treads
  const treads = 8;
  ctx.strokeStyle = '#3d4650';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < treads; i++) {
    const a = (i / treads) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r - 4), Math.sin(a) * (r - 4));
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }

  // Silver Rim / Alloy
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = '#ced6e0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#747d8c';
  ctx.stroke();

  // Rim Spokes
  ctx.strokeStyle = '#57606f';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * (r * 0.52), Math.sin(a) * (r * 0.52));
    ctx.stroke();
  }

  // Center hub nut
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#e74c3c';
  ctx.fill();

  ctx.restore();
}

// Draw spring coil suspension strut
function drawSuspensionStrut(ctx, anchorWorld, wheel) {
  ctx.save();
  const dx = wheel.x - anchorWorld.x;
  const dy = wheel.y - anchorWorld.y;
  const dist = Math.hypot(dx, dy) || 1;
  const angle = Math.atan2(dy, dx);

  ctx.translate(anchorWorld.x, anchorWorld.y);
  ctx.rotate(angle);

  // Shock absorber damper cylinder
  ctx.fillStyle = '#747d8c';
  ctx.fillRect(0, -3, dist * 0.45, 6);

  // Coil Spring zigzag
  ctx.strokeStyle = '#ffa502';
  ctx.lineWidth = 2.5;
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
    const yOff = (i % 2 === 0 ? 6 : -6);
    ctx.lineTo(xMid, yOff);
    ctx.lineTo(xNext, 0);
  }
  ctx.lineTo(dist, 0);
  ctx.stroke();

  ctx.restore();
}
