/**
 * InsuranceQuotes — pagina /cotizar-seguro/:petId
 *
 * Flow:
 *   1. Lista partners aseguradores activos (RPC list_active_insurance_partners).
 *   2. Por cada partner, llama RPC compute_insurance_quote(petId, slug) en
 *      paralelo. Devuelve risk_score + monthly_premium + annual_premium.
 *   3. Muestra cards comparativas con pricing.
 *   4. CTA "Contactar partner" abre modal → form contacto → POST a edge fn
 *      request-insurance-quote → email al partner + lead row.
 *
 * Spec: Refactor Maestro Fase 2 §7.2 + REVENUE_MASTER_PLAN_2026.md motor #2.
 *
 * Gate: si flag EMBEDDED_INSURANCE=false, mostramos placeholder explicando que
 * estamos en proceso de firma con aseguradoras.
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from '@/lib/icons';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { logger } from '@/lib/logger';

interface Partner {
  id: string;
  slug: string;
  display_name: string;
  partner_logo_url: string | null;
  partner_url: string | null;
  coverage_summary: string | null;
  display_order: number;
}

interface Quote {
  quote_id: string;
  risk_score: number;
  age_years: number | null;
  monthly_premium_clp: number;
  annual_premium_clp: number;
  factors: Record<string, unknown>;
  partner_name: string;
  coverage_summary: string | null;
}

interface PartnerWithQuote extends Partner {
  quote?: Quote;
  quoteError?: string;
}

interface PetInfo {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
}

function formatCLP(n: number): string {
  return n.toLocaleString('es-CL');
}

export default function InsuranceQuotes() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [contactOpen, setContactOpen] = useState<PartnerWithQuote | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    message: '',
  });

  const flagOn = isFeatureEnabled('EMBEDDED_INSURANCE');

  // Pet info para el header.
  const { data: pet } = useQuery({
    queryKey: ['insurance-quotes-pet', petId],
    enabled: !!petId,
    queryFn: async (): Promise<PetInfo | null> => {
      if (!petId) return null;
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, birth_date')
        .eq('id', petId)
        .maybeSingle();
      if (error) return null;
      return data as PetInfo | null;
    },
  });

  // Partners activos + quotes en paralelo.
  const { data: results, isLoading } = useQuery({
    queryKey: ['insurance-quotes', petId],
    enabled: !!petId && flagOn,
    queryFn: async (): Promise<PartnerWithQuote[]> => {
      if (!petId) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: partners, error } = await (supabase as any).rpc(
        'list_active_insurance_partners',
        { p_pet_id: petId }
      );
      if (error) {
        logger.error('[InsuranceQuotes] list partners fallo', error);
        return [];
      }
      const list = (partners ?? []) as Partner[];

      // Quote en paralelo.
      const quoted = await Promise.all(
        list.map(async (p): Promise<PartnerWithQuote> => {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: q, error: qErr } = await (supabase as any).rpc(
              'compute_insurance_quote',
              { p_pet_id: petId, p_partner_slug: p.slug }
            );
            if (qErr || !q || (q as Quote[]).length === 0) {
              return { ...p, quoteError: qErr?.message ?? 'sin cotizacion' };
            }
            return { ...p, quote: (q as Quote[])[0] };
          } catch (err) {
            return { ...p, quoteError: err instanceof Error ? err.message : 'error' };
          }
        })
      );
      return quoted;
    },
  });

  const sendLead = useMutation({
    mutationFn: async (payload: {
      quote_id: string;
      partner_id: string;
      name: string;
      phone: string;
      message: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('request-insurance-quote', {
        body: { ...payload, pet_id: petId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Solicitud enviada', {
        description: 'El partner te contactara en menos de 48h.',
      });
      setContactOpen(null);
      setContactForm({ name: '', phone: '', message: '' });
      qc.invalidateQueries({ queryKey: ['insurance-quotes', petId] });
    },
    onError: (err) => {
      toast.error('No pudimos enviar la solicitud', {
        description: err instanceof Error ? err.message : 'Reintenta.',
      });
    },
  });

  // Flag off → placeholder
  if (!flagOn) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center space-y-3">
            <Shield className="h-12 w-12 mx-auto text-blue-600" />
            <h2 className="text-xl font-bold">Estamos firmando aseguradoras</h2>
            <p className="text-sm text-blue-900 leading-relaxed">
              El motor de cotizacion en vivo esta listo, pero esperamos firma comercial con
              aseguradoras chilenas. Si tu empresa quiere ofrecer seguros pet, escribinos:
              <br />
              <a
                href="mailto:pawfriendcl@gmail.com"
                className="font-bold underline mt-2 inline-block"
              >
                pawfriendcl@gmail.com
              </a>
            </p>
            <Button onClick={() => navigate(-1)} variant="outline" className="mt-2">
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6 space-y-4">
      <Helmet>
        <title>Cotizar seguro pet · Paw Friend</title>
        <meta
          name="description"
          content="Cotiza seguro pet para tu mascota con multiples aseguradoras chilenas en 1 click."
        />
      </Helmet>

      <div className="flex items-center gap-3">
        <Button onClick={() => navigate(-1)} variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Volver
        </Button>
      </div>

      {/* UX-12: Disclaimer permanente al tope (no solo al final). Visibilidad
          de credibilidad: el user debe saber DESDE EL INICIO que las
          cotizaciones son referenciales hasta firma comercial. */}
      <div
        role="status"
        className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2.5"
      >
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-300 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-100 leading-relaxed">
          <strong>Piloto en marcha · cotizaciones referenciales.</strong> Estamos en negociación con
          aseguradoras chilenas (Sura, BCI, Mapfre). Las primas se ajustan al firmar contrato
          definitivo con cada partner. No hay cobro automático: solo solicitas que el partner te
          contacte.
        </div>
      </div>

      <div className="text-center space-y-1.5 py-3">
        <Shield className="h-10 w-10 mx-auto text-purple-600" />
        <h1 className="text-2xl font-bold">
          Cotiza seguro {pet ? `para ${pet.name}` : 'para tu mascota'}
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Comparamos tarifas en vivo con aseguradoras aliadas usando la ficha de tu mascota. Sin
          compromiso · sin costo · solo cotizar.
        </p>
      </div>

      {!user && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm">Inicia sesion para ver cotizaciones para tu mascota.</p>
          </CardContent>
        </Card>
      )}

      {user && isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}

      {user && !isLoading && results && results.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            No hay aseguradoras activas para tu region/especie todavia.
          </CardContent>
        </Card>
      )}

      {user && !isLoading && results && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id} className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {r.partner_logo_url ? (
                    <img
                      src={r.partner_logo_url}
                      alt={r.display_name}
                      className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-semibold text-base">{r.display_name}</h3>
                      {r.quote && (
                        <Badge className="bg-purple-600 text-white text-xs">
                          Risk {r.quote.risk_score}/100
                        </Badge>
                      )}
                    </div>
                    {r.coverage_summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {r.coverage_summary}
                      </p>
                    )}
                    {r.quote && (
                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-bold text-purple-700">
                          ${formatCLP(r.quote.monthly_premium_clp)}
                        </span>
                        <span className="text-xs text-muted-foreground">CLP/mes estimado</span>
                      </div>
                    )}
                    {r.quoteError && (
                      <p className="text-xs text-amber-700">No pudimos cotizar: {r.quoteError}</p>
                    )}
                  </div>
                </div>
                {r.quote && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => setContactOpen(r)}
                      size="sm"
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Contactar partner
                    </Button>
                    {r.partner_url && (
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <a href={r.partner_url} target="_blank" rel="noopener noreferrer">
                          Ver web
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4 text-xs leading-relaxed text-amber-900 space-y-1.5">
          <p>
            <strong>Piloto en marcha · proximamente</strong> · Estamos en negociacion con
            aseguradoras chilenas. Las cotizaciones que ves son referenciales y se ajustan al firmar
            contrato definitivo con cada partner.
          </p>
          <p>
            <strong>Precios referenciales</strong> · La cotizacion final la entrega cada aseguradora
            tras evaluar la ficha completa. Paw Friend no vende seguros — solo conecta.
          </p>
        </CardContent>
      </Card>

      {/* Modal contacto */}
      <Dialog open={!!contactOpen} onOpenChange={(v) => !v && setContactOpen(null)}>
        <DialogContent className="max-w-md">
          {contactOpen && (
            <>
              <DialogHeader>
                <DialogTitle>Contactar {contactOpen.display_name}</DialogTitle>
                <DialogDescription>
                  Te conectamos con el partner para que te llame y cierre la poliza directo. Sin
                  costo extra · sin compromiso.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contact-name">Nombre completo *</Label>
                  <Input
                    id="contact-name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone">Telefono *</Label>
                  <Input
                    id="contact-phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+56 9 ..."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact-message">Mensaje (opcional)</Label>
                  <Textarea
                    id="contact-message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Necesito cotizacion para mi mascota..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setContactOpen(null)}>
                  Cancelar
                </Button>
                <Button
                  disabled={
                    !contactForm.name.trim() || !contactForm.phone.trim() || sendLead.isPending
                  }
                  onClick={() => {
                    if (!contactOpen.quote) return;
                    sendLead.mutate({
                      quote_id: contactOpen.quote.quote_id,
                      partner_id: contactOpen.id,
                      name: contactForm.name.trim(),
                      phone: contactForm.phone.trim(),
                      message: contactForm.message.trim(),
                    });
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {sendLead.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  )}
                  Enviar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
