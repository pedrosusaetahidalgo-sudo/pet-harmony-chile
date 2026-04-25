/**
 * TabMas — accesos secundarios cuando FICHA_TABS_V2 esta activo.
 *
 * Refactor Maestro 2026-04-25 §FICHA_TABS_V2.
 *
 * Acomoda lo que en la version legacy estaba en tabs separados:
 *   - Compartir ficha (solo owner)
 *   - Hábitos detallados (alimentacion, rutinas)
 *   - Historial completo (vista tabla legacy)
 *   - Documentos PDF/ZIP
 *
 * Cada uno como card grande tappable. Tap abre el componente legacy en
 * un Drawer/Modal — evitamos reescribir lo que ya funciona.
 */
import { useState } from 'react';
import { lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Share2, UtensilsCrossed, FileText, ClipboardList, ChevronRight } from 'lucide-react';

const TabCompartir = lazy(() =>
  import('@/pages/PetClinicalRecord/tabs/TabCompartir').then((m) => ({
    default: m.TabCompartir,
  }))
);
const TabAlimentacion = lazy(() =>
  import('@/pages/PetClinicalRecord/tabs/TabAlimentacion').then((m) => ({
    default: m.TabAlimentacion,
  }))
);
const TabHistorial = lazy(() =>
  import('@/pages/PetClinicalRecord/tabs/TabHistorial').then((m) => ({
    default: m.TabHistorial,
  }))
);
const TabDocumentos = lazy(() =>
  import('@/pages/PetClinicalRecord/tabs/TabDocumentos').then((m) => ({
    default: m.TabDocumentos,
  }))
);

type SectionKey = 'compartir' | 'alimentacion' | 'documentos' | 'historial';

// Tipo minimo del pet (los tabs legacy necesitan el objeto completo).
// Usamos unknown + cast en el tab Alimentacion para evitar dependencia
// circular con el tipo PetData de PetClinicalRecord/types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PetLike = any;

interface TabMasProps {
  pet: PetLike & { id: string; name: string; owner_id: string };
  isOwner: boolean;
  viewMode: 'owner' | 'vet';
  onRefresh: () => void;
}

interface SectionMeta {
  key: SectionKey;
  label: string;
  description: string;
  Icon: typeof Share2;
  iconBg: string;
  iconColor: string;
  ownerOnly?: boolean;
}

const SECTIONS: SectionMeta[] = [
  {
    key: 'compartir',
    label: 'Compartir ficha',
    description: 'Generar link de 30 días para vet o cuidador.',
    Icon: Share2,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    ownerOnly: true,
  },
  {
    key: 'alimentacion',
    label: 'Hábitos detallados',
    description: 'Comida, rutina, suplementos.',
    Icon: UtensilsCrossed,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    key: 'documentos',
    label: 'Documentos',
    description: 'PDFs adjuntos, exámenes, recetas.',
    Icon: FileText,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
  },
  {
    key: 'historial',
    label: 'Historial completo',
    description: 'Vista tabla con todos los registros.',
    Icon: ClipboardList,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
];

export function TabMas({ pet, isOwner, viewMode, onRefresh }: TabMasProps) {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const visibleSections = SECTIONS.filter((s) => !s.ownerOnly || isOwner);

  return (
    <div className="space-y-2">
      {visibleSections.map((s) => (
        <Card
          key={s.key}
          className="cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setOpenSection(s.key)}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div
              className={`shrink-0 inline-flex h-10 w-10 rounded-full items-center justify-center ${s.iconBg}`}
            >
              <s.Icon className={`h-5 w-5 ${s.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      ))}

      {/* Drawer para cada seccion (lazy-load del componente legacy) */}
      <Drawer open={openSection !== null} onOpenChange={(open) => !open && setOpenSection(null)}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{SECTIONS.find((s) => s.key === openSection)?.label}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <Suspense fallback={<Skeleton className="h-32 w-full" />}>
              {openSection === 'compartir' && <TabCompartir petId={pet.id} petName={pet.name} />}
              {openSection === 'alimentacion' && (
                <TabAlimentacion pet={pet} onRefresh={onRefresh} viewMode={viewMode} />
              )}
              {openSection === 'documentos' && (
                <TabDocumentos petId={pet.id} viewMode={viewMode} petOwnerId={pet.owner_id} />
              )}
              {openSection === 'historial' && <TabHistorial petId={pet.id} />}
            </Suspense>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
