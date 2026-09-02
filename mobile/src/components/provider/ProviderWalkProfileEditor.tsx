import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Input } from '@/components/Input';
import { WalkSpecialConditionsAccordion } from '@/components/provider/WalkSpecialConditionsAccordion';
import { colors } from '@/constants/colors';
import { isBookableServiceEnabled } from '@/constants/features';
import type { MockProvider } from '@/constants/mockProviders';
import { fonts } from '@/constants/typography';
import {
  getMockProviderProfileDraft,
  saveMockProviderProfileDraft,
  submitMockProviderPlanForReview,
  submitMockProviderProfileForReview,
  touchProviderPlan,
} from '@/data/mockProviderProfileRepository';
import {
  DOG_AGE_OPTIONS,
  DOG_SIZE_OPTIONS,
  createProviderPlanDraftVersion,
  getProviderCompletionChecklist,
  isValidCertification,
  isValidProviderPlan,
  MAX_DOGS_PER_WALK,
  MAX_PROVIDER_DESCRIPTION_LENGTH,
  SERVICE_REQUIREMENT_OPTIONS,
  SPECIAL_HANDLING_OPTIONS,
  WALK_MODALITY_OPTIONS,
  WALK_TYPE_OPTIONS,
  type ProviderCertification,
  type ProviderWalkPlan,
  type ProviderWalkProfile,
} from '@/domain/providerWalkProfile';
import { getProviderWalkHourlyRate } from '@/domain/providerPricing';
import { useMockProviderProfile } from '@/hooks/useMockProviderProfile';
import { Pressable, Text, TextInput } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

type SectionKey = 'about' | 'walks' | 'requirements' | 'certifications' | 'plans';

