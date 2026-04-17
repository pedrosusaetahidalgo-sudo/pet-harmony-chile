import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { track, EVENTS } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, X, ChevronDown, Stethoscope, Heart } from '@/lib/icons';
import { LINKS } from '@/lib/links';
import { ImageCropDialog } from '@/components/ImageCropDialog';
import {
  compressImage,
  compressedToFile,
  validateImageFile,
  IMAGE_PRESETS,
  MIN_DIMENSIONS,
} from '@/lib/imageUtils';
import { Badge } from '@/components/ui/badge';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { logger } from '@/lib/logger';
import { useOrganicRewards } from '@/hooks/useOrganicRewards';
import { BREEDS_BY_SPECIES, getBreedLabel } from '@/lib/breeds';
import { smartCapitalize, toTitleCase } from '@/lib/format';
import {
  PET_COLORS,
  FOOD_BRANDS,
  PERSONALITY_OPTIONS,
  BLOOD_TYPES_BY_SPECIES,
} from '@/lib/petOptions';
import { SelectWithOther } from '@/components/ui/select-with-other';
import { ComboboxWithOther } from '@/components/ui/combobox-with-other';
import { useCanAddPet } from '@/hooks/useCanAddPet';
import { Sparkles, Crown } from '@/lib/icons';
import { PageHeader } from '@/components/PageHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { VaccinationCardOCR } from '@/components/onboarding/VaccinationCardOCR';
import { useScrollOnFocus } from '@/hooks/useScrollOnFocus';
import { addPetSchema } from '@/lib/schemas';
import { generatePawCardData } from '@/hooks/useHoloPattern';
import { PawCardRevealCeremony } from '@/components/paw-cards/PawCardRevealCeremony';
import type { HoloPattern } from '@/lib/paw-cards';

const personalityOptions: string[] = [...PERSONALITY_OPTIONS];

