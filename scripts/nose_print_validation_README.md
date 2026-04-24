# Nose Print Validation — Instrucciones

Script que valida si biometría nasal distingue correctamente mascotas distintas en fotos reales chilenas. Parte de **Fase -1 del Refactor Maestro** — ver [FASE_-1_VALIDACION_2026_04_24.md](../_pending/FASE_-1_VALIDACION_2026_04_24.md).

## Qué hace

1. Carga fotos de nariz organizadas por mascota
2. Usa modelo MobileNetV3 pre-entrenado para extraer embeddings (vectores numéricos)
3. Calcula similitud coseno entre fotos:
   - **Same-pet pairs**: ¿reconoce al mismo animal en fotos distintas?
   - **Cross-pet pairs**: ¿evita confundir animales distintos?
4. Produce reporte con accuracy + recomendación GO/NO-GO

## Requisitos

- Python 3.10+ (verificar con `python --version` o `python3 --version`)
- ~500 MB de espacio (modelo MobileNetV3 se descarga al primer run)
- 2–5 min de ejecución

## Setup (1 vez)

### Windows PowerShell

```powershell
# Desde la raíz del repo
python -m venv .venv-nose-print
.\.venv-nose-print\Scripts\Activate.ps1
pip install -r scripts/requirements_nose_print.txt
```

### macOS / Linux

```bash
cd ~/Desktop/pet-harmony-chile-main
python3 -m venv .venv-nose-print
source .venv-nose-print/bin/activate
pip install -r scripts/requirements_nose_print.txt
```

## Preparar las fotos

1. Crear la estructura de carpetas:

```
_pending/nose_print_test_photos/
├── kai/         # Nombre de la primera mascota
│   ├── foto1.jpg
│   ├── foto2.jpg
│   └── foto3.jpg
├── ema/
│   ├── 1.jpg
│   └── 2.jpg
├── otto/
│   └── ...
├── luna/
│   └── ...
└── coco/
    └── ...
```

2. **Mínimo 3 fotos por mascota**, idealmente 5. Formato JPG, PNG o WebP.

3. **Buenas prácticas al fotografiar**:
   - Distancia 15–20 cm de la nariz
   - Luz natural (cerca de ventana)
   - Enfoque nítido (toca la pantalla sobre la nariz)
   - Sin filtros ni edición
   - 3 frontales + 1 ligera izquierda + 1 ligera derecha
   - Si es posible, 2 sesiones separadas (día 1 + día 2) para mayor realismo

4. **La carpeta `_pending/nose_print_test_photos/` está en `.gitignore`** — las fotos NUNCA se committean.

## Correr el script

```bash
# Con el entorno virtual activado
python scripts/nose_print_validation.py
```

Output en terminal:
```
NOSE PRINT VALIDATION — Fase -1 Refactor Maestro Paw Friend
====================================================================
[OK] kai: 5 fotos
[OK] ema: 4 fotos
[OK] otto: 5 fotos
...
[INFO] Cargando MobileNetV3-Large...
[1/25] kai/foto1.jpg... OK
[2/25] kai/foto2.jpg... OK
...
[INFO] Analizando similitudes...
[INFO] Calculando metricas para 7 thresholds...

RESULTADOS
====================================================================
  Threshold 0.70: Same-pet acc=98.5%, FP cross-pet=12.3%
  Threshold 0.75: Same-pet acc=95.2%, FP cross-pet=4.1%
  Threshold 0.80: Same-pet acc=87.6%, FP cross-pet=1.2%
  ...

  VEREDICTO: GO-WITH-FINETUNE
  Razon: Modelo base decente, fine-tuning deberia llevar a >95%
  Mejor threshold: 0.75

[OK] Reporte escrito en: _pending/H2_nose_print_validation_report_YYYYMMDD.md
```

## Interpretar el resultado

El script genera un archivo Markdown en `_pending/` con:
- Métricas por threshold
- Veredicto (GO / GO-WITH-FINETUNE / PIVOT-TO-API / NO-GO)
- Interpretación

| Veredicto | Qué significa | Costo adicional Fase 1 |
|---|---|---|
| **GO** | Modelo base funciona | $0 |
| **GO-WITH-FINETUNE** | Necesita fine-tuning | $3–8k USD GPU training one-time |
| **PIVOT-TO-API** | Usar Petnow API comercial | $0.0005/match × uso |
| **NO-GO** | Nose print no viable corto plazo | Revisar Fase 1 completo |

## Reportar a Claude

Una vez corrido, envia el contenido del archivo `_pending/H2_nose_print_validation_report_YYYYMMDD.md` a Claude (copy-paste o referencia de archivo). Claude decide ajustes a Fase 1 según veredicto.

## Troubleshooting

**Error**: `ModuleNotFoundError: No module named 'torch'`
→ No activaste el venv o no instalaste dependencies. Repetir setup.

**Error**: `RuntimeError: CUDA error`
→ Ignorar — el script corre en CPU. Si tu máquina no tiene GPU, el tiempo sube de 2 a 5 min, nada más.

**Error**: `Pillow: cannot identify image file`
→ Alguna foto está corrupta. Revisá la que el error menciona.

**Warning**: "Necesitamos al menos 2 mascotas con 2+ fotos cada una"
→ Faltan fotos. Asegurate de tener 3+ mascotas con 3+ fotos cada una para un test decente.

**Accuracy muy baja (<70%) inesperada**
→ Revisar calidad de fotos (borrosas, mal iluminadas, muy chicas). Retomar con mejor calidad.

## Próximos pasos tras el script

1. Revisar el reporte generado
2. Si GO o GO-WITH-FINETUNE → proceder Fase 1 sin cambios
3. Si PIVOT-TO-API → ajustar spec NOSE_PRINT_ID.md para usar Petnow como dependencia
4. Si NO-GO → sesión estratégica de ajuste Fase 1 con Pedro + Claude