export function ProviderWalkProfileEditor({ mode = 'all', provider }: { mode?: 'all' | 'plans' | 'publicProfile'; provider: MockProvider }) {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string) => string;
  const profileVersion = useMockProviderProfile();
  const [draft, setDraft] = useState(() => getMockProviderProfileDraft(provider.id));
  const [activeSection, setActiveSection] = useState<SectionKey | null>(mode === 'plans' ? 'plans' : 'about');
  const [feedback, setFeedback] = useState('');
  const hourlyRate = getProviderWalkHourlyRate(provider);
  const completion = useMemo(
    () => getProviderCompletionChecklist(draft, hourlyRate, provider.zone),
    [draft, hourlyRate, provider.zone],
  );
  const sectionCompletion: Record<SectionKey, boolean> = {
    about: Boolean(draft.description.trim()),
    walks: draft.acceptedDogSizes.length > 0 && draft.acceptedDogAges.length > 0 && draft.maximumDogsPerWalk >= 1 && draft.modalities.length > 0,
    requirements: draft.requirements.length > 0,
    certifications: draft.certifications.length === 0 || draft.certifications.every((certificate) => isValidCertification(certificate)),
    plans: draft.plans.some((plan) => isValidProviderPlan(plan)),
  };
  const canManagePlans = provider.walkProfile.status === 'approved'
    && isBookableServiceEnabled('walk')
    && completion.items.description
    && completion.items.walkConfiguration
    && completion.items.requirements
    && completion.items.hourlyRate
    && completion.items.coverageZone
    && completion.items.activePlan;

  useEffect(() => {
    setDraft(getMockProviderProfileDraft(provider.id));
  }, [profileVersion, provider.id]);

  const update = (next: Partial<ProviderWalkProfile>) => {
    setDraft((current) => ({ ...current, ...next, status: 'draft' }));
    setFeedback('');
  };

  const save = () => {
    if (!draft.description.trim()) {
      setActiveSection('about');
      setFeedback(t('providerProfile.errors.descriptionRequired'));
      return;
    }
    const saved = saveMockProviderProfileDraft(provider.id, draft);
    setDraft(saved);
    setFeedback(t('providerProfile.savedDraft'));
  };

  const submitPlan = (planId: string) => {
    const submitted = submitMockProviderPlanForReview(provider.id, draft, planId);
    if (!submitted) {
      setFeedback(t('providerProfile.plans.errors.completeRequired'));
      return;
    }
    setDraft(submitted);
    setFeedback(t('providerProfile.plans.submitted'));
  };

  const submit = () => {
    saveMockProviderProfileDraft(provider.id, draft);
    const submitted = submitMockProviderProfileForReview(provider.id, hourlyRate, provider.zone);
    setFeedback(submitted ? t('providerProfile.submitted') : t('providerProfile.errors.completeRequired'));
  };

  const allSections: Array<{ key: SectionKey; label: string }> = [
    { key: 'about', label: t('providerProfile.steps.about') },
    { key: 'walks', label: t('providerProfile.steps.walks') },
    { key: 'requirements', label: t('providerProfile.steps.requirements') },
    { key: 'certifications', label: t('providerProfile.steps.certifications') },
    { key: 'plans', label: t('providerProfile.steps.plans') },
  ];
  const sections = allSections.filter((section) => mode === 'all'
    || (mode === 'plans' ? section.key === 'plans' : section.key !== 'plans'));

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{t(mode === 'plans' ? 'providerWalks.plans' : 'providerProfile.editorTitle')}</Text>
      <Text style={styles.subtitle}>{t(mode === 'plans' ? 'providerWalks.plansHint' : 'providerProfile.editorSubtitle')}</Text>

      {mode !== 'plans' ? <Card style={styles.checklist} tone={completion.isComplete ? 'soft' : 'coral'}>
        <Text style={styles.checklistTitle}>{completion.isComplete ? t('providerProfile.checklist.ready') : t('providerProfile.checklist.notVisible')}</Text>
        {Object.entries(completion.items).map(([key, complete]) => (
          <View key={key} style={styles.checkRow}>
            <Ionicons color={complete ? colors.success : colors.warning} name={complete ? 'checkmark-circle' : 'ellipse-outline'} size={17} />
            <Text style={styles.checkText}>{translate(`providerProfile.checklist.items.${key}`)}</Text>
          </View>
        ))}
        <Text style={styles.status}>{t('providerProfile.approvalStatus', { status: t(`providerProfile.statuses.${draft.status}`) })}</Text>
      </Card> : null}

      {mode !== 'plans' ? <WalkSpecialConditionsAccordion /> : null}

      <View style={styles.stepList}>
        {sections.map((section, index) => {
          const active = activeSection === section.key;
          return (
            <View key={section.key} style={styles.stepWrapper}>
              <Pressable
                accessibilityLabel={`${section.label}. ${t(sectionCompletion[section.key] ? 'providerProfile.fieldComplete' : 'providerProfile.fieldMissing')}`}
                accessibilityRole="button"
                accessibilityState={{ expanded: active }}
                onPress={() => setActiveSection((current) => current === section.key ? null : section.key)}
                style={[styles.stepHeader, active && styles.stepHeaderActive]}
              >
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <Text style={styles.stepTitle}>{section.label}</Text>
                <Text style={[styles.stepState, sectionCompletion[section.key] && styles.stepStateComplete]}>{t(sectionCompletion[section.key] ? 'providerProfile.fieldComplete' : 'providerProfile.fieldMissing')}</Text>
                <Ionicons color={colors.secondary} name={active ? 'chevron-up' : 'chevron-down'} size={19} />
              </Pressable>
              {active ? (
                <Card style={styles.editorCard}>
                  {section.key === 'about' ? <AboutEditor draft={draft} onChange={update} /> : null}
                  {section.key === 'walks' ? <WalkConfigurationEditor draft={draft} onChange={update} /> : null}
                  {section.key === 'requirements' ? <RequirementsEditor draft={draft} onChange={update} /> : null}
                  {section.key === 'certifications' ? <CertificationsEditor draft={draft} onChange={update} /> : null}
                  {section.key === 'plans' ? (
                    <PlansEditor
                      canManagePlans={canManagePlans}
                      draft={draft}
                      onChange={update}
                      onSave={save}
                      onSubmit={submitPlan}
                    />
                  ) : null}
                </Card>
              ) : null}
            </View>
          );
        })}
      </View>

      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.feedback, !completion.isComplete && styles.feedbackError]}>{feedback}</Text> : null}
      {mode !== 'plans' ? <View style={styles.actions}>
        <Button onPress={save} style={styles.action} title={t('providerProfile.saveDraft')} variant="outline" />
        <Button disabled={!completion.isComplete} onPress={submit} style={styles.action} title={t('providerProfile.sendForReview')} />
      </View> : null}
    </View>
  );
}

function AboutEditor({ draft, onChange }: EditorProps) {
  const { t } = useTranslation();
  const count = draft.description.length;
  return (
    <View style={styles.fields}>
      <Text style={styles.fieldTitle}>{t('providerProfile.aboutField')}</Text>
      <Text style={styles.helper}>{t('providerProfile.aboutHelper')}</Text>
      <TextInput
        maxLength={MAX_PROVIDER_DESCRIPTION_LENGTH}
        multiline
        onChangeText={(description) => onChange({ description: description.slice(0, MAX_PROVIDER_DESCRIPTION_LENGTH) })}
        placeholder={t('providerProfile.aboutPlaceholder')}
        style={styles.multilineInput}
        value={draft.description}
      />
      <Text style={styles.counter}>{t('providerProfile.characterCounter', { count, max: MAX_PROVIDER_DESCRIPTION_LENGTH })}</Text>
      {!draft.description.trim() ? <Text style={styles.inlineError}>{t('providerProfile.errors.descriptionRequired')}</Text> : null}
    </View>
  );
}

