#!/bin/bash

# Paw Friend - Script para preparar build de producción
# Uso: ./scripts/prepare-production.sh

echo "🐾 Preparando Paw Friend para producción..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Paso 1: Backup del config de desarrollo
echo -e "${YELLOW}Paso 1: Guardando configuración de desarrollo...${NC}"
if [ -f "capacitor.config.ts" ]; then
    cp capacitor.config.ts capacitor.config.development.ts
    echo -e "${GREEN}✓ Backup creado: capacitor.config.development.ts${NC}"
fi

# Paso 2: Copiar config de producción
echo -e "${YELLOW}Paso 2: Aplicando configuración de producción...${NC}"
if [ -f "capacitor.config.production.ts" ]; then
    cp capacitor.config.production.ts capacitor.config.ts
    echo -e "${GREEN}✓ Configuración de producción aplicada${NC}"
else
    echo -e "${RED}Error: No se encontró capacitor.config.production.ts${NC}"
    exit 1
fi

# Paso 3: Instalar dependencias
echo -e "${YELLOW}Paso 3: Instalando dependencias...${NC}"
npm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

# Paso 4: Build de la app web
echo -e "${YELLOW}Paso 4: Construyendo app web...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Falló el build de la app web${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build web completado${NC}"

# Paso 5: Sincronizar con Android
echo -e "${YELLOW}Paso 5: Sincronizando con Android...${NC}"
npx cap sync android
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Falló la sincronización con Android${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Sincronización completada${NC}"

# Resumen
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Proyecto listo para generar .aab${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Próximos pasos:"
echo "1. Abre Android Studio: npx cap open android"
echo "2. Build > Generate Signed Bundle / APK..."
echo "3. Selecciona Android App Bundle"
echo "4. Configura tu keystore"
echo "5. Genera el .aab"
echo ""
echo "El archivo se generará en:"
echo "android/app/build/outputs/bundle/release/app-release.aab"
