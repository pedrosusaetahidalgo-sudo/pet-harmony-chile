import { h } from './h.js';
import { COLORS } from '../brand.js';
import { LOGO } from '../logo.js';

// Slide de carrusel 1080x1350 (Instagram feed 4:5).
// Con imageDataUri: foto full-bleed + gradient overlay + texto abajo.
// Sin imageDataUri: layout tipografico sobre color solido (como antes).

const brandLogo = ({ size = 56, variant = 'principal' } = {}) =>
  h('img', {
    src: variant === 'reverse' ? LOGO.iconReverse : LOGO.iconPrincipal,
    width: size,
    height: size,
    style: { display: 'flex' },
  });

const header = ({ light = false } = {}) =>
  h('div', { style: { display: 'flex', alignItems: 'center', gap: 16 } },
    brandLogo({ size: light ? 64 : 56, variant: light ? 'reverse' : 'principal' }),
    h('div', {
      style: {
        display: 'flex',
        fontSize: light ? 30 : 26,
        fontWeight: 700,
        color: light ? 'white' : COLORS.ink,
        letterSpacing: '-0.5px',
        textShadow: light ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
      },
    }, 'Paw Friend')
  );

const footer = ({ handle, slideNumber, totalSlides, light = false }) =>
  h('div', {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 22,
      color: light ? 'rgba(255,255,255,0.88)' : COLORS.muted,
      textShadow: light ? '0 2px 6px rgba(0,0,0,0.35)' : 'none',
    },
  },
    h('div', { style: { display: 'flex' } }, handle),
    h('div', { style: { display: 'flex' } }, `${slideNumber}/${totalSlides}`)
  );

// Slide con foto de fondo. La foto ocupa el full-bleed,
// tiene gradient overlay pronunciado abajo, y el texto queda pegado abajo.
function photoSlide({ variant, title, subtitle, body, slideNumber, totalSlides, handle, accent, imageDataUri }) {
  const isCover = variant === 'cover';
  const isCta = variant === 'cta';
  const headlineSize = isCover ? 102 : isCta ? 78 : 82;

  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: 1080,
      height: 1350,
      backgroundColor: COLORS.ink,
      position: 'relative',
      fontFamily: 'Inter',
      color: 'white',
    },
  },
    // Imagen de fondo absoluto
    h('img', {
      src: imageDataUri,
      width: 1080,
      height: 1350,
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1350,
        objectFit: 'cover',
      },
    }),
    // Gradient overlay: oscuro arriba y muy oscuro abajo para contraste con texto
    h('div', {
      style: {
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        width: 1080,
        height: 1350,
        background: `linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.15) 28%, rgba(15,23,42,0.35) 58%, rgba(15,23,42,0.95) 100%)`,
      },
    }),
    // Contenido encima del overlay
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: 1080,
        height: 1350,
        padding: '72px 72px 80px 72px',
        justifyContent: 'space-between',
      },
    },
      header({ light: true }),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 24 } },
        subtitle ? h('div', {
          style: {
            display: 'flex',
            fontSize: 28,
            fontWeight: 800,
            color: '#FACC15',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            textShadow: '0 2px 8px rgba(0,0,0,0.55)',
          },
        }, subtitle) : null,
        h('div', {
          style: {
            display: 'flex',
            fontSize: headlineSize,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-2.5px',
            color: 'white',
            textShadow: '0 4px 24px rgba(0,0,0,0.55)',
          },
        }, title),
        body ? h('div', {
          style: {
            display: 'flex',
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.3,
            color: 'rgba(255,255,255,0.94)',
            textShadow: '0 2px 12px rgba(0,0,0,0.55)',
          },
        }, body) : null,
        isCta ? h('div', { style: { display: 'flex', marginTop: 12 } },
          h('div', {
            style: {
              display: 'flex',
              background: COLORS.primary,
              color: 'white',
              padding: '24px 44px',
              borderRadius: 999,
              fontSize: 34,
              fontWeight: 800,
              boxShadow: '0 18px 40px rgba(147,51,234,0.55)',
            },
          }, 'pawfriend.cl')
        ) : null
      ),
      footer({ handle, slideNumber, totalSlides, light: true })
    )
  );
}

export function carouselSlide({
  variant = 'body',
  title = '',
  subtitle = '',
  body = '',
  slideNumber = 1,
  totalSlides = 5,
  accent = COLORS.primary,
  handle = '@pawfriend.cl',
  imageDataUri = null,
}) {
  // Si hay imagen de fondo, usa layout photo-slide.
  if (imageDataUri) {
    return photoSlide({ variant, title, subtitle, body, slideNumber, totalSlides, handle, accent, imageDataUri });
  }

  // Layouts tipograficos sin foto (fallback clasico)
  if (variant === 'cover') {
    return h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 1080,
        height: 1350,
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
        padding: '80px 72px',
        justifyContent: 'space-between',
        color: 'white',
        fontFamily: 'Inter',
      },
    },
      header({ light: true }),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 32 } },
        h('div', {
          style: {
            display: 'flex',
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: '-2.5px',
          },
        }, title),
        subtitle ? h('div', {
          style: {
            display: 'flex',
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.25,
            opacity: 0.92,
          },
        }, subtitle) : null
      ),
      footer({ handle, slideNumber, totalSlides, light: true })
    );
  }

  if (variant === 'cta') {
    return h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: 1080,
        height: 1350,
        background: COLORS.bg,
        padding: '80px 72px',
        justifyContent: 'space-between',
        color: COLORS.ink,
        fontFamily: 'Inter',
      },
    },
      header(),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 28 } },
        h('div', {
          style: {
            display: 'flex',
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-2px',
            color: COLORS.ink,
          },
        }, title),
        body ? h('div', {
          style: {
            display: 'flex',
            fontSize: 34,
            lineHeight: 1.35,
            color: COLORS.inkSoft,
          },
        }, body) : null,
        h('div', { style: { display: 'flex', marginTop: 16 } },
          h('div', {
            style: {
              display: 'flex',
              background: COLORS.primary,
              color: 'white',
              padding: '24px 40px',
              borderRadius: 999,
              fontSize: 32,
              fontWeight: 700,
            },
          }, 'pawfriend.cl')
        )
      ),
      footer({ handle, slideNumber, totalSlides })
    );
  }

  // Body (default) — fondo blanco
  return h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      width: 1080,
      height: 1350,
      background: COLORS.white,
      padding: '80px 72px',
      justifyContent: 'space-between',
      color: COLORS.ink,
      fontFamily: 'Inter',
    },
  },
    header(),
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 28 } },
      subtitle ? h('div', {
        style: {
          display: 'flex',
          fontSize: 26,
          fontWeight: 700,
          color: accent,
          textTransform: 'uppercase',
          letterSpacing: '2px',
        },
      }, subtitle) : null,
      h('div', {
        style: {
          display: 'flex',
          fontSize: 72,
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: '-1.8px',
          color: COLORS.ink,
        },
      }, title),
      body ? h('div', {
        style: {
          display: 'flex',
          fontSize: 34,
          lineHeight: 1.4,
          color: COLORS.inkSoft,
        },
      }, body) : null
    ),
    footer({ handle, slideNumber, totalSlides })
  );
}
