import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { HupiConfirmationModal } from '@/components/HupiConfirmationModal';
import { formatBookingCurrency } from '@/constants/mockBookings';
import { calculateBookingCancellation, type BookingCancellationQuote } from '@/domain/bookingCancellationPolicy';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useTheme } from '@/theme/ThemeProvider';

export type RefundChoice = 'wallet' | 'refund';

type CancellationPolicyCardProps = {
  bookingStartsAt: string;
  originalAmount: number;
  onConfirmCancellation: (choice: RefundChoice, quote: BookingCancellationQuote) => void;
};

export function CancellationPolicyCard({ bookingStartsAt, originalAmount, onConfirmCancellation }: CancellationPolicyCardProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const [showChoices, setShowChoices] = useState(false);
  const [choice, setChoice] = useState<RefundChoice>('wallet');
  const [quote, setQuote] = useState<BookingCancellationQuote | null>(null);

  const prepareCancellation = () => {
    setQuote(calculateBookingCancellation(bookingStartsAt, originalAmount));
  };

  const confirmationMessage = quote
    ? quote.tier === 'free'
      ? t('bookingCancellation.freeMessage', {
        amount: formatBookingCurrency(quote.refundAmount),
        method: t(`bookingCancellation.methods.${choice}`),
      })
      : t('bookingCancellation.penaltyMessage', {
        original: formatBookingCurrency(quote.originalAmount),
        percent: quote.penaltyPercent,
        charge: formatBookingCurrency(quote.cancellationCharge),
        refund: formatBookingCurrency(quote.refundAmount),
        method: t(`bookingCancellation.methods.${choice}`),
      })
    : '';

  return (
    <View style={[styles.card, { backgroundColor: showChoices ? tokens.soft : tokens.surface, borderColor: tokens.border }]}>
      <Pressable accessibilityRole="button" onPress={() => setShowChoices((value) => !value)} style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: tokens.soft }]}>
          <Ionicons color={tokens.textMuted} name="options-outline" size={18} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: tokens.text }]}>{t('bookingCancellation.title')}</Text>
          <Text style={[styles.subtitle, { color: tokens.textMuted }]}>{t('bookingCancellation.subtitle')}</Text>
        </View>
        <View style={styles.optionsLink}>
          <Text style={[styles.optionsLinkText, { color: tokens.secondary }]}>{t(showChoices ? 'bookingCancellation.hide' : 'bookingCancellation.show')}</Text>
          <Ionicons color={tokens.secondary} name={showChoices ? 'chevron-up' : 'chevron-down'} size={15} />
        </View>
      </Pressable>

      {showChoices ? (
        <View style={styles.expandedContent}>
          <View style={[styles.divider, { backgroundColor: tokens.border }]} />
          <Text style={[styles.policy, { color: tokens.text }]}>{t('bookingCancellation.policy')}</Text>
          <Text style={[styles.choiceHeading, { color: tokens.text }]}>{t('bookingCancellation.methodQuestion')}</Text>

          {(['wallet', 'refund'] as const).map((option) => {
            const selected = choice === option;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                key={option}
                onPress={() => setChoice(option)}
                style={[
                  styles.choice,
                  { backgroundColor: tokens.surface, borderColor: selected ? tokens.secondary : tokens.border },
                  selected && { backgroundColor: tokens.secondarySoft },
                ]}
              >
                <View style={[styles.radio, { borderColor: selected ? tokens.secondary : tokens.border }]}>
                  {selected ? <View style={[styles.radioDot, { backgroundColor: tokens.secondary }]} /> : null}
                </View>
                <View style={styles.choiceCopy}>
                  <Text style={[styles.choiceTitle, { color: tokens.text }]}>{t(`bookingCancellation.methods.${option}`)}</Text>
                  <Text style={[styles.choiceDescription, { color: tokens.textMuted }]}>{t(`bookingCancellation.methodDescriptions.${option}`)}</Text>
                </View>
                <Ionicons color={selected ? tokens.secondary : tokens.textMuted} name={option === 'wallet' ? 'wallet-outline' : 'return-down-back-outline'} size={20} />
              </Pressable>
            );
          })}

          <Button icon="close-circle-outline" onPress={prepareCancellation} title={t('bookingCancellation.cancelAction')} variant="outline" />
        </View>
      ) : null}

      <HupiConfirmationModal
        cancelLabel={t('common.back')}
        confirmLabel={t('bookingCancellation.accept')}
        message={confirmationMessage}
        onCancel={() => setQuote(null)}
        onConfirm={() => {
          if (!quote) return;
          onConfirmCancellation(choice, quote);
          setQuote(null);
          setShowChoices(false);
        }}
        title={t(quote?.tier === 'free' ? 'bookingCancellation.freeTitle' : 'bookingCancellation.penaltyTitle')}
        visible={Boolean(quote)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 13 },
  heading: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 46 },
  icon: { alignItems: 'center', borderRadius: 11, height: 34, justifyContent: 'center', width: 34 },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 20 },
  subtitle: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, marginTop: 3 },
  optionsLink: { alignItems: 'center', flexDirection: 'row', gap: 3, minHeight: 32, paddingLeft: 5 },
  optionsLinkText: { fontFamily: fonts.semiBold, fontSize: 12 },
  expandedContent: { gap: 10, marginTop: 12 },
  divider: { height: 1, marginBottom: 2 },
  policy: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 19 },
  choiceHeading: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19, marginTop: 4 },
  choice: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 70, padding: 11 },
  radio: { alignItems: 'center', borderRadius: 10, borderWidth: 1.5, height: 19, justifyContent: 'center', width: 19 },
  radioDot: { borderRadius: 5, height: 9, width: 9 },
  choiceCopy: { flex: 1 },
  choiceTitle: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  choiceDescription: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, marginTop: 3 },
});
