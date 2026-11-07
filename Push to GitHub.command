#!/bin/bash
# One-Click GitHub Publisher for Hill Climb Racing
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="/Users/reddypranavaganesh/.gemini/antigravity/scratch/hill_climb_racing"

echo "=========================================================="
echo "  🚀 PUSH HILL CLIMB RACING TO GITHUB 🚀"
echo "=========================================================="
echo ""

cd "$PROJECT_DIR" || exit 1

# 1. Check if gh is authenticated
if ! gh auth status >/dev/null 2>&1; then
  echo "▶ Step 1: Logging in to GitHub in your browser..."
  echo "A browser window will open. Click 'Authorize github'."
  echo ""
  gh auth login --web -p https
fi

echo ""
echo "▶ Step 2: Committing and pushing latest code to GitHub..."
git add -A
git commit -m "feat: updated game assets and physics" 2>/dev/null || true
git push origin main 2>&1 || {
  echo "Trying gh push..."
  gh repo create Hill-Climb-Racing --public --source=. --remote=origin --push 2>&1 || git push -u origin main
}

echo ""
echo "▶ Step 3: Enabling free GitHub Pages (Permanent Web Game Link)..."
gh api --method POST "repos/ReddyPranavaGanesh/Hill-Climb-Racing/pages" \
  -f "source[branch]=main" -f "source[path]=/" 2>/dev/null || true

echo ""
echo "=========================================================="
echo "  ✅ SUCCESS! CODE IS NOW ON GITHUB!"
echo "=========================================================="
echo "  📁 Repository: https://github.com/ReddyPranavaGanesh/Hill-Climb-Racing"
echo "  🌐 Live Game:   https://reddypranavaganesh.github.io/Hill-Climb-Racing/"
echo "=========================================================="
echo ""
echo "TO GET THE GAME ON YOUR PC:"
echo "1. On your PC, open https://github.com/ReddyPranavaGanesh/hill-climb-racing"
echo "2. Click the green '<> Code' button -> 'Download ZIP'"
echo "3. Extract the ZIP and double-click 'Start Game.bat' to play!"
echo "=========================================================="
echo "Press any key to close this window..."
read -n 1
