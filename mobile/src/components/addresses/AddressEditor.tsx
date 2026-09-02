import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import * as Location from 'expo-location';
import { useEffect,
  useRef,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import {
  ECUADOR_PROVINCES,
  getEcuadorCities,
} from '@/constants/ecuadorLocations';
import {
  ADDRESS_ICON_KEYS,
  createEmptyAddress,
  defaultIconForLabel,
  getAddressTechnicalLabel,
  isAddressValid,
  normalizeAddress,
  validateAddress,
  type Address,
  type AddressIconKey,
  type AddressLabelType,
} from '@/domain/address';
import { Pressable, Text } from '@/i18n/components';
import { AddressMap } from './AddressMap';
import type { AddressCoordinate } from './AddressMap.types';
import { AddressOptionField } from './AddressOptionField';
import { AddressPreferencesEditor } from './AddressPreferencesEditor';

const labelOptions: Array<{ icon: 'home-outline' | 'briefcase-outline' | 'location-outline'; value: AddressLabelType }> = [
  { icon: 'home-outline', value: 'home' },
  { icon: 'briefcase-outline', value: 'work' },
  { icon: 'location-outline', value: 'other' },
];

const iconNames: Record<AddressIconKey, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  briefcase: 'briefcase-outline',
  heart: 'heart-outline',
  people: 'people-outline',
  school: 'school-outline',
  fitness: 'barbell-outline',
  medical: 'medical-outline',
  location: 'location-outline',
};

export const emptyAddressDraft: Address = createEmptyAddress('2026-01-01T00:00:00.000Z');

type AddressEditorProps = {
  initialAddress?: Address;
  mode?: 'create' | 'edit';
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSave: (address: Address) => void;
  startWithCurrentLocationKey?: number;
};

function cloneAddress(address?: Address) {
  return normalizeAddress(address ?? createEmptyAddress());
}

function formatReverseGeocodeAddress(item?: Location.LocationGeocodedAddress) {
  if (!item) return '';
  if (item.formattedAddress) return item.formattedAddress;
  return [
    item.street && item.streetNumber ? `${item.street} ${item.streetNumber}` : item.street,
    !item.street ? item.name : null,
    item.district,
    item.city,
    item.region,
    item.country,
  ].filter(Boolean).join(', ');
}

function serializeDraft(address: Address) {
  const { updatedAt: _updatedAt, ...comparable } = address;
  return JSON.stringify(comparable);
}

