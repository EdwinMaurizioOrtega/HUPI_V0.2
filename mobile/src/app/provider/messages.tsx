import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { ChatCard } from '@/components/chat/ChatCard';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { getVisibleMockConversations, type MockConversationType } from '@/constants/mockData';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { Text } from '@/i18n/components';

type MessageFilter = 'Todos' | 'Marketplace' | 'Servicios' | 'Soporte' | 'No leídos';

const filters: MessageFilter[] = ['Todos', 'Marketplace', 'Servicios', 'Soporte', 'No leídos'];

export default function ProviderMessagesScreen() {
  const router = useRouter();
  const { profile } = useLocalAccount();
  const [activeFilter, setActiveFilter] = useState<MessageFilter>('Todos');
  const providerConversations = useMemo(() => (
    getVisibleMockConversations().filter((conversation) => conversation.type === 'services' || conversation.id === 'chat-support-provider-2050')
  ), []);
  const filteredConversations = useMemo(() => (
    providerConversations.filter((conversation) => matchesFilter(conversation.type, conversation.unreadCount, activeFilter))
  ), [activeFilter, providerConversations]);

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:provider.messages.hupiRidesAndSupport"
        title="__hupi_i18n:common.messages"
      />

      <View style={styles.filters}>
        {filters.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Pressable key={filter} onPress={() => setActiveFilter(filter)} style={[styles.filterChip, active && styles.activeFilterChip]}>
              <Text style={[styles.filterText, active && styles.activeFilterText]}>{filter}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.stack}>
        {filteredConversations.map((conversation) => (
          <ChatCard
            accentColor={conversation.accentColor}
            avatarType={conversation.type === 'support' ? 'provider' : 'owner'}
            key={conversation.id}
            lastMessage={conversation.lastMessage}
            onPress={() => router.push(`/chat?chatId=${conversation.id}&viewer=provider` as Href)}
            relation={conversation.subtitle}
            status={conversation.status}
            time={conversation.updatedAt}
            title={conversation.type === 'support' ? conversation.title : `${profile.firstName} ${profile.lastName}`.trim()}
            unread={conversation.unreadCount}
            uri={conversation.type === 'support' ? undefined : profile.profilePhotoUri}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

function matchesFilter(type: MockConversationType, unreadCount: number, filter: MessageFilter) {
  if (filter === 'Todos') {
    return true;
  }

  if (filter === 'No leídos') {
    return unreadCount > 0;
  }

  if (filter === 'Marketplace') {
    return type === 'marketplace';
  }

  if (filter === 'Servicios') {
    return type === 'services';
  }

  return type === 'support';
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '800' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22, marginBottom: 16 },
  filterChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 11 },
  activeFilterChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeFilterText: { color: colors.white },
  stack: { gap: 11 },
});
