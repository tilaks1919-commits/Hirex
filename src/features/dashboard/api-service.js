import { ROLES } from '../../core/constants.js';
import { authService } from '../auth/auth-service.js';
import { providerRepository, userRepository } from '../../data/repositories.js';

const ensureRole = (allowedRoles) => {
  const user = authService.getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: role validation failed.');
  }
  return user;
};

export const apiService = {
  getUserHome() {
    const user = ensureRole([ROLES.USER]);
    return {
      greeting: `Welcome back, ${user.email}`,
      nearbyCategories: ['Plumbers', 'Electricians', 'Mechanics', 'Technicians'],
      futureModules: ['Job Matching', 'Payments', 'Tracking', 'Chat', 'Analytics'],
    };
  },
  getProviderSetupStatus() {
    const provider = ensureRole([ROLES.PROVIDER]);
    return {
      profileCompleted: provider.providerProfileCompleted,
      profile: providerRepository.getByUserId(provider.id),
    };
  },
  getAdminPanelStats() {
    ensureRole([ROLES.ADMIN]);
    const users = userRepository.getAll();
    return {
      totalUsers: users.filter((user) => user.role === ROLES.USER).length,
      totalProviders: users.filter((user) => user.role === ROLES.PROVIDER).length,
      hasAdmin: users.some((user) => user.role === ROLES.ADMIN),
      launchModules: ['Moderation', 'Access Policies', 'Operational Analytics'],
    };
  },
};
