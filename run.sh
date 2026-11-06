#!/usr/bin/env bash
# Launch Hill Climb Racing on macOS
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "🚗 Starting Hill Climb Racing (macOS Edition)..."
# Open default macOS browser directly
open "$DIR/index.html"
