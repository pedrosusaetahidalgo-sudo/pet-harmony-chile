#!/usr/bin/env bash
# Build Android release bundle (.aab) for Play Store upload
# Prerequisites:
#   1. keystore.properties configured in android/
#   2. google-services.json in android/app/
#   3. All env vars set in .env

set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Paw Friend Android Release Build ==="

# Step 1: Verify prerequisites
echo -e "\n[1/5] Verificando prerequisitos..."

if [ ! -f "android/keystore.properties" ]; then
    echo "ERROR: android/keystore.properties no existe."
    echo "Copia android/keystore.properties.example y llena los valores."
    exit 1
fi

if [ ! -f "android/app/google-services.json" ]; then
    echo "ADVERTENCIA: android/app/google-services.json no existe."
    echo "Firebase Analytics no funcionará en esta build."
fi

# Step 2: Build web assets
echo -e "\n[2/5] Construyendo assets web..."
npm run build

# Step 3: Sync Capacitor
echo -e "\n[3/5] Sincronizando Capacitor..."
npx cap sync android

# Step 4: Build AAB
echo -e "\n[4/5] Compilando release (AAB)..."
cd android
./gradlew bundleRelease
cd ..

# Step 5: Done
echo -e "\n[5/5] Build completada!"
echo "AAB en: android/app/build/outputs/bundle/release/"
echo "Sube el archivo a Google Play Console > Production > Create new release"
