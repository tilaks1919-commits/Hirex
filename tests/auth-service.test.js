import test from 'node:test';
import assert from 'node:assert/strict';

import { ROLES, STORAGE_KEYS } from '../src/core/constants.js';

const localStorageMock = () => {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
  };
};

global.localStorage = localStorageMock();

const { authService, sessionService } = await import('../src/features/auth/auth-service.js');
const { apiService } = await import('../src/features/dashboard/api-service.js');

const reset = () => {
  localStorage.clear();
  sessionService.clearSession();
  sessionService.clearPendingRole();
  localStorage.removeItem(STORAGE_KEYS.DATABASE);
};

test('one-time admin signup is enforced and hidden logically', () => {
  reset();
  assert.equal(authService.adminExists(), false);
  authService.createAdmin({ email: 'admin@hirex.com', password: 'secret1' });
  assert.equal(authService.adminExists(), true);
  assert.throws(() => authService.createAdmin({ email: 'other@hirex.com', password: 'secret1' }), /already exists/);
  const stats = apiService.getAdminPanelStats();
  assert.equal(stats.hasAdmin, true);
});

test('provider profile completion is required before provider access completes', () => {
  reset();
  authService.setRoleContext(ROLES.PROVIDER);
  const session = authService.signup({ email: 'pro@hirex.com', password: 'secret1', role: ROLES.PROVIDER });
  assert.equal(session.role, ROLES.PROVIDER);
  const setupStatus = apiService.getProviderSetupStatus();
  assert.equal(setupStatus.profileCompleted, false);
  authService.completeProviderProfile({
    fullName: 'Provider One',
    profileImageName: 'provider.png',
    gpsLocation: '1,2',
    manualLocation: 'Austin, TX',
    serviceCategories: ['Electrical'],
    experienceYears: 4,
    hourlyRate: 55,
    phoneNumber: '+1-555-1234',
    description: 'Experienced electrician.',
  });
  const setupStatusAfter = apiService.getProviderSetupStatus();
  assert.equal(setupStatusAfter.profileCompleted, true);
  assert.deepEqual(setupStatusAfter.profile.serviceCategories, ['Electrical']);
});

test('role-based access control blocks cross-access', () => {
  reset();
  authService.signup({ email: 'user@hirex.com', password: 'secret1', role: ROLES.USER });
  assert.doesNotThrow(() => apiService.getUserHome());
  assert.throws(() => apiService.getAdminPanelStats(), /Forbidden/);
  authService.logout();
  authService.signup({ email: 'provider@hirex.com', password: 'secret1', role: ROLES.PROVIDER });
  assert.throws(() => apiService.getUserHome(), /Forbidden/);
});
