#!/bin/bash
# Space Race: Beyond Earth — double-click this file in Finder on macOS.

cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm was not found."
  echo "Install Node.js from https://nodejs.org, then try again."
  read -r -p "Press Return to close this window..."
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "The game files were not found alongside this launcher."
  read -r -p "Press Return to close this window..."
  exit 1
fi

# Update dependencies after a GitHub pull when package.json has changed.
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo "First launch: installing project dependencies..."
  if ! npm install; then
    echo "Installation failed. Check the messages above."
    read -r -p "Press Return to close this window..."
    exit 1
  fi
fi

echo
echo "Starting Space Race: Beyond Earth..."
echo "Your browser will open automatically when the game is ready."
echo "Keep this Terminal window open while playing."
echo "Press Control+C in this window to stop the game."
echo
npm run dev -- --open

status=$?
if [ "$status" -ne 0 ]; then
  echo
  echo "The game stopped with an error (status $status)."
  read -r -p "Press Return to close this window..."
fi
exit "$status"
