// Hill Climb Racing - Main Game Loop, Camera, Particle System & Upgrades Manager v3
// Complete rewrite: rock-solid camera, proper terrain generation, upgrade system

const MAP_KEYS = ['countryside', 'desert', 'arctic', 'highway', 'moon'];

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.previewCanvas = document.getElementById('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');

    this.homeCanvas = document.getElementById('homePreviewCanvas');
    this.homeCtx = this.homeCanvas ? this.homeCanvas.getContext('2d') : null;
    this.garageSource = 'HOME';

    // State: starts on Home Screen (Requirement 3)
    this.state = 'HOME'; // 'HOME', 'PLAYING', 'PAUSED', 'GAMEOVER', 'GARAGE'
    this.currentVehicleId = 'jeep';
    this.unlockedVehicles = ['jeep'];
    this.coins = 0;
    this.diamonds = 0;
    this.highDistance = 0;
    this.currentDistance = 0;
    this.sessionCoins = 0;
    this.sessionDiamonds = 0;
    this.maxAirTimeSession = 0;

    // Upgrades structure per vehicle (all 7 vehicles)
    this.upgrades = {
      jeep: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      monster: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      buggy: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      bike: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      rally: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      truck: { engine: 0, suspension: 0, tires: 0, stability: 0 },
      tank: { engine: 0, suspension: 0, tires: 0, stability: 0 }
    };

    // Stage & Map System (Requirements 2 & 7)
    this.currentMapId = 'countryside';
    this.unlockedMaps = ['countryside'];
    this.mapRecords = { countryside: 0, desert: 0, arctic: 0, highway: 0, moon: 0 };
    this.selectedHomeStageIndex = 0;
    this.weatherBannerTimeout = null;

    // Load persisted data
    this.loadSaveData();

    // Input States
    this.inputs = {
      gas: false,
      brake: false
    };

    // Camera (will be properly initialized in restartGame)
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      zoom: 1.0,
      targetZoom: 1.0,
      initialized: false
    };

    // Particles (dirt, exhaust, coin sparkles)
    this.particles = [];

    // Background clouds
    this.clouds = [
      { x: 100, y: 80, speed: 12, scale: 1.2 },
      { x: 500, y: 130, speed: 8, scale: 0.9 },
      { x: 950, y: 60, speed: 15, scale: 1.4 },
      { x: 1400, y: 110, speed: 10, scale: 1.0 }
    ];

    // Subsystems
    this.terrain = new Terrain();
    this.physics = new VehiclePhysics(VEHICLE_DEFS[this.currentVehicleId].config);

    // Stunt UI timer
    this.stuntTimeout = null;

    // Bind event listeners & resize
    this.initEvents();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Setup Garage UI
    this.selectedGarageVehicle = this.currentVehicleId;
    this.initGarageUI();

    // Initialize world framing and open Home Screen on startup (Requirement 3)
    this.initGameWorld();
    this.openHome();

    // Start Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadSaveData() {
    try {
      const data = JSON.parse(localStorage.getItem('hcr_save_data_v2'));
      if (data) {
        this.coins = data.coins || 0;
        this.diamonds = data.diamonds || 0;
        this.highDistance = data.highDistance || 0;
        this.currentVehicleId = data.currentVehicleId || 'jeep';
        this.unlockedVehicles = data.unlockedVehicles || ['jeep'];
        this.currentMapId = data.currentMapId || 'countryside';
        this.unlockedMaps = data.unlockedMaps || ['countryside'];
        this.mapRecords = Object.assign({ countryside: 0, desert: 0, arctic: 0, highway: 0, moon: 0 }, data.mapRecords || {});
        if (data.upgrades) {
          for (const vKey of Object.keys(this.upgrades)) {
            if (data.upgrades[vKey]) {
              this.upgrades[vKey] = Object.assign(this.upgrades[vKey], data.upgrades[vKey]);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not load save data', e);
    }
  }

  saveData() {
    try {
      const payload = {
        coins: this.coins,
        diamonds: this.diamonds,
        highDistance: this.highDistance,
        currentVehicleId: this.currentVehicleId,
        unlockedVehicles: this.unlockedVehicles,
        currentMapId: this.currentMapId,
        unlockedMaps: this.unlockedMaps,
        mapRecords: this.mapRecords,
        upgrades: this.upgrades
      };
      localStorage.setItem('hcr_save_data_v2', JSON.stringify(payload));
    } catch (e) {}
  }

  resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.dpr = dpr;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.resetTransform();
    this.ctx.scale(dpr, dpr);
    this.viewWidth = window.innerWidth;
    this.viewHeight = window.innerHeight;
  }

  initEvents() {
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      window.soundSystem.ensureContext();
      if (!window.soundSystem.isEngineRunning && this.state === 'PLAYING') {
        window.soundSystem.startEngine();
      }

      // Gas: Right Arrow, D
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.inputs.gas = true;
        document.getElementById('gasPedal')?.classList.add('pressed');
      }
      // Brake/Reverse: Left Arrow, A
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.inputs.brake = true;
        document.getElementById('brakePedal')?.classList.add('pressed');
      }
      if (e.code === 'KeyR') {
        this.restartGame();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyM') {
        const isMuted = window.soundSystem.toggleMute();
        document.getElementById('audioBtn').textContent = isMuted ? '🔇' : '🔊';
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === 'HOME') {
          this.startGame();
        } else if (this.state === 'GAMEOVER') {
          this.restartGame();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.inputs.gas = false;
        document.getElementById('gasPedal')?.classList.remove('pressed');
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.inputs.brake = false;
        document.getElementById('brakePedal')?.classList.remove('pressed');
      }
    });

    // Mobile & Desktop Touch Pedals Setup
    const brakePedal = document.getElementById('brakePedal');
    const gasPedal = document.getElementById('gasPedal');
    this.brakePointerId = null;
    this.gasPointerId = null;

    const pressBrake = (pointerId) => {
      this.inputs.brake = true;
      this.brakePointerId = pointerId;
      brakePedal?.classList.add('pressed');
      window.soundSystem.ensureContext();
      if (!window.soundSystem.isEngineRunning && this.state === 'PLAYING') {
        window.soundSystem.startEngine();
      }
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    };

    const releaseBrake = () => {
      this.inputs.brake = false;
      this.brakePointerId = null;
      brakePedal?.classList.remove('pressed');
    };

    const pressGas = (pointerId) => {
      this.inputs.gas = true;
      this.gasPointerId = pointerId;
      gasPedal?.classList.add('pressed');
      window.soundSystem.ensureContext();
      if (!window.soundSystem.isEngineRunning && this.state === 'PLAYING') {
        window.soundSystem.startEngine();
      }
      if (navigator.vibrate) try { navigator.vibrate(12); } catch (_) {}
    };

    const releaseGas = () => {
      this.inputs.gas = false;
      this.gasPointerId = null;
      gasPedal?.classList.remove('pressed');
    };

    if (brakePedal) {
      brakePedal.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pressBrake(e.pointerId);
      });
      brakePedal.addEventListener('pointerup', (e) => {
        e.preventDefault();
        releaseBrake();
      });
      brakePedal.addEventListener('pointercancel', releaseBrake);
      brakePedal.addEventListener('pointerleave', releaseBrake);
    }

    if (gasPedal) {
      gasPedal.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pressGas(e.pointerId);
      });
      gasPedal.addEventListener('pointerup', (e) => {
        e.preventDefault();
        releaseGas();
      });
      gasPedal.addEventListener('pointercancel', releaseGas);
      gasPedal.addEventListener('pointerleave', releaseGas);
    }

    // Global window release to handle fast thumb slides off screen
    window.addEventListener('pointerup', (e) => {
      if (e.pointerId === this.brakePointerId) releaseBrake();
      if (e.pointerId === this.gasPointerId) releaseGas();
    });
    window.addEventListener('pointercancel', (e) => {
      if (e.pointerId === this.brakePointerId) releaseBrake();
      if (e.pointerId === this.gasPointerId) releaseGas();
    });

    // Canvas click/touch fallback (left half = brake, right half = gas)
    const handlePointerDown = (e) => {
      if (this.state !== 'PLAYING') return;
      window.soundSystem.ensureContext();
      if (!window.soundSystem.isEngineRunning) window.soundSystem.startEngine();

      const x = e.clientX || (e.touches && e.touches[0].clientX);
      if (x > window.innerWidth * 0.5) {
        pressGas(e.pointerId || 999);
      } else {
        pressBrake(e.pointerId || 998);
      }
    };

    const handlePointerUp = (e) => {
      if (e && e.clientX) {
        if (e.clientX > window.innerWidth * 0.5) releaseGas();
        else releaseBrake();
      } else {
        releaseGas();
        releaseBrake();
      }
    };

    this.canvas.addEventListener('mousedown', handlePointerDown);
    this.canvas.addEventListener('mouseup', handlePointerUp);
    this.canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    this.canvas.addEventListener('touchend', handlePointerUp, { passive: true });

    // Helper for snappy click + touch response on mobile & desktop
    const addFastClick = (elementId, handler) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.addEventListener('click', (e) => {
        handler(e);
      });
      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        handler(e);
      }, { passive: false });
    };

    // UI Buttons with instant touch & click response
    addFastClick('audioBtn', () => {
      const isMuted = window.soundSystem.toggleMute();
      document.getElementById('audioBtn').textContent = isMuted ? '🔇' : '🔊';
    });

    // Home Screen Actions (Requirement 3)
    addFastClick('startPlayBtn', () => this.startGame());
    addFastClick('homePreviewCanvas', () => this.startGame());
    addFastClick('homeGarageBtn', () => this.openGarage('HOME'));
    addFastClick('homePauseBtn', () => this.openHome());
    addFastClick('homeGameOverBtn', () => this.openHome());

    // Mobile Modal Actions
    addFastClick('homeMobileBtn', () => this.openMobileModal());
    addFastClick('closeMobileBtn', () => this.closeMobileModal());
    addFastClick('copyUrlBtn', () => this.copyGameUrl());

    // Stage / Map Selector Actions (Requirements 2 & 7)
    addFastClick('prevStageBtn', () => {
      this.selectedHomeStageIndex = (this.selectedHomeStageIndex - 1 + MAP_KEYS.length) % MAP_KEYS.length;
      this.renderHomeStageSelector();
    });
    addFastClick('nextStageBtn', () => {
      this.selectedHomeStageIndex = (this.selectedHomeStageIndex + 1) % MAP_KEYS.length;
      this.renderHomeStageSelector();
    });

    // In-game & Pause Actions
    addFastClick('pauseBtn', () => this.togglePause());
    addFastClick('resumeBtn', () => this.togglePause());
    addFastClick('restartPauseBtn', () => this.restartGame());
    addFastClick('garagePauseBtn', () => this.openGarage('PAUSE'));

    // Game Over Actions
    addFastClick('retryBtn', () => this.restartGame());
    addFastClick('garageGameOverBtn', () => this.openGarage('GAMEOVER'));

    // Garage Actions
    addFastClick('closeGarageBtn', () => this.closeGarage());
  }

  initGameWorld() {
    this.terrain.setMap(this.currentMapId);
    this.terrain.reset();
    const vDef = VEHICLE_DEFS[this.currentVehicleId];
    this.physics = new VehiclePhysics(vDef.config);

    const startX = 20;
    const startGroundY = this.terrain.getHeight(startX);
    const rideH = vDef.config.rideHeight || 28;
    const wheelR = vDef.config.wheelRadius || 18;
    const startY = startGroundY - wheelR - rideH;

    this.physics.reset(startX, startY);

    const camX = this.physics.chassis.x - this.viewWidth * 0.32;
    const camY = this.physics.chassis.y - this.viewHeight * 0.58;
    this.camera.x = camX;
    this.camera.y = camY;
    this.camera.targetX = camX;
    this.camera.targetY = camY;
    this.camera.zoom = 1.0;
    this.camera.initialized = true;

    // Update HUD stage info
    const stageEl = document.getElementById('stageName');
    if (stageEl && this.terrain.mapConfig) {
      stageEl.textContent = this.terrain.mapConfig.name;
    }
    const recordEl = document.getElementById('recordVal');
    if (recordEl) {
      recordEl.textContent = `Record: ${this.mapRecords[this.currentMapId] || 0} m`;
    }
  }

  updatePedalsVisibility() {
    const pedals = document.getElementById('pedalControls');
    if (!pedals) return;
    if (this.state === 'PLAYING') {
      pedals.classList.remove('hidden');
    } else {
      pedals.classList.add('hidden');
      // Release inputs if modal pops up
      this.inputs.gas = false;
      this.inputs.brake = false;
      document.getElementById('gasPedal')?.classList.remove('pressed');
      document.getElementById('brakePedal')?.classList.remove('pressed');
    }
  }

  openMobileModal() {
    const modal = document.getElementById('mobileModal');
    if (!modal) return;
    const urlInput = document.getElementById('gameUrlInput');
    if (urlInput) {
      if (window.location.protocol.startsWith('http')) {
        urlInput.value = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
      } else {
        urlInput.value = 'https://chan-assets-various-matches.trycloudflare.com';
      }
    }
    modal.classList.remove('hidden');
  }

  closeMobileModal() {
    document.getElementById('mobileModal')?.classList.add('hidden');
  }

  copyGameUrl() {
    const urlInput = document.getElementById('gameUrlInput');
    if (!urlInput) return;
    urlInput.select();
    const btn = document.getElementById('copyUrlBtn');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlInput.value).then(() => {
        if (btn) {
          btn.textContent = 'Copied! ✓';
          setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        }
      }).catch(() => {
        document.execCommand('copy');
        if (btn) {
          btn.textContent = 'Copied! ✓';
          setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
        }
      });
    } else {
      document.execCommand('copy');
      if (btn) {
        btn.textContent = 'Copied! ✓';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      }
    }
  }

  openHome() {
    this.state = 'HOME';
    window.soundSystem.stopEngine();

    document.getElementById('homeMenu').classList.remove('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('garageMenu').classList.add('hidden');
    document.getElementById('mobileModal')?.classList.add('hidden');

    document.getElementById('homeCoins').textContent = this.coins;
    document.getElementById('homeDiamonds').textContent = this.diamonds;
    document.getElementById('homeVehicleName').textContent = VEHICLE_DEFS[this.currentVehicleId].name;

    this.selectedHomeStageIndex = MAP_KEYS.indexOf(this.currentMapId);
    if (this.selectedHomeStageIndex < 0) this.selectedHomeStageIndex = 0;
    this.renderHomeStageSelector();

    this.updatePedalsVisibility();
    this.renderHomeVehiclePreview();
    this.updateHUD();
  }

  renderHomeStageSelector() {
    const mapKey = MAP_KEYS[this.selectedHomeStageIndex];
    const map = MAP_DEFS[mapKey];
    if (!map) return;

    const isUnlocked = this.unlockedMaps.includes(mapKey);
    const isCurrent = this.currentMapId === mapKey;

    const nameEl = document.getElementById('homeStageName');
    const descEl = document.getElementById('homeStageDesc');
    const tagEl = document.getElementById('homeStageTag');
    const specsEl = document.getElementById('homeStageSpecs');
    const actionBtn = document.getElementById('stageActionBtn');

    if (nameEl) nameEl.textContent = map.name;
    if (descEl) descEl.textContent = map.desc;
    if (specsEl) specsEl.innerHTML = `<span>Gravity: ${map.gravityMult}x</span> • <span>Grip: ${Math.round(map.frictionMult * 100)}%</span>`;

    if (tagEl) {
      if (map.price === 0) {
        tagEl.textContent = 'FREE';
        tagEl.className = 'stage-tag free-tag';
      } else if (isUnlocked) {
        tagEl.textContent = 'UNLOCKED';
        tagEl.className = 'stage-tag unlocked-tag';
      } else {
        tagEl.textContent = `🪙 ${map.price.toLocaleString()}`;
        tagEl.className = 'stage-tag locked-tag';
      }
    }

    if (actionBtn) {
      if (!isUnlocked) {
        actionBtn.className = 'btn warning-btn small-btn';
        actionBtn.textContent = `Unlock 🪙 ${map.price.toLocaleString()}`;
        actionBtn.disabled = this.coins < map.price;
        actionBtn.onclick = () => {
          if (this.coins >= map.price) {
            this.coins -= map.price;
            this.unlockedMaps.push(mapKey);
            this.currentMapId = mapKey;
            this.saveData();
            this.renderHomeStageSelector();
            document.getElementById('homeCoins').textContent = this.coins;
            this.initGameWorld();
          }
        };
      } else {
        actionBtn.className = `btn ${isCurrent ? 'secondary-btn' : 'primary-btn'} small-btn`;
        actionBtn.textContent = isCurrent ? 'Equipped ✓' : 'Equip Stage';
        actionBtn.disabled = isCurrent;
        actionBtn.onclick = () => {
          this.currentMapId = mapKey;
          this.saveData();
          this.renderHomeStageSelector();
          this.initGameWorld();
        };
      }
    }
  }

  showWeatherBanner(title) {
    const banner = document.getElementById('weatherBanner');
    const textEl = document.getElementById('weatherBannerText');
    const iconEl = document.getElementById('weatherBannerIcon');
    if (!banner || !textEl) return;

    const weatherIcons = {
      sunny: '☀️',
      rain: '⛈️',
      sunset: '🌅',
      snow: '❄️',
      night: '🌙'
    };
    const currentW = this.terrain.currentWeather;
    if (iconEl) iconEl.textContent = weatherIcons[currentW] || '🌤️';
    textEl.textContent = title;

    banner.classList.remove('hidden');
    clearTimeout(this.weatherBannerTimeout);
    this.weatherBannerTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 3500);

    const hudW = document.getElementById('hudWeather');
    if (hudW) {
      const names = {
        sunny: '☀️ Sunny',
        rain: '⛈️ Storm',
        sunset: '🌅 Sunset',
        snow: '❄️ Snow',
        night: '🌙 Night'
      };
      hudW.textContent = names[currentW] || currentW;
    }
  }

  startGame() {
    document.getElementById('homeMenu').classList.add('hidden');
    document.getElementById('mobileModal')?.classList.add('hidden');
    this.restartGame();
  }

  renderHomeVehiclePreview() {
    if (!this.homeCtx || !this.homeCanvas) return;
    const pctx = this.homeCtx;
    const v = VEHICLE_DEFS[this.currentVehicleId];
    pctx.clearRect(0, 0, this.homeCanvas.width, this.homeCanvas.height);

    pctx.save();
    pctx.translate(this.homeCanvas.width * 0.5, this.homeCanvas.height * 0.65);

    const halfBase = v.config.wheelBase * 0.5;
    const rearWheel = { x: -halfBase, y: 15, radius: v.config.wheelRadius, angle: 0 };
    const frontWheel = { x: halfBase, y: 15, radius: v.config.wheelRadius, angle: 0 };

    drawSuspensionStrut(pctx, { x: -halfBase, y: -10 }, rearWheel);
    drawSuspensionStrut(pctx, { x: halfBase, y: -10 }, frontWheel);
    drawWheel(pctx, rearWheel);
    drawWheel(pctx, frontWheel);

    const mockHead = { relX: -4, relY: -32, radius: 12, bobAngle: 0 };
    drawDriverBill(pctx, mockHead, { isAirborne: false, crashed: false });
    v.drawChassis(pctx, { isAirborne: false });

    pctx.restore();
  }

  restartGame() {
    this.initGameWorld();

    this.state = 'PLAYING';
    this.sessionCoins = 0;
    this.sessionDiamonds = 0;
    this.maxAirTimeSession = 0;
    this.currentDistance = 0;
    this.particles = [];

    // Hide modals
    document.getElementById('homeMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('garageMenu').classList.add('hidden');
    document.getElementById('mobileModal')?.classList.add('hidden');

    this.updatePedalsVisibility();
    window.soundSystem.ensureContext();
    window.soundSystem.startEngine();
  }

  togglePause() {
    if (this.state === 'GAMEOVER' || this.state === 'GARAGE') return;
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pauseMenu').classList.remove('hidden');
      window.soundSystem.stopEngine();
    } else {
      this.state = 'PLAYING';
      document.getElementById('pauseMenu').classList.add('hidden');
      window.soundSystem.startEngine();
    }
    this.updatePedalsVisibility();
  }

  triggerGameOver(reason, desc) {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    window.soundSystem.stopEngine();

    if (this.currentDistance > this.highDistance) {
      this.highDistance = this.currentDistance;
    }
    this.saveData();

    document.getElementById('crashReason').textContent = reason;
    document.getElementById('crashDesc').textContent = desc;
    document.getElementById('finalDistance').textContent = `${this.currentDistance} m`;
    document.getElementById('finalCoins').textContent = `+${this.sessionCoins}`;
    document.getElementById('finalDiamonds').textContent = `+${this.sessionDiamonds}`;
    document.getElementById('finalBest').textContent = `${this.highDistance} m`;

    this.updatePedalsVisibility();
    document.getElementById('gameOverMenu').classList.remove('hidden');
  }

  addCoins(amount) {
    this.coins += amount;
    this.sessionCoins += amount;
    this.saveData();
  }

  addDiamond(amount = 1) {
    this.diamonds += amount;
    this.sessionDiamonds += amount;
    this.addCoins(500 * amount); // Bonus 500 coins per diamond
    this.saveData();
    this.updateHUD();
  }

  triggerStunt(title, reward) {
    this.addCoins(reward);
    this.showStuntBanner(title, `+${reward} COINS`);
    window.soundSystem.playStuntFanfare();
  }

  showStuntBanner(title, rewardText) {
    const banner = document.getElementById('stuntBanner');
    document.getElementById('stuntTitle').textContent = title;
    document.getElementById('stuntReward').textContent = rewardText;

    banner.classList.remove('hidden');
    clearTimeout(this.stuntTimeout);
    this.stuntTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 1800);
  }

  // Update Game Physics & Logic
  update(dt) {
    if (this.state !== 'PLAYING') return;

    // Sub-stepping for stable spring physics
    const subSteps = 4;
    const subDt = dt / subSteps;
    const curUpgrades = this.upgrades[this.currentVehicleId];

    for (let i = 0; i < subSteps; i++) {
      this.physics.update(subDt, this.inputs, this.terrain, curUpgrades);
    }

    // Terrain cleanup (done once per frame, not per substep)
    this.terrain.update(dt, this.physics.chassis);

    // Distance calculation
    this.currentDistance = Math.max(0, Math.floor(this.physics.chassis.x / 10));
    if (this.currentDistance > this.highDistance) {
      this.highDistance = this.currentDistance;
    }
    if (this.currentDistance > (this.mapRecords[this.currentMapId] || 0)) {
      this.mapRecords[this.currentMapId] = this.currentDistance;
    }

    if (this.physics.airTime > this.maxAirTimeSession) {
      this.maxAirTimeSession = this.physics.airTime;
    }

    // Spawn Particles
    this.spawnParticles();
    this.updateParticles(dt);

    // Camera Tracking
    this.updateCamera(dt);

    // Check Game Over Conditions
    if (this.physics.crashed) {
      this.triggerGameOver('DRIVER DOWN!', 'Bill hit his head on the rough ground!');
    } else if (this.physics.outOfFuel) {
      if (Math.abs(this.physics.chassis.vx) < 4 && !this.physics.isAirborne) {
        this.physics.stoppedOutOfFuelTimer = (this.physics.stoppedOutOfFuelTimer || 0) + dt;
        if (this.physics.stoppedOutOfFuelTimer > 0.8) {
          this.triggerGameOver('OUT OF FUEL!', 'Your tank ran dry! You coasted to a halt.');
        }
      } else {
        this.physics.stoppedOutOfFuelTimer = 0;
      }
    }

    // Update HUD
    this.updateHUD();
  }

  spawnParticles() {
    // Dirt kickup when wheel is grounded and spinning fast
    [this.physics.rearWheel, this.physics.frontWheel].forEach(w => {
      if (w.grounded && Math.abs(this.physics.chassis.vx) > 60 && Math.random() < 0.4) {
        this.particles.push({
          x: w.x - Math.sign(this.physics.chassis.vx) * 10,
          y: w.y + w.radius - 2,
          vx: -this.physics.chassis.vx * 0.2 + (Math.random() - 0.5) * 60,
          vy: -50 - Math.random() * 70,
          size: 3 + Math.random() * 4,
          color: '#5d4037',
          life: 0.45,
          maxLife: 0.45
        });
      }
    });

    // Exhaust smoke puff
    if (this.inputs.gas && this.physics.fuel > 0 && Math.random() < 0.45) {
      const cos = Math.cos(this.physics.chassis.angle);
      const sin = Math.sin(this.physics.chassis.angle);
      const exX = this.physics.chassis.x - 48 * cos + 10 * sin;
      const exY = this.physics.chassis.y - 48 * sin - 10 * cos;
      this.particles.push({
        x: exX,
        y: exY,
        vx: -50 * cos + (Math.random() - 0.5) * 25,
        vy: -50 * sin - 20 - Math.random() * 25,
        size: 5 + Math.random() * 5,
        color: 'rgba(200, 214, 229, 0.45)',
        life: 0.55,
        maxLife: 0.55
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += 220 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size *= (1 + 0.3 * dt);
    }
  }

  updateCamera(dt) {
    const chassis = this.physics.chassis;

    // Anchor the vehicle stably around 32% screen width.
    // When accelerating forward, camera follow has natural smooth dampening
    // allowing the vehicle to visually surge forward on screen (from 32% to ~38%),
    // completely eliminating any feeling of "ground moving under a stationary car"!
    const targetCamX = chassis.x - this.viewWidth * 0.32;
    const targetCamY = chassis.y - this.viewHeight * 0.58;

    // Smooth camera follow
    const followSpeedX = Math.min(1.0, 5.0 * dt);
    const followSpeedY = Math.min(1.0, 3.8 * dt);
    this.camera.x += (targetCamX - this.camera.x) * followSpeedX;
    this.camera.y += (targetCamY - this.camera.y) * followSpeedY;

    // Dynamic zoom: subtle and steady
    const speed = Math.hypot(chassis.vx, chassis.vy);
    const targetZoom = Math.max(0.92, 1.0 - speed * 0.0001);
    this.camera.zoom += (targetZoom - this.camera.zoom) * (2.0 * dt);
  }

  updateHUD() {
    document.getElementById('distanceVal').innerHTML = `${this.currentDistance} <small>m</small>`;
    const mapBest = Math.max(this.highDistance, this.mapRecords[this.currentMapId] || 0);
    document.getElementById('recordVal').textContent = `Record: ${mapBest} m`;
    document.getElementById('coinsVal').textContent = `🪙 ${this.coins}`;
    document.getElementById('diamondsVal').textContent = `💎 ${this.diamonds}`;

    const stageEl = document.getElementById('stageName');
    if (stageEl && this.terrain.mapConfig) {
      stageEl.textContent = this.terrain.mapConfig.name;
    }

    const hudW = document.getElementById('hudWeather');
    if (hudW) {
      const weatherMap = {
        sunny: '☀️ Sunny',
        rain: '⛈️ Storm',
        sunset: '🌅 Sunset',
        snow: '❄️ Snow',
        night: '🌙 Night'
      };
      hudW.textContent = weatherMap[this.terrain.currentWeather] || '☀️ Sunny';
    }

    // Fuel Bar
    const fuelPercent = Math.max(0, Math.min(100, this.physics.fuel));
    const fuelBar = document.getElementById('fuelBar');
    fuelBar.style.width = `${fuelPercent}%`;

    const fuelWarn = document.getElementById('fuelWarning');
    if (fuelPercent < 20 && fuelPercent > 0) {
      fuelWarn.classList.remove('hidden');
      if (this.state === 'PLAYING') window.soundSystem.playLowFuelWarning();
    } else {
      fuelWarn.classList.add('hidden');
    }

    // Gauges
    const curSpeed = Math.abs(this.physics.chassis.vx);
    const speedRatio = Math.min(1.0, curSpeed / 350);
    const speedDeg = -120 + speedRatio * 240;
    document.getElementById('speedNeedle').style.transform = `rotate(${speedDeg}deg)`;

    const rpmRatio = Math.min(1.0, (curSpeed / 300) + (this.inputs.gas ? 0.35 : 0.05));
    const rpmDeg = -120 + rpmRatio * 240;
    document.getElementById('rpmNeedle').style.transform = `rotate(${rpmDeg}deg)`;
  }

  // Draw Full Frame
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.viewWidth, this.viewHeight);

    // Camera Transform for World Space
    ctx.save();
    // Center-origin zoom
    ctx.translate(this.viewWidth * 0.5, this.viewHeight * 0.5);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.viewWidth * 0.5, -this.viewHeight * 0.5);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Draw Terrain (Parallax dynamic skies & mountains, 1-min weather, ravines & bridges, headlights & collectibles)
    this.terrain.draw(ctx, this.camera, this.viewWidth / this.camera.zoom, this.viewHeight / this.camera.zoom, { chassis: this.physics.chassis, vehicleId: this.currentVehicleId });

    // Draw Particles
    this.drawParticles(ctx);

    // Draw Active Vehicle
    this.drawVehicle(ctx);

    ctx.restore();
  }

  drawBackground(ctx) {
    const w = this.viewWidth;
    const h = this.viewHeight;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#54a0ff');
    skyGrad.addColorStop(0.55, '#81ecec');
    skyGrad.addColorStop(1, '#dfe6e9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Radiant Sun
    const sunGrad = ctx.createRadialGradient(w * 0.82, 90, 5, w * 0.82, 90, 140);
    sunGrad.addColorStop(0, 'rgba(255, 234, 167, 0.95)');
    sunGrad.addColorStop(0.5, 'rgba(253, 203, 110, 0.35)');
    sunGrad.addColorStop(1, 'rgba(253, 203, 110, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w * 0.82, 90, 140, 0, Math.PI * 2);
    ctx.fill();

    // Floating Clouds (parallax)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    this.clouds.forEach(c => {
      const screenX = ((c.x - this.camera.x * 0.08) % (w + 400)) - 150;
      ctx.beginPath();
      ctx.arc(screenX, c.y, 24 * c.scale, 0, Math.PI * 2);
      ctx.arc(screenX + 22 * c.scale, c.y - 10 * c.scale, 28 * c.scale, 0, Math.PI * 2);
      ctx.arc(screenX + 50 * c.scale, c.y, 22 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    // Distant Blue Mountains (Parallax 0.12x)
    ctx.fillStyle = '#74b9ff';
    ctx.beginPath();
    const p1 = this.camera.x * 0.12;
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 60; x += 60) {
      const worldX = x + p1;
      const my = h * 0.45 + Math.sin(worldX * 0.0018) * 80 + Math.cos(worldX * 0.0035) * 45;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Midground Rolling Green Hills (Parallax 0.28x)
    ctx.fillStyle = '#55efc4';
    ctx.beginPath();
    const p2 = this.camera.x * 0.28;
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 40; x += 40) {
      const worldX = x + p2;
      const my = h * 0.62 + Math.sin(worldX * 0.003) * 60 + Math.sin(worldX * 0.007) * 25;
      ctx.lineTo(x, my);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.fillStyle = p.color.includes('rgba') ? p.color : `rgba(93, 64, 55, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawVehicle(ctx) {
    const vDef = VEHICLE_DEFS[this.currentVehicleId];
    const p = this.physics;

    // 1. Suspension Struts
    const rearArmX = p.rearWheel.armX !== undefined ? p.rearWheel.armX : p.rearWheel.localX;
    const rearArmY = p.rearWheel.armY !== undefined ? p.rearWheel.armY : 4;
    const frontArmX = p.frontWheel.armX !== undefined ? p.frontWheel.armX : p.frontWheel.localX;
    const frontArmY = p.frontWheel.armY !== undefined ? p.frontWheel.armY : 4;

    const rearAnchor = p.getChassisAnchorWorld(rearArmX, rearArmY);
    const frontAnchor = p.getChassisAnchorWorld(frontArmX, frontArmY);
    drawSuspensionStrut(ctx, rearAnchor, p.rearWheel);
    drawSuspensionStrut(ctx, frontAnchor, p.frontWheel);

    // 2. Wheels
    drawWheel(ctx, p.rearWheel);
    drawWheel(ctx, p.frontWheel);

    // 3. Chassis & Driver Bill
    ctx.save();
    ctx.translate(p.chassis.x, p.chassis.y);
    ctx.rotate(p.chassis.angle);

    // Draw driver seated inside
    drawDriverBill(ctx, p.driverHead, p);

    // Draw vehicle chassis body
    vDef.drawChassis(ctx, p);

    ctx.restore();
  }

  // ==================== GARAGE & UPGRADES SYSTEM ====================
  initGarageUI() {
    this.renderGarageTabs();
    this.renderGarageVehiclePreview();
    this.renderUpgradesList();
  }

  openGarage(source = 'PAUSE') {
    this.garageSource = source;
    this.state = 'GARAGE';
    window.soundSystem.stopEngine();
    document.getElementById('homeMenu').classList.add('hidden');
    document.getElementById('pauseMenu').classList.add('hidden');
    document.getElementById('gameOverMenu').classList.add('hidden');
    document.getElementById('mobileModal')?.classList.add('hidden');
    document.getElementById('garageMenu').classList.remove('hidden');

    this.updatePedalsVisibility();
    this.selectedGarageVehicle = this.currentVehicleId;
    this.renderGarageTabs();
    this.renderGarageVehiclePreview();
    this.renderUpgradesList();
  }

  closeGarage() {
    document.getElementById('garageMenu').classList.add('hidden');
    if (this.garageSource === 'HOME') {
      this.openHome();
    } else {
      this.restartGame();
    }
  }

  renderGarageTabs() {
    const container = document.getElementById('vehicleTabs');
    container.innerHTML = '';
    document.getElementById('garageCoins').textContent = this.coins;
    const garDia = document.getElementById('garageDiamonds');
    if (garDia) garDia.textContent = this.diamonds;

    Object.keys(VEHICLE_DEFS).forEach(vKey => {
      const v = VEHICLE_DEFS[vKey];
      const isUnlocked = this.unlockedVehicles.includes(vKey);
      const isSelected = this.selectedGarageVehicle === vKey;

      const btn = document.createElement('button');
      btn.className = `v-tab ${isSelected ? 'active' : ''}`;
      btn.textContent = `${isUnlocked ? '' : '🔒 '}${v.name}`;
      btn.onclick = () => {
        this.selectedGarageVehicle = vKey;
        this.renderGarageTabs();
        this.renderGarageVehiclePreview();
        this.renderUpgradesList();
      };
      container.appendChild(btn);
    });
  }

  renderGarageVehiclePreview() {
    const v = VEHICLE_DEFS[this.selectedGarageVehicle];
    document.getElementById('previewName').textContent = v.name;
    document.getElementById('previewDesc').textContent = v.desc;

    const actionContainer = document.getElementById('vehicleUnlockContainer');
    actionContainer.innerHTML = '';

    const isUnlocked = this.unlockedVehicles.includes(this.selectedGarageVehicle);
    const isCurrent = this.currentVehicleId === this.selectedGarageVehicle;

    if (!isUnlocked) {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'btn warning-btn';
      buyBtn.innerHTML = `Unlock for 🪙 ${v.price}`;
      buyBtn.disabled = this.coins < v.price;
      buyBtn.onclick = () => {
        if (this.coins >= v.price) {
          this.coins -= v.price;
          this.unlockedVehicles.push(this.selectedGarageVehicle);
          this.currentVehicleId = this.selectedGarageVehicle;
          this.saveData();
          this.renderGarageTabs();
          this.renderGarageVehiclePreview();
          this.renderUpgradesList();
        }
      };
      actionContainer.appendChild(buyBtn);
    } else {
      const selectBtn = document.createElement('button');
      selectBtn.className = `btn ${isCurrent ? 'secondary-btn' : 'primary-btn'}`;
      selectBtn.textContent = isCurrent ? 'Equipped' : 'Equip Vehicle';
      selectBtn.disabled = isCurrent;
      selectBtn.onclick = () => {
        this.currentVehicleId = this.selectedGarageVehicle;
        this.saveData();
        this.renderGarageTabs();
        this.renderGarageVehiclePreview();
        const homeVName = document.getElementById('homeVehicleName');
        if (homeVName) homeVName.textContent = v.name;
        this.renderHomeVehiclePreview();
      };
      actionContainer.appendChild(selectBtn);
    }

    // Draw preview in 2D canvas
    const pctx = this.previewCtx;
    pctx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

    pctx.save();
    pctx.translate(this.previewCanvas.width * 0.5, this.previewCanvas.height * 0.65);

    const halfBase = v.config.wheelBase * 0.5;
    const rearWheel = { x: -halfBase, y: 15, radius: v.config.wheelRadius, angle: 0 };
    const frontWheel = { x: halfBase, y: 15, radius: v.config.wheelRadius, angle: 0 };

    drawSuspensionStrut(pctx, { x: -halfBase, y: -10 }, rearWheel);
    drawSuspensionStrut(pctx, { x: halfBase, y: -10 }, frontWheel);
    drawWheel(pctx, rearWheel);
    drawWheel(pctx, frontWheel);

    const mockHead = { relX: -4, relY: -32, radius: 12, bobAngle: 0 };
    drawDriverBill(pctx, mockHead, { isAirborne: false, crashed: false });
    v.drawChassis(pctx, { isAirborne: false });

    pctx.restore();
  }

  renderUpgradesList() {
    const container = document.getElementById('upgradesGrid');
    container.innerHTML = '';

    const upgradeTypes = [
      { id: 'engine', name: 'Engine Power', icon: '⚡', desc: '+18% power, +6% top speed per level' },
      { id: 'suspension', name: 'Suspension', icon: '🌀', desc: '+15% stiffness, smoother ride per level' },
      { id: 'tires', name: 'Tires Grip', icon: '🛞', desc: '+15% brake power, better traction per level' },
      { id: 'stability', name: 'Air Control', icon: '⚖️', desc: '+22% air rotation speed per level' }
    ];

    const curUp = this.upgrades[this.selectedGarageVehicle];
    const isUnlocked = this.unlockedVehicles.includes(this.selectedGarageVehicle);

    upgradeTypes.forEach(up => {
      const lvl = curUp[up.id] || 0;
      const maxLvl = 5;
      // Escalating Upgrade Costs (Requirement 2: increase cost of upgrades)
      const UPGRADE_COSTS = [1500, 4000, 10000, 25000, 60000];
      const cost = UPGRADE_COSTS[lvl] !== undefined ? UPGRADE_COSTS[lvl] : 60000;
      const isMax = lvl >= maxLvl;

      const card = document.createElement('div');
      card.className = 'upgrade-card';

      let barHtml = '';
      for (let i = 0; i < maxLvl; i++) {
        barHtml += `<div class="up-bar-segment ${i < lvl ? 'filled' : ''}"></div>`;
      }

      card.innerHTML = `
        <div class="upgrade-top">
          <span class="upgrade-title">${up.icon} ${up.name}</span>
          <span class="upgrade-level-label">LVL ${lvl}/${maxLvl}</span>
        </div>
        <div class="upgrade-desc" style="font-size:11px;color:#9cb3c9;margin-bottom:6px;">${up.desc}</div>
        <div class="upgrade-bars">${barHtml}</div>
        <button class="upgrade-btn" ${isMax || this.coins < cost || !isUnlocked ? 'disabled' : ''}>
          <span>${isMax ? 'MAXED OUT' : (!isUnlocked ? 'LOCKED' : 'UPGRADE')}</span>
          <span>${isMax ? '' : `🪙 ${cost}`}</span>
        </button>
      `;

      if (!isMax && isUnlocked) {
        const btn = card.querySelector('.upgrade-btn');
        btn.onclick = () => {
          if (this.coins >= cost) {
            this.coins -= cost;
            curUp[up.id] = lvl + 1;
            this.saveData();
            this.renderGarageTabs();
            this.renderUpgradesList();
          }
        };
      }

      container.appendChild(card);
    });
  }

  // Main Loop
  gameLoop(timestamp) {
    const dt = Math.min(0.035, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new Game();

  // Register PWA Service Worker for offline play on Android, iOS, Windows, and Mac
  if ('serviceWorker' in navigator && (window.location.protocol.startsWith('http') || window.location.protocol.startsWith('https'))) {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.log('PWA Service Worker note:', err);
    });
  }
});
