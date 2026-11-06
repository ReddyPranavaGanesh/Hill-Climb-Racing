// Hill Climb Racing - Infinite Procedural Terrain & Collectibles System v4
// Deterministic Hills, Mileage Signs, Procedural Vegetation, Clean Spread-Out Collectibles

// Polyfill for roundRect on older browser engines
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    if (typeof r === 'number') {
      r = Math.min(r, w / 2, h / 2);
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    }
    return this;
  };
}

class Terrain {
  constructor() {
    this.reset();
  }

  reset() {
    this.seed = Math.floor(Math.random() * 100000);
    this.collectibles = []; // Coins, Diamonds & Fuel cans
    this.bridges = [];      // Dynamic suspension bridges
    this.chunkSize = 650;
    this.generatedUpToX = -400;
    this.lastFuelX = -100;
    this.lastCoinX = 200;
    this.lastDiamondX = 400;

    // Generate initial terrain and items for the first 2800px
    this.ensureGenerated(2800);
  }

  // Smooth continuous height function y = f(x)
  // Baseline start at y = 450
  getBaseHeight(x) {
    if (x < 100) {
      return 450;
    }

    const dist = x - 100;
    // Hermite smoothstep transition from flat starting line into undulating hills
    const blend = Math.min(1.0, dist / 260);
    const smooth = blend * blend * (3 - 2 * blend);

    const difficulty = Math.min(1.5, 1.0 + dist / 9000);

    // Large rolling hills
    const h1 = Math.sin(dist * 0.0020) * 135 * difficulty;
    // Medium hills & valleys
    const h2 = Math.sin(dist * 0.0052) * 60 * difficulty;
    // Small bumps & dips
    const h3 = (Math.cos(dist * 0.0105) - 1) * 18;
    // Gentle long-wave plateau swells
    const h4 = Math.sin(dist * 0.00075) * 65;

    return 450 + (h1 + h2 + h3 + h4) * smooth;
  }

  getBridgeAt(x) {
    for (const b of this.bridges) {
      if (x >= b.startX && x <= b.endX) {
        return b;
      }
    }
    return null;
  }

