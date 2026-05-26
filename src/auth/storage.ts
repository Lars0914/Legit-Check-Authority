import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "ticker_auth_token";
const USER_KEY = "ticker_auth_user";

export interface StoredUser {
  id: number;
  mail: string;
}

/** Used when the native AsyncStorage module is not linked (rebuild required). */
const memory = new Map<string, string>();
let useMemory = false;
let storageChecked = false;

async function ensureStorage(): Promise<void> {
  if (storageChecked) return;
  storageChecked = true;
  try {
    await AsyncStorage.getItem("__ticker_storage_probe__");
    useMemory = false;
  } catch {
    useMemory = true;
    if (__DEV__) {
      console.warn(
        "AsyncStorage native module unavailable — using in-memory session. " +
          "Rebuild the app: cd mobile && npm run android",
      );
    }
  }
}

async function getItem(key: string): Promise<string | null> {
  await ensureStorage();
  if (useMemory) return memory.get(key) ?? null;
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    useMemory = true;
    return memory.get(key) ?? null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  await ensureStorage();
  if (useMemory) {
    memory.set(key, value);
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    useMemory = true;
    memory.set(key, value);
  }
}

async function removeItem(key: string): Promise<void> {
  await ensureStorage();
  if (useMemory) {
    memory.delete(key);
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    useMemory = true;
    memory.delete(key);
  }
}

export async function loadSession(): Promise<{
  token: string;
  user: StoredUser;
} | null> {
  try {
    const [token, userJson] = await Promise.all([
      getItem(TOKEN_KEY),
      getItem(USER_KEY),
    ]);
    if (!token || !userJson) return null;
    const user = JSON.parse(userJson) as StoredUser;
    if (!user?.id || !user?.mail) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export async function saveSession(
  token: string,
  user: StoredUser,
): Promise<void> {
  await Promise.all([
    setItem(TOKEN_KEY, token),
    setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearSession(): Promise<void> {
  await Promise.all([removeItem(TOKEN_KEY), removeItem(USER_KEY)]);
}
