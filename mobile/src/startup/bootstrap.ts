export const STORAGE_READ_TIMEOUT_MS = 3_000;
export const STARTUP_SAFETY_TIMEOUT_MS = 8_000;

export class StartupTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartupTimeoutError';
  }
}

export function withStartupTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new StartupTimeoutError(message));
    }, timeoutMs);

    task.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export type StartupMilestone =
  | 'fontsLoaded'
  | 'preferencesHydrated'
  | 'onboardingResolved'
  | 'sessionResolved'
  | 'profileResolved'
  | 'splashHidden'
  | 'destinationRoute';

export function logStartupMilestone(
  milestone: StartupMilestone,
  value: boolean | string,
) {
  if (__DEV__) {
    console.info(`[startup] ${milestone}:`, value);
  }
}
