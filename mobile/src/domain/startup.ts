export type StartupDestination =
  | 'onboarding'
  | 'auth'
  | 'verify-phone'
  | 'profile-setup'
  | 'app';

export type StartupState = {
  ready: boolean;
  hasCompletedOnboarding: boolean;
  hasAuthenticatedSession: boolean;
  hasVerifiedPhone: boolean;
  hasCompletedProfile: boolean;
  selectedLanguage: 'es' | 'en';
  selectedAppearance: 'system' | 'light' | 'dark';
};

export const startupPaths: Record<StartupDestination, string> = {
  onboarding: '/welcome',
  auth: '/login',
  'verify-phone': '/verify-sms',
  'profile-setup': '/onboarding-profile',
  app: '/home',
};

export function resolveStartupDestination(state: StartupState): StartupDestination {
  // RootLayout does not mount StartupProvider until hydration is settled.
  // Keep a valid, terminal screen as the defensive fallback: `/` must never be
  // a destination because it only delegates this same decision.
  if (!state.ready) return 'onboarding';
  if (!state.hasCompletedOnboarding) return 'onboarding';
  if (!state.hasAuthenticatedSession) return 'auth';
  if (!state.hasVerifiedPhone) return 'verify-phone';
  if (!state.hasCompletedProfile) return 'profile-setup';
  return 'app';
}

export function isPathAllowedForStartup(
  destination: StartupDestination,
  pathname: string,
) {
  if (destination === 'onboarding') return pathname === '/welcome';
  if (destination === 'auth') return pathname === '/login' || pathname === '/register' || pathname === '/access-recovery' || pathname === '/provider-access' || pathname === '/provider-onboarding';
  if (destination === 'verify-phone') return pathname === '/verify-sms' || pathname === '/access-recovery';
  if (destination === 'profile-setup') return pathname === '/onboarding-profile';

  return ![
    '/',
    '/welcome',
    '/login',
    '/register',
    '/access-recovery',
    '/provider-access',
    '/verify-sms',
    '/onboarding-profile',
  ].includes(pathname);
}

export function resolveStartupRedirect(
  destination: StartupDestination,
  pathname: string,
) {
  if (isPathAllowedForStartup(destination, pathname)) return null;

  const target = startupPaths[destination];
  return pathname === target ? null : target;
}
