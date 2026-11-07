// Hill Climb Racing - Procedural Terrain, Multi-Map System, Dynamic Weather & Functional Suspension Bridges v2
// 5 Unique Worlds: Countryside, Desert, Arctic Snow, Highway, and The Moon (Low Gravity!)
// Dynamic 1-Minute Weather Cycle: Sunny, Thunderstorm, Sunset, Blizzard, Starry Night
// Functional Bridges over deep chasms/ravines!

const MAP_DEFS = {
  countryside: {
    id: 'countryside',
    name: 'Countryside',
    desc: 'Lush green rolling hills with peaceful oak trees and wooden fences.',
    price: 0,
    gravityMult: 1.0,
    frictionMult: 1.0,
    surfaceGrassColor: '#2ed573',
    surfaceGrassEdge: '#26af5f',
    dirtTopColor: '#795548',
    dirtBottomColor: '#3e2723',
    skyTop: '#4a90e2',
    skyBottom: '#a8d8ea',
    mountainColor: '#204729',
    hillsColor: '#2e7d32',
    landmark: 'tree'
  },
  desert: {
    id: 'desert',
    name: 'Desert Dunes',
    desc: 'Rolling golden sand dunes, rocky mesas, and giant saguaro cacti.',
    price: 20000,
    gravityMult: 1.0,
    frictionMult: 0.92,
    surfaceGrassColor: '#f5cd79',
    surfaceGrassEdge: '#e58e26',
    dirtTopColor: '#e58e26',
    dirtBottomColor: '#871c1c',
    skyTop: '#e67e22',
    skyBottom: '#f8c291',
    mountainColor: '#78281f',
    hillsColor: '#b71540',
    landmark: 'cactus'
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic Snow',
    desc: 'Frozen mountain passes, snowdrifts, and icy slopes. Watch your traction!',
    price: 45000,
    gravityMult: 1.0,
    frictionMult: 0.74, // Low friction ice drifting!
    surfaceGrassColor: '#ffffff',
    surfaceGrassEdge: '#dff9fb',
    dirtTopColor: '#74b9ff',
    dirtBottomColor: '#0984e3',
    skyTop: '#2980b9',
    skyBottom: '#c7ecee',
    mountainColor: '#4b6584',
    hillsColor: '#487eb0',
    landmark: 'pine'
  },
  highway: {
    id: 'highway',
    name: 'Highway',
    desc: 'Smooth asphalt speedway with lane markings and bridges. High-speed racing!',
    price: 80000,
    gravityMult: 1.0,
    frictionMult: 1.25, // High grip asphalt
    surfaceGrassColor: '#2f3542',
    surfaceGrassEdge: '#57606f',
    dirtTopColor: '#1e272e',
    dirtBottomColor: '#0c1017',
    skyTop: '#34495e',
    skyBottom: '#bdc3c7',
    mountainColor: '#1e272e',
    hillsColor: '#2f3542',
    landmark: 'lightpost'
  },
  moon: {
    id: 'moon',
    name: 'The Moon',
    desc: 'Low lunar gravity (0.35x)! Massive floaty jumps and cosmic stunt air-time.',
    price: 125000,
    gravityMult: 0.35, // Low lunar gravity! (Req 2 & 7)
    frictionMult: 0.88,
    surfaceGrassColor: '#d2dae2',
    surfaceGrassEdge: '#808e9b',
    dirtTopColor: '#718093',
    dirtBottomColor: '#1e272e',
    skyTop: '#05050f',
    skyBottom: '#0b0c1b',
    mountainColor: '#11141a',
    hillsColor: '#2d3436',
    landmark: 'crater'
  }
};

const WEATHER_TYPES = ['sunny', 'rain', 'sunset', 'snow', 'night'];

class Terrain {
  constructor(mapId = 'countryside') {
    this.mapId = mapId;
    this.reset();
  }

  setMap(mapId) {
    if (MAP_DEFS[mapId]) {
      this.mapId = mapId;
      this.reset();
    }
  }

  get mapConfig() {
    return MAP_DEFS[this.mapId] || MAP_DEFS.countryside;
  }

