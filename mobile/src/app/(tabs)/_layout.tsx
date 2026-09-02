import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import {
  StyleSheet,
  View as NativeView,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MIN_BOTTOM_INSET,
  FLOATING_TAB_BAR_TOP_GAP,
} from '@/constants/navigationLayout';
import { fonts } from '@/constants/typography';
import { Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

const DARK_TAB_BAR_SURFACE = '#5b2a22';
const DARK_TAB_ACTIVE_SURFACE = '#fff8f5';
const DARK_TAB_ACTIVE_FOREGROUND = '#8c2f20';
const DARK_TAB_INACTIVE_FOREGROUND = 'rgba(255, 245, 242, 0.72)';

const icons = {
  home: ['home', 'home-outline'],
  bookings: ['calendar', 'calendar-outline'],
  marketplace: ['bag-handle', 'bag-handle-outline'],
  profile: ['person', 'person-outline'],
  support: ['chatbubbles', 'chatbubbles-outline'],
} as const;

const labelKeys = {
  home: 'navigation.home',
  bookings: 'navigation.bookings',
  marketplace: 'navigation.marketplace',
  profile: 'navigation.profile',
  support: 'navigation.chat',
} as const;

function HupiTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { resolvedTheme, tokens } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const compact = width < 375;
  const safeBottom = Math.max(insets.bottom, FLOATING_TAB_BAR_MIN_BOTTOM_INSET);
  const translucentBar = darkMode
    ? DARK_TAB_BAR_SURFACE
    : 'rgba(255, 255, 255, 0.94)';
  const activeSurface = darkMode
    ? DARK_TAB_ACTIVE_SURFACE
    : 'rgba(255, 255, 255, 0.72)';
  const activeForeground = darkMode ? DARK_TAB_ACTIVE_FOREGROUND : tokens.primary;
  const inactiveForeground = darkMode ? DARK_TAB_INACTIVE_FOREGROUND : tokens.textMuted;

  return (
    <NativeView
      pointerEvents="box-none"
      style={[
        styles.tabSafeArea,
        compact && styles.tabSafeAreaCompact,
        {
          backgroundColor: 'transparent',
          height: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_TOP_GAP + safeBottom,
          paddingBottom: safeBottom,
        },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          compact && styles.tabBarCompact,
          {
            backgroundColor: translucentBar,
            borderColor: darkMode
              ? 'rgba(255, 187, 168, 0.30)'
              : 'rgba(79, 67, 61, 0.16)',
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const names = icons[route.name as keyof typeof icons];
          const labelKey = labelKeys[route.name as keyof typeof labelKeys];
          const label = labelKey ? t(labelKey) : descriptors[route.key]?.options.title ?? route.name;

          const onPress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: 'tabPress',
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              accessibilityLabel={label}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabItem,
                focused && { backgroundColor: activeSurface },
                pressed && styles.tabItemPressed,
              ]}
            >
              <View
                style={[
                  styles.iconPill,
                  focused && {
                    backgroundColor: darkMode
                      ? 'rgba(228, 83, 54, 0.14)'
                      : tokens.primarySoft,
                  },
                ]}
              >
                <Ionicons
                  color={focused ? activeForeground : inactiveForeground}
                  name={(focused ? names?.[0] : names?.[1]) ?? 'ellipse-outline'}
                  size={20}
                />
              </View>
              <Text
                maxFontSizeMultiplier={1.2}
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  compact && styles.tabLabelCompact,
                  { color: focused ? activeForeground : inactiveForeground },
                  focused && styles.tabLabelActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </NativeView>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <Tabs
      initialRouteName="home"
      tabBar={(props) => <HupiTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="home" options={{ title: t('navigation.home') }} />
      <Tabs.Screen name="bookings" options={{ title: t('navigation.bookings') }} />
      <Tabs.Screen
        name="marketplace"
        options={{
          sceneStyle: { backgroundColor: tokens.background },
          title: t('navigation.marketplace'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          sceneStyle: { backgroundColor: tokens.background },
          title: t('navigation.profile'),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          sceneStyle: { backgroundColor: tokens.background },
          title: t('navigation.chat'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabSafeArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    paddingHorizontal: 18,
    paddingTop: FLOATING_TAB_BAR_TOP_GAP,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
  },
  tabSafeAreaCompact: { paddingHorizontal: 8 },
  tabBar: {
    width: '100%',
    maxWidth: 390,
    height: FLOATING_TAB_BAR_HEIGHT,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    paddingBottom: 7,
    paddingTop: 7,
    overflow: 'visible',
    shadowColor: '#1b1412',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 10,
  },
  tabBarCompact: { borderRadius: 21, paddingHorizontal: 3 },
  tabItem: {
    flex: 1,
    minWidth: 0,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 2,
  },
  tabItemPressed: { opacity: 0.82 },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    color: '#8f8a86',
    fontFamily: fonts.semiBold,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 20,
    paddingBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  tabLabelCompact: { fontSize: 10, lineHeight: 17 },
  tabLabelActive: {
    color: colors.primary,
    fontFamily: fonts.bold,
    fontSize: 11,
    fontWeight: '900',
  },
});