const AddPet = () => {
  useScrollOnFocus();
  const { petId } = useParams<{ petId: string }>();
  const isEdit = !!petId;
  const [loading, setLoading] = useState(false);
  const [loadingPet, setLoadingPet] = useState(isEdit);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([]);
  const [customPersonality, setCustomPersonality] = useState('');
  const [showMedical, setShowMedical] = useState(false);
  const [breedConfirmed, setBreedConfirmed] = useState(false);
  const [revealData, setRevealData] = useState<{
    name: string;
    species: string;
    breed: string | null;
    photo_url: string | null;
    pawCardId: string;
    holoPattern: HoloPattern;
    score: number;
  } | null>(null);
  const [duplicateBypass, setDuplicateBypass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    birth_date: '',
    gender: '',
    size: '',
    color: '',
    weight: '',
    bio: '',
    // Clinical fields
    microchip_number: '',
    blood_type: '',
    neutered: false,
    is_adopted: false,
    adoption_date: '',
    preferred_clinic: '',
    emergency_vet_name: '',
    emergency_vet_phone: '',
    diet_type: '',
    diet_brand: '',
    activity_level: '',
    behavior_notes: '',
    insurance_provider: '',
  });

  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { reward } = useOrganicRewards();
  const { can: canAddPet, reason: blockReason, isLoading: checkingLimit } = useCanAddPet();

  // Modo edición: cargar datos existentes
  useEffect(() => {
    if (!isEdit || !user || !petId) return;
    let cancelled = false;
    (async () => {
      setLoadingPet(true);
      const { data, error } = await supabase
        .from('pets')
        .select(
          'name, species, breed, birth_date, gender, size, color, weight, bio, photo_url, personality, microchip_number, blood_type, neutered, is_adopted, adoption_date, preferred_clinic, emergency_vet_name, emergency_vet_phone, diet_type, diet_brand, activity_level, behavior_notes, insurance_provider'
        )
        .eq('id', petId)
        .eq('owner_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        toast.error('Mascota no encontrada', {
          description: 'No tienes acceso a esta mascota o no existe.',
        });
        navigate(LINKS.myPets());
        return;
      }
      setFormData({
        name: data.name ?? '',
        species: data.species ?? '',
        breed: data.breed ?? '',
        birth_date: data.birth_date ?? '',
        gender: data.gender ?? '',
        size: data.size ?? '',
        color: data.color ?? '',
        weight: data.weight != null ? String(data.weight) : '',
        bio: data.bio ?? '',
        microchip_number: data.microchip_number ?? '',
        blood_type: data.blood_type ?? '',
        neutered: !!data.neutered,
        is_adopted: !!data.is_adopted,
        adoption_date: data.adoption_date ?? '',
        preferred_clinic: data.preferred_clinic ?? '',
        emergency_vet_name: data.emergency_vet_name ?? '',
        emergency_vet_phone: data.emergency_vet_phone ?? '',
        diet_type: data.diet_type ?? '',
        diet_brand: data.diet_brand ?? '',
        activity_level: data.activity_level ?? '',
        behavior_notes: data.behavior_notes ?? '',
        insurance_provider: data.insurance_provider ?? '',
      });
      setSelectedPersonality(Array.isArray(data.personality) ? data.personality : []);
      setExistingPhotoUrl(data.photo_url ?? null);
      if (data.photo_url) setPhotoPreview(data.photo_url);
      setLoadingPet(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, petId, user, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setShowCrop(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      const croppedFile = new File([croppedBlob], 'pet-crop.jpg', { type: 'image/jpeg' });
      const compressed = await compressImage(croppedFile, IMAGE_PRESETS.pet);
      const finalFile = compressedToFile(compressed, `pet-${Date.now()}`);
      setPhotoFile(finalFile);
      setPhotoPreview(URL.createObjectURL(compressed.blob));
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Error al procesar la foto');
    } finally {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  };

  const uploadPhoto = async (): Promise<{ url: string; path: string } | null> => {
    if (!photoFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('pet-photos')
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('pet-photos').getPublicUrl(fileName);

      return { url: publicUrl, path: fileName };
    } catch (error: unknown) {
      toast.error('Error al subir foto', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Sesión expirada', {
        description: 'Tienes que iniciar sesión de nuevo para guardar tu mascota.',
      });
      navigate('/auth');
      return;
    }

    // Zod validation for core fields
    setFieldErrors({});
    const zodResult = addPetSchema.safeParse(formData);
    if (!zodResult.success) {
      const errs: Record<string, string> = {};
      for (const issue of zodResult.error.issues) {
        const key = String(issue.path[0]);
        if (!errs[key]) errs[key] = issue.message;
      }
      setFieldErrors(errs);
      // Scroll to first error
      const firstKey = Object.keys(errs)[0];
      if (firstKey) {
        const el = document.getElementById(firstKey);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Validate weight if provided
    if (formData.weight) {
      const w = parseFloat(formData.weight);
      if (w <= 0) {
        toast.error('Algo salió mal', { description: 'El peso debe ser mayor a 0' });
        return;
      }
      // Warning (no bloqueante) para pesos fuera de rango esperado por especie
      const weightRanges: Record<string, [number, number]> = {
        perro: [0.5, 90],
        gato: [1, 15],
        conejo: [0.5, 8],
        hamster: [0.02, 0.2],
        ave: [0.01, 5],
        tortuga: [0.05, 100],
        pez: [0.001, 50],
      };
      const range = weightRanges[formData.species];
      if (range && (w < range[0] || w > range[1])) {
        toast('Peso inusual', {
          description: `El peso ${w} kg parece fuera de rango para un ${formData.species} (${range[0]}–${range[1]} kg). Puedes continuar si es correcto.`,
        });
      }
    }

    // Validate birth_date if provided (species-specific realistic limits)
    if (formData.birth_date) {
      const birth = new Date(formData.birth_date + 'T00:00:00');
      const now = new Date();
      if (birth > now) {
        toast.error('Algo salió mal', {
          description: 'La fecha de nacimiento no puede ser en el futuro',
        });
        return;
      }
      const speciesMaxYears: Record<string, number> = {
        perro: 25,
        gato: 25,
        conejo: 15,
        hamster: 5,
        tortuga: 50,
        ave: 30,
        pez: 20,
        otro: 25,
      };
      const maxYears = speciesMaxYears[formData.species] ?? 25;
      const minBirth = new Date();
      minBirth.setFullYear(now.getFullYear() - maxYears);
      if (birth < minBirth) {
        toast.error('Fecha de nacimiento no válida', {
          description: `Para un ${formData.species}, la fecha de nacimiento no puede ser anterior a hace ${maxYears} años.`,
        });
        return;
      }
    }

    // Validate adoption_date if provided
    if (formData.adoption_date && new Date(formData.adoption_date) > new Date()) {
      toast.error('Algo salió mal', {
        description: 'La fecha de adopción no puede ser en el futuro',
      });
      return;
    }

    // Validate microchip: estándar ISO 11784/11785 son 15 dígitos numéricos.
    if (formData.microchip_number && !/^\d{15}$/.test(formData.microchip_number.trim())) {
      toast.error('Microchip inválido', {
        description: 'El número de microchip debe tener exactamente 15 dígitos (estándar ISO).',
      });
      return;
    }

    // Validar raza contra especie seleccionada (con combobox ya no debería pasar, pero por seguridad)
    if (
      formData.breed &&
      formData.species &&
      !breedConfirmed &&
      !formData.breed.startsWith('otro:')
    ) {
      const knownBreeds = BREEDS_BY_SPECIES[formData.species] || [];
      const isKnown = knownBreeds.some((b) => b.value === formData.breed);
      if (!isKnown) {
        toast('Raza no reconocida para esta especie', {
          description: `"${getBreedLabel(formData.species, formData.breed)}" no está en nuestra lista de razas de ${formData.species}. Presiona "Guardar" de nuevo si es correcta.`,
        });
        setBreedConfirmed(true);
        return;
      }
    }

    // Foto obligatoria
    if (!photoFile && !existingPhotoUrl) {
      toast.error('La foto de tu mascota es obligatoria');
      return;
    }

    setLoading(true);
    let uploadedFilePath: string | null = null;

    try {
      let photoUrl: string | null = existingPhotoUrl;
      if (photoFile) {
        const uploadResult = await uploadPhoto();
        if (uploadResult) {
          photoUrl = uploadResult.url;
          uploadedFilePath = uploadResult.path;
        }
      }

      // Core columns (exist since initial migration)
      type PetInsert = Database['public']['Tables']['pets']['Insert'];
      const pawCardData = !isEdit ? generatePawCardData() : null;
      const payload: PetInsert = {
        owner_id: user.id,
        name: formData.name,
        species: formData.species,
        paw_card_id: pawCardData?.pawCardId ?? undefined,
        holo_pattern: pawCardData?.holoPattern ?? undefined,
        breed: formData.breed || null,
        birth_date: formData.birth_date || null,
        gender: formData.gender || null,
        size: formData.size || null,
        color: formData.color || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        bio: formData.bio || null,
        personality: selectedPersonality.length > 0 ? selectedPersonality : null,
        photo_url: photoUrl,
        is_public: true,
        microchip_number: formData.microchip_number || null,
        blood_type: formData.blood_type || null,
        neutered: formData.neutered,
      };

      // Clinical columns (from migration 20260402)
      payload.is_adopted = formData.is_adopted || false;
      payload.adoption_date = formData.adoption_date || null;
      payload.preferred_clinic = formData.preferred_clinic || null;
      payload.emergency_vet_name = formData.emergency_vet_name || null;
      payload.emergency_vet_phone = formData.emergency_vet_phone || null;
      payload.diet_type = formData.diet_type || null;
      payload.diet_brand = formData.diet_brand || null;
      payload.activity_level = formData.activity_level || null;
      payload.behavior_notes = formData.behavior_notes || null;
      payload.insurance_provider = formData.insurance_provider || null;

      if (isEdit && petId) {
        // === EDIT MODE ===
        const { error } = await supabase
          .from('pets')
          .update(payload)
          .eq('id', petId)
          .eq('owner_id', user.id);
        if (error) throw error;

        // Invalidate caches que dependen del nombre/datos de la mascota.
        // El trigger DB sync_pet_name_in_reminders ya actualiza los titulos
        // embebidos; aqui forzamos re-fetch de las queries cliente.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['pet-reminders'] }),
          queryClient.invalidateQueries({ queryKey: ['pets'] }),
          queryClient.invalidateQueries({ queryKey: ['user-pets'] }),
          queryClient.invalidateQueries({ queryKey: ['user-pets-reminders'] }),
          queryClient.invalidateQueries({ queryKey: ['pet', petId] }),
          queryClient.invalidateQueries({ queryKey: ['pet-clinical', petId] }),
          queryClient.invalidateQueries({ queryKey: ['my-bookings-v1'] }),
          queryClient.invalidateQueries({ queryKey: ['my-bookings-v2'] }),
        ]);

        toast('Cambios guardados', {
          description: `Los datos de ${formData.name} se actualizaron correctamente.`,
        });
        navigate(LINKS.myPets());
        return;
      }

      // === CREATE MODE ===

      // Duplicate detection: warn if owner already has a pet with same name+species
      if (!duplicateBypass) {
        const { data: existing } = await supabase
          .from('pets')
          .select('id, name')
          .eq('owner_id', user.id)
          .ilike('name', formData.name.trim())
          .eq('species', formData.species);

        if (existing && existing.length > 0) {
          toast('Posible duplicado', {
            description: `Ya tienes un ${formData.species} llamado "${existing[0].name}". Presiona "Guardar" de nuevo si quieres crear otro registro.`,
          });
          setDuplicateBypass(true);
          setLoading(false);
          return;
        }

        // Microchip uniqueness check
        if (formData.microchip_number) {
          const { data: chipMatch } = await supabase
            .from('pets')
            .select('id, name')
            .eq('microchip_number', formData.microchip_number.trim())
            .limit(1);

          if (chipMatch && chipMatch.length > 0) {
            toast.error('Microchip ya registrado', {
              description: `Este microchip ya está asociado a "${chipMatch[0].name}". Verifica el número.`,
            });
            setLoading(false);
            return;
          }
        }
      }
      setDuplicateBypass(false);

      // Insert + devolver id en una sola llamada (evita race condition con SELECT por nombre)
      const { data: createdPet, error: insertError } = await supabase
        .from('pets')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) throw insertError;
      if (!createdPet) throw new Error('No se pudo crear la mascota.');

      // Auto-create default reminders for the new pet (no bloqueante)
      const today = new Date();
      const in30days = new Date(today);
      in30days.setDate(today.getDate() + 30);
      const in90days = new Date(today);
      in90days.setDate(today.getDate() + 90);

      // Nota: los reminders de vacuna los crea el trigger DB
      // (trigger_create_default_reminders) basado en vaccination_protocols + edad.
      // Aqui solo creamos checkup y grooming para evitar duplicados.
      const { error: remindersError } = await supabase.from('pet_reminders').insert([
        {
          pet_id: createdPet.id,
          owner_id: user.id,
          type: 'checkup',
          title: `Control veterinario de ${formData.name}`,
          due_date: in90days.toISOString().split('T')[0],
        },
        {
          pet_id: createdPet.id,
          owner_id: user.id,
          type: 'grooming',
          title: `Baño y peluquería de ${formData.name}`,
          due_date: in30days.toISOString().split('T')[0],
          is_recurring: true,
          recurrence_interval: 'monthly',
        },
      ]);

      if (remindersError) {
        logger.error('[AddPet] reminders insert failed', remindersError);
        toast('Mascota creada', {
          description: `Pero los recordatorios automáticos no se pudieron crear (${describeSupabaseError(remindersError)}). Los puedes agregar manualmente.`,
        });
      }

      track({
        event: EVENTS.PET_CREATED,
        properties: { species: formData.species, breed: formData.breed },
      });

      // Fire-and-forget organic reward
      reward({
        kind: 'pet_profile_completed',
        petId: createdPet.id,
        petName: formData.name,
        pct: 60,
      });

      toast('¡Mascota agregada!', {
        description: `${formData.name} tiene ficha clínica y recordatorios de salud. ¡Explora su perfil!`,
      });

      setRevealData({
        name: formData.name,
        species: formData.species,
        breed: formData.breed || null,
        photo_url: photoUrl,
        pawCardId: payload.paw_card_id as string,
        holoPattern: payload.holo_pattern as HoloPattern,
        score: 0,
      });
    } catch (error: unknown) {
      if (uploadedFilePath) {
        await supabase.storage
          .from('pet-photos')
          .remove([uploadedFilePath])
          .catch(() => {});
      }
      toast.error(isEdit ? 'Error al guardar cambios' : 'Error al agregar mascota', {
        description: describeSupabaseError(error as Parameters<typeof describeSupabaseError>[0]),
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePersonality = (trait: string) => {
    setSelectedPersonality((prev) =>
      prev.includes(trait) ? prev.filter((t) => t !== trait) : [...prev, trait]
    );
  };

  const updateField = (field: string, value: string | number | boolean | null) => {
    if (field === 'species' || field === 'breed') setBreedConfirmed(false);
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (loadingPet) {
    return (
      <div className="container px-4 py-8 max-w-2xl mx-auto text-center text-muted-foreground">
        Cargando datos de la mascota…
      </div>
    );
  }

  // Paywall: solo aplica en modo create. Edit nunca se bloquea.
  // Esta card es red de seguridad: el flujo normal intercepta antes y manda directo a /upgrade.
  if (!isEdit && !checkingLimit && !canAddPet && blockReason === 'premium_required') {
    return (
      <div className="relative min-h-[calc(100vh-4rem)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(45 100% 92% / 0.6), transparent 60%)',
          }}
        />
        <div className="container px-4 py-12 max-w-xl mx-auto animate-fade-in">
          <Card className="border-2 border-premium/30 bg-premium-gradient-soft shadow-premium">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-1 bg-premium-gradient rounded-t-lg"
            />
            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-full bg-premium-gradient blur-xl opacity-50" />
                <div className="relative h-14 w-14 mx-auto rounded-full bg-premium-gradient flex items-center justify-center shadow-premium">
                  <Crown className="h-7 w-7 text-premium-foreground" strokeWidth={2.5} />
                </div>
              </div>
              <CardTitle className="text-2xl">
                Suma más mascotas con{' '}
                <span className="bg-premium-gradient bg-clip-text text-transparent">Premium</span>
              </CardTitle>
              <CardDescription className="text-base mt-2 leading-relaxed">
                Tu plan gratis incluye 1 mascota. Con Premium agregas todas las que quieras y
                desbloqueas la ficha clínica completa, recordatorios ilimitados y exportación de
                fichas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-premium/30 bg-card/70 backdrop-blur-sm p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plan mensual</span>
                  <span className="font-bold">$3.990 / mes</span>
                </div>
                <div className="h-px bg-premium/20" />
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    Plan anual
                    <Sparkles className="h-3 w-3 text-premium" />
                  </span>
                  <span className="font-bold bg-premium-gradient bg-clip-text text-transparent">
                    $39.900 / año
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(LINKS.myPets())}
                  className="w-full sm:flex-1 h-12"
                >
                  Volver
                </Button>
                <Button
                  type="button"
                  onClick={() => navigate('/upgrade')}
                  className="w-full sm:flex-1 h-12 bg-premium-gradient hover:opacity-90 text-premium-foreground border-0 shadow-premium font-semibold"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Ver planes Premium
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (revealData) {
    return <PawCardRevealCeremony pet={revealData} onComplete={() => navigate(LINKS.myPets())} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={isEdit ? `Editar ${formData.name || 'mascota'}` : 'Agregar mascota'}
        subtitle={
          isEdit
            ? 'Actualiza los datos de tu compañero peludo.'
            : 'Completa la información de tu compañero peludo.'
        }
        onBack={() => navigate(LINKS.myPets())}
      >
        {isEdit && petId && (
          <Breadcrumbs
            items={[
              { label: 'Mascotas', to: LINKS.myPets() },
              { label: formData.name || 'Mascota', to: LINKS.petClinical(petId!) },
              { label: 'Editar' },
            ]}
          />
        )}
      </PageHeader>
      <div className="container px-4 py-6 max-w-2xl mx-auto animate-fade-in">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div className="space-y-2">
                <Label htmlFor="pet-photo-upload">Foto de la Mascota</Label>
                <div className="flex items-center gap-4">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        loading="lazy"
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => {
                          setPhotoFile(null);
                          setPhotoPreview('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="pet-photo-upload"
                      className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Subir foto</span>
                      <input
                        id="pet-photo-upload"
                        type="file"
                        aria-label="Subir foto de mascota"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    onBlur={(e) => updateField('name', toTitleCase(e.target.value))}
                    placeholder="Max, Luna, Rocky..."
                  />
                  {fieldErrors.name && (
                    <p className="text-sm text-destructive">{fieldErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="species">Especie *</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) => updateField('species', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona especie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="perro">🐶 Perro</SelectItem>
                      <SelectItem value="gato">🐱 Gato</SelectItem>
                      <SelectItem value="conejo">🐰 Conejo</SelectItem>
                      <SelectItem value="hamster">🐹 Hámster</SelectItem>
                      <SelectItem value="ave">🐦 Ave</SelectItem>
                      <SelectItem value="tortuga">🐢 Tortuga</SelectItem>
                      <SelectItem value="pez">🐟 Pez</SelectItem>
                      <SelectItem value="otro">🐾 Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.species && (
                    <p className="text-sm text-destructive">{fieldErrors.species}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Raza</Label>
                  <ComboboxWithOther
                    options={BREEDS_BY_SPECIES[formData.species] || []}
                    value={formData.breed}
                    onValueChange={(value) => updateField('breed', value)}
                    placeholder="Selecciona raza"
                    searchPlaceholder="Buscar raza..."
                    emptyMessage="Raza no encontrada."
                    otherPlaceholder="Escribe la raza..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    max={new Date().toISOString().split('T')[0]}
                    min={(() => {
                      const speciesMaxYears: Record<string, number> = {
                        perro: 25,
                        gato: 25,
                        conejo: 15,
                        hamster: 5,
                        tortuga: 50,
                        ave: 30,
                        pez: 20,
                        otro: 25,
                      };
                      const d = new Date();
                      d.setFullYear(d.getFullYear() - (speciesMaxYears[formData.species] ?? 25));
                      return d.toISOString().split('T')[0];
                    })()}
                    onChange={(e) => updateField('birth_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Género</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => updateField('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona género" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="macho">Macho</SelectItem>
                      <SelectItem value="hembra">Hembra</SelectItem>
                      <SelectItem value="desconocido">Desconocido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Tamaño</Label>
                  <Select
                    value={formData.size}
                    onValueChange={(value) => updateField('size', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tamaño" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="miniatura">Miniatura (&lt; 1 kg)</SelectItem>
                      <SelectItem value="pequeño">Pequeño (1-10 kg)</SelectItem>
                      <SelectItem value="mediano">Mediano (10-25 kg)</SelectItem>
                      <SelectItem value="grande">Grande (25-45 kg)</SelectItem>
                      <SelectItem value="gigante">Gigante (45+ kg)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <SelectWithOther
                    options={[...PET_COLORS]}
                    value={formData.color}
                    onValueChange={(value) => updateField('color', value)}
                    placeholder="Selecciona color"
                    otherPlaceholder="Describe el color..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => updateField('weight', e.target.value)}
                    placeholder="5.5"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <Switch
                    id="neutered"
                    checked={formData.neutered}
                    onCheckedChange={(checked) => updateField('neutered', checked)}
                  />
                  <Label htmlFor="neutered" className="cursor-pointer">
                    Esterilizado/a
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="is_adopted"
                    checked={formData.is_adopted}
                    onCheckedChange={(checked) => updateField('is_adopted', checked)}
                  />
                  <Label htmlFor="is_adopted" className="cursor-pointer">
                    Adoptado/a
                  </Label>
                </div>
              </div>

              {formData.is_adopted && (
                <div className="space-y-2">
                  <Label htmlFor="adoption_date">Fecha de Adopción</Label>
                  <Input
                    id="adoption_date"
                    type="date"
                    value={formData.adoption_date}
                    onChange={(e) => updateField('adoption_date', e.target.value)}
                  />
                </div>
              )}

              {/* Personality */}
              <div className="space-y-3">
                <Label>Personalidad</Label>
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
                  role="listbox"
                  aria-label="Rasgos de personalidad"
                  aria-multiselectable="true"
                >
                  {personalityOptions.map((trait) => (
                    <Badge
                      key={trait}
                      variant={selectedPersonality.includes(trait) ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/80 transition-none justify-center py-2 text-xs select-none"
                      role="option"
                      aria-selected={selectedPersonality.includes(trait)}
                      tabIndex={0}
                      onClick={() => togglePersonality(trait)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          togglePersonality(trait);
                        }
                      }}
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    value={customPersonality}
                    onChange={(e) => setCustomPersonality(e.target.value)}
                    placeholder="Otro rasgo..."
                    className="flex-1 h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customPersonality.trim()) {
                        e.preventDefault();
                        const trait = customPersonality.trim();
                        if (!selectedPersonality.includes(trait)) {
                          setSelectedPersonality((prev) => [...prev, trait]);
                        }
                        setCustomPersonality('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!customPersonality.trim()}
                    onClick={() => {
                      const trait = customPersonality.trim();
                      if (trait && !selectedPersonality.includes(trait)) {
                        setSelectedPersonality((prev) => [...prev, trait]);
                      }
                      setCustomPersonality('');
                    }}
                  >
                    Agregar
                  </Button>
                </div>
                {selectedPersonality.filter((t) => !personalityOptions.includes(t)).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedPersonality
                      .filter((t) => !personalityOptions.includes(t))
                      .map((trait) => (
                        <Badge
                          key={trait}
                          variant="default"
                          className="cursor-pointer text-xs"
                          role="button"
                          aria-label={`Quitar ${trait}`}
                          tabIndex={0}
                          onClick={() => togglePersonality(trait)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              togglePersonality(trait);
                            }
                          }}
                        >
                          {trait} ×
                        </Badge>
                      ))}
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  onBlur={(e) => updateField('bio', smartCapitalize(e.target.value))}
                  placeholder="Cuéntanos sobre tu mascota..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Medical Info Card (Collapsible) */}
          <Collapsible open={showMedical} onOpenChange={setShowMedical}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-base">Información Médica</CardTitle>
                        <CardDescription>Opcional - útil para veterinarios</CardDescription>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${showMedical ? 'rotate-180' : ''}`}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                  {/* OCR Vaccination Card — solo en modo edición (requiere petId) */}
                  {isEdit && petId && <VaccinationCardOCR petId={petId} />}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="microchip">Número de Microchip</Label>
                      <Input
                        id="microchip"
                        value={formData.microchip_number}
                        onChange={(e) =>
                          updateField(
                            'microchip_number',
                            e.target.value.replace(/\D/g, '').slice(0, 15)
                          )
                        }
                        placeholder="123456789012345"
                        inputMode="numeric"
                        pattern="\d{15}"
                        maxLength={15}
                      />
                      <p className="text-xs text-muted-foreground">
                        15 dígitos (estándar ISO 11784/11785)
                      </p>
                      {fieldErrors.microchip_number && (
                        <p className="text-sm text-destructive">{fieldErrors.microchip_number}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Sangre</Label>
                      {BLOOD_TYPES_BY_SPECIES[formData.species] ? (
                        <SelectWithOther
                          options={[...BLOOD_TYPES_BY_SPECIES[formData.species]]}
                          value={formData.blood_type}
                          onValueChange={(v) => updateField('blood_type', v)}
                          placeholder="Selecciona tipo"
                          otherPlaceholder="Otro tipo de sangre..."
                        />
                      ) : (
                        <Input
                          value={formData.blood_type}
                          onChange={(e) => updateField('blood_type', e.target.value)}
                          placeholder="Tipo de sangre"
                          maxLength={30}
                        />
                      )}
                      <p className="text-xs text-muted-foreground">
                        Tu vet puede determinarlo con un examen rápido
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="insurance">Seguro de Mascotas</Label>
                      <Input
                        id="insurance"
                        value={formData.insurance_provider}
                        onChange={(e) => updateField('insurance_provider', e.target.value)}
                        placeholder="Nombre del seguro"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinic">Clínica Veterinaria Preferida</Label>
                      <Input
                        id="clinic"
                        value={formData.preferred_clinic}
                        onChange={(e) => updateField('preferred_clinic', e.target.value)}
                        placeholder="Nombre de la clínica"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vet_name">Veterinario de Emergencia</Label>
                      <Input
                        id="vet_name"
                        value={formData.emergency_vet_name}
                        onChange={(e) => updateField('emergency_vet_name', e.target.value)}
                        placeholder="Dr. García"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vet_phone">Teléfono de Emergencia</Label>
                      <Input
                        id="vet_phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        pattern="(\+?56)?9[0-9]{8}"
                        value={formData.emergency_vet_phone}
                        onChange={(e) => updateField('emergency_vet_phone', e.target.value)}
                        placeholder="+56 9 1234 5678"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="activity">Nivel de Actividad</Label>
                      <Select
                        value={formData.activity_level}
                        onValueChange={(value) => updateField('activity_level', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentario">Sedentario</SelectItem>
                          <SelectItem value="bajo">Bajo</SelectItem>
                          <SelectItem value="moderado">Moderado</SelectItem>
                          <SelectItem value="alto">Alto</SelectItem>
                          <SelectItem value="muy_alto">Muy Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diet_type">Tipo de Dieta</Label>
                      <Select
                        value={formData.diet_type}
                        onValueChange={(value) => updateField('diet_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seca">Comida seca</SelectItem>
                          <SelectItem value="humeda">Comida húmeda</SelectItem>
                          <SelectItem value="mixta">Mixta</SelectItem>
                          <SelectItem value="barf">BARF / Natural</SelectItem>
                          <SelectItem value="casera">Casera</SelectItem>
                          <SelectItem value="veterinaria">Prescrita por veterinario</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Marca de alimento</Label>
                      <ComboboxWithOther
                        options={[...FOOD_BRANDS]}
                        value={formData.diet_brand}
                        onValueChange={(value) => updateField('diet_brand', value)}
                        placeholder="Selecciona marca"
                        searchPlaceholder="Buscar marca..."
                        emptyMessage="Marca no encontrada."
                        otherPlaceholder="Escribe la marca..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="behavior">Notas de Comportamiento</Label>
                    <Textarea
                      id="behavior"
                      value={formData.behavior_notes}
                      onChange={(e) => updateField('behavior_notes', e.target.value)}
                      onBlur={(e) => updateField('behavior_notes', smartCapitalize(e.target.value))}
                      placeholder="Miedos, fobias, comportamientos especiales..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Actions — sticky en mobile para que el CTA siempre sea visible */}
          <div
            className="sticky bottom-0 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-t border-border/50 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0"
            style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 0.75rem)' }}
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(LINKS.myPets())}
                className="w-full sm:flex-1 h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading || uploading}
                className="w-full sm:flex-1 h-12"
              >
                {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar Mascota'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Crop dialog for pet photo */}
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
          title="Ajusta la foto de tu mascota"
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};

export default AddPet;
