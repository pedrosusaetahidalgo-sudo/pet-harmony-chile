import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Camera,
  ChevronRight,
  ChevronLeft,
  PawPrint,
  FileText,
  Search,
  Stethoscope,
  CheckCircle2,
  Sparkles,
} from '@/lib/icons';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { generatePawCardData } from '@/hooks/useHoloPattern';

type Species = 'perro' | 'gato' | 'otro';
type AgeRange = 'cachorro' | 'joven' | 'adulto' | 'senior';

const AGE_YEARS: Record<AgeRange, number> = {
  cachorro: 0.5,
  joven: 2,
  adulto: 5,
  senior: 10,
};

function approximateBirthDate(age: AgeRange): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - Math.floor(AGE_YEARS[age]));
  d.setMonth(d.getMonth() - Math.round((AGE_YEARS[age] % 1) * 12));
  return d.toISOString().split('T')[0];
}

const STEP_LABELS = ['Agrega tu mascota', 'Ficha medica', 'Busca veterinario'];

const OnboardingDuenoMinimal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1: Pet basics
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [petCreated, setPetCreated] = useState(false);
  const [createdPetId, setCreatedPetId] = useState<string | null>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null;
    const ext = photoFile.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('pet-photos').upload(path, photoFile);
    if (error) {
      toast.error('No se pudo subir la foto, pero tu mascota se creara igual.');
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return publicUrl;
  };

  const handleCreatePet = async () => {
    if (!name.trim()) {
      toast.error('El nombre de tu mascota es obligatorio.');
      return;
    }
    if (!user) {
      toast.error('Tu sesion expiro. Inicia sesion de nuevo.');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const photoUrl = await uploadPhoto();
      const pawCard = generatePawCardData();

      const { data: insertedPet, error } = await supabase
        .from('pets')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          species: species ?? 'perro',
          birth_date: ageRange ? approximateBirthDate(ageRange) : null,
          photo_url: photoUrl,
          is_public: true,
          holo_pattern: pawCard.holoPattern,
          paw_card_id: pawCard.pawCardId,
        })
        .select('id')
        .single();
      if (error) throw error;

      setPetCreated(true);
      setCreatedPetId(insertedPet?.id ?? null);
      toast.success(`${name.trim()} fue agregado/a con exito.`);
      setStep(2);
    } catch (err) {
      toast.error(describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]));
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem('pf_onboarding_complete', 'true');
    toast.success('Bienvenido a Paw Friend');
    navigate('/home');
  };

  const skipAll = () => {
    localStorage.setItem('pf_onboarding_complete', 'true');
    toast('Bienvenido a Paw Friend');
    navigate('/home');
  };

  const speciesOptions: { value: Species; label: string; emoji: string }[] = [
    { value: 'perro', label: 'Perro', emoji: '🐕' },
    { value: 'gato', label: 'Gato', emoji: '🐈' },
    { value: 'otro', label: 'Otro', emoji: '🐾' },
  ];

  const ageOptions: { value: AgeRange; label: string; hint: string }[] = [
    { value: 'cachorro', label: 'Cachorro', hint: '0-1 año' },
    { value: 'joven', label: 'Joven', hint: '1-3 años' },
    { value: 'adulto', label: 'Adulto', hint: '3-8 años' },
    { value: 'senior', label: 'Senior', hint: '8+ años' },
  ];

  const canAdvanceStep1 = name.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <Card className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Paso {step} de 3</span>
            <span>{STEP_LABELS[step - 1]}</span>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                  s <= step ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ============ STEP 1: Add your first pet ============ */}
        {step === 1 && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <PawPrint className="h-7 w-7 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Agrega tu primera mascota</CardTitle>
              <CardDescription>
                Solo necesitas el nombre. Lo demas es opcional y puedes completarlo despues.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Photo */}
              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Foto de mascota"
                      loading="lazy"
                      className="w-24 h-24 rounded-full object-cover border-2 border-purple-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-purple-100 flex flex-col items-center justify-center border-2 border-dashed border-purple-300 hover:border-purple-400 transition-colors">
                      <span className="text-3xl">🐾</span>
                      <span className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                        <Camera className="h-3 w-3" /> Foto
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {/* Name */}
              <Input
                placeholder="Nombre de tu mascota *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                autoFocus
              />

              {/* Species chips */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">Especie</p>
                <div className="flex gap-2">
                  {speciesOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSpecies(species === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 px-3 rounded-full text-sm font-medium border transition-colors ${
                        species === opt.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age range chips */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">Edad aproximada</p>
                <div className="grid grid-cols-2 gap-2">
                  {ageOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAgeRange(ageRange === opt.value ? null : opt.value)}
                      className={`py-2 px-3 rounded-full text-sm font-medium border transition-colors ${
                        ageRange === opt.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {opt.label}
                      <span
                        className={`block text-xs ${ageRange === opt.value ? 'text-purple-200' : 'text-slate-400'}`}
                      >
                        {opt.hint}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleCreatePet}
                disabled={!canAdvanceStep1 || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Creando...' : 'Crear mascota'}
                {!loading && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>

              <button
                onClick={skipAll}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Omitir — lo hago despues
              </button>
            </CardContent>
          </>
        )}

        {/* ============ STEP 2: Medical record value prop ============ */}
        {step === 2 && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <FileText className="h-7 w-7 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl">La ficha medica digital</CardTitle>
              <CardDescription>
                Tu mascota tendra su ficha medica digital completa, accesible desde cualquier
                dispositivo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Value props */}
              <div className="space-y-3">
                {[
                  {
                    icon: Stethoscope,
                    title: 'Historial clinico completo',
                    desc: 'Vacunas, consultas, examenes, cirugias — todo en un solo lugar.',
                  },
                  {
                    icon: Sparkles,
                    title: 'PDF descargable',
                    desc: 'Genera un PDF profesional de la ficha para compartir con cualquier veterinario.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Siempre actualizada',
                    desc: 'Tu veterinario puede agregar datos directamente desde Paw Friend.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 items-start p-3 bg-slate-50 rounded-xl"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                      <item.icon className="h-4.5 w-4.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview hint */}
              {petCreated && createdPetId && (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                  <p className="text-sm text-purple-700 font-medium mb-2">
                    Ya creaste a {name}. Puedes ver su ficha ahora mismo.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.setItem('pf_onboarding_complete', 'true');
                      navigate(`/ficha/${createdPetId}`);
                    }}
                    className="text-purple-700 border-purple-300 hover:bg-purple-100"
                  >
                    <FileText className="h-4 w-4 mr-1" /> Ver ficha de {name}
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                  disabled={petCreated}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atras
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <button
                onClick={skipAll}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Omitir
              </button>
            </CardContent>
          </>
        )}

        {/* ============ STEP 3: Find a vet ============ */}
        {step === 3 && (
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <Search className="h-7 w-7 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Busca un veterinario</CardTitle>
              <CardDescription>
                Encuentra veterinarios verificados cerca de ti. Filtra por comuna y especialidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* How it works */}
              <div className="space-y-3">
                {[
                  {
                    step: '1',
                    title: 'Explora el directorio',
                    desc: 'Veterinarios verificados en tu comuna, con resenas de otros duenos.',
                  },
                  {
                    step: '2',
                    title: 'Agenda una cita',
                    desc: 'Reserva directamente desde la app, sin llamadas ni WhatsApp.',
                  },
                  {
                    step: '3',
                    title: 'Ficha compartida',
                    desc: 'Tu veterinario accede a la ficha medica de tu mascota al instante.',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                      {item.step}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA to directory */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <p className="text-sm text-blue-700 mb-2">
                  Mas de 100 veterinarios ya estan en Paw Friend.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('pf_onboarding_complete', 'true');
                    navigate('/veterinarios');
                  }}
                  className="text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  <Search className="h-4 w-4 mr-1" /> Explorar directorio
                </Button>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atras
                </Button>
                <Button onClick={completeOnboarding} className="flex-1" size="lg">
                  Ir a mi inicio <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Puedes explorar todo esto despues desde tu dashboard.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default OnboardingDuenoMinimal;