  reset() {
    this.seed = Math.floor(Math.random() * 100000);
    this.collectibles = [];
    this.bridges = [];
    this.chunkSize = 650;
    this.generatedUpToX = -400;
    this.lastFuelX = -100;
    this.lastCoinX = 200;
    this.lastDiamondX = 400;

    // Weather System (Requirement 9: Changes every 60s)
    this.weatherIndex = 0;
    this.weatherTimer = 0;
    this.weatherDuration = 60.0; // Exactly 1 minute per weather
    this.lightningFlash = 0;
    this.nextLightningTimer = 8 + Math.random() * 8;

    // Rain & Snow Particles
    this.particles = [];
    this.initWeatherParticles();

    // Initial terrain generation
    this.ensureGenerated(3200);
  }

  initWeatherParticles() {
    this.rainDrops = [];
    for (let i = 0; i < 90; i++) {
      this.rainDrops.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        len: 14 + Math.random() * 10,
        speed: 700 + Math.random() * 300
      });
    }

    this.snowFlakes = [];
    for (let i = 0; i < 75; i++) {
      this.snowFlakes.push({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        radius: 1.5 + Math.random() * 2.5,
        speedY: 60 + Math.random() * 70,
        speedX: -20 + Math.random() * 40,
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  // Smooth continuous height function y = f(x)
  getBaseHeight(x) {
    if (x < 100) return 450;

    const dist = x - 100;
    const blend = Math.min(1.0, dist / 260);
    const smooth = blend * blend * (3 - 2 * blend);

    const difficulty = Math.min(1.6, 1.0 + dist / 9000);

    // Map-specific terrain profiling
    let h1, h2, h3, h4;
    if (this.mapId === 'desert') {
      // Sweeping tall dunes with sharp crests
      h1 = Math.sin(dist * 0.0016) * 160 * difficulty;
      h2 = (Math.cos(dist * 0.0038) - 0.5) * 80 * difficulty;
      h3 = Math.sin(dist * 0.008) * 20;
      h4 = Math.sin(dist * 0.0006) * 70;
    } else if (this.mapId === 'highway') {
      // Fast, gentle highway inclines
      h1 = Math.sin(dist * 0.0012) * 80 * difficulty;
      h2 = Math.sin(dist * 0.0035) * 35;
      h3 = (Math.cos(dist * 0.008) - 1) * 8;
      h4 = Math.sin(dist * 0.0005) * 50;
    } else if (this.mapId === 'moon') {
      // Craters and sharp steep rims
      h1 = Math.sin(dist * 0.0018) * 140 * difficulty;
      h2 = Math.sin(dist * 0.0055) * 75 * difficulty;
      h3 = Math.cos(dist * 0.012) * 25;
      h4 = Math.sin(dist * 0.0007) * 80;
    } else {
      // Countryside & Arctic rolling hills
      h1 = Math.sin(dist * 0.0020) * 135 * difficulty;
      h2 = Math.sin(dist * 0.0052) * 60 * difficulty;
      h3 = (Math.cos(dist * 0.0105) - 1) * 18;
      h4 = Math.sin(dist * 0.00075) * 65;
    }

    return 450 + (h1 + h2 + h3 + h4) * smooth;
  }

  // Find bridge spanning position x
  getBridgeAt(x) {
    for (const b of this.bridges) {
      if (x >= b.startX && x <= b.endX) {
        return b;
      }
    }
    return null;
  }

  // Actual Ground Surface underneath (including deep chasms under bridges! Requirement 8)
  getGroundSurface(x) {
    const bridge = this.getBridgeAt(x);
    if (bridge) {
      // Functional Canyon Ravine under Bridge!
      const t = (x - bridge.startX) / bridge.length;
      // Chasm drops 140px to 190px below the deck!
      const chasmDrop = Math.sin(t * Math.PI) * 165;
      const deckBaseY = bridge.yStart + t * (bridge.yEnd - bridge.yStart);
      return deckBaseY + chasmDrop;
    }
    return this.getBaseHeight(x);
  }

  // Driving surface height (if on bridge, return flexible plank height; else ground height)
  getHeight(x, vehicleY = null) {
    const bridge = this.getBridgeAt(x);
    if (bridge) {
      const bridgeH = bridge.getHeight(x);
      // If vehicle is riding across bridge deck
      if (vehicleY === null || vehicleY < bridgeH + 35) {
        return bridgeH;
      }
      // If car plunged into the ravine, it hits the canyon ground floor
      return this.getGroundSurface(x);
    }
    return this.getBaseHeight(x);
  }

  getTangent(x) {
    const delta = 3.0;
    const y1 = this.getHeight(x - delta);
    const y2 = this.getHeight(x + delta);
    const dx = delta * 2;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  getSlopeAngle(x) {
    const delta = 4.0;
    const y1 = this.getHeight(x - delta);
    const y2 = this.getHeight(x + delta);
    return Math.atan2(y2 - y1, delta * 2);
  }

  ensureGenerated(targetX) {
    while (this.generatedUpToX < targetX) {
      const nextX = this.generatedUpToX + this.chunkSize;
      this.generateChunk(this.generatedUpToX, nextX);
      this.generatedUpToX = nextX;
    }
  }

  isFarFromCollectibles(x, minDist = 140) {
    return !this.collectibles.some(c => Math.abs(c.x - x) < minDist && !c.collected);
  }

  generateChunk(startX, endX) {
    // 1. Functional Suspension Bridges over Deep Chasms (Requirement 8)
    if (startX > 950 && Math.random() < 0.24 && !this.bridges.some(b => Math.abs(b.startX - startX) < 1100)) {
      const bLen = 260 + Math.random() * 160;
      this.bridges.push(new SuspensionBridge(startX + 120, startX + 120 + bLen, this));
    }

    // 2. FUEL CANISTERS (Every ~1300 - 1800px / ~130-180m)
    if (startX - this.lastFuelX > 1300 + Math.random() * 400) {
      const fuelX = startX + 220 + Math.random() * 100;
      if (this.isFarFromCollectibles(fuelX, 160)) {
        const fuelY = this.getHeight(fuelX) - 38;
        this.collectibles.push({
          type: 'fuel',
          x: fuelX,
          y: fuelY,
          radius: 18,
          collected: false,
          animOffset: Math.random() * Math.PI
        });
        this.lastFuelX = fuelX;
      }
    }

    // 3. DIAMONDS (Every ~1800 - 2600px)
    if (startX - this.lastDiamondX > 1800 + Math.random() * 700) {
      const diaX = startX + 340 + Math.random() * 120;
      if (this.isFarFromCollectibles(diaX, 140)) {
        const diaY = this.getHeight(diaX) - 45;
        this.collectibles.push({
          type: 'diamond',
          x: diaX,
          y: diaY,
          radius: 16,
          collected: false,
          value: 1,
          animOffset: Math.random() * Math.PI
        });
        this.lastDiamondX = diaX;
      }
    }

    // 4. COIN CLUSTERS (2 - 3 coins per cluster spaced 850 - 1300px)
    if (startX - this.lastCoinX > 850 + Math.random() * 400) {
      const count = 2 + Math.floor(Math.random() * 2);
      const clusterBaseX = startX + 180;
      const coinValues = [25, 50, 100];
      const coinVal = coinValues[Math.floor(Math.random() * coinValues.length)];

      for (let i = 0; i < count; i++) {
        const cx = clusterBaseX + i * 55;
        const cy = this.getHeight(cx) - 32;
        if (this.isFarFromCollectibles(cx, 45)) {
          this.collectibles.push({
            type: 'coin',
            x: cx,
            y: cy,
            radius: 15,
            value: coinVal,
            collected: false,
            animOffset: i * 0.45
          });
        }
      }
      this.lastCoinX = clusterBaseX;
    }
  }

  get currentWeather() {
    return WEATHER_TYPES[this.weatherIndex];
  }

  update(dt, chassis) {
    // 1. Weather Cycle Timer (Requirement 9: changes every 60s)
    this.weatherTimer += dt;
    if (this.weatherTimer >= this.weatherDuration) {
      this.weatherTimer = 0;
      this.weatherIndex = (this.weatherIndex + 1) % WEATHER_TYPES.length;
      const newWeather = this.currentWeather;

      // Notify player via banner
      const weatherTitles = {
        sunny: '☀️ SUNNY & CLEAR',
        rain: '🌧️ THUNDERSTORM',
        sunset: '🌅 GOLDEN SUNSET',
        snow: '❄️ BLIZZARD & SNOW',
        night: '🌙 STARRY NIGHT'
      };
      if (window.gameInstance && window.gameInstance.showWeatherBanner) {
        window.gameInstance.showWeatherBanner(weatherTitles[newWeather] || newWeather.toUpperCase());
      }
      if (newWeather === 'rain' && window.soundSystem) {
        window.soundSystem.playThunder();
      }
    }

    // 2. Lightning Flashes during Rain
    if (this.currentWeather === 'rain') {
      this.nextLightningTimer -= dt;
      if (this.nextLightningTimer <= 0) {
        this.lightningFlash = 1.0;
        this.nextLightningTimer = 7 + Math.random() * 11;
        if (window.soundSystem) window.soundSystem.playThunder();
      }
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 2.8);
    }

    // 3. Update Weather Particle Positions
    if (this.currentWeather === 'rain') {
      for (const drop of this.rainDrops) {
        drop.y += drop.speed * dt;
        drop.x -= 240 * dt; // Angled storm wind
        if (drop.y > 900) { drop.y = -20; drop.x = Math.random() * 1600; }
        if (drop.x < 0) { drop.x = 1600; }
      }
    } else if (this.currentWeather === 'snow') {
      const time = Date.now() * 0.002;
      for (const flake of this.snowFlakes) {
        flake.y += flake.speedY * dt;
        flake.x += (flake.speedX + Math.sin(time + flake.swayPhase) * 20) * dt;
        if (flake.y > 900) { flake.y = -10; flake.x = Math.random() * 1600; }
        if (flake.x < 0) { flake.x = 1600; }
      }
    }

    // 4. Bridges physics update
    const mockVehicle = chassis ? {
      rearWheel: { x: chassis.x - 38, y: chassis.y + 26 },
      frontWheel: { x: chassis.x + 38, y: chassis.y + 26 }
    } : null;

    this.bridges.forEach(b => b.update(dt, mockVehicle));

    // 5. Procedural generation ahead & cleanup behind
    if (chassis) {
      this.ensureGenerated(chassis.x + 2600);
      const cutoff = chassis.x - 2200;
      this.collectibles = this.collectibles.filter(c => c.x > cutoff && !c.collected);
      this.bridges = this.bridges.filter(b => b.endX > cutoff);
    }
  }

  // Draw full terrain with parallax background, dynamic weather, functional bridges, landmarks & collectibles
  draw(ctx, camera, viewportWidth, viewportHeight, activeVehicle = null) {
    const leftX = camera.x - 200;
    const rightX = camera.x + viewportWidth + 200;
    const step = 8;
    const map = this.mapConfig;

    // 1. Draw Multi-Layer Parallax Mountains & Sky
    this.drawParallaxEnvironment(ctx, camera, viewportWidth, viewportHeight);

    // 2. Draw Ground Body (Dirt + Strata Bands + Deep Chasms under bridges!)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftX, viewportHeight + 500);

    for (let x = leftX; x <= rightX; x += step) {
      ctx.lineTo(x, this.getGroundSurface(x));
    }
    ctx.lineTo(rightX, viewportHeight + 500);
    ctx.closePath();

    const dirtGrad = ctx.createLinearGradient(0, 300, 0, viewportHeight + 400);
    dirtGrad.addColorStop(0, map.dirtTopColor);
    dirtGrad.addColorStop(1, map.dirtBottomColor);
    ctx.fillStyle = dirtGrad;
    ctx.fill();

    // 3. Draw Subsurface Strata Bands for Geological Realism
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    for (let x = leftX; x <= rightX; x += step * 2) {
      const gy = this.getGroundSurface(x) + 40;
      if (x === leftX) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    for (let x = leftX; x <= rightX; x += step * 2) {
      const gy = this.getGroundSurface(x) + 95;
      if (x === leftX) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
    ctx.stroke();

    // 4. Draw Lush Grass / Surface Top Layer
    ctx.beginPath();
    for (let x = leftX; x <= rightX; x += step) {
      const gy = this.getGroundSurface(x);
      if (x === leftX) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
    ctx.lineWidth = 8;
    ctx.strokeStyle = map.surfaceGrassColor;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    for (let x = leftX; x <= rightX; x += step) {
      const gy = this.getGroundSurface(x);
      if (x === leftX) ctx.moveTo(x, gy);
      else ctx.lineTo(x, gy);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = map.surfaceGrassEdge;
    ctx.stroke();

    ctx.restore();

    // 5. Draw Start Line Gate at 0m
    if (leftX <= 90 && rightX >= -90) {
      this.drawStartLine(ctx);
    }

    // 6. Draw Landmarks (Trees, Cacti, Streetlights, Craters)
    this.drawWorldLandmarks(ctx, leftX, rightX);

    // 7. Draw Functional Bridges suspended over the chasms! (Requirement 8)
    this.bridges.forEach(b => {
      if (b.endX >= leftX && b.startX <= rightX) {
        b.draw(ctx);
      }
    });

    // 8. Draw Collectibles (Coins with numerical values, Diamonds, Fuel Jerrycans)
    this.drawCollectibles(ctx, leftX, rightX);

    // 9. Draw Dynamic Weather Effects (Rain, Snow, Lightning) (Requirement 9)
    this.drawWeatherEffects(ctx, viewportWidth, viewportHeight);

    // 10. Draw Vehicle Headlight Beam illumination during dark weathers
    if (activeVehicle && (this.currentWeather === 'night' || this.currentWeather === 'sunset' || this.currentWeather === 'rain')) {
      this.drawHeadlightCone(ctx, activeVehicle);
    }
  }

  // Multi-layer Parallax Skies & Mountains
  drawParallaxEnvironment(ctx, camera, viewW, viewH) {
    const map = this.mapConfig;
    const weather = this.currentWeather;

    // Sky colors blended by weather
    let skyTop = map.skyTop;
    let skyBottom = map.skyBottom;

    if (weather === 'rain') {
      skyTop = '#192a3e'; skyBottom = '#334e68';
    } else if (weather === 'sunset') {
      skyTop = '#e15f41'; skyBottom = '#f7d794';
    } else if (weather === 'snow') {
      skyTop = '#57606f'; skyBottom = '#d2dae2';
    } else if (weather === 'night') {
      skyTop = '#0a0d1a'; skyBottom = '#1e2438';
    }

    // Sky gradient
    const sky = ctx.createLinearGradient(0, camera.y, 0, camera.y + viewH);
    sky.addColorStop(0, skyTop);
    sky.addColorStop(1, skyBottom);
    ctx.fillStyle = sky;
    ctx.fillRect(camera.x, camera.y, viewW, viewH);

    // Lightning Flash illumination
    if (this.lightningFlash > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.75})`;
      ctx.fillRect(camera.x, camera.y, viewW, viewH);
    }

    // Night Stars & Moon / Earth in Moon Map
    if (weather === 'night' || this.mapId === 'moon') {
      this.drawCosmicStars(ctx, camera, viewW, viewH);
    }

    // Distant Parallax Mountain Silhouettes (Layer 1: 0.15x scroll)
    ctx.save();
    const p1x = camera.x * 0.15;
    ctx.fillStyle = map.mountainColor;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y + viewH);
    for (let x = camera.x; x <= camera.x + viewW; x += 30) {
      const my = camera.y + viewH * 0.55 + Math.sin((x + p1x) * 0.0018) * 85 + Math.cos((x + p1x) * 0.004) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(camera.x + viewW, camera.y + viewH);
    ctx.closePath();
    ctx.globalAlpha = 0.65;
    ctx.fill();
    ctx.restore();

    // Secondary Parallax Hills (Layer 2: 0.38x scroll)
    ctx.save();
    const p2x = camera.x * 0.38;
    ctx.fillStyle = map.hillsColor;
    ctx.beginPath();
    ctx.moveTo(camera.x, camera.y + viewH);
    for (let x = camera.x; x <= camera.x + viewW; x += 20) {
      const hy = camera.y + viewH * 0.68 + Math.sin((x + p2x) * 0.0035) * 60 + Math.cos((x + p2x) * 0.008) * 25;
      ctx.lineTo(x, hy);
    }
    ctx.lineTo(camera.x + viewW, camera.y + viewH);
    ctx.closePath();
    ctx.globalAlpha = 0.85;
    ctx.fill();
    ctx.restore();
  }

  // Twinkling Stars & Glowing Moon
  drawCosmicStars(ctx, camera, viewW, viewH) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    const seed = 42;
    for (let i = 0; i < 60; i++) {
      const sx = camera.x + ((i * 137.5) % viewW);
      const sy = camera.y + ((i * 89.3) % (viewH * 0.6));
      const r = (i % 3 === 0) ? 2.0 : 1.2;
      const alpha = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.4;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Moon
    ctx.globalAlpha = 0.95;
    const moonX = camera.x + viewW * 0.82;
    const moonY = camera.y + 110;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#f5f6fa';
    ctx.shadowColor = '#dcdde1';
    ctx.shadowBlur = 24;
    ctx.fill();
    ctx.restore();
  }

  // Draw Dynamic Rain Streaks & Snowflakes (Requirement 9)
  drawWeatherEffects(ctx, viewW, viewH) {
    if (this.currentWeather === 'rain') {
      ctx.save();
      ctx.strokeStyle = 'rgba(200, 225, 255, 0.65)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (const d of this.rainDrops) {
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 7, d.y + d.len);
      }
      ctx.stroke();
      ctx.restore();
    } else if (this.currentWeather === 'snow') {
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (const f of this.snowFlakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  // Vehicle Headlights Beam Projection Cone
  drawHeadlightCone(ctx, vehicle) {
    ctx.save();
    const ch = vehicle.chassis;
    const vDef = VEHICLE_DEFS[vehicle.vehicleId || 'jeep'] || VEHICLE_DEFS.jeep;
    const offset = vDef.headlightOffset || { x: 44, y: 0 };

    const cosA = Math.cos(ch.angle);
    const sinA = Math.sin(ch.angle);
    const lampX = ch.x + offset.x * cosA - offset.y * sinA;
    const lampY = ch.y + offset.x * sinA + offset.y * cosA;

    // Projected Light Cone
    const coneLen = 320;
    const coneSpread = 65;
    const targetX = lampX + cosA * coneLen;
    const targetY = lampY + sinA * coneLen;

    const perpX = -sinA * coneSpread;
    const perpY = cosA * coneSpread;

    const coneGrad = ctx.createRadialGradient(lampX, lampY, 10, targetX, targetY, coneLen);
    coneGrad.addColorStop(0, 'rgba(255, 245, 180, 0.55)');
    coneGrad.addColorStop(0.5, 'rgba(255, 230, 140, 0.25)');
    coneGrad.addColorStop(1, 'rgba(255, 220, 100, 0.0)');

    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(lampX, lampY);
    ctx.lineTo(targetX + perpX, targetY + perpY);
    ctx.lineTo(targetX - perpX, targetY - perpY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw Start Line Banner
  drawStartLine(ctx) {
    const groundY = this.getBaseHeight(0);
    const postHeight = 115;
    const bannerWidth = 120;

    ctx.save();
    ctx.translate(0, 0);

    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(-bannerWidth * 0.5 - 6, groundY - postHeight, 10, postHeight);
    ctx.fillRect(bannerWidth * 0.5 - 4, groundY - postHeight, 10, postHeight);

    ctx.fillStyle = '#dcdde1';
    ctx.fillRect(-bannerWidth * 0.5, groundY - postHeight, bannerWidth, 28);

    const cols = 10;
    const cellW = bannerWidth / cols;
    ctx.fillStyle = '#2f3542';
    for (let c = 0; c < cols; c++) {
      if (c % 2 === 0) {
        ctx.fillRect(-bannerWidth * 0.5 + c * cellW, groundY - postHeight, cellW, 14);
        ctx.fillRect(-bannerWidth * 0.5 + (c + 1) * cellW, groundY - postHeight + 14, cellW, 14);
      }
    }

    ctx.fillStyle = '#e74c3c';
    ctx.font = '900 13px Titan One, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 START', 0, groundY - postHeight - 12);
    ctx.restore();
  }

  // Draw Static World Landmarks
  drawWorldLandmarks(ctx, leftX, rightX) {
    const spacing = 500;
    const firstIndex = Math.floor(leftX / spacing);
    const lastIndex = Math.ceil(rightX / spacing);

    for (let i = firstIndex; i <= lastIndex; i++) {
      const signX = i * spacing;
      if (signX < 200) continue;
      const meters = Math.round(signX / 10);
      const groundY = this.getBaseHeight(signX);

      // Distance Signpost
      ctx.save();
      ctx.translate(signX, groundY);

      ctx.fillStyle = '#57606f';
      ctx.fillRect(-2, -54, 5, 54);

      ctx.fillStyle = '#2ed573';
      ctx.fillRect(-26, -56, 52, 22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(-26, -56, 52, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 12px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${meters}m`, 0, -45);
      ctx.restore();

      // Theme-Specific Landmarks (Trees, Cacti, Pine trees, Streetlights)
      const objX = signX + 220;
      if (objX < rightX) {
        const objY = this.getBaseHeight(objX);
        const lm = this.mapConfig.landmark;
        ctx.save();
        ctx.translate(objX, objY);

        if (lm === 'cactus') {
          // Desert Saguaro Cactus
          ctx.fillStyle = '#2e7d32';
          ctx.fillRect(-5, -60, 10, 60);
          ctx.fillRect(-22, -45, 17, 6);
          ctx.fillRect(-22, -58, 6, 17);
          ctx.fillRect(5, -35, 18, 6);
          ctx.fillRect(17, -48, 6, 17);
        } else if (lm === 'pine') {
          // Snowy Pine Tree
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(-4, -18, 8, 18);
          ctx.fillStyle = '#2c3e50';
          for (let l = 0; l < 3; l++) {
            ctx.beginPath();
            ctx.moveTo(0, -65 + l * 16);
            ctx.lineTo(-24 + l * 4, -40 + l * 16);
            ctx.lineTo(24 - l * 4, -40 + l * 16);
            ctx.closePath();
            ctx.fill();
            // Snow dusting
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-18 + l * 3, -40 + l * 16, 36 - l * 6, 3);
            ctx.fillStyle = '#2c3e50';
          }
        } else if (lm === 'lightpost') {
          // Highway Streetlight
          ctx.strokeStyle = '#747d8c';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(0, -75); ctx.lineTo(16, -85);
          ctx.stroke();
          ctx.fillStyle = '#f1c40f';
          ctx.beginPath(); ctx.arc(16, -85, 5, 0, Math.PI * 2); ctx.fill();
        } else if (lm === 'crater') {
          // Lunar Rocks & Crater
          ctx.fillStyle = '#57606f';
          ctx.beginPath(); ctx.ellipse(0, 0, 24, 6, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          // Countryside Oak Tree
          ctx.fillStyle = '#795548';
          ctx.fillRect(-5, -45, 10, 45);
          ctx.fillStyle = '#27ae60';
          ctx.beginPath();
          ctx.arc(0, -58, 26, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }

  // Draw Collectibles with values stamped on coins
  drawCollectibles(ctx, leftX, rightX) {
    const time = Date.now() * 0.005;

    for (const item of this.collectibles) {
      if (item.x < leftX || item.x > rightX || item.collected) continue;

      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'coin') {
        const scaleX = Math.cos(time + item.animOffset);
        ctx.scale(Math.abs(scaleX) * 0.85 + 0.15, 1.0);

        // Coin Outer Gold Rim
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fillStyle = item.value === 100 ? '#f39c12' : '#f1c40f';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#d68910';
        ctx.stroke();

        // Inner Rim
        ctx.beginPath();
        ctx.arc(0, 0, item.radius * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = item.value >= 100 ? '#f5b041' : '#f9e79f';
        ctx.fill();

        // Stamped Numerical Coin Value
        const valStr = String(item.value || 50);
        ctx.fillStyle = item.value >= 100 ? '#7e5109' : '#936a08';
        ctx.font = valStr.length >= 3 ? '900 8.5px Nunito, sans-serif' : '900 10.5px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valStr, 0, 1);

      } else if (item.type === 'diamond') {
        const bob = Math.sin(time * 0.9 + item.animOffset) * 6;
        ctx.translate(0, bob);
        const scaleX = Math.cos(time * 1.6 + item.animOffset);
        ctx.scale(Math.abs(scaleX) * 0.75 + 0.25, 1.0);

        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(16, -6);
        ctx.lineTo(12, 5);
        ctx.lineTo(0, 17);
        ctx.lineTo(-12, 5);
        ctx.lineTo(-16, -6);
        ctx.closePath();

        const diaGrad = ctx.createLinearGradient(-14, -16, 14, 17);
        diaGrad.addColorStop(0, '#55efc4');
        diaGrad.addColorStop(0.5, '#00cec9');
        diaGrad.addColorStop(1, '#0984e3');
        ctx.fillStyle = diaGrad;
        ctx.fill();

        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

      } else if (item.type === 'fuel') {
        const bob = Math.sin(time * 0.8 + item.animOffset) * 5;
        ctx.translate(0, bob);

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-14, -20, 28, 30);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#c0392b';
        ctx.strokeRect(-14, -20, 28, 30);

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-10, -28, 20, 8);
        ctx.fillRect(7, -33, 7, 7);

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAS', 0, -4);
      }

      ctx.restore();
    }
  }
}

// Functional Suspension Bridge over Deep Chasms (Requirement 8)
class SuspensionBridge {
  constructor(startX, endX, terrainRef) {
    this.startX = startX;
    this.endX = endX;
    this.length = endX - startX;
    this.numPlanks = Math.floor(this.length / 22);
    this.terrain = terrainRef;

    this.yStart = terrainRef.getBaseHeight(startX);
    this.yEnd = terrainRef.getBaseHeight(endX);

    this.nodes = [];
    for (let i = 0; i <= this.numPlanks; i++) {
      const t = i / this.numPlanks;
      const x = this.startX + t * this.length;
      const baseY = this.yStart + t * (this.yEnd - this.yStart);
      this.nodes.push({ x: x, baseY: baseY, y: baseY, vy: 0 });
    }
  }

  getHeight(x) {
    if (x <= this.startX) return this.nodes[0].y;
    if (x >= this.endX) return this.nodes[this.nodes.length - 1].y;

    const t = (x - this.startX) / this.length;
    const index = Math.min(this.numPlanks - 1, Math.floor(t * this.numPlanks));
    const subT = (t * this.numPlanks) - index;

    const n1 = this.nodes[index];
    const n2 = this.nodes[index + 1];
    return n1.y + subT * (n2.y - n1.y);
  }

  update(dt, vehicle) {
    const kSpring = 130;
    const damping = 0.90;

    for (let i = 1; i < this.nodes.length - 1; i++) {
      const node = this.nodes[i];
      const leftY = this.nodes[i - 1].y;
      const rightY = this.nodes[i + 1].y;
      const avgNeighborY = (leftY + rightY) * 0.5;

      const forceY = (avgNeighborY - node.y) * kSpring * 0.5 + (node.baseY - node.y) * 45;
      node.vy += forceY * dt;

      // React to vehicle wheels crossing the bridge deck!
      if (vehicle) {
        [vehicle.rearWheel, vehicle.frontWheel].forEach(w => {
          const dist = Math.abs(w.x - node.x);
          if (dist < 40 && Math.abs(w.y - node.y) < 45) {
            node.vy += 420 * (1 - dist / 40) * dt;
          }
        });
      }

      node.vy *= damping;
      node.y += node.vy * dt;
    }
  }

  draw(ctx) {
    ctx.save();

    // 1. Solid Stone Cliff Pillars at both bridge anchor ends descending into the canyon
    ctx.fillStyle = '#3d3d3d';
    ctx.fillRect(this.startX - 18, this.yStart - 10, 22, 180);
    ctx.fillRect(this.endX - 4, this.yEnd - 10, 22, 180);

    ctx.fillStyle = '#57606f';
    ctx.fillRect(this.startX - 22, this.yStart - 40, 28, 32);
    ctx.fillRect(this.endX - 6, this.yEnd - 40, 28, 32);

    // 2. High Suspension Cables hanging in air across chasm
    ctx.strokeStyle = '#747d8c';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.nodes[0].y - 36);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].x, this.nodes[i].y - 36);
    }
    ctx.stroke();

    // 3. Vertical Suspension Ropes
    ctx.strokeStyle = 'rgba(116, 125, 140, 0.75)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < this.nodes.length; i += 2) {
      ctx.beginPath();
      ctx.moveTo(this.nodes[i].x, this.nodes[i].y - 36);
      ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
      ctx.stroke();
    }

    // 4. Wooden Bridge Deck Planks that flex and react to vehicle weight
    for (let i = 0; i < this.numPlanks; i++) {
      const n1 = this.nodes[i];
      const n2 = this.nodes[i + 1];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(n1.x, n1.y);
      ctx.rotate(angle);

      // Plank body
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, -4, Math.hypot(dx, dy) - 2, 8);

      // Plank wood highlight
      ctx.fillStyle = '#a06535';
      ctx.fillRect(0, -4, Math.hypot(dx, dy) - 2, 2.5);

      // Planks steel rivets
      ctx.fillStyle = '#2d3436';
      ctx.fillRect(2, -2, 2, 2);
      ctx.fillRect(Math.hypot(dx, dy) - 6, -2, 2, 2);

      ctx.restore();
    }

    ctx.restore();
  }
}
