import { useMemo, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import {
  beginProviderEnrollment,
  submitLocalProviderVerification,
  updateLocalProviderDraft,
  validateLocalProviderEmail,
} from '@/data/localProviderRepository';
import {
  canSubmitProviderVerification,
  getMissingProviderSections,
  getProviderVerificationProgress,
  getProviderVerificationSections,
  type ProviderEntityType,
  type ProviderVerificationSectionKey,
} from '@/domain/providerVerification';
import { getQaVerificationSection, getQaVerificationStepLabelKey, normalizeQaVerificationStep } from '@/domain/qaTools';
import { isDevelopmentBundle } from '@/config/environment';
import { useLocalAccount } from '@/hooks/useLocalAccount';
import { useLocalProvider } from '@/hooks/useLocalProvider';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

const sectionIcons: Record<ProviderVerificationSectionKey, keyof typeof Ionicons.glyphMap> = {
  account: 'person-circle-outline',
  personal: 'person-outline',
  identity: 'camera-outline',
  address: 'location-outline',
  contact: 'call-outline',
  bank: 'wallet-outline',
  general: 'information-circle-outline',
  company: 'business-outline',
  company_documents: 'documents-outline',
  legal_representative: 'shield-checkmark-outline',
};

export default function ProviderVerificationScreen() {
  const router = useRouter();
  const { qaStep } = useLocalSearchParams<{ qaStep?: string }>();
  const { t } = useTranslation();
  const account = useLocalAccount();
  const enrollment = useLocalProvider();
  const qaStepNumber = normalizeQaVerificationStep(Number(qaStep));
  const qaPreviewActive = isDevelopmentBundle() && Boolean(qaStep);
  const [activeSection, setActiveSection] = useState<ProviderVerificationSectionKey | null>(
    qaPreviewActive ? getQaVerificationSection(qaStepNumber) : enrollment.lastPendingSection,
  );
  const [notice, setNotice] = useState('');
  const sections = useMemo(
    () => getProviderVerificationSections(enrollment, account.profile, account.session.phoneVerified),
    [account.profile, account.session.phoneVerified, enrollment],
  );
  const progress = getProviderVerificationProgress(enrollment, account.profile, account.session.phoneVerified);
  const missing = getMissingProviderSections(enrollment, account.profile, account.session.phoneVerified);
  const canSubmit = canSubmitProviderVerification(enrollment, account.profile, account.session.phoneVerified);

  if (enrollment.status === 'not_started') {
    return (
      <ScreenContainer contentContainerStyle={styles.content}>
        <ProviderPageHeader onBack={() => router.back()} subtitle={t('providerVerification.startHint')} title={t('providerVerification.title')} />
        <Card style={styles.typeCard} tone="purple">
          <Text style={styles.typeTitle}>{t('providerOnboarding.entityQuestion')}</Text>
          <Text style={styles.typeHint}>{t('providerOnboarding.singleAccountHint')}</Text>
          <Button onPress={() => beginProviderEnrollment('natural')} title={t('providerOnboarding.natural')} />
          <Button onPress={() => beginProviderEnrollment('legal')} title={t('providerOnboarding.legal')} variant="secondary" />
        </Card>
      </ScreenContainer>
    );
  }

  const statusLabel = t(`providerVerification.statuses.${enrollment.status}`);
  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader onBack={() => router.back()} subtitle={statusLabel} title={t('providerVerification.title')} />
      {qaPreviewActive ? (
        <Card style={styles.qaPreviewCard} tone="coral">
          <Text style={styles.qaPreviewText}>{t('qaTools.stepPreview', {
            name: t(getQaVerificationStepLabelKey(qaStepNumber)),
            step: qaStepNumber,
          })}</Text>
        </Card>
      ) : null}
      <Card style={styles.progressCard} tone="purple">
        <View style={styles.progressHeader}>
          <View style={styles.progressIcon}><Ionicons color={colors.secondary} name="shield-checkmark" size={27} /></View>
          <View style={styles.progressCopy}>
            <Text style={styles.progressValue}>{t('providerDashboard.completed', { count: progress })}</Text>
            <Text style={styles.progressText}>{t('providerVerification.progressHint')}</Text>
          </View>
        </View>
        <View style={styles.progress}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
        <Text style={styles.entityLabel}>{t(`providerOnboarding.${enrollment.entityType}`)}</Text>
      </Card>

      <Text style={styles.sectionTitle}>{t('providerVerification.steps')}</Text>
      <View style={styles.sectionList}>
        {sections.map((section) => {
          const expanded = activeSection === section.key;
          return (
            <View key={section.key}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setActiveSection(expanded ? null : section.key)}
                style={[styles.sectionHeader, expanded && styles.sectionHeaderActive]}
              >
                <View style={[styles.sectionIcon, section.complete && styles.sectionIconComplete]}>
                  <Ionicons color={section.complete ? colors.success : colors.textMuted} name={sectionIcons[section.key]} size={20} />
                </View>
                <View style={styles.sectionCopy}>
                  <Text style={styles.sectionLabel}>{t(`providerVerification.sections.${section.key}`)}</Text>
                  <Text style={[styles.sectionStatus, section.complete && styles.completeText]}>{t(`providerVerification.sectionStatuses.${section.status}`)}</Text>
                </View>
                {!section.complete ? <Text style={styles.completeCta}>{t('providerVerification.complete')}</Text> : null}
                <Ionicons color={colors.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
              </Pressable>
              {expanded ? (
                <Card style={styles.editorCard}>
                  <SectionEditor entityType={enrollment.entityType} section={section.key} />
                </Card>
              ) : null}
            </View>
          );
        })}
      </View>

      {missing.length > 0 ? (
        <Card style={styles.missingCard} tone="coral">
          <Text style={styles.missingTitle}>{t('providerVerification.missingTitle')}</Text>
          <Text style={styles.missingText}>{missing.map((key) => t(`providerVerification.sections.${key}`)).join(' · ')}</Text>
        </Card>
      ) : null}
      {notice ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text> : null}
      {['submitted', 'under_review'].includes(enrollment.status) ? (
        <Card style={styles.reviewCard} tone="soft">
          <Ionicons color={colors.secondary} name="time-outline" size={22} />
          <View style={styles.reviewCopy}><Text style={styles.reviewTitle}>{t('providerVerification.underReviewTitle')}</Text><Text style={styles.reviewText}>{t('providerVerification.underReviewHint')}</Text></View>
        </Card>
      ) : (
        <Button
          disabled={!canSubmit}
          onDisabledPress={() => setNotice(t('providerVerification.completeMissing'))}
          onPress={() => {
            if (submitLocalProviderVerification()) setNotice(t('providerVerification.submittedNotice'));
          }}
          title={t('providerVerification.submit')}
        />
      )}
      <Button onPress={() => router.replace('/home')} title={t('providerVerification.continueLater')} variant="ghost" />
    </ScreenContainer>
  );
}

