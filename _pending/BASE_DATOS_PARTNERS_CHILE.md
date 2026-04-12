# Base de Datos de Partners y Servicios para Mascotas en Chile

> **Objetivo**: Directorio publico de negocios y organizaciones que pueden alimentar el directorio de Paw Friend, integrarse como partners, o poblar datos de Maps/Places.
> **Fecha**: 2026-04-12
> **Compatibilidad**: Tablas `service_providers`, `adoption_shelters`, `partners` de Supabase + Leaflet maps (lat/lng).

---

## Convenciones

| Icono | Significado |
|---|---|
| :white_check_mark: | Datos de contacto verificados via web |
| :warning: | Datos parciales (falta telefono, email o geodatos) |
| :globe_with_meridians: | Tiene API o datos scrapables |
| :x: | Sitio caido o sin datos utiles |

---

## 1. Veterinarias y Clinicas Veterinarias

### 1.1 Fuentes oficiales (registros publicos)

| Fuente | URL | Campos disponibles | Formato | Cobertura | Notas |
|---|---|---|---|---|---|
| **SAG — Registro MVA** :globe_with_meridians: | https://www.sag.gob.cl/ambitos-de-accion/medicos-veterinarios/registros | Nombre, RUT, region/zona | Excel (.xlsx) descargable | Nacional (3 macrozonas) | **Mejor fuente oficial**. 3 archivos: Norte, Centro, Sur. Actualizado abril 2026 |
| **Colmevet** :warning: | https://intranet.colegioveterinario.cl/publico/colegiados | Nombre, especialidad, region | HTML (posible scraping) | Nacional (~8.000+ colegiados) | Registra profesionales, no establecimientos |
| **Wikipedia — Centros Publicos** :warning: | https://es.wikipedia.org/wiki/Anexo:Centros_m%C3%A9dicos_veterinarios_p%C3%BAblicos_en_Chile | Nombre, comuna, estado | HTML tabla | Nacional (~50+ centros) | Solo establecimientos publicos/municipales |

### 1.2 Directorios privados

| Fuente | URL | Campos | Cobertura | Scrapable |
|---|---|---|---|---|
| **InfoClinicasVeterinarias.cl** | https://www.infoclinicasveterinarias.cl/ | Nombre, direccion, telefono, comuna | Nacional | Si (HTML) |
| **Paginas Amarillas** :globe_with_meridians: | https://www.amarillas.cl/chile/servicios/clinicas-veterinarias | Nombre, telefono, direccion, mapa | Nacional | Si (HTML) |
| **ElAmigoVet.com** | https://elamigovet.com/santiago/ | Nombre, especialidad, 24h, mapa, telefono | Santiago | JS render requerido |

### 1.3 APIs con geodatos

| API | URL docs | Place types | Campos | Costo | Notas |
|---|---|---|---|---|---|
| **Google Places API** :globe_with_meridians: | https://developers.google.com/maps/documentation/places/web-service | `veterinary_care` | Nombre, direccion, lat/lng, telefono, web, horarios, rating, fotos | ~$32 USD / 1.000 requests | **Mejor fuente para geodatos**. Grilla de ~50-100 puntos para cubrir Chile |
| **OpenStreetMap / Overpass** :globe_with_meridians: | https://overpass-turbo.eu/ | `[amenity=veterinary]` | Nombre, lat/lng, direccion parcial | Gratis, sin API key | ~200-500 vets etiquetados en Chile. Complementario |
| **2GIS Chile** :globe_with_meridians: | https://2gis.cl/ | Veterinarias | Nombre, direccion, telefono, lat/lng, horarios | API disponible | Buena densidad en Santiago |

---

## 2. Tiendas de Mascotas / Pet Shops

### 2.1 SuperZoo (cadena lider — 29 sucursales) :white_check_mark:

**Contacto general**: ventas@superzoo.cl | +56 2 2760 7777 | Lun-Dom 9:00-20:00
**Web**: https://www.superzoo.cl/tiendas

