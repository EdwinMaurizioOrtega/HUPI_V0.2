import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRef,
  useState } from 'react';
import { Animated,
  Modal,
  StyleSheet,
} from 'react-native';

import { colors } from '@/constants/colors';
import { theme } from '@/constants/theme';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';

type PromoReward = {
  description: string;
  icon: string;
  id: string;
  title: string;
};

type MarketplacePromoModalProps = {
  onClose: () => void;
  onRewardSaved?: (reward: PromoReward) => void;
  rewards: PromoReward[];
  visible: boolean;
};

export function MarketplacePromoModal({ onClose, onRewardSaved, rewards, visible }: MarketplacePromoModalProps) {
  const [revealed, setRevealed] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;
  const reward = rewards[0];
  const segmentStyles = [styles.segment0, styles.segment1, styles.segment2, styles.segment3];

  const spinWheel = () => {
    setRevealed(false);
    spin.setValue(0);
    Animated.sequence([
      Animated.timing(spin, {
        duration: 850,
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(spin, {
        friction: 5,
        tension: 110,
        toValue: 1.06,
        useNativeDriver: true,
      }),
      Animated.timing(spin, {
        duration: 120,
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(() => setRevealed(true));
  };

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '540deg'],
  });

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Pressable accessibilityLabel="__hupi_i18n:common.closePromotion" onPress={onClose} style={styles.closeButton}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
          <Text style={styles.eyebrow}>__hupi_i18n:common.marketplaceHupi2</Text>
          <Text style={styles.title}>__hupi_i18n:marketplace.MarketplacePromoModal.hupiSpecialOffer</Text>
          <Text style={styles.subtitle}>__hupi_i18n:marketplace.MarketplacePromoModal.earnBenefitsForYourNextPurchase</Text>

          <Animated.View style={[styles.wheel, { transform: [{ rotate: rotation }] }]}>
            {rewards.slice(0, 4).map((item, index) => (
              <View key={item.id} style={[styles.segment, segmentStyles[index]]}>
                <Text style={styles.segmentIcon}>{item.icon}</Text>
              </View>
            ))}
            <View style={styles.wheelCenter}>
              <Ionicons color={colors.white} name="paw" size={23} />
            </View>
          </Animated.View>

          {revealed ? (
            <View style={styles.resultBox}>
              <Text style={styles.resultTitle}>{reward.title}</Text>
              <Text style={styles.resultText}>{reward.description}</Text>
            </View>
          ) : null}

          <Text style={styles.legal}>__hupi_i18n:marketplace.MarketplacePromoModal.visualPromotionInTestModeItDoesNotConstitute</Text>

          {revealed ? (
            <Pressable
              onPress={() => {
                onRewardSaved?.(reward);
                onClose();
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryText}>__hupi_i18n:marketplace.MarketplacePromoModal.useInMarketplace</Text>
            </Pressable>
          ) : (
            <Pressable onPress={spinWheel} style={styles.primaryButton}>
              <Text style={styles.primaryText}>__hupi_i18n:common.seeBenefit</Text>
            </Pressable>
          )}
          <Pressable onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>__hupi_i18n:common.close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(51,51,51,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  modal: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: colors.white,
    padding: 22,
    alignItems: 'center',
    ...theme.shadow,
    shadowOpacity: 0.2,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 25, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 6, textAlign: 'center' },
  wheel: {
    width: 154,
    height: 154,
    borderRadius: 77,
    backgroundColor: colors.soft,
    marginTop: 20,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: colors.secondarySoft,
  },
  segment: { position: 'absolute', width: 77, height: 77, alignItems: 'center', justifyContent: 'center' },
  segment0: { left: 0, top: 0, backgroundColor: colors.primarySoft },
  segment1: { right: 0, top: 0, backgroundColor: colors.secondarySoft },
  segment2: { left: 0, bottom: 0, backgroundColor: colors.soft },
  segment3: { right: 0, bottom: 0, backgroundColor: '#eef9f3' },
  segmentIcon: { fontSize: 25 },
  wheelCenter: {
    position: 'absolute',
    left: 51,
    top: 51,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBox: { borderRadius: 18, backgroundColor: colors.primarySoft, padding: 13, marginTop: 16, width: '100%' },
  resultTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  resultText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  legal: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 17, marginTop: 14, textAlign: 'center' },
  primaryButton: { width: '100%', minHeight: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryText: { color: colors.white, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 7 },
  secondaryText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
});
