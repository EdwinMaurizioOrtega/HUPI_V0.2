import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ProfilePhotoPicker } from '@/components/ProfilePhotoPicker';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getCustomerHupiBalance } from '@/constants/marketplaceIssuesState';
import { getMockFavoriteProviderIds, getMockFavoriteProviderLists, getMockPets } from '@/constants/mockData';
import { setLocalLoggedIn } from '@/data/localAccountRepository';
import { saveLocalCustomerProfile } from '@/data/localAccountRepository';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useLocalProvider } from '@/hooks/useLocalProvider';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';

const menuItems = [
  { icon: 'person-outline' as const, label: 'Editar perfil', detail: 'Nombre, teléfono, correo y ubicación', href: '/client/edit-profile' as Href },
  { icon: 'receipt-outline' as const, label: 'Mis compras Marketplace', detail: 'Pedidos, recibos y comprobantes', href: '/marketplace/orders' as Href },
  { icon: 'wallet-outline' as const, label: 'Saldo Hupi', detail: 'Reembolsos y movimientos', href: '/marketplace/wallet' as Href },
  { icon: 'card-outline' as const, label: 'Métodos de pago', detail: 'Tarjetas y método predeterminado', href: '/client/payment-methods' as Href },
  { icon: 'reader-outline' as const, label: 'Datos de facturación', detail: 'Persona natural o jurídica', href: '/client/billing' as Href },
  { icon: 'location-outline' as const, label: 'Direcciones', detail: 'Casa, trabajo y contactos', href: '/client/addresses' as Href },
  { icon: 'help-buoy-outline' as const, label: 'Soporte Hupi', detail: 'Casos, ayuda y chat', href: '/support' as Href },
  { icon: 'document-text-outline' as const, label: 'Políticas y términos', detail: 'Cancelaciones y saldo Hupi', href: '/client/terms' as Href },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacidad y seguridad', detail: 'Control de tu información', href: '/client/privacy' as Href },
];

