import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { type Href,
  useFocusEffect,
  useRouter } from 'expo-router';
import { useCallback,
  useMemo,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { AddressEditor, emptyAddressDraft } from '@/components/addresses/AddressEditor';
import { AddressIcon } from '@/components/addresses/AddressIcon';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { NativeDatePickerField, NativeTimePickerField } from '@/components/NativeDateTimeFields';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { colors } from '@/constants/colors';
import {
  getMockAddresses,
  getMockPets,
  saveMockAddress,
  setSelectedServicePet,
  type MockAddress,
  type MockPetProfile,
} from '@/constants/mockData';
import type { BookableServiceId, ServiceId } from '@/constants/services';
import { isBookableServiceId, serviceCopy, services } from '@/constants/services';
import { fonts } from '@/constants/typography';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import type { AddressIconKey } from '@/domain/address';

type ServiceFormProps = {
  serviceId: ServiceId;
};

type ServiceFieldsProps = {
  serviceId: BookableServiceId;
  walkState: WalkFormState;
};

type WalkFormState = {
  addressFeedback: string | null;
  addressFormMode: 'create' | 'edit';
  addressFormVisible: boolean;
  addresses: MockAddress[];
  currentLocationKey?: number;
  draftAddress: MockAddress;
  durationDraft: string;
  durationHours: number;
  locationModalVisible: boolean;
  minimumDate: Date;
  onAddressModalClose: () => void;
  onCancelAddressForm: () => void;
  onDateConfirm: (date: Date) => void;
  onDurationBlur: () => void;
  onDurationDraftChange: (value: string) => void;
  onDurationStep: (direction: -1 | 1) => void;
  onEditAddress: (address: MockAddress) => void;
  onOpenAddressModal: () => void;
  onOpenNewAddress: () => void;
  onSelectAddress: (address: MockAddress) => void;
  onSaveAddress: (address: MockAddress) => void;
  onStartCurrentLocation: () => void;
  onTimeConfirm: (time: Date) => boolean;
  selectedAddress?: MockAddress;
  selectedDate: Date | null;
  selectedTime: Date | null;
  scheduleNotice: string | null;
};

const WALK_DURATION_LIMITS = {
  min: 1,
  max: 4,
};

function ServiceFields({ serviceId, walkState }: ServiceFieldsProps) {
  if (serviceId === 'boarding') {
    return (
      <>
        <View style={styles.twoColumns}>
          <Input containerStyle={styles.flexInput} icon="calendar-outline" label="__hupi_i18n:common.entryDate" value="12/07/2026" />
          <Input containerStyle={styles.flexInput} icon="calendar-outline" label="__hupi_i18n:common.departureDate" value="13/07/2026" />
        </View>
        <Input icon="time-outline" label="__hupi_i18n:home.ServiceForm.approximateDeliveryTime" value="09:00" />
        <Input icon="hourglass-outline" label="__hupi_i18n:home.ServiceForm.estimatedDuration" value="1 noche" />
        <Input icon="location-outline" label="__hupi_i18n:common.area" value="La Carolina, Quito" />
        <Input label="__hupi_i18n:common.notes" multiline placeholder="__hupi_i18n:home.ServiceForm.tellUsAboutSleepNutritionOrSpecialCare" />
        <View style={styles.conditions}>
          <Ionicons color={colors.secondary} name="shield-checkmark-outline" size={21} />
          <Text style={styles.conditionsText}>

            __hupi_i18n:home.ServiceForm.conditionsUpToDateVaccinationsIdentifiedFoodAndEmergency
          </Text>
        </View>
      </>
    );
  }

  if (serviceId === 'daycare') {
    return (
      <>
        <Input icon="calendar-outline" label="__hupi_i18n:common.date" value="12/07/2026" />
        <View style={styles.twoColumns}>
          <Input containerStyle={styles.flexInput} icon="time-outline" label="__hupi_i18n:common.checkInTime" value="08:00" />
          <Input containerStyle={styles.flexInput} icon="time-outline" label="__hupi_i18n:common.departureTime" value="16:00" />
        </View>
        <Input icon="hourglass-outline" label="__hupi_i18n:home.ServiceForm.estimatedDuration" value="8 horas" />
        <Input icon="location-outline" label="__hupi_i18n:common.area" value="La Carolina, Quito" />
        <Input label="__hupi_i18n:common.notes" multiline placeholder="__hupi_i18n:home.ServiceForm.tellUsAboutSocializationOrSpecialCare" />
      </>
    );
  }

  if (serviceId === 'sitter') {
    return (
      <>
        <View style={styles.twoColumns}>
          <Input containerStyle={styles.flexInput} icon="calendar-outline" label="__hupi_i18n:common.date" value="12/07/2026" />
          <Input containerStyle={styles.flexInput} icon="time-outline" label="__hupi_i18n:common.startTime" value="14:00" />
        </View>
        <Input icon="hourglass-outline" label="__hupi_i18n:home.ServiceForm.estimatedDuration" value="2 horas" />
        <Input icon="location-outline" label="__hupi_i18n:common.location" value="La Carolina, Quito" />
        <Input label="__hupi_i18n:common.notes" multiline placeholder="__hupi_i18n:home.ServiceForm.tellUsAboutYourRoutineOrSpecialCare" />
      </>
    );
  }

  return <WalkFields state={walkState} />;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function formatAddressLabel(address?: MockAddress) {
  if (!address) {
    return 'Selecciona una ubicación';
  }
  return address.formattedAddress || address.address;
}

function WalkFields({ state }: { state: WalkFormState }) {
  const { tokens } = useTheme();
  const canDecrease = state.durationHours > WALK_DURATION_LIMITS.min;
  const canIncrease = state.durationHours < WALK_DURATION_LIMITS.max;

  return (
    <>
      <View style={styles.twoColumns}>
        <NativeDatePickerField
          containerStyle={styles.flexInput}
          label="__hupi_i18n:common.date"
          minimumDate={state.minimumDate}
          onConfirm={state.onDateConfirm}
          value={state.selectedDate}
        />
        <NativeTimePickerField
          containerStyle={styles.flexInput}
          label="__hupi_i18n:common.time"
          onConfirm={state.onTimeConfirm}
          value={state.selectedTime}
        />
      </View>
      {state.scheduleNotice ? <Text style={styles.scheduleNotice}>{state.scheduleNotice}</Text> : null}

      <View style={styles.durationBlock}>
        <Text style={styles.inputLabel}>__hupi_i18n:common.duration</Text>
        <View
          style={[
            styles.durationControl,
            { backgroundColor: tokens.inputPurple, borderColor: tokens.border },
          ]}
        >
          <Pressable
            accessibilityLabel="__hupi_i18n:home.ServiceForm.decreaseDuration"
            disabled={!canDecrease}
            onPress={() => state.onDurationStep(-1)}
            style={[styles.durationButton, !canDecrease && styles.disabledDurationButton]}
          >
            <Ionicons color={colors.primary} name="remove" size={21} />
          </Pressable>
          <TextInput
            keyboardType="number-pad"
            onBlur={state.onDurationBlur}
            onChangeText={state.onDurationDraftChange}
            style={styles.durationInput}
            textAlign="center"
            value={state.durationDraft}
          />
          <Text style={styles.durationUnit}>{Number(state.durationDraft) === 1 ? 'hora' : 'horas'}</Text>
          <Pressable
            accessibilityLabel="__hupi_i18n:home.ServiceForm.increaseDuration"
            disabled={!canIncrease}
            onPress={() => state.onDurationStep(1)}
            style={[styles.durationButton, !canIncrease && styles.disabledDurationButton]}
          >
            <Ionicons color={colors.primary} name="add" size={21} />
          </Pressable>
        </View>
      </View>

      <ReadonlyField
        iconKey={state.selectedAddress?.iconKey ?? 'location'}
        label="__hupi_i18n:common.location"
        onPress={state.onOpenAddressModal}
        value={formatAddressLabel(state.selectedAddress)}
      />
      {state.addressFeedback ? <Text style={styles.addressFeedback}>{state.addressFeedback}</Text> : null}
      <AddressPickerModal state={state} />
      <Input label="__hupi_i18n:common.notes" multiline placeholder="__hupi_i18n:home.ServiceForm.tellUsAboutYourRoutineOrSpecialCare" />
    </>
  );
}

function ReadonlyField({
  containerStyle,
  iconKey,
  label,
  onPress,
  value,
}: {
  containerStyle?: object;
  iconKey: AddressIconKey;
  label: string;
  onPress: () => void;
  value: string;
}) {
  const { tokens } = useTheme();
  return (
    <View style={[styles.readonlyWrapper, containerStyle]}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        style={[
          styles.readonlyShell,
          { backgroundColor: tokens.inputPurple, borderColor: tokens.border },
        ]}
      >
        <AddressIcon color={colors.textMuted} iconKey={iconKey} size={19} />
        <Text numberOfLines={2} style={styles.readonlyValue}>{value}</Text>
      </Pressable>
    </View>
  );
}

function AddressPickerModal({ state }: { state: WalkFormState }) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();

  return (
    <Modal
      animationType="slide"
      onRequestClose={state.onAddressModalClose}
      transparent
      visible={state.locationModalVisible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalBackdrop, { backgroundColor: tokens.overlay }]}
      >
        <View
          style={[
            styles.locationSheet,
            {
              backgroundColor: tokens.elevatedPurple,
              paddingBottom: Math.max(insets.bottom, 18),
            },
          ]}
        >
          {state.addressFormVisible ? (
            <ScrollView
              contentContainerStyle={styles.locationSheetContent}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <AddressEditor
                initialAddress={state.draftAddress}
                mode={state.addressFormMode}
                onCancel={state.onCancelAddressForm}
                onSave={state.onSaveAddress}
                startWithCurrentLocationKey={state.currentLocationKey}
              />
            </ScrollView>
          ) : (
            <>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>__hupi_i18n:home.ServiceForm.selectALocation</Text>
                <Pressable accessibilityLabel="__hupi_i18n:home.ServiceForm.closeLocations" onPress={state.onAddressModalClose} style={styles.closeButton}>
                  <Ionicons color={colors.text} name="close" size={20} />
                </Pressable>
              </View>

              <ScrollView
                contentContainerStyle={styles.locationSheetContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {state.addressFeedback ? (
                  <View style={styles.addressFeedbackBanner}>
                    <Ionicons color={colors.success} name="checkmark-circle" size={18} />
                    <Text style={styles.addressFeedbackBannerText}>{state.addressFeedback}</Text>
                  </View>
                ) : null}
                {state.addresses.length === 0 ? (
                  <View style={styles.emptyAddresses}>
                    <Ionicons color={colors.primary} name="location-outline" size={28} />
                    <Text style={styles.emptyTitle}>__hupi_i18n:home.ServiceForm.youDoNotHaveSavedLocations</Text>
                    <Text style={styles.emptyText}>__hupi_i18n:home.ServiceForm.addAnAddressToFindWalkersNearYou</Text>
                    <Button icon="add-circle-outline" onPress={state.onOpenNewAddress} title="__hupi_i18n:profile.addresses.addLocation" />
                    <Button icon="navigate-outline" onPress={state.onStartCurrentLocation} title="__hupi_i18n:profile.addresses.useMyCurrentLocation" variant="outline" />
                  </View>
                ) : (
                  <>
                    <View style={styles.addressList}>
                      {state.addresses.map((address) => {
                        const active = state.selectedAddress?.id === address.id;
                        return (
                          <View
                            key={address.id}
                            style={[styles.addressOption, active && styles.activeAddressOption]}
                          >
                            <Pressable onPress={() => state.onSelectAddress(address)} style={styles.addressSelectArea}>
                              <View style={[styles.addressIcon, active && styles.activeAddressIcon]}>
                                <AddressIcon
                                  color={active ? colors.primary : colors.secondary}
                                  iconKey={address.iconKey}
                                  size={20}
                                />
                              </View>
                              <View style={[styles.radio, active && styles.activeRadio]}>
                                {active ? <View style={styles.radioDot} /> : null}
                              </View>
                              <View style={styles.addressCopy}>
                                <View style={styles.addressTitleRow}>
                                  <Text style={[styles.addressLabel, active && styles.activeAddressText]}>{address.label}</Text>
                                  {address.isDefault ? <Text style={styles.defaultBadge}>__hupi_i18n:common.default</Text> : null}
                                </View>
                                <Text style={styles.addressText}>{address.formattedAddress || address.address}</Text>
                                {address.sector ? <Text style={styles.addressMeta}>{address.sector}</Text> : null}
                                {address.reference ? <Text style={styles.addressMeta}>{address.reference}</Text> : null}
                              </View>
                            </Pressable>
                            <Pressable onPress={() => state.onEditAddress(address)} style={styles.editAddressButton}>
                              <Text style={styles.editAddressText}>__hupi_i18n:common.edit</Text>
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                    <Button icon="add-circle-outline" onPress={state.onOpenNewAddress} title="__hupi_i18n:home.ServiceForm.addNewLocation" />
                    <Button icon="navigate-outline" onPress={state.onStartCurrentLocation} title="__hupi_i18n:profile.addresses.useMyCurrentLocation" variant="outline" />
                  </>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ServiceForm({ serviceId }: ServiceFormProps) {
  const router = useRouter();
  const [pickup, setPickup] = useState(true);
  const [pets, setPets] = useState(() => getMockPets());
  const [addresses, setAddresses] = useState(() => getMockAddresses());
  const [selectedPetId, setSelectedPetId] = useState(() => getMockPets()[0]?.id ?? '');
  const [selectedAddressId, setSelectedAddressId] = useState(() => getMockAddresses().find((address) => address.isDefault)?.id ?? getMockAddresses()[0]?.id ?? '');
  const [walkDate, setWalkDate] = useState<Date | null>(null);
  const [walkTime, setWalkTime] = useState<Date | null>(null);
  const [durationHours, setDurationHours] = useState(WALK_DURATION_LIMITS.min);
  const [durationDraft, setDurationDraft] = useState(String(WALK_DURATION_LIMITS.min));
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [addressFormMode, setAddressFormMode] = useState<'create' | 'edit'>('create');
  const [isAddressFormVisible, setIsAddressFormVisible] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [draftAddress, setDraftAddress] = useState<MockAddress>(() => ({ ...emptyAddressDraft }));
  const [currentLocationKey, setCurrentLocationKey] = useState(0);
  const [editorStartsWithCurrentLocation, setEditorStartsWithCurrentLocation] = useState(false);
  const [addressFeedback, setAddressFeedback] = useState<string | null>(null);
  const [scheduleNotice, setScheduleNotice] = useState<string | null>(null);
  const selectedService = services.find((service) => service.id === serviceId) ?? services[0];
  const activeBookableServiceId = isBookableServiceId(serviceId) ? serviceId : 'walk';
  const minimumDate = useMemo(() => startOfToday(), []);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) ?? addresses.find((address) => address.isDefault) ?? addresses[0];

  useFocusEffect(useCallback(() => {
    const nextPets = getMockPets();
    const nextAddresses = getMockAddresses();
    setPets(nextPets);
    setAddresses(nextAddresses);
    setSelectedPetId((current) => current || nextPets[0]?.id || '');
    setSelectedAddressId((current) => current || nextAddresses.find((address) => address.isDefault)?.id || nextAddresses[0]?.id || '');
    if (nextPets[0]?.id) {
      setSelectedServicePet(nextPets[0].id);
    }
  }, []));

  const subtitles: Record<Exclude<ServiceId, 'marketplace'>, string> = {
    walk: serviceCopy.walk.homeSubtitle,
    sitter: serviceCopy.sitter.homeSubtitle,
    boarding: serviceCopy.boarding.homeSubtitle,
    daycare: serviceCopy.daycare.homeSubtitle,
    grooming: 'Encuentra peluquerías cerca de ti',
    training: 'Encuentra adiestradores cerca de ti',
  };

  if (serviceId === 'marketplace') {
    return (
      <Card style={styles.marketplaceCard} tone="purple">
        <View style={styles.marketplaceIcon}>
          <Ionicons color={colors.white} name="bag-handle" size={30} />
        </View>
        <Text style={styles.marketplaceEyebrow}>__hupi_i18n:common.marketplaceHupi2</Text>
        <Text style={styles.marketplaceTitle}>__hupi_i18n:home.ServiceForm.productsThatAlsoMoveTails</Text>
        <Text style={styles.marketplaceCopy}>

          __hupi_i18n:home.ServiceForm.exploreSnacksWalkingWellBeingAndRestQueriesAre
        </Text>
        <Button
          icon="arrow-forward"
          onPress={() => router.push('/marketplace')}
          title="__hupi_i18n:home.home.goToTheMarketplace"
          variant="secondary"
        />
      </Card>
    );
  }

  if (!isBookableServiceId(serviceId)) {
    return (
      <Card style={styles.formCard}>
        <View style={styles.formHeader}>
          <View style={styles.formIcon}>
            <Ionicons
              color={colors.primary}
              name={selectedService.icon as keyof typeof Ionicons.glyphMap}
              size={22}
            />
          </View>
          <View style={styles.formCopy}>
            <Text style={styles.formEyebrow}>__hupi_i18n:common.comingSoon2</Text>
            <Text style={styles.formTitle}>{selectedService.name}</Text>
            <Text style={styles.formDescription}>{subtitles[serviceId]}</Text>
          </View>
        </View>
        <Text style={styles.upcomingText}>

          __hupi_i18n:home.ServiceForm.thisServiceRemainsVisibleForNavigationButIsNot
        </Text>
      </Card>
    );
  }

  const buttonLabels: Record<Exclude<ServiceId, 'marketplace'>, string> = {
    walk: serviceCopy.walk.searchButton,
    sitter: serviceCopy.sitter.searchButton,
    boarding: serviceCopy.boarding.searchButton,
    daycare: serviceCopy.daycare.searchButton,
    grooming: 'Buscar peluquerías',
    training: 'Buscar adiestradores',
  };

  const selectPet = (petId: string) => {
    setSelectedPetId(petId);
    setSelectedServicePet(petId);
  };

  const changeDuration = (next: number) => {
    const bounded = Math.max(WALK_DURATION_LIMITS.min, Math.min(WALK_DURATION_LIMITS.max, next));
    setDurationHours(bounded);
    setDurationDraft(String(bounded));
  };

  const onDurationDraftChange = (value: string) => {
    const numeric = value.replace(/\D/g, '');
    setDurationDraft(numeric);
    if (numeric) {
      changeDuration(Number(numeric));
    }
  };

  const onDurationBlur = () => {
    const numeric = Number(durationDraft);
    if (!Number.isInteger(numeric) || numeric < WALK_DURATION_LIMITS.min) {
      changeDuration(WALK_DURATION_LIMITS.min);
      return;
    }
    changeDuration(numeric);
  };

  const onDateConfirm = (value: Date) => {
    const nextDate = new Date(value);
    nextDate.setHours(0, 0, 0, 0);
    setWalkDate(nextDate);
    setScheduleNotice(null);
    if (walkTime && isSameDay(nextDate, new Date())) {
      const selectedTime = new Date();
      selectedTime.setHours(walkTime.getHours(), walkTime.getMinutes(), 0, 0);
      if (selectedTime.getTime() < Date.now()) {
        setWalkTime(null);
        setScheduleNotice('Selecciona una hora posterior a la actual.');
      }
    }
  };

  const onTimeConfirm = (value: Date) => {
    const selectedDateForValidation = walkDate ?? minimumDate;
    const nextTime = new Date(value);
    if (isSameDay(selectedDateForValidation, new Date())) {
      const todayTime = new Date();
      todayTime.setHours(nextTime.getHours(), nextTime.getMinutes(), 0, 0);
      if (todayTime.getTime() < Date.now()) {
        setScheduleNotice('Selecciona una hora posterior a la actual.');
        return false;
      }
    }
    setWalkTime(nextTime);
    setScheduleNotice(null);
    return true;
  };

  const saveAddressFromEditor = (address: MockAddress) => {
    const wasEditing = addressFormMode === 'edit' && Boolean(editingAddressId);
    const id = editingAddressId ?? `addr-${Date.now()}`;
    const nextAddresses = saveMockAddress({ ...address, id, isDefault: address.isDefault || addresses.length === 0 });
    setAddresses(nextAddresses);
    if (!wasEditing) {
      setSelectedAddressId(id);
    }
    setEditingAddressId(null);
    setDraftAddress({ ...emptyAddressDraft });
    setIsAddressFormVisible(false);
    setEditorStartsWithCurrentLocation(false);
    setLocationModalVisible(wasEditing);
    setAddressFeedback(wasEditing ? 'Dirección actualizada' : 'Ubicación guardada');
  };

  const walkState: WalkFormState = {
    addressFeedback,
    addressFormMode,
    addressFormVisible: isAddressFormVisible,
    addresses,
    currentLocationKey: editorStartsWithCurrentLocation ? currentLocationKey : undefined,
    draftAddress,
    durationDraft,
    durationHours,
    locationModalVisible,
    minimumDate,
    onAddressModalClose: () => {
      setLocationModalVisible(false);
      setEditingAddressId(null);
      setDraftAddress({ ...emptyAddressDraft });
      setIsAddressFormVisible(false);
      setEditorStartsWithCurrentLocation(false);
    },
    onCancelAddressForm: () => {
      setEditingAddressId(null);
      setDraftAddress({ ...emptyAddressDraft });
      setIsAddressFormVisible(false);
      setEditorStartsWithCurrentLocation(false);
    },
    onDateConfirm,
    onDurationBlur,
    onDurationDraftChange,
    onDurationStep: (direction) => changeDuration(durationHours + direction),
    onEditAddress: (address) => {
      setAddressFeedback(null);
      setAddressFormMode('edit');
      setEditingAddressId(address.id);
      setDraftAddress({ ...address });
      setEditorStartsWithCurrentLocation(false);
      setIsAddressFormVisible(true);
    },
    onOpenAddressModal: () => {
      setLocationModalVisible(true);
      setAddressFeedback(null);
    },
    onOpenNewAddress: () => {
      setAddressFeedback(null);
      setAddressFormMode('create');
      setEditingAddressId(null);
      setDraftAddress({ ...emptyAddressDraft });
      setEditorStartsWithCurrentLocation(false);
      setIsAddressFormVisible(true);
    },
    onSelectAddress: (address) => {
      setSelectedAddressId(address.id);
      setLocationModalVisible(false);
      setAddressFeedback(null);
    },
    onStartCurrentLocation: () => {
      setAddressFeedback(null);
      setAddressFormMode('create');
      setEditingAddressId(null);
      setDraftAddress({ ...emptyAddressDraft });
      setEditorStartsWithCurrentLocation(true);
      setIsAddressFormVisible(true);
      setCurrentLocationKey((value) => value + 1);
    },
    onSaveAddress: saveAddressFromEditor,
    onTimeConfirm,
    selectedAddress,
    selectedDate: walkDate,
    selectedTime: walkTime,
    scheduleNotice,
  };

  const hasPets = pets.length > 0;

  return (
    <Card style={styles.formCard}>
      <View style={styles.formHeader}>
        <View style={styles.formIcon}>
          <Ionicons
            color={colors.primary}
            name={selectedService.icon as keyof typeof Ionicons.glyphMap}
            size={22}
          />
        </View>
        <View style={styles.formCopy}>
          <Text style={styles.formEyebrow}>__hupi_i18n:home.ServiceForm.bookYourService</Text>
          <Text style={styles.formTitle}>{selectedService.name}</Text>
          <Text style={styles.formDescription}>{subtitles[serviceId]}</Text>
        </View>
        <View style={styles.timeBadge}>
          <Ionicons color={colors.secondary} name="time-outline" size={13} />
          <Text style={styles.timeBadgeText}>__hupi_i18n:common.1Min</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.fields}>
        <PetSelector
          onAddPet={() => router.push('/client/pet-form' as Href)}
          onSelect={selectPet}
          pets={pets}
          selectedPetId={selectedPetId}
        />

        <ServiceFields serviceId={activeBookableServiceId} walkState={walkState} />

        {serviceId === 'daycare' ? (
          <Pressable onPress={() => setPickup((value) => !value)} style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>__hupi_i18n:home.ServiceForm.pickupAndHomeDelivery</Text>
              <Text style={styles.switchText}>__hupi_i18n:home.ServiceForm.optionAvailableWhenTheServiceIsActive</Text>
            </View>
            <Switch
              onValueChange={setPickup}
              thumbColor={colors.white}
              trackColor={{ false: colors.border, true: colors.primary }}
              value={pickup}
            />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.trustStrip}>
        <View style={styles.trustItem}>
          <Ionicons color={colors.success} name="shield-checkmark-outline" size={16} />
          <Text style={styles.trustText}>__hupi_i18n:home.ServiceForm.verifiedSuppliers</Text>
        </View>
        <View style={styles.trustItem}>
          <Ionicons color={colors.secondary} name="flash-outline" size={16} />
          <Text style={styles.trustText}>__hupi_i18n:home.ServiceForm.agileConfirmation</Text>
        </View>
      </View>

      <Button
        disabled={!hasPets}
        icon="search"
        onPress={() => {
          if (!hasPets) {
            return;
          }
          router.push(`/client/providers?serviceId=${activeBookableServiceId}&addressId=${encodeURIComponent(selectedAddress?.id ?? '')}` as Href);
        }}
        title={buttonLabels[serviceId]}
      />
      <Text style={styles.mockText}>__hupi_i18n:home.ServiceForm.weWillShowYouAvailableWalkersNearYou</Text>
    </Card>
  );
}

function PetSelector({
  onAddPet,
  onSelect,
  pets,
  selectedPetId,
}: {
  onAddPet: () => void;
  onSelect: (petId: string) => void;
  pets: MockPetProfile[];
  selectedPetId: string;
}) {
  if (pets.length === 0) {
    return (
      <Card style={styles.noPetsCard} tone="coral">
        <Text style={styles.noPetsTitle}>__hupi_i18n:home.ServiceForm.addAPetToBookThisService</Text>
        <Button icon="add-circle-outline" onPress={onAddPet} title="__hupi_i18n:common.addPet" variant="outline" />
      </Card>
    );
  }

  return (
    <View style={styles.petSelector}>
      <Text style={styles.petSelectorTitle}>__hupi_i18n:common.pet2</Text>
      <View style={styles.petChips}>
        {pets.map((pet) => {
          const active = selectedPetId === pet.id;
          return (
            <Pressable key={pet.id} onPress={() => onSelect(pet.id)} style={[styles.petChip, active && styles.activePetChip]}>
              <ProfileAvatar size={34} type="pet" uri={pet.petPhotoUri} />
              <View>
                <Text style={[styles.petChipName, active && styles.activePetChipText]}>{pet.name}</Text>
                <Text style={styles.petChipMeta}>{pet.breed}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: { marginTop: 14, padding: 18, shadowOpacity: 0.09 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  formIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCopy: { flex: 1 },
  formEyebrow: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900', letterSpacing: 1.1 },
  formTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 20, fontWeight: '900', marginTop: 2 },
  formDescription: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 3 },
  timeBadge: {
    minHeight: 29,
    borderRadius: 11,
    backgroundColor: colors.secondarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  timeBadgeText: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginTop: 17 },
  fields: { gap: 14, marginVertical: 17 },
  petSelector: { gap: 9 },
  petSelectorTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  petChips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  petChip: { minHeight: 56, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 11 },
  activePetChip: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  petChipName: { color: colors.text, fontFamily: fonts.medium, fontSize: 15, lineHeight: 21 },
  activePetChipText: { color: colors.primary },
  petChipMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, marginTop: 2 },
  noPetsCard: { gap: 10, shadowOpacity: 0 },
  noPetsTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  twoColumns: { flexDirection: 'row', gap: 10 },
  flexInput: { flex: 1, minWidth: 0 },
  readonlyWrapper: { gap: 7 },
  inputLabel: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  readonlyShell: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 14,
  },
  readonlyValue: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  scheduleNotice: { color: colors.primary, fontFamily: fonts.light, fontSize: 13, lineHeight: 19 },
  durationBlock: { gap: 7 },
  durationControl: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  durationButton: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledDurationButton: { opacity: 0.45 },
  durationInput: {
    minWidth: 44,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 18,
    lineHeight: 24,
    paddingVertical: 0,
  },
  durationUnit: { color: colors.text, fontFamily: fonts.regular, fontSize: 17, lineHeight: 23 },
  addressFeedback: { color: colors.primary, fontFamily: fonts.light, fontSize: 13, lineHeight: 19, marginTop: -6 },
  addressFeedbackBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, backgroundColor: '#e7f5ef', padding: 12 },
  addressFeedbackBannerText: { flex: 1, color: colors.success, fontFamily: fonts.bold, fontSize: 13, fontWeight: '900' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  locationSheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  sheetHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: colors.border, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sheetTitle: { flex: 1, color: colors.text, fontFamily: fonts.bold, fontSize: 21, fontWeight: '900' },
  closeButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  locationSheetContent: { gap: 13, paddingBottom: 18 },
  emptyAddresses: { gap: 12, alignItems: 'stretch', borderRadius: 18, backgroundColor: colors.soft, padding: 16 },
  emptyTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  addressList: { gap: 10 },
  addressOption: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  addressSelectArea: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressIcon: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: 13, height: 40, justifyContent: 'center', width: 40 },
  activeAddressIcon: { backgroundColor: colors.primarySoft },
  activeAddressOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  activeRadio: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  addressCopy: { flex: 1, minWidth: 0 },
  addressTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  addressLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  activeAddressText: { color: colors.primary },
  defaultBadge: { borderRadius: 999, backgroundColor: '#e7f5ef', color: colors.success, fontFamily: fonts.bold, fontSize: 11, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4 },
  addressText: { color: colors.text, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 4 },
  addressMeta: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 18, marginTop: 3 },
  editAddressButton: { minHeight: 32, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 10 },
  editAddressText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  conditions: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 15,
    padding: 14,
    backgroundColor: colors.secondarySoft,
  },
  conditionsText: { flex: 1, color: colors.secondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 21 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    backgroundColor: colors.soft,
    padding: 14,
  },
  switchCopy: { flex: 1, paddingRight: 12 },
  switchTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 15, fontWeight: '800' },
  switchText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, marginTop: 3 },
  trustStrip: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 14,
    backgroundColor: colors.soft,
    padding: 11,
    marginBottom: 14,
  },
  trustItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  trustText: { flex: 1, color: colors.textMuted, fontFamily: fonts.light, fontSize: 13, lineHeight: 19 },
  mockText: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 13, textAlign: 'center', marginTop: 10 },
  upcomingText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 22, marginTop: 16 },
  marketplaceCard: { marginTop: 16, padding: 22, overflow: 'hidden' },
  marketplaceIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  marketplaceEyebrow: { color: colors.secondary, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.3, fontWeight: '900' },
  marketplaceTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 29, fontWeight: '900', marginTop: 8 },
  marketplaceCopy: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 15, lineHeight: 20, marginVertical: 14 },
});