function SectionEditor({ entityType, section }: { entityType: ProviderEntityType; section: ProviderVerificationSectionKey }) {
  const { t } = useTranslation();
  const account = useLocalAccount();
  const enrollment = useLocalProvider();
  const { draft } = enrollment;
  const updateIdentity = (next: Partial<typeof draft.identity>) => updateLocalProviderDraft({ identity: { ...draft.identity, ...next } }, section);
  const updateAddress = (next: Partial<typeof draft.address>) => updateLocalProviderDraft({ address: { ...draft.address, ...next } }, section);
  const updateContact = (next: Partial<typeof draft.contact>) => updateLocalProviderDraft({ contact: { ...draft.contact, ...next } }, section);
  const updateBank = (next: Partial<typeof draft.bank>) => updateLocalProviderDraft({ bank: { ...draft.bank, ...next } }, section);
  const updateCompany = (next: Partial<typeof draft.company>) => updateLocalProviderDraft({ company: { ...draft.company, ...next } }, section);
  const updateDocuments = (next: Partial<typeof draft.companyDocuments>) => updateLocalProviderDraft({ companyDocuments: { ...draft.companyDocuments, ...next } }, section);
  const updateRepresentative = (next: Partial<typeof draft.legalRepresentative>) => updateLocalProviderDraft({ legalRepresentative: { ...draft.legalRepresentative, ...next } }, section);

  if (section === 'account') {
    return <View style={styles.fields}>
      <ReadOnlyField label={t('providerVerification.fields.firstName')} value={account.profile.firstName} />
      <ReadOnlyField label={t('providerVerification.fields.lastName')} value={account.profile.lastName} />
      <ReadOnlyField label={t('providerVerification.fields.phone')} value={account.profile.phone} checked={account.session.phoneVerified} />
      <ReadOnlyField label={t('providerVerification.fields.email')} value={account.profile.email} checked={enrollment.emailValidated} />
      {!enrollment.emailValidated ? <Button onPress={validateLocalProviderEmail} title={t('providerVerification.validateEmail')} variant="outline" /> : null}
      <Text style={styles.reuseHint}>{t('providerVerification.accountReuseHint')}</Text>
    </View>;
  }

  if (section === 'personal') {
    return <View style={styles.fields}>
      <ReadOnlyField label={t('providerVerification.fields.names')} value={`${account.profile.firstName} ${account.profile.lastName}`} />
      <Input label={t('providerVerification.fields.nationalId')} keyboardType="number-pad" onChangeText={(nationalId) => updateIdentity({ nationalId })} value={draft.identity.nationalId} />
      <Input label={t('providerVerification.fields.birthDate')} onChangeText={(birthDate) => updateIdentity({ birthDate })} placeholder={t('providerVerification.fields.datePlaceholder')} value={draft.identity.birthDate} />
      <Input label={t('providerVerification.fields.nationality')} onChangeText={(nationality) => updateIdentity({ nationality })} value={draft.identity.nationality} />
      <Input label={t('providerVerification.fields.websiteOptional')} keyboardType="url" onChangeText={(website) => updateLocalProviderDraft({ website }, section)} value={draft.website} />
    </View>;
  }

  if (section === 'identity') {
    return <View style={styles.fields}>
      <Text style={styles.cameraHint}>{t('providerVerification.cameraOnlyHint')}</Text>
      <CameraField cameraType={ImagePicker.CameraType.front} label={t('providerVerification.fields.selfie')} onConfirm={(selfieUri) => updateIdentity({ selfieUri })} value={draft.identity.selfieUri} />
      <CameraField cameraType={ImagePicker.CameraType.back} label={t('providerVerification.fields.idFront')} onConfirm={(idFrontUri) => updateIdentity({ idFrontUri })} value={draft.identity.idFrontUri} />
      <CameraField cameraType={ImagePicker.CameraType.back} label={t('providerVerification.fields.idBack')} onConfirm={(idBackUri) => updateIdentity({ idBackUri })} value={draft.identity.idBackUri} />
    </View>;
  }

  if (section === 'address') {
    const address = entityType === 'legal' ? draft.company : draft.address;
    const isBuilding = address.locationType === 'building';
    return <View style={styles.fields}>
      <Input label={t('providerVerification.fields.address')} onChangeText={(value) => entityType === 'legal' ? updateCompany({ fiscalAddress: value }) : updateAddress({ address: value })} value={entityType === 'legal' ? draft.company.fiscalAddress : draft.address.address} />
      <Input label={t('providerVerification.fields.city')} onChangeText={(city) => entityType === 'legal' ? updateCompany({ city }) : updateAddress({ city })} value={address.city} />
      <Input label={t('providerVerification.fields.sector')} onChangeText={(sector) => entityType === 'legal' ? updateCompany({ sector }) : updateAddress({ sector })} value={address.sector} />
      <Input label={t('providerVerification.fields.houseNumber')} onChangeText={(houseNumber) => entityType === 'legal' ? updateCompany({ houseNumber }) : updateAddress({ houseNumber })} value={address.houseNumber} />
      <ChoiceRow
        options={[{ key: 'house', label: t('providerVerification.fields.house') }, { key: 'building', label: t('providerVerification.fields.building') }]}
        selected={address.locationType}
        onChange={(locationType) => entityType === 'legal' ? updateCompany({ locationType }) : updateAddress({ locationType })}
      />
      {isBuilding ? <>
        <Input label={t('providerVerification.fields.buildingName')} onChangeText={(buildingName) => entityType === 'legal' ? updateCompany({ buildingName }) : updateAddress({ buildingName })} value={address.buildingName} />
        <Input label={t(entityType === 'legal' ? 'providerVerification.fields.officeNumber' : 'providerVerification.fields.unitNumber')} onChangeText={(value) => entityType === 'legal' ? updateCompany({ officeNumber: value }) : updateAddress({ unitNumber: value })} value={entityType === 'legal' ? draft.company.officeNumber : draft.address.unitNumber} />
      </> : null}
    </View>;
  }

  if (section === 'contact') {
    const representative = draft.legalRepresentative;
    const contact = draft.contactIsLegalRepresentative ? { ...representative, role: t('providerVerification.legalRepresentative') } : draft.contact;
    return <View style={styles.fields}>
      {entityType === 'legal' ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.contactIsLegalRepresentative }} onPress={() => updateLocalProviderDraft({ contactIsLegalRepresentative: !draft.contactIsLegalRepresentative }, section)} style={styles.checkRow}>
          <Ionicons color={draft.contactIsLegalRepresentative ? colors.success : colors.textMuted} name={draft.contactIsLegalRepresentative ? 'checkbox' : 'square-outline'} size={22} />
          <Text style={styles.checkText}>{t('providerVerification.sameAsRepresentative')}</Text>
        </Pressable>
      ) : null}
      <Input editable={!draft.contactIsLegalRepresentative} label={t('providerVerification.fields.firstName')} onChangeText={(firstName) => updateContact({ firstName })} value={contact.firstName} />
      <Input editable={!draft.contactIsLegalRepresentative} label={t('providerVerification.fields.lastName')} onChangeText={(lastName) => updateContact({ lastName })} value={contact.lastName} />
      <Input editable={!draft.contactIsLegalRepresentative} label={t('providerVerification.fields.role')} onChangeText={(role) => updateContact({ role })} value={contact.role} />
      <Input editable={!draft.contactIsLegalRepresentative} label={t('providerVerification.fields.phone')} keyboardType="phone-pad" onChangeText={(phone) => updateContact({ phone })} value={contact.phone} />
      <Input editable={!draft.contactIsLegalRepresentative} label={t('providerVerification.fields.email')} keyboardType="email-address" onChangeText={(email) => updateContact({ email })} value={contact.email} />
    </View>;
  }

  if (section === 'bank') {
    return <View style={styles.fields}>
      <Text style={styles.formHeading}>{t('providerVerification.paymentData')}</Text>
      <Input label={t('providerVerification.fields.bank')} onChangeText={(bank) => updateBank({ bank })} value={draft.bank.bank} />
      <Input label={t('providerVerification.fields.accountType')} onChangeText={(accountType) => updateBank({ accountType })} value={draft.bank.accountType} />
      <Input label={t('providerVerification.fields.accountNumber')} keyboardType="number-pad" onChangeText={(accountNumber) => /^\d*$/.test(accountNumber) && updateBank({ accountNumber })} value={draft.bank.accountNumber} />
      <Input label={t('providerVerification.fields.accountHolder')} onChangeText={(accountHolder) => updateBank({ accountHolder })} value={draft.bank.accountHolder} />
      <Input label={t('providerVerification.fields.holderTaxId')} onChangeText={(holderTaxId) => updateBank({ holderTaxId })} value={draft.bank.holderTaxId} />
      <Text style={styles.reuseHint}>{t('providerVerification.noBankCertificate')}</Text>
    </View>;
  }

  if (section === 'general') {
    return <View style={styles.fields}>
      <Input label={t('providerVerification.fields.generalInformation')} multiline onChangeText={(generalInformation) => updateLocalProviderDraft({ generalInformation }, section)} value={draft.generalInformation} />
      <Input label={t('providerVerification.fields.websiteOptional')} keyboardType="url" onChangeText={(website) => updateLocalProviderDraft({ website }, section)} value={draft.website} />
    </View>;
  }

  if (section === 'company') {
    return <View style={styles.fields}>
      <Input label={t('providerVerification.fields.legalName')} onChangeText={(legalName) => updateCompany({ legalName })} value={draft.company.legalName} />
      <Input label={t('providerVerification.fields.tradeName')} onChangeText={(tradeName) => updateCompany({ tradeName })} value={draft.company.tradeName} />
      <Input label="RUC" keyboardType="number-pad" onChangeText={(ruc) => updateCompany({ ruc })} value={draft.company.ruc} />
      <Input label={t('providerVerification.fields.companyType')} onChangeText={(companyType) => updateCompany({ companyType })} value={draft.company.companyType} />
      <Input label={t('providerVerification.fields.incorporationDate')} onChangeText={(incorporationDate) => updateCompany({ incorporationDate })} placeholder={t('providerVerification.fields.datePlaceholder')} value={draft.company.incorporationDate} />
      <Input label={t('providerVerification.fields.phone')} keyboardType="phone-pad" onChangeText={(phone) => updateCompany({ phone })} value={draft.company.phone} />
      <Input label={t('providerVerification.fields.businessEmail')} keyboardType="email-address" onChangeText={(email) => updateCompany({ email })} value={draft.company.email} />
      <Input label={t('providerVerification.fields.websiteOptional')} keyboardType="url" onChangeText={(website) => updateCompany({ website })} value={draft.company.website} />
    </View>;
  }

  if (section === 'company_documents') {
    return <View style={styles.fields}>
      <MockDocumentField label="RUC" onAttach={(rucDocumentUri) => updateDocuments({ rucDocumentUri })} value={draft.companyDocuments.rucDocumentUri} />
      <MockDocumentField label={t('providerVerification.fields.incorporationDocument')} onAttach={(incorporationDocumentUri) => updateDocuments({ incorporationDocumentUri })} value={draft.companyDocuments.incorporationDocumentUri} />
      <MockDocumentField label={t('providerVerification.fields.representativeAppointment')} onAttach={(legalRepresentativeAppointmentUri) => updateDocuments({ legalRepresentativeAppointmentUri })} value={draft.companyDocuments.legalRepresentativeAppointmentUri} />
      <Text style={styles.reuseHint}>{t('providerVerification.noExtraCertificates')}</Text>
    </View>;
  }

  return <View style={styles.fields}>
    <Input label={t('providerVerification.fields.firstName')} onChangeText={(firstName) => updateRepresentative({ firstName })} value={draft.legalRepresentative.firstName} />
    <Input label={t('providerVerification.fields.lastName')} onChangeText={(lastName) => updateRepresentative({ lastName })} value={draft.legalRepresentative.lastName} />
    <Input label={t('providerVerification.fields.nationalId')} keyboardType="number-pad" onChangeText={(nationalId) => updateRepresentative({ nationalId })} value={draft.legalRepresentative.nationalId} />
    <Input label={t('providerVerification.fields.phone')} keyboardType="phone-pad" onChangeText={(phone) => updateRepresentative({ phone })} value={draft.legalRepresentative.phone} />
    <Input label={t('providerVerification.fields.email')} keyboardType="email-address" onChangeText={(email) => updateRepresentative({ email })} value={draft.legalRepresentative.email} />
    <Text style={styles.cameraHint}>{t('providerVerification.cameraOnlyHint')}</Text>
    <CameraField cameraType={ImagePicker.CameraType.front} label={t('providerVerification.fields.selfie')} onConfirm={(selfieUri) => updateRepresentative({ selfieUri })} value={draft.legalRepresentative.selfieUri} />
    <CameraField cameraType={ImagePicker.CameraType.back} label={t('providerVerification.fields.idFront')} onConfirm={(idFrontUri) => updateRepresentative({ idFrontUri })} value={draft.legalRepresentative.idFrontUri} />
    <CameraField cameraType={ImagePicker.CameraType.back} label={t('providerVerification.fields.idBack')} onConfirm={(idBackUri) => updateRepresentative({ idBackUri })} value={draft.legalRepresentative.idBackUri} />
  </View>;
}

