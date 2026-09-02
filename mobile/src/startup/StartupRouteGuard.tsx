import {
  usePathname,
  useRootNavigationState,
  useRouter,
} from 'expo-router';
import {
  useEffect,
  useRef,
  type PropsWithChildren,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { visualContentConfig } from '@/constants/contentConfig';
import { resolveStartupRedirect, startupPaths } from '@/domain/startup';
import { useStartup } from './StartupProvider';

type StartupRouteGuardProps = PropsWithChildren<{
  onDestinationReady?: () => void;
}>;

export function StartupRouteGuard({
  children,
  onDestinationReady,
}: StartupRouteGuardProps) {
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const router = useRouter();
  const { t } = useTranslation();
  const { destination, state, visualSplashVisible } = useStartup();
  const redirectTarget = resolveStartupRedirect(destination, pathname);
  const allowed = redirectTarget === null;
  const routerReady = Boolean(navigationState?.key);
  const lastRedirectRef = useRef<string | null>(null);
  const lastDecisionLogRef = useRef<string | null>(null);

  useEffect(() => {
    if (routerReady && allowed) {
      onDestinationReady?.();
    }
  }, [allowed, onDestinationReady, routerReady]);

  useEffect(() => {
    const target = startupPaths[destination];
    const decisionKey = [
      pathname,
      target,
      state.hasCompletedOnboarding,
      state.hasAuthenticatedSession,
      state.hasVerifiedPhone,
      state.hasCompletedProfile,
    ].join('|');

    if (__DEV__ && lastDecisionLogRef.current !== decisionKey) {
      lastDecisionLogRef.current = decisionKey;
      console.info('[startup] route decision', {
        currentPath: pathname,
        destinationRoute: target,
        finalDestination: target,
        onboardingRouteSelected: target === '/welcome',
        onboardingCompleted: state.hasCompletedOnboarding,
        sessionExists: state.hasAuthenticatedSession,
        phoneVerified: state.hasVerifiedPhone,
        profileCompleted: state.hasCompletedProfile,
        navigationPerformed: routerReady
          && !allowed
          && pathname !== target,
      });
    }

    if (!redirectTarget) {
      lastRedirectRef.current = null;
      return;
    }
    if (!routerReady) return;

    const redirectKey = `${pathname}->${redirectTarget}`;
    if (lastRedirectRef.current === redirectKey) return;
    lastRedirectRef.current = redirectKey;
    router.replace(redirectTarget as never);
  }, [
    allowed,
    destination,
    pathname,
    redirectTarget,
    router,
    routerReady,
    state.hasAuthenticatedSession,
    state.hasCompletedOnboarding,
    state.hasCompletedProfile,
    state.hasVerifiedPhone,
  ]);

  return (
    <View style={styles.shell}>
      {children}
      {!allowed && !visualSplashVisible ? (
        <View
          accessibilityLabel={t('common.loading')}
          accessibilityRole="progressbar"
          style={styles.loading}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: visualContentConfig.splash.backgroundColor,
    zIndex: 100,
  },
});
