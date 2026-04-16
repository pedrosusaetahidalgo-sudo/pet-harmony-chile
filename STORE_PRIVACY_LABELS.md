# App Store — Privacy Nutrition Labels

> Copia estas respuestas a App Store Connect > App Privacy.
> Referencia: https://appstoreconnect.apple.com/ > tu app > App Privacy

---

## Categorias de datos

### 1. Contact Info
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Name | App Functionality | SI | NO |
| Email Address | App Functionality | SI | NO |

### 2. Health & Fitness
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Health (de mascotas, NO humanos) | App Functionality | SI | NO |

> **Nota para Apple**: Los "datos de salud" en esta app son exclusivamente de mascotas
> (fichas medicas veterinarias). No recolectamos datos de salud de personas.

### 3. Financial Info
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Purchase History | App Functionality | SI | NO |

### 4. Photos or Videos
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Photos | App Functionality | SI | NO |

### 5. Identifiers
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| User ID | App Functionality, Analytics | SI | NO |
| Device ID | Analytics | NO | SI (con consentimiento ATT) |

### 6. Usage Data
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Product Interaction | Analytics | SI | NO |

### 7. Diagnostics
| Dato | Uso | Linked to user | Tracking |
|---|---|---|---|
| Crash Data | App Functionality (Sentry) | NO | NO |
| Performance Data | Analytics | NO | NO |

---

## Resumen de respuestas

| Pregunta de Apple | Respuesta |
|---|---|
| Do you or your third-party partners collect data from this app? | SI |
| Data used to track you | Device ID (solo con consentimiento ATT) |
| Data linked to you | Name, Email, User ID, Purchase History, Photos, Health (mascotas), Product Interaction |
| Data not linked to you | Crash Data, Performance Data |

---

## Third-party SDKs que recolectan datos

| SDK | Datos recolectados | Proposito |
|---|---|---|
| Firebase Analytics | Device ID, Product Interaction, Performance | Analytics |
| Facebook SDK | Device ID (con ATT) | Analytics, Social Login |
| Sentry | Crash Data | Diagnostics |
| Supabase | User data (encrypted) | Backend |

> **Tip**: Apple suele preguntar por que necesitas cada dato. Respuesta corta:
> "Para gestionar fichas medicas de mascotas y conectar duenos con veterinarios verificados"
