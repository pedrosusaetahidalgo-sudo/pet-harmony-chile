# Paw Friend - Red Social para Mascotas 🐾

Red social para mascotas de Chile. Conecta, cuida y comparte la vida de tu mascota.

## 📱 Información de la App

| Campo | Valor |
|-------|-------|
| **Nombre** | Paw Friend |
| **Package ID** | `cl.pawfriend.app` |
| **Versión** | 1.0.0 |
| **País** | Chile 🇨🇱 |

## 🚀 Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Estilos**: Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **IA**: Lovable AI (Google Gemini 2.5 Flash)
- **Pagos**: Webpay Plus (Transbank)
- **Mapas**: Google Maps API
- **Mobile**: Capacitor (iOS/Android)

## 🛠️ Desarrollo Local

```bash
# Clonar repositorio
git clone <YOUR_GIT_URL>
cd paw-friend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## 📱 Capacitor (Mobile)

### Desarrollo con Hot Reload

```bash
# Agregar plataformas
npx cap add android
npx cap add ios

# Sincronizar después de cambios
npm run build
npx cap sync

# Abrir en IDE nativo
npx cap open android
npx cap open ios
```

### Build de Producción

Ver [GOOGLE_PLAY_README.md](./GOOGLE_PLAY_README.md) para guía completa de publicación.

```bash
# 1. Copiar config de producción
cp capacitor.config.production.ts capacitor.config.ts

# 2. Build optimizado
npm run build
npx cap sync

# 3. Generar AAB/IPA en IDE nativo
npx cap open android
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas de la app
│   ├── hooks/          # Custom hooks
│   ├── contexts/       # Context providers
│   ├── integrations/   # Integraciones (Supabase)
│   └── assets/         # Imágenes y recursos
├── supabase/
│   └── functions/      # Edge functions
├── android/            # Proyecto Android (Capacitor)
├── docs/               # Documentación
│   ├── AI_PROMPTS_DOCUMENTATION.md
│   └── CAPACITOR_MIGRATION_CHECKLIST.md
└── public/             # Assets públicos
```

## 🤖 Edge Functions de IA

| Función | Propósito |
|---------|-----------|
| `analyze-dog-behavior` | Análisis de lenguaje corporal canino |
| `breed-tips` | Consejos específicos por raza |
| `medical-suggestions` | Sugerencias médicas veterinarias |
| `moderate-service-promotion` | Moderación de contenido |
| `generate-shelters` | Generación de refugios con IA |
| `generate-places` | Generación de lugares pet-friendly |

Ver [docs/AI_PROMPTS_DOCUMENTATION.md](./docs/AI_PROMPTS_DOCUMENTATION.md) para detalles.

## ✅ Características Principales

- 🐕 **Perfiles de Mascotas**: Gestión completa de información de mascotas
- 📸 **Pet Social**: Feed social para compartir momentos
- 🏥 **Historial Médico**: Registro de vacunas, tratamientos y citas
- 📍 **Mapas Interactivos**: Mascotas perdidas, adopción y servicios
- 🚶 **Servicios Profesionales**: Paseadores, cuidadores, veterinarios, entrenadores
- 🎮 **Gamificación**: Sistema de puntos y recompensas
- 💬 **Mensajería**: Chat directo entre usuarios
- 💳 **Pagos Seguros**: Integración con Webpay

## 📖 Documentación Adicional

- [Guía de Google Play Store](./GOOGLE_PLAY_README.md)
- [Documentación de Prompts IA](./docs/AI_PROMPTS_DOCUMENTATION.md)
- [Checklist de Migración Capacitor](./docs/CAPACITOR_MIGRATION_CHECKLIST.md)

## 🔗 Links

- **Lovable Project**: https://lovable.dev/projects/9c3ef547-1a05-4427-a6e6-d3f86a6365e3
- **Preview**: https://9c3ef547-1a05-4427-a6e6-d3f86a6365e3.lovableproject.com

## 📞 Contacto

- **Email**: soporte@pawfriend.cl
- **País**: Chile 🇨🇱

---

Desarrollado con ❤️ por Paw Friend Chile
