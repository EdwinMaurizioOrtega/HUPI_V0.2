import { StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Input } from '@/components/Input';
import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import {
  ARRIVAL_CONTACT_PREFERENCES,
  ENTRANCE_TYPES,
  HANDOFF_TYPES,
  LOCATION_TYPES,
  MEETING_POINTS_BY_LOCATION,
  normalizeDeliveryPreferences,
  type AddressBuildingDetails,
  type AddressDeliveryPreferences,
  type ArrivalContactPreference,
  type EntranceType,
  type HandoffType,
  type LocationType,
  type MeetingPointType,
} from '@/domain/address';
import { Pressable, Text } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type AddressPreferencesEditorProps = {
  context: 'delivery' | 'service';
  onChange: (preferences: AddressDeliveryPreferences) => void;
  value: AddressDeliveryPreferences;
};

function ChoiceGroup<T extends string>({
  label,
  onChange,
  options,
  translationPrefix,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: readonly T[];
  translationPrefix: string;
  value: T;
}) {
  const { t } = useTranslation();
  const { tokens } = useTheme();

  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: tokens.text }]}>{label}</Text>
      <View style={styles.choices}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option}
              onPress={() => onChange(option)}
              style={[
                styles.choice,
                {
                  backgroundColor: selected ? tokens.primarySoft : tokens.surface,
                  borderColor: selected ? tokens.primary : tokens.border,
                },
              ]}
            >
              <Ionicons
                color={selected ? tokens.primary : tokens.textMuted}
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                size={19}
              />
              <Text style={[styles.choiceText, { color: tokens.text }]}>{t(`${translationPrefix}.${option}` as never)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AddressPreferencesEditor({ context, onChange, value }: AddressPreferencesEditorProps) {
  const { t } = useTranslation();

  const changeLocationType = (locationType: LocationType) => {
    onChange({
      ...value,
      locationType,
      meetingPointType: MEETING_POINTS_BY_LOCATION[locationType][0],
      buildingDetails: {},
    });
  };
  const updateBuilding = <K extends keyof AddressBuildingDetails>(key: K, nextValue: AddressBuildingDetails[K]) => {
    onChange({
      ...value,
      buildingDetails: { ...value.buildingDetails, [key]: nextValue },
    });
  };
  const isApartmentDoor = value.meetingPointType === 'apartment_door';
  const isReception = value.meetingPointType === 'building_lobby'
    || value.meetingPointType === 'security_desk'
    || value.meetingPointType === 'office_reception';
  const isBuildingEntrance = value.meetingPointType === 'building_entrance';

  return (
    <View style={styles.container}>
      <ChoiceGroup<LocationType>
        label={t('deliveryPreferences.locationTypeTitle')}
        onChange={changeLocationType}
        options={LOCATION_TYPES}
        translationPrefix="deliveryPreferences.locationTypes"
        value={value.locationType}
      />
      <ChoiceGroup<MeetingPointType>
        label={t('deliveryPreferences.meetingPointTitle', { context })}
        onChange={(meetingPointType) => onChange({ ...value, meetingPointType, buildingDetails: {} })}
        options={MEETING_POINTS_BY_LOCATION[value.locationType]}
        translationPrefix="deliveryPreferences.meetingPoints"
        value={value.meetingPointType}
      />

      {isApartmentDoor ? (
        <View style={styles.dynamicFields}>
          <Input label={t('deliveryPreferences.fields.buildingName')} onChangeText={(text) => updateBuilding('buildingName', text)} value={value.buildingDetails?.buildingName ?? ''} />
          <Input label={t('deliveryPreferences.fields.towerOrBlock')} onChangeText={(text) => updateBuilding('towerOrBlock', text)} value={value.buildingDetails?.towerOrBlock ?? ''} />
          <View style={styles.columns}>
            <Input containerStyle={styles.column} label={t('deliveryPreferences.fields.floor')} onChangeText={(text) => updateBuilding('floor', text)} value={value.buildingDetails?.floor ?? ''} />
            <Input containerStyle={styles.column} label={t('deliveryPreferences.fields.apartmentOrSuite')} onChangeText={(text) => updateBuilding('apartmentOrSuite', text)} value={value.buildingDetails?.apartmentOrSuite ?? ''} />
          </View>
          <Input label={t('deliveryPreferences.fields.doorbellName')} onChangeText={(text) => updateBuilding('doorbellName', text)} value={value.buildingDetails?.doorbellName ?? ''} />
          <Input label={t('deliveryPreferences.fields.accessCode')} onChangeText={(text) => updateBuilding('accessCode', text)} secureTextEntry value={value.buildingDetails?.accessCode ?? ''} />
          <ChoiceGroup<'yes' | 'no'>
            label={t('deliveryPreferences.fields.hasElevator')}
            onChange={(answer) => updateBuilding('hasElevator', answer === 'yes')}
            options={['yes', 'no']}
            translationPrefix="deliveryPreferences.boolean"
            value={value.buildingDetails?.hasElevator === false ? 'no' : 'yes'}
          />
        </View>
      ) : null}

      {isReception ? (
        <View style={styles.dynamicFields}>
          <Input label={t('deliveryPreferences.fields.buildingName')} onChangeText={(text) => updateBuilding('buildingName', text)} value={value.buildingDetails?.buildingName ?? ''} />
          <Input label={t('deliveryPreferences.fields.receiverName')} onChangeText={(text) => updateBuilding('receiverName', text)} value={value.buildingDetails?.receiverName ?? ''} />
          <Input label={t('deliveryPreferences.fields.scheduleOrRestrictions')} multiline onChangeText={(text) => updateBuilding('scheduleOrRestrictions', text)} value={value.buildingDetails?.scheduleOrRestrictions ?? ''} />
        </View>
      ) : null}

      {isBuildingEntrance ? (
        <ChoiceGroup<EntranceType>
          label={t('deliveryPreferences.fields.entranceType')}
          onChange={(entranceType) => updateBuilding('entranceType', entranceType)}
          options={ENTRANCE_TYPES}
          translationPrefix="deliveryPreferences.entranceTypes"
          value={value.buildingDetails?.entranceType ?? 'main_door'}
        />
      ) : null}

      <ChoiceGroup<HandoffType>
        label={t('deliveryPreferences.handoffTitle', { context })}
        onChange={(handoffType) => onChange({ ...value, handoffType })}
        options={HANDOFF_TYPES}
        translationPrefix={context === 'service' ? 'deliveryPreferences.serviceHandoffTypes' : 'deliveryPreferences.handoffTypes'}
        value={value.handoffType}
      />
      <ChoiceGroup<ArrivalContactPreference>
        label={t('deliveryPreferences.contactTitle')}
        onChange={(arrivalContactPreference) => onChange({ ...value, arrivalContactPreference })}
        options={ARRIVAL_CONTACT_PREFERENCES}
        translationPrefix="deliveryPreferences.contactPreferences"
        value={value.arrivalContactPreference}
      />
      <Input
        label={t('deliveryPreferences.instructionsLabel')}
        multiline
        onChangeText={(instructions) => onChange({ ...value, instructions })}
        placeholder={t('deliveryPreferences.instructionsPlaceholder')}
        value={value.instructions ?? ''}
      />
      <Text style={styles.privacy}>{t('deliveryPreferences.privacyNotice')}</Text>
    </View>
  );
}

export function AddressPreferencesSummary({
  context,
  value,
}: {
  context: 'delivery' | 'service';
  value: AddressDeliveryPreferences;
}) {
  const { t } = useTranslation();
  const normalizedValue = normalizeDeliveryPreferences(value);
  const rows = [
    t(`deliveryPreferences.locationTypes.${normalizedValue.locationType}`),
    t(`deliveryPreferences.meetingPoints.${normalizedValue.meetingPointType}`),
    t(`${context === 'service' ? 'deliveryPreferences.serviceHandoffTypes' : 'deliveryPreferences.handoffTypes'}.${normalizedValue.handoffType}`),
    t(`deliveryPreferences.contactPreferences.${normalizedValue.arrivalContactPreference}`),
    normalizedValue.instructions,
  ].filter(Boolean);

  return (
    <View style={styles.summary}>
      {rows.map((row, index) => (
        <View key={`${row}-${index}`} style={styles.summaryRow}>
          <Ionicons color={colors.secondary} name={index === 0 ? 'business-outline' : index === 1 ? 'location-outline' : index === 2 ? 'hand-left-outline' : index === 3 ? 'chatbubble-outline' : 'document-text-outline'} size={16} />
          <Text style={styles.summaryText}>{row}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  group: { gap: 8 },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  choices: { gap: 8 },
  choice: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 48, paddingHorizontal: 12, paddingVertical: 9 },
  choiceText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 19 },
  dynamicFields: { gap: 14 },
  columns: { flexDirection: 'row', gap: 10 },
  column: { flex: 1 },
  privacy: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  summary: { gap: 7 },
  summaryRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 8 },
  summaryText: { color: colors.text, flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
});
