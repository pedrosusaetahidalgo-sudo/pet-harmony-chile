// Default props para preview en remotion studio.
// El render real sobreescribe con las props de la campaña.
export default {
  totalSeconds: 15,
  brandHandle: '@pawfriend.cl',
  scenes: [
    {
      durationInSeconds: 3,
      kind: 'hook',
      headline: 'Ema está ofendida.',
      sub: 'Escuchame.',
    },
    {
      durationInSeconds: 4,
      kind: 'context',
      headline: 'Kai ahora tiene ficha médica.',
      sub: 'Con vacunas, peso y recordatorios.',
    },
    {
      durationInSeconds: 3.5,
      kind: 'punch',
      headline: '…Ema no.',
      sub: 'Y está resentida.',
    },
    {
      durationInSeconds: 4.5,
      kind: 'cta',
      headline: 'Hacele la suya. Gratis.',
      sub: 'Como la de Kai.',
    },
  ],
};
