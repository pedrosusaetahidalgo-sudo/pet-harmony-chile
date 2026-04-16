#!/usr/bin/env bash
# Build iOS for App Store upload
# Prerequisites:
#   1. macOS with Xcode installed
#   2. Apple Developer account configured in Xcode
#   3. GoogleService-Info.plist in ios/App/App/
#   4. All env vars set in .env

set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Paw Friend iOS Release Build ==="

# Step 1: Build web assets
echo -e "\n[1/4] Construyendo assets web..."
npm run build

# Step 2: Sync Capacitor
echo -e "\n[2/4] Sincronizando Capacitor..."
npx cap sync ios

# Step 3: Open Xcode (build from there for signing)
echo -e "\n[3/4] Abriendo Xcode..."
npx cap open ios

echo -e "\n[4/4] Instrucciones:"
echo "1. En Xcode, selecciona 'Any iOS Device' como target"
echo "2. Product > Archive"
echo "3. Window > Organizer > Distribute App > App Store Connect"
echo "4. Sigue el wizard de upload"
echo ""
echo "Para TestFlight: el build aparecerá automáticamente después de subirlo."
