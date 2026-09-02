type Translate = (key: string) => string;

export const HUPI_STANDARD_WALK_CANCELLATION_POLICY = {
  id: 'hupi_standard_walk_cancellation',
  titleKey: 'providerProfile.cancellation.title',
  subtitleKey: 'providerProfile.cancellation.informativeSummary',
  customerSummaryKey: 'providerProfile.cancellation.standardCustomerSummary',
  refundLabelKey: 'providerProfile.cancellation.refund',
  balanceLabelKey: 'providerProfile.cancellation.hupiBalance',
  specialConditions: [
    'provider_cancelled',
    'provider_no_show',
    'provider_late',
    'client_unavailable',
    'walk_start',
    'difficult_weather',
    'operational_delay_extension',
  ],
} as const;

export type SpecialWalkConditionId = (typeof HUPI_STANDARD_WALK_CANCELLATION_POLICY.specialConditions)[number];

export type SpecialWalkCondition = {
  id: SpecialWalkConditionId;
  title: string;
  description: string;
  isSelectable: false;
};

export function getHupiStandardWalkCancellationPolicy(t: Translate) {
  return {
    id: HUPI_STANDARD_WALK_CANCELLATION_POLICY.id,
    title: t(HUPI_STANDARD_WALK_CANCELLATION_POLICY.titleKey),
    subtitle: t(HUPI_STANDARD_WALK_CANCELLATION_POLICY.subtitleKey),
    customerSummary: t(HUPI_STANDARD_WALK_CANCELLATION_POLICY.customerSummaryKey),
    refundLabel: t(HUPI_STANDARD_WALK_CANCELLATION_POLICY.refundLabelKey),
    balanceLabel: t(HUPI_STANDARD_WALK_CANCELLATION_POLICY.balanceLabelKey),
    specialConditions: HUPI_STANDARD_WALK_CANCELLATION_POLICY.specialConditions.map((id) => ({
      id,
      title: t(`providerProfile.cancellation.specialConditions.${id}.title`),
      description: t(`providerProfile.cancellation.specialConditions.${id}.customer`),
      isSelectable: false as const,
    })),
  };
}

export function getSpecialWalkConditions(t: Translate): SpecialWalkCondition[] {
  return getHupiStandardWalkCancellationPolicy(t).specialConditions;
}