  getHeight(x) {
    const bridge = this.getBridgeAt(x);
    if (bridge) {
      return bridge.getHeight(x);
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
    return {
      x: dx / len,
      y: dy / len
    };
  }

  getSlopeAngle(x) {
    const delta = 4.0;
    const y1 = this.getHeight(x - delta);
    const y2 = this.getHeight(x + delta);
    return Math.atan2(y2 - y1, delta * 2);
  }

  ensureGenerated(targetX) {
    while (this.generatedUpToX < targetX + 1600) {
      const startX = this.generatedUpToX;
      const endX = startX + this.chunkSize;
      this.generateChunk(startX, endX);
      this.generatedUpToX = endX;
    }
  }

  // Check if position is safe from other collectibles
  isFarFromCollectibles(x, minDist = 140) {
    return !this.collectibles.some(c => Math.abs(c.x - x) < minDist && !c.collected);
  }

  generateChunk(startX, endX) {
    // 1. Suspension Bridges beyond 700m
    if (startX > 1100 && Math.random() < 0.22 && !this.bridges.some(b => Math.abs(b.startX - startX) < 1000)) {
      const bLen = 240 + Math.random() * 140;
      this.bridges.push(new SuspensionBridge(startX + 100, startX + 100 + bLen, this));
    }

    // 2. FUEL CANISTERS (Isolated every ~1500 - 1900px / ~150-190m)
    if (startX - this.lastFuelX > 1500 + Math.random() * 400) {
      const fuelX = startX + 220 + Math.random() * 100;
      if (this.isFarFromCollectibles(fuelX, 180)) {
        const fuelY = this.getHeight(fuelX) - 38;
        this.collectibles.push({
          type: 'fuel',
          x: fuelX,
          y: fuelY,
          radius: 20,
          collected: false
        });
        this.lastFuelX = fuelX;
      }
    }

    // 3. DIAMONDS (Very rare gems on peaks every ~1800 - 2600px)
    if (startX - this.lastDiamondX > 1800 + Math.random() * 800) {
      const diaX = startX + 350 + Math.random() * 120;
      if (this.isFarFromCollectibles(diaX, 220)) {
        const groundY = this.getHeight(diaX);
        const diaY = groundY - 55 - Math.random() * 30;
        this.collectibles.push({
          type: 'diamond',
          x: diaX,
          y: diaY,
          value: 1, // 1 Diamond (also awards bonus +500 coins)
          radius: 18,
          collected: false,
          animOffset: Math.random() * Math.PI * 2
        });
        this.lastDiamondX = diaX;
      }
    }

    // 4. COIN ARCS (Reduced availability: spaced 850 - 1300px apart, 2 to 3 coins per group)
    if (startX - this.lastCoinX > 850 + Math.random() * 450) {
      const arcStartX = startX + 140;
      const numCoins = 2 + Math.floor(Math.random() * 2); // 2 or 3 coins only (scarcity)
      const coinSpacing = 55; // Spread out

      let isSafe = true;
      for (let i = 0; i < numCoins; i++) {
        if (!this.isFarFromCollectibles(arcStartX + i * coinSpacing, 130)) {
          isSafe = false;
          break;
        }
      }

      if (isSafe) {
        const isAirArc = Math.random() < 0.40;
        // Deterministic coin tier
        const tierRoll = Math.random();
        const baseVal = tierRoll < 0.50 ? 25 : (tierRoll < 0.85 ? 50 : 100);

        for (let i = 0; i < numCoins; i++) {
          const cx = arcStartX + i * coinSpacing;
          const groundY = this.getHeight(cx);
          const arcLift = isAirArc ? Math.sin((i / (numCoins - 1 || 1)) * Math.PI) * 40 : 0;
          const cy = groundY - 34 - arcLift;
          const coinVal = (i === numCoins - 1 && Math.random() < 0.25) ? baseVal * 2 : baseVal;

          this.collectibles.push({
            type: 'coin',
            x: cx,
            y: cy,
            value: coinVal,
            radius: coinVal >= 100 ? 16 : 14,
            collected: false,
            animOffset: Math.random() * Math.PI * 2
          });
        }
        this.lastCoinX = arcStartX + numCoins * coinSpacing;
      }
    }
  }

  update(dt, chassis) {
    const mockVehicle = chassis ? {
      rearWheel: { x: chassis.x - 38, y: chassis.y + 26 },
      frontWheel: { x: chassis.x + 38, y: chassis.y + 26 }
    } : null;

    this.bridges.forEach(b => b.update(dt, mockVehicle));

    if (chassis) {
      const cutoff = chassis.x - 2200;
      this.collectibles = this.collectibles.filter(c => c.x > cutoff && !c.collected);
      this.bridges = this.bridges.filter(b => b.endX > cutoff);
    }
  }

  // Draw full terrain with fixed static landmarks
  draw(ctx, camera, viewportWidth, viewportHeight) {
    const leftX = camera.x - 200;
    const rightX = camera.x + viewportWidth + 200;
    const step = 8;

    // 1. Draw Ground Body (Dirt + Bedrock strata)
    ctx.save();
    ctx.beginPath();

    const startX = Math.floor(leftX / step) * step;
    ctx.moveTo(startX, this.getHeight(startX));

    for (let x = startX; x <= rightX; x += step) {
      ctx.lineTo(x, this.getHeight(x));
    }

    const groundBottom = camera.y + viewportHeight + 450;
    ctx.lineTo(rightX, groundBottom);
    ctx.lineTo(startX, groundBottom);
    ctx.closePath();

    // Fixed world earth gradient
    const groundGrad = ctx.createLinearGradient(0, 350, 0, 1100);
    groundGrad.addColorStop(0, '#593922');
    groundGrad.addColorStop(0.25, '#3d2514');
    groundGrad.addColorStop(0.75, '#25170d');
    groundGrad.addColorStop(1.0, '#150d07');
    ctx.fillStyle = groundGrad;
    ctx.fill();

    // 2. Embedded Rock Strata (Fixed at world coordinates)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const firstPebbleX = Math.floor(leftX / 90) * 90;
    for (let x = firstPebbleX; x <= rightX; x += 90) {
      const gy = this.getHeight(x);
      ctx.beginPath();
      ctx.ellipse(x + 25, gy + 45, 14, 6, 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.ellipse(x + 70, gy + 95, 20, 8, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Lush Green Grass Surface Ribbon
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#27ae60';
    ctx.beginPath();
    ctx.moveTo(startX, this.getHeight(startX));
    for (let x = startX; x <= rightX; x += step) {
      ctx.lineTo(x, this.getHeight(x));
    }
    ctx.stroke();

    // Vibrant grass rim highlight
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = '#2ecc71';
    ctx.stroke();

    // 3.5 Decorative Grass Tufts along the surface
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    const firstTuftX = Math.floor(leftX / 35) * 35;
    for (let x = firstTuftX; x <= rightX; x += 35) {
      const gy = this.getHeight(x);
      ctx.beginPath();
      ctx.moveTo(x, gy - 2);
      ctx.lineTo(x - 3, gy - 9);
      ctx.moveTo(x + 3, gy - 2);
      ctx.lineTo(x + 5, gy - 11);
      ctx.stroke();
    }

    ctx.restore();

    // 4. Draw Start Line Gate & Banner at 0m
    if (leftX <= 90 && rightX >= -90) {
      this.drawStartLine(ctx);
    }

    // 5. Draw Static World Landmarks (Distance signs, Trees, Fences)
    // THESE DEFINITIVELY PROVE THE CAR IS DRIVING FORWARD!
    this.drawWorldLandmarks(ctx, leftX, rightX);

    // 6. Draw Dynamic Bridges
    this.bridges.forEach(b => {
      if (b.endX >= leftX && b.startX <= rightX) {
        b.draw(ctx);
      }
    });

    // 7. Draw Collectibles (Coins, Diamonds, Fuel Jerrycans)
    this.drawCollectibles(ctx, leftX, rightX);
  }

  // Draw Distance Signposts (Every 50 meters = 500px in world) & Trees/Fences
  drawWorldLandmarks(ctx, leftX, rightX) {
    ctx.save();

    // --- Distance Marker Signs (Every 50m = 500px) ---
    const firstSign = Math.max(1, Math.floor(leftX / 500));
    const lastSign = Math.floor(rightX / 500);

    for (let i = firstSign; i <= lastSign; i++) {
      const signX = i * 500;
      const meters = i * 50;
      const groundY = this.getHeight(signX);

      // Wooden post
      ctx.fillStyle = '#7f5539';
      ctx.fillRect(signX - 3, groundY - 42, 6, 42);

      // Signboard
      ctx.fillStyle = '#f1c40f'; // Golden yellow sign
      ctx.beginPath();
      ctx.roundRect(signX - 22, groundY - 60, 44, 20, 4);
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#d68910';
      ctx.stroke();

      // Sign text: "50m", "100m", etc.
      ctx.fillStyle = '#2c3e50';
      ctx.font = '900 11px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${meters}m`, signX, groundY - 49);
    }

    // --- Procedural Trees & Bushes along the countryside ---
    // Deterministic placement every ~320px
    const firstTreeIndex = Math.floor(leftX / 320);
    const lastTreeIndex = Math.floor(rightX / 320);

    for (let i = firstTreeIndex; i <= lastTreeIndex; i++) {
      const treeX = i * 320 + 75;
      if (treeX < 120) continue; // Keep start line clear

      const groundY = this.getHeight(treeX);
      const isPine = (i % 2 === 0);

      if (isPine) {
        // Pine Tree
        // Trunk
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(treeX - 4, groundY - 48, 8, 48);

        // 3 Pine Foliage Layers
        ctx.fillStyle = '#1e824c';
        ctx.beginPath();
        ctx.moveTo(treeX, groundY - 80);
        ctx.lineTo(treeX + 18, groundY - 50);
        ctx.lineTo(treeX - 18, groundY - 50);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#26a65b';
        ctx.beginPath();
        ctx.moveTo(treeX, groundY - 65);
        ctx.lineTo(treeX + 22, groundY - 35);
        ctx.lineTo(treeX - 22, groundY - 35);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.moveTo(treeX, groundY - 50);
        ctx.lineTo(treeX + 26, groundY - 20);
        ctx.lineTo(treeX - 26, groundY - 20);
        ctx.closePath();
        ctx.fill();
      } else {
        // Leafy Deciduous Tree / Bush
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(treeX - 3, groundY - 36, 6, 36);

        // Green foliage puff
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(treeX, groundY - 44, 20, 0, Math.PI * 2);
        ctx.arc(treeX - 10, groundY - 36, 14, 0, Math.PI * 2);
        ctx.arc(treeX + 10, groundY - 36, 14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawStartLine(ctx) {
    ctx.save();
    const groundY = this.getHeight(0);

    // Checkered finish line on ground
    const checkSize = 7;
    for (let row = 0; row < 2; row++) {
      for (let col = -5; col <= 5; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#1e272e';
        ctx.fillRect(col * checkSize, groundY - 2 + row * checkSize, checkSize, checkSize);
      }
    }

    // Steel Banner Posts
    const postHeight = 92;
    ctx.fillStyle = '#7f8c8d';
    ctx.fillRect(-42, groundY - postHeight, 6, postHeight);
    ctx.fillRect(42, groundY - postHeight, 6, postHeight);

    // Overhead START Banner
    ctx.fillStyle = '#27ae60';
    ctx.beginPath();
    ctx.roundRect(-50, groundY - postHeight - 26, 100, 26, 6);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Text: START
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🏁 START', 0, groundY - postHeight - 13);

    ctx.restore();
  }

  drawCollectibles(ctx, leftX, rightX) {
    const time = Date.now() * 0.005;

    for (const item of this.collectibles) {
      if (item.x < leftX || item.x > rightX || item.collected) continue;

      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.type === 'coin') {
        const scaleX = Math.cos(time + item.animOffset);
        ctx.scale(Math.abs(scaleX) * 0.85 + 0.15, 1.0);

        // Coin Outer Rim
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

        // Stamped Numerical Coin Value (Requirement 2)
        const valStr = String(item.value || 50);
        ctx.fillStyle = item.value >= 100 ? '#7e5109' : '#936a08';
        ctx.font = valStr.length >= 3 ? '900 8.5px Nunito, sans-serif' : '900 10.5px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(valStr, 0, 1);

      } else if (item.type === 'diamond') {
        // Floating Diamond Animation
        const bob = Math.sin(time * 0.9 + item.animOffset) * 6;
        ctx.translate(0, bob);

        // Radiant diamond pulse
        const scaleX = Math.cos(time * 1.6 + item.animOffset);
        ctx.scale(Math.abs(scaleX) * 0.75 + 0.25, 1.0);

        // Diamond cut polygon
        ctx.beginPath();
        ctx.moveTo(0, -16);   // top center
        ctx.lineTo(16, -6);   // top right
        ctx.lineTo(12, 5);    // mid right
        ctx.lineTo(0, 17);    // bottom tip
        ctx.lineTo(-12, 5);   // mid left
        ctx.lineTo(-16, -6);  // top left
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

        // Facets
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-16, -6); ctx.lineTo(16, -6);
        ctx.moveTo(-8, -6);  ctx.lineTo(0, 17);
        ctx.moveTo(8, -6);   ctx.lineTo(0, 17);
        ctx.moveTo(0, -16);  ctx.lineTo(0, 17);
        ctx.stroke();

        // Shimmer star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -8, 2.5, 0, Math.PI * 2);
        ctx.fill();

      } else if (item.type === 'fuel') {
        const bob = Math.sin(time * 0.8) * 4;
        ctx.translate(0, bob);

        // Glow ring behind fuel
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.fill();

        // Canister Body
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.roundRect(-16, -22, 32, 40, 5);
        ctx.fill();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = '#c0392b';
        ctx.stroke();

        // Handle & Cap
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(-10, -29, 20, 7);
        ctx.fillStyle = '#bdc3c7';
        ctx.fillRect(7, -33, 7, 7);

        // Label GAS
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAS', 0, -3);

        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(0, 8, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

// Dynamic Wooden Suspension Bridge
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
      this.nodes.push({
        x: x,
        baseY: baseY,
        y: baseY,
        vy: 0
      });
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
    const kSpring = 120;
    const damping = 0.90;

    for (let i = 1; i < this.nodes.length - 1; i++) {
      const node = this.nodes[i];
      const leftY = this.nodes[i - 1].y;
      const rightY = this.nodes[i + 1].y;
      const avgNeighborY = (leftY + rightY) * 0.5;

      const forceY = (avgNeighborY - node.y) * kSpring * 0.5 + (node.baseY - node.y) * 45;
      node.vy += forceY * dt;

      if (vehicle) {
        [vehicle.rearWheel, vehicle.frontWheel].forEach(w => {
          const dist = Math.abs(w.x - node.x);
          if (dist < 35 && Math.abs(w.y - node.y) < 40) {
            node.vy += 380 * (1 - dist / 35) * dt;
          }
        });
      }

      node.vy *= damping;
      node.y += node.vy * dt;
    }
  }

  draw(ctx) {
    ctx.save();

    // Suspension cables
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.nodes[0].y - 25);
    for (let i = 1; i < this.nodes.length; i++) {
      ctx.lineTo(this.nodes[i].x, this.nodes[i].y - 25);
    }
    ctx.stroke();

    // Vertical ropes
    ctx.strokeStyle = 'rgba(127, 140, 141, 0.6)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < this.nodes.length; i += 2) {
      ctx.beginPath();
      ctx.moveTo(this.nodes[i].x, this.nodes[i].y - 25);
      ctx.lineTo(this.nodes[i].x, this.nodes[i].y);
      ctx.stroke();
    }

    // Wooden Planks
    for (let i = 0; i < this.numPlanks; i++) {
      const n1 = this.nodes[i];
      const n2 = this.nodes[i + 1];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const angle = Math.atan2(dy, dx);

      ctx.save();
      ctx.translate(n1.x, n1.y);
      ctx.rotate(angle);

      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(0, -4, Math.hypot(dx, dy) - 2, 8);

      ctx.fillStyle = '#a06535';
      ctx.fillRect(0, -4, Math.hypot(dx, dy) - 2, 2);

      ctx.restore();
    }

    ctx.restore();
  }
}
