import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { colors } from '@/constants/colors';
import { Text, TextInput } from '@/i18n/components';

type MarketplaceSupportTicketCardProps = {
  reasons: string[];
};

export function MarketplaceSupportTicketCard({ reasons }: MarketplaceSupportTicketCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const createTicket = () => {
    setTicketNumber('TK-2048');
    setSuccessVisible(true);
  };

  return (
    <Card style={styles.card} tone="soft">
      <Pressable onPress={() => setOpen((value) => !value)} style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.secondary} name="headset-outline" size={21} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>__hupi_i18n:marketplace.MarketplaceSupportTicketCard.orderSupport</Text>
          <Text style={styles.subtitle}>__hupi_i18n:marketplace.MarketplaceSupportTicketCard.reportAProblemAndCreateASupportTicket</Text>
        </View>
        <Ionicons color={colors.primary} name={open ? 'chevron-up' : 'chevron-down'} size={19} />
      </Pressable>

      {open ? (
        <View style={styles.body}>
          <View style={styles.reasons}>
            {reasons.map((reason) => {
              const active = selectedReason === reason;
              return (
                <Pressable key={reason} onPress={() => setSelectedReason(reason)} style={[styles.reason, active && styles.activeReason]}>
                  <Text style={[styles.reasonText, active && styles.activeReasonText]}>{reason}</Text>
                </Pressable>
              );
            })}
          </View>
          {selectedReason ? (
            <>
              <TextInput
                multiline
                onChangeText={setDescription}
                placeholder="__hupi_i18n:marketplace.MarketplaceSupportTicketCard.describeTheProblem"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={description}
              />
              <Button icon="ticket-outline" onPress={createTicket} title="__hupi_i18n:common.createTicket" />
            </>
          ) : null}
          {ticketNumber ? (
            <View style={styles.ticketBox}>
              <Text style={styles.ticketTitle}>__hupi_i18n:common.ticketCreated</Text>
              <Text style={styles.ticketNumber}>{ticketNumber}</Text>
              <Text style={styles.ticketText}>__hupi_i18n:marketplace.MarketplaceSupportTicketCard.useThisNumberToTrackYourCase</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <HupiSuccessModal
        description="__hupi_i18n:common.yourRequestWasRegisteredCorrectly"
        onClose={() => setSuccessVisible(false)}
        reference={ticketNumber ? `Ticket #${ticketNumber}` : undefined}
        title="__hupi_i18n:common.ticketSent"
        visible={successVisible}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 18, shadowOpacity: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 3 },
  body: { gap: 11, marginTop: 14 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  reason: { borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 10, paddingVertical: 7 },
  activeReason: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  reasonText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  activeReasonText: { color: colors.primary },
  input: { minHeight: 84, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, padding: 12, fontSize: 13, textAlignVertical: 'top' },
  ticketBox: { borderRadius: 15, backgroundColor: colors.white, padding: 12 },
  ticketTitle: { color: colors.success, fontSize: 13, fontWeight: '900' },
  ticketNumber: { color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 3 },
  ticketText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 4 },
});
