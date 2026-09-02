import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Appearance,
  Platform,
  useColorScheme,
} from 'react-native';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  readAppearancePreference,
  resolveAppearance,
  writeAppearancePreference,
  type AppearancePreference,
  type ResolvedTheme,
} from './appearance';
import { darkTheme, lightTheme, type ThemeTokens } from './tokens';
import { syncPreferences } from '@/data/remoteWrites';
import {
  STORAGE_READ_TIMEOUT_MS,
  withStartupTimeout,
} from '@/startup/bootstrap';

type ThemeContextValue = {
  appearance: AppearancePreference;
  isDark: boolean;
  ready: boolean;
  resolvedTheme: ResolvedTheme;
  setAppearance: (appearance: AppearancePreference) => Promise<void>;
  tokens: ThemeTokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export async function loadAppearancePreference(
  read: (key: string) => Promise<string | null> = AsyncStorage.getItem,
) {
  try {
    return await withStartupTimeout(
      readAppearancePreference(read),
      STORAGE_READ_TIMEOUT_MS,
      'Appearance hydration timed out.',
    );
  } catch (error) {
    if (__DEV__) {
      console.warn('[appearance] No se pudo restaurar la apariencia; se usará system.', error);
    }
    return 'system' as const;
  }
}

export async function saveAppearancePreference(
  appearance: AppearancePreference,
  write: (key: string, value: string) => Promise<void> = AsyncStorage.setItem,
) {
  await writeAppearancePreference(appearance, write);
}

type ThemeProviderProps = PropsWithChildren<{
  initialAppearance?: AppearancePreference;
}>;

export function ThemeProvider({ children, initialAppearance }: ThemeProviderProps) {
  const deviceColorScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePreference>(
    initialAppearance ?? 'system',
  );
  const [ready, setReady] = useState(initialAppearance !== undefined);

  useEffect(() => {
    if (initialAppearance !== undefined) {
      setAppearanceState(initialAppearance);
      setReady(true);
      return undefined;
    }

    let mounted = true;
    loadAppearancePreference()
      .then((storedAppearance) => {
        if (mounted) {
          setAppearanceState(storedAppearance);
        }
      })
      .catch(() => {
        if (mounted) {
          setAppearanceState('system');
        }
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [initialAppearance]);

  useEffect(() => {
    if (!ready) return;

    const canSetNativeColorScheme = Platform.OS !== 'web'
      && typeof Appearance.setColorScheme === 'function';
    if (canSetNativeColorScheme) {
      Appearance.setColorScheme(appearance === 'system' ? null : appearance);
    }
  }, [appearance, ready]);

  const resolvedTheme = resolveAppearance(appearance, deviceColorScheme);

  useEffect(() => {
    if (!ready || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [ready, resolvedTheme]);

  const setAppearance = useCallback(async (nextAppearance: AppearancePreference) => {
    if (nextAppearance === appearance) return;
    setAppearanceState(nextAppearance);
    syncPreferences({ appearance: nextAppearance });
    try {
      await saveAppearancePreference(nextAppearance);
    } catch {
      // La apariencia se conserva en memoria aunque el almacenamiento local no esté disponible.
    }
  }, [appearance]);

  const value = useMemo<ThemeContextValue>(() => ({
    appearance,
    isDark: resolvedTheme === 'dark',
    ready,
    resolvedTheme,
    setAppearance,
    tokens: resolvedTheme === 'dark' ? darkTheme : lightTheme,
  }), [appearance, ready, resolvedTheme, setAppearance]);

  if (!ready) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return context;
}