function ReadOnlyField({ checked, label, value }: { checked?: boolean; label: string; value: string }) {
  return <View style={styles.readOnly}><View style={styles.readOnlyCopy}><Text style={styles.readOnlyLabel}>{label}</Text><Text style={styles.readOnlyValue}>{value || '—'}</Text></View>{checked !== undefined ? <Ionicons color={checked ? colors.success : colors.warning} name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={20} /> : null}</View>;
}

function ChoiceRow<T extends string>({ onChange, options, selected }: { onChange: (value: T) => void; options: Array<{ key: T; label: string }>; selected: T }) {
  return <View style={styles.choiceRow}>{options.map((option) => <Pressable key={option.key} onPress={() => onChange(option.key)} style={[styles.choice, selected === option.key && styles.choiceSelected]}><Text style={[styles.choiceText, selected === option.key && styles.choiceTextSelected]}>{option.label}</Text></Pressable>)}</View>;
}

function CameraField({ cameraType, label, onConfirm, value }: { cameraType: ImagePicker.CameraType; label: string; onConfirm: (uri: string) => void; value: string }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState('');
  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, cameraType, mediaTypes: ['images'], quality: 0.75 });
    if (!result.canceled) setPreview(result.assets[0]?.uri ?? '');
  };
  const visibleUri = preview || value;
  return <View style={styles.cameraField}>
    <Text style={styles.cameraLabel}>{label}</Text>
    {visibleUri && !visibleUri.startsWith('mock://') ? <Image source={{ uri: visibleUri }} style={styles.cameraPreview} /> : <View style={styles.cameraPlaceholder}><Ionicons color={value ? colors.success : colors.textMuted} name={value ? 'checkmark-circle' : 'camera-outline'} size={28} /></View>}
    <View style={styles.cameraActions}>
      <Button onPress={capture} style={styles.cameraAction} title={value || preview ? t('providerVerification.retake') : t('providerVerification.takePhoto')} variant="outline" />
      {preview ? <Button onPress={() => { onConfirm(preview); setPreview(''); }} style={styles.cameraAction} title={t('providerVerification.confirmPhoto')} /> : null}
    </View>
  </View>;
}

