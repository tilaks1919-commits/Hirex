import { ROLES, STORAGE_KEYS } from '../core/constants.js';
import { nowIso, uid } from '../core/utils.js';

const defaultDatabase = () => ({
  meta: {
    createdAt: nowIso(),
    version: 1,
  },
  users: [],
  providerProfiles: [],
});

export const loadDatabase = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.DATABASE);
  if (!raw) {
    const db = defaultDatabase();
    persistDatabase(db);
    return db;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultDatabase(),
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      providerProfiles: Array.isArray(parsed.providerProfiles) ? parsed.providerProfiles : [],
    };
  } catch {
    const db = defaultDatabase();
    persistDatabase(db);
    return db;
  }
};

export const persistDatabase = (database) => {
  localStorage.setItem(STORAGE_KEYS.DATABASE, JSON.stringify(database));
};

export const createUserRecord = ({ email, password, role }) => ({
  id: uid(),
  email,
  password,
  role,
  providerProfileCompleted: role !== ROLES.PROVIDER,
  createdAt: nowIso(),
});

export const createProviderProfileRecord = (payload) => ({
  id: uid(),
  userId: payload.userId,
  fullName: payload.fullName,
  profileImageName: payload.profileImageName,
  gpsLocation: payload.gpsLocation,
  manualLocation: payload.manualLocation,
  serviceCategories: payload.serviceCategories,
  experienceYears: Number(payload.experienceYears),
  hourlyRate: Number(payload.hourlyRate),
  phoneNumber: payload.phoneNumber,
  description: payload.description,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});
