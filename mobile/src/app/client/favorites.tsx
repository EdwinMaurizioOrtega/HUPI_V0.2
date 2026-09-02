import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import { useMemo,
  useState } from 'react';
import { Alert,
  Modal,
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiVerifiedBadge } from '@/components/providers/HupiVerifiedBadge';
import { FavoriteProviderListsModal } from '@/components/providers/FavoriteProviderListsModal';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { RatingBadge } from '@/components/providers/RatingBadge';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import {
  createMockFavoriteProviderList,
  createMockServiceCoordinationRequest,
  deleteMockFavoriteProviderList,
  getMockFavoriteProviderListById,
  getMockFavoriteProviderLists,
  removeMockProviderFromAllFavoriteLists,
  removeMockProviderFromFavoriteList,
  renameMockFavoriteProviderList,
  type MockFavoriteProviderList,
} from '@/constants/mockData';
import { getMockProviderPhotoUri, getMockProviderServicePrice, mockProviders, type MockProvider } from '@/constants/mockProviders';
import { serviceCopy } from '@/constants/services';
import { fonts } from '@/constants/typography';
import { Pressable, Text, TextInput } from '@/i18n/components';

export default function FavoritesScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId?: string }>();
  const [lists, setLists] = useState<MockFavoriteProviderList[]>(() => getMockFavoriteProviderLists());
  const [activeListId, setActiveListId] = useState<string | undefined>(listId);
  const [modalProvider, setModalProvider] = useState<MockProvider | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [createListError, setCreateListError] = useState('');

  const activeList = useMemo(
    () => lists.find((list) => list.id === activeListId) ?? getMockFavoriteProviderListById(activeListId),
    [activeListId, lists],
  );

  const listProviders = useMemo(() => (
    activeList
      ? mockProviders.filter((provider) => activeList.providerIds.includes(provider.id))
      : []
  ), [activeList]);

  const refreshLists = () => setLists(getMockFavoriteProviderLists());

  const createList = () => {
    const trimmedName = newListName.trim();

    if (!trimmedName) {
      setCreateListError('Escribe un nombre para tu lista.');
      return;
    }

    if (lists.some((list) => list.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      setCreateListError('Ya existe una lista con ese nombre.');
      return;
    }

    const nextLists = createMockFavoriteProviderList(trimmedName);
    const createdList = nextLists.find((list) => list.name.trim().toLowerCase() === trimmedName.toLowerCase());
    refreshAndSelect(createdList?.id);
    setCreateModalVisible(false);
    setNewListName('');
    setCreateListError('');
    Alert.alert('Lista creada', "__hupi_i18n:app.favorites.youCanNowSaveSuppliersToThisList");
  };

  const refreshAndSelect = (nextListId?: string) => {
    const nextLists = getMockFavoriteProviderLists();
    setLists(nextLists);
    if (nextListId) {
      setActiveListId(nextListId);
    }
  };

  const renameList = (list: MockFavoriteProviderList) => {
    setLists(renameMockFavoriteProviderList(list.id, `${list.name} editada`));
  };

  const deleteList = (list: MockFavoriteProviderList) => {
    setLists(deleteMockFavoriteProviderList(list.id));
    if (activeListId === list.id) {
      setActiveListId(undefined);
    }
  };

  const openProviderPlan = (provider: MockProvider) => {
    router.push(`/client/provider-detail?providerId=${provider.id}&serviceId=walk` as Href);
  };

  const coordinate = (provider: MockProvider) => {
    const request = createMockServiceCoordinationRequest({
      providerId: provider.id,
      serviceType: 'walk',
    });
    router.push(`/chat?chatId=${request.chatId}&viewer=client` as Href);
  };

  const removeFromCurrentList = (providerId: string) => {
    if (!activeList) {
      return;
    }
    setLists(removeMockProviderFromFavoriteList(activeList.id, providerId));
  };

  const removeCompletely = (providerId: string) => {
    setLists(removeMockProviderFromAllFavoriteLists(providerId));
    Alert.alert("__hupi_i18n:app.favorites.supplierRemovedFromFavorites", "__hupi_i18n:app.favorites.itWasRemovedFromAllYourLists");
  };

  const onModalSaved = () => {
    refreshLists();
    Alert.alert("__hupi_i18n:common.supplierSavedInFavorites", "__hupi_i18n:common.yourListsHaveBeenUpdated");
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <View style={styles.topbar}>
        <Pressable accessibilityLabel="__hupi_i18n:common.back" onPress={() => (activeList ? setActiveListId(undefined) : router.back())} style={styles.backButton}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>__hupi_i18n:common.walkers</Text>
          <Text style={styles.title}>__hupi_i18n:common.myFavorites</Text>
        </View>
      </View>

      {!activeList ? (
        <>
          <Card style={styles.createCard} tone="soft">
            <View style={styles.createCopy}>
              <Text style={styles.createTitle}>__hupi_i18n:common.savedLists</Text>
              <Text style={styles.createText}>__hupi_i18n:app.favorites.organizeWalkersByRoutineAreaOrTrust</Text>
            </View>
            <Pressable onPress={() => setCreateModalVisible(true)} style={styles.createButton}>
              <Ionicons color={colors.white} name="add" size={18} />
            </Pressable>
          </Card>

          <View style={styles.lists}>
            {lists.map((list) => (
              <Card key={list.id} style={styles.listCard}>
                <Pressable onPress={() => setActiveListId(list.id)} style={styles.listMain}>
                  <View style={styles.listIcon}>
                    <Ionicons color={colors.primary} name="heart" size={19} />
                  </View>
                  <View style={styles.listCopy}>
                    <Text style={styles.listName}>{list.name}</Text>
                    <Text style={styles.listMeta}>{list.providerIds.length}  __hupi_i18n:common.walker{list.providerIds.length === 1 ? '' : 'es'}</Text>
                  </View>
                  <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
                </Pressable>
                <View style={styles.listActions}>
                  <Pressable onPress={() => renameList(list)} style={styles.listAction}>
                    <Text style={styles.listActionText}>__hupi_i18n:common.editList</Text>
                  </Pressable>
                  <Pressable disabled={list.locked} onPress={() => deleteList(list)} style={[styles.listAction, list.locked && styles.disabledAction]}>
                    <Text style={[styles.listActionText, styles.deleteText]}>__hupi_i18n:common.deleteList</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        </>
      ) : (
        <>
          <Card style={styles.activeListHeader} tone="soft">
            <Text style={styles.activeListName}>{activeList.name}</Text>
            <Text style={styles.activeListText}>{activeList.providerIds.length}  __hupi_i18n:common.walker{activeList.providerIds.length === 1 ? '' : 'es'}  __hupi_i18n:common.saved{activeList.providerIds.length === 1 ? '' : 's'}</Text>
          </Card>

          <View style={styles.providers}>
            {listProviders.length === 0 ? (
              <Text style={styles.emptyText}>__hupi_i18n:app.favorites.thisListHasNoSavedWalkers</Text>
            ) : listProviders.map((provider) => (
              <FavoriteProviderCard
                key={provider.id}
                onChoosePlan={() => openProviderPlan(provider)}
                onCoordinate={() => coordinate(provider)}
                onManage={() => setModalProvider(provider)}
                onRemoveAll={() => removeCompletely(provider.id)}
                onRemoveFromList={() => removeFromCurrentList(provider.id)}
                provider={provider}
              />
            ))}
          </View>
        </>
      )}

      <FavoriteProviderListsModal
        onClose={() => setModalProvider(null)}
        onSaved={onModalSaved}
        provider={modalProvider}
        visible={Boolean(modalProvider)}
      />

      <Modal animationType="fade" transparent visible={createModalVisible} onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>__hupi_i18n:app.favorites.createNewList</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>__hupi_i18n:app.favorites.listName</Text>
              <TextInput
                autoFocus
                onChangeText={(value) => {
                  setNewListName(value);
                  setCreateListError('');
                }}
                placeholder="__hupi_i18n:app.favorites.exMyTrustedWalkers"
                placeholderTextColor={colors.textMuted}
                style={styles.nameInput}
                value={newListName}
              />
              {createListError ? <Text style={styles.errorText}>{createListError}</Text> : null}
            </View>
            <View style={styles.modalActions}>
              <Button
                onPress={() => {
                  setCreateModalVisible(false);
                  setNewListName('');
                  setCreateListError('');
                }}
                style={styles.modalButton}
                title="__hupi_i18n:common.cancel"
                variant="outline"
              />
              <Button onPress={createList} style={styles.modalButton} title="__hupi_i18n:common.save" />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function FavoriteProviderCard({
  onChoosePlan,
  onCoordinate,
  onManage,
  onRemoveAll,
  onRemoveFromList,
  provider,
}: {
  onChoosePlan: () => void;
  onCoordinate: () => void;
  onManage: () => void;
  onRemoveAll: () => void;
  onRemoveFromList: () => void;
  provider: MockProvider;
}) {
  const serviceLabels = serviceCopy.walk.label;
  const price = getMockProviderServicePrice(provider, 'walk');
  const providerPhotoUri = getMockProviderPhotoUri(provider.id);

  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerHeader}>
        <ProfileAvatar size={54} style={styles.providerAvatar} type="provider" uri={providerPhotoUri} />
        <View style={styles.providerCopy}>
          <View style={styles.providerNameRow}>
            <Text numberOfLines={1} style={styles.providerName}>{provider.name}</Text>
            <Ionicons color={colors.primary} name="heart" size={18} />
          </View>
          <View style={styles.badgeRow}><HupiVerifiedBadge /></View>
          <View style={styles.providerMeta}>
            <RatingBadge rating={provider.rating} reviews={provider.reviewCount} />
            <Text style={styles.zone}>{provider.zone}</Text>
          </View>
          <Text style={styles.services}>{serviceLabels}</Text>
          <Text style={styles.price}>__hupi_i18n:common.from{price.toFixed(2)}</Text>
        </View>
      </View>
      <Button icon="albums-outline" onPress={onChoosePlan} title="__hupi_i18n:common.choosePlan" />
      <Button icon="chatbubbles-outline" onPress={onCoordinate} title="__hupi_i18n:common.coordinate" variant="outline" />
      <View style={styles.manageRow}>
        <Pressable onPress={onManage} style={styles.manageButton}><Text style={styles.manageText}>__hupi_i18n:common.manageLists</Text></Pressable>
        <Pressable onPress={onRemoveFromList} style={styles.manageButton}><Text style={styles.manageText}>__hupi_i18n:app.favorites.removeFromThisList</Text></Pressable>
        <Pressable onPress={onRemoveAll} style={styles.manageButton}><Text style={[styles.manageText, styles.deleteText]}>__hupi_i18n:app.favorites.removeFromFavorites</Text></Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, overflow: 'visible' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 0, overflow: 'visible', paddingBottom: 3 },
  eyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, flexShrink: 1, fontFamily: fonts.bold, fontSize: 28, lineHeight: 36, fontWeight: '900', marginTop: 3, overflow: 'visible', paddingBottom: 2 },
  createCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22, shadowOpacity: 0 },
  createCopy: { flex: 1 },
  createTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  createText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 19, marginTop: 4 },
  createButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51,51,51,0.32)', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 22, backgroundColor: colors.white, padding: 18, gap: 14 },
  modalTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  nameInput: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.soft, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingHorizontal: 12 },
  errorText: { color: colors.danger, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800' },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalButton: { flex: 1 },
  lists: { gap: 11, marginTop: 16 },
  listCard: { gap: 12, shadowOpacity: 0.05 },
  listMain: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  listIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  listCopy: { flex: 1 },
  listName: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  listMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, marginTop: 3 },
  listActions: { flexDirection: 'row', gap: 8 },
  listAction: { minHeight: 32, borderRadius: 11, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 10 },
  disabledAction: { opacity: 0.45 },
  listActionText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  deleteText: { color: colors.danger },
  activeListHeader: { gap: 4, marginTop: 20, shadowOpacity: 0 },
  activeListName: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, fontWeight: '900' },
  activeListText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
  providers: { gap: 12, marginTop: 14 },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  providerCard: { gap: 12, shadowOpacity: 0.06 },
  providerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerAvatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  providerCopy: { flex: 1 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerName: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  badgeRow: { alignSelf: 'flex-start', marginTop: 5 },
  providerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  zone: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, flex: 1 },
  services: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, fontWeight: '800', marginTop: 6 },
  price: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900', marginTop: 4 },
  manageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  manageButton: { minHeight: 30, borderRadius: 10, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 9 },
  manageText: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
});
