/**
 * Primer post SEO — long-tail "veterinario urgencia Providencia 3am".
 * INIT-13 Plan 90d: atacar queries donde competencia (QVET, Petsy,
 * CuidaPet) no hace contenido local.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Son las 3 AM. Tu perro vomitó por segunda vez, no quiere tomar agua y está decaído. ¿Qué
        haces? Esta guía te ayuda a tomar la decisión correcta en los primeros 15 minutos.
      </p>

      <h2>Antes de salir de casa (primeros 3 minutos)</h2>

      <p>
        Si tu mascota presenta alguno de estos síntomas, estás frente a una emergencia real y hay
        que ir a una clínica 24 horas sin perder tiempo:
      </p>

      <ul>
        <li>Vómitos o diarrea con sangre.</li>
        <li>Dificultad para respirar o tos persistente.</li>
        <li>Convulsiones o desmayos.</li>
        <li>Dolor abdominal intenso (abdomen tenso, no deja tocar).</li>
        <li>Imposibilidad de orinar durante más de 12 horas.</li>
        <li>Accidente (atropello, caída, pelea con otro animal).</li>
        <li>
          Ingesta de tóxicos (chocolate, uvas, medicamentos humanos, raticida, anticongelante).
        </li>
        <li>Temperatura corporal &lt; 37°C o &gt; 40°C.</li>
      </ul>

      <p>
        Si son síntomas leves (vómito único, poca energía, apetito normal), puedes esperar a la
        mañana y contactar a tu veterinario de cabecera.{' '}
        <strong>
          Ante la duda, llama primero por teléfono — la mayoría de clínicas 24h asesora por celular
          y te dice si hace falta venir ahora.
        </strong>
      </p>

      <h2>Clínicas 24 horas cerca de Providencia (Santiago)</h2>

      <p>
        Estas son opciones de veterinarias con atención 24/7 en comunas cercanas a Providencia. Los
        datos están sujetos a cambios — antes de salir, confirma por teléfono que están abiertos y
        tienen capacidad.
      </p>

      <div className="not-prose rounded-lg border border-purple-100 bg-purple-50/50 p-4 my-4">
        <p className="text-sm text-purple-900 mb-0">
          <strong>💡 Tip:</strong> en{' '}
          <Link to="/veterinarios/comuna/providencia" className="text-purple-700 underline">
            Paw Friend puedes buscar veterinarios en Providencia
          </Link>{' '}
          filtrando por "urgencia" o "24 horas" y ver reseñas verificadas de otros dueños antes de
          viajar.
        </p>
      </div>

      <h3>Qué llevar contigo</h3>

      <ol>
        <li>
          <strong>Transporte seguro.</strong> Si es perro chico o gato, en jaula/mochila. Si es
          perro grande, con collar + correa corta.
        </li>
        <li>
          <strong>Toalla o manta.</strong> Para envolver si hay temblores o para pisos mojados en la
          camioneta.
        </li>
        <li>
          <strong>Una muestra de vómito o heces</strong> (si hay). Pónla en un pote limpio con tapa.
          Ayuda al diagnóstico.
        </li>
        <li>
          <strong>La ficha clínica de tu mascota.</strong> Con Paw Friend, genera un PDF en el
          celular: datos, peso, alergias, medicamentos actuales, última consulta.{' '}
          <Link to="/my-pets" className="text-purple-700 underline">
            Abrir mis mascotas
          </Link>{' '}
          o, si todavía no usas Paw Friend,{' '}
          <Link to="/auth" className="text-purple-700 underline">
            crea tu cuenta gratis
          </Link>
          .
        </li>
        <li>
          <strong>Dinero o tarjeta.</strong> Las consultas de urgencia cuestan entre $35.000 y
          $90.000 CLP dependiendo de la comuna y lo que requiera el tratamiento (exámenes,
          hospitalización).
        </li>
      </ol>

      <h2>Qué preguntar al llegar</h2>

      <p>En el mostrador, pide esto antes que te cobren:</p>

      <ul>
        <li>
          <strong>Presupuesto aproximado.</strong> Consulta + exámenes básicos + medicamentos suele
          estar entre $50.000 y $150.000. Si te dicen &gt;$300.000 sin diagnóstico claro, pide
          segunda opinión.
        </li>
        <li>
          <strong>Qué médico veterinario te atenderá.</strong> Pregunta nombre y especialidad.
          Cualquier profesional debería tener su título visible.
        </li>
        <li>
          <strong>Detalle del tratamiento por escrito.</strong> Te lo tienen que entregar — es
          obligatorio legalmente en Chile para recetas médicas.
        </li>
        <li>
          <strong>Boleta o factura.</strong> Aunque sea urgencia, te la deben dar. Guárdala: te
          sirve para seguros pet (si tienes) y para historial posterior.
        </li>
      </ul>

      <h2>Post-emergencia: guardar el registro</h2>

      <p>
        Cuando vuelvas a casa, carga la información de la visita en la ficha clínica de tu mascota:
      </p>

      <ul>
        <li>Fecha y hora.</li>
        <li>Diagnóstico (o sospecha diagnóstica si no hubo certeza).</li>
        <li>Medicamentos recetados (nombre, dosis, frecuencia).</li>
        <li>Foto o scan de la boleta y receta.</li>
      </ul>

      <p>
        En Paw Friend tu veterinario habitual puede acceder a este registro si compartiste la ficha
        con él, y al próximo control tendrá contexto completo de lo que pasó. Sin Paw Friend, ese
        registro se pierde o queda en papeles que se olvidan en un cajón.
      </p>

      <div className="not-prose rounded-xl border border-emerald-200 bg-emerald-50 p-5 my-6">
        <p className="text-base font-semibold text-emerald-900 mb-2">
          🐾 Lleva contigo la ficha clínica de tu mascota
        </p>
        <p className="text-sm text-emerald-800 mb-3">
          Paw Friend organiza vacunas, antiparasitarios, exámenes y documentos en un solo lugar —
          accesible desde tu celular, PDF descargable para emergencias, y compartible con tu
          veterinario.
        </p>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          Crear mi cuenta gratis →
        </Link>
      </div>

      <h2>Números de emergencia útiles — Chile</h2>

      <ul>
        <li>
          <strong>Servicio de Emergencia Toxicológica (CITUC):</strong> ayuda 24/7 si sospechas
          ingesta de tóxico por tu mascota.
        </li>
        <li>
          <strong>SAG (Servicio Agrícola y Ganadero):</strong> para zoonosis o casos con
          implicancias de salud pública.
        </li>
      </ul>

      <p className="text-sm text-muted-foreground italic">
        Esta guía es informativa, no reemplaza el criterio de un médico veterinario. Si tienes duda,
        siempre llama primero a la clínica antes de salir.
      </p>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 5 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link to="/veterinarios" className="text-purple-700 underline">
            Directorio de veterinarios verificados
          </Link>
          {' · '}
          <Link to="/precios-veterinarios" className="text-purple-700 underline">
            Estimador de precios por comuna
          </Link>
        </p>
      </div>
    </article>
  );
}