| # | Sucursal | Direccion | Comuna | Telefono |
|---|---|---|---|---|
| 1 | SuperZoo Ahumada | Ahumada 327 | Santiago | +56 9 7109 5758 |
| 2 | SuperZoo Nunoa | Av. Salvador 1822, Local 6 | Nunoa | +56 9 9542 0629 |
| 3 | SuperZoo Portal El Llano | Av. El Llano Subercaseaux 3519 A, local 2002 | San Miguel | +56 9 9542 0392 |
| 4 | SuperZoo Alferez Real | Av. Manuel Montt 1141 | Providencia | +56 9 9991 3361 |
| 5 | SuperZoo Providencia | Av. Providencia 1275 | Providencia | +56 9 3863 9973 |
| 6 | SuperZoo San Miguel | Av. Salvador Allende 1334, Local 2 | San Miguel | +56 9 9542 0186 |
| 7 | SuperZoo Portal Nunoa | Av. Jose Pedro Alessandri 1166, local 2008 | Nunoa | +56 9 9448 9701 |
| 8 | SuperZoo Costanera Center | Av. Andres Bello 2447, local 280 | Providencia | +56 9 9426 6986 |
| 9 | SuperZoo Colon | Av. Cristobal Colon 4455, Local A | Las Condes | +56 9 9391 4767 |
| 10 | SuperZoo Plaza Egana | Av. Larrain 5862 | La Reina | +56 9 3446 4401 |
| 11 | SuperZoo Florida Center | Av. Vicuna Mackenna 6100, local 119 | La Florida | +56 9 9423 0828 |
| 12 | SuperZoo Lo Castillo | Vitacura 3790 | Vitacura | +56 9 9093 6605 |
| 13 | SuperZoo La Reina | Monsenor Edwards 872 | La Reina | +56 9 9543 9595 |
| 14 | SuperZoo Parque Arauco | Av. Kennedy 5413, local 69, nivel -2 | Las Condes | +56 9 9141 8757 |
| 15 | SuperZoo Plaza Vespucio | Av. Vicuna Mackenna 7110, Local A-110 | La Florida | +56 9 6541 2569 |
| 16 | SuperZoo San Pio | Pio XI 1715, locales 3 y 4 | Vitacura | +56 9 9620 9728 |
| 17 | SuperZoo Mall Plaza Oeste | Av. Americo Vespucio 1501 | Cerrillos | +56 9 3371 3855 |
| 18 | SuperZoo Arauco Maipu | Av. Americo Vespucio 399, local 06 | Maipu | +56 9 6680 4134 |
| 19 | SuperZoo Penalolen | Av. Los Presidentes 7728 | Penalolen | +56 9 9542 0282 |
| 20 | SuperZoo Rotonda Atenas | Av. Pdte. Sebastian Pinera E. 996 | Las Condes | +56 9 3218 3610 |
| 21 | SuperZoo Ossandon | Carlos Ossandon 1300, Local 2 | La Reina | +56 9 3862 2459 |
| 22 | SuperZoo Cobres de Vitacura | Av. Vitacura 6640 | Vitacura | +56 9 4469 9095 |
| 23 | SuperZoo Cenco La Reina | Av. Francisco Bilbao 8750, local 2057 | Las Condes | — |
| 24 | SuperZoo Pedro Fontova | Av. Pedro Fontova 7571, locales 2 y 3 | Huechuraba | +56 9 9093 6560 |
| 25 | SuperZoo Pajaritos | Av. Los Pajaritos 2310 | Maipu | +56 9 4465 7263 |
| 26 | SuperZoo Arauco Quilicura | Av. Bernardo O'Higgins 581 | Quilicura | +56 9 3234 5514 |
| 27 | SuperZoo Chesterton | Av. Padre Hurtado Central 415 | Las Condes | +56 9 9991 3367 |
| 28 | SuperZoo Alto Las Condes | Av. Kennedy 9001, local 2102 | Las Condes | +56 9 9449 5607 |
| 29 | SuperZoo Los Quillayes | Av. Vicuna Mackenna 10811 | La Florida | +56 9 3922 2304 |

### 2.2 Petco Chile :warning:

**Web**: https://www.petco.cl/ | **Telefono**: +56 2 3321 6799
- Mall Los Dominicos, Las Condes
- Patio Andino (2 tiendas fisicas al 2026)

### 2.3 Otras cadenas y tiendas online

| Tienda | Web | Tipo | Contacto |
|---|---|---|---|
| PetHappy | https://pethappy.cl/ | Fisico + online | Sucursales en Las Condes, Maipu, La Florida, Nunoa, Puente Alto |
| Petlandia Chile | https://petlandiachile.cl/ | Online + fisico | — |
| RedPet | https://redpet.cl/nuestras-tiendas/ | Fisico + online | Ver web para sucursales |
| PetStore Chile | https://petstorechile.cl/ | Online | — |
| Best for Pets | https://bestforpets.cl/ | Online (Royal Canin) | — |
| Distribuidora Lira | https://www.distribuidoralira.cl/ | Mayorista premium | — |
| Braloy | https://braloy.cl/ | Online | — |
| Miscota Chile | https://cl.miscota.com/ | Online | — |