function WalkConfigurationEditor({ draft, onChange }: EditorProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.fields}>
      <MultiChoice label={t('providerProfile.sizes.title')} options={DOG_SIZE_OPTIONS} selected={draft.acceptedDogSizes} translationPrefix="providerProfile.sizes.options" onChange={(acceptedDogSizes) => onChange({ acceptedDogSizes })} />
      <MultiChoice label={t('providerProfile.ages.title')} options={DOG_AGE_OPTIONS} selected={draft.acceptedDogAges} translationPrefix="providerProfile.ages.options" onChange={(acceptedDogAges) => onChange({ acceptedDogAges })} />
      <Input
        keyboardType="number-pad"
        label={t('providerProfile.maximumDogs.field')}
        onChangeText={(value) => /^\d*$/.test(value) && onChange({ maximumDogsPerWalk: value ? Math.min(Number(value), MAX_DOGS_PER_WALK) : 0 })}
        value={draft.maximumDogsPerWalk ? String(draft.maximumDogsPerWalk) : ''}
      />
      {draft.maximumDogsPerWalk < 1 ? <Text style={styles.inlineError}>{t('providerProfile.errors.maximumDogs')}</Text> : null}
      <MultiChoice label={t('providerProfile.modalities.title')} options={WALK_MODALITY_OPTIONS} selected={draft.modalities} translationPrefix="providerProfile.modalities.options" onChange={(modalities) => onChange({ modalities })} />
      <MultiChoice label={t('providerProfile.walkTypes.title')} options={WALK_TYPE_OPTIONS} selected={draft.walkTypes} translationPrefix="providerProfile.walkTypes.options" onChange={(walkTypes) => onChange({ walkTypes })} />
      <MultiChoice label={t('providerProfile.specialHandling.title')} options={SPECIAL_HANDLING_OPTIONS} selected={draft.specialHandling} translationPrefix="providerProfile.specialHandling.options" onChange={(specialHandling) => onChange({ specialHandling })} />
    </View>
  );
}

function RequirementsEditor({ draft, onChange }: EditorProps) {
  const { t } = useTranslation();
  return <MultiChoice label={t('providerProfile.requirements.title')} options={SERVICE_REQUIREMENT_OPTIONS} selected={draft.requirements} translationPrefix="providerProfile.requirements.options" onChange={(requirements) => onChange({ requirements })} />;
}

function CertificationsEditor({ draft, onChange }: EditorProps) {
  const { t } = useTranslation();
  const updateCertificate = (index: number, next: Partial<ProviderCertification>) => {
    const certifications = draft.certifications.map((certificate, itemIndex) => itemIndex === index ? { ...certificate, ...next, status: 'draft' as const } : certificate);
    onChange({ certifications });
  };
  return (
    <View style={styles.fields}>
      {draft.certifications.map((certificate, index) => (
        <View key={certificate.id} style={styles.nestedCard}>
          <Input label={t('providerProfile.certifications.name')} onChangeText={(name) => updateCertificate(index, { name })} value={certificate.name} />
          <Input label={t('providerProfile.certifications.institution')} onChangeText={(institution) => updateCertificate(index, { institution })} value={certificate.institution} />
          <Input keyboardType="number-pad" label={t('providerProfile.certifications.year')} onChangeText={(year) => /^\d{0,4}$/.test(year) && updateCertificate(index, { year: year ? Number(year) : null })} value={certificate.year ? String(certificate.year) : ''} />
          {!isValidCertification(certificate) ? <Text style={styles.inlineError}>{t('providerProfile.errors.certificate')}</Text> : null}
          <Button onPress={() => onChange({ certifications: draft.certifications.filter((_, itemIndex) => itemIndex !== index) })} title={t('common.delete')} variant="ghost" />
        </View>
      ))}
      <Button onPress={() => onChange({ certifications: [...draft.certifications, { id: `certificate-${Date.now()}`, name: '', institution: '', year: null, status: 'draft' }] })} title={t('providerProfile.certifications.add')} variant="outline" />
    </View>
  );
}

