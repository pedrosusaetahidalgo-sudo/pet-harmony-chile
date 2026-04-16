import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from '@/lib/icons';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const BIO_TEMPLATES = [
  {
    label: 'Clínica general',
    text: 'Médico veterinario con experiencia en medicina interna y cirugía de pequeños animales. Me apasiona la atención preventiva y crear un vínculo de confianza con cada tutor y su mascota.',
  },
  {
    label: 'Especialista',
    text: 'Veterinario especializado con formación de posgrado. Mi enfoque combina la evidencia clínica actualizada con un trato cercano, explicando cada paso del tratamiento para que tu mascota reciba la mejor atención posible.',
  },
  {
    label: 'Domicilio',
    text: 'Veterinario a domicilio dedicado a reducir el estrés de la visita clínica. Atiendo en la comodidad de tu hogar con el mismo equipamiento y profesionalismo, para que tu mascota se sienta tranquila durante la consulta.',
  },
];

interface Props {
  specialties?: string[];
  experienceYears?: number;
  currentBio: string;
  onBioChange: (bio: string) => void;
}

export function BioTemplateSelector({
  specialties,
  experienceYears,
  currentBio,
  onBioChange,
}: Props) {
  const [generating, setGenerating] = useState(false);

  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const prompt = `Redacta una bio profesional de 60-100 palabras en español chileno (tuteo: tú, tienes), para un veterinario con ${
        experienceYears || 'varios'
      } años de experiencia${
        specialties?.length ? `, especializado en ${specialties.join(', ')}` : ''
      }. Tono: profesional pero cercano. No usar emojis. Solo devuelve el texto de la bio, sin comillas ni prefijos.`;

      const { data, error } = await supabase.functions.invoke('pet-assistant', {
        body: { question: prompt, pet_id: null },
      });

      if (error) throw error;

      const answer = typeof data === 'string' ? data : data?.answer || data?.response || '';
      if (answer) {
        onBioChange(answer);
        toast.success('Bio generada. Puedes editarla antes de guardar.');
      } else {
        toast.error('No se pudo generar la bio. Intenta de nuevo.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar bio';
      if (msg.includes('rate') || msg.includes('quota')) {
        toast.error('Llegaste al límite diario de consultas IA. Intenta mañana.');
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Template chips */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1.5">Plantillas rápidas</p>
        <div className="flex flex-wrap gap-1.5">
          {BIO_TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onBioChange(t.text)}
              className="px-3 py-1 rounded-full text-xs border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* AI generate button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerateAI}
        disabled={generating}
        className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        {generating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generando con IA...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generar bio con IA
          </>
        )}
      </Button>

      {/* Textarea */}
      <Textarea
        value={currentBio}
        onChange={(e) => onBioChange(e.target.value)}
        placeholder="Cuéntales tu experiencia, enfoque y qué te diferencia..."
        rows={4}
        maxLength={500}
      />
      <p className="text-xs text-slate-400">{currentBio.length}/500 · mínimo 50 caracteres</p>
    </div>
  );
}
