import { h } from './h.js';
import { COLORS } from '../brand.js';
import { LOGO } from '../logo.js';

// Hero 1200x627 para LinkedIn / Open Graph.
export function linkedInHero({ title = '', subtitle = '', accent = COLORS.primary }) {
  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: 1200,
      height: 627,
      background: COLORS.white,
      padding: 64,
      justifyContent: 'space-between',
      fontFamily: 'Inter',
    },
  },
    // Header: logo oficial + wordmark
    h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
      h('img', {
        src: LOGO.iconPrincipal,
        width: 72,
        height: 72,
        style: { display: 'flex' },
      }),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 2 } },
        h('div', { style: { display: 'flex', fontSize: 28, fontWeight: 700, color: COLORS.ink, letterSpacing: '-0.5px' } }, 'Paw Friend'),
        h('div', { style: { display: 'flex', fontSize: 18, color: COLORS.muted } }, 'pawfriend.cl')
      )
    ),
    // Title block
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
      subtitle ? h('div', {
        style: {
          display: 'flex',
          fontSize: 22,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '2px',
        },
      }, subtitle) : null,
      h('div', {
        style: {
          display: 'flex',
          fontSize: 58,
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-1.4px',
          color: COLORS.ink,
          maxWidth: 900,
        },
      }, title)
    ),
    // Footer
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 20,
        color: COLORS.muted,
      },
    },
      h('div', { style: { display: 'flex' } }, 'La libreta de salud de tu mascota. Gratis, siempre.'),
      h('div', { style: { display: 'flex', gap: 12, alignItems: 'center' } },
        h('div', {
          style: {
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: COLORS.success,
          },
        }),
        h('div', { style: { display: 'flex' } }, 'Hecho en Chile')
      )
    )
  );
}