function PlansEditor({ canManagePlans, draft, onChange, onSave, onSubmit }: EditorProps & {
  canManagePlans: boolean;
  onSave: () => void;
  onSubmit: (planId: string) => void;
}) {
  const { i18n, t } = useTranslation();
  const insets = useSafeAreaInsets();
  const translate = t as unknown as (key: string) => string;
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [visibleDetailId, setVisibleDetailId] = useState<string | null>(null);
  const editingPlan = draft.plans.find((plan) => plan.id === editingPlanId);

  const replacePlan = (planId: string, next: Partial<ProviderWalkPlan>) => {
    onChange({
      plans: draft.plans.map((plan) => plan.id === planId
        ? touchProviderPlan({ ...plan, ...next })
        : plan),
    });
  };

  const addPlan = () => {
    const plan = createEmptyPlan();
    onChange({ plans: [...draft.plans, plan] });
    setEditingPlanId(plan.id);
  };

  const editApprovedPlan = (plan: ProviderWalkPlan) => {
    const existingVersion = draft.plans.find((item) => item.replacesPlanId === plan.id && (
      item.status === 'draft' || item.status === 'changes_requested' || item.status === 'pending_approval'
    ));
    if (existingVersion) {
      setEditingPlanId(existingVersion.status === 'pending_approval' ? null : existingVersion.id);
      setVisibleDetailId(existingVersion.id);
      return;
    }
    const nextVersion = createProviderPlanDraftVersion(plan);
    onChange({ plans: [...draft.plans, nextVersion] });
    setEditingPlanId(nextVersion.id);
  };

  const duplicatePlan = (plan: ProviderWalkPlan) => {
    const duplicate = createEmptyPlan({
      ...plan,
      id: `plan-draft-${Date.now()}`,
      version: 1,
      versionRootId: undefined,
      replacesPlanId: undefined,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      reviewNotes: undefined,
      name: t('providerProfile.plans.copyName', { name: plan.name }),
    });
    onChange({ plans: [...draft.plans, duplicate] });
    setEditingPlanId(duplicate.id);
  };

  const archivePlan = (planId: string) => {
    replacePlan(planId, { status: 'archived', isAvailable: false });
    if (editingPlanId === planId) setEditingPlanId(null);
  };

  const submitPlan = (planId: string) => {
    onSubmit(planId);
    setEditingPlanId(null);
  };

  return (
    <View style={styles.fields}>
      <View style={styles.planManagementHeader}>
        <View style={styles.planManagementCopy}>
          <Text style={styles.planManagementTitle}>{t('providerProfile.plans.managementTitle')}</Text>
          <Text style={styles.helper}>{t('providerProfile.plans.managementHelper')}</Text>
        </View>
        <Button disabled={!canManagePlans} icon="add" onPress={addPlan} style={styles.createPlanButton} title={t('providerProfile.plans.create')} />
      </View>
      {!canManagePlans ? <Text style={styles.inlineError}>{t('providerProfile.plans.eligibilityHint')}</Text> : null}

      {draft.plans.length === 0 ? (
        <View style={styles.emptyPlans}>
          <Ionicons color={colors.secondary} name="albums-outline" size={30} />
          <Text style={styles.emptyPlansTitle}>{t('providerProfile.plans.emptyTitle')}</Text>
          <Text style={styles.helper}>{t('providerProfile.plans.emptyBody')}</Text>
          <Button disabled={!canManagePlans} onPress={addPlan} title={t('providerProfile.plans.create')} />
        </View>
      ) : (
        <View style={styles.planList}>
          {draft.plans.map((plan) => {
            const detailsVisible = visibleDetailId === plan.id;
            const canEditDirectly = plan.status === 'draft' || plan.status === 'changes_requested';
            const canArchive = plan.status === 'draft' || plan.status === 'changes_requested' || plan.status === 'rejected';
            const canSubmit = canEditDirectly && isValidProviderPlan(plan);
            const displayPrice = Number.isFinite(plan.price) ? plan.price : 0;
            return (
              <View key={plan.id} style={styles.planCard}>
                <View style={styles.planCardHeader}>
                  <View style={styles.planCardCopy}>
                    <Text style={styles.planCardName}>{plan.name.trim() || t('providerProfile.plans.untitled')}</Text>
                    <Text style={styles.planCardMeta}>
                      {t(`providerProfile.plans.types.${plan.type}`)} · {t('providerProfile.plans.summaryDuration', { count: safeInteger(plan.durationMinutes) })}
                    </Text>
                  </View>
                  <View accessibilityLabel={t('providerProfile.plans.statusLabel', { status: t(`providerProfile.statuses.${plan.status}`) })} accessible style={[styles.planStatusBadge, statusBadgeStyle(plan.status)]}>
                    <Text style={styles.planStatusText}>{t(`providerProfile.statuses.${plan.status}`)}</Text>
                  </View>
                </View>
                <View style={styles.planFacts}>
                  <PlanFact label={t('providerProfile.plans.walkCount')} value={String(safeInteger(plan.walkCount))} />
                  <PlanFact label={t('providerProfile.plans.frequency')} value={plan.frequencyPerWeek ? String(safeInteger(plan.frequencyPerWeek)) : t('providerProfile.plans.notApplicable')} />
                  <PlanFact label={t('providerProfile.plans.validity')} value={plan.validityDays ? t('providerProfile.plans.summaryDays', { count: safeInteger(plan.validityDays) }) : t('providerProfile.plans.notApplicable')} />
                  <PlanFact label={t('providerProfile.plans.price')} value={formatPlanPrice(displayPrice, i18n.language)} />
                </View>
                <Text style={styles.planUpdated}>{t('providerProfile.plans.updatedAt', { date: formatPlanDate(plan.updatedAt, i18n.language) })}</Text>
                {detailsVisible ? (
                  <View style={styles.planDetails}>
                    <Text style={styles.planDescription}>{plan.description || t('providerProfile.plans.noDescription')}</Text>
                    <Text style={styles.planDetailLine}>{t('providerProfile.plans.petsIncluded')}: {safeInteger(plan.petsIncluded)}</Text>
                    <Text style={styles.planDetailLine}>{t('providerProfile.plans.modality')}: {t(`providerProfile.modalities.options.${plan.modality}`)}</Text>
                    <Text style={styles.planDetailLine}>{t('providerProfile.plans.includes')}: {plan.includes.join(' · ') || t('providerProfile.plans.notDefined')}</Text>
                    <Text style={styles.planDetailLine}>{t('providerProfile.plans.conditions')}: {plan.specificConditions.join(' · ') || t('providerProfile.plans.notDefined')}</Text>
                    {plan.reviewNotes ? <Text style={styles.reviewNotes}>{t('providerProfile.plans.hupiNotes')}: {plan.reviewNotes}</Text> : null}
                  </View>
                ) : null}
                <View style={styles.planActions}>
                  <PlanAction icon="eye-outline" label={t(plan.status === 'draft' ? 'providerProfile.plans.preview' : 'providerProfile.plans.view')} onPress={() => setVisibleDetailId(detailsVisible ? null : plan.id)} />
                  {canEditDirectly ? <PlanAction icon="create-outline" label={t(plan.status === 'changes_requested' ? 'providerProfile.plans.correct' : 'providerProfile.plans.edit')} onPress={() => setEditingPlanId(plan.id)} /> : null}
                  {plan.status === 'approved' ? <PlanAction icon="git-branch-outline" label={t('providerProfile.plans.edit')} onPress={() => editApprovedPlan(plan)} /> : null}
                  {plan.status === 'approved' || plan.status === 'rejected' ? <PlanAction icon="copy-outline" label={t('providerProfile.plans.duplicate')} onPress={() => duplicatePlan(plan)} /> : null}
                  {plan.status === 'changes_requested' ? <PlanAction icon="chatbox-ellipses-outline" label={t('providerProfile.plans.viewNotes')} onPress={() => setVisibleDetailId(plan.id)} /> : null}
                  {canEditDirectly ? <PlanAction disabled={!canSubmit} icon="paper-plane-outline" label={t('providerProfile.sendForReview')} onPress={() => submitPlan(plan.id)} /> : null}
                  {canArchive ? <PlanAction icon="archive-outline" label={t('providerProfile.plans.archive')} onPress={() => archivePlan(plan.id)} /> : null}
                  {plan.status === 'pending_approval' ? <Text style={styles.reviewState}>{t('providerProfile.plans.reviewInProgress')}</Text> : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {editingPlan ? (
        <Modal animationType="slide" onRequestClose={() => setEditingPlanId(null)} transparent visible>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalRoot}>
            <View style={styles.modalOverlay}>
              <View style={[styles.planModal, { marginBottom: Math.max(insets.bottom, 12), marginTop: Math.max(insets.top, 12) }]}>
                <View style={styles.planEditorHeader}>
                  <View style={styles.planManagementCopy}>
                    <Text style={styles.planEditorTitle}>{t(editingPlan.replacesPlanId ? 'providerProfile.plans.newVersionTitle' : 'providerProfile.plans.editorTitle')}</Text>
                    {editingPlan.replacesPlanId ? <Text style={styles.helper}>{t('providerProfile.plans.versionHelper')}</Text> : null}
                  </View>
                  <Pressable accessibilityLabel={t('common.close')} accessibilityRole="button" onPress={() => setEditingPlanId(null)} style={styles.closePlanEditor}>
                    <Ionicons color={colors.secondary} name="close" size={20} />
                  </Pressable>
                </View>
                <ScrollView contentContainerStyle={styles.planEditor} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                  {editingPlan.status === 'changes_requested' ? <Text style={styles.reviewNotes}>{t('providerProfile.plans.hupiNotes')}: {editingPlan.reviewNotes || t('providerProfile.plans.noReviewNotes')}</Text> : null}
                  <Input label={t('providerProfile.plans.name')} onChangeText={(name) => replacePlan(editingPlan.id, { name })} value={editingPlan.name} />
                  <Input label={t('providerProfile.plans.description')} multiline onChangeText={(description) => replacePlan(editingPlan.id, { description })} value={editingPlan.description} />
                  <Text style={styles.fieldTitle}>{t('providerProfile.plans.type')}</Text>
                  <SingleChoice options={['individual', 'recurring'] as const} selected={editingPlan.type} translationPrefix="providerProfile.plans.types" onChange={(type) => replacePlan(editingPlan.id, { type })} />
                  <View style={styles.twoColumns}>
                    <Input containerStyle={styles.column} keyboardType="number-pad" label={t('providerProfile.plans.duration')} onChangeText={(value) => /^\d*$/.test(value) && replacePlan(editingPlan.id, { durationMinutes: value ? Number(value) : 0 })} value={editingPlan.durationMinutes ? String(editingPlan.durationMinutes) : ''} />
                    <Input containerStyle={styles.column} keyboardType="number-pad" label={t('providerProfile.plans.walkCount')} onChangeText={(value) => /^\d*$/.test(value) && replacePlan(editingPlan.id, { walkCount: value ? Number(value) : 0 })} value={editingPlan.walkCount ? String(editingPlan.walkCount) : ''} />
                  </View>
                  <View style={styles.twoColumns}>
                    <Input containerStyle={styles.column} keyboardType="number-pad" label={t('providerProfile.plans.petsIncluded')} onChangeText={(value) => /^\d*$/.test(value) && replacePlan(editingPlan.id, { petsIncluded: value ? Number(value) : 0 })} value={editingPlan.petsIncluded ? String(editingPlan.petsIncluded) : ''} />
                    <Input containerStyle={styles.column} keyboardType="decimal-pad" label={t('providerProfile.plans.price')} onChangeText={(value) => /^\d*([.,]\d{0,2})?$/.test(value) && replacePlan(editingPlan.id, { price: value ? Number(value.replace(',', '.')) : 0 })} value={editingPlan.price ? String(editingPlan.price) : ''} />
                  </View>
                  <Text style={styles.fieldTitle}>{t('providerProfile.plans.modality')}</Text>
                  <SingleChoice options={WALK_MODALITY_OPTIONS} selected={editingPlan.modality} translationPrefix="providerProfile.modalities.options" onChange={(modality) => replacePlan(editingPlan.id, { modality })} />
                  {editingPlan.type === 'recurring' ? <>
                    <View style={styles.twoColumns}>
                      <Input containerStyle={styles.column} keyboardType="number-pad" label={t('providerProfile.plans.frequency')} onChangeText={(value) => /^\d*$/.test(value) && replacePlan(editingPlan.id, { frequencyPerWeek: value ? Number(value) : undefined })} value={String(editingPlan.frequencyPerWeek ?? '')} />
                      <Input containerStyle={styles.column} keyboardType="number-pad" label={t('providerProfile.plans.validity')} onChangeText={(value) => /^\d*$/.test(value) && replacePlan(editingPlan.id, { validityDays: value ? Number(value) : undefined })} value={String(editingPlan.validityDays ?? '')} />
                    </View>
                    <Text style={styles.fieldTitle}>{t('providerProfile.plans.frequencyType')}</Text>
                    <SingleChoice options={['required', 'recommended', 'customer_configurable'] as const} selected={editingPlan.frequencyType} translationPrefix="providerProfile.plans.frequencyTypes" onChange={(frequencyType) => replacePlan(editingPlan.id, { frequencyType })} />
                  </> : null}
                  <Input label={t('providerProfile.plans.includes')} multiline onChangeText={(value) => replacePlan(editingPlan.id, { includes: splitList(value) })} value={editingPlan.includes.join(', ')} />
                  <Input label={t('providerProfile.plans.conditions')} multiline onChangeText={(value) => replacePlan(editingPlan.id, { specificConditions: splitList(value) })} value={editingPlan.specificConditions.join(', ')} />
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: editingPlan.isAvailable }}
                    onPress={() => replacePlan(editingPlan.id, { isAvailable: !editingPlan.isAvailable })}
                    style={styles.availableRow}
                  >
                    <Ionicons color={editingPlan.isAvailable ? colors.success : colors.textMuted} name={editingPlan.isAvailable ? 'checkbox' : 'square-outline'} size={21} />
                    <Text style={styles.checkText}>{t('providerProfile.plans.available')}</Text>
                  </Pressable>
                  {!isValidProviderPlan(editingPlan) ? (
                    <View style={styles.validationBox}>
                      <Text style={styles.validationTitle}>{t('providerProfile.plans.errors.title')}</Text>
                      {getPlanValidationErrors(editingPlan).map((key) => <Text key={key} style={styles.inlineError}>• {translate(`providerProfile.plans.errors.${key}`)}</Text>)}
                    </View>
                  ) : null}
                  <View style={styles.editorActions}>
                    <Button onPress={() => setEditingPlanId(null)} style={styles.editorAction} title={t('common.cancel')} variant="outline" />
                    <Button onPress={() => { onSave(); setEditingPlanId(null); }} style={styles.editorAction} title={t('common.save')} variant="secondary" />
                    <Button disabled={!isValidProviderPlan(editingPlan)} onPress={() => submitPlan(editingPlan.id)} style={styles.editorActionWide} title={t('providerProfile.sendForReview')} />
                  </View>
                </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </View>
  );
}

function MultiChoice<T extends string>({ disabled = false, label, onChange, options, selected, translationPrefix }: { disabled?: boolean; label: string; onChange: (value: T[]) => void; options: readonly T[]; selected: T[]; translationPrefix: string }) {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string) => string;
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.fieldTitle}>{label}</Text>
      <View style={styles.choiceWrap}>
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: active, disabled }}
              disabled={disabled}
              key={option}
              onPress={() => onChange(active ? selected.filter((item) => item !== option) : [...selected, option])}
              style={[styles.choice, active && styles.choiceActive, disabled && styles.choiceDisabled]}
            >
              {active ? <Ionicons color={colors.white} name="checkmark-circle" size={16} /> : null}
              <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{translate(`${translationPrefix}.${option}`)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function SingleChoice<T extends string>({ disabled = false, onChange, options, selected, translationPrefix }: { disabled?: boolean; onChange: (value: T) => void; options: readonly T[]; selected: T; translationPrefix: string }) {
  const { t } = useTranslation();
  const translate = t as unknown as (key: string) => string;
  return <View accessibilityRole="radiogroup" style={styles.choiceWrap}>{options.map((option) => {
    const active = selected === option;
    return (
      <Pressable accessibilityRole="radio" accessibilityState={{ selected: active, disabled }} disabled={disabled} key={option} onPress={() => onChange(option)} style={[styles.choice, active && styles.choiceActive, disabled && styles.choiceDisabled]}>
        {active ? <Ionicons color={colors.white} name="checkmark-circle" size={16} /> : null}
        <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{translate(`${translationPrefix}.${option}`)}</Text>
      </Pressable>
    );
  })}</View>;
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return <View style={styles.planFact}><Text style={styles.planFactLabel}>{label}</Text><Text style={styles.planFactValue}>{value}</Text></View>;
}

function PlanAction({ disabled = false, icon, label, onPress }: { disabled?: boolean; icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.planAction, disabled && styles.planActionDisabled]}>
      <Ionicons color={colors.secondary} name={icon} size={15} />
      <Text style={styles.planActionText}>{label}</Text>
    </Pressable>
  );
}

function safeInteger(value: number | undefined) {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value ?? 0)) : 0;
}