---

## 3. Refugios y Hogares de Adopcion

### 3.1 Fundaciones con contacto verificado :white_check_mark:

| Fundacion | Web | Telefono | Email | Region | Instagram |
|---|---|---|---|---|---|
| **Fundacion Alma Chile** | https://www.fundacionalmachile.com/ | +56 9 8484 9152 | contacto@fundacionalmachile.com | R.M. (Paine) | @fundacionalmachile |
| **Fundacion ARCA** | https://fundacionarca.cl/ | — | contacto@fundacionarca.cl | Nacional | @fundacion_arca |
| **Chile Mestizo** | https://chilemestizo.cl/ | — | chilemestizo@gmail.com | Nacional | @fundacionchilemestizo |
| **Fundacion Huella Animal** | https://www.fundacionhuellaanimal.cl/ | — | — | Nacional (desde 2015) | @fundacionhuellaanimalchile |
| **Fundacion Ayuda Callejeros** | https://www.fundacionayudacallejeros.cl/ | — | ayuda.callejerosong@gmail.com / soniaurrutia@ayudacallejeros.cl | R.M. | — |
| **Fundacion Esperanza Animal** | https://www.esperanzaanimal.cl/ | — | — | Nacional | — |
| **Patas Arriba** | https://patasarriba.cl/ | — | — | Nacional | — |

### 3.2 Fundaciones desde PetFi :warning:

**Fuente**: https://petfi.io/fundaciones (~70 organizaciones listadas)

| Fundacion | Region | Animales rescatados | Notas |
|---|---|---|---|
| Fundacion VYRA | R.M. | 35 | Adopcion responsable |
| Accion Animalista Frutillar | Los Lagos | 21 | Recuperacion fisica y emocional |
| Santuario Emilia | Valparaiso | 5 | Especialidad: gatos ancianos, cronicos, ciegos |
| Fundacion Alma Animal Peumayen | Valparaiso | 4 | Esterilizacion + adopcion |
| Fundacion ARACOL | Maule | 4 | Perros y gatos abandonados |
| Santuario Esperanza de Vida | Valparaiso | 170+ perros, 135+ gatos | Condiciones cronicas |
| Kuppa | Los Lagos | 3 | Tenencia responsable |

> **Nota**: PetFi no publica telefono/email en el listado. Se necesita scraping individual de cada perfil o contacto directo.

### 3.3 Caniles municipales :warning:

No existe directorio centralizado. Fuentes por municipio:

| Municipio | URL | Notas |
|---|---|---|
| Las Condes | https://www.lascondes.cl/servicios/mascotas/caniles/ | Canil municipal activo |
| Santiago Centro | https://www.munistgo.cl/tag/canil/ | — |
| Nunoa (CRC) | https://adopcionescrcnunoa.cl/ | Centro de Rescate y Cuidado |

> **Accion requerida**: Scrapear ~100-150 sitios municipales para construir directorio completo.

---

## 4. Seguros de Mascotas

### 4.1 Aseguradoras con contacto verificado :white_check_mark:

| Aseguradora | Web | Telefono | Email | Precio desde/mes | Rating | Notas |
|---|---|---|---|---|---|---|
| **Cacttus** | https://www.cacttus.cl | — | soporte@cacttus.cl | $11.600 | 4.5/5 (1.240 reviews) | 3 planes: Mini (60%), Care (70%), Care+ (90%). App iOS/Android. IG: @cacttus.cl |
| **WOOF!** | https://www.woof.cl | +56 2 2712 0483 (24/7) | contacto@woofinsurtech.com | $18.950 | 4.3/5 (560 reviews) | Oficina: Cerro El Plomo 5555, Of. 402, Las Condes. IG: @woofseguros |
| **Pawer** | https://www.somospawer.com | +56 9 9879 2181 (WhatsApp) | — | $14.900 | 4.2/5 (290 reviews) | Opera en CL, PE, ES, MX. IG: @somospawer |
| **Amerins** | https://www.amerins.cl | — | — | $28.212 | 4.3/5 (180 reviews) | Sitio con acceso restringido |
| **BCI Seguros (Pata Segura)** | https://www.bciseguros.cl | — | — | $3.890 | 4.2/5 (890 reviews) | Via BCI |
| **MACH Mascotas** | — | — | — | $3.317 | — | Mas economico del mercado |

