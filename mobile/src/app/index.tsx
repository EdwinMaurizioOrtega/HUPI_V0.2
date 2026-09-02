import { StyleSheet, View } from 'react-native';

import { visualContentConfig } from '@/constants/contentConfig';

/**
 * The root route is a passive bridge only. StartupRouteGuard is the sole
 * automatic navigation authority and replaces this route with one final
 * destination after hydration.
 */
export default function IndexScreen() {
  return <View style={styles.transition} />;
}

const styles = StyleSheet.create({
  transition: {
    backgroundColor: visualContentConfig.splash.backgroundColor,
    flex: 1,
  },
});
