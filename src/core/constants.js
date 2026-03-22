export const ROLES = Object.freeze({
  USER: 'USER',
  PROVIDER: 'PROVIDER',
  ADMIN: 'ADMIN',
});

export const ROUTES = Object.freeze({
  ROLE_SELECTION: 'role-selection',
  AUTH: 'auth',
  ADMIN_SIGNUP: 'admin-signup',
  USER_HOME: 'user-home',
  PROVIDER_SETUP: 'provider-setup',
  PROVIDER_HOLDING: 'provider-holding',
  ADMIN_PANEL: 'admin-panel',
});

export const STORAGE_KEYS = Object.freeze({
  DATABASE: 'hirex.database',
  PENDING_ROLE: 'hirex.pendingRole',
  SESSION: 'hirex.session',
});

export const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Mechanical',
  'Home Appliance Repair',
  'Technician Visit',
  'AC Service',
  'Cleaning',
  'Carpentry',
];
