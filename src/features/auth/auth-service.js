import { ROLES, STORAGE_KEYS } from '../../core/constants.js';
import { normalizeEmail, isEmail, isStrongEnoughPassword } from '../../core/utils.js';
import { providerRepository, userRepository } from '../../data/repositories.js';

export const sessionService = {
  getPendingRole() {
    return localStorage.getItem(STORAGE_KEYS.PENDING_ROLE) || ROLES.USER;
  },
  setPendingRole(role) {
    localStorage.setItem(STORAGE_KEYS.PENDING_ROLE, role);
  },
  clearPendingRole() {
    localStorage.removeItem(STORAGE_KEYS.PENDING_ROLE);
  },
  getSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  },
  setSession(session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },
};

const validateCredentials = ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!isEmail(normalizedEmail)) {
    throw new Error('Please enter a valid email address.');
  }
  if (!isStrongEnoughPassword(password)) {
    throw new Error('Password must be at least 6 characters long.');
  }
  return { normalizedEmail, password: String(password) };
};

export const authService = {
  getRoleContext() {
    return sessionService.getPendingRole();
  },
  setRoleContext(role) {
    sessionService.setPendingRole(role);
  },
  adminExists() {
    return userRepository.adminExists();
  },
  signup({ email, password, role }) {
    const { normalizedEmail, password: safePassword } = validateCredentials({ email, password });
    if (role === ROLES.ADMIN) {
      throw new Error('Admin signup is only available through the dedicated one-time flow.');
    }
    if (userRepository.getByEmail(normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }
    const user = userRepository.create({ email: normalizedEmail, password: safePassword, role });
    const session = { userId: user.id, role: user.role };
    sessionService.setSession(session);
    return session;
  },
  login({ email, password, expectedRole }) {
    const normalizedEmail = normalizeEmail(email);
    const user = userRepository.getByEmail(normalizedEmail);
    if (!user || user.password !== String(password)) {
      throw new Error('Invalid email or password.');
    }
    if (user.role !== ROLES.ADMIN && expectedRole && user.role !== expectedRole) {
      throw new Error(`This account belongs to ${user.role.toLowerCase().replace('_', ' ')} access.`);
    }
    const session = { userId: user.id, role: user.role };
    sessionService.setSession(session);
    return session;
  },
  createAdmin({ email, password }) {
    const { normalizedEmail, password: safePassword } = validateCredentials({ email, password });
    if (userRepository.adminExists()) {
      throw new Error('Admin account already exists.');
    }
    if (userRepository.getByEmail(normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }
    const user = userRepository.create({ email: normalizedEmail, password: safePassword, role: ROLES.ADMIN });
    const session = { userId: user.id, role: user.role };
    sessionService.setSession(session);
    return session;
  },
  logout() {
    sessionService.clearSession();
    sessionService.clearPendingRole();
  },
  getCurrentUser() {
    const session = sessionService.getSession();
    return session ? userRepository.getById(session.userId) : null;
  },
  completeProviderProfile(profilePayload) {
    const session = sessionService.getSession();
    if (!session || session.role !== ROLES.PROVIDER) {
      throw new Error('Only providers can complete the provider profile.');
    }
    providerRepository.upsert({ ...profilePayload, userId: session.userId });
    userRepository.update(session.userId, { providerProfileCompleted: true });
  },
};
