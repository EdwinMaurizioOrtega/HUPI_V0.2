import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiPagesLogo } from '@/components/HupiPagesLogo';
import { IconButton } from '@/components/IconButton';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getActiveOrderedContent, visualContentConfig } from '@/constants/contentConfig';
import { fonts } from '@/constants/typography';
import { mockNotifications } from '@/constants/mockData';
import { PromoCarousel } from '@/features/home/PromoCarousel';
import { ServiceForm } from '@/features/home/ServiceForm';
import { Pressable, Text } from '@/i18n/components';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useTranslation } from '../../../node_modules/react-i18next';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { profile } = useLocalAccount();
  const unread = mockNotifications.filter((notification) => !notification.read).length;
  const marketplaceHomeBanner = getActiveOrderedContent(visualContentConfig.marketplaceBanners)[0];

  return (
    <ScreenContainer avoidFloatingTabBar contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="__hupi_i18n:common.openProfile" onPress={() => router.push('/profile')}>
          <ProfileAvatar size={44} style={styles.avatar} type="owner" uri={profile.profilePhotoUri}>
            <View style={styles.onlineDot} />
          </ProfileAvatar>
        </Pressable>
        <HupiPagesLogo height={44} style={styles.logo} width={136} />
        <NotificationBell count={unread} onPress={() => router.push('/marketplace/notifications')} />
      </View>

      <View style={styles.welcomeRow}>
        <View style={styles.welcomeCopy}>
          <Text style={styles.greeting}>{t('home.greeting', { name: profile.firstName })}</Text>
          <Text style={styles.question}>__hupi_i18n:home.home.whatDoesYourBestFriendNeedToday</Text>
        </View>
        <IconButton
          accessibilityLabel="__hupi_i18n:common.providerMode"
          backgroundColor={colors.secondarySoft}
          icon="briefcase-outline"
          iconColor={colors.secondary}
          iconSize={19}
          onPress={() => router.push('/provider')}
          size={42}
        />
      </View>

      <Pressable onPress={() => router.push('/client/addresses')} style={styles.locationPill}>
        <Ionicons color={colors.primary} name="location" size={15} />
        <Text style={styles.location}>{[profile.sector, profile.city].filter(Boolean).join(', ') || t('profile.addresses')}</Text>
        <Text style={styles.locationAction}>__hupi_i18n:common.change</Text>
      </Pressable>

      <View style={styles.bookingSection}>
        <ServiceForm serviceId="walk" />
      </View>

      <PromoCarousel />

      <Card style={styles.marketplaceBanner} tone="soft">
        <View style={styles.marketplaceDecorLarge} />
        <View style={styles.marketplaceDecorSmall} />
        <View style={styles.marketplaceTop}>
          <View style={styles.marketplaceIcon}>
            <Ionicons color={colors.white} name="bag-handle" size={24} />
          </View>
          <View style={styles.marketplaceTopCopy}>
            <Text style={styles.marketplaceTag}>__hupi_i18n:common.hupiSelection</Text>
            <Text style={styles.marketplaceMiniCopy}>{marketplaceHomeBanner?.eyebrow ?? 'Bienestar, juego y cuidado diario'}</Text>
          </View>
        </View>
        <Text style={styles.marketplaceTitle}>{marketplaceHomeBanner?.title ?? 'Marketplace pet'}</Text>
        <Text style={styles.marketplaceCopy}>
          {marketplaceHomeBanner?.subtitle ?? 'Todo lo que tu mascota necesita, en un solo lugar.'}
        </Text>
        <Button
          icon="arrow-forward"
          onPress={() => router.push('/marketplace')}
          style={styles.marketplaceButton}
          title={marketplaceHomeBanner?.ctaText ?? 'Ir al marketplace'}
          variant="secondary"
        />
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.secondarySoft,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 1,
    bottom: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  logo: {
    position: 'absolute',
    left: '50%',
    marginLeft: -68,
  },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 26 },
  welcomeCopy: { flex: 1, minWidth: 0 },
  greeting: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  question: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 21, marginTop: 5 },
  locationPill: {
    minHeight: 42,
    borderRadius: 15,
    backgroundColor: colors.soft,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    marginTop: 20,
    gap: 7,
  },
  location: { flex: 1, color: colors.text, flexShrink: 1, fontFamily: fonts.medium, fontSize: 13, fontWeight: '700', lineHeight: 18 },
  locationAction: { color: colors.primary, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  bookingSection: { marginTop: 22 },
  marketplaceBanner: {
    marginTop: 20,
    padding: 20,
    overflow: 'hidden',
    borderColor: '#e6ddc7',
    shadowOpacity: 0,
  },
  marketplaceTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marketplaceTopCopy: { flex: 1, minWidth: 0 },
  marketplaceIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketplaceTag: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  marketplaceMiniCopy: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, marginTop: 3 },
  marketplaceTitle: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 23, fontWeight: '900', lineHeight: 29, marginTop: 18 },
  marketplaceCopy: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, marginTop: 6, maxWidth: 280 },
  marketplaceButton: { alignSelf: 'flex-start', minHeight: 46, marginTop: 17 },
  marketplaceDecorLarge: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.secondarySoft,
    right: -52,
    top: -48,
  },
  marketplaceDecorSmall: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primarySoft,
    right: 28,
    bottom: 22,
  },
});