### 4.2 Otras aseguradoras (datos parciales)

| Aseguradora | Precio aprox/mes | Notas |
|---|---|---|
| Zenit Seguros | — | — |
| Southbridge | — | — |
| CuidaPet 360 | ~$10.416 ($124.990/ano) | — |
| Seguros SURA | — | — |
| Scotiabank Pet (BNP Paribas Cardif) | $19.896 | — |
| Seguros Falabella | — | — |
| Corredora Security | — | — |
| Coopeuch | — | — |

### 4.3 Comparadores

| Comparador | URL | Notas |
|---|---|---|
| **SeguerosMascotas.cl** | https://www.segurosmascotas.cl/ | 15 aseguradoras comparadas. Email: hola@segurosmascotas.cl |
| **QuePlan.cl** | https://queplan.cl/Comparar/Seguros-Mascotas | Cotizacion directa |

---

## 5. Crematorios y Cementerios de Mascotas

### 5.1 Establecimientos con contacto completo :white_check_mark:

| Establecimiento | Direccion | Comuna | Telefonos | Email | Web | Horario |
|---|---|---|---|---|---|---|
| **Crematorio Las Nubes** | Santa Ines 3683 + Of. Cerro El Plomo 5931, Of. 51 | Isla de Maipo / Las Condes | +56 9 3923 4982, +56 9 4402 0767 | contacto@crematoriolasnubes.cl | https://crematoriolasnubes.cl/ | Lun-Vie 8-22h, Sab-Dom 10-19h |
| **Eternapet** | La Pintana | R.M. + V Region | +56 9 6161 0035, +56 9 9951 6646 | contacto@eternapet.cl | https://eternapet.cl/ | — |
| **INERS** | — | R.M. | +56 9 8435 4474, +56 9 8341 9634, +56 2 2738 7020 | iners@terra.cl | https://iners.cl/ | — |
| **Memory Pet** | Camino El Noviciado Norte, Parcela Los Aromos, Lote E-2 | Lampa | +56 9 9445 4696 | info@memorypet.cl | https://www.memorypet.cl/ | — |
| **Almascotas** | Av. Apoquindo 6410 | Las Condes | +56 9 8240 9076 (gral), +56 9 9517 7776 (urg) | almascotascremacion@gmail.com | https://almascotas.cl/ | Lun-Vie 9-17h (emergencias 24/7) |
| **Cementerio del Pilar** | Rungue, Km 55 Ruta 5 Norte | Til-Til | +56 9 8690 6291, +56 9 4242 7681 | — | https://www.cementeriodelpilar.cl/ | 24 horas, 7 dias |
| **Crematorio El Canelo** | — | Santiago | +56 9 9228 0977 | info@crematorioelcanelo.cl | — | — |

**Redes sociales verificadas**:
- Las Nubes: IG @crematoriolasnubes, FB /crematoriolasnubes
- INERS: IG @crematorio_iners, FB /crematorioiners
- Almascotas: IG @almascotas, FB /cremaciondemascotasAlmascotas
- Cementerio del Pilar: IG @cementerioycrematoriodelpilar

---

## 6. Transporte de Mascotas

| Empresa | Web | Telefono | Email | Cobertura | RRSS |
|---|---|---|---|---|---|
| **Pets Travel** :white_check_mark: | https://petstravel.cl/ | +56 9 4982 2410 | petstravelspa@gmail.com | Arica — Patagonia | IG: @petstravel.cl |
| **Pet Travel Chile** | https://www.pettravelchile.com/ | — | — | Nacional + internacional | — |
| **Petlogistics** | https://www.petlogistics.cl/ | — | — | Nacional | Sitio 404 |
| **Travel Mascotas** | https://www.travelmascotas.cl/ | — | — | Nacional | — |
| **Interfamily** | https://www.interfamily.cl/ | — | — | Internacional | — |
| **Trans Animal Cargo** | https://transanimalcargo.com/ | — | — | Nacional | — |
| **Woof Airlines** | https://www.woofairlines.com/ | — | — | Internacional | — |

---

## 7. Entrenadores / Adiestradores Caninos