export function AddressEditor({
  initialAddress,
  mode = 'create',
  onCancel,
  onDirtyChange,
  onSave,
  startWithCurrentLocationKey,
}: AddressEditorProps) {
  const { t } = useTranslation();
  const initial = useRef(cloneAddress(initialAddress));
  const [draft, setDraft] = useState<Address>(() => initial.current);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const [addressSearchVersion, setAddressSearchVersion] = useState(0);
  const currentLocationRuns = useRef(0);
  const lastGeocodedQuery = useRef('');
  const touchedFields = useRef(new Set<keyof Address>());
  const isEditing = mode === 'edit';
  const validation = validateAddress(draft);
  const coordinate = {
    latitude: draft.latitude ?? -0.1807,
    longitude: draft.longitude ?? -78.4678,
  };

  useEffect(() => {
    const next = cloneAddress(initialAddress);
    initial.current = next;
    touchedFields.current.clear();
    setDraft(next);
    setNotice(null);
    setSubmitted(false);
  }, [initialAddress]);

  useEffect(() => {
    onDirtyChange?.(serializeDraft(draft) !== serializeDraft(initial.current));
  }, [draft, onDirtyChange]);

  useEffect(() => {
    if (addressSearchVersion === 0 || draft.streetAddress.trim().length < 4) {
      return undefined;
    }

    const query = [
      draft.streetAddress,
      draft.houseNumber,
      draft.city,
      draft.province,
      draft.country,
    ].filter((value) => value.trim()).join(', ');
    if (!query || query === lastGeocodedQuery.current) return undefined;

    let active = true;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          if (Platform.OS === 'android') {
            const existing = await Location.getForegroundPermissionsAsync();
            const status = existing.status === 'granted'
              ? existing.status
              : (await Location.requestForegroundPermissionsAsync()).status;
            if (status !== 'granted') {
              if (active) setNotice(t('addressBook.permissionDenied'));
              return;
            }
          }

          const [result] = await Location.geocodeAsync(query);
          if (!active) return;
          if (!result) {
            setNotice(t('addressBook.geocodingError'));
            return;
          }
          lastGeocodedQuery.current = query;
          setDraft((current) => ({
            ...current,
            latitude: result.latitude,
            longitude: result.longitude,
            source: 'manual',
          }));
          setRecenterKey((current) => current + 1);
          setNotice(t('addressBook.addressLocated'));
        } catch {
          if (active) setNotice(t('addressBook.geocodingError'));
        }
      })();
    }, 800);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [
    addressSearchVersion,
    draft.city,
    draft.country,
    draft.houseNumber,
    draft.province,
    draft.streetAddress,
    t,
  ]);

  useEffect(() => {
    if (!startWithCurrentLocationKey || currentLocationRuns.current === startWithCurrentLocationKey) return;
    currentLocationRuns.current = startWithCurrentLocationKey;
    void useCurrentLocation();
  }, [startWithCurrentLocationKey]);

  const update = <K extends keyof Address>(key: K, value: Address[K], touched = true) => {
    if (touched) touchedFields.current.add(key);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const selectLabel = (labelType: AddressLabelType) => {
    setDraft((current) => {
      const next = {
        ...current,
        labelType,
        customLabel: labelType === 'other' ? current.customLabel : '',
        iconKey: defaultIconForLabel(labelType),
      };
      next.label = getAddressTechnicalLabel(next);
      return next;
    });
  };

  const ensureLocationPermission = async () => {
    const existing = await Location.getForegroundPermissionsAsync();
    if (existing.status === 'granted') return true;
    const requested = await Location.requestForegroundPermissionsAsync();
    return requested.status === 'granted';
  };

  const applyReverseGeocode = async (nextCoordinate: AddressCoordinate) => {
    try {
      if (Platform.OS === 'android' && !(await ensureLocationPermission())) {
        setNotice(t('addressBook.permissionDenied'));
        return;
      }
      const [item] = await Location.reverseGeocodeAsync(nextCoordinate);
      if (!item) {
        setNotice(t('addressBook.reverseGeocodingError'));
        return;
      }
      const formattedAddress = formatReverseGeocodeAddress(item);
      setDraft((current) => ({
        ...current,
        formattedAddress: current.formattedAddress.trim() ? current.formattedAddress : formattedAddress,
        streetAddress: current.streetAddress.trim() ? current.streetAddress : (item.street ?? item.name ?? ''),
        houseNumber: current.houseNumber.trim() ? current.houseNumber : (item.streetNumber ?? ''),
        city: current.city.trim() ? current.city : (item.city ?? item.subregion ?? ''),
        province: current.province.trim() ? current.province : (item.region ?? ''),
        country: current.country.trim() ? current.country : (item.country ?? ''),
        postalCode: current.postalCode.trim() ? current.postalCode : (item.postalCode ?? ''),
      }));
      setNotice(t('addressBook.reverseGeocodingSuggestion'));
    } catch {
      setNotice(t('addressBook.reverseGeocodingError'));
    }
  };

  const changeCoordinate = (nextCoordinate: AddressCoordinate, source: Address['source'] = 'map') => {
    setDraft((current) => ({
      ...current,
      latitude: nextCoordinate.latitude,
      longitude: nextCoordinate.longitude,
      source,
    }));
    setRecenterKey((current) => current + 1);
    void applyReverseGeocode(nextCoordinate);
  };

  const useCurrentLocation = async () => {
    setLoadingLocation(true);
    setNotice(null);
    try {
      if (!(await ensureLocationPermission())) {
        setNotice(t('addressBook.permissionDenied'));
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      changeCoordinate({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      }, 'current_location');
    } catch {
      setNotice(t('addressBook.locationError'));
    } finally {
      setLoadingLocation(false);
    }
  };

  const saveAddress = () => {
    setSubmitted(true);
    if (!isAddressValid(draft)) {
      setNotice(t('addressBook.validationError'));
      return;
    }
    const formattedAddress = [
      draft.streetAddress,
      draft.houseNumber,
      draft.city,
      draft.province,
      draft.country,
    ].filter((value) => value.trim()).join(', ');
    onSave(normalizeAddress({
      ...draft,
      label: getAddressTechnicalLabel(draft),
      address: draft.streetAddress.trim(),
      formattedAddress,
      updatedAt: new Date().toISOString(),
    }));
  };

  const requiredHint = (valid: boolean) => submitted && !valid ? t('addressBook.requiredField') : undefined;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrapper}>
      <Text style={styles.sectionLabel}>{t('addressBook.label')}</Text>
      <View style={styles.chips}>
        {labelOptions.map((option) => {
          const active = draft.labelType === option.value;
          return (
            <Pressable
              accessibilityLabel={t(`addressBook.labels.${option.value}`)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              key={option.value}
              onPress={() => selectLabel(option.value)}
              style={[styles.chip, active && styles.activeChip]}
            >
              <Ionicons color={active ? colors.white : colors.primary} name={option.icon} size={17} />
              <Text style={[styles.chipText, active && styles.activeChipText]}>
                {t(`addressBook.labels.${option.value}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {draft.labelType === 'other' ? (
        <>
          <Input
            hint={requiredHint(validation.label)}
            label={t('addressBook.customLabel')}
            onChangeText={(value) => {
              update('customLabel', value);
              update('label', value || t('addressBook.labels.other'), false);
            }}
            placeholder={t('addressBook.customLabelPlaceholder')}
            value={draft.customLabel}
          />
          <Text style={styles.sectionLabel}>{t('addressBook.chooseIcon')}</Text>
          <View style={styles.iconGrid}>
            {ADDRESS_ICON_KEYS.map((iconKey) => {
              const active = draft.iconKey === iconKey;
              return (
                <Pressable
                  accessibilityLabel={t(`addressBook.icons.${iconKey}`)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  key={iconKey}
                  onPress={() => update('iconKey', iconKey)}
                  style={[styles.iconChoice, active && styles.activeIconChoice]}
                >
                  <Ionicons color={active ? colors.white : colors.secondary} name={iconNames[iconKey]} size={20} />
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      <Input
        hint={requiredHint(validation.streetAddress)}
        label={t('addressBook.streetAddress')}
        onChangeText={(value) => {
          update('streetAddress', value);
          update('formattedAddress', value, false);
          setAddressSearchVersion((current) => current + 1);
        }}
        placeholder={t('addressBook.streetPlaceholder')}
        value={draft.streetAddress}
      />
      <View style={styles.mapHeader}>
        <View style={styles.mapCopy}>
          <Text style={styles.mapTitle}>{t('addressBook.mapTitle')}</Text>
          <Text style={styles.mapInstructions}>{t('addressBook.mapInstructions')}</Text>
        </View>
      </View>
      <AddressMap
        accessibilityHint={t('addressBook.mapInstructions')}
        accessibilityLabel={t('addressBook.movePin')}
        coordinate={coordinate}
        onCoordinateChange={(value) => changeCoordinate(value)}
        recenterKey={recenterKey}
      />
      <Button
        icon="navigate-outline"
        loading={loadingLocation}
        onPress={useCurrentLocation}
        style={styles.currentLocationButton}
        title={t('addressBook.useCurrentLocation')}
        variant="outline"
      />
      <Text accessibilityLiveRegion="polite" style={styles.coordinateText}>
        {t('addressBook.locationConfirmed', {
          latitude: coordinate.latitude.toFixed(5),
          longitude: coordinate.longitude.toFixed(5),
        })}
      </Text>
      <Input
        hint={requiredHint(validation.houseNumber)}
        label={t('addressBook.houseNumber')}
        onChangeText={(value) => {
          update('houseNumber', value);
          setAddressSearchVersion((current) => current + 1);
        }}
        placeholder={t('addressBook.houseNumberPlaceholder')}
        value={draft.houseNumber}
      />
      <Input
        label={t('addressBook.reference')}
        multiline
        onChangeText={(value) => update('reference', value)}
        placeholder={t('addressBook.referencePlaceholder')}
        value={draft.reference}
      />
      <AddressOptionField
        closeLabel={t('common.close')}
        hint={requiredHint(validation.province)}
        label={t('addressBook.province')}
        onSelect={(province) => {
          const cities = getEcuadorCities(province);
          setDraft((current) => ({
            ...current,
            province,
            city: cities.some((city) => city === current.city) ? current.city : '',
          }));
          touchedFields.current.add('province');
          setAddressSearchVersion((current) => current + 1);
        }}
        options={ECUADOR_PROVINCES}
        placeholder={t('addressBook.selectProvince')}
        title={t('addressBook.selectProvince')}
        value={draft.province}
      />
      <AddressOptionField
        closeLabel={t('common.close')}
        disabled={!draft.province}
        hint={requiredHint(validation.city) ?? (!draft.province ? t('addressBook.selectProvinceFirst') : undefined)}
        label={t('addressBook.city')}
        onSelect={(city) => {
          update('city', city);
          setAddressSearchVersion((current) => current + 1);
        }}
        options={getEcuadorCities(draft.province)}
        placeholder={t('addressBook.selectCity')}
        title={t('addressBook.selectCity')}
        value={draft.city}
      />
      <View style={styles.twoColumns}>
        <Input
          containerStyle={styles.column}
          editable={false}
          hint={requiredHint(validation.country)}
          label={t('addressBook.country')}
          value={draft.country}
        />
        <Input
          containerStyle={styles.column}
          label={t('addressBook.postalCode')}
          onChangeText={(value) => update('postalCode', value)}
          value={draft.postalCode}
        />
      </View>

      <View style={styles.preferencesSection}>
        <Text style={styles.preferencesTitle}>{t('deliveryPreferences.savedAddressTitle')}</Text>
        <Text style={styles.preferencesSubtitle}>{t('deliveryPreferences.savedAddressSubtitle')}</Text>
        <AddressPreferencesEditor
          context="delivery"
          onChange={(deliveryPreferences) => update('deliveryPreferences', deliveryPreferences)}
          value={draft.deliveryPreferences}
        />
      </View>

      <Pressable
        accessibilityLabel={t('addressBook.defaultAddress')}
        accessibilityRole="switch"
        accessibilityState={{ checked: draft.isDefault }}
        onPress={() => update('isDefault', !draft.isDefault)}
        style={styles.checkRow}
      >
        <View style={[styles.checkbox, draft.isDefault && styles.checked]}>
          {draft.isDefault ? <Ionicons color={colors.white} name="checkmark" size={15} /> : null}
        </View>
        <Text style={styles.checkText}>{t('addressBook.defaultAddress')}</Text>
      </Pressable>

      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}

      <View style={styles.actions}>
        <Button onPress={onCancel} style={styles.actionButton} title={t('addressBook.cancel')} variant="outline" />
        <Button
          icon="save-outline"
          onPress={saveAddress}
          style={styles.actionButton}
          title={isEditing ? t('addressBook.saveChanges') : t('addressBook.save')}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  preferencesSection: { borderTopColor: colors.border, borderTopWidth: 1, gap: 12, marginTop: 6, paddingTop: 20 },
  preferencesTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 19, lineHeight: 25 },
  preferencesSubtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  sectionLabel: { color: colors.text, fontFamily: fonts.bold, fontSize: 14, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 14,
  },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontFamily: fonts.bold, fontSize: 13, fontWeight: '800' },
  activeChipText: { color: colors.white },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  iconChoice: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  activeIconChoice: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  twoColumns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1, minWidth: 0 },
  mapHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginTop: 2 },
  mapCopy: { flex: 1 },
  mapTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, fontWeight: '900' },
  mapInstructions: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  coordinateText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11, textAlign: 'center' },
  currentLocationButton: { alignSelf: 'stretch', minHeight: 48 },
  checkRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 44 },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkText: { color: colors.text, flex: 1, fontFamily: fonts.semiBold, fontSize: 13, fontWeight: '800' },
  notice: { color: colors.primary, fontFamily: fonts.bold, fontSize: 13, fontWeight: '800', lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  actionButton: { flex: 1, paddingHorizontal: 10 },
});
