import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Camera, ChevronRight, ChevronLeft, Heart, MapPin } from '@/lib/icons';
import { describeSupabaseError } from '@/lib/supabaseErrors';
import { generatePawCardData } from '@/hooks/useHoloPattern';
import { COMUNAS_SANTIAGO } from '@/lib/locations';

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

const INTERESTS = [
  { id: 'vets', label: 'Veterinarios cercanos', emoji: '🩺' },
  { id: 'adoption', label: 'Adopción', emoji: '🏠' },
  { id: 'community', label: 'Comunidad pet', emoji: '💬' },
  { id: 'pet_friendly', label: 'Lugares pet friendly', emoji: '☕' },
  { id: 'insurance', label: 'Seguros', emoji: '🛡️' },
] as const;

const OnboardingDuenoMinimal = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step tracking
  const [step, setStep] = useState(1);

  // Step 1: Pet basics
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Step 2: Health basics
  const [neutered, setNeutered] = useState<boolean | null>(null);
  const [bloodType, setBloodType] = useState('');
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState<boolean | null>(null);
  const [allergies, setAllergies] = useState('');

  // Step 3: Location & interests
  const [comuna, setComuna] = useState('');
  const [comunaSearch, setComunaSearch] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

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
      toast.error('No se pudo subir la foto, pero tu mascota se creará igual.');
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('pet-photos').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('El nombre de tu mascota es obligatorio.');
      setStep(1);
      return;
    }
    if (!user) {
      toast.error('Tu sesión expiró. Inicia sesión de nuevo.');
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const photoUrl = await uploadPhoto();

      const pawCard = generatePawCardData();

      // Build allergies array
      const allergiesArray = allergies.trim()
        ? allergies
            .split(',')
            .map((a) => a.trim())
            .filter(Boolean)
        : null;

      const { data: insertedPet, error } = await supabase.from('pets').insert({
        owner_id: user.id,
        name: name.trim(),
        species: species ?? 'perro',
        birth_date: ageRange ? approximateBirthDate(ageRange) : null,
        photo_url: photoUrl,
        is_public: true,
        holo_pattern: pawCard.holoPattern,
        paw_card_id: pawCard.pawCardId,
        neutered: neutered,
        blood_type: bloodType || null,
        vaccines_up_to_date: vaccinesUpToDate,
        allergies: allergiesArray,
      }).select('id').single();
      if (error) throw error;

      // Update profile with location and interests if provided
      const profileUpdate: Record<string, unknown> = {};
      if (comuna) profileUpdate.location = comuna;
      if (selectedInterests.length > 0) profileUpdate.interests = selectedInterests;
      if (Object.keys(profileUpdate).length > 0) {
        await supabase.from('profiles').update(profileUpdate).eq('id', user.id);
      }

      const completeness =
        30 +
        (neutered !== null ? 15 : 0) +
        (vaccinesUpToDate !== null ? 10 : 0) +
        (comuna ? 15 : 0) +
        (bloodType ? 10 : 0) +
        (photoUrl ? 10 : 0) +
        (allergiesArray ? 10 : 0);
      const pct = Math.min(completeness, 100);

      toast.success(
        `Tu ficha está al ${pct}%. ${pct < 80 ? 'Puedes completar más desde la ficha clínica.' : '¡Excelente!'}`,
        {
          duration: 5000,
        }
      );
      navigate(insertedPet?.id ? `/ficha/${insertedPet.id}` : '/home');
    } catch (err) {
      toast.error(describeSupabaseError(err as Parameters<typeof describeSupabaseError>[0]));
    } finally {
      setLoading(false);
    }
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

  const filteredComunas = comunaSearch.trim()
    ? COMUNAS_SANTIAGO.filter((c) => c.toLowerCase().includes(comunaSearch.toLowerCase())).slice(
        0,
        6
      )
    : [];

  const progressPct = step === 1 ? 33 : step === 2 ? 66 : 100;

  const canAdvanceStep1 = name.trim().length > 0;

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <Card className="w-full max-w-md">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Paso {step} de 3</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ============ STEP 1: Pet basics ============ */}
        {step === 1 && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl">Agrega tu mascota</CardTitle>
              <CardDescription>Solo necesitas el nombre. Lo demás es opcional.</CardDescription>
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
                onClick={() => setStep(2)}
                disabled={!canAdvanceStep1}
                className="w-full"
                size="lg"
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </>
        )}

        {/* ============ STEP 2: Health basics ============ */}
        {step === 2 && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                Salud de {name || 'tu mascota'}
              </CardTitle>
              <CardDescription>
                Estos datos ayudan a tener una ficha más completa. Todo es opcional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Neutered */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">¿Está esterilizado/a?</p>
                <div className="flex gap-2">
                  {[
                    { value: true, label: 'Sí' },
                    { value: false, label: 'No' },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setNeutered(neutered === opt.value ? null : opt.value)}
                      className={`flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                        neutered === opt.value
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vaccines */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">¿Vacunas al día?</p>
                <div className="flex gap-2">
                  {[
                    { value: true, label: 'Sí' },
                    { value: false, label: 'No' },
                    { value: null as boolean | null, label: 'No sé' },
                  ].map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setVaccinesUpToDate(vaccinesUpToDate === opt.value ? null : opt.value)
                      }
                      className={`flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                        vaccinesUpToDate === opt.value &&
                        !(opt.value === null && vaccinesUpToDate === null && idx !== 2)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blood type */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">
                  Tipo de sangre{' '}
                  <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                </p>
                <Input
                  placeholder={species === 'gato' ? 'Ej: A, B, AB' : 'Ej: DEA 1.1+, DEA 1.1-'}
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  maxLength={30}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Tu veterinario puede determinarlo con un examen rápido.
                </p>
              </div>

              {/* Allergies */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">
                  Alergias conocidas{' '}
                  <span className="text-xs text-slate-400 font-normal">(opcional)</span>
                </p>
                <Input
                  placeholder="Ej: pollo, ácaros, penicilina"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  maxLength={200}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg">
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <button
                onClick={() => {
                  setStep(3);
                }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Saltar este paso
              </button>
            </CardContent>
          </>
        )}

        {/* ============ STEP 3: Location & Interests ============ */}
        {step === 3 && (
          <>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <MapPin className="h-5 w-5 text-purple-500" />
                Tu ubicación
              </CardTitle>
              <CardDescription>
                Para conectarte con veterinarios y servicios cercanos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Comuna autocomplete */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">Tu comuna</p>
                {comuna ? (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <MapPin className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">{comuna}</span>
                    <button
                      onClick={() => {
                        setComuna('');
                        setComunaSearch('');
                      }}
                      className="ml-auto text-xs text-purple-400 hover:text-purple-600"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Busca tu comuna..."
                      value={comunaSearch}
                      onChange={(e) => setComunaSearch(e.target.value)}
                      autoFocus
                    />
                    {filteredComunas.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredComunas.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setComuna(c);
                              setComunaSearch('');
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Interests */}
              <div>
                <p className="text-sm font-medium mb-2 text-slate-700">¿Qué te interesa?</p>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => toggleInterest(interest.id)}
                      className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${
                        selectedInterests.includes(interest.id)
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-purple-400'
                      }`}
                    >
                      {interest.emoji} {interest.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Atrás
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1" size="lg">
                  {loading ? 'Guardando...' : 'Crear mascota'}
                </Button>
              </div>

              <p className="text-xs text-center text-slate-400">
                Puedes cambiar todo esto después desde tu perfil.
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default OnboardingDuenoMinimal;
