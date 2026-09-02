import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useEffect,
  useMemo,
  useState } from 'react';
import { Modal,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import {
  createMockFavoriteProviderList,
  getMockFavoriteProviderLists,
  getMockProviderFavoriteListIds,
  getSuggestedFavoriteListIds,
  saveMockProviderFavoriteLists,
  type MockFavoriteProviderList,
} from '@/constants/mockData';
import { getMockProviderPhotoUri, type MockProvider } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import { Pressable, Text, TextInput } from '@/i18n/components';

type FavoriteProviderListsModalProps = {
  provider: MockProvider | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function FavoriteProviderListsModal({
  provider,
  visible,
  onClose,
  onSaved,
}: FavoriteProviderListsModalProps) {
  const [lists, setLists] = useState<MockFavoriteProviderList[]>(() => getMockFavoriteProviderLists());
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listNameError, setListNameError] = useState('');

  const suggestedListIds = useMemo(
    () => (provider ? getSuggestedFavoriteListIds(provider.id) : []),
    [provider],
  );

  useEffect(() => {
    if (!provider || !visible) {
      return;
    }

    const nextLists = getMockFavoriteProviderLists();
    const currentListIds = getMockProviderFavoriteListIds(provider.id);
    setLists(nextLists);
    setSelectedListIds(currentListIds.length > 0 ? currentListIds : getSuggestedFavoriteListIds(provider.id));
    setCreatingList(false);
    setNewListName('');
    setListNameError('');
  }, [provider, visible]);

  const toggleList = (listId: string) => {
    setSelectedListIds((current) => (
      current.includes(listId)
        ? current.filter((id) => id !== listId)
        : [...current, listId]
    ));
  };

  const createList = () => {
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      setListNameError('Escribe un nombre para tu lista.');
      return;
    }

    if (lists.some((list) => list.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setListNameError('Ya existe una lista con ese nombre.');
      return;
    }

    const nextLists = createMockFavoriteProviderList(trimmedName);
    const newest = nextLists.find((list) => list.name.trim().toLowerCase() === trimmedName.toLowerCase());
    setLists(nextLists);
    if (newest) {
      setSelectedListIds((current) => Array.from(new Set([...current, newest.id])));
    }
    setCreatingList(false);
    setNewListName('');
    setListNameError('');
  };

  const save = () => {
    if (!provider) {
      return;
    }

    saveMockProviderFavoriteLists(provider.id, selectedListIds);
    onSaved();
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>__hupi_i18n:components.FavoriteProviderListsModal.saveSupplier</Text>
              <Text style={styles.text}>__hupi_i18n:components.FavoriteProviderListsModal.chooseWhichListYouWantToSaveThisWalker</Text>
            </View>
            <Pressable accessibilityLabel="__hupi_i18n:common.close" onPress={onClose} style={styles.closeButton}>
              <Ionicons color={colors.textMuted} name="close" size={19} />
            </Pressable>
          </View>

          <View style={styles.providerRow}>
            <ProfileAvatar
              size={48}
              style={styles.avatar}
              type="provider"
              uri={provider ? getMockProviderPhotoUri(provider.id) : undefined}
            />
            <View style={styles.providerCopy}>
              <Text style={styles.providerName}>{provider?.name ?? 'Proveedor Hupi'}</Text>
              <Text style={styles.providerMeta}>__hupi_i18n:components.FavoriteProviderListsModal.youCanSelectOneOrMoreListsOfWalkers</Text>
            </View>
          </View>

          <View style={styles.lists}>
            {lists.map((list) => {
              const checked = selectedListIds.includes(list.id);
              const suggested = suggestedListIds.includes(list.id);

              return (
                <Pressable key={list.id} onPress={() => toggleList(list.id)} style={[styles.listRow, checked && styles.activeListRow]}>
                  <View style={[styles.checkbox, checked && styles.checkedBox]}>
                    {checked ? <Ionicons color={colors.white} name="checkmark" size={14} /> : null}
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listMeta}>
                      {list.providerIds.length}  __hupi_i18n:common.walker{list.providerIds.length === 1 ? '' : 'es'}
                      {suggested ? ' · sugerida' : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {creatingList ? (
            <View style={styles.createForm}>
              <Text style={styles.inputLabel}>__hupi_i18n:app.favorites.listName</Text>
              <TextInput
                autoFocus
                onChangeText={(value) => {
                  setNewListName(value);
                  setListNameError('');
                }}
                placeholder="__hupi_i18n:app.favorites.exMyTrustedWalkers"
                placeholderTextColor={colors.textMuted}
                style={styles.nameInput}
                value={newListName}
              />
              {listNameError ? <Text style={styles.errorText}>{listNameError}</Text> : null}
              <View style={styles.createActions}>
                <Pressable
                  onPress={() => {
                    setCreatingList(false);
                    setNewListName('');
                    setListNameError('');
                  }}
                  style={styles.inlineAction}
                >
                  <Text style={styles.inlineActionText}>__hupi_i18n:common.cancel</Text>
                </Pressable>
                <Pressable onPress={createList} style={[styles.inlineAction, styles.inlinePrimary]}>
                  <Text style={[styles.inlineActionText, styles.inlinePrimaryText]}>__hupi_i18n:common.save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable onPress={() => setCreatingList(true)} style={styles.createRow}>
              <Ionicons color={colors.secondary} name="add-circle-outline" size={17} />
              <Text style={styles.createText}>__hupi_i18n:app.favorites.createNewList</Text>
            </Pressable>
          )}

          <View style={styles.actions}>
            <Button onPress={onClose} style={styles.actionButton} title="__hupi_i18n:common.cancel" variant="outline" />
            <Button onPress={save} style={styles.actionButton} title="__hupi_i18n:common.save" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(51,51,51,0.32)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  sheet: {
    borderRadius: 24,
    backgroundColor: colors.white,
    padding: 17,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900' },
  text: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, marginTop: 4 },
  closeButton: { marginLeft: 'auto', width: 36, height: 36, borderRadius: 12, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.soft, padding: 10 },
  avatar: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 },
  providerName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  providerMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  lists: { gap: 8 },
  listRow: { minHeight: 50, borderRadius: 15, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 11 },
  activeListRow: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  checkbox: { width: 21, height: 21, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkedBox: { backgroundColor: colors.primary, borderColor: colors.primary },
  listCopy: { flex: 1 },
  listName: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  listMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  createRow: { alignSelf: 'flex-start', minHeight: 34, borderRadius: 999, backgroundColor: colors.secondarySoft, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11 },
  createText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  createForm: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.soft, padding: 12, gap: 8 },
  inputLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  nameInput: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingHorizontal: 11 },
  errorText: { color: colors.danger, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800' },
  createActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  inlineAction: { minHeight: 32, borderRadius: 11, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 12 },
  inlinePrimary: { backgroundColor: colors.primary },
  inlineActionText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  inlinePrimaryText: { color: colors.white },
  actions: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1 },
});
