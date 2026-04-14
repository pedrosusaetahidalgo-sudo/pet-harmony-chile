import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { TrendingUp, MapPin, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PriceEstimatorWidget from '@/components/PriceEstimatorWidget';
import { PublicHeader, PublicFooter } from '@/pages/DirectorioVets';
import { useAuth } from '@/hooks/useAuth';
import {
  SANTIAGO_COMUNAS,
  setSeoTags,
  slugifyForUrl,
  unslugify,
} from '@/lib/vetDirectory';

export default function PreciosVeterinarios() {
  const { comuna: comunaParam } = useParams();
  const navigate = useNavigate();

  const initial = comunaParam ? unslugify(comunaParam) : 'all';
  const [comuna, setComuna] = useState<string>(initial);

  useEffect(() => {
    const titulo = comuna !== 'all'
      ? `Precios de veterinarios en ${comuna} · Paw Friend`
      : 'Precios de veterinarios en Chile por comuna · Paw Friend';
    const desc = comuna !== 'all'
      ? `Compara precios reales de consulta, vacunas, urgencias y mas en ${comuna}. Datos publicados por los propios veterinarios.`
      : `Compara precios reales de consulta veterinaria, vacunas, urgencias y mas en ${SANTIAGO_COMUNAS.length} comunas de Chile. Sin sorpresas.`;
    setSeoTags({
      title: titulo,
      description: desc,
      canonical: comuna !== 'all'
        ? `https://pawfriend.cl/precios-veterinarios/comuna/${slugifyForUrl(comuna)}`
        : 'https://pawfriend.cl/precios-veterinarios',
    });
  }, [comuna]);

  const handleComunaChange = (value: string) => {
    setComuna(value);
    if (value === 'all') {
      navigate('/precios-veterinarios', { replace: true });
    } else {
      navigate(`/precios-veterinarios/comuna/${slugifyForUrl(value)}`, { replace: true });
    }
  };

  const faqs = [
    {
      q: '¿De dónde salen estos precios?',
      a: 'Los publican los propios veterinarios desde su perfil en Paw Friend. Solo mostramos servicios donde tenemos al menos 3 profesionales reportando, para que la mediana sea representativa.',
    },
    {
      q: '¿Por qué algunos servicios no aparecen?',
      a: 'Si una combinación comuna + servicio tiene menos de 3 veterinarios publicando precio, la ocultamos. Preferimos no mostrar nada antes que mostrar un dato engañoso.',
    },
    {
      q: '¿Cómo puedo aparecer si soy veterinario?',
      a: 'Crea tu perfil profesional gratis en Paw Friend y publica tus precios. Tu nombre aparece en el directorio público y los dueños te pueden encontrar buscando por comuna.',
    },
    {
      q: '¿Los precios incluyen exámenes adicionales?',
      a: 'No necesariamente. Cada veterinario puede agregar notas a su precio (por ejemplo "incluye examen y receta"). Siempre confirma con la clínica antes de la consulta.',
    },
  ];

  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {!user && <PublicHeader />}

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <TrendingUp className="h-3.5 w-3.5" />
            Transparencia de precios
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-purple-900 mb-3">
            ¿Cuánto cuesta el vet en tu comuna?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Compara precios reales de veterinarios en {SANTIAGO_COMUNAS.length} comunas de Chile.
            Datos publicados por los propios veterinarios, sin sorpresas.
          </p>
        </div>

        <Card className="p-4 md:p-6 mb-6 shadow-md">
          <label className="text-sm font-semibold text-purple-700 mb-2 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Tu comuna
          </label>
          <Select value={comuna} onValueChange={handleComunaChange}>
            <SelectTrigger className="h-12 border-purple-200 focus:ring-purple-600">
              <SelectValue placeholder="Selecciona tu comuna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las comunas (vista global)</SelectItem>
              {SANTIAGO_COMUNAS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-purple-900 mb-3">
            {comuna !== 'all' ? `Precios en ${comuna}` : 'Precios a nivel nacional'}
          </h2>
          <PriceEstimatorWidget comuna={comuna !== 'all' ? comuna : undefined} />
        </div>

        {/* CTA al directorio */}
        {comuna !== 'all' && (
          <Card className="p-6 mb-10 bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
            <h3 className="font-bold text-purple-900 mb-2">
              ¿Listo para elegir veterinario en {comuna}?
            </h3>
            <p className="text-sm text-purple-800 mb-4">
              Mira las reseñas verificadas y agenda con el que mejor se acomode a ti.
            </p>
            <Link to={`/veterinarios/comuna/${slugifyForUrl(comuna)}`}>
              <Button className="min-h-[44px]">
                Ver veterinarios en {comuna}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </Card>
        )}

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-purple-900 mb-4">Preguntas frecuentes</h2>
          <div className="grid gap-3">
            {faqs.map((f) => (
              <Card key={f.q} className="p-4">
                <h3 className="font-semibold text-purple-900 mb-1">{f.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA final B2B */}
        <Card className="p-8 text-center bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            ¿Eres veterinario?
          </h2>
          <p className="text-purple-50 mb-5 max-w-xl mx-auto">
            Publica tus precios y aparece en el comparador público de Paw Friend gratis. Capta
            clientes que valoran la transparencia.
          </p>
          <Link to="/registro-veterinario">
            <Button
              size="lg"
              className="bg-white text-purple-700 hover:bg-purple-50 min-h-[44px] font-bold"
            >
              Crear mi perfil profesional
            </Button>
          </Link>
        </Card>
      </main>

      {!user && <PublicFooter />}
    </div>
  );
}
