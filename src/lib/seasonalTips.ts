/**
 * Tips estacionales de cuidado por especie.
 * Hemisferio sur (Chile): Abr-Jun otono, Jul-Sep invierno, Oct-Dic primavera, Ene-Mar verano.
 */

type Season = 'verano' | 'otono' | 'invierno' | 'primavera';

const tips: Record<string, Record<Season, string[]>> = {
  perro: {
    verano: [
      'Evita paseos en el pavimento caliente al mediodia — toca el suelo con tu mano, si quema para ti, quema para sus almohadillas.',
      'Asegurate de que siempre tenga agua fresca disponible, especialmente despues del ejercicio.',
      'Cuidado con las espigas en los parques, se pueden clavar en orejas y patas.',
    ],
    otono: [
      'Es buen momento para reforzar desparasitacion antes del invierno.',
      'Revisa el pelaje: el cambio de manto es normal, cepillalo mas seguido.',
      'Mantén las vacunas al dia antes de la temporada de lluvias.',
    ],
    invierno: [
      'Revisa las almohadillas despues de paseos en lluvia — secalas bien al llegar.',
      'Abrigo para razas de pelo corto en dias de frio intenso.',
      'Reduce los banos para evitar resfriados; usa shampoo seco si es necesario.',
    ],
    primavera: [
      'Atencion a las alergias estacionales: revisa si se rasca mas de lo normal.',
      'Retoma los paseos mas largos, aumentando gradualmente la actividad.',
      'Es temporada alta de pulgas y garrapatas — verifica que su antipulgas este al dia.',
    ],
  },
  gato: {
    verano: [
      'Asegurate de tener agua fresca disponible todo el dia — los gatos toman poco por naturaleza.',
      'Si sale al exterior, aplica protector solar en orejas y nariz (gatos blancos especialmente).',
      'Mantén la arena limpia: con calor las bacterias se multiplican mas rapido.',
    ],
    otono: [
      'Prepara espacios calidos en la casa — los gatos buscan refugio del frio.',
      'Es normal que coma un poco mas: esta preparando reservas para el invierno.',
      'Buen momento para un chequeo dental de rutina.',
    ],
    invierno: [
      'Si tiene acceso al exterior, revisalo cuando vuelva: puede traer humedad y barro.',
      'Aumenta las sesiones de juego dentro de casa para compensar la menor actividad.',
      'Verifica que su lugar de descanso no este en corrientes de aire.',
    ],
    primavera: [
      'Cepillado frecuente: esta botando el pelaje de invierno.',
      'Atencion a las plantas de temporada — muchas son toxicas para gatos (lirios, tulipanes).',
      'Buen momento para reforzar el antipulgas antes del peak de verano.',
    ],
  },
  conejo: {
    verano: [
      'Los conejos son muy sensibles al calor — mantén su espacio bajo 25°C.',
      'Ponle una botella de agua congelada envuelta en tela para que se refresque.',
      'Revisa diariamente que no tenga moscas cerca (miasis es comun en verano).',
    ],
    otono: [
      'Asegurate de que su heno este seco y fresco — la humedad puede generar hongos.',
      'Buen momento para un chequeo dental: los dientes crecen constantemente.',
      'Aumenta gradualmente la porcion de heno para el invierno.',
    ],
    invierno: [
      'Protege su jaula de corrientes de aire y humedad.',
      'Verduras a temperatura ambiente, nunca directo del refrigerador.',
      'Revisa sus patas: la humedad puede causar pododermatitis.',
    ],
    primavera: [
      'Cepillado diario durante la muda de pelo — previene bolas de pelo.',
      'Si sale al jardin, asegurate de que no coma plantas tratadas con pesticidas.',
      'Es temporada de vacunacion — consulta con tu vet por mixomatosis.',
    ],
  },
  hamster: {
    verano: [
      'Mantén su jaula lejos del sol directo — golpe de calor es un riesgo real.',
      'Puedes poner una loseta de ceramica fria dentro de la jaula para que se refresque.',
      'Cambia el agua mas seguido: se entibia rapido con el calor.',
    ],
    otono: [
      'Revisa que su rueda y juguetes esten en buen estado antes del invierno.',
      'Aumenta levemente la comida: se prepara para el frio.',
      'Limpia la jaula mas a fondo — la humedad del otono favorece hongos.',
    ],
    invierno: [
      'Temperatura ideal entre 18-24°C — si baja mucho puede entrar en torpor.',
      'Agrega mas viruta o sustrato para que se abrigue en su nido.',
      'No lo ubiques cerca de calefactores: el aire seco le afecta.',
    ],
    primavera: [
      'Buen momento para un chequeo veterinario anual.',
      'Ofrece mas verduras frescas de temporada (brocoli, pepino, zanahoria).',
      'Limpieza profunda de la jaula para empezar la temporada fresca.',
    ],
  },
};

export function getSeason(): Season {
  const month = new Date().getMonth(); // 0-11
  // Hemisferio sur (Chile)
  if (month >= 0 && month <= 2) return 'verano'; // Ene-Mar
  if (month >= 3 && month <= 5) return 'otono'; // Abr-Jun
  if (month >= 6 && month <= 8) return 'invierno'; // Jul-Sep
  return 'primavera'; // Oct-Dic
}

export function getSeasonalTips(species: string): string[] {
  const season = getSeason();
  const key = species.toLowerCase();
  const speciesTips = tips[key];
  if (speciesTips) return speciesTips[season];
  // Fallback a perro si la especie no tiene tips especificos
  return tips.perro[season];
}

export function getSeasonLabel(): string {
  const labels: Record<Season, string> = {
    verano: 'Verano',
    otono: 'Otoño',
    invierno: 'Invierno',
    primavera: 'Primavera',
  };
  return labels[getSeason()];
}
