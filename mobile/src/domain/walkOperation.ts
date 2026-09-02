export const PROVIDER_ON_TIME_GRACE_MINUTES = 10;

export type WalkMetricRecord = {
  status: string;
  providerPayout?: number;
  scheduledStartAt: string;
  startedAt?: string;
  cancelledBy?: 'client' | 'provider';
};

export function getWalkElapsedSeconds(startedAt: string | undefined, now = Date.now()) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

export function formatWalkElapsedTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, '0')).join(':');
}

export function getProviderDelayMinutes(record: Pick<WalkMetricRecord, 'scheduledStartAt' | 'startedAt'>) {
  if (!record.startedAt) return undefined;
  return Math.max(0, Math.round((new Date(record.startedAt).getTime() - new Date(record.scheduledStartAt).getTime()) / 60_000));
}

export function calculateProviderWalkMetrics(records: WalkMetricRecord[]) {
  const cancelledByProvider = records.filter((record) => record.cancelledBy === 'provider').length;
  const started = records.filter((record) => record.startedAt);
  const punctual = started.filter((record) => (getProviderDelayMinutes(record) ?? Number.POSITIVE_INFINITY) <= PROVIDER_ON_TIME_GRACE_MINUTES).length;
  return {
    appointments: records.length,
    completed: records.filter((record) => ['Completada', 'Finalizada'].includes(record.status)).length,
    providerCancellations: cancelledByProvider,
    providerCancellationRate: records.length ? cancelledByProvider / records.length : 0,
    providerPunctualityRate: started.length ? punctual / started.length : 0,
    income: records.filter((record) => ['Completada', 'Finalizada'].includes(record.status)).reduce((sum, record) => sum + (record.providerPayout ?? 0), 0),
  };
}
