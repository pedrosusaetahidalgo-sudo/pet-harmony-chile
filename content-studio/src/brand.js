// Tokens del brand v2 de Paw Friend.
// Paleta sincronizada con public/paw-friend-assets-v2/logo/*.svg
// (primary #9333EA = violeta-700 Tailwind, no el #8B5CF6 generico).

export const COLORS = {
  primary: '#9333EA',       // violeta oficial del logo
  primaryDark: '#6B21A8',   // wordmark "paw" color
  primaryLight: '#C084FC',
  accent: '#F59E0B',
  accentDark: '#B45309',
  ink: '#0F172A',
  inkSoft: '#334155',
  muted: '#64748B',
  bg: '#FAF5FF',
  white: '#FFFFFF',
  success: '#10B981',
  danger: '#EF4444',
  gradient: {
    purple: ['#9333EA', '#6B21A8'],
    warm: ['#F59E0B', '#EF4444'],
    soft: ['#FAF5FF', '#EDE9FE'],
  },
};

export const FORMATS = {
  igFeed: { width: 1080, height: 1350, label: 'Instagram Feed 4:5' },
  igSquare: { width: 1080, height: 1080, label: 'Instagram Square' },
  reel: { width: 1080, height: 1920, label: 'Reel / TikTok 9:16' },
  linkedIn: { width: 1200, height: 627, label: 'LinkedIn 1.91:1' },
  linkedInCarousel: { width: 1080, height: 1350, label: 'LinkedIn Carousel' },
  story: { width: 1080, height: 1920, label: 'Story 9:16' },
};

export const FONTS = {
  display: 'Inter',
  body: 'Inter',
};

export const BRAND = {
  name: 'Paw Friend',
  tagline: 'La libreta de salud de tu mascota. Gratis, siempre.',
  url: 'pawfriend.cl',
  handles: {
    instagram: '@pawfriend.cl',
    tiktok: '@pawfriend.cl',
    linkedin: 'paw-friend',
  },
};
