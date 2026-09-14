import { getStorageAdapter } from './platform.js';

const SESSION_KEY = 'uniwheels_session';

export const readStoredSession = async () => {
  try {
    const raw = await getStorageAdapter().getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const writeStoredSession = async (session) => {
  try {
    await getStorageAdapter().setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
};

export const removeStoredSession = async () => {
  try {
    await getStorageAdapter().removeItem(SESSION_KEY);
  } catch {}
};

export const writeStoredSessionToken = async (nuevoToken) => {
  const sesion = await readStoredSession();
  if (!sesion) return;
  await writeStoredSession({ ...sesion, token: nuevoToken });
};
