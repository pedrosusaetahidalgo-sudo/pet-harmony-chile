/**
 * AdminB2BOutreach — outreach masivo a prospectos B2B.
 *
 * Cierra Task #8 del top 10 audit-readiness 2026-04-30. Convierte el
 * cuello de botella "envio manual a partners" en clicks desde admin.
 *
 * Flujo:
 *   1. Pedro elige audience (pharma/seguros/retail/gobierno/banca/edificios/longtail)
 *   2. Pega lista de recipients (email + nombre + empresa, separados por linea)
 *   3. Preview del template HTML (subject + bullets pregenerados)
 *   4. Submit → edge fn send-b2b-outreach envia con Resend
 *   5. Resultados con count enviados/error + log persistido en b2b_outreach_log
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  Mail,
  AlertCircle,
  CheckCircle2,
  Building2,
  ClipboardPaste,
  Eye,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

type AudienceKind =
  | 'pharma'
  | 'seguros'
  | 'retail'
  | 'gobierno'
  | 'banca'
  | 'edificios'
  | 'longtail';

/**
 * Seed CSV por audiencia — extraído de _pending/OUTREACH_PROSPECTS_SEED.md.
 * Botón "Pegar seed" del textarea inserta esta lista directo. Pedro debe
 * verificar/personalizar los emails antes de enviar.
 */
const AUDIENCE_SEEDS: Record<AudienceKind, string> = {
  pharma: `contacto@centrovet.cl, , Centrovet (Agrosuper)
info@virbac.cl, , Virbac Chile
contacto@msd-salud-animal.cl, , MSD Salud Animal
zoetis.chile@zoetis.com, , Zoetis Chile
contacto@drag-pharma.cl, , Drag Pharma
contacto@elanco.com, , Elanco Animal Health
info@boehringer-ingelheim.cl, , Boehringer Ingelheim
contacto@bayer.cl, , Bayer Animal Health`,
  seguros: `contacto@sura.cl, , Sura Seguros
contacto@bci-seguros.cl, , BCI Seguros
seguros@mapfre.cl, , Mapfre Chile
contacto@consorcio.cl, , Consorcio
contacto@hdi.cl, , HDI Seguros
contacto@security.cl, , Security Seguros
contacto@penta.cl, , Penta Security`,
  retail: `contacto@masterdog.cl, , Master Dog
contacto@puppis.cl, , Puppis
contacto@petstar.cl, , Pet Star
contacto@falabella.com, , Falabella Pet
contacto@petlovers.cl, , Pet Lovers
contacto@kingdog.cl, , King Dog
ventas@maxipet.cl, , Maxipet`,
  gobierno: `tenenciaresponsable@lascondes.cl, , Municipalidad Las Condes
mascotas@vitacura.cl, , Municipalidad Vitacura
tenenciaresponsable@providencia.cl, , Municipalidad Providencia
contacto@nunoa.cl, , Municipalidad Ñuñoa
mascotas@subdere.gov.cl, , SUBDERE`,
  banca: `contacto@santander.cl, , Banco Santander
contacto@bci.cl, , BCI Personas
contacto@itau.cl, , Itaú Chile
contacto@bancofalabella.cl, , Banco Falabella
contacto@bancoestado.cl, , BancoEstado`,
  edificios: `contacto@inmobiliariamanquehue.cl, , Inmobiliaria Manquehue
contacto@paz.cl, , PAZ Inmobiliaria
contacto@actual.cl, , Actual Inmobiliaria`,
  longtail: `contacto@latam.com, , LATAM Cargo (mascotas)
contacto@uautonoma.cl, , Universidad Autónoma (Vet)
contacto@uss.cl, , Universidad San Sebastián (Vet)`,
};

const AUDIENCE_LABELS: Record<AudienceKind, { label: string; subject: string }> = {
  pharma: {
    label: 'Pharma animal (Centrovet, MSD, Virbac, Zoetis)',
    subject: 'Paw Friend — acceso programatico a la ficha clinica longitudinal',
  },
  seguros: {
    label: 'Aseguradoras (Sura, BCI, Mapfre, Consorcio)',
    subject: 'Paw Friend — distribucion white-label de seguros pet',
  },
  retail: {
    label: 'Retail pet (Master Dog, Falabella Pet, Puppis)',
    subject: 'Paw Friend — canal de adquisicion contextual',
  },
  gobierno: {
    label: 'Gobierno municipios (Las Condes, Vitacura, Providencia, Nunoa)',
    subject: 'Paw Friend — registro digital Ley 21.020',
  },
  banca: {
    label: 'Banca premium (Santander, BCI, Itau, Falabella)',
    subject: 'Paw Friend — beneficio diferencial para clientes con mascota',
  },
  edificios: {
    label: 'Inmobiliarias / edificios pet-friendly',
    subject: 'Paw Friend — registro digital de mascotas para comunidades',
  },
  longtail: {
    label: 'Long-tail (aerolineas, academia vet, refugios privados)',
    subject: 'Paw Friend — alianza vertical pet-adjacent',
  },
};

