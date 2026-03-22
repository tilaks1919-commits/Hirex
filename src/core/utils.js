export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const nowIso = () => new Date().toISOString();

export const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

export const isEmail = (email) => /\S+@\S+\.\S+/.test(email);

export const isStrongEnoughPassword = (password) => String(password || '').trim().length >= 6;

export const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));
