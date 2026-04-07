#!/bin/bash

# Paw Friend - Script para restaurar configuración de desarrollo
# Uso: ./scripts/restore-development.sh

echo "🐾 Restaurando configuración de desarrollo..."

if [ -f "capacitor.config.development.ts" ]; then
    cp capacitor.config.development.ts capacitor.config.ts
    echo "✓ Configuración de desarrollo restaurada"
    echo "Ejecuta 'npx cap sync android' para sincronizar"
else
    echo "⚠ No se encontró backup de desarrollo"
    echo "Verifica manualmente capacitor.config.ts"
fi
