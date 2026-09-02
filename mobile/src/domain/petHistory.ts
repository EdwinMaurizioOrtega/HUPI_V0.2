export type DatedPetHistoryItem = {
  dateIso: string;
};

export function filterPetHistoryByDate<T extends DatedPetHistoryItem>(
  history: T[],
  from?: Date | null,
  to?: Date | null,
) {
  const fromTime = from ? new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime() : Number.NEGATIVE_INFINITY;
  const toTime = to ? new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).getTime() : Number.POSITIVE_INFINITY;
  return history.filter((item) => {
    const itemTime = Date.parse(`${item.dateIso}T12:00:00`);
    return itemTime >= fromTime && itemTime <= toTime;
  });
}
