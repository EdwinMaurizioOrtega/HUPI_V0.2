import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getCustomerHupiBalance } from '@/constants/marketplaceIssuesState';
import { Text } from '@/i18n/components';

export default function MarketplaceWalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState(() => getCustomerHupiBalance());

  useFocusEffect(useCallback(() => {
    setWallet(getCustomerHupiBalance());
  }, []));

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:marketplace.wallet.walletMarketplace"
        title="__hupi_i18n:common.hupiBalance"
      />

      <Card style={styles.balanceCard} tone="purple">
        <Text style={styles.eyebrow}>__hupi_i18n:common.availableBalance2</Text>
        <View style={styles.amountContainer}>
          <Text maxFontSizeMultiplier={1.25} style={styles.amount}>
            ${wallet.available.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.description}>__hupi_i18n:marketplace.wallet.youCanUseYourHupiBalanceOnPurchasesWithin</Text>
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>__hupi_i18n:marketplace.wallet.lastMoves</Text>
        <View style={styles.movements}>
          {wallet.movements.map((movement) => (
            <View key={movement.id} style={styles.movementRow}>
              <View style={styles.movementIcon}>
                <Ionicons color={movement.amount >= 0 ? colors.success : colors.primary} name={movement.amount >= 0 ? 'add-circle-outline' : 'remove-circle-outline'} size={18} />
              </View>
              <View style={styles.movementCopy}>
                <Text style={styles.movementConcept}>{movement.concept}</Text>
                <Text style={styles.movementMeta}>{movement.createdAt} · {movement.type} · {movement.status}</Text>
              </View>
              <Text style={[styles.movementAmount, movement.amount < 0 && styles.debitAmount]}>
                {movement.amount < 0 ? '-' : '+'}${Math.abs(movement.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  balanceCard: { gap: 7, marginTop: 22, overflow: 'visible', paddingVertical: 20, shadowOpacity: 0 },
  eyebrow: { color: colors.secondary, fontSize: 12, fontWeight: '900', letterSpacing: 1, lineHeight: 18 },
  amountContainer: { justifyContent: 'center', minHeight: 62, overflow: 'visible', paddingVertical: 4 },
  amount: { color: colors.text, flexShrink: 1, fontSize: 38, fontWeight: '900', lineHeight: 52, overflow: 'visible', paddingBottom: 4, paddingTop: 2 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800' },
  section: { gap: 12, marginTop: 14, shadowOpacity: 0.04 },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  movements: { gap: 9 },
  movementRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 15, backgroundColor: colors.soft, minHeight: 64, overflow: 'visible', padding: 11 },
  movementIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  movementCopy: { flex: 1, minWidth: 0 },
  movementConcept: { color: colors.text, fontSize: 13, fontWeight: '900', lineHeight: 19 },
  movementMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 2, fontWeight: '800' },
  movementAmount: { color: colors.success, flexShrink: 0, fontSize: 13, fontWeight: '900', lineHeight: 19 },
  debitAmount: { color: colors.primary },
});
