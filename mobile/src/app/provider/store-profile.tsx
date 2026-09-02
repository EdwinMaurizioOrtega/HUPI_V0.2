import { ThemedPressable as Pressable } from '@/theme/ThemedPressable';
import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  StyleSheet,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { HupiSuccessModal } from '@/components/HupiSuccessModal';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { Text, TextInput } from '@/i18n/components';
import { useTheme } from '@/theme/ThemeProvider';
import {
  countryDialCodes,
  hourOptions,
  mockStoreCategories,
} from '@/constants/marketplaceStoreProfileOptions';
import {
  createMockLegalDataUpdateTicket,
  getProviderStoreProfile,
  saveProviderStoreProfile,
  type LegalDataUpdateRequestType,
  type ProviderStoreProfile,
  type ProviderStoreScheduleDay,
  type ProviderStoreType,
} from '@/constants/marketplaceStoreState';

const storeTypeOptions: ProviderStoreType[] = ['Local físico', 'Tienda online'];
const legalTicketTypeOptions: LegalDataUpdateRequestType[] = [
  'Cambio de RUC',
  'Cambio de Razón Social',
  'Cambio de tipo de persona',
  'Actualización de documento',
  'Actualización de correo de facturación',
  'Otro dato interno bloqueado',
];
const logoMockOptions = ['🦴', '🐾', '🧴', '🦮', '🥣', '🎾'];

