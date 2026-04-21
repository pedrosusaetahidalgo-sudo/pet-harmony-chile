/**
 * Post SEO #11 — long-tail: "BARF vs pellet perros Chile"
 * + "dieta cruda perro beneficios riesgos".
 * Tema polémico → alto tráfico + debate activo en grupos Facebook.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        "¿Le doy BARF o pellet?" es la pregunta más polémica en grupos de dueños chilenos. Esta guía
        compara ambas opciones sin ideología — solo evidencia, costos reales y qué veterinarios
        chilenos recomiendan en 2026.
      </p>

      <h2>Qué es cada uno</h2>

      <h3>Pellet (alimento balanceado comercial)</h3>
      <p>
        Croquetas secas o latas húmedas formuladas por nutricionistas veterinarios. Contienen
        proteínas, carbohidratos, grasas, vitaminas y minerales en proporciones definidas según edad
        + tamaño + raza.
      </p>
      <ul>
        <li>
          <strong>Supermercado</strong>: Master Dog, Cannes, Champion, Purina ProPlan básico.
        </li>
        <li>
          <strong>Premium</strong>: Royal Canin, Hill's, Eukanuba, Pro Plan Sensitive.
        </li>
        <li>
          <strong>Super-premium</strong>: Orijen, Acana, Taste of the Wild, Farmina.
        </li>
      </ul>

      <h3>BARF (Biologically Appropriate Raw Food)</h3>
      <p>
        Dieta cruda basada en carne + hueso carnoso + vísceras + vegetales + suplementos. Proporción
        clásica: 70% carne, 10% hueso, 10% vísceras, 10% vegetales.
      </p>
      <ul>
        <li>
          <strong>Preparada en casa</strong>: tú compras ingredientes y armas. Más barato pero
          requiere conocimiento.
        </li>
        <li>
          <strong>Comercial congelado</strong>: marcas chilenas como Naturcan, RawFood Chile, Guau
          Food. Vienen en bolsas listas.
        </li>
      </ul>

      <h2>Comparativa honesta</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Criterio</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Pellet premium
            </th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">BARF</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b font-medium">Costo mensual (perro 20kg)</td>
            <td className="p-2 border-b">$50-70k</td>
            <td className="p-2 border-b">$80-120k (casero) / $100-150k (comercial)</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b font-medium">Tiempo de preparación</td>
            <td className="p-2 border-b">1 min/día</td>
            <td className="p-2 border-b">15-30 min/semana (batch) + descongelar</td>
          </tr>
          <tr>
            <td className="p-2 border-b font-medium">Riesgo sanitario</td>
            <td className="p-2 border-b">Mínimo (proceso industrial controlado)</td>
            <td className="p-2 border-b">Salmonella, E.coli, parásitos si mal manipulado</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b font-medium">Digestibilidad</td>
            <td className="p-2 border-b">Alta, heces regulares</td>
            <td className="p-2 border-b">Muy alta, heces más chicas y menos olor</td>
          </tr>
          <tr>
            <td className="p-2 border-b font-medium">Hidratación</td>
            <td className="p-2 border-b">Baja (croqueta seca) — tienen que tomar agua aparte</td>
            <td className="p-2 border-b">Alta (~70% humedad natural)</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b font-medium">Conservación</td>
            <td className="p-2 border-b">6-12 meses en saco cerrado</td>
            <td className="p-2 border-b">6 meses congelado / 2 días refrigerado</td>
          </tr>
          <tr>
            <td className="p-2 border-b font-medium">Aprobación Colmevet</td>
            <td className="p-2 border-b">Aprobado, mayoría recomienda</td>
            <td className="p-2 border-b">Dividido: algunos a favor, otros alertan riesgos</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b font-medium">Requiere supervisión vet</td>
            <td className="p-2 border-b">No necesariamente</td>
            <td className="p-2 border-b">
              <strong>Sí, altamente recomendado</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Argumentos a favor de BARF (lo que dicen sus defensores)</h2>
      <ol>
        <li>
          <strong>Mejor digestibilidad</strong>: más cerca de la dieta ancestral canina (lobo).
          Heces más chicas, menos flatulencia.
        </li>
        <li>
          <strong>Pelaje más brillante</strong>: aporte de ácidos grasos naturales.
        </li>
        <li>
          <strong>Mejor hidratación</strong>: 70% agua natural vs 10% del pellet.
        </li>
        <li>
          <strong>Dientes más sanos</strong>: hueso carnoso hace acción mecánica limpieza dental.
        </li>
        <li>
          <strong>Sin conservantes ni cereales</strong>: argumento para perros con dermatitis
          alérgica.
        </li>
      </ol>

      <h2>Argumentos en contra (lo que preocupa a vets)</h2>
      <ol>
        <li>
          <strong>Desbalance nutricional</strong>: dieta BARF mal formulada puede resultar en
          déficit de calcio, zinc, taurina, vitamina D. En cachorros causa problemas óseos
          permanentes.
        </li>
        <li>
          <strong>Contaminación bacteriana</strong>: Salmonella y E.coli en carne cruda afectan al
          perro + a niños en la casa. Documentado múltiples brotes en USA y Europa.
        </li>
        <li>
          <strong>Parásitos zoonóticos</strong>: carne cruda sin congelar puede transmitir
          toxoplasma o tenia al dueño.
        </li>
        <li>
          <strong>Riesgo con huesos</strong>: huesos enteros pueden causar perforaciones
          intestinales, atascamientos, fracturas dentales. Hay que saber qué hueso sí (ala pollo
          cruda) y cuál no (hueso asado).
        </li>
        <li>
          <strong>Costo acumulado alto</strong>: si sumas carne + vísceras + suplementos + tiempo
          preparación, sale más caro que pellet premium y requiere freezer dedicado.
        </li>
      </ol>

      <h2>Caso por caso — ¿cuál conviene a tu perro?</h2>

      <h3>Cachorros (0-12 meses)</h3>
      <p>
        <strong>
          Recomendación mayoritaria Colmevet: pellet premium específico para cachorros
        </strong>
        . El balance nutricional en esta etapa es crítico para desarrollo óseo y neurológico. BARF
        en cachorros requiere nutricionista veterinario con experiencia + suplementación calculada
        por peso + raza. Muchos vets chilenos lo desaconsejan en esta etapa.
      </p>

      <h3>Adulto sano</h3>
      <p>Ambas opciones son válidas si el dueño:</p>
      <ul>
        <li>
          <strong>Pellet</strong>: elige una marca premium o super-premium. El supermercado barato
          es lo que más problemas de salud trae a largo plazo.
        </li>
        <li>
          <strong>BARF</strong>: lo hace bajo supervisión veterinaria con nutricionista, tiene
          freezer dedicado, congela carne ≥72h antes para matar parásitos.
        </li>
      </ul>

      <h3>Perro con dermatitis alérgica</h3>
      <p>
        BARF o pellet hipoalergénico (Royal Canin Anallergenic, Hill's z/d) pueden funcionar.
        Decidir con el vet según test de alergia específico. No adivinar.
      </p>

      <h3>Senior (8+ años)</h3>
      <p>
        Pellet senior formulado con menos proteína (para proteger riñones) + joint care
        (glucosamina). Cambiar a BARF a esta edad tiene riesgos si hay insuficiencia renal oculta.
      </p>

      <h3>Razas gigantes en crecimiento</h3>
      <p>
        <strong>Solo pellet específico para raza gigante</strong> (Royal Canin Giant Puppy, Hill's
        Large Breed). La calcificación ósea de un Gran Danés o San Bernardo es tan sensible que un
        BARF mal balanceado puede causar displasia de cadera irreversible.
      </p>

      <h2>Opción intermedia — dieta mixta</h2>
      <p>Muchos dueños chilenos eligen híbrido:</p>
      <ul>
        <li>Pellet premium en 1 de las 2 comidas del día.</li>
        <li>BARF o húmedo premium en la otra.</li>
      </ul>
      <p>
        Ventajas: menor costo que BARF puro, mejor variedad, si un día no tienes BARF preparado
        tienes el pellet de backup.
      </p>
      <p>Contra: riesgo nutricional si el balance BARF no está bien calculado.</p>

      <h2>Cómo iniciar BARF responsablemente</h2>
      <ol>
        <li>
          <strong>Consulta con nutricionista veterinario</strong>. En Santiago hay vets
          especializados (buscar "nutrición veterinaria" en el directorio).
        </li>
        <li>
          <strong>Empieza con BARF comercial</strong> antes de hacerlo casero. Marcas chilenas
          tienen control de calidad. Una vez que manejas el tema, puedes hacer casero si querés
          ahorrar.
        </li>
        <li>
          <strong>Congela la carne mínimo 72h antes</strong> a -20°C. Mata la mayoría de parásitos.
        </li>
        <li>
          <strong>Suplementos obligatorios</strong>: Omega-3 (aceite pescado), vitamina E, yodo
          (alga kelp o sal yodada en mínima cantidad), taurina si es gato.
        </li>
        <li>
          <strong>Higiene estricta</strong>: utensilios dedicados, lavado manos, superficies
          desinfectadas. No mezclar con comida humana.
        </li>
        <li>
          <strong>Transición gradual</strong>: si tu perro viene comiendo pellet, introducir BARF
          durante 2-3 semanas mezclando.
        </li>
        <li>
          <strong>Monitorea en ficha clínica</strong>: peso, energía, heces, pelaje, exámenes de
          sangre cada 6 meses. Si algo va mal, pellet tiene que estar listo como plan B.
        </li>
      </ol>

      <div className="not-prose rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">
          🐾 Registra el cambio de dieta en Paw Friend
        </p>
        <p className="text-sm text-emerald-800 mb-3">
          Si vas a cambiar de pellet a BARF (o viceversa), registra la transición en la ficha
          clínica + los exámenes de control. Así si aparece un problema en 6 meses, tu veterinario
          tiene el historial completo para diagnosticar rápido.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Crear ficha clínica gratis →
        </Link>
      </div>

      <h2>Comida casera cocida (tercera opción)</h2>
      <p>
        Entre BARF y pellet está la comida casera cocida: pollo + arroz + zanahoria + aceite.
        Ventajas: más barato que BARF, sin riesgo bacteriano, más control de ingredientes.
        Desventajas: requiere suplementos calculados, más tiempo preparación, riesgo de desbalance
        si no consultas con vet.
      </p>
      <p>
        Es buena opción intermedia para perros con problemas digestivos específicos (comer 3-4
        semanas de arroz + pollo hervido durante una gastritis), pero no como dieta de por vida sin
        supervisión.
      </p>

      <h2>Qué NO dar nunca</h2>
      <ul>
        <li>
          <strong>Chocolate, uvas, pasas, cebolla, ajo, aguacate, xylitol</strong>: tóxicos para
          perros y gatos.
        </li>
        <li>
          <strong>Huesos cocidos</strong>: se astillan y perforan intestino. Solo crudos.
        </li>
        <li>
          <strong>Restos de mesa con sal y condimento</strong>: causa problemas renales y
          digestivos.
        </li>
        <li>
          <strong>Leche adulta</strong>: la mayoría de perros adultos son intolerantes a la lactosa.
        </li>
        <li>
          <strong>Pescado crudo de río</strong>: riesgo de parásitos hepáticos (enfermedad de salmon
          poisoning).
        </li>
      </ul>

      <h2>Costos reales primer año — comparativa</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Dieta</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Costo/año perro 20kg
            </th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Setup inicial
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Pellet supermercado</td>
            <td className="p-2 border-b">$300-420k</td>
            <td className="p-2 border-b">$0</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Pellet premium</td>
            <td className="p-2 border-b">$600-840k</td>
            <td className="p-2 border-b">$0</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Pellet super-premium</td>
            <td className="p-2 border-b">$840k-$1.2M</td>
            <td className="p-2 border-b">$0</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">BARF casero</td>
            <td className="p-2 border-b">$960k-$1.4M</td>
            <td className="p-2 border-b">Freezer dedicado $200-400k</td>
          </tr>
          <tr>
            <td className="p-2 border-b">BARF comercial</td>
            <td className="p-2 border-b">$1.2-1.8M</td>
            <td className="p-2 border-b">Freezer opcional</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Dieta mixta (50/50)</td>
            <td className="p-2 border-b">$780k-$1.1M</td>
            <td className="p-2 border-b">$0-200k</td>
          </tr>
        </tbody>
      </table>

      <h2>Veredicto honesto</h2>
      <p>No hay dieta "mejor" universal. La mejor es la que:</p>
      <ol>
        <li>Tu perro tolera digestivamente bien (sin diarrea, sin vómitos).</li>
        <li>Mantiene peso + energía + pelaje en rango saludable.</li>
        <li>Te puedes permitir económicamente los próximos 10-15 años.</li>
        <li>Te da tiempo para preparar/servir sin estrés.</li>
        <li>Tu veterinario de cabecera aprueba.</li>
      </ol>

      <p>
        La peor decisión es elegir BARF o pellet por moda/grupo de Facebook/persona que no es vet.
        Siempre consultar con veterinario tu caso específico.
      </p>

      <p>
        Busca vets con experiencia en nutrición en{' '}
        <Link to="/veterinarios" className="text-purple-700 underline">
          el directorio Paw Friend
        </Link>
        .
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 9 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/cuanto-cuesta-tener-perro-primer-ano-chile"
            className="text-purple-700 underline"
          >
            Presupuesto primer año
          </Link>
          {' · '}
          <Link
            to="/blog/desparasitacion-perro-gato-cada-cuanto-chile"
            className="text-purple-700 underline"
          >
            Cada cuánto desparasitar
          </Link>
        </p>
      </div>
    </article>
  );
}