interface OutreachResult {
  email: string;
  status: string;
  detail?: string;
}

interface StatRow {
  audience: string;
  total_sent: number;
  total_replied: number;
  reply_rate: number;
  last_sent: string | null;
}

function parseRecipients(
  raw: string
): { email: string; contact_name?: string; company?: string }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((l) => l.length > 0 && l.includes('@'))
    .map((line) => {
      // Formatos validos:
      //  - "email@x.cl"
      //  - "email@x.cl, Juan Perez"
      //  - "email@x.cl, Juan Perez, Empresa SA"
      const parts = line.split(',').map((p) => p.trim());
      return {
        email: parts[0],
        contact_name: parts[1] || undefined,
        company: parts[2] || undefined,
      };
    });
}

export default function AdminB2BOutreach() {
  const queryClient = useQueryClient();
  const [audience, setAudience] = useState<AudienceKind>('pharma');
  const [recipientsRaw, setRecipientsRaw] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customIntro, setCustomIntro] = useState('');
  const [results, setResults] = useState<OutreachResult[] | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const recipients = parseRecipients(recipientsRaw);

  const pasteSeed = () => {
    const seed = AUDIENCE_SEEDS[audience];
    setRecipientsRaw(seed);
    toast.info(
      `${seed.split('\n').length} prospectos de ${audience} cargados. Verifica los emails antes de enviar.`
    );
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['b2b_outreach_stats'],
    queryFn: async () => {
      const { data, error } = await sb.rpc('b2b_outreach_stats', { p_days: 30 });
      if (error) throw error;
      return (data as StatRow[]) || [];
    },
    staleTime: 60_000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await sb.functions.invoke('send-b2b-outreach', {
        body: {
          audience,
          recipients,
          custom_subject: customSubject || undefined,
          custom_intro: customIntro || undefined,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { enviados: number; errores: number; resultados: OutreachResult[] }) => {
      setResults(data.resultados);
      toast.success(`${data.enviados} enviados, ${data.errores} errores`);
      queryClient.invalidateQueries({ queryKey: ['b2b_outreach_stats'] });
    },
    onError: (err: Error) => {
      toast.error(`Error: ${err.message}`);
    },
  });

  const cfg = AUDIENCE_LABELS[audience];
  const previewSubject = customSubject || cfg.subject;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Send className="size-5" />
          Outreach B2B
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Envio masivo a prospectos partner (max 100 por batch). Templates pregenerados por audience
          con CTA al form /aplicar?tipo=...
        </p>
      </div>

      {/* Stats card */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 text-sm">Ultimos 30 dias</h3>
          {statsLoading ? (
            <Skeleton className="h-20" />
          ) : !stats || stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin envios registrados aun.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.audience} className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs uppercase font-semibold text-muted-foreground">
                    {s.audience}
                  </div>
                  <div className="text-2xl font-bold mt-1">{s.total_sent}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.total_replied} respondieron ({s.reply_rate}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compose form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as AudienceKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(AUDIENCE_LABELS) as AudienceKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {AUDIENCE_LABELS[k].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Subject (opcional, override default)</Label>
            <Input
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder={cfg.subject}
            />
          </div>

          <div>
            <Label>Intro custom (opcional)</Label>
            <Textarea
              value={customIntro}
              onChange={(e) => setCustomIntro(e.target.value)}
              placeholder="Si dejas vacio, usa el pitch default por audience."
              rows={3}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>Recipients (uno por linea, formato: email, nombre, empresa)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={pasteSeed}
                className="h-7 text-xs"
              >
                <ClipboardPaste className="size-3 mr-1" />
                Pegar seed {audience}
              </Button>
            </div>
            <Textarea
              value={recipientsRaw}
              onChange={(e) => setRecipientsRaw(e.target.value)}
              placeholder={`partner@centrovet.cl, Maria Lopez, Centrovet\nhola@msd.com, Juan Perez, MSD Animal Health`}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <Building2 className="size-3" />
              {recipients.length} recipient{recipients.length === 1 ? '' : 's'} parseados
              {recipients.length > 100 && (
                <Badge variant="destructive" className="ml-2">
                  Max 100 por batch
                </Badge>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase font-semibold text-muted-foreground">Preview</div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPreviewOpen(true)}
                className="h-6 text-xs"
              >
                <Eye className="size-3 mr-1" />
                Ver email completo
              </Button>
            </div>
            <div className="text-sm">
              <strong>Subject:</strong> {previewSubject}
            </div>
            <div className="text-sm">
              <strong>From:</strong> Pedro Susaeta — Paw Friend &lt;hola@pawfriend.cl&gt;
            </div>
            <div className="text-sm">
              <strong>CTA:</strong> /aplicar?tipo=
              {audience === 'pharma'
                ? 'b2b_api'
                : audience === 'gobierno'
                  ? 'gobierno_municipio'
                  : audience}
            </div>
          </div>

          <Button
            onClick={() => sendMutation.mutate()}
            disabled={sendMutation.isPending || recipients.length === 0 || recipients.length > 100}
            className="w-full"
          >
            {sendMutation.isPending ? (
              <>Enviando...</>
            ) : (
              <>
                <Mail className="size-4 mr-2" />
                Enviar a {recipients.length} {recipients.length === 1 ? 'partner' : 'partners'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Dialog preview HTML completo del email — UX-B 2026-04-30 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview email — {AUDIENCE_LABELS[audience].label}</DialogTitle>
            <DialogDescription>
              Asi se ve el email que recibira cada recipient. CTA va a /aplicar con audience
              correspondiente.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-4 space-y-3 bg-white text-sm">
            <div className="border-b pb-2 space-y-1">
              <div>
                <strong>Para:</strong> {recipients[0]?.email ?? '[primer recipient]'}
              </div>
              <div>
                <strong>Asunto:</strong> {previewSubject}
              </div>
              <div className="text-xs text-muted-foreground">
                De: Pedro Susaeta — Paw Friend &lt;hola@pawfriend.cl&gt;
              </div>
            </div>
            <div className="space-y-2 leading-relaxed">
              <p>Hola{recipients[0]?.contact_name ? ` ${recipients[0].contact_name}` : ''},</p>
              {customIntro ? (
                <p className="whitespace-pre-wrap">{customIntro}</p>
              ) : (
                <p>
                  {audience === 'pharma' &&
                    'Construimos la infraestructura digital de la mascota chilena. Hoy operamos con código end-to-end listo en 7 motores B2B, y el motor #1 es nuestra API pública para pharma animal con 4 endpoints (breed_stats, species_stats, correlations, risk_score).'}
                  {audience === 'seguros' &&
                    'Construimos un cotizador embebido + lead capture de seguros pet con risk score real por raza/edad/comuna. Conectamos directo a tu funnel sin friccion.'}
                  {audience === 'retail' &&
                    'Construimos un canal de adquisicion contextual: catalogos personalizados por mascota (raza, edad, condicion) con tracking de conversion y descuento exclusivo Paw Member.'}
                  {audience === 'gobierno' &&
                    'Construimos infraestructura digital para implementar Ley 21.020 (tenencia responsable): registro mascota desde celular, microchip, esterilizacion, biometria opcional. Sin papel.'}
                  {audience === 'banca' &&
                    'Construimos un beneficio diferencial para clientes con mascota: ficha clinica longitudinal + descuentos partners + Paw Member badge. Plug-and-play en tu app de cliente.'}
                  {audience === 'edificios' &&
                    'Construimos registro digital de mascotas para comunidades: cada nuevo arriendo/venta = registro 5min via QR, datos a la administracion + reglamento aceptado.'}
                  {audience === 'longtail' &&
                    'Construimos integracion vertical para servicios pet-adjacent. Cada uno tiene su propio fit: aerolineas → docs viaje, academia → research consent, refugios → bulk import.'}
                </p>
              )}
              <div className="bg-purple-50 border border-purple-200 rounded p-3 my-3">
                <div className="font-semibold text-purple-900 mb-1">¿Te interesa? CTA:</div>
                <a
                  href={`https://pawfriend.cl/aplicar?tipo=${
                    audience === 'pharma'
                      ? 'b2b_api'
                      : audience === 'gobierno'
                        ? 'gobierno_municipio'
                        : audience
                  }`}
                  className="text-purple-700 underline text-xs break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://pawfriend.cl/aplicar?tipo=
                  {audience === 'pharma'
                    ? 'b2b_api'
                    : audience === 'gobierno'
                      ? 'gobierno_municipio'
                      : audience}
                </a>
              </div>
              <p className="text-xs text-muted-foreground border-t pt-2">
                — Pedro Susaeta · Founder Paw Friend
                <br />
                pawfriend.cl · pedrosusaeta@pawfriend.cl
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results */}
      {results && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3 text-sm">Resultados ultimo envio</h3>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/30">
                  {r.status === 'sent' ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600" />
                  )}
                  <span className="font-mono text-xs">{r.email}</span>
                  <Badge variant="outline" className="ml-auto">
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