export default function ProviderStoreProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(() => getProviderStoreProfile());
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedSelect, setExpandedSelect] = useState<string | null>(null);
  const [ticketFormVisible, setTicketFormVisible] = useState(false);
  const [ticketType, setTicketType] = useState<LegalDataUpdateRequestType>('Cambio de RUC');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketAttachmentName, setTicketAttachmentName] = useState<string | null>(null);
  const [createdTicketNumber, setCreatedTicketNumber] = useState<string | null>(null);
  const [ticketSuccessVisible, setTicketSuccessVisible] = useState(false);
  const hasPhysicalStore = profile.storeTypes.includes('Local físico');

  const updateProfile = <Key extends keyof ProviderStoreProfile>(field: Key, value: ProviderStoreProfile[Key]) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const toggleStoreType = (storeType: ProviderStoreType) => {
    setProfile((current) => {
      const exists = current.storeTypes.includes(storeType);
      const nextTypes = exists
        ? current.storeTypes.filter((item) => item !== storeType)
        : [...current.storeTypes, storeType];

      return { ...current, storeTypes: nextTypes.length > 0 ? nextTypes : [storeType] };
    });
  };

  const toggleCategory = (category: string) => {
    setProfile((current) => {
      const exists = current.categories.includes(category);
      const nextCategories = exists
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category];

      return { ...current, categories: nextCategories.length > 0 ? nextCategories : [category] };
    });
  };

  const updatePhone = (
    type: 'internal' | 'billing',
    field: 'code' | 'number',
    value: string,
  ) => {
    setProfile((current) => {
      const next = { ...current };

      if (type === 'internal') {
        if (field === 'code') {
          next.internalPhoneCountryCode = value;
        } else {
          next.internalPhoneNumber = value;
        }
        next.internalPhone = `${next.internalPhoneCountryCode} ${next.internalPhoneNumber}`;
      } else if (field === 'code') {
        next.billingPhoneCountryCode = value;
      } else {
        next.billingPhoneNumber = value;
      }

      return next;
    });
  };

  const updateScheduleDay = (
    day: string,
    updates: Partial<ProviderStoreScheduleDay>,
  ) => {
    setProfile((current) => ({
      ...current,
      scheduleDays: current.scheduleDays.map((item) => (
        item.day === day ? { ...item, ...updates } : item
      )),
    }));
  };

  const attachLogoMock = () => {
    setProfile((current) => ({
      ...current,
      logoFileName: `${current.name.toLowerCase().replace(/\s+/g, '-') || 'tienda'}-logo.png`,
    }));
  };

  const attachLegalDocumentMock = () => {
    setTicketAttachmentName('documento-respaldo-legal.pdf');
  };

  const sendLegalUpdateTicket = () => {
    const ticket = createMockLegalDataUpdateTicket({
      attachmentName: ticketAttachmentName ?? undefined,
      description: ticketDescription || 'Solicitud de actualización legal creada desde perfil de tienda.',
      type: ticketType,
    });

    setCreatedTicketNumber(ticket.ticketNumber);
    setTicketDescription('');
    setTicketAttachmentName(null);
    setTicketSuccessVisible(true);
  };

  const saveProfile = () => {
    const updated = saveProviderStoreProfile({
      ...profile,
      businessName: profile.businessName || profile.name,
      internalPhone: `${profile.internalPhoneCountryCode} ${profile.internalPhoneNumber}`,
      schedule: summarizeSchedule(profile.scheduleDays),
    });
    setProfile(updated);
    setNotice('Perfil guardado correctamente.');
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:provider.store-profile.supplierDetails"
        title="__hupi_i18n:common.storeProfile"
      />

      <Card style={styles.badgeCard} tone="soft">
        <View style={styles.logoBubble}><Text style={styles.logo}>{profile.logo}</Text></View>
        <View style={styles.badgeCopy}>
          <Text style={styles.storeName}>{profile.name}</Text>
          <View style={styles.badges}>
            <Badge icon="storefront" text={profile.storeStatus} tone={profile.storeStatus === 'Habilitada' ? 'success' : 'purple'} />
            <Badge icon="shield-checkmark" text={`Proveedor ${profile.providerStatus}`} tone={profile.providerStatus === 'Aprobado' ? 'success' : 'purple'} />
            {profile.isVerifiedByHupi ? <Badge icon="checkmark-circle" text="Verificada por Hupi" tone="success" /> : null}
            {profile.isOfficialStore ? <Badge text="Tienda Oficial" tone="purple" /> : null}
          </View>
          <Text style={styles.lockedText}>__hupi_i18n:provider.store-profile.youCanEditYourProfileButOfficialStoreIs</Text>
        </View>
      </Card>

      {notice ? (
        <View style={styles.notice}>
          <Ionicons color={colors.primary} name="checkmark-circle-outline" size={17} />
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <SectionCard
        icon="shield-checkmark-outline"
        note="Esta información es solo para validación y manejo interno de Hupi. No se mostrará públicamente en la app."
        title="__hupi_i18n:provider.store-profile.internalInformationForHupi"
      >
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>__hupi_i18n:provider.store-profile.validatedLegalData</Text>
          <View style={styles.validatedBadge}>
            <Text style={styles.validatedBadgeText}>__hupi_i18n:provider.store-profile.validatedByHupi</Text>
          </View>
        </View>
        <Text style={styles.inlineHint}>__hupi_i18n:provider.store-profile.theseDataWereValidatedByHupiToModifyThem</Text>
        <Text style={styles.inlineMuted}>__hupi_i18n:provider.store-profile.legalInformationIsInternalAndIsNotShownTo</Text>
        <View style={styles.readOnlyGrid}>
          <ReadOnlyMutedField label="__hupi_i18n:common.typeOfPerson" value={profile.personType} />
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.documentType" value={profile.documentType} />
          <ReadOnlyMutedField label={profile.documentType === 'RUC' ? 'RUC' : 'Cédula'} value={profile.documentNumber} />
          <ReadOnlyMutedField label={profile.personType === 'Persona Jurídica' ? 'Razón Social' : 'Nombre legal'} value={profile.legalName} />
        </View>

        <View style={styles.divider} />
        <Text style={styles.subsectionTitle}>__hupi_i18n:provider.store-profile.financialContactAndBilling</Text>
        <Text style={styles.inlineMuted}>__hupi_i18n:provider.store-profile.billingDataIsUsedForHupiSInternalManagement</Text>
        <MockInput label="__hupi_i18n:provider.store-profile.financialContactName" onChangeText={(value) => updateProfile('financialContact', value)} value={profile.financialContact} />
        <MockInput label="__hupi_i18n:payments.billing.billingEmail" onChangeText={(value) => updateProfile('billingEmail', value)} value={profile.billingEmail} />
        <PhoneField
          code={profile.billingPhoneCountryCode}
          expandedSelect={expandedSelect}
          label="__hupi_i18n:provider.store-profile.billingPhone"
          number={profile.billingPhoneNumber}
          onSelectCode={(value) => { updatePhone('billing', 'code', value); setExpandedSelect(null); }}
          onToggleCode={() => setExpandedSelect((current) => (current === 'billing-code' ? null : 'billing-code'))}
          onUpdateNumber={(value) => updatePhone('billing', 'number', value)}
          selectKey="billing-code"
        />

      </SectionCard>

      <SectionCard
        icon="storefront-outline"
        note="Esta información sí se mostrará a los usuarios en tu tienda dentro de Hupi."
        title="__hupi_i18n:provider.store-profile.storePublicInformation"
      >
        <ChipGroup
          label="__hupi_i18n:common.storeType"
          multiple
          onSelect={(value) => toggleStoreType(value as ProviderStoreType)}
          options={storeTypeOptions}
          selected={profile.storeTypes}
        />
        <MockInput label="__hupi_i18n:provider.store-profile.storeNameTradeName" onChangeText={(value) => updateProfile('name', value)} value={profile.name} />
        <MockInput label="__hupi_i18n:provider.store-profile.descriptionVisibleToThePublic" multiline onChangeText={(value) => updateProfile('description', value)} value={profile.description} />
        <ChipGroup
          label="__hupi_i18n:provider.store-profile.mainCategories"
          multiple
          onSelect={toggleCategory}
          options={mockStoreCategories}
          selected={profile.categories}
        />
      </SectionCard>

      <SectionCard
        icon="location-outline"
        note="Separamos la ubicación registrada para revisión interna de Hupi del horario público que sí puedes actualizar."
        title="__hupi_i18n:provider.store-profile.locationAndAttention"
      >
        <View style={styles.subsectionHeader}>
          <Text style={styles.subsectionTitle}>__hupi_i18n:provider.store-profile.registeredLocation</Text>
          <View style={styles.validatedBadge}>
            <Text style={styles.validatedBadgeText}>__hupi_i18n:provider.store-profile.validatedByHupi</Text>
          </View>
        </View>
        <Text style={styles.inlineHint}>__hupi_i18n:provider.store-profile.theseDataWereValidatedByHupiToModifyThem</Text>
        <Text style={styles.inlineMuted}>__hupi_i18n:provider.store-profile.notVisibleToThePublicIfTheStoreOperates</Text>
        <View style={styles.readOnlyGrid}>
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.registeredProvince" value={profile.province} />
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.registeredCity" value={profile.city} />
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.addressOrRegisteredCollectionPoint" value={profile.pickupAddress} />
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.registeredReference" value={profile.addressReference} />
        </View>

        <View style={styles.divider} />
        <Text style={styles.subsectionTitle}>__hupi_i18n:provider.store-profile.registeredContact</Text>
        <Text style={styles.inlineMuted}>__hupi_i18n:provider.store-profile.thisDataIsInternalToTheHupiOperationAnd</Text>
        <View style={styles.readOnlyGrid}>
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.internalContactTelephoneNumber" value={`${profile.internalPhoneCountryCode} ${profile.internalPhoneNumber}`} />
          <ReadOnlyMutedField label="__hupi_i18n:provider.store-profile.internalContactEmail" value={profile.internalEmail} />
        </View>

        <View style={styles.divider} />
        <View style={styles.scheduleBlock}>
          <Text style={styles.subsectionTitle}>{hasPhysicalStore ? 'Horario de atención requerido' : 'Horario de atención'}</Text>
          <Text style={styles.inlineHint}>__hupi_i18n:provider.store-profile.thisScheduleWillBeShownToCustomersInYour</Text>
          <View style={styles.scheduleRows}>
            {profile.scheduleDays.map((day) => (
              <ScheduleRow
                day={day}
                expandedSelect={expandedSelect}
                key={day.day}
                onToggleDay={() => updateScheduleDay(day.day, { enabled: !day.enabled })}
                onToggleSelect={setExpandedSelect}
                onUpdate={(updates) => updateScheduleDay(day.day, updates)}
              />
            ))}
          </View>
        </View>
      </SectionCard>

      <SectionCard
        icon="image-outline"
        note="Formato recomendado: imagen cuadrada. Se mostrará como imagen principal de tu tienda."
        title="__hupi_i18n:common.brandingLogo"
      >
        <View style={styles.logoUploadRow}>
          <View style={styles.logoPreview}>
            <Text style={styles.logoPreviewEmoji}>{profile.logo}</Text>
          </View>
          <View style={styles.logoUploadCopy}>
            <Text style={styles.logoUploadTitle}>__hupi_i18n:common.logoPreview</Text>
            <Text style={styles.logoUploadText}>{profile.logoFileName ?? 'Sin archivo adjunto'}</Text>
            <Pressable onPress={attachLogoMock} style={styles.uploadButton}>
              <Ionicons color={colors.primary} name="cloud-upload-outline" size={17} />
              <Text style={styles.uploadButtonText}>__hupi_i18n:common.attachFile</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.inputLabel}>__hupi_i18n:common.storeIcon</Text>
        <View style={styles.logoOptions}>
          {logoMockOptions.map((logo) => (
            <Pressable
              key={logo}
              onPress={() => updateProfile('logo', logo)}
              style={[styles.logoOption, profile.logo === logo && styles.logoOptionActive]}
            >
              <Text style={styles.logoOptionText}>{logo}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <Card style={styles.saveCard}>
        <View style={styles.saveCopy}>
          <Text style={styles.saveTitle}>__hupi_i18n:common.saveProfile</Text>
          <Text style={styles.saveText}>__hupi_i18n:provider.store-profile.theChangesAreSavedForThisTestSession</Text>
        </View>
        <Button icon="save-outline" onPress={saveProfile} title="__hupi_i18n:common.saveProfile" />
      </Card>

      <Card style={styles.supportCard}>
        <View style={styles.ticketIntro}>
          <View style={styles.ticketIcon}>
            <Ionicons color={colors.primary} name="document-text-outline" size={18} />
          </View>
          <View style={styles.ticketCopy}>
            <Text style={styles.ticketTitle}>__hupi_i18n:provider.store-profile.doYouNeedToUpdateYourLegalOrTax</Text>
            <Text style={styles.ticketText}>__hupi_i18n:provider.store-profile.createAnUpdateTicketForTheHupiTeamTo</Text>
          </View>
        </View>
        <Pressable onPress={() => setTicketFormVisible((current) => !current)} style={styles.secondaryButton}>
          <Ionicons color={colors.primary} name={ticketFormVisible ? 'chevron-up' : 'create-outline'} size={17} />
          <Text style={styles.secondaryButtonText}>__hupi_i18n:provider.store-profile.requestUpdate</Text>
        </Pressable>

        {ticketFormVisible ? (
          <View style={styles.ticketForm}>
            <Text style={styles.ticketFormTitle}>__hupi_i18n:provider.store-profile.legalDataUpdateTicket</Text>
            <Dropdown
              expanded={expandedSelect === 'legal-ticket-type'}
              label="__hupi_i18n:provider.store-profile.requestType"
              onSelect={(value) => { setTicketType(value as LegalDataUpdateRequestType); setExpandedSelect(null); }}
              onToggle={() => setExpandedSelect((current) => (current === 'legal-ticket-type' ? null : 'legal-ticket-type'))}
              options={legalTicketTypeOptions}
              value={ticketType}
            />
            <MockInput
              label="__hupi_i18n:provider.store-profile.descriptionOfTheRequestedChange"
              multiline
              onChangeText={setTicketDescription}
              value={ticketDescription}
            />
            <View style={styles.attachmentBox}>
              <View style={styles.attachmentCopy}>
                <Text style={styles.inputLabel}>__hupi_i18n:provider.store-profile.attachSupportingDocument</Text>
                <Text style={styles.attachmentText}>{ticketAttachmentName ?? 'Sin documento adjunto'}</Text>
              </View>
              <Pressable onPress={attachLegalDocumentMock} style={styles.uploadButton}>
                <Ionicons color={colors.primary} name="attach-outline" size={17} />
                <Text style={styles.uploadButtonText}>__hupi_i18n:common.attach</Text>
              </Pressable>
            </View>
            <Button icon="send-outline" onPress={sendLegalUpdateTicket} title="__hupi_i18n:common.submitTicket" />
            {createdTicketNumber ? (
              <View style={styles.ticketConfirmation}>
                <Ionicons color={colors.success} name="checkmark-circle" size={18} />
                <View style={styles.ticketCopy}>
                  <Text style={styles.ticketSuccess}>__hupi_i18n:provider.store-profile.ticketCreatedCorrectly {createdTicketNumber}</Text>
                  <Text style={styles.ticketText}>__hupi_i18n:provider.store-profile.theHupiTeamWillReviewYourRequestAndNotify</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>

      <HupiSuccessModal
        description="__hupi_i18n:common.yourRequestWasRegisteredCorrectly"
        onClose={() => setTicketSuccessVisible(false)}
        reference={createdTicketNumber ? `Ticket #${createdTicketNumber}` : undefined}
        title="__hupi_i18n:common.ticketSent"
        visible={ticketSuccessVisible}
      />
    </ScreenContainer>
  );
}

function SectionCard({
  children,
  icon,
  note,
  title,
}: {
  children: ReactNode;
  icon: keyof typeof Ionicons.glyphMap;
  note: string;
  title: string;
}) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons color={colors.primary} name={icon} size={18} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.noteBox}>
        <Ionicons color={colors.secondary} name="information-circle-outline" size={16} />
        <Text style={styles.noteText}>{note}</Text>
      </View>
      {children}
    </Card>
  );
}

function MockInput({
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

function ReadOnlyMutedField({ label, value }: { label: string; value: string }) {
  const { isDark, tokens } = useTheme();

  return (
    <View
      style={[
        styles.readOnlyField,
        isDark && {
          backgroundColor: tokens.surfacePurple,
          borderColor: tokens.border,
          opacity: 1,
        },
      ]}
    >
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue}>{value}</Text>
    </View>
  );
}

function ChipGroup({
  label,
  multiple = false,
  onSelect,
  options,
  selected,
}: {
  label: string;
  multiple?: boolean;
  onSelect: (value: string) => void;
  options: string[];
  selected: string[];
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}{multiple ? ' · selección múltiple' : ''}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <Pressable key={option} onPress={() => onSelect(option)} style={[styles.chip, active && styles.activeChip]}>
              <Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Dropdown({
  expanded,
  label,
  onSelect,
  onToggle,
  options,
  required = false,
  value,
}: {
  expanded: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: string[];
  required?: boolean;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}{required ? ' *' : ''}</Text>
      <Pressable onPress={onToggle} style={styles.dropdownButton}>
        <Text style={styles.dropdownValue}>{value || 'Seleccionar'}</Text>
        <Ionicons color={colors.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>
      {expanded ? (
        <View style={styles.dropdownList}>
          {options.map((option) => (
            <Pressable key={option} onPress={() => onSelect(option)} style={styles.dropdownOption}>
              <Text style={[styles.dropdownOptionText, value === option && styles.dropdownOptionTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function PhoneField({
  code,
  expandedSelect,
  label,
  number,
  onSelectCode,
  onToggleCode,
  onUpdateNumber,
  selectKey,
}: {
  code: string;
  expandedSelect: string | null;
  label: string;
  number: string;
  onSelectCode: (value: string) => void;
  onToggleCode: () => void;
  onUpdateNumber: (value: string) => void;
  selectKey: string;
}) {
  const expanded = expandedSelect === selectKey;

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.phoneRow}>
        <Pressable onPress={onToggleCode} style={styles.countryCodeButton}>
          <Text style={styles.countryCodeText}>{code}</Text>
          <Ionicons color={colors.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={15} />
        </Pressable>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={onUpdateNumber}
          placeholder="__hupi_i18n:common.number"
          placeholderTextColor={colors.textMuted}
          style={styles.phoneInput}
          value={number}
        />
      </View>
      {expanded ? (
        <View style={styles.dropdownList}>
          {countryDialCodes.map((item) => (
            <Pressable key={item.code} onPress={() => onSelectCode(item.code)} style={styles.dropdownOption}>
              <Text style={[styles.dropdownOptionText, code === item.code && styles.dropdownOptionTextActive]}>{item.country} · {item.code}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function ScheduleRow({
  day,
  expandedSelect,
  onToggleDay,
  onToggleSelect,
  onUpdate,
}: {
  day: ProviderStoreScheduleDay;
  expandedSelect: string | null;
  onToggleDay: () => void;
  onToggleSelect: (value: string | null) => void;
  onUpdate: (updates: Partial<ProviderStoreScheduleDay>) => void;
}) {
  const openKey = `open-${day.day}`;
  const closeKey = `close-${day.day}`;

  return (
    <View style={styles.scheduleRow}>
      <Pressable onPress={onToggleDay} style={styles.dayToggle}>
        <Ionicons color={day.enabled ? colors.primary : colors.textMuted} name={day.enabled ? 'checkbox' : 'square-outline'} size={21} />
        <Text style={[styles.dayText, !day.enabled && styles.dayTextMuted]}>{day.day}</Text>
      </Pressable>
      {day.enabled ? (
        <View style={styles.hoursRow}>
          <HourSelector
            expanded={expandedSelect === openKey}
            onSelect={(value) => { onUpdate({ opensAt: value }); onToggleSelect(null); }}
            onToggle={() => onToggleSelect(expandedSelect === openKey ? null : openKey)}
            value={day.opensAt}
          />
          <Text style={styles.hourSeparator}>-</Text>
          <HourSelector
            expanded={expandedSelect === closeKey}
            onSelect={(value) => { onUpdate({ closesAt: value }); onToggleSelect(null); }}
            onToggle={() => onToggleSelect(expandedSelect === closeKey ? null : closeKey)}
            value={day.closesAt}
          />
        </View>
      ) : (
        <Text style={styles.closedText}>__hupi_i18n:common.inactive</Text>
      )}
    </View>
  );
}

function HourSelector({
  expanded,
  onSelect,
  onToggle,
  value,
}: {
  expanded: boolean;
  onSelect: (value: string) => void;
  onToggle: () => void;
  value: string;
}) {
  return (
    <View style={styles.hourSelectWrap}>
      <Pressable onPress={onToggle} style={styles.hourButton}>
        <Text style={styles.hourButtonText}>{value}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.hourList}>
          {hourOptions.map((hour) => (
            <Pressable key={hour} onPress={() => onSelect(hour)} style={styles.hourOption}>
              <Text style={[styles.hourOptionText, value === hour && styles.hourOptionTextActive]}>{hour}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Badge({ icon, text, tone }: { icon?: keyof typeof Ionicons.glyphMap; text: string; tone: 'purple' | 'success' }) {
  return (
    <View style={[styles.statusBadge, tone === 'success' ? styles.successBadge : styles.purpleBadge]}>
      {icon ? <Ionicons color={tone === 'success' ? colors.success : colors.secondary} name={icon} size={13} /> : null}
      <Text style={[styles.statusBadgeText, tone === 'success' ? styles.successText : styles.purpleText]}>{text}</Text>
    </View>
  );
}

function summarizeSchedule(scheduleDays: ProviderStoreScheduleDay[]) {
  const activeDays = scheduleDays.filter((day) => day.enabled);

  if (activeDays.length === 0) {
    return 'Sin días activos';
  }

  const first = activeDays[0];
  const allSameHours = activeDays.every((day) => day.opensAt === first.opensAt && day.closesAt === first.closesAt);

  return allSameHours
    ? `${activeDays.map((day) => day.day).join(', ')} · ${first.opensAt} a ${first.closesAt}`
    : activeDays.map((day) => `${day.day} ${day.opensAt}-${day.closesAt}`).join(' · ');
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  badgeCard: { flexDirection: 'row', gap: 12, marginTop: 22, shadowOpacity: 0 },
  logoBubble: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 30 },
  badgeCopy: { flex: 1 },
  storeName: { color: colors.text, fontSize: 17, fontWeight: '900' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  statusBadge: { minHeight: 25, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9 },
  successBadge: { backgroundColor: '#eef9f3' },
  purpleBadge: { backgroundColor: colors.secondarySoft },
  statusBadgeText: { fontSize: 12, fontWeight: '900' },
  successText: { color: colors.success },
  purpleText: { color: colors.secondary },
  lockedText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 8, fontWeight: '800' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11, marginTop: 14 },
  noticeText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },
  section: { gap: 12, marginTop: 14, shadowOpacity: 0.04 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '900' },
  noteBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 15, backgroundColor: colors.soft, padding: 11 },
  noteText: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  inlineHint: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  inlineMuted: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  subsectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  subsectionTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  validatedBadge: { minHeight: 27, borderRadius: 999, backgroundColor: colors.soft, justifyContent: 'center', paddingHorizontal: 10 },
  validatedBadgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  readOnlyGrid: { gap: 9 },
  readOnlyField: { borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: '#f6f4ea', opacity: 0.76, padding: 11, gap: 7 },
  readOnlyLabel: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  readOnlyValue: { color: colors.text, fontSize: 15, fontWeight: '900' },
  divider: { height: 1, backgroundColor: colors.border },
  ticketIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 15, backgroundColor: colors.primarySoft, padding: 11 },
  ticketIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  ticketCopy: { flex: 1, gap: 3 },
  ticketTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  ticketText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  secondaryButton: { minHeight: 42, borderRadius: 999, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 13 },
  secondaryButtonText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  ticketForm: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 12, gap: 12 },
  ticketFormTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  attachmentBox: { borderRadius: 15, backgroundColor: colors.soft, padding: 11, gap: 10 },
  attachmentCopy: { gap: 4 },
  attachmentText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  ticketConfirmation: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 15, backgroundColor: '#eef9f3', padding: 11 },
  ticketSuccess: { color: colors.text, fontSize: 13, fontWeight: '900' },
  inputGroup: { gap: 6 },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '800' },
  multiline: { minHeight: 84, paddingTop: 11, textAlignVertical: 'top' },
  lockedField: { borderRadius: 14, backgroundColor: colors.secondarySoft, padding: 11 },
  lockedLabel: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  lockedValue: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 3 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 35, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 11 },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeChipText: { color: colors.white },
  dropdownButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  dropdownValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  dropdownList: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden' },
  dropdownOption: { minHeight: 38, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12 },
  dropdownOptionText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: '900' },
  phoneRow: { flexDirection: 'row', gap: 8 },
  countryCodeButton: { width: 96, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  countryCodeText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  phoneInput: { flex: 1, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '800' },
  scheduleBlock: { gap: 8 },
  scheduleRows: { gap: 8 },
  scheduleRow: { borderRadius: 15, backgroundColor: colors.soft, padding: 10, gap: 8 },
  dayToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  dayTextMuted: { color: colors.textMuted },
  hoursRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  hourSelectWrap: { flex: 1 },
  hourButton: { minHeight: 38, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  hourButtonText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  hourSeparator: { color: colors.textMuted, fontSize: 16, fontWeight: '900', paddingTop: 9 },
  hourList: { borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, marginTop: 5, overflow: 'hidden' },
  hourOption: { minHeight: 34, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border },
  hourOptionText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  hourOptionTextActive: { color: colors.primary, fontWeight: '900' },
  closedText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  logoUploadRow: { flexDirection: 'row', gap: 12 },
  logoPreview: { width: 96, height: 96, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logoPreviewEmoji: { fontSize: 44 },
  logoUploadCopy: { flex: 1, gap: 6 },
  logoUploadTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  logoUploadText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  uploadButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11 },
  uploadButtonText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  logoOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  logoOption: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  logoOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  logoOptionText: { fontSize: 23 },
  saveCard: { gap: 12, marginTop: 14, shadowOpacity: 0.04 },
  supportCard: { gap: 12, marginTop: 14, shadowOpacity: 0.04 },
  saveCopy: { gap: 3 },
  saveTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  saveText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
});
