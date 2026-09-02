import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '../../../node_modules/react-i18next';

import { AddressEditor } from '@/components/addresses/AddressEditor';
import { AddressPreferencesSummary } from '@/components/addresses/AddressPreferencesEditor';
import { AddressIcon } from '@/components/addresses/AddressIcon';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import {
  deleteLocalAddress,
  saveLocalAddress,
  setDefaultLocalAddress,
} from '@/data/localAccountRepository';
import { createEmptyAddress, type Address } from '@/domain/address';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { Alert, Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';

export default function AddressesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { tokens } = useTheme();
  const { addresses } = useLocalAccount();
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; address: Address } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const getLabel = (address: Address) => (
    address.labelType === 'other'
      ? address.customLabel || t('addressBook.labels.other')
      : t(`addressBook.labels.${address.labelType}`)
  );

  const openCreate = () => {
    setFeedback(null);
    setDirty(false);
    setEditor({ mode: 'create', address: createEmptyAddress() });
  };

  const openEdit = (address: Address) => {
    setFeedback(null);
    setDirty(false);
    setEditor({ mode: 'edit', address: { ...address } });
  };

  const closeEditor = (force = false) => {
    if (dirty && !force) {
      Alert.alert(
        t('addressBook.unsavedTitle'),
        t('addressBook.unsavedDescription'),
        [
          { text: t('addressBook.keepEditing'), style: 'cancel' },
          { text: t('addressBook.discard'), style: 'destructive', onPress: () => closeEditor(true) },
        ],
      );
      return;
    }
    setEditor(null);
    setDirty(false);
  };

  const save = (address: Address) => {
    const editing = editor?.mode === 'edit';
    saveLocalAddress({
      ...address,
      id: editing ? editor.address.id : '',
      isDefault: address.isDefault || addresses.length === 0,
    });
    const message = t(editing ? 'addressBook.editedFeedback' : 'addressBook.createdFeedback');
    setEditor(null);
    setDirty(false);
    setFeedback(message);
    AccessibilityInfo.announceForAccessibility(message);
  };

  const makeDefault = (address: Address) => {
    if (address.isDefault) return;
    setDefaultLocalAddress(address.id);
    const message = t('addressBook.defaultUpdated');
    setFeedback(message);
    AccessibilityInfo.announceForAccessibility(message);
  };

  const showMore = (address: Address) => {
    Alert.alert(
      getLabel(address),
      t('addressBook.deleteDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('addressBook.delete'),
          style: 'destructive',
          onPress: () => {
            deleteLocalAddress(address.id);
            setFeedback(null);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: tokens.background }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel={t('common.back')}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t('addressBook.eyebrow')}</Text>
          <Text style={styles.title}>{t('addressBook.title')}</Text>
        </View>
        <Pressable
          accessibilityLabel={t('addressBook.add')}
          accessibilityRole="button"
          onPress={openCreate}
          style={styles.addButton}
        >
          <Ionicons color={colors.white} name="add" size={20} />
          <Text numberOfLines={2} style={styles.addText}>{t('addressBook.add')}</Text>
        </Pressable>
      </View>

      {feedback ? (
        <View accessibilityLiveRegion="polite" style={styles.feedback}>
          <Ionicons color={colors.success} name="checkmark-circle" size={18} />
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons color={colors.primary} name="map-outline" size={36} />
            <Text style={styles.emptyTitle}>{t('addressBook.emptyTitle')}</Text>
            <Text style={styles.emptyText}>{t('addressBook.emptyDescription')}</Text>
            <Button icon="add" onPress={openCreate} title={t('addressBook.add')} />
          </View>
        ) : addresses.map((address) => {
          const label = getLabel(address);
          const primaryAddress = address.streetAddress || address.formattedAddress;
          return (
            <View
              accessibilityLabel={t('addressBook.cardAccessibility', {
                address: primaryAddress,
                houseNumber: address.houseNumber,
                label,
              })}
              accessibilityRole="summary"
              accessible
              key={address.id}
              style={styles.card}
            >
              <View style={styles.cardTop}>
                <View style={styles.labelIcon}>
                  <AddressIcon color={colors.primary} iconKey={address.iconKey} />
                </View>
                <View style={styles.cardCopy}>
                  <View style={styles.titleRow}>
                    <Text numberOfLines={1} style={styles.cardTitle}>{label}</Text>
                    {address.isDefault ? (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>{t('addressBook.defaultBadge')}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={styles.address}>{primaryAddress}</Text>
                  <Text numberOfLines={1} style={styles.houseNumber}>{address.houseNumber}</Text>
                  {address.reference ? (
                    <Text numberOfLines={1} style={styles.reference}>{address.reference}</Text>
                  ) : null}
                  <View style={styles.preferencesSummary}>
                    <AddressPreferencesSummary context="delivery" value={address.deliveryPreferences} />
                  </View>
                </View>
              </View>
              <View style={styles.quickActions}>
                <Pressable
                  accessibilityHint={address.isDefault ? t('addressBook.alreadyDefault') : t('addressBook.defaultUpdated')}
                  accessibilityLabel={address.isDefault ? t('addressBook.alreadyDefault') : t('addressBook.makeDefault')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: address.isDefault }}
                  hitSlop={6}
                  onPress={() => makeDefault(address)}
                  style={styles.iconButton}
                >
                  <Ionicons
                    color={address.isDefault ? colors.warning : colors.textMuted}
                    name={address.isDefault ? 'star' : 'star-outline'}
                    size={21}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel={`${t('addressBook.edit')}: ${label}`}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => openEdit(address)}
                  style={styles.iconButton}
                >
                  <Ionicons color={colors.text} name="create-outline" size={20} />
                </Pressable>
                <Pressable
                  accessibilityLabel={t('addressBook.moreOptions', { label })}
                  accessibilityRole="button"
                  hitSlop={6}
                  onPress={() => showMore(address)}
                  style={styles.iconButton}
                >
                  <Ionicons color={colors.text} name="ellipsis-horizontal" size={21} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => closeEditor()}
        presentationStyle="pageSheet"
        visible={Boolean(editor)}
      >
        <SafeAreaView
          edges={['top', 'bottom']}
          style={[styles.modalSafe, { backgroundColor: tokens.background }]}
        >
          {editor ? (
            <>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderCopy}>
                  <Text style={styles.eyebrow}>{t('addressBook.eyebrow')}</Text>
                  <Text style={styles.modalTitle}>
                    {t(editor.mode === 'edit' ? 'addressBook.editTitle' : 'addressBook.createTitle')}
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel={t('addressBook.close')}
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => closeEditor()}
                  style={styles.headerIcon}
                >
                  <Ionicons color={colors.text} name="close" size={23} />
                </Pressable>
              </View>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={8}
                style={styles.modalBody}
              >
                <ScrollView
                  contentContainerStyle={styles.editorScroll}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <AddressEditor
                    initialAddress={editor.address}
                    mode={editor.mode}
                    onCancel={() => closeEditor()}
                    onDirtyChange={setDirty}
                    onSave={save}
                  />
                </ScrollView>
              </KeyboardAvoidingView>
            </>
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    minHeight: 76,
    overflow: 'visible',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerIcon: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerCopy: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, fontWeight: '900', marginTop: 2, overflow: 'visible', paddingBottom: 2 },
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 15,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    minHeight: 44,
    maxWidth: 132,
    paddingHorizontal: 10,
  },
  addText: { color: colors.white, flexShrink: 1, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', lineHeight: 15, textAlign: 'center' },
  feedback: {
    alignItems: 'center',
    backgroundColor: '#e7f5ef',
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 13,
  },
  feedbackText: { color: colors.success, flex: 1, fontFamily: fonts.bold, fontSize: 13, fontWeight: '800' },
  list: { gap: 10, padding: 18, paddingBottom: 42 },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingTop: 13,
  },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 },
  labelIcon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 13,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  cardCopy: { flex: 1, minWidth: 0 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  cardTitle: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  defaultBadge: { backgroundColor: '#fff6dc', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  defaultBadgeText: { color: '#9a6d08', fontFamily: fonts.bold, fontSize: 9, fontWeight: '900' },
  address: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '700', lineHeight: 18, marginTop: 4 },
  houseNumber: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  reference: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11, marginTop: 3 },
  preferencesSummary: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 9, paddingTop: 8 },
  quickActions: {
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    minHeight: 48,
  },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 48 },
  empty: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    borderRadius: 20,
    gap: 10,
    marginTop: 24,
    padding: 24,
  },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, marginBottom: 4, textAlign: 'center' },
  modalSafe: { backgroundColor: colors.background, flex: 1 },
  modalHeader: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  modalHeaderCopy: { flex: 1 },
  modalTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 22, fontWeight: '900', marginTop: 2 },
  modalBody: { flex: 1 },
  editorScroll: { padding: 18, paddingBottom: 44 },
});