| Empresa | Web | Email | Telefono | Cobertura | RRSS |
|---|---|---|---|---|---|
| **Educandogs** :white_check_mark: | https://www.educandogs.cl/ | contacto@educandogs.cl, educandogschile@gmail.com | — | Nacional (Santiago, Concepcion, Punta Arenas, Valparaiso) | IG: @jib_educandogs |
| **Adiestramiento.cl** | https://www.adiestramiento.cl/ | — | — | — | — |
| **AdiestramientoCaninoChile** | https://adiestramientocaninochile.cl/ | — | — | Por zona | — |
| **Kiltritos** | https://www.kiltritos.cl/ | — | — | Santiago | — |
| **GAG K9** | https://www.gagk9.cl/ | — | — | Certificados | — |

---

## 8. Peluquerias Caninas / Grooming

### Fuentes de directorio

| Fuente | URL | Cantidad aprox | Campos | Cobertura |
|---|---|---|---|---|
| **2x3.cl** :globe_with_meridians: | https://www.2x3.cl/servicios/peluqueria-canina-perro | Cientos | Nombre, ubicacion, servicios | Nacional por region |
| **PetBacker** :globe_with_meridians: | https://www.petbacker.es/s/cuidador-de-mascotas-en-tu-casa/chile | 1.674 cuidadores | Nombre, foto, rating, precio, comuna | Chile |

---

## 9. Paseadores de Perros

| Fuente | URL | Cantidad | Campos | Cobertura |
|---|---|---|---|---|
| **PetBacker** :globe_with_meridians: | https://www.petbacker.es/s/paseadores-de-perros/chile | 1.241 paseadores | Nombre, rating, precio, comuna | Chile |
| **2x3.cl** | https://www.2x3.cl/ (buscar "paseador") | Variable | Nombre, ubicacion | Nacional |

---

## 10. Hoteles y Pensiones de Mascotas

| Fuente / Hotel | URL | Telefono | Email | Ubicacion |
|---|---|---|---|---|
| **PetBacker — Alojamientos** :globe_with_meridians: | https://www.petbacker.es/s/alojamiento-de-perros/chile | — | — | 307 alojamientos en Chile |
| **Altopet Hotel Canino** | https://www.altopet.cl/ | — | — | R.M. |
| **La Quinta Hotel Canino** | https://quintahotel.cl/ | — | — | R.M. |

---

## 11. Registros de Mascotas (contexto)

| Plataforma | URL | Datos | Notas |
|---|---|---|---|
| **RENMASCOTAS** (oficial) | https://registratumascota.cl/ | 1.529.576 mascotas registradas (1.218.182 perros + 311.394 gatos) | Registro estatal. No es directorio de negocios |
| **DATAPET** | https://www.datapet.cl/ | Registro de microchips privado | Scrapable para microchip lookup |
| **Registro Civil de Mascotas** | https://www.registrocivildemascotas.cl/ | Plataforma unificadora de bases de chips | — |

---

## 12. Fuentes transversales (APIs y directorios multi-categoria)

### 12.1 APIs recomendadas para poblar el directorio

| API | Categorias que cubre | Campos clave | Costo | Prioridad |
|---|---|---|---|---|
| **Google Places API** | Todas | nombre, direccion, lat/lng, telefono, web, horarios, rating, fotos | ~$32 USD / 1K requests | **#1 — Mejor fuente general** |
| **OpenStreetMap / Overpass** | Vets, tiendas, refugios | nombre, lat/lng, direccion parcial | Gratis | #2 — Complemento para geodatos |
| **2GIS Chile** | Todas (Santiago) | nombre, direccion, telefono, lat/lng, horarios | API disponible | #3 — Buena densidad urbana |
| **PetBacker** | Paseadores, grooming, hoteles | nombre, rating, precio, comuna | Sin API publica (scraping) | #4 — Unica fuente masiva de servicios pet |

### 12.2 Directorios generales

| Directorio | URL | Categorias | Campos |
|---|---|---|---|
| **Paginas Amarillas** | https://www.amarillas.cl/ | Vets, tiendas, servicios | Nombre, telefono, direccion, mapa |
| **2x3.cl** | https://www.2x3.cl/ | Grooming, paseadores, adiestramiento | Nombre, ubicacion, servicios |

---

## 13. Plan de accion para poblar Paw Friend

### Prioridad 1 — Datos gratuitos e inmediatos

