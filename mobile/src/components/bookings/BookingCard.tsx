import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { ComponentProps } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Card } from '@/components/Card';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import { formatBookingCurrency, type BookingService, type MockBooking } from '@/constants/mockBookings';
import { getMockPets } from '@/constants/mockData';
import { QA_WALK_ID } from '@/domain/qaWalk';
import { BookingStatusBadge } from './BookingStatusBadge';
import { ReviewPromptCard } from './ReviewPromptCard';
import { Text } from '@/i18n/components';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const serviceVisuals: Record<BookingService, { icon: IoniconName; color: string; background: string }> = {
  Paseo: { icon: 'walk-outline', color: colors.primary, background: colors.primarySoft },
  Niñera: { icon: 'home-outline', color: colors.secondary, background: colors.secondarySoft },
  Hospedaje: { icon: 'moon-outline', color: '#806326', background: colors.soft },
  Guardería: { icon: 'sunny-outline', color: colors.success, background: '#e7f5ef' },
};

type BookingCardProps = {
  booking: MockBooking;
  onViewDetail: () => void;
  onOpenChat: () => void;
  onCancel: () => void;
};

export function BookingCard({ booking, onViewDetail, onOpenChat, onCancel }: BookingCardProps) {
  const visual = serviceVisuals[booking.service];
  const pet = getMockPets().find((item) => item.name === booking.pet);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.serviceIcon, { backgroundColor: visual.background }]}>
          <Ionicons color={visual.color} name={visual.icon} size={23} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.service}>{booking.service}</Text>
          <Text style={styles.provider}>{booking.provider}</Text>
          {booking.id === QA_WALK_ID ? <Text style={styles.bookingId}>{booking.id}</Text> : null}
        </View>
        <BookingStatusBadge status={booking.status} />
      </View>

      <View style={styles.petRow}>
        <ProfileAvatar size={36} style={styles.petAvatar} type="pet" uri={pet?.petPhotoUri} />
        <View style={styles.petCopy}>
          <Text style={styles.petLabel}>__hupi_i18n:common.pet3</Text>
          <Text style={styles.petName}>{booking.pet}</Text>
        </View>
        <View style={styles.totalCopy}>
          <Text style={styles.totalLabel}>__hupi_i18n:common.total2</Text>
          <Text style={styles.total}>{formatBookingCurrency(booking.totalPaid)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Ionicons color={colors.primary} name="calendar-outline" size={16} />
          <View style={styles.detailCopy}>
            <Text style={styles.detailLabel}>__hupi_i18n:common.date</Text>
            <Text numberOfLines={1} style={styles.detailValue}>{booking.date}</Text>
          </View>
        </View>
        <View style={styles.detailItem}>
          <Ionicons color={colors.secondary} name="time-outline" size={16} />
          <View style={styles.detailCopy}>
            <Text style={styles.detailLabel}>__hupi_i18n:common.timeAndDuration</Text>
            <Text style={styles.detailValue}>{booking.time} · {booking.duration}</Text>
          </View>
        </View>
        <View style={[styles.detailItem, styles.locationItem]}>
          <Ionicons color={colors.success} name="location-outline" size={16} />
          <View style={styles.detailCopy}>
            <Text style={styles.detailLabel}>__hupi_i18n:common.location</Text>
            <Text numberOfLines={1} style={styles.detailValue}>{booking.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={onViewDetail} style={[styles.action, styles.detailAction]}>
          <Ionicons color={colors.primary} name="document-text-outline" size={16} />
          <Text style={styles.detailActionText}>__hupi_i18n:common.seeDetail</Text>
        </Pressable>
        {booking.chatAvailable ? (
          <Pressable onPress={onOpenChat} style={[styles.action, styles.chatAction]}>
            <Ionicons color={colors.white} name="chatbubbles-outline" size={16} />
            <Text style={styles.primaryActionText}>__hupi_i18n:common.openChat</Text>
          </Pressable>
        ) : null}
        {booking.canCancel ? (
          <Pressable onPress={onCancel} style={styles.cancelAction}>
            <Text style={styles.cancelActionText}>__hupi_i18n:common.cancelReservation</Text>
          </Pressable>
        ) : null}
      </View>

      {booking.status === 'Completada' ? <ReviewPromptCard bookingId={booking.id} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 15, shadowOpacity: 0.06 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  serviceIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  service: { color: colors.text, fontSize: 16, fontWeight: '900' },
  provider: { color: colors.secondary, fontSize: 13, fontWeight: '800', marginTop: 4 },
  bookingId: { color: colors.primary, fontSize: 11, fontWeight: '900', marginTop: 3 },
  petRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: colors.soft, padding: 10, marginTop: 14 },
  petAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  petCopy: { marginLeft: 8 },
  petLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  petName: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 2 },
  totalCopy: { marginLeft: 'auto', alignItems: 'flex-end' },
  totalLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  total: { color: colors.primary, fontSize: 15, fontWeight: '900', marginTop: 2 },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  detailItem: { width: '48%', flexDirection: 'row', gap: 7, alignItems: 'center' },
  locationItem: { width: '100%' },
  detailCopy: { flex: 1 },
  detailLabel: { color: colors.textMuted, fontSize: 13 },
  detailValue: { color: colors.text, fontSize: 15, fontWeight: '700', marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 15 },
  action: { flex: 1, minWidth: 120, minHeight: 41, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  detailAction: { borderWidth: 1, borderColor: colors.primary },
  detailActionText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  chatAction: { backgroundColor: colors.secondary },
  primaryActionText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  cancelAction: { width: '100%', minHeight: 35, alignItems: 'center', justifyContent: 'center' },
  cancelActionText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
});
