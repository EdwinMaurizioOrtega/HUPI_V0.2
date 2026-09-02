import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { formatBookingCurrency } from '@/constants/mockBookings';
import { getMockProviderPlans, type MockProviderPlan, type MockServiceCoordinationRequest, type MockServiceOfferInput } from '@/constants/mockData';
import { fonts } from '@/constants/typography';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';
import { useTheme } from '@/theme/ThemeProvider';

type OfferComposerModalProps = {
  onClose: () => void;
  onSend: (input: MockServiceOfferInput) => void;
  request: MockServiceCoordinationRequest;
  visible: boolean;
};

export function OfferComposerModal({ onClose, onSend, request, visible }: OfferComposerModalProps) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const availableOffers = useMemo(
    () => getMockProviderPlans(request.providerId, request.serviceType),
    [request.providerId, request.serviceType, visible],
  );
  const individualOffers = availableOffers.filter((offer) => offer.type === 'individual');
  const plans = availableOffers.filter((offer) => offer.type === 'recurring');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelectedOfferId(null);
  }, [visible]);

  const sendSelectedOffer = () => {
    if (!selectedOfferId) return;
    onSend({ approvedOfferId: selectedOfferId });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView edges={['top', 'bottom']} style={[styles.safe, { backgroundColor: tokens.background }]}>
        <View style={[styles.header, { borderBottomColor: tokens.border }]}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: tokens.primary }]}>{t('offerFlow.providerOffer')}</Text>
            <Text style={[styles.title, { color: tokens.text }]}>{t('offerFlow.chooseApproved')}</Text>
          </View>
          <Pressable accessibilityLabel={t('common.close')} onPress={onClose} style={[styles.close, { backgroundColor: tokens.soft }]}>
            <Ionicons color={tokens.text} name="close" size={22} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.notice, { backgroundColor: tokens.primarySoft }]}>
            <Ionicons color={tokens.primary} name="shield-checkmark-outline" size={21} />
            <Text style={[styles.noticeText, { color: tokens.text }]}>{t('offerFlow.approvedOnlyNotice')}</Text>
          </View>

          {availableOffers.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: tokens.soft, borderColor: tokens.border }]}>
              <Ionicons color={tokens.textMuted} name="file-tray-outline" size={28} />
              <Text style={[styles.emptyText, { color: tokens.textMuted }]}>{t('offerFlow.emptyApproved')}</Text>
            </View>
          ) : (
            <>
              <OfferSection
                offers={individualOffers}
                onSelect={setSelectedOfferId}
                selectedOfferId={selectedOfferId}
                title={t('offerFlow.individualServices')}
              />
              <OfferSection
                offers={plans}
                onSelect={setSelectedOfferId}
                selectedOfferId={selectedOfferId}
                title={t('offerFlow.plans')}
              />
              <Button disabled={!selectedOfferId} icon="send-outline" onPress={sendSelectedOffer} title={t('offerFlow.sendSelected')} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function OfferSection({ offers, onSelect, selectedOfferId, title }: {
  offers: MockProviderPlan[];
  onSelect: (offerId: string) => void;
  selectedOfferId: string | null;
  title: string;
}) {
  const { t } = useTranslation();
  const { tokens } = useTheme();
  if (offers.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tokens.text }]}>{title}</Text>
      {offers.map((offer) => {
        const selected = selectedOfferId === offer.id;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            key={offer.id}
            onPress={() => onSelect(offer.id)}
            style={[
              styles.offer,
              { backgroundColor: tokens.surface, borderColor: selected ? tokens.secondary : tokens.border },
              selected && { backgroundColor: tokens.secondarySoft },
            ]}
          >
            <View style={[styles.radio, { borderColor: selected ? tokens.secondary : tokens.border }]}>
              {selected ? <View style={[styles.radioDot, { backgroundColor: tokens.secondary }]} /> : null}
            </View>
            <View style={styles.offerCopy}>
              <Text style={[styles.offerTitle, { color: tokens.text }]}>{offer.title}</Text>
              <Text style={[styles.offerDescription, { color: tokens.textMuted }]}>{offer.description}</Text>
              <Text style={[styles.offerMeta, { color: tokens.secondary }]}>
                {offer.duration} · {t('offerFlow.walks', { count: offer.walkCount })}
                {offer.frequencyPerWeek ? ` · ${t('offerFlow.weeklyFrequency', { count: offer.frequencyPerWeek })}` : ''}
                {offer.validityDays ? ` · ${t('offerFlow.validityDays', { count: offer.validityDays })}` : ''}
              </Text>
            </View>
            <Text style={[styles.price, { color: tokens.primary }]}>{formatBookingCurrency(offer.clientTotal)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: 12, padding: 18 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1 },
  title: { fontFamily: fonts.bold, fontSize: 23, lineHeight: 30, marginTop: 3 },
  close: { alignItems: 'center', borderRadius: 14, height: 44, justifyContent: 'center', width: 44 },
  content: { gap: 20, padding: 18, paddingBottom: 42 },
  notice: { alignItems: 'flex-start', borderRadius: 16, flexDirection: 'row', gap: 9, padding: 13 },
  noticeText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  empty: { alignItems: 'center', borderRadius: 18, borderWidth: 1, gap: 10, padding: 22 },
  emptyText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  offer: { alignItems: 'flex-start', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 13 },
  radio: { alignItems: 'center', borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: 'center', marginTop: 2, width: 20 },
  radioDot: { borderRadius: 5, height: 10, width: 10 },
  offerCopy: { flex: 1, minWidth: 0 },
  offerTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  offerDescription: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 3 },
  offerMeta: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, marginTop: 7 },
  price: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
});
