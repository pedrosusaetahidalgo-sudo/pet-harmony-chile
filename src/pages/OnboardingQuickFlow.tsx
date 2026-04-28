/**
 * OnboardingQuickFlow — wizard minimal de 3 pasos para crear la primera mascota
 *
 * Refactor Maestro 2026-04-23 §5.3. Reemplaza el formulario largo de AddPet
 * cuando ONBOARDING_V2_MINIMAL está activo.
 *
 * 3 pasos, menos de 1 minuto total:
 *   1. Foto + nombre + especie (obligatorio)
 *   2. Huella nasal (opcional, skip "Más tarde")
 *   3. Chip (opcional, con mensaje sobre Ley 21.020)
 *
 * Después del paso 3, crea la mascota, redirige a la ficha, y el dueño
 * puede agregar más detalles desde ahí cuando quiera.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { track, EVENTS } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { markOnboardingComplete } from '@/hooks/useOnboardingStatus';
import { toast } from 'sonner';
import {
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Camera,
  Shield,
  ShieldCheck,
  Check,
  PawPrint,
} from '@/lib/icons';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import { VaccinationCardOCR } from '@/components/onboarding/VaccinationCardOCR';
import { FileText } from '@/lib/icons';
import {
  compressImage,
  compressedToFile,
  validateImageFile,
  IMAGE_PRESETS,
} from '@/lib/imageUtils';
import { generatePawCardData } from '@/hooks/useHoloPattern';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { logger } from '@/lib/logger';
import { LINKS } from '@/lib/links';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type PetInsert = Database['public']['Tables']['pets']['Insert'];
type Step = 1 | 2 | 3 | 4;

export default function OnboardingQuickFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Paso 4 (research consent) solo aparece si el flag esta activo. Cuando no,
  // el wizard sigue siendo de 3 pasos como antes.
  const consentStepEnabled = isFeatureEnabled('RESEARCH_CONSENT_FLOW');
  const totalSteps = consentStepEnabled ? 4 : 3;

  const [step, setStep] = useState<Step>(1);

  // Paso 1 — obligatorio
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<string>('');

  // Paso 2 — opcional (nose print)
  const [captureNoseLater, setCaptureNoseLater] = useState(true);

  // Paso 3 — opcional (chip)
  const [microchip, setMicrochip] = useState('');

  // Paso 4 — opcional (research consent). null = no decidio aun.
  const [researchConsent, setResearchConsent] = useState<boolean | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Sprint 1 P1 FEAT-002: post-creacion mostramos un step opcional para subir
  // el carnet de vacunas (OCR). Restaura la propuesta de valor "ficha completa
  // sin tipear" del modelo v2. Si el dueno salta, va directo a la ficha como
  // antes; si sube, el componente VaccinationCardOCR escribe los registros y
  // luego salimos.
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);
  const [postRedirectTarget, setPostRedirectTarget] = useState<string | null>(null);

  const step1Valid = !!photoFile && name.trim().length >= 2 && !!species;

  // Handlers de foto
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setCropSrc(URL.createObjectURL(file));
    setShowCrop(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const croppedFile = new File([croppedBlob], 'pet-crop.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(croppedFile, IMAGE_PRESETS.pet);
      const finalFile = compressedToFile(compressed, `pet-${Date.now()}`);
      setPhotoFile(finalFile);
      setPhotoPreview(URL.createObjectURL(compressed.blob));
    } catch (err) {
      toast.error('Error al procesar la foto');
      logger.error('[OnboardingQuickFlow] crop error', err);
    } finally {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  };

  // Submit final al salir del paso 3
  const handleFinish = async () => {
    if (!user || !step1Valid) return;
    setSubmitting(true);

    // Microchip format: 15 digits ISO 11784/11785
    if (microchip.trim() && !/^\d{15}$/.test(microchip.trim())) {
      toast.error('Microchip inválido', {
        description: 'Debe tener exactamente 15 dígitos (estándar ISO). Dejalo vacío si no tiene.',
      });
      setSubmitting(false);
      return;
    }

    let uploadedFilePath: string | null = null;

    try {
      // Upload foto
      const fileExt = photoFile!.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, photoFile!);
      if (uploadError) throw uploadError;
      uploadedFilePath = fileName;
      const {
        data: { publicUrl },
      } = supabase.storage.from('pet-photos').getPublicUrl(fileName);

      // Insertar pet
      const pawCardData = generatePawCardData();
      const payload: PetInsert = {
        owner_id: user.id,
        name: name.trim(),
        species,
        photo_url: publicUrl,
        paw_card_id: pawCardData.pawCardId,
        holo_pattern: pawCardData.holoPattern,
        microchip_number: microchip.trim() || null,
        // Sprint 0 P0 SEC-002: la mascota nace privada por default. La fuga
        // historica era pets.is_public DEFAULT true + policy publica. La mig
        // 20260906000000 corrige el default; aqui evitamos el override explicito.
        is_public: false,
      };

      const { data: createdPet, error: insertError } = await supabase
        .from('pets')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!createdPet) throw new Error('No se pudo crear la mascota');

      track({
        event: EVENTS.PET_CREATED,
        properties: { species, source: 'onboarding_quick_flow' },
      });

      // Si llegamos al paso 4 y el dueño tomo decision sobre research consent,
      // la guardamos en profiles. Si no decidio (NULL) no escribimos nada
      // — sigue como NULL y se le puede preguntar despues desde /profile.
      if (researchConsent !== null) {
        const { error: consentError } = await supabase
          .from('profiles')
          .update({
            anonymous_data_research_consent: researchConsent,
            research_consent_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', user.id);
        if (consentError) {
          // No fatal: la mascota ya esta creada. Solo log.
          logger.warn('[OnboardingQuickFlow] research consent save failed', consentError);
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['pets'] }),
        queryClient.invalidateQueries({ queryKey: ['user-pets'] }),
        queryClient.invalidateQueries({ queryKey: ['research-consent', user.id] }),
      ]);

      // Sprint 0 P0 FEAT-001: marcar onboarding completo. Antes el wizard
      // creaba la mascota pero no marcaba el funnel, lo que rompia el tracking
      // de useOnboardingStatus + metricas de activation.
      try {
        await markOnboardingComplete(user.id);
      } catch (err) {
        // No fatal: la mascota ya existe. Solo log.
        logger.warn('[OnboardingQuickFlow] markOnboardingComplete failed', err);
      }

      toast.success('¡Mascota agregada!', {
        description: `${name} ya tiene su perfil. Puedes agregar más detalles desde la ficha.`,
      });

      // Si eligió capturar nose print ahora, redirige a ficha tab Identidad.
      // Si eligió "Más tarde", va a la ficha en su tab default.
      const target = captureNoseLater
        ? LINKS.petClinical(createdPet.id)
        : `${LINKS.petClinical(createdPet.id)}?tab=identidad`;

      // Sprint 1 P1 FEAT-002: en lugar de navegar inmediato, mostramos el step
      // opcional de OCR carnet de vacunas. El dueno puede subir el carnet (que
      // crea registros automaticamente) o saltar para ir a la ficha.
      setCreatedPetId(createdPet.id);
      setPostRedirectTarget(target);
    } catch (err) {
      if (uploadedFilePath) {
        await supabase.storage
          .from('pet-photos')
          .remove([uploadedFilePath])
          .catch(() => {});
      }
      logger.error('[OnboardingQuickFlow] submit failed', err);
      toast.error('Error al crear mascota', {
        description: describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]),
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Sprint 1 P1 FEAT-002: vista post-creacion con OCR opcional. Aparece tras
  // crear la mascota; el dueno puede subir el carnet de vacunas o saltar.
  if (createdPetId && postRedirectTarget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-6">
        <div className="container max-w-md mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold">¡{name} ya tiene su perfil!</h1>
              <span className="text-xs text-muted-foreground">Paso bonus</span>
            </div>
            <Progress value={100} className="h-1.5" />
          </div>

          <Card className="mb-3">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold mb-1">¿Tienes el carnet de vacunas?</h2>
                  <p className="text-sm text-muted-foreground">
                    Súbelo una vez y la IA arma todo el historial automáticamente. Toma 30 segundos.
                    Si no lo tienes a mano, puedes hacerlo después desde la ficha.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <VaccinationCardOCR petId={createdPetId} onSaved={() => navigate(postRedirectTarget)} />

          <div className="flex justify-center pt-4">
            <Button
              variant="ghost"
              onClick={() => navigate(postRedirectTarget)}
              className="text-muted-foreground"
            >
              Saltar, lo hago después
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 px-4 py-6">
      <div className="container max-w-md mx-auto">
        {/* Header + Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">
              {name ? `Queremos conocer a ${name}` : 'Queremos conocer a tu mascota'}
            </h1>
            <span className="text-xs text-muted-foreground">
              Paso {step} de {totalSteps}
            </span>
          </div>
          <Progress value={(step / totalSteps) * 100} className="h-1.5" />
        </div>

        {/* Paso 1 — Foto + Nombre + Especie */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Lo básico</h2>
                <p className="text-sm text-muted-foreground">
                  Solo 3 datos esenciales para empezar.
                </p>
              </div>

              {/* Foto */}
              <div className="space-y-2">
                <Label>Foto *</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="h-24 w-24 rounded-xl object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50 transition-colors"
                    >
                      <Upload className="h-6 w-6 text-purple-600 mb-1" />
                      <span className="text-[10px] text-muted-foreground">Subir</span>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        aria-label="Subir foto de la mascota"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                  {!photoPreview && (
                    <p className="text-xs text-muted-foreground">
                      Cualquier foto clara sirve. Puedes ajustar después.
                    </p>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kai, Luna, Rocky..."
                />
              </div>

              {/* Especie — botones grandes one-tap (refactor 2026-04-25 mobile-first) */}
              <div className="space-y-2">
                <Label>¿Qué es?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: 'perro', emoji: '🐶', label: 'Perro' },
                    { value: 'gato', emoji: '🐱', label: 'Gato' },
                    { value: 'conejo', emoji: '🐰', label: 'Conejo' },
                    { value: 'hamster', emoji: '🐹', label: 'Hámster' },
                    { value: 'ave', emoji: '🐦', label: 'Ave' },
                    { value: 'tortuga', emoji: '🐢', label: 'Tortuga' },
                    { value: 'pez', emoji: '🐟', label: 'Pez' },
                    { value: 'otro', emoji: '🐾', label: 'Otro' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setSpecies(s.value)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 transition-all',
                        species === s.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-border hover:bg-muted'
                      )}
                    >
                      <span className="text-2xl">{s.emoji}</span>
                      <span className="text-xs font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(LINKS.myPets())}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 2 — Nose print (opcional) */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Huella nasal</h2>
                <p className="text-sm text-muted-foreground">
                  En Paw Friend identificamos a {name || 'tu mascota'} por su huella nasal — como tu
                  huella digital. Es único e inmutable.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-purple-900">¿Capturar ahora?</p>
                    <p className="text-xs text-purple-700 mt-0.5">
                      Toma ~30 segundos. Puedes hacerlo después desde la ficha clínica si prefieres.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setCaptureNoseLater(false)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 text-left transition-colors',
                    !captureNoseLater
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    <span className="font-medium text-sm">Capturar huella ahora</span>
                    {!captureNoseLater && <Check className="h-4 w-4 ml-auto text-purple-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Te abre la cámara después de crear la mascota.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureNoseLater(true)}
                  className={cn(
                    'w-full p-3 rounded-lg border-2 text-left transition-colors',
                    captureNoseLater
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-border hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <PawPrint className="h-4 w-4" />
                    <span className="font-medium text-sm">Más tarde</span>
                    {captureNoseLater && <Check className="h-4 w-4 ml-auto text-purple-600" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes hacerlo cuando quieras desde la ficha clínica.
                  </p>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 3 — Chip (opcional, con mensaje explicativo) */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Microchip (opcional)</h2>
                <p className="text-sm text-muted-foreground">
                  Si {name || 'tu mascota'} ya tiene chip, anotalo. Es el trámite legal (Ley
                  21.020). En Paw Friend la reconocemos por su huella nasal — el chip queda como
                  recibo legal.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700">
                  La Ley 21.020 (Ley Cholito) exige microchip para el registro oficial. Lo anotamos
                  en la ficha pero Paw Friend no lo usa como identificador principal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="microchip">Número de microchip (15 dígitos)</Label>
                <Input
                  id="microchip"
                  value={microchip}
                  onChange={(e) => setMicrochip(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  placeholder="Deja vacío si no tiene"
                  inputMode="numeric"
                  pattern="\d{15}"
                  maxLength={15}
                />
                <p className="text-[10px] text-muted-foreground">
                  Estándar ISO 11784/11785. Puedes agregarlo después desde la ficha si ahora no lo
                  tienes a mano.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                {consentStepEnabled ? (
                  <Button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Continuar <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinish}
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {submitting ? 'Creando...' : 'Crear mascota'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Paso 4 — Research consent (opcional). Refactor Maestro Fase 2 §7.3 */}
        {step === 4 && consentStepEnabled && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Una pregunta opcional
                </h2>
                <p className="text-sm text-muted-foreground">
                  Paw Friend es gratis para ti. Para sostenerlo, vendemos insights agregados
                  anonimos a laboratorios y aseguradoras que cuidan mascotas.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-900 mb-1">¿Qué significa "anonimo"?</p>
                <ul className="space-y-1 text-emerald-800 list-disc pl-5 text-xs">
                  <li>Tu nombre y contacto NO se comparten nunca.</li>
                  <li>
                    Tampoco el nombre de {name || 'tu mascota'} ni su foto. Solo data agregada
                    (raza, peso, edad, comuna).
                  </li>
                  <li>Solo se usa cuando hay 50+ mascotas con la misma característica.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setResearchConsent(true)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 text-left transition-colors',
                    researchConsent === true
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  )}
                >
                  <p className="font-medium text-sm">
                    {researchConsent === true && '✓ '}Sumar mi data anonima
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tu aporte indirecto sostiene la app gratis para todos.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setResearchConsent(false)}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 text-left transition-colors',
                    researchConsent === false
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <p className="font-medium text-sm">
                    {researchConsent === false && '✓ '}No participar
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tu data nunca se va a usar en estudios. Puedes cambiar después.
                  </p>
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                Es 100% opcional. Puedes saltar este paso o cambiar la decisión desde tu perfil.
              </p>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button
                  onClick={handleFinish}
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {submitting ? 'Creando...' : 'Crear mascota'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Crop dialog */}
        {cropSrc && (
          <ImageCropDialog
            open={showCrop}
            onOpenChange={(v) => {
              setShowCrop(v);
              if (!v && cropSrc) {
                URL.revokeObjectURL(cropSrc);
                setCropSrc(null);
              }
            }}
            imageSrc={cropSrc}
            aspect={1}
            cropShape="rect"
            title={`Ajustá la foto de ${name || 'tu mascota'}`}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </div>
  );
}