| Accion | Fuente | Tabla destino | Registros estimados |
|---|---|---|---|
| Descargar Excel SAG MVA (3 macrozonas) | SAG | `service_providers` | ~8.000+ profesionales |
| Scraping Paginas Amarillas — veterinarias | amarillas.cl | `service_providers` | ~2.000-5.000 |
| Scraping SuperZoo store finder | superzoo.cl | `partners` (category: store) | 29 |
| Insertar refugios verificados manualmente | Fundaciones individuales | `adoption_shelters` | ~20-30 |

### Prioridad 2 — APIs con costo moderado

| Accion | Fuente | Tabla destino | Costo estimado |
|---|---|---|---|
| Google Places grid search Chile | Places API | Todas las tablas | ~$50-150 USD (una vez) |
| Overpass API veterinarias + pet shops | OSM | Enriquecer geodatos | Gratis |

### Prioridad 3 — Scraping avanzado

| Accion | Fuente | Tabla destino |
|---|---|---|
| Scraping PetBacker perfiles | petbacker.es | `service_providers` (walkers, groomers, sitters) |
| Scraping PetFi fundaciones individual | petfi.io | `adoption_shelters` |
| Scraping sitios municipales caniles | ~100-150 municipios | `adoption_shelters` |

### Prioridad 4 — Partnerships directos

| Accion | Contacto | Tabla destino |
|---|---|---|
| Contactar aseguradoras para partnership | Emails verificados arriba | `partners` (category: insurance) |
| Contactar cadenas pet shop | SuperZoo, Petco, PetHappy | `partners` (category: store) |
| Contactar crematorios para directorio | Emails verificados arriba | Nuevo tipo en `service_providers` o `partners` |

---

## 14. Mapeo a tablas Supabase existentes

### `service_providers` — Veterinarias, groomers, paseadores, entrenadores

```
Campos relevantes del directorio → columna Supabase:
- Nombre           → display_name
- Direccion        → address
- Comuna           → commune
- Ciudad           → city
- Telefono         → public_phone
- Email            → public_email
- Web              → (nuevo campo o via slug + perfil)
- Lat/Lng          → latitude, longitude
- Especialidades   → specialties[]
- Tipo             → provider_type ('individual' | 'home_visit' | 'clinic')
- Verificado       → is_verified (false hasta verificacion manual)
- Visible          → is_directory_visible (true para datos publicos)
```

### `adoption_shelters` — Refugios, fundaciones, caniles

```
Campos relevantes → columna Supabase:
- Nombre           → name
- Tipo             → type ('refugio' | 'fundacion' | 'ong' | 'independiente')
- Direccion        → address
- Comuna           → commune
- Ciudad           → city
- Telefono         → contact_phone
- Email            → contact_email
- Web              → website
- RRSS             → social_media (JSONB: { instagram, facebook })
- Lat/Lng          → latitude, longitude
- Especies         → animal_types[]
```

### `partners` — Seguros, cadenas de tiendas, marcas

```
Campos relevantes → columna Supabase:
- Nombre           → brand_name
- Link             → ad_link
- Categoria        → category ('insurance' | 'store' | 'clinic' | 'adoption' | 'food' | 'general')
- Placement        → placement ('services' | 'map' | 'home')
- Activo           → is_active
```

> **Nota**: La tabla `partners` no tiene campos para telefono, email ni geodatos. Si se quiere usar como directorio de negocios (no solo ads), se necesita **migracion** para agregar: `contact_phone`, `contact_email`, `latitude`, `longitude`, `address`, `commune`.

---

## 15. Campos faltantes en el esquema actual

Para que este directorio sea 100% compatible con la app, se necesitan estos campos adicionales:

### En `partners` (migracion requerida)

| Campo nuevo | Tipo | Justificacion |
|---|---|---|
| `contact_phone` | TEXT | Telefono publico del partner |
| `contact_email` | TEXT | Email publico del partner |
| `website` | TEXT | URL del sitio web (separado de `ad_link` que es el link del ad) |
| `address` | TEXT | Direccion fisica |
| `commune` | TEXT | Para filtro por comuna |
| `city` | TEXT | Ciudad |
| `latitude` | FLOAT | Para mostrar en mapa |
| `longitude` | FLOAT | Para mostrar en mapa |

### En `service_providers` (ya existentes, OK)

Todos los campos necesarios ya existen. Solo falta poblar datos reales.

---

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-04-12 | Creacion inicial con 12 categorias, datos verificados via web |
