# Paw Friend — Diagramas de Flujo (Mermaid)

> **FUENTE DE VERDAD**: para el flujo end-to-end pegable en un solo paso, usar [FLUJO_COMPLETO.mmd](./FLUJO_COMPLETO.mmd).
> Ese archivo es UN SOLO bloque completo, listo para seleccionar todo + copiar + pegar directo en [mermaid.live](https://mermaid.live) sin editar nada.
>
> Este archivo (`FLUJOS_MERMAID.md`) es **complementario**: contiene los mismos flujos partidos por modulo para cuando se quiere revisar una seccion aislada. Si hay contradiccion, gana `FLUJO_COMPLETO.mmd`.
>
> Para pegar un bloque individual de esta pagina: copia SOLO el contenido entre las marcas de codigo, SIN incluir la linea ```mermaid ni el ``` final.

---

## 1. Autenticacion y Redireccion Post-Auth

```mermaid
flowchart TD
    A["Usuario abre /auth"] --> B{"Elige metodo"}
    B -->|Email| C["signInWithOtp email"]
    B -->|Google| D{"Plataforma?"}
    B -->|Facebook| E["signInWithOAuth Facebook"]

    D -->|Web| F["signInWithOAuth Google"]
    D -->|Nativo| G["signInWithIdToken Capacitor"]

    C --> H["Supabase verifica"]
    F --> H
    G --> H
    E --> H

    H --> I["onAuthStateChange dispara"]
    I --> J["ProtectedRoute detecta sesion"]
    J --> K{"Primera vez?"}
    K -->|"Si dueno"| L["Redirige a onboarding-mascota"]
    K -->|"Si vet"| M["Redirige a onboarding-vet"]
    K -->|No| REDIR{"Logica redireccion"}

    REDIR --> R1{"returnTo param?"}
    R1 -->|Si| R2["Redirige a returnTo - ej: /qr/:token"]
    R1 -->|No| R3{"Es proveedor?"}
    R3 -->|Si| R4["Redirige a provider/dashboard"]
    R3 -->|No| R5{"Tiene mascotas?"}
    R5 -->|Si| R6["Redirige a /home"]
    R5 -->|No| L
```

---

## 2. Mascotas — Crear mascota

```mermaid
flowchart TD
    A["Usuario va a add-pet"] --> B["Llena formulario"]
    B --> C["foto, nombre, especie, raza, fecha nacimiento"]
    C --> D{"Sube carnet vacunas?"}
    D -->|Si| E["OCR extrae datos via Edge Function"]
    D -->|No| F["Continua sin OCR"]
    E --> F
    F --> G["useCanAddPet verifica limite plan"]
    G --> H{"Puede agregar?"}
    H -->|"No - Plan gratis 2 max"| I["Mostrar upgrade Premium"]
    H -->|Si| J["INSERT en tabla pets"]
    J --> K["Trigger BD: crea recordatorios automaticos"]
    K --> L["useOrganicRewards: suma PawPoints"]
    L --> M["Toast: mascota agregada + recordatorios"]
    M --> N["Redirige a my-pets"]
```

---

## 3. Ficha Clinica — Flujo completo

```mermaid
flowchart TD
    A["Usuario va a ficha clinica"] --> B{"Selecciona Tab"}

    B -->|Resumen| C["Estado general, peso, alergias, medicamentos"]
    B -->|Historial| D["Timeline 25 tipos de registro"]
    B -->|Documentos| E["PDFs, fotos, examenes"]
    B -->|Compartir| F["QR + link + PDF"]
    B -->|Alimentacion| G["Tipo dieta, alergias alimentarias"]

    D --> D1["Click Agregar registro"]
    D1 --> D2["Form: tipo, fecha, vet, clinica, notas"]
    D2 --> D3["INSERT en medical_records"]

    E --> E1["Upload archivo"]
    E1 --> E2["Supabase Storage"]
    E2 --> E3["INSERT en medical_documents"]

    F --> F1["PetQRDisplay - QR unico"]
    F --> F2["Genera link temporal 30 dias"]
    F --> F3["Opciones: copiar, WhatsApp, descargar QR"]

    A --> H["Boton PDF"]
    H --> I["Genera ficha completa descargable"]
```

---

## 4. Recordatorios

```mermaid
flowchart TD
    subgraph AutoCreacion["Auto-creacion al agregar mascota"]
        A1["Trigger BD: create_default_reminders"] --> A2["Consulta vaccination_protocols"]
        A2 --> A3["Crea recordatorios segun especie + edad"]
        A3 --> A4["Antirrabica, Sextuple, Antiparasitario, etc."]
    end

    subgraph Visualizacion["Visualizacion"]
        B1["Home - alertas salud primero"] --> B2["Card: vencidos rojo + proximos amarillo"]
        B2 --> B2L["Link: Ver todos los recordatorios"]
        B3["Tab Recordatorios - badge en BottomTabBar"] --> B4["Lista agrupada: vencidos, hoy, proximos"]
    end

    subgraph Completar["Completar recordatorio"]
        C1["Click check"] --> C2["completeReminder.mutate"]
        C2 --> C3["UPDATE is_completed = true"]
    end

    subgraph Cron["Cron diario 9AM Chile"]
        D1["reminder-cron se ejecuta"] --> D2["Busca recordatorios proximos"]
        D2 --> D3{"Canal disponible?"}
        D3 -->|Email| D4["Envia email"]
        D3 -->|WhatsApp| D5["Pendiente verificacion Meta"]
    end
```

---

## 5. Directorio de Veterinarios

```mermaid
flowchart TD
    A["Pagina veterinarios - publico"] --> B["DirectorioVets.tsx"]
    B --> C["Filtros: comuna, tipo, especialidad, rating"]
    B --> D["Carousel: Nuevos en Paw Friend menores a 90 dias"]

    C --> E["Click vet"]
    D --> E
    E --> F["Perfil vet publico"]
    F --> G["Foto, bio, especialidades, zonas"]
    F --> I["Reviews verificadas"]
    F --> J["Precio desde"]
    F --> K{"CTA"}
    K -->|Agendar| L["Reserva consulta"]
    K -->|Mensaje| M["Iniciar chat"]

    N["Pagina precios-veterinarios"] --> O["Estimador por comuna"]
    O --> P["Selecciona tipo consulta + comuna"]
    P --> Q["Muestra rango de precios"]

    subgraph SEO["SEO"]
        S1["Helmet meta tags dinamicos"]
        S2["Canonical URLs"]
        S3["Sitemap edge function"]
    end
```

---

## 6. Dashboard Veterinario

```mermaid
flowchart TD
    A["Vet entra a provider dashboard"] --> B{"Es nuevo?"}
    B -->|Si| C["Onboarding 3 pasos para completar perfil"]
    B -->|No| D["Dashboard completo"]

    D --> E["VetFollowupsCard: seguimientos 7 dias"]
    D --> F["SharedFichasCard: fichas compartidas recientes"]
    D --> G["Balance: disponible, pendiente, total, retirado"]
    D --> H["Stats: visitas, rating, clientes unicos"]
    D --> I["VetPatientsList"]

    I --> J{"Accion"}
    J -->|"Nuevo paciente"| K["NewPatientForm"]
    K --> L["5 campos + email dueno"]
    L --> M["INSERT pet + send-pet-invitation"]
    M --> N["Dueno recibe email, acepta, vincula"]

    J -->|"Click paciente"| O["Ver ficha clinica"]
    O --> P["VetNoteEditor + ConsultationTemplateSelector"]
    P --> Q["Selecciona plantilla, edita campos"]
    Q --> R{"Requiere seguimiento?"}
    R -->|Si| S["Marca fecha seguimiento"]
    S --> T["SAVE"]
    R -->|No| T
    T --> U["Trigger: crea recordatorio + invitacion review"]
```

---

## 7. Chat y Mensajeria

```mermaid
flowchart TD
    A["Pagina chat"] --> B["Lista conversaciones ordenada por ultimo mensaje"]
    B --> C["Busqueda por nombre"]

    B --> D{"Accion"}
    D -->|"Nuevo mensaje"| E["Muestra usuarios con follow mutuo"]
    E --> F["Click usuario"]
    F --> G["startConversation - INSERT conversations"]
    G --> H["Conversacion individual"]

    D -->|"Abrir existente"| H

    H --> I["Mensajes con Realtime"]
    I --> J{"Primeros mensajes?"}
    J -->|Si| K["Quick replies: 5 opciones"]
    J -->|No| L["Input normal"]
    K --> M["Enviar mensaje"]
    L --> M
    M --> N["INSERT messages"]
    N --> O["Auto-scroll + mark as read"]
    O --> I
```

---

## 8. Social — Feed

```mermaid
flowchart TD
    A["Pagina feed"] --> B["ActivityFeed carga posts recientes"]
    B --> C{"Accion"}
    C -->|Crear| D["CreatePost: texto + foto opcional"]
    D --> E["INSERT post"]
    E --> B

    C -->|Like| F["Toggle like en post"]
    C -->|Comentar| G["PostComments"]
    G --> H["Escribir comentario - INSERT"]

    C -->|"Click usuario"| I["Perfil de usuario"]
    I --> J["UserProfile"]
    J --> K["FollowButton"]
    J --> L["BlockUserButton"]
    J --> M["ReportUserDialog"]

    N["Pagina home"] --> O["Card: 3 posts recientes comunidad"]
```

---

## 9. Asistente IA — Pet Assistant

```mermaid
flowchart TD
    A["Abre PetAssistant desde ficha o home"] --> B["AIDisclaimer type medical"]
    B --> C["Escribe pregunta sobre su mascota"]
    C --> D["useAISkill invoca edge function"]

    D --> E["Verifica auth + rate limit 5 por dia"]
    E --> F{"Dentro del limite?"}
    F -->|No| G["AIRateLimitState"]
    F -->|Si| H["Carga ficha: datos, historial, recordatorios, alergias"]

    H --> I["System prompt + datos reales + reglas"]
    I --> J["Claude Sonnet 4.5 - max 600 tokens"]
    J --> K["Parsea JSON: respuesta, urgencia, requiere_vet, sugerencias"]

    K --> L["Burbuja con respuesta"]
    K --> M{"Nivel urgencia"}
    M -->|Bajo| N["Badge verde"]
    M -->|Medio| O["Badge amarillo"]
    M -->|Alto| P["Badge rojo"]

    K --> Q{"Requiere veterinario?"}
    Q -->|Si| R["Banner rojo: Consultar con veterinario"]
    Q -->|No| S["Sugerencias de accion"]
```

---

## 10. Pagos — Flow Premium B2C

```mermaid
flowchart TD
    A["Pagina upgrade"] --> B["Muestra planes: Gratis vs Premium 3990 mes"]
    B --> C["Click Suscribirse"]
    C --> D["flow-create-subscription edge function"]
    D --> E["Redirige a Flow.cl"]

    E --> F{"Usuario paga?"}
    F -->|Si| G["Flow envia webhook"]
    F -->|Cancela| H["Pagina upgrade cancel"]

    G --> I["flow-webhook verifica idempotente + rate limited"]
    I --> J["Actualiza BD: is_premium = true"]
    J --> K["Redirige a upgrade success"]
    K --> L["usePlan refleja nuevo estado"]

    L --> M["Desbloquea beneficios"]
    M --> M1["Mascotas ilimitadas"]
    M --> M2["PDF ficha clinica"]
    M --> M3["Compartir ficha"]
```

---

## 11. Reviews y Resenas

```mermaid
flowchart TD
    subgraph Trigger["Trigger automatico"]
        A1["Vet crea nota clinica"] --> A2["Trigger BD crea pending_review"]
        A2 --> A3["Futuro: email 24h despues con link"]
    end

    subgraph Review["Dejar resena"]
        B1["Pagina resena con token"] --> B2["DejarResena.tsx"]
        B2 --> B3["Valida token + muestra datos vet"]
        B3 --> B4["Estrellas + comentario"]
        B4 --> B5["INSERT service_reviews"]
        B5 --> B6["Actualiza avg_rating del vet"]
        B6 --> B7["pending_review completada"]
    end

    subgraph Visualizacion["Visualizacion"]
        C1["Home: banner X resenas pendientes"]
        C2["Perfil vet: lista reviews"]
    end
```

---

## 12. Sistema QR

```mermaid
flowchart TD
    subgraph Generacion["Generacion"]
        A1["Crear mascota"] --> A2["Trigger: genera qr_token hex 16 bytes"]
        A2 --> A3["PetQRDisplay muestra QR con URL"]
    end

    subgraph Escaneo["Escaneo"]
        B1["Escanea QR abre landing"] --> B2["QRLanding.tsx"]
        B2 --> B3["Busca mascota por qr_token"]
        B3 --> B4{"Rol del visitante?"}
        B4 -->|"Vet verificado"| B5["Registra relacion + ficha completa"]
        B4 -->|Dueno| B6["Muestra ficha propia"]
        B4 -->|Otro| B7["Info basica publica"]
    end
```

---

## 13. Google Calendar

```mermaid
flowchart TD
    A["Settings - IntegrationsCard"] --> B["Click Conectar Google Calendar"]
    B --> C["google-calendar-oauth-init"]
    C --> D["Genera URL OAuth"]
    D --> E["Redirige a Google"]
    E --> F["Usuario autoriza"]
    F --> G["Callback google-calendar-callback"]
    G --> H["Guarda refresh_token"]
    H --> I["Sync: recordatorios a eventos Google Calendar"]

    J["Desconectar"] --> K["google-calendar-disconnect"]
    K --> L["Revoca tokens"]
```

---

## 14. Onboarding — Todos los flujos

### 14a. Onboarding Dueno Minimal (/onboarding-mascota)

```mermaid
flowchart TD
    A["Primera vez - dueno sin mascotas"] --> B["OnboardingDuenoMinimal"]
    B --> C["Formulario rapido 1 pantalla"]

    C --> D["Nombre mascota - requerido"]
    C --> E{"Especie - chips"}
    E --> E1["Perro"]
    E --> E2["Gato"]
    E --> E3["Otro"]

    C --> F{"Edad - chips"}
    F --> F1["Cachorro - 0.5 anos"]
    F --> F2["Joven - 2 anos"]
    F --> F3["Adulto - 5 anos"]
    F --> F4["Senior - 10 anos"]

    C --> G["Foto mascota - opcional"]
    G -->|Sube| H["Upload pet-photos bucket"]

    D --> I["Crea mascota is_public=true"]
    I --> J["Toast: Ficha al 30% - completar con carnet"]
    J --> K["Redirige a /home"]
    K --> L["Activa Tutorial Carousel"]
```

### 14b. Onboarding Vet Minimal (/onboarding-vet)

```mermaid
flowchart TD
    A["Primera vez - veterinario"] --> B["OnboardingVetMinimal"]
    B --> C["Formulario rapido 1 pantalla"]

    C --> D["Nombre display - requerido - ej: Dr. Juan Perez"]
    C --> E["Avatar foto - opcional con initials fallback"]
    C --> F["Comuna principal - autocomplete SANTIAGO_COMUNAS"]
    C --> G["Especialidades - multi-select 50+ opciones"]

    D --> H["Crea service_provider"]
    H --> H1["provider_type: individual"]
    H --> H2["provider_plan: provider_free"]
    H --> H3["is_directory_visible: false"]
    H --> H4["status: pending"]

    H --> I["Toast: Perfil al 40% - completar para directorio"]
    I --> J["Redirige a /provider/dashboard"]
```

### 14c. Registro Veterinario Completo (/registro-veterinario)

```mermaid
flowchart TD
    A["Landing /para-veterinarios o directo"] --> B["RegistroVeterinario - publico sin login"]
    B --> PROG["Barra progreso 4 pasos"]

    PROG --> S1["Paso 1: Tipo de practica"]
    S1 --> S1A["Individual"]
    S1 --> S1B["Domicilio"]
    S1 --> S1C["Clinica"]

    S1 --> S2["Paso 2: Crear cuenta"]
    S2 --> S2A["Nombre display"]
    S2 --> S2B["Email"]
    S2 --> S2C["Password min 6 chars"]
    S2 --> S2D["Telefono"]
    S2 --> S2E["Numero matricula Colmevet"]

    S2 --> S3["Paso 3: Perfil profesional"]
    S3 --> S3A["Bio minimo 50 caracteres"]
    S3 --> S3B["Especialidades multi-select"]
    S3 --> S3C["Comuna principal"]
    S3 --> S3D["Areas de servicio por zona"]
    S3 --> S3E["Anos de experiencia"]
    S3 --> S3F["Precio desde"]

    S3 --> S4["Paso 4: Exito"]
    S4 --> S4A["Muestra slug generado"]
    S4 --> S4B["Link directo al dashboard"]
    S4B --> VD["Redirige a /provider/dashboard"]
```

### 14d. Tutorial Carousel (OnboardingTutorial)

```mermaid
flowchart TD
    A["Usuario llega a /home o /feed"] --> B{"localStorage hasSeenTutorial?"}
    B -->|No existe| C["Muestra Tutorial Carousel"]
    B -->|Existe| D["Contenido normal"]

    C --> S1["Slide 1: Bienvenido a Paw Friend"]
    S1 --> S1D["Salud de mascotas, servicios, rewards"]

    C --> S2["Slide 2: Agrega tu mascota"]
    S2 --> S2D["Perfil + foto + ficha clinica = +50 PawPoints"]
    S2 --> S2CTA["CTA: Agregar mascota"]

    C --> S3["Slide 3: Explora servicios"]
    S3 --> S3D["Paseadores, vets, cuidadores, entrenadores verificados"]
    S3 --> S3CTA["CTA: Ver servicios"]

    C --> S4["Slide 4: Gana rewards"]
    S4 --> S4D["Acciones = PawPoints = beneficios"]
    S4 --> S4CTA["CTA: Ver Paw Game"]

    C --> SKIP["Boton: Saltar tutorial"]

    S4CTA --> DONE["localStorage: hasSeenTutorial = true"]
    SKIP --> DONE
    DONE --> D
```

### 14e. Home Onboarding Hints (sin mascotas)

```mermaid
flowchart TD
    A["Home Dashboard cargado"] --> B{"0 mascotas AND not dismissed?"}
    B -->|Si| C["HomeOnboardingHints - 3 tarjetas"]
    B -->|No| D["Home completo sin hints"]

    C --> H1["Tarjeta 1: Agrega tu primera mascota"]
    H1 --> H1D["Perfil con foto, raza, datos medicos + PawPoints"]
    H1 -->|CTA| H1N["/my-pets"]

    C --> H2["Tarjeta 2: Crea tu primer recordatorio"]
    H2 --> H2D["Vacunas, desparasitacion, controles"]
    H2 -->|CTA| H2N["/reminders"]

    C --> H3["Tarjeta 3: Encuentra vet en tu comuna"]
    H3 --> H3D["Veterinarios verificados cerca de ti"]
    H3 -->|CTA| H3N["/veterinarios"]

    C --> DISMISS["Boton X dismiss"]
    DISMISS --> STORE["localStorage: pf_home_onboarding_dismissed"]
    STORE --> D
```

### 14f. QR Landing — Onboarding contextual (/qr/:token)

```mermaid
flowchart TD
    A["Alguien escanea QR de mascota"] --> B["QRLanding.tsx carga"]
    B --> C["Busca mascota por qr_token"]
    C --> D{"Encontrada?"}
    D -->|No| E["Error: QR invalido"]
    D -->|Si| F{"Usuario logueado?"}

    F -->|No| G["Muestra info basica publica"]
    G --> H["CTA: Inicia sesion para ver mas"]
    H --> I["Login con returnTo=/qr/:token"]
    I --> J["Post-login vuelve a QR Landing"]

    F -->|Si| K{"Rol del usuario?"}
    K -->|"Vet verificado"| L["Acceso ficha completa"]
    L --> L1["Registra relacion vet-mascota"]
    L --> L2["Redirige a ficha clinica"]

    K -->|"Dueno de la mascota"| M["Redirige a su ficha clinica"]

    K -->|"Otro usuario"| N["Muestra info basica publica"]
```

### 14g. PawGame Tutorial

```mermaid
flowchart TD
    A["Usuario entra a /paw-game"] --> B{"localStorage hasSeenPawGameTutorial?"}
    B -->|No existe| C["Dialog modal tutorial"]
    B -->|Existe| D["Contenido PawGame directo"]

    C --> E["Explica sistema de gamificacion"]
    E --> E1["Streaks: racha diaria de acciones"]
    E --> E2["Niveles Guardian: progreso general"]
    E --> E3["Badges: logros desbloqueables"]
    E --> E4["Misiones: objetivos con recompensa"]
    E --> E5["PawPoints: moneda para rewards"]

    C --> F["Boton: Entendido! Empecemos"]
    F --> G["localStorage: hasSeenPawGameTutorial = true"]
    G --> D
```

### 14h. OCR Carnet de Vacunas (onboarding de datos medicos)

```mermaid
flowchart TD
    A["AddPet - despues de crear mascota"] --> B["Seccion VaccinationCardOCR"]
    B --> C{"Sube foto carnet?"}
    C -->|No| D["Continua sin OCR"]
    C -->|Si| E["Valida archivo"]

    E --> F{"Formato OK? JPG/PNG/HEIC max 10MB"}
    F -->|No| G["Error: formato no soportado"]
    F -->|Si| H{"Rate limit? 3 scans/dia"}
    H -->|Excedido| I["Error: limite diario alcanzado"]
    H -->|OK| J["Convierte a base64"]

    J --> K["Edge Function: ocr-vaccination-card"]
    K --> L["Extrae datos estructurados"]
    L --> L1["Vacunas: nombre, fecha, lote"]
    L --> L2["Desparasitaciones"]
    L --> L3["Notas adicionales"]

    L --> M["Preview editable"]
    M --> N["Usuario revisa y confirma"]
    N --> O["INSERT medical_records por cada item"]
    O --> P["Toast: Datos importados exitosamente"]
```

---

## 15. Arquitectura General — Vista de alto nivel

```mermaid
flowchart TD
    subgraph Frontend["Frontend - React 18 + Vite 5"]
        P["Pages 35+"] --> CO["Components 60+"]
        CO --> UI["shadcn/ui 50+"]
        P --> HK["Hooks 30+"]
        HK --> SB["Supabase Client"]
    end

    subgraph Backend["Backend - Supabase"]
        SB --> AUTH["Auth"]
        SB --> DB[("PostgreSQL")]
        SB --> ST["Storage"]
        SB --> RT["Realtime"]
        SB --> EF["Edge Functions 17"]
    end

    subgraph EdgeFunctions["Edge Functions 17"]
        EF --> AI["IA: pet-assistant, breed-tips, medical-suggestions"]
        EF --> PAY["Flow.cl: create-subscription, webhook"]
        EF --> GCal["Google Calendar: oauth, sync, disconnect"]
        EF --> WA["WhatsApp: send-reminder pendiente Meta"]
        EF --> PDF["generate-medical-summary, generate-medical-zip"]
        EF --> SEO_F["generate-sitemap"]
        EF --> OTHER_EF["moderate-service-promotion, generate-shelters, reminder-cron"]
    end

    subgraph Mobile["Mobile - Capacitor 7"]
        CAP["Capacitor"] --> AND["Android"]
        CAP --> IOS["iOS"]
    end

    subgraph Deploy["Deploy"]
        VB["Vite Build"] --> DOCS["docs/"]
        DOCS --> GHP["GitHub Pages - pawfriend.cl"]
    end

    Frontend --> Mobile
    Frontend --> Deploy
```

---

## 16. Flujo completo del usuario — Journey Dueno

```mermaid
flowchart LR
    A["Auth"] --> B["Onboarding Dueno Minimal"]
    B --> C["Crea mascota rapido"]
    C --> D["Home"]
    D --> T["Tutorial Carousel 4 slides"]
    T --> MAIN["Home completo"]

    subgraph NAV["BottomTabBar 5 tabs"]
        direction TB
        T1["Inicio"]
        T2["Mascotas"]
        T3["Vets"]
        T4["Recordatorios"]
        T5["Perfil"]
    end

    MAIN --> T1
    MAIN --> T2
    MAIN --> T3
    MAIN --> T4
    MAIN --> T5

    T1 --> ALERTS["Alertas salud primero"]
    T1 --> STATUS["Status cards: cita, vacunas, ficha"]
    T1 --> QUICK["Acciones rapidas"]

    T2 --> E["Ficha clinica"]
    E --> K["PDF descargable"]
    E --> L["QR compartir + descargar"]
    E --> OCR["OCR carnet vacunas"]

    T3 --> G["Buscar vet por comuna"]
    G --> M["Reservar consulta"]
    M --> N["Dejar resena"]

    T4 --> F["Recordatorios con badge"]
    F --> O["Google Calendar sync"]

    T5 --> SET["Settings + integraciones"]

    QUICK --> P["Upgrade Premium"]
    P --> Q["Flow.cl pago"]
    Q --> R["Mascotas ilimitadas + PDF + compartir"]
```

---

## 17. Flujo completo del usuario — Journey Veterinario

```mermaid
flowchart LR
    A1["Landing /para-veterinarios"] --> B1["Registro Veterinario 4 pasos"]
    A2["Auth directo"] --> B2["Onboarding Vet Minimal"]

    B1 --> D["Provider Dashboard"]
    B2 --> D

    D --> E["Completar perfil 80% para directorio"]
    D --> F["Lista pacientes"]
    D --> G["Seguimientos 7 dias"]
    D --> H["Fichas compartidas"]
    D --> I["Balance y stats"]
    D --> EDIT["Editar perfil pro"]
    EDIT --> PREV["Ver como me ven los duenos"]

    F --> J["Nuevo paciente + invitar dueno"]
    F --> K["Nota clinica + plantilla"]
    K --> L["Trigger: review + recordatorio"]

    E --> M["Aparece en directorio publico"]
    M --> N["Recibe reservas"]
    M --> O["Recibe mensajes chat"]

    P["Vet escanea QR mascota"] --> Q["QR Landing"]
    Q --> R["Acceso ficha completa + registra relacion"]
```

---

## Instrucciones de uso

1. Ir a [mermaid.live](https://mermaid.live)
2. Borrar todo el contenido del editor izquierdo
3. Copiar SOLO las lineas entre las marcas de codigo (sin incluir la linea que dice mermaid ni los backticks)
4. Pegar en el editor
5. El diagrama se renderiza automaticamente a la derecha
6. Exportar como PNG o SVG con los botones de arriba
