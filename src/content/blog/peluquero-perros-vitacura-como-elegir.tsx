/**
 * Post SEO #5 — long-tail: "peluquero perros Vitacura" + "groomer canino".
 * Tie-in con directorio groomers + estimador precios.
 */

import { Link } from 'react-router-dom';

export default function Post() {
  return (
    <article className="prose prose-purple max-w-none">
      <p className="lead text-lg text-muted-foreground">
        Elegir peluquero canino en Vitacura no es solo mirar precio. Un mal corte tarda 6 semanas en
        crecer y un mal manejo puede estresar a tu perro de por vida. Esta guía te dice qué pedir,
        qué evitar y cuánto pagar en Vitacura, La Reina y Las Condes en 2026.
      </p>

      <h2>Peluquería canina vs baño: no es lo mismo</h2>
      <p>
        <strong>Baño básico</strong> ($12.000 - $25.000 CLP): lavado, secado, cepillado, corte de
        uñas, limpieza de oídos. 45-60 min. Ideal cada 3-4 semanas.
      </p>
      <p>
        <strong>Peluquería completa</strong> ($25.000 - $60.000 CLP): todo lo anterior + corte de
        pelo según raza, desenredado profundo, corte higiénico, revisión de oídos + ojos. 1.5-2.5
        hrs. Cada 6-8 semanas en razas de pelo largo.
      </p>
      <p>
        <strong>Servicios extra</strong>:
      </p>
      <ul>
        <li>Corte de uñas aislado: $5.000 - $10.000.</li>
        <li>Limpieza dental profunda (sin anestesia): $15.000 - $30.000.</li>
        <li>Desparasitación externa: $8.000 - $20.000.</li>
        <li>Tinturas o maquillaje canino: $15.000 - $40.000 (evitar, estresa al perro).</li>
      </ul>

      <h2>Rangos de precio en Vitacura (2026)</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Tamaño</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Baño</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Peluquería</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Chico (&lt; 10 kg)</td>
            <td className="p-2 border-b">$12.000 - $18.000</td>
            <td className="p-2 border-b">$22.000 - $38.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Mediano (10-25 kg)</td>
            <td className="p-2 border-b">$18.000 - $25.000</td>
            <td className="p-2 border-b">$35.000 - $55.000</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Grande (25-40 kg)</td>
            <td className="p-2 border-b">$25.000 - $35.000</td>
            <td className="p-2 border-b">$50.000 - $80.000</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Gigante (&gt; 40 kg)</td>
            <td className="p-2 border-b">$35.000 - $55.000</td>
            <td className="p-2 border-b">$70.000 - $110.000</td>
          </tr>
        </tbody>
      </table>

      <p>
        Vitacura tiende a cobrar 10-25% más que Ñuñoa o Providencia por el mismo servicio. En
        algunos casos justificado (mejor equipamiento, champús premium), en otros no. Compara en el{' '}
        <Link to="/services/groomers" className="text-purple-700 underline">
          directorio de peluqueros
        </Link>
        .
      </p>

      <h2>7 señales de buen peluquero canino</h2>

      <ol>
        <li>
          <strong>Pregunta por el temperamento antes de cortar.</strong> Un buen groomer pide info:
          ¿es reactivo al secador? ¿muerde cuando lo tocan en las patas? ¿tiene miedo? Un groomer
          que te dice "trae nomás" sin preguntar, es red flag.
        </li>
        <li>
          <strong>Mesa con arnés de seguridad.</strong> Para que el perro no salte ni caiga. No debe
          estar colgado — el arnés es de estabilidad, no de suspensión.
        </li>
        <li>
          <strong>Secador sin ruido excesivo.</strong> Secadores industriales pueden generar 85+ dB.
          Ideal: secador potente pero con boquilla dirigida, no presión directa en la cara.
        </li>
        <li>
          <strong>Local visible o fotos del proceso.</strong> Muchos groomers publican stories en
          Instagram. Si no hay nada público, desconfía. Los buenos están orgullosos de su trabajo.
        </li>
        <li>
          <strong>Tiempo sensato.</strong> Un baño chico debería ser ~45 min, peluquería mediano
          ~1.5-2 hrs. Si te dicen "2 perros en 30 min cada uno", están apurando y se nota.
        </li>
        <li>
          <strong>Uso de productos según raza.</strong> Piel de Bulldog Francés ≠ piel de Poodle. Un
          buen peluquero ajusta champú y frecuencia.
        </li>
        <li>
          <strong>Aviso antes de corte dramatico.</strong> Si tu Schnauzer va a salir completamente
          pelado "por enredo", te avisan y preguntan. No te lo dejan calvo de sorpresa.
        </li>
      </ol>

      <h2>Red flags: cuándo cambiar de peluquero</h2>

      <ul>
        <li>
          <strong>Tu perro llega estresado/mojado de orina o heces.</strong> Señal de manejo brusco
          o tiempos muy largos encerrado.
        </li>
        <li>
          <strong>Cortes o heridas que no te avisaron.</strong> Accidentes pasan, pero un
          profesional te llama inmediatamente. Si lo descubres después, problema.
        </li>
        <li>
          <strong>Recortes muy desparejos o "esquilado" en pelo largo.</strong> Es el atajo cuando
          el perro se movió demasiado. Debería ser excepción, no norma.
        </li>
        <li>
          <strong>"No te puedo atender porque tu perro es difícil".</strong> Un profesional tiene
          herramientas (bozales suaves, pausas, técnica) para casi todos los casos. Si rechaza sin
          opciones, no tiene experiencia.
        </li>
        <li>
          <strong>Precios distintos cada vez sin cambio de servicio.</strong> Transparencia importa.
        </li>
      </ul>

      <h2>Peluquería a domicilio: ¿vale la pena?</h2>

      <p>
        En Vitacura y Las Condes hay creciente oferta de peluquería a domicilio ($40.000 - $90.000
        CLP según tamaño). Ventajas:
      </p>
      <ul>
        <li>Cero estrés de transporte en auto.</li>
        <li>Tu perro en terreno conocido.</li>
        <li>Ahorro de tiempo para ti.</li>
      </ul>

      <p>Desventajas:</p>
      <ul>
        <li>Más caro (+20-40% vs local).</li>
        <li>Precisión menor si no tiene espacio adecuado.</li>
        <li>Post-servicio: tu casa queda con pelos.</li>
      </ul>

      <p>
        Veredicto: vale la pena si tu perro es reactivo al auto o si tienes horario apretado. Si tu
        perro viaja bien, local tradicional entrega mejor corte.
      </p>

      <h2>Frecuencia recomendada por tipo de pelo</h2>

      <table className="not-prose w-full text-sm border-collapse my-4">
        <thead>
          <tr className="bg-purple-50">
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Tipo</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">Baño</th>
            <th className="text-left p-2 border-b border-purple-100 font-semibold">
              Peluquería completa
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2 border-b">Pelo corto (Labrador, Bulldog)</td>
            <td className="p-2 border-b">Cada 4-6 semanas</td>
            <td className="p-2 border-b">Solo limpieza + uñas</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Pelo medio (Border Collie)</td>
            <td className="p-2 border-b">Cada 3-4 semanas</td>
            <td className="p-2 border-b">Cada 3 meses</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Pelo largo (Shih Tzu, Yorkshire)</td>
            <td className="p-2 border-b">Cada 2-3 semanas</td>
            <td className="p-2 border-b">Cada 6-8 semanas</td>
          </tr>
          <tr className="bg-slate-50/50">
            <td className="p-2 border-b">Rizado (Poodle, Caniche)</td>
            <td className="p-2 border-b">Cada 3 semanas</td>
            <td className="p-2 border-b">Cada 4-6 semanas</td>
          </tr>
          <tr>
            <td className="p-2 border-b">Doble capa (Husky, Golden)</td>
            <td className="p-2 border-b">Cada 4-8 semanas</td>
            <td className="p-2 border-b">Nunca rasurar. Solo cepillado profundo.</td>
          </tr>
        </tbody>
      </table>

      <h2>Antes de la cita: preparación en casa</h2>

      <ol>
        <li>
          <strong>Camina 15-20 min antes.</strong> Perro cansado = perro más tranquilo en la mesa.
        </li>
        <li>
          <strong>No alimentes 2 hrs antes.</strong> Evita náuseas por secador + estrés.
        </li>
        <li>
          <strong>Deja hacer pipí antes.</strong> Las sesiones de peluquería pueden durar 2 hrs.
        </li>
        <li>
          <strong>Lleva su foto tipo "como me gustó la última vez".</strong> Ayuda al groomer a
          replicar.
        </li>
        <li>
          <strong>Menciona medicamentos o condiciones.</strong> Si tiene dermatitis alérgica,
          epilepsia o ansiedad, el groomer debe saber.
        </li>
      </ol>

      <div className="not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5 my-6">
        <p className="text-base font-semibold text-purple-900 mb-2">
          🐾 Encuentra peluquero canino en Vitacura
        </p>
        <p className="text-sm text-purple-800 mb-3">
          En Paw Friend puedes filtrar peluqueros por comuna + ver reseñas de otros dueños. Agenda
          directamente y lleva la ficha médica de tu perro a la primera cita.
        </p>
        <Link
          to="/services/groomers"
          className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
        >
          Ver directorio peluqueros →
        </Link>
      </div>

      <h2>¿Mi perro necesita peluquería?</h2>

      <p>Probablemente sí si:</p>
      <ul>
        <li>Tiene pelo largo o rizado (Shih Tzu, Caniche, Poodle, Yorkshire, Maltés).</li>
        <li>Tiene pelo medio que se enreda (Cocker, Border, Golden con muda).</li>
        <li>Tiene ojos con pelo que los cubre (irritación ocular frecuente).</li>
        <li>Tiene uñas largas que se escuchan en piso duro.</li>
      </ul>

      <p>Probablemente no necesita peluquería completa (solo baño) si:</p>
      <ul>
        <li>Tiene pelo corto liso (Labrador, Bulldog, Pitbull, Beagle).</li>
        <li>Es perro de raza Husky, Malamute, Akita — no rasurar jamás.</li>
      </ul>

      <div className="not-prose border-t border-slate-200 pt-6 mt-8">
        <p className="text-sm text-muted-foreground">
          Publicado 21 abril 2026 · Paw Friend · 7 min lectura
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          <strong>Sigue leyendo:</strong>{' '}
          <Link
            to="/blog/cuanto-cuesta-veterinario-las-condes"
            className="text-purple-700 underline"
          >
            Precios veterinarios Las Condes
          </Link>
          {' · '}
          <Link to="/blog/cronograma-vacunas-cachorro-chile" className="text-purple-700 underline">
            Cronograma vacunas cachorro
          </Link>
        </p>
      </div>
    </article>
  );
}
