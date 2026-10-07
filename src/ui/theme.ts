export const C = {
  bg: '#070A11',
  s1: '#0D1321',
  s2: '#131B2D',
  s3: '#1B2640',
  line: 'rgba(255,255,255,0.07)',
  text: '#F3F6FB',
  mute: '#8E99B0',
  dim: '#5E6A82',
  acc: '#22D3EE',
  acc2: '#67E8F9',
  accDark: '#0891B2',
  onAcc: '#021E26',
  blue: '#60A5FA',
  violet: '#A78BFA',
  amber: '#FBBF24',
  rose: '#FB7185',
  orange: '#FB923C',
};

export const GRAD = ['#67E8F9', '#0891B2'] as const;
export const GRAD_DANGER = ['#FB7185', '#E11D48'] as const;

export const alpha = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const money = (n: number | string | null | undefined, abs = false) => {
  const v = Number(n || 0);
  const x = abs ? Math.abs(v) : v;
  return `Rs ${x.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const num = (n: number | string | null | undefined) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const categoryIcon = (name?: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('food') || n.includes('khana') || n.includes('grocer')) return 'restaurant-outline';
  if (n.includes('petrol') || n.includes('fuel') || n.includes('transport') || n.includes('car')) return 'car-outline';
  if (n.includes('purchase') || n.includes('shop')) return 'bag-outline';
  if (n.includes('indoor') || n.includes('home') || n.includes('rent')) return 'bed-outline';
  if (n.includes('tour') || n.includes('travel')) return 'airplane-outline';
  if (n.includes('salary') || n.includes('income')) return 'cash-outline';
  if (n.includes('util') || n.includes('bill')) return 'flash-outline';
  if (n.includes('entertain') || n.includes('game')) return 'game-controller-outline';
  return 'card-outline';
};