function formatPetMeta(age: string, weight: string) {
  const ageLabel = age ? `${age} ${age === '1' ? 'año' : 'años'}` : 'Edad pendiente';
  const weightLabel = weight ? `${weight} kg` : 'Peso pendiente';
  return `${ageLabel} · ${weightLabel}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const hupiBalance = getCustomerHupiBalance();
  const { t } = useTranslation();
  const { profile } = useLocalAccount();
  const providerEnrollment = useLocalProvider();
  const hasProviderMode = providerEnrollment.status !== 'not_started';
  const pets = getMockPets();
  const primaryPet = pets[0];
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const favoriteCount = getMockFavoriteProviderIds().length;
  const favoriteListCount = getMockFavoriteProviderLists().length;

  return (
    <ScreenContainer avoidFloatingTabBar>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.mySpace</Text>
          <Text style={styles.title}>__hupi_i18n:common.profile</Text>
        </View>
        <Pressable onPress={() => router.push('/client/settings' as Href)} style={styles.settings}>
          <Ionicons color={colors.text} name="settings-outline" size={22} />
        </Pressable>
      </View>

      <Card style={styles.accountCard}>
        <ProfilePhotoPicker
          compact
          imageUri={profile.profilePhotoUri}
          label="__hupi_i18n:common.photo"
          onChange={(profilePhotoUri) => {
            const nextProfile = { ...profile, profilePhotoUri };
            saveLocalCustomerProfile(nextProfile);
            setPhotoModalVisible(true);
          }}
          size={58}
          type="owner"
        />
        <Pressable onPress={() => router.push('/client/edit-profile' as Href)} style={styles.accountCopy}>
          <Text style={styles.name}>{profile.firstName} {profile.lastName}</Text>
          <Text style={styles.email}>{profile.email}</Text>
          <View style={styles.verifiedRow}>
            <Ionicons color={colors.success} name="checkmark-circle" size={14} />
            <Text style={styles.verified}>__hupi_i18n:app.profile.verifiedPhone</Text>
          </View>
        </Pressable>
        <Pressable onPress={() => router.push('/client/edit-profile' as Href)} style={styles.accountChevron}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={21} />
        </Pressable>
      </Card>

      <Pressable onPress={() => router.push(hasProviderMode ? '/provider' : '/provider-onboarding?existing=1')} style={styles.providerBanner}>
        <View style={styles.providerIcon}>
          <Ionicons color={colors.white} name="briefcase-outline" size={24} />
        </View>
        <View style={styles.providerCopy}>
          <Text style={styles.providerEyebrow}>{hasProviderMode ? t('providerDashboard.mode') : t('providerOnboarding.workQuestion')}</Text>
          <Text style={styles.providerTitle}>{hasProviderMode ? t('providerOnboarding.openProviderMode') : t('providerOnboarding.convertToProvider')}</Text>
        </View>
        <Ionicons color={colors.white} name="arrow-forward" size={21} />
      </Pressable>

      <Pressable onPress={() => router.push('/marketplace/wallet' as Href)}>
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceEyebrow}>__hupi_i18n:common.hupiBalance2</Text>
            <Text
              accessibilityLabel={`${t('generated.common.hupiBalance2')}: $${hupiBalance.available.toFixed(2)}`}
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.3}
              minimumFontScale={0.72}
              numberOfLines={1}
              style={styles.balanceAmount}
            >
              ${hupiBalance.available.toFixed(2)}
            </Text>
          </View>
          <Ionicons color={colors.secondary} name="wallet-outline" size={25} />
        </View>
        <View style={styles.balanceMovements}>
          {hupiBalance.movements.slice(0, 3).map((movement) => (
            <View key={movement.id} style={styles.balanceMovement}>
              <Text style={styles.balanceConcept}>{movement.concept}</Text>
              <Text style={[styles.balanceValue, movement.amount < 0 && styles.balanceDebit]}>
                {movement.amount < 0 ? '-' : '+'}${Math.abs(movement.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
      </Pressable>

      <Text style={styles.sectionTitle}>__hupi_i18n:common.myPets</Text>
      <Card style={styles.petSectionCard} tone="soft">
        {primaryPet ? (
          <Pressable onPress={() => router.push(`/client/pet-detail?petId=${primaryPet.id}` as Href)} style={styles.petSummary}>
            <ProfileAvatar
              size={52}
              style={styles.petAvatar}
              type="pet"
              uri={primaryPet.petPhotoUri}
            />
            <View style={styles.petCopy}>
              <Text style={styles.petName}>{primaryPet.name}</Text>
              <Text style={styles.petMeta}>{primaryPet.breed} · {formatPetMeta(primaryPet.age, primaryPet.weight)}</Text>
              <Text style={styles.petCount}>{pets.length}  __hupi_i18n:common.pet{pets.length === 1 ? '' : 's'}  __hupi_i18n:common.registered{pets.length === 1 ? '' : 's'}</Text>
            </View>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
          </Pressable>
        ) : (
          <View style={styles.emptyPets}>
            <Text style={styles.emptyPetsTitle}>__hupi_i18n:app.profile.youDoNotHaveRegisteredPetsYet</Text>
              <Text style={styles.emptyPetsText}>__hupi_i18n:app.profile.addYourProfileToBookRidesWithBetterContext</Text>
          </View>
        )}
        <View style={styles.petActions}>
          <Pressable onPress={() => router.push('/client/pets' as Href)} style={styles.petActionButton}>
            <Ionicons color={colors.secondary} name="paw-outline" size={16} />
            <Text style={styles.petActionText}>__hupi_i18n:common.seeAll</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/client/pet-form' as Href)} style={[styles.petActionButton, styles.petActionPrimary]}>
            <Ionicons color={colors.white} name="add" size={17} />
            <Text style={[styles.petActionText, styles.petActionTextPrimary]}>__hupi_i18n:common.addPet</Text>
          </Pressable>
        </View>
        {primaryPet ? (
          <Pressable onPress={() => router.push('/client/pet-stats' as Href)} style={styles.analysisInline}>
            <View>
              <Text style={styles.analysisEyebrow}>__hupi_i18n:common.analysis</Text>
              <Text style={styles.analysisTitle}>__hupi_i18n:app.profile.highEnergyStableRoutine</Text>
            </View>
            <Text style={styles.analysisLink}>__hupi_i18n:common.seeAnalysis</Text>
          </Pressable>
        ) : null}
      </Card>

      <Text style={styles.sectionTitle}>__hupi_i18n:common.favorites</Text>
      <Pressable onPress={() => router.push('/client/favorites' as Href)}>
        <Card style={styles.favoritesShortcut}>
          <View style={styles.favoritesIcon}>
            <Ionicons color={colors.primary} name="heart" size={22} />
          </View>
          <View style={styles.favoritesCopy}>
            <Text style={styles.favoritesTitle}>__hupi_i18n:app.profile.myFavoriteWalkers</Text>
            <Text style={styles.favoritesText}>{favoriteCount}  __hupi_i18n:common.walker{favoriteCount === 1 ? '' : 'es'}  __hupi_i18n:common.in {favoriteListCount}  __hupi_i18n:common.lists</Text>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Card>
      </Pressable>

      <Text style={styles.sectionTitle}>__hupi_i18n:app.profile.accountAndPreferences</Text>
      <Card style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <Pressable
            accessibilityLabel={item.href === '/client/edit-profile' ? t('profile.personalInformation') : item.label}
            accessibilityRole="button"
            key={item.label}
            onPress={() => {
              if ('href' in item && item.href) {
                router.push(item.href);
              }
            }}
            style={[styles.menuRow, index > 0 && styles.menuDivider]}
          >
            <View style={styles.menuIcon}><Ionicons color={colors.secondary} name={item.icon} size={20} /></View>
            <View style={styles.menuCopy}>
              <Text style={styles.menuLabel}>
                {item.href === '/client/edit-profile' ? t('profile.personalInformation') : item.label}
              </Text>
              <Text style={styles.menuDetail}>
                {item.href === '/client/edit-profile' ? t('profile.personalInformationDetail') : item.detail}
              </Text>
            </View>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
          </Pressable>
        ))}
      </Card>

      <Button
        icon="log-out-outline"
        onPress={() => {
          setLocalLoggedIn(false);
          router.replace('/login');
        }}
        title="__hupi_i18n:common.signOut"
        variant="ghost"
      />
      <HupiSuccessModal
        description="__hupi_i18n:app.profile.yourProfilePhotoWasSuccessfullySaved"
        onClose={() => setPhotoModalVisible(false)}
        title="__hupi_i18n:common.updatedPhoto"
        visible={photoModalVisible}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    minHeight: 58,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 31, fontWeight: '900', lineHeight: 39, marginTop: 2, overflow: 'visible', paddingBottom: 2 },
  settings: {
    flexShrink: 0, marginLeft: 'auto', width: 44, height: 44, borderRadius: 15,
    backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center',
  },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  accountCopy: { flex: 1, minWidth: 0 },
  accountChevron: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  email: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 3 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verified: { color: colors.success, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  providerBanner: {
    minHeight: 86, borderRadius: 22, backgroundColor: colors.secondary, marginTop: 16,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  providerIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1, minWidth: 0 },
  providerEyebrow: { color: 'rgba(255,255,255,0.72)', fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  providerTitle: { color: colors.white, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800', lineHeight: 20, marginTop: 4 },
  balanceCard: { gap: 12, marginTop: 16 },
  balanceHeader: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  balanceCopy: { flex: 1, minWidth: 0 },
  balanceEyebrow: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  balanceAmount: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 25, fontWeight: '900', lineHeight: 34, marginTop: 3, minHeight: 38, overflow: 'visible', paddingBottom: 2, paddingTop: 2 },
  balanceMovements: { gap: 8 },
  balanceMovement: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  balanceConcept: { flex: 1, color: colors.textMuted, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  balanceValue: { color: colors.success, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  balanceDebit: { color: colors.primary },
  sectionTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', marginTop: 28, marginBottom: 12 },
  petSectionCard: { gap: 13 },
  petSummary: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petAvatar: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  petCopy: { flex: 1, minWidth: 0 },
  petName: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900' },
  petMeta: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 4 },
  petCount: { color: colors.secondary, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800', lineHeight: 17, marginTop: 4 },
  emptyPets: { borderRadius: 18, backgroundColor: colors.white, padding: 14, gap: 4 },
  emptyPetsTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  emptyPetsText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  petActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  petActionButton: { minHeight: 40, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13 },
  petActionPrimary: { borderColor: colors.primary, backgroundColor: colors.primary },
  petActionText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  petActionTextPrimary: { color: colors.white },
  analysisInline: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  analysisEyebrow: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  analysisTitle: { color: colors.text, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800', lineHeight: 20, marginTop: 4 },
  analysisLink: { marginLeft: 'auto', color: colors.primary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  favoritesShortcut: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  favoritesIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  favoritesCopy: { flex: 1, minWidth: 0 },
  favoritesTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  favoritesText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  menuCard: { paddingVertical: 4, marginBottom: 16 },
  menuRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  menuDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  menuIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1, minWidth: 0 },
  menuLabel: { color: colors.text, flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  menuDetail: { color: colors.textMuted, flexShrink: 1, fontFamily: fonts.light, fontSize: 12, lineHeight: 17, marginTop: 3 },
});
