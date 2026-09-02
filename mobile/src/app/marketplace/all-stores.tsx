import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { OfficialStoreCard } from '@/components/marketplace/OfficialStoreCard';
import { colors } from '@/constants/colors';
import { mockStoreCategories } from '@/constants/marketplaceStoreProfileOptions';
import { getPublicMarketplaceStores } from '@/constants/marketplaceStoreState';
import { Text } from '@/i18n/components';

export default function MarketplaceAllStoresScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const [marketplaceStores, setMarketplaceStores] = useState(() => getPublicMarketplaceStores());
  const [selectedCategory, setSelectedCategory] = useState('Todo');
  const baseStores = type === 'official'
    ? marketplaceStores.filter((store) => store.isOfficialStore)
    : marketplaceStores.filter((store) => store.isVerifiedByHupi);
  const storeCategoryFilters = ['Todo', ...mockStoreCategories];
  const stores = selectedCategory === 'Todo'
    ? baseStores
    : baseStores.filter((store) => store.category === selectedCategory || store.categories.includes(selectedCategory));
  const title = type === 'official' ? 'Tiendas Oficiales' : 'Tiendas verificadas';
  const subtitle = type === 'official'
    ? 'Marcas oficiales validadas por Hupi'
    : 'Tiendas validadas para vender en Hupi';

  useFocusEffect(useCallback(() => {
    setMarketplaceStores(getPublicMarketplaceStores());
  }, []));

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>
        {storeCategoryFilters.map((filter) => {
          const active = selectedCategory === filter;

          return (
            <Pressable
              key={filter}
              onPress={() => setSelectedCategory(filter)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{filter}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.storeList}>
        {stores.map((store) => (
          <OfficialStoreCard
            category={store.category}
            isOfficialStore={store.isOfficialStore}
            isVerifiedByHupi={store.isVerifiedByHupi}
            key={store.id}
            logo={store.logo}
            name={store.name}
            onPress={() => router.push(`/marketplace/official-store?storeId=${store.id}` as Href)}
            productCount={store.productCount}
            rating={store.rating}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0 },
  title: { color: colors.text, flexShrink: 1, fontSize: 27, fontWeight: '900', lineHeight: 33 },
  subtitle: { color: colors.textMuted, flexShrink: 1, fontSize: 13, lineHeight: 21, marginTop: 4 },
  filterRow: { gap: 8, marginTop: 18, marginBottom: 14, paddingRight: 20 },
  filterPill: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 11 },
  filterPillActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterPillText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  filterPillTextActive: { color: colors.white },
  storeList: { gap: 12 },
});
