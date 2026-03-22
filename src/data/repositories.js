import { ROLES } from '../core/constants.js';
import { loadDatabase, persistDatabase, createUserRecord, createProviderProfileRecord } from './database.js';

export const userRepository = {
  getAll() {
    return loadDatabase().users;
  },
  getByEmail(email) {
    return loadDatabase().users.find((user) => user.email === email) || null;
  },
  getById(id) {
    return loadDatabase().users.find((user) => user.id === id) || null;
  },
  create({ email, password, role }) {
    const db = loadDatabase();
    const user = createUserRecord({ email, password, role });
    db.users.push(user);
    persistDatabase(db);
    return user;
  },
  update(userId, changes) {
    const db = loadDatabase();
    db.users = db.users.map((user) => (user.id === userId ? { ...user, ...changes } : user));
    persistDatabase(db);
    return db.users.find((user) => user.id === userId) || null;
  },
  adminExists() {
    return loadDatabase().users.some((user) => user.role === ROLES.ADMIN);
  },
};

export const providerRepository = {
  getByUserId(userId) {
    return loadDatabase().providerProfiles.find((profile) => profile.userId === userId) || null;
  },
  upsert(payload) {
    const db = loadDatabase();
    const existing = db.providerProfiles.find((profile) => profile.userId === payload.userId);
    if (existing) {
      Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
      persistDatabase(db);
      return existing;
    }
    const created = createProviderProfileRecord(payload);
    db.providerProfiles.push(created);
    persistDatabase(db);
    return created;
  },
};
