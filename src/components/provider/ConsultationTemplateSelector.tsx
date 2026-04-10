import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useConsultationTemplates,
  type ConsultationTemplate,
  type TemplateCategory,
} from '@/hooks/useConsultationTemplates';

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  vacunacion: 'Vacunación',
  control_sano: 'Control sano',
  post_esterilizacion: 'Post-esterilización',
  dermatologia: 'Dermatología',
  geriatrico: 'Geriátrico',
  urgencia: 'Urgencia',
  otro: 'Otro',
};

interface Props {
  providerId: string | undefined;
  onSelect: (templateBody: Record<string, unknown>) => void;
}

export default function ConsultationTemplateSelector({ providerId, onSelect }: Props) {
  const { data: templates, isLoading } = useConsultationTemplates(providerId);

  if (isLoading || !templates?.length) return null;

  // Agrupar por categoria
  const grouped = templates.reduce<Record<string, ConsultationTemplate[]>>((acc, t) => {
    const key = t.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const handleChange = (templateId: string) => {
    const found = templates.find((t) => t.id === templateId);
    if (found) onSelect(found.template_body);
  };

  return (
    <Select onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Usar una plantilla..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped).map(([category, items]) => (
          <SelectGroup key={category}>
            <SelectLabel>{CATEGORY_LABELS[category as TemplateCategory] ?? category}</SelectLabel>
            {items.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
                {!t.is_system && ' (mi plantilla)'}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
