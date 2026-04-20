/**
 * Post SEO #8 — long-tail: "cuanto cuesta tener perro primer año Chile"
 * + "presupuesto mascota mensual".
 * Incluye calculadora inline para generar estimación personalizada.
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

type Size = 'chico' | 'mediano' | 'grande';
type Lifestyle = 'basic' | 'medium' | 'premium';

interface Costs {
  setup: number;
  monthly: number;
  firstYear: number;
}

const SETUP_COSTS: Record<Size, number> = {
  chico: 80_000,
  mediano: 120_000,
  grande: 180_000,
};

const FOOD_MONTHLY: Record<Size, Record<Lifestyle, number>> = {
  chico: { basic: 18_000, medium: 28_000, premium: 45_000 },
  mediano: { basic: 35_000, medium: 50_000, premium: 75_000 },
  grande: { basic: 55_000, medium: 80_000, premium: 120_000 },
};

function calculate(size: Size, lifestyle: Lifestyle, steril: boolean): Costs {
  const setup = SETUP_COSTS[size] + (steril ? (size === 'grande' ? 280_000 : 180_000) : 0);
  const foodM = FOOD_MONTHLY[size][lifestyle];
  const antipar = size === 'grande' ? 22_000 : size === 'mediano' ? 15_000 : 10_000;
  const vetRoutine = 7_500; // prorrateo consultas + vacunas anuales
  const groomingM = lifestyle === 'premium' ? 20_000 : lifestyle === 'medium' ? 8_000 : 0;
  const accessoriesM = 5_000; // juguetes, snacks, bolsas
  const monthly = foodM + antipar + vetRoutine + groomingM + accessoriesM;
  const firstYear = setup + monthly * 12;
  return { setup, monthly, firstYear };
}

function formatCLP(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function Calculator() {
  const [size, setSize] = useState<Size>('mediano');
  const [lifestyle, setLifestyle] = useState<Lifestyle>('medium');
  const [steril, setSteril] = useState(true);

  const costs = useMemo(() => calculate(size, lifestyle, steril), [size, lifestyle, steril]);

  return (
    <div className="not-prose rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-amber-50 p-5 md:p-6 my-6 shadow-sm">
      <div className="text-center mb-4">
        <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-1">
          Calculadora interactiva
        </p>
        <p className="text-sm text-muted-foreground">
          Ajusta las opciones según tu caso y ve el costo aproximado.
        </p>
      </div>

      {/* Tamaño */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">Tamaño del perro</label>
        <div className="grid grid-cols-3 gap-2">
          {(['chico', 'mediano', 'grande'] as Size[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                size === s
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {s === 'chico' ? 'Chico (<10kg)' : s === 'mediano' ? 'Mediano' : 'Grande (>25kg)'}
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyle */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-slate-700 mb-2">
          Estilo de alimentación y cuidados
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['basic', 'medium', 'premium'] as Lifestyle[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLifestyle(l)}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                lifestyle === l
                  ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
              }`}
            >
              {l === 'basic' ? 'Básico' : l === 'medium' ? 'Medio' : 'Premium'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Básico: alimento supermercado · Medio: alimento premium + peluquería · Premium: alimento
          super-premium + peluquería frecuente
        </p>
      </div>

      {/* Esterilización */}
      <div className="mb-5">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={steril}
            onChange={(e) => setSteril(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
          />
          Incluir esterilización en el primer año
        </label>
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-200">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Setup</p>
          <p className="font-mono text-base font-bold text-slate-800">{formatCLP(costs.setup)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Mensual</p>
          <p className="font-mono text-base font-bold text-slate-800">{formatCLP(costs.monthly)}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-purple-700 mb-1">Primer año</p>
          <p className="font-mono text-xl font-black text-purple-700">
            {formatCLP(costs.firstYear)}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-4 italic">
        Estimación referencial Santiago 2026. No incluye emergencias, tratamientos de enfermedades
        crónicas ni seguros. Fondo de reserva recomendado: ~$500.000 CLP adicionales.
      </p>
    </div>
  );
}

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Tener perro en Chile cuesta entre $700k y $2.500k el primer año, según tamaño y estilo de
        vida. Esta guía te da los números reales desglosados + una calculadora para estimar tu caso
        antes de decidir adoptar o comprar.
      </p>

      <Calculator />

      <h2>Desglose honesto — gasto único inicial</h2>

      <h3>Adopción vs compra</h3>
      <ul>
        <li>
          <strong>Adopción</strong> en refugio: $0 - $50.000 (donación sugerida). Suele venir con
          chip + esterilización + vacunas iniciales. Ahorro potencial ~$300.000.
        </li>
        <li>
          <strong>Compra en criadero</strong> responsable: $400.000 - $2.500.000 según raza. No
          incluye setup.
        </li>
        <li>
          <strong>Compra en "criador" amateur o tienda</strong>: $100.000 - $500.000. Riesgo
          sanitario alto — probabilidad de parvo, moquillo o defectos congénitos.{' '}
          <strong>Paw Friend no recomienda.</strong>
        </li>
      </ul>

      <h3>Setup primeros días (~$80k - $180k CLP)</h3>
      <ul>
        <li>Cama + transporte + correa + collar: $30-70k.</li>
        <li>Juguetes iniciales: $10-25k.</li>
        <li>Platos + fuentes de agua: $10-25k.</li>
        <li>Productos higiene (champú, toallas, quita-pelos): $10-20k.</li>
        <li>Primera consulta vet + exámenes básicos: $25-45k.</li>
      </ul>

      <h3>Microchip + registro ($25-45k)</h3>
      <p>
        Obligatorio en Chile. Si adoptas, suele venir incluido. Si compras,{' '}
        <strong>exige que esté a tu nombre</strong> antes de irte con el perro — muchos criadores lo
        registran a su nombre y nunca lo transfieren.
      </p>

      <h3>Esterilización ($120k - $450k según tamaño y sexo)</h3>
      <p>
        No es obligatoria pero la recomendamos por salud (reduce riesgo de cáncer y problemas
        prostáticos) + comportamiento (menos marcaje, menos fugas). Precios Santiago:
      </p>
      <ul>
        <li>Gato hembra: $140-280k. Gato macho: $80-180k.</li>
        <li>Perra chica: $150-260k. Perro chico macho: $100-180k.</li>
        <li>Perra mediana: $200-380k. Perro mediano macho: $130-250k.</li>
        <li>Perra grande: $280-450k. Perro grande macho: $180-320k.</li>
      </ul>

      <h2>Gasto mensual recurrente</h2>

      <h3>Alimentación (50-70% del gasto mensual)</h3>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Tipo</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Ejemplo</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Perro mediano/mes
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Supermercado</td>
            <td className="p-2 border-b">Master Dog, Cannes</td>
            <td className="p-2 border-b">$25-40k</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Premium</td>
            <td className="p-2 border-b">Royal Canin, Hill's</td>
            <td className="p-2 border-b">$45-60k</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Super-premium</td>
            <td className="p-2 border-b">Orijen, Acana</td>
            <td className="p-2 border-b">$70-95k</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">BARF (crudo)</td>
            <td className="p-2 border-b">Crudo preparado</td>
            <td className="p-2 border-b">$60-100k</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Casero</td>
            <td className="p-2 border-b">Cocinado por dueño</td>
            <td className="p-2 border-b">$30-50k (+ tu tiempo)</td>
          </tr>
        </tbody>
      </table>

      <h3>Otros gastos mensuales promedio</h3>
      <ul>
        <li>
          <strong>Antiparasitario externo</strong>: $8-18k (pipeta mensual) o $25-45k cada 3m
          (Bravecto).
        </li>
        <li>
          <strong>Antiparasitario interno</strong>: prorrateo $4-10k (cada 3 meses).
        </li>
        <li>
          <strong>Juguetes + snacks</strong>: $5-15k.
        </li>
        <li>
          <strong>Peluquería</strong> (si aplica): $8-25k prorrateado (cada 6-8 semanas).
        </li>
        <li>
          <strong>Paseador o daycare</strong> (si trabajas todo el día): $60-150k.
        </li>
        <li>
          <strong>Consultas + vacunas anuales</strong> (prorrateo): $7-15k.
        </li>
      </ul>

      <h2>Gastos ocasionales que debes presupuestar</h2>

      <ul>
        <li>
          <strong>Limpieza dental con anestesia</strong>: cada 1-3 años, $180-400k. Si ignoras, los
          dientes son lo que más gastos trae en perros senior.
        </li>
        <li>
          <strong>Vacaciones / viajes</strong>: si lo dejas en hotel canino: $15-35k/día.
        </li>
        <li>
          <strong>Emergencia veterinaria</strong>: $45-120k consulta nocturna + $80-250k
          hospitalización. Recomendable fondo reserva de $500k mínimo.
        </li>
        <li>
          <strong>Cirugía compleja</strong>: $500k - $2.500k según caso. Aquí es donde el seguro pet
          tiene sentido (ver{' '}
          <Link to="/blog/seguro-mascotas-chile-vale-la-pena" className="text-purple-700 underline">
            guía completa seguros pet
          </Link>
          ).
        </li>
      </ul>

      <h2>Perro vs gato — comparativa primer año</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Categoría</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Perro mediano
            </th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Gato</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Setup</td>
            <td className="p-2 border-b">$120k</td>
            <td className="p-2 border-b">$70k (arena + bandeja adicional)</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Alimento mensual</td>
            <td className="p-2 border-b">$45-60k</td>
            <td className="p-2 border-b">$25-40k</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Esterilización</td>
            <td className="p-2 border-b">$200-380k</td>
            <td className="p-2 border-b">$80-280k</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Peluquería anual</td>
            <td className="p-2 border-b">$100-250k (razas)</td>
            <td className="p-2 border-b">$0 (auto-grooming)</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Arena (gatos)</td>
            <td className="p-2 border-b">—</td>
            <td className="p-2 border-b">$8-20k/mes</td>
          </tr>
          <tr className="bg-purple-100 font-semibold">
            <td className="p-2 border-b">Total primer año</td>
            <td className="p-2 border-b">~$1.000-1.800k</td>
            <td className="p-2 border-b">~$600-1.100k</td>
          </tr>
        </tbody>
      </table>

      <h2>Dónde se puede (y no) ahorrar</h2>

      <h3>Ahorros legítimos ✓</h3>
      <ul>
        <li>
          <strong>Adoptar en vez de comprar.</strong> Ahorro $400k-$2.000k. Y salvás una vida.
        </li>
        <li>
          <strong>Comprar alimento en saco grande.</strong> Cuesta 20-30% menos que porciones
          chicas.
        </li>
        <li>
          <strong>Peluquería en casa</strong> (si tu perro es tranquilo). Máquina $30-60k amortiza
          en 4 meses.
        </li>
        <li>
          <strong>Comparar precios veterinarios</strong> en{' '}
          <Link to="/precios-veterinarios" className="text-purple-700 underline">
            el estimador por comuna
          </Link>
          . Diferencias de 100% entre clínicas iguales.
        </li>
        <li>
          <strong>Juguetes DIY</strong>. Botellas con snacks = horas de juego, costo $0.
        </li>
      </ul>

      <h3>Falsos ahorros ✗</h3>
      <ul>
        <li>
          <strong>Alimento supermercado muy barato</strong>. Más gasto en vet por problemas
          digestivos y dermato a largo plazo.
        </li>
        <li>
          <strong>Saltar vacunas anuales</strong>. Una parvo cuesta $500k-$2M vs vacuna anual $25k.
        </li>
        <li>
          <strong>Esperar a que "se arregle solo"</strong>. Una consulta temprana $30k evita una
          urgencia $150k.
        </li>
        <li>
          <strong>Comprar en tiendas callejeras</strong>. Precio bajo, calidad mala, riesgo
          sanitario.
        </li>
      </ul>

      <div className="not-prose rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">
          🐾 Organiza el presupuesto desde el día 1
        </p>
        <p className="text-sm text-emerald-800 mb-3">
          En Paw Friend llevas ficha médica + recordatorios de todos los gastos recurrentes
          (vacunas, antiparasitarios, peluquería). Al final del año te queda historial completo para
          decidir dónde ajustar.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Crear mi cuenta gratis →
        </Link>
      </div>

      <h2>Checklist: ¿puedo permitirme una mascota?</h2>

      <ol>
        <li>
          <strong>
            ¿Puedes destinar $50-95k mensuales sostenibles por los próximos 12-15 años?
          </strong>{' '}
          (expectativa vida perro/gato).
        </li>
        <li>
          <strong>¿Tienes $500-800k disponibles para emergencias?</strong>
        </li>
        <li>
          <strong>¿Tu horario/vivienda permite tener el tiempo + espacio?</strong>
        </li>
        <li>
          <strong>¿Vas a vivir en Chile los próximos años</strong> o hay riesgo de viaje largo /
          emigración?
        </li>
        <li>
          <strong>¿Todos los que viven contigo están de acuerdo?</strong>
        </li>
      </ol>

      <p>
        Si las 5 respuestas son sí, podés adoptar o comprar responsablemente. Si alguna es dudosa,
        mejor esperar. La mascota queda por 15 años; la decisión requiere claridad.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 10 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/adoptar-perro-nunoa-refugios-responsables"
            className="text-purple-700 underline"
          >
            Adoptar responsablemente en Ñuñoa
          </Link>
          {' · '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            Cronograma de vacunas
          </Link>
        </p>
      </div>
    </article>
  );
}
