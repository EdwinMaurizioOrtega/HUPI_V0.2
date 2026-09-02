import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'hupi.auth.token';

/**
 * SecureStore no existe en web; allí se degrada a sessionStorage, que al menos
 * no sobrevive al cierre de la pestaña. AsyncStorage no se usa: no está cifrado.
 */
const isWeb = Platform.OS === 'web';

let cachedToken: string | null = null;

export async function loadAuthToken(): Promise<string | null> {
  if (cachedToken !== null) return cachedToken;

  try {
    const stored = isWeb
      ? globalThis.sessionStorage?.getItem(TOKEN_KEY) ?? null
      : await SecureStore.getItemAsync(TOKEN_KEY);
    cachedToken = stored;
    return stored;
  } catch {
    return null;
  }
}

export async function saveAuthToken(token: string): Promise<void> {
  cachedToken = token;
  try {
    if (isWeb) {
      globalThis.sessionStorage?.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Sin almacenamiento persistente la sesión dura lo que dure el proceso.
  }
}

export async function clearAuthToken(): Promise<void> {
  cachedToken = null;
  try {
    if (isWeb) {
      globalThis.sessionStorage?.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nada que limpiar.
  }
}
