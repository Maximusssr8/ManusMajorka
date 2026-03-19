/**
 * templatePalettes.ts
 * Complete colour + font systems per template. No user input required.
 */

export interface TemplatePalette {
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  bgAlt: string;
  text: string;
  muted: string;
  card: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: string;
  btnStyle: 'filled' | 'outline' | 'gradient';
}

export const TEMPLATE_PALETTES: Record<string, TemplatePalette> = {
  'dtc-minimal': {
    primary: '#d4af37', secondary: '#1a1a1a', accent: '#ffffff',
    bg: '#080808', bgAlt: '#111111', text: '#ffffff', muted: 'rgba(255,255,255,0.55)',
    card: '#121212', border: 'rgba(255,255,255,0.07)',
    headingFont: 'Syne', bodyFont: 'DM Sans', borderRadius: '4px', btnStyle: 'filled',
  },
  'default': {
    primary: '#d4af37', secondary: '#1a1a1a', accent: '#ffffff',
    bg: '#080808', bgAlt: '#111111', text: '#ffffff', muted: 'rgba(255,255,255,0.55)',
    card: '#121212', border: 'rgba(255,255,255,0.07)',
    headingFont: 'Syne', bodyFont: 'DM Sans', borderRadius: '6px', btnStyle: 'filled',
  },
  'dropship-bold': {
    primary: '#ff4444', secondary: '#1a0a0a', accent: '#ffcc00',
    bg: '#0a0a0a', bgAlt: '#151515', text: '#ffffff', muted: 'rgba(255,255,255,0.6)',
    card: '#1a1a1a', border: 'rgba(255,68,68,0.2)',
    headingFont: 'Bebas Neue', bodyFont: 'Inter', borderRadius: '6px', btnStyle: 'filled',
  },
  'premium-brand': {
    primary: '#c9a84c', secondary: '#1a1510', accent: '#e8d5a0',
    bg: '#0d0b08', bgAlt: '#141008', text: '#f5f0e8', muted: 'rgba(245,240,232,0.5)',
    card: '#141008', border: 'rgba(201,168,76,0.15)',
    headingFont: 'Playfair Display', bodyFont: 'Lato', borderRadius: '2px', btnStyle: 'outline',
  },
  'luxury': {
    primary: '#c9a84c', secondary: '#1a1510', accent: '#e8d5a0',
    bg: '#0d0b08', bgAlt: '#141008', text: '#f5f0e8', muted: 'rgba(245,240,232,0.5)',
    card: '#141008', border: 'rgba(201,168,76,0.15)',
    headingFont: 'Playfair Display', bodyFont: 'Lato', borderRadius: '2px', btnStyle: 'outline',
  },
  'coastal-au': {
    primary: '#2a9d8f', secondary: '#e8f4f1', accent: '#e76f51',
    bg: '#f8f5f0', bgAlt: '#eef6f4', text: '#2c3e35', muted: 'rgba(44,62,53,0.55)',
    card: '#ffffff', border: 'rgba(42,157,143,0.15)',
    headingFont: 'Montserrat', bodyFont: 'Lato', borderRadius: '12px', btnStyle: 'filled',
  },
  'coastal': {
    primary: '#2a9d8f', secondary: '#e8f4f1', accent: '#e76f51',
    bg: '#f8f5f0', bgAlt: '#eef6f4', text: '#2c3e35', muted: 'rgba(44,62,53,0.55)',
    card: '#ffffff', border: 'rgba(42,157,143,0.15)',
    headingFont: 'Montserrat', bodyFont: 'Lato', borderRadius: '12px', btnStyle: 'filled',
  },
  'tech-mono': {
    primary: '#58a6ff', secondary: '#0d1117', accent: '#3fb950',
    bg: '#0a0f1e', bgAlt: '#0d1117', text: '#e0e6f0', muted: 'rgba(224,230,240,0.55)',
    card: '#161b22', border: '#30363d',
    headingFont: 'JetBrains Mono', bodyFont: 'Inter', borderRadius: '4px', btnStyle: 'outline',
  },
  'tech': {
    primary: '#58a6ff', secondary: '#0d1117', accent: '#3fb950',
    bg: '#0a0f1e', bgAlt: '#0d1117', text: '#e0e6f0', muted: 'rgba(224,230,240,0.55)',
    card: '#161b22', border: '#30363d',
    headingFont: 'JetBrains Mono', bodyFont: 'Inter', borderRadius: '4px', btnStyle: 'outline',
  },
  'bloom-beauty': {
    primary: '#c96b8a', secondary: '#fff0f5', accent: '#e8a0b4',
    bg: '#fdf6f8', bgAlt: '#fff8f9', text: '#4a2c35', muted: 'rgba(74,44,53,0.55)',
    card: '#ffffff', border: 'rgba(201,107,138,0.15)',
    headingFont: 'Cormorant Garamond', bodyFont: 'Nunito', borderRadius: '20px', btnStyle: 'gradient',
  },
  'bloom': {
    primary: '#c96b8a', secondary: '#fff0f5', accent: '#e8a0b4',
    bg: '#fdf6f8', bgAlt: '#fff8f9', text: '#4a2c35', muted: 'rgba(74,44,53,0.55)',
    card: '#ffffff', border: 'rgba(201,107,138,0.15)',
    headingFont: 'Cormorant Garamond', bodyFont: 'Nunito', borderRadius: '20px', btnStyle: 'gradient',
  },
  'minimal': {
    primary: '#c96b8a', secondary: '#fff0f5', accent: '#e8a0b4',
    bg: '#fdf6f8', bgAlt: '#fff8f9', text: '#4a2c35', muted: 'rgba(74,44,53,0.55)',
    card: '#ffffff', border: 'rgba(201,107,138,0.15)',
    headingFont: 'Cormorant Garamond', bodyFont: 'Nunito', borderRadius: '20px', btnStyle: 'gradient',
  },
};

/** Auto-select template from niche string */
export function getTemplateForNiche(niche: string): string {
  const n = niche.toLowerCase();
  // Beauty / skincare
  if (/skincare|beauty|makeup|cosmetic|serum|moistur|lip|brow|lash|perfume|fragrance|nail|hair.*care|face|glow/.test(n)) return 'bloom-beauty';
  // Tech / gadgets
  if (/tech|gadget|electronic|phone|laptop|gaming|drone|camera|smart|led|light|ring light|wearable|earbuds|bluetooth|wifi|usb/.test(n)) return 'tech-mono';
  // Luxury / premium
  if (/watch|jewel|luxury|premium|gold|diamond|leather|silk|cashmere|designer|brand/.test(n)) return 'premium-brand';
  // Coastal / outdoor / lifestyle / pets
  if (/coastal|beach|surf|swim|outdoor|camping|hiking|travel|yoga|pet|dog|cat|garden|plant|nature|eco|sustainable/.test(n)) return 'coastal-au';
  // Bold / dropship
  if (/deal|discount|bulk|wholesale|general|kitchen|tool|car|auto|baby|kids|toy/.test(n)) return 'dropship-bold';
  // Fitness (dark DTC)
  if (/fit|gym|sport|supplement|protein|creatine|workout|exercise|muscle|weight|run|cycling/.test(n)) return 'dtc-minimal';
  // Default
  return 'dtc-minimal';
}

export function getPalette(template: string): TemplatePalette {
  return TEMPLATE_PALETTES[template.toLowerCase()] ?? TEMPLATE_PALETTES['default'];
}
