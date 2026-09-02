import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import type { Href } from 'expo-router';
import { useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import {
  ScrollView,
  StyleSheet,
} from 'react-native';

import { BookingCard } from '@/components/bookings/BookingCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getOrCreateServiceChatForBooking } from '@/constants/mockData';
import { Text } from '@/i18n/components';
import {
  getMockBookings,
  type BookingService,
  type MockBooking,
} from '@/constants/mockBookings';

type ReservationFilter = 'all' | 'upcoming' | 'current' | 'finished' | 'cancelled';

const sections: Array<{ id: ReservationFilter; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'current', label: 'En curso' },
  { id: 'finished', label: 'Finalizadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

const serviceFilters: Array<{ id: 'all' | BookingService; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'Paseo', label: 'Paseos' },
];

export default function BookingsScreen() {
  const router = useRouter();
  const [section, setSection] = useState<ReservationFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | BookingService>('all');
  const [bookingItems, setBookingItems] = useState<MockBooking[]>(() => getMockBookings());

  useFocusEffect(useCallback(() => {
    setBookingItems(getMockBookings());
  }, []));

  const bookings = useMemo(() => bookingItems.filter((booking) => {
    const sectionMatches = section === 'all'
      || (section === 'finished' ? ['history'].includes(booking.section) : booking.section === section);
    const serviceMatches = serviceFilter === 'all' || booking.service === serviceFilter;
    return sectionMatches && serviceMatches;
  }), [bookingItems, section, serviceFilter]);

  const openDetail = (bookingId: string) => {
    router.push(`/client/booking-detail?bookingId=${bookingId}` as Href);
  };

  const openBookingChat = (booking: MockBooking) => {
    const conversation = getOrCreateServiceChatForBooking(booking);
    router.push(`/chat?chatId=${conversation.id}&viewer=client` as Href);
  };

  return (
    <ScreenContainer avoidFloatingTabBar contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.yourHupiAgenda</Text>
          <Text style={styles.title}>__hupi_i18n:common.myReservations</Text>
          <Text style={styles.subtitle}>__hupi_i18n:bookings.bookings.checkYourScheduledAndPreviousWalks</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons color={colors.primary} name="calendar" size={24} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.sections}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {sections.map((item) => {
          const active = section === item.id;
          const count = bookingItems.filter((booking) => {
            if (item.id === 'all') {
              return true;
            }
            if (item.id === 'finished') {
              return booking.section === 'history';
            }
            return booking.section === item.id;
          }).length;
          return (
            <Pressable
              key={item.id}
              onPress={() => setSection(item.id)}
              style={[styles.section, active && styles.activeSection]}
            >
              <Text style={[styles.sectionText, active && styles.activeSectionText]}>{item.label}</Text>
              <View style={[styles.count, active && styles.activeCount]}>
                <Text style={[styles.countText, active && styles.activeCountText]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.filterHeading}>
        <Text style={styles.filterTitle}>__hupi_i18n:bookings.bookings.filterByService</Text>
        <Ionicons color={colors.textMuted} name="options-outline" size={17} />
      </View>
      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {serviceFilters.map((filter) => {
          const active = serviceFilter === filter.id;
          return (
            <Pressable
              key={filter.id}
              onPress={() => setServiceFilter(filter.id)}
              style={[styles.filter, active && styles.activeFilter]}
            >
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{sections.find((item) => item.id === section)?.label}</Text>
        <Text style={styles.resultsCount}>{bookings.length}  __hupi_i18n:common.result{bookings.length === 1 ? '' : 's'}</Text>
      </View>

      <View style={styles.list}>
        {bookings.map((booking) => (
          <BookingCard
            booking={booking}
            key={booking.id}
            onCancel={() => openDetail(booking.id)}
            onOpenChat={() => openBookingChat(booking)}
            onViewDetail={() => openDetail(booking.id)}
          />
        ))}
      </View>

      {bookings.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons color={colors.secondary} name="calendar-outline" size={31} /></View>
          <Text style={styles.emptyTitle}>__hupi_i18n:bookings.bookings.thereAreNoReservationsInThisView</Text>
          <Text style={styles.emptyText}>__hupi_i18n:bookings.bookings.tryAnotherTypeOfServiceOrStatus</Text>
          <Pressable onPress={() => setServiceFilter('all')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>__hupi_i18n:common.seeAll3</Text>
          </Pressable>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, flexShrink: 1, fontSize: 31, lineHeight: 39, fontWeight: '900', marginTop: 3 },
  subtitle: { color: colors.textMuted, flexShrink: 1, fontSize: 15, lineHeight: 21, marginTop: 5 },
  headerIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sections: { gap: 8, paddingTop: 23, paddingRight: 20 },
  section: { minHeight: 42, borderRadius: 14, backgroundColor: colors.soft, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13 },
  activeSection: { backgroundColor: colors.primary },
  sectionText: { color: colors.textMuted, fontSize: 15, fontWeight: '800' },
  activeSectionText: { color: colors.white },
  count: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  activeCount: { backgroundColor: 'rgba(255,255,255,0.2)' },
  countText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  activeCountText: { color: colors.white },
  filterHeading: { flexDirection: 'row', alignItems: 'center', marginTop: 22 },
  filterTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  filters: { gap: 7, paddingVertical: 12, paddingRight: 20 },
  filter: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 13 },
  activeFilter: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  filterText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  activeFilterText: { color: colors.white },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 12 },
  resultsTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '900' },
  resultsCount: { color: colors.textMuted, fontSize: 13 },
  list: { gap: 13 },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { width: 68, height: 68, borderRadius: 23, backgroundColor: colors.secondarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 14 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginTop: 5 },
  clearButton: { minHeight: 36, borderRadius: 12, backgroundColor: colors.primarySoft, justifyContent: 'center', paddingHorizontal: 14, marginTop: 14 },
  clearButtonText: { color: colors.primary, fontSize: 15, fontWeight: '900' },
});
