/**
 * CRM de Leads — Veterinarios a Domicilio + Clínicas Veterinarias.
 * Panel completo de gestión: filtros, tabla, detalle, outreach, stats.
 * Dos tabs: Domiciliarios y Clínicas.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Phone,
  Mail,
  ExternalLink,
  Instagram,
  MapPin,
  Star,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Users,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronUp,
  Globe,
  Hash,
  Building,
  AlertCircle,
  ArrowRight,
  BarChart3,
} from '@/lib/icons';
import {
  useLeadsVets,
  useLeadsStats,
  useUpdateLeadEstado,
  useRegistrarContacto,
  useEnviarOutreach,
  type VetLead,
  type EstadoLead,
  type LeadsFilters,
} from '@/hooks/useLeadsVets';

// ── Constantes ──────────────────────────────────────────

const ESTADOS: { value: EstadoLead; label: string; color: string; icon: React.ElementType }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-slate-500', icon: Clock },
  { value: 'contactado', label: 'Contactado', color: 'bg-blue-500', icon: Send },
  { value: 'respondio', label: 'Respondió', color: 'bg-yellow-500', icon: MessageSquare },
  { value: 'interesado', label: 'Interesado', color: 'bg-purple-500', icon: Star },
  { value: 'convertido', label: 'Convertido', color: 'bg-green-500', icon: CheckCircle2 },
  { value: 'descartado', label: 'Descartado', color: 'bg-red-500', icon: XCircle },
];

const REGISTRO_VET_URL = 'https://pawfriend.cl/registro-veterinario';

const TEMPLATES = {
  invitacion_email: {
    nombre: 'Invitacion a registrarse (Email)',
    asunto: 'Paw Friend te invita: tu perfil veterinario gratis + ficha clinica digital',
    cuerpo: `Hola {nombre},

Soy parte del equipo fundador de Paw Friend (pawfriend.cl), una plataforma chilena hecha para veterinarios y duenos de mascotas.

Te escribo porque vi que ofreces atencion en {comunas} y creo que Paw Friend te puede servir mucho. La plataforma tiene dos experiencias:

PARA TI COMO VETERINARIO:
- Perfil profesional publico en nuestro directorio (posicionado en Google)
- Dashboard clinico: gestiona pacientes, fichas clinicas digitales y notas de consulta
- Agenda online: los duenos te reservan directo, sin llamadas
- Recordatorios automaticos de vacunas y controles a tus pacientes
- Reportes semanales de tu actividad clinica
- Ficha medica PDF descargable por paciente (nuestra joya)

PARA LOS DUENOS DE TUS PACIENTES:
- Acceden a la ficha clinica de su mascota desde el celular
- Reciben recordatorios de vacunas, desparasitaciones y controles
- Pueden compartir la ficha con otro vet si viajan o necesitan urgencia

El registro es gratuito y toma 2 minutos:
${REGISTRO_VET_URL}

Si tienes dudas, respondeme este correo o escribeme por WhatsApp al +56 9 XXXX XXXX.

Saludos,
Equipo Paw Friend
pawfriend.cl
pawfriendcl@gmail.com`,
  },
  invitacion_whatsapp: {
    nombre: 'Invitacion a registrarse (WhatsApp)',
    asunto: '',
    cuerpo: `Hola {nombre}! Te escribimos desde Paw Friend (pawfriend.cl).

Vi que haces atencion veterinaria en {comunas} y queria invitarte a la plataforma.

Paw Friend tiene un panel profesional para vets donde puedes:
- Tener tu perfil publico en nuestro directorio
- Gestionar fichas clinicas digitales de tus pacientes
- Recibir reservas online
- Generar PDF de ficha medica por paciente

Los duenos de mascotas acceden a la ficha de su mascota, reciben recordatorios de vacunas y pueden compartir la ficha con otro vet.

Es gratis registrarse: ${REGISTRO_VET_URL}

Te interesa? Puedo ayudarte a configurar tu cuenta en 2 minutos.`,
  },
  seguimiento_email: {
    nombre: 'Seguimiento (Email)',
    asunto: 'Re: Paw Friend - tu perfil veterinario gratis',
    cuerpo: `Hola {nombre},

Te escribi hace unos dias sobre Paw Friend. Queria saber si tuviste oportunidad de ver la plataforma.

Los duenos de mascotas en {comunas} estan buscando veterinarios activamente y tu perfil podria aparecer en los primeros resultados de Google.

Registrarte toma 2 minutos y es gratis:
${REGISTRO_VET_URL}

Si prefieres, te ayudamos a crear tu cuenta y te enviamos el acceso listo.

Saludos,
Equipo Paw Friend`,
  },
  seguimiento_whatsapp: {
    nombre: 'Seguimiento (WhatsApp)',
    asunto: '',
    cuerpo: `Hola {nombre}! Te escribi hace unos dias sobre Paw Friend.

Queria recordarte que puedes tener tu perfil veterinario gratis en nuestra plataforma. Los duenos en {comunas} buscan vets como tu.

Registro gratis en 2 min: ${REGISTRO_VET_URL}

Te ayudo a configurarlo?`,
  },
};

// ── Wrapper con tabs ────────────────────────────────────

export default function AdminLeadsCRM() {
  const [activeTab, setActiveTab] = useState('domiciliarios');
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">CRM Leads Veterinarios</h2>
        <p className="text-xs text-slate-400">Pipeline comercial B2B — scraping incremental</p>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800">
          <TabsTrigger value="domiciliarios">Domiciliarios</TabsTrigger>
          <TabsTrigger value="clinicas">Clínicas</TabsTrigger>
        </TabsList>
        <TabsContent value="domiciliarios">
          <DomiciliariosPanel />
        </TabsContent>
        <TabsContent value="clinicas">
          <ClinicasPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClinicasPlaceholder() {
  const { data: stats } = useLeadsStats();
  const { data: leads = [] } = useLeadsVets({});
  const [clinicaFilters, setClinicaFilters] = useState<LeadsFilters>({});
  const [showClinicaFilters, setShowClinicaFilters] = useState(false);

  const conClinica = useMemo(() => leads.filter((l) => l.tiene_clinica_fisica).length, [leads]);

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total leads" value={stats?.total ?? 0} icon={Users} />
        <StatCard
          label="Con clínica física"
          value={conClinica}
          icon={Building}
          color="text-amber-400"
        />
        <StatCard
          label="Convertidos"
          value={stats?.por_estado?.convertido ?? 0}
          icon={CheckCircle2}
          color="text-green-400"
        />
        <StatCard
          label="Con contacto"
          value={stats?.con_contacto ?? 0}
          icon={Phone}
          color="text-cyan-400"
        />
      </div>

      {/* Filters bar */}
      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar clínica..."
              value={clinicaFilters.busqueda || ''}
              onChange={(e) => setClinicaFilters((f) => ({ ...f, busqueda: e.target.value }))}
              className="pl-9 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClinicaFilters(!showClinicaFilters)}
            className="border-slate-700 text-slate-300"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
            {showClinicaFilters ? (
              <ChevronUp className="h-3 w-3 ml-1" />
            ) : (
              <ChevronDown className="h-3 w-3 ml-1" />
            )}
          </Button>
        </div>

        {showClinicaFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <Select
              value={clinicaFilters.estado || 'todos'}
              onValueChange={(v) =>
                setClinicaFilters((f) => ({ ...f, estado: v as EstadoLead | 'todos' }))
              }
            >
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filtrar por comuna..."
              value={clinicaFilters.comuna || ''}
              onChange={(e) => setClinicaFilters((f) => ({ ...f, comuna: e.target.value }))}
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>
        )}
      </div>

      {/* Main message card */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center text-slate-400">
          <Building className="h-10 w-10 mx-auto mb-3 text-slate-500" />
          <p className="text-lg font-medium text-white mb-2">Clinicas Veterinarias RM</p>
          <p className="text-sm">
            Pipeline de clinicas listo. Ejecuta{' '}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">
              python run_clinicas.py
            </code>{' '}
            para poblar datos.
          </p>
          <p className="text-xs mt-3 text-slate-500">
            Una vez cargados, apareceran aqui con los mismos controles CRM.
          </p>
          {conClinica > 0 && (
            <p className="text-xs mt-2 text-amber-400">
              {conClinica} leads domiciliarios tienen clinica fisica asociada.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Panel Domiciliarios ─────────────────────────────────

function DomiciliariosPanel() {
  const [filters, setFilters] = useState<LeadsFilters>({});
  const [selectedLead, setSelectedLead] = useState<VetLead | null>(null);
  const [showOutreachDialog, setShowOutreachDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [outreachCanal, setOutreachCanal] = useState<'email' | 'whatsapp'>('email');
  const [outreachTemplate, setOutreachTemplate] = useState('presentacion');
  const [customMessage, setCustomMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notaEstado, setNotaEstado] = useState('');

  const { data: leads = [], isLoading } = useLeadsVets(filters);
  const { data: stats } = useLeadsStats();

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.busqueda ||
      (filters.estado && filters.estado !== 'todos') ||
      (filters.prioridad && filters.prioridad !== 'todas') ||
      filters.fuente ||
      filters.comuna
    );
  }, [filters]);
  const updateEstado = useUpdateLeadEstado();
  const registrarContacto = useRegistrarContacto();
  const enviarOutreach = useEnviarOutreach();

  // ── Pipeline funnel ──────────────────────────────────────

  const pipelineStages = useMemo(() => {
    const stages: { key: EstadoLead; label: string; color: string }[] = [
      { key: 'pendiente', label: 'Pendiente', color: 'bg-slate-500' },
      { key: 'contactado', label: 'Contactado', color: 'bg-blue-500' },
      { key: 'respondio', label: 'Respondio', color: 'bg-yellow-500' },
      { key: 'interesado', label: 'Interesado', color: 'bg-purple-500' },
      { key: 'convertido', label: 'Convertido', color: 'bg-green-500' },
    ];
    const counts = stages.map((s) => ({
      ...s,
      count: stats?.por_estado?.[s.key] ?? 0,
    }));
    const maxCount = Math.max(...counts.map((c) => c.count), 1);
    return { stages: counts, maxCount };
  }, [stats]);

  const PipelineMetrics = () => (
    <Card className="bg-slate-900 border-slate-800 mb-4">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Pipeline de conversion
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-2">
          {pipelineStages.stages.map((stage, i) => {
            const pct =
              pipelineStages.maxCount > 0
                ? Math.round((stage.count / pipelineStages.maxCount) * 100)
                : 0;
            const prev = i > 0 ? pipelineStages.stages[i - 1] : null;
            const convRate =
              prev && prev.count > 0 ? Math.round((stage.count / prev.count) * 100) : null;
            return (
              <div key={stage.key}>
                {i > 0 && convRate !== null && (
                  <div className="flex items-center gap-1 ml-2 my-0.5">
                    <ArrowRight className="h-3 w-3 text-slate-600" />
                    <span className="text-[10px] text-slate-500">{convRate}%</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-24 shrink-0">{stage.label}</span>
                  <div className="flex-1 bg-slate-800 rounded-full h-5 overflow-hidden">
                    <div
                      className={`${stage.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    >
                      {pct > 15 && (
                        <span className="text-[10px] font-bold text-white">{stage.count}</span>
                      )}
                    </div>
                  </div>
                  {pct <= 15 && (
                    <span className="text-xs font-medium text-slate-300 w-8 text-right">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  // ── Avg time in pipeline ────────────────────────────────

  const avgPipelineDays = useMemo(() => {
    const contactados = leads.filter(
      (l) =>
        l.estado_validacion !== 'pendiente' && l.fecha_ultimo_contacto && l.fecha_primer_contacto
    );
    if (contactados.length === 0) return null;
    const totalDays = contactados.reduce((sum, l) => {
      const created = new Date(l.fecha_captura).getTime();
      const contacted = new Date(l.fecha_ultimo_contacto!).getTime();
      return sum + (contacted - created) / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(totalDays / contactados.length);
  }, [leads]);

  // ── Leads by fuente chart ───────────────────────────────

  const fuenteData = useMemo(() => {
    const byFuente = stats?.por_fuente ?? {};
    const entries = Object.entries(byFuente).sort(([, a], [, b]) => (b as number) - (a as number));
    const maxVal = entries.length > 0 ? Math.max(...entries.map(([, v]) => v as number), 1) : 1;
    return { entries, maxVal };
  }, [stats]);

  // ── Stats cards ─────────────────────────────────────────

  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
      <StatCard label="Total leads" value={stats?.total ?? leads.length} icon={Users} />
      <StatCard
        label="Pendientes"
        value={stats?.por_estado?.pendiente ?? 0}
        icon={Clock}
        color="text-slate-400"
      />
      <StatCard
        label="Contactados"
        value={stats?.por_estado?.contactado ?? 0}
        icon={Send}
        color="text-blue-400"
      />
      <StatCard
        label="Interesados"
        value={stats?.por_estado?.interesado ?? 0}
        icon={Star}
        color="text-purple-400"
      />
      <StatCard
        label="Convertidos"
        value={stats?.por_estado?.convertido ?? 0}
        icon={CheckCircle2}
        color="text-green-400"
      />
      <StatCard
        label="Con contacto"
        value={stats?.con_contacto ?? 0}
        icon={Phone}
        color="text-cyan-400"
      />
      <StatCard
        label="Tiempo prom. pipeline"
        value={avgPipelineDays ?? 0}
        icon={Clock}
        color="text-orange-400"
        suffix={avgPipelineDays !== null ? 'd' : ''}
      />
    </div>
  );

  // ── Fuente chart ────────────────────────────────────────

  const FuenteChart = () => {
    if (fuenteData.entries.length === 0) return null;
    return (
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Leads por fuente
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-1.5">
            {fuenteData.entries.map(([fuente, count]) => {
              const pct = Math.round(((count as number) / fuenteData.maxVal) * 100);
              return (
                <div key={fuente} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-28 shrink-0 truncate">{fuente}</span>
                  <div className="flex-1 bg-slate-800 rounded h-4 overflow-hidden">
                    <div
                      className="bg-indigo-500/70 h-full rounded transition-all duration-500"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-300 w-8 text-right">
                    {count as number}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ── Filtros ─────────────────────────────────────────────

  const FiltersBar = () => (
    <div className="space-y-3 mb-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por nombre, IG, teléfono..."
            value={filters.busqueda || ''}
            onChange={(e) => setFilters((f) => ({ ...f, busqueda: e.target.value }))}
            className="pl-9 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="border-slate-700 text-slate-300"
        >
          <Filter className="h-4 w-4 mr-1" />
          Filtros
          {showFilters ? (
            <ChevronUp className="h-3 w-3 ml-1" />
          ) : (
            <ChevronDown className="h-3 w-3 ml-1" />
          )}
        </Button>
        <Button
          size="sm"
          onClick={() => setShowOutreachDialog(true)}
          disabled={selectedIds.size === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Send className="h-4 w-4 mr-1" />
          Outreach ({selectedIds.size})
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <Select
            value={filters.estado || 'todos'}
            onValueChange={(v) => setFilters((f) => ({ ...f, estado: v as EstadoLead | 'todos' }))}
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.prioridad || 'todas'}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, prioridad: v as 'alta' | 'media' | 'baja' | 'todas' }))
            }
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.fuente || 'todas'}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, fuente: v === 'todas' ? undefined : v }))
            }
          >
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Fuente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las fuentes</SelectItem>
              <SelectItem value="Google Maps">Google Maps</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="CMV">CMV</SelectItem>
              <SelectItem value="Vetting.cl">Vetting.cl</SelectItem>
              <SelectItem value="DrPet">DrPet</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Filtrar por comuna..."
            value={filters.comuna || ''}
            onChange={(e) => setFilters((f) => ({ ...f, comuna: e.target.value }))}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
      )}
    </div>
  );

  // ── Tabla de leads ──────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leads.map((l) => l.id)));
    }
  };

  const LeadsTable = () => (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-slate-300">
            {leads.length} leads{filters.busqueda ? ` (filtrado)` : ''}
          </CardTitle>
          <label
            htmlFor="leads-select-all"
            className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer"
          >
            <input
              id="leads-select-all"
              type="checkbox"
              checked={selectedIds.size === leads.length && leads.length > 0}
              onChange={selectAll}
              className="rounded border-slate-600"
              aria-label="Seleccionar todos los leads"
            />
            {selectedIds.size > 0
              ? `${selectedIds.size} de ${leads.length} seleccionados`
              : 'Seleccionar todos'}
          </label>
        </div>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-380px)]">
        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Cargando leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 font-medium">No se encontraron leads</p>
              {hasActiveFilters ? (
                <div className="mt-2 space-y-2">
                  <p className="text-xs text-slate-500">
                    Los filtros activos no coinciden con ningun lead. Intenta ajustar la busqueda,
                    el estado o la comuna.
                  </p>
                  <button
                    onClick={() => setFilters({})}
                    className="text-sm text-indigo-400 hover:underline"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">
                  Ejecuta el scraping para poblar el pipeline de leads.
                </p>
              )}
            </div>
          ) : (
            leads.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                isSelected={selectedIds.has(lead.id)}
                onToggleSelect={() => toggleSelect(lead.id)}
                onOpenDetail={() => setSelectedLead(lead)}
                onQuickUpdateEstado={(estado) => updateEstado.mutate({ leadId: lead.id, estado })}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );

  // ── Outreach dialog ──────────────────────────────────────

  const OutreachDialog = () => {
    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    const tpl = TEMPLATES[outreachTemplate as keyof typeof TEMPLATES];
    const preview = tpl
      ? tpl.cuerpo
          .replace(/{nombre}/g, selectedLeads[0]?.nombre_completo || '[nombre]')
          .replace(/{comunas}/g, selectedLeads[0]?.comunas_cobertura?.join(', ') || '[comunas]')
          .replace(/{total_vets}/g, String(stats?.total ?? 0))
      : customMessage;

    return (
      <Dialog open={showOutreachDialog} onOpenChange={setShowOutreachDialog}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Enviar Outreach ({selectedIds.size} leads)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="outreach-canal" className="text-xs text-slate-400 mb-1 block">
                  Canal
                </label>
                <Select
                  value={outreachCanal}
                  onValueChange={(v) => setOutreachCanal(v as 'email' | 'whatsapp')}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="outreach-template" className="text-xs text-slate-400 mb-1 block">
                  Template
                </label>
                <Select value={outreachTemplate} onValueChange={setOutreachTemplate}>
                  <SelectTrigger className="bg-slate-800 border-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATES).map(([key, tpl]) => (
                      <SelectItem key={key} value={key}>
                        {tpl.nombre}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Mensaje personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {outreachTemplate === 'custom' ? (
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="h-48 bg-slate-800 border-slate-700"
              />
            ) : (
              <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {preview}
              </div>
            )}

            <div className="text-xs text-slate-400">
              Leads sin {outreachCanal === 'email' ? 'email' : 'WhatsApp'} serán omitidos.
              {outreachCanal === 'whatsapp' && (
                <span className="text-yellow-400 ml-1">
                  WhatsApp abrirá links wa.me para envío manual (API Meta pendiente).
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOutreachDialog(false)}
              className="border-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                const msg = outreachTemplate === 'custom' ? customMessage : tpl?.cuerpo || '';
                enviarOutreach.mutate(
                  { leadIds: Array.from(selectedIds), canal: outreachCanal, template: msg },
                  {
                    onSuccess: () => {
                      setShowOutreachDialog(false);
                      setSelectedIds(new Set());
                    },
                  }
                );
              }}
              disabled={enviarOutreach.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4 mr-1" />
              {enviarOutreach.isPending ? 'Enviando...' : `Enviar a ${selectedIds.size} leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Lead detail panel ─────────────────────────────────────

  const LeadDetailPanel = () => {
    if (!selectedLead) return null;
    const lead = selectedLead;

    return (
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {lead.nombre_completo}
              <PrioridadBadge prioridad={lead.prioridad_outreach} />
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Contacto */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Contacto</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {lead.telefono && (
                  <a
                    href={`tel:${lead.telefono}`}
                    className="flex items-center gap-1.5 text-cyan-400 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" /> {lead.telefono}
                  </a>
                )}
                {lead.whatsapp && (
                  <a
                    href={`https://wa.me/${lead.whatsapp.replace('+', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-green-400 hover:underline"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                {lead.email && (
                  <a
                    href={`mailto:${lead.email}`}
                    className="flex items-center gap-1.5 text-blue-400 hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5" /> {lead.email}
                  </a>
                )}
                {lead.instagram && (
                  <a
                    href={`https://instagram.com/${lead.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-pink-400 hover:underline"
                  >
                    <Instagram className="h-3.5 w-3.5" /> @{lead.instagram}
                    {lead.instagram_seguidores
                      ? ` (${lead.instagram_seguidores.toLocaleString()})`
                      : ''}
                  </a>
                )}
                {lead.sitio_web && (
                  <a
                    href={lead.sitio_web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-300 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" /> Web
                  </a>
                )}
                {lead.tiktok && (
                  <a
                    href={`https://tiktok.com/@${lead.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-300 hover:underline"
                  >
                    <Hash className="h-3.5 w-3.5" /> TikTok
                  </a>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Información</h4>
              <div className="text-sm space-y-1 text-slate-300">
                {lead.comunas_cobertura?.length > 0 && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    {lead.comunas_cobertura.join(', ')}
                  </p>
                )}
                <p>Fuente: {lead.fuente_dato}</p>
                <p>Score digital: {lead.presencia_digital_score ?? '-'}/5</p>
                <p>Clínica física: {lead.tiene_clinica_fisica ? 'Sí' : 'No'}</p>
                {lead.intentos_contacto > 0 && (
                  <p>Intentos de contacto: {lead.intentos_contacto}</p>
                )}
                {lead.fecha_ultimo_contacto && (
                  <p>
                    Último contacto:{' '}
                    {new Date(lead.fecha_ultimo_contacto).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            </div>

            {/* Notas */}
            {lead.notas && (
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-400 uppercase">Notas</h4>
                <p className="text-xs text-slate-400 bg-slate-800 rounded p-2">{lead.notas}</p>
              </div>
            )}

            {/* Cambiar estado */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase">Cambiar estado</h4>
              <div className="flex flex-wrap gap-1.5">
                {ESTADOS.map((e) => (
                  <Button
                    key={e.value}
                    size="sm"
                    variant={lead.estado_validacion === e.value ? 'default' : 'outline'}
                    className={
                      lead.estado_validacion === e.value
                        ? `${e.color} text-white border-none text-xs`
                        : 'border-slate-700 text-slate-300 text-xs'
                    }
                    onClick={() => {
                      updateEstado.mutate(
                        { leadId: lead.id, estado: e.value, notas: notaEstado || undefined },
                        { onSuccess: () => setSelectedLead(null) }
                      );
                    }}
                  >
                    {e.label}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Nota al cambiar estado (opcional)..."
                value={notaEstado}
                onChange={(e) => setNotaEstado(e.target.value)}
                className="bg-slate-800 border-slate-700 text-sm"
              />
            </div>

            {/* Acciones rápidas */}
            <div className="flex gap-2">
              {lead.whatsapp && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-700 text-green-400 flex-1"
                  onClick={() => {
                    const msg = TEMPLATES.invitacion_whatsapp.cuerpo
                      .replace(/{nombre}/g, lead.nombre_completo.split(' ')[0])
                      .replace(/{comunas}/g, lead.comunas_cobertura?.join(', ') || 'tu zona');
                    window.open(
                      `https://wa.me/${lead.whatsapp!.replace('+', '')}?text=${encodeURIComponent(msg)}`,
                      '_blank'
                    );
                    registrarContacto.mutate({
                      leadId: lead.id,
                      canal: 'whatsapp',
                      notas: 'Invitacion WhatsApp enviada',
                      templateUsado: 'invitacion_whatsapp',
                    });
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" /> Invitar por WA
                </Button>
              )}
              {lead.email && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-700 text-blue-400 flex-1"
                  onClick={() => {
                    const tpl = TEMPLATES.invitacion_email;
                    const body = tpl.cuerpo
                      .replace(/{nombre}/g, lead.nombre_completo.split(' ')[0])
                      .replace(/{comunas}/g, lead.comunas_cobertura?.join(', ') || 'tu zona');
                    window.open(
                      `mailto:${lead.email}?subject=${encodeURIComponent(tpl.asunto)}&body=${encodeURIComponent(body)}`,
                      '_blank'
                    );
                    registrarContacto.mutate({
                      leadId: lead.id,
                      canal: 'email',
                      notas: 'Invitacion email enviada',
                      templateUsado: 'invitacion_email',
                    });
                  }}
                >
                  <Mail className="h-4 w-4 mr-1" /> Invitar por Email
                </Button>
              )}
              {lead.instagram && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-pink-700 text-pink-400 flex-1"
                  onClick={() => {
                    window.open(`https://instagram.com/${lead.instagram}`, '_blank');
                    registrarContacto.mutate({
                      leadId: lead.id,
                      canal: 'instagram',
                      notas: 'Perfil IG visitado',
                    });
                  }}
                >
                  <Instagram className="h-4 w-4 mr-1" /> IG
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // ── Render principal ──────────────────────────────────────

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={() => {
              const pendientes = leads.filter(
                (l) => l.estado_validacion === 'pendiente' && l.prioridad_outreach === 'alta'
              );
              if (pendientes.length === 0) {
                return;
              }
              setSelectedIds(new Set(pendientes.map((l) => l.id)));
              setOutreachTemplate('invitacion_email');
              setShowOutreachDialog(true);
            }}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Contactar prioridad alta
          </Button>
        </div>
      </div>

      <PipelineMetrics />
      <StatsCards />
      <FuenteChart />
      <FiltersBar />
      <LeadsTable />
      <OutreachDialog />
      <LeadDetailPanel />
    </div>
  );
}

// ── Sub-componentes ─────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-white',
  suffix = '',
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  suffix?: string;
}) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <div>
          <p className={`text-xl font-bold ${color}`}>
            {value}
            {suffix}
          </p>
          <p className="text-[10px] text-slate-400 uppercase">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function PrioridadBadge({ prioridad }: { prioridad: string }) {
  const styles: Record<string, string> = {
    alta: 'bg-red-500/20 text-red-300 border-red-500/30',
    media: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    baja: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[prioridad] || styles.baja}`}>
      {prioridad}
    </Badge>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const config = ESTADOS.find((e) => e.value === estado) || ESTADOS[0];
  return (
    <Badge className={`${config.color} text-white text-[10px] border-none`}>{config.label}</Badge>
  );
}

function LeadRow({
  lead,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onQuickUpdateEstado,
}: {
  lead: VetLead;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  onQuickUpdateEstado: (estado: EstadoLead) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${
        isSelected ? 'bg-indigo-900/20' : ''
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="rounded border-slate-600 shrink-0"
        onClick={(e) => e.stopPropagation()}
        aria-label="Seleccionar lead"
      />

      <div
        className="flex-1 min-w-0"
        onClick={onOpenDetail}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenDetail();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-white truncate">{lead.nombre_completo}</span>
          <PrioridadBadge prioridad={lead.prioridad_outreach} />
          <EstadoBadge estado={lead.estado_validacion} />
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
          {lead.instagram && <span>@{lead.instagram}</span>}
          {lead.comunas_cobertura?.length > 0 && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-3 w-3" />
              {lead.comunas_cobertura.slice(0, 2).join(', ')}
              {lead.comunas_cobertura.length > 2 && ` +${lead.comunas_cobertura.length - 2}`}
            </span>
          )}
          <span>{lead.fuente_dato}</span>
          {lead.intentos_contacto > 0 && (
            <span className="text-blue-400">{lead.intentos_contacto}x contactado</span>
          )}
        </div>
      </div>

      {/* Canales disponibles */}
      <div className="flex gap-1 shrink-0">
        {lead.whatsapp && (
          <a
            href={`https://wa.me/${lead.whatsapp.replace('+', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-green-900/30 text-green-400"
            title="WhatsApp"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-blue-900/30 text-blue-400"
            title="Email"
          >
            <Mail className="h-3.5 w-3.5" />
          </a>
        )}
        {lead.instagram && (
          <a
            href={`https://instagram.com/${lead.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-pink-900/30 text-pink-400"
            title="Instagram"
          >
            <Instagram className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