function formatPlanPrice(value: number, language: string) {
  return new Intl.NumberFormat(language, { currency: 'USD', style: 'currency' }).format(Number.isFinite(value) ? value : 0);
}

function formatPlanDate(value: string | undefined, language: string) {
  const date = value ? new Date(value) : undefined;
  if (!date || !Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function statusBadgeStyle(status: ProviderWalkPlan['status']) {
  if (status === 'approved') return styles.planStatusApproved;
  if (status === 'changes_requested' || status === 'rejected' || status === 'suspended') return styles.planStatusWarning;
  if (status === 'pending_approval') return styles.planStatusPending;
  if (status === 'archived' || status === 'superseded') return styles.planStatusMuted;
  return styles.planStatusDraft;
}

function getPlanValidationErrors(plan: ProviderWalkPlan) {
  const errors: string[] = [];
  if (!plan.name.trim()) errors.push('name');
  if (!plan.description.trim()) errors.push('description');
  if (!Number.isInteger(plan.durationMinutes) || plan.durationMinutes <= 0) errors.push('duration');
  if (!Number.isInteger(plan.walkCount) || plan.walkCount <= 0) errors.push('walkCount');
  if (!Number.isInteger(plan.petsIncluded) || plan.petsIncluded <= 0) errors.push('petsIncluded');
  if (!Number.isFinite(plan.price) || plan.price <= 0) errors.push('price');
  if (!plan.includes.length) errors.push('includes');
  if (plan.type === 'recurring' && (!Number.isInteger(plan.frequencyPerWeek) || (plan.frequencyPerWeek ?? 0) <= 0)) errors.push('frequency');
  if (plan.type === 'recurring' && (!Number.isInteger(plan.validityDays) || (plan.validityDays ?? 0) <= 0)) errors.push('validity');
  return errors;
}

function createEmptyPlan(overrides: Partial<ProviderWalkPlan> = {}): ProviderWalkPlan {
  const now = new Date();
  return {
    id: `plan-draft-${now.getTime()}`,
    version: 1,
    name: '',
    description: '',
    type: 'individual',
    durationMinutes: 60,
    walkCount: 1,
    frequencyType: 'customer_configurable',
    petsIncluded: 1,
    modality: 'individual',
    price: 0,
    includes: [],
    specificConditions: [],
    isAvailable: true,
    status: 'draft',
    updatedAt: now.toISOString(),
    ...overrides,
  };
}

type EditorProps = { draft: ProviderWalkProfile; onChange: (next: Partial<ProviderWalkProfile>) => void };

const styles = StyleSheet.create({
  container: { gap: 13, marginTop: 24 },
  heading: { color: colors.text, fontFamily: fonts.bold, fontSize: 22, lineHeight: 29 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  checklist: { gap: 8, shadowOpacity: 0 },
  checklistTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  checkRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  checkText: { color: colors.text, flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  status: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, marginTop: 4 },
  stepList: { gap: 9 },
  stepWrapper: { gap: 8 },
  stepHeader: { alignItems: 'center', backgroundColor: colors.soft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 56, paddingHorizontal: 12, paddingVertical: 10 },
  stepHeaderActive: { borderColor: colors.secondary },
  stepNumber: { alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  stepNumberText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12 },
  stepTitle: { color: colors.text, flex: 1, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  stepState: { color: colors.warning, flexShrink: 1, fontFamily: fonts.medium, fontSize: 11, lineHeight: 16, textAlign: 'right' },
  stepStateComplete: { color: colors.success },
  editorCard: { shadowOpacity: 0 },
  fields: { gap: 14 },
  fieldTitle: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21, marginBottom: 2 },
  helper: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 12, lineHeight: 18 },
  multilineInput: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 15, borderWidth: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14, minHeight: 112, padding: 13, textAlignVertical: 'top' },
  counter: { alignSelf: 'flex-end', color: colors.textMuted, fontFamily: fonts.light, fontSize: 12 },
  inlineError: { color: colors.danger, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  choiceGroup: { gap: 8 },
  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 999, borderWidth: 1, flexDirection: 'row', gap: 6, minHeight: 40, justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 8 },
  choiceActive: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  choiceDisabled: { opacity: 0.45 },
  choiceText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  choiceTextActive: { color: colors.white },
  nestedCard: { backgroundColor: colors.soft, borderRadius: 16, gap: 11, padding: 12 },
  availableRow: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 9, minHeight: 48, paddingHorizontal: 12, paddingVertical: 9 },
  twoColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  column: { flexBasis: 145, flexGrow: 1, minWidth: 0 },
  planManagementHeader: { alignItems: 'flex-start', gap: 12 },
  planManagementCopy: { flex: 1, minWidth: 0 },
  planManagementTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 19, lineHeight: 25, marginBottom: 4 },
  createPlanButton: { alignSelf: 'stretch' },
  emptyPlans: { alignItems: 'center', backgroundColor: colors.soft, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 9, padding: 20 },
  emptyPlansTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 17, lineHeight: 23, textAlign: 'center' },
  planList: { gap: 12 },
  planCard: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 11, padding: 13 },
  planCardHeader: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  planCardCopy: { flex: 1, minWidth: 160 },
  planCardName: { color: colors.text, fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  planCardMeta: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 3 },
  planStatusBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  planStatusApproved: { backgroundColor: colors.successSoft },
  planStatusDraft: { backgroundColor: colors.primarySoft },
  planStatusPending: { backgroundColor: colors.secondarySoft },
  planStatusWarning: { backgroundColor: colors.warningSoft },
  planStatusMuted: { backgroundColor: colors.soft },
  planStatusText: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 15 },
  planFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  planFact: { backgroundColor: colors.soft, borderRadius: 11, flexBasis: 116, flexGrow: 1, gap: 2, paddingHorizontal: 9, paddingVertical: 7 },
  planFactLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 10, lineHeight: 14 },
  planFactValue: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17 },
  planUpdated: { color: colors.textMuted, fontFamily: fonts.light, fontSize: 11, lineHeight: 16 },
  planDetails: { backgroundColor: colors.soft, borderRadius: 13, gap: 6, padding: 11 },
  planDescription: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },
  planDetailLine: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  reviewNotes: { backgroundColor: colors.warningSoft, borderRadius: 12, color: colors.text, fontFamily: fonts.medium, fontSize: 12, lineHeight: 18, padding: 10 },
  planActions: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  planAction: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 5, minHeight: 36, paddingHorizontal: 9, paddingVertical: 7 },
  planActionDisabled: { opacity: 0.42 },
  planActionText: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 15 },
  reviewState: { color: colors.secondary, fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 17, paddingHorizontal: 4 },
  modalRoot: { flex: 1 },
  modalOverlay: { backgroundColor: colors.overlay, flex: 1, justifyContent: 'center', paddingHorizontal: 14 },
  planModal: { alignSelf: 'center', backgroundColor: colors.soft, borderColor: colors.secondary, borderRadius: 22, borderWidth: 1, maxHeight: '94%', maxWidth: 560, overflow: 'hidden', paddingTop: 14, width: '100%' },
  planEditor: { gap: 13, padding: 14, paddingBottom: 22 },
  planEditorHeader: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  planEditorTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  closePlanEditor: { alignItems: 'center', backgroundColor: colors.secondarySoft, borderRadius: 16, height: 34, justifyContent: 'center', width: 34 },
  validationBox: { backgroundColor: colors.warningSoft, borderRadius: 13, gap: 3, padding: 10 },
  validationTitle: { color: colors.text, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },
  editorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  editorAction: { flexBasis: 145, flexGrow: 1 },
  editorActionWide: { flexBasis: '100%', flexGrow: 1 },
  feedback: { color: colors.success, fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 19 },
  feedbackError: { color: colors.danger },
  actions: { flexDirection: 'row', gap: 9 },
  action: { flex: 1 },
});
