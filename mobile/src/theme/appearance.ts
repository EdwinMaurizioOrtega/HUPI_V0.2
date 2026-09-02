export const APPEARANCE_STORAGE_KEY = 'hupi.appearance';

export const appearancePreferences = ['system', 'light', 'dark'] as const;

export type AppearancePreference = (typeof appearancePreferences)[number];
export type ResolvedTheme = Exclude<AppearancePreference, 'system'>;

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  return typeof value === 'string'
    && appearancePreferences.includes(value as AppearancePreference);
}

export function resolveAppearance(
  preference: AppearancePreference,
  deviceColorScheme: 'light' | 'dark' | null | undefined,
): ResolvedTheme {
  if (preference !== 'system') {
    return preference;
  }
  return deviceColorScheme === 'dark' ? 'dark' : 'light';
}

export async function readAppearancePreference(
  read: (key: string) => Promise<string | null>,
): Promise<AppearancePreference> {
  const stored = await read(APPEARANCE_STORAGE_KEY);
  return isAppearancePreference(stored) ? stored : 'system';
}

export async function writeAppearancePreference(
  appearance: AppearancePreference,
  write: (key: string, value: string) => Promise<void>,
) {
  await write(APPEARANCE_STORAGE_KEY, appearance);
}
