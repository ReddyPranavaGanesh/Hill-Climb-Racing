# 🏁 Hill Climb Racing — macOS Edition

A physics-based 2D driving game inspired by *Hill Climb Racing*, designed specifically to run smoothly on macOS with full keyboard controls, Retina graphics, procedural endless terrain, and synthesized audio.

---

## 🚀 Quick Start on Mac

You have 3 easy ways to launch and play immediately:

### Option 1: Double-Click in Finder (Easiest)
In Finder, navigate to the folder:
`/Users/reddypranavaganesh/.gemini/antigravity/scratch/hill_climb_racing`
and simply double-click **`Start Game.command`**.

### Option 2: Terminal Script
Run this one-liner in your terminal:
```bash
cd /Users/reddypranavaganesh/.gemini/antigravity/scratch/hill_climb_racing
./run.sh
```

### Option 3: Direct Browser Launch
```bash
open /Users/reddypranavaganesh/.gemini/antigravity/scratch/hill_climb_racing/index.html
```

---

## 🎮 Keyboard Controls

| Key | Action | In-Game Effect |
| :--- | :--- | :--- |
| **`▶`** or **`D`** | **Gas / Accelerate** | Accelerates wheels forward. When airborne, tilts the vehicle **backward / counter-clockwise** (Backflip). |
| **`◀`** or **`A`** | **Brake / Reverse** | Brakes and reverses. When airborne, tilts the vehicle **forward / clockwise** (Frontflip). |
| **`Space`** | **Play Again / Restart** | Instantly restarts run after a crash or game over. |
| **`R`** | **Quick Restart** | Restarts the current run from the beginning. |
| **`Esc`** or **`P`** | **Pause Game** | Toggles the pause menu. |
| **`M`** | **Mute / Unmute** | Toggles game audio & engine sound effects. |

> **Trackpad / Mouse**: You can also click the left half of the screen for Brake and the right half for Gas.

---

## 🚗 Features & Gameplay Mechanics

### 1. Spring-Damper 2D Physics
- **Dual-Wheel Suspension**: Front and rear wheels are mounted on independent damped spring constraints ($F = -k \Delta x - c \Delta v$).
- **Authentic Weight Transfer**: Accelerating pulls the nose up into a wheelie; hard braking dips the nose.
- **Mid-Air Tilt Controls**: Perform stunts, level out your landings on steep slopes, or execute continuous flips!
- **Driver Ragdoll Neck Snap**: If Bill's head strikes the ground or rocks, it triggers a crash (**"DRIVER DOWN!"**).

### 2. Infinite Procedural Terrain & Suspension Bridges
- Smooth multi-frequency hills, crests, and steep climbs.
- **Interactive Suspension Bridges**: Dynamic wooden bridges with simulated sagging ropes and weight deflection as you drive across them.
- Scattered **Coin Arcs** (🪙 50, 100, and 500) and **Jerrycans** (⛽ 100% fuel refill).

### 3. Stunts & Score Multipliers
- **Backflips** & **Frontflips** (`+1000 Coins` per complete 360° rotation in air).
- **Air Time** bonuses for launching off tall crests.

### 4. The Garage: 4 Distinct Vehicles & Upgrades
Access the Garage anytime from the pause or game over screen:
1. **Hill Climber (Jeep)**: Balanced 4x4 with reliable suspension.
2. **Monster Truck**: Giant bouncy wheels, massive clearance, and brute climbing power.
3. **Dune Buggy**: Lightweight tubular frame, rear engine, high grip, and rapid acceleration.
4. **Motocross Bike**: Nimble dirt bike with crazy aerial rotation agility for extreme stunts.

Each vehicle features 4 upgrade tiers:
- **Engine**: Horsepower and climbing torque.
- **Suspension**: Shock absorption and stability on landings.
- **Tires**: Grip and traction on steep grades.
- **4WD / Air Control**: Front-wheel drive ratio and aerial stunt responsiveness.

### 5. Pure Web Audio Synthesizer (Zero External Audio Files)
- Procedural multi-oscillator engine roar tied dynamically to RPM and throttle.
- Pentatonic coin pickup chimes.
- Liquid fuel refill sound.
- Pulsing low-fuel alarm.
- Crunch crash sound effects.
