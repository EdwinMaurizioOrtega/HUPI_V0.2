export const QA_WALK_ID = 'QA-WALK-001';

export type QaWalkStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type QaWalkTiming = {
  status: QaWalkStatus;
  startedAt?: string;
  completedAt?: string;
};

export function transitionQaWalk(
  current: QaWalkTiming,
  status: QaWalkStatus,
  timestamp = new Date().toISOString(),
): QaWalkTiming {
  if (status === 'scheduled') return { status: 'scheduled' };
  if (status === 'in_progress') return { status, startedAt: timestamp };
  if (status === 'cancelled') return { status: 'cancelled' };

  return {
    status: 'completed',
    startedAt: current.startedAt ?? timestamp,
    completedAt: timestamp,
  };
}