function MockDocumentField({ label, onAttach, value }: { label: string; onAttach: (uri: string) => void; value: string }) {
  const { t } = useTranslation();
  return <View style={styles.documentField}><View style={styles.documentCopy}><Text style={styles.cameraLabel}>{label}</Text><Text style={styles.documentStatus}>{value ? t('providerVerification.documentAttached') : t('providerVerification.pending')}</Text></View><Button onPress={() => onAttach(`mock://document/${Date.now()}`)} title={value ? t('providerVerification.replace') : t('providerVerification.attach')} variant="outline" /></View>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 42, paddingTop: 8 },
  typeCard: { gap: 12, marginTop: 22, shadowOpacity: 0 },
  qaPreviewCard: { shadowOpacity: 0 },
  qaPreviewText: { color: colors.primary, fontSize: 13, fontWeight: '900', lineHeight: 19 },
  typeTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  typeHint: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  progressCard: { gap: 12, marginTop: 10, shadowOpacity: 0 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  progressIcon: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 18, height: 54, justifyContent: 'center', width: 54 },
  progressCopy: { flex: 1, minWidth: 0 },
  progressValue: { color: colors.text, fontSize: 19, fontWeight: '900', lineHeight: 25 },
  progressText: { color: colors.textMuted, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 2 },
  progress: { backgroundColor: colors.white, borderRadius: 999, height: 9, overflow: 'hidden' },
  progressFill: { backgroundColor: colors.secondary, borderRadius: 999, height: '100%' },
  entityLabel: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', lineHeight: 27, marginTop: 12 },
  sectionList: { gap: 9 },
  sectionHeader: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 70, padding: 12 },
  sectionHeaderActive: { borderColor: colors.secondary },
  sectionIcon: { alignItems: 'center', backgroundColor: colors.soft, borderRadius: 14, height: 42, justifyContent: 'center', width: 42 },
  sectionIconComplete: { backgroundColor: colors.successSoft },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionLabel: { color: colors.text, fontSize: 14, fontWeight: '900', lineHeight: 20 },
  sectionStatus: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 2 },
  completeText: { color: colors.success },
  completeCta: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  editorCard: { gap: 12, marginTop: 7, shadowOpacity: 0 },
  fields: { gap: 13 },
  formHeading: { color: colors.text, fontSize: 17, fontWeight: '900' },
  readOnly: { alignItems: 'center', backgroundColor: colors.soft, borderRadius: 14, flexDirection: 'row', gap: 10, minHeight: 56, padding: 12 },
  readOnlyCopy: { flex: 1, minWidth: 0 },
  readOnlyLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  readOnlyValue: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 2 },
  reuseHint: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  choiceRow: { flexDirection: 'row', gap: 8 },
  choice: { alignItems: 'center', backgroundColor: colors.soft, borderColor: colors.border, borderRadius: 999, borderWidth: 1, flex: 1, minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  choiceSelected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  choiceText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  choiceTextSelected: { color: colors.white },
  checkRow: { alignItems: 'center', flexDirection: 'row', gap: 9, minHeight: 44 },
  checkText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 19 },
  cameraHint: { color: colors.secondary, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  cameraField: { borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: 9, padding: 11 },
  cameraLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  cameraPlaceholder: { alignItems: 'center', backgroundColor: colors.soft, borderRadius: 14, height: 90, justifyContent: 'center' },
  cameraPreview: { borderRadius: 14, height: 150, width: '100%' },
  cameraActions: { flexDirection: 'row', gap: 8 },
  cameraAction: { flex: 1, minHeight: 46 },
  documentField: { alignItems: 'center', borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 11 },
  documentCopy: { flex: 1, minWidth: 0 },
  documentStatus: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  missingCard: { gap: 5, shadowOpacity: 0 },
  missingTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  missingText: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  notice: { color: colors.secondary, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  reviewCard: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, shadowOpacity: 0 },
  reviewCopy: { flex: 1 },
  reviewTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  reviewText: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 3 },
});
