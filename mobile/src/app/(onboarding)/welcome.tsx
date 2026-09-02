import { ThemedView as View } from '@/theme/ThemedView';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/colors';
import { visualContentConfig } from '@/constants/contentConfig';
import {
  ONBOARDING_SLIDES,
  type NativeOnboardingSlide,
} from '@/constants/onboardingSlides';
import { AppText, Pressable } from '@/i18n/components';
import { useStartup } from '@/startup/StartupProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { completeOnboarding, qaOnboardingEnabled } = useStartup();
  const { width: windowWidth } = useWindowDimensions();
  const carouselRef = useRef<FlatList<NativeOnboardingSlide>>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselWidth = windowWidth;
  const activeSlide = ONBOARDING_SLIDES[slideIndex] ?? ONBOARDING_SLIDES[0];
  const isLastSlide = slideIndex === ONBOARDING_SLIDES.length - 1;

  const finish = () => {
    completeOnboarding();
  };

  useEffect(() => {
    if (!__DEV__) return;
    console.info('[startup] onboarding slide', {
      platform: Platform.OS,
      qaOnboardingEnabled,
      onboardingSlideRendered: slideIndex + 1,
    });
  }, [qaOnboardingEnabled, slideIndex]);

  const goToNextSlide = useCallback(() => {
    const nextIndex = Math.min(slideIndex + 1, ONBOARDING_SLIDES.length - 1);
    carouselRef.current?.scrollToIndex({ animated: true, index: nextIndex });
    setSlideIndex(nextIndex);
  }, [slideIndex]);

  const handleScrollEnd = useCallback((
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    if (carouselWidth <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / carouselWidth);
    setSlideIndex(Math.min(Math.max(nextIndex, 0), ONBOARDING_SLIDES.length - 1));
  }, [carouselWidth]);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: activeSlide.backgroundColor,
        },
      ]}
    >
      <FlatList
        contentContainerStyle={styles.carouselContent}
        data={ONBOARDING_SLIDES}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: carouselWidth,
          offset: carouselWidth * index,
        })}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleScrollEnd}
        pagingEnabled
        ref={carouselRef}
        renderItem={({ item }) => (
          <View
            style={[
              styles.slide,
              {
                backgroundColor: item.backgroundColor,
                width: carouselWidth,
              },
            ]}
          >
            <Image
              accessibilityLabel={item.title}
              accessibilityRole="image"
              resizeMode="cover"
              source={item.image}
              style={styles.slideImage}
            />
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        snapToInterval={carouselWidth}
        style={styles.carousel}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.overlay,
          {
            paddingBottom: Math.max(insets.bottom, 22),
            paddingTop: Math.max(insets.top, 18),
          },
        ]}
      >
        <View style={styles.header}>
          <Image
            accessibilityIgnoresInvertColors
            source={visualContentConfig.appBranding.menuLogo}
            style={styles.logo}
          />
        </View>

        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                {
                  backgroundColor: index === slideIndex
                    ? colors.secondary
                    : 'rgba(249,249,226,0.72)',
                },
                index === slideIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityLabel="__hupi_i18n:common.continue"
            accessibilityRole="button"
            onPress={isLastSlide ? finish : goToNextSlide}
            style={[styles.primaryButton, { backgroundColor: tokens.secondary }]}
          >
            <AppText style={styles.primaryButtonText} variant="button">
              __hupi_i18n:common.continue
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  carousel: { ...StyleSheet.absoluteFillObject },
  carouselContent: { flexGrow: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  header: { alignItems: 'center', justifyContent: 'center' },
  logo: { height: 58, resizeMode: 'contain', width: 88 },
  slide: {
    flex: 1,
    minHeight: 0,
  },
  slideImage: { height: '100%', width: '100%' },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 'auto' },
  dot: { borderRadius: 4, height: 8, width: 8 },
  dotActive: { width: 28 },
  actions: { gap: 8, marginTop: 12 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: colors.white, flexShrink: 1, textAlign: 'center' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 18,
  },
  secondaryButtonText: { color: colors.secondary, flexShrink: 1, textAlign: 'center' },
});
