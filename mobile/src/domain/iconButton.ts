export function resolveIconButtonIconSize(buttonSize: number, requestedSize?: number) {
  const defaultSize = Math.round(buttonSize * 0.5);
  return Math.max(12, Math.min(requestedSize ?? defaultSize, buttonSize - 14));
}

export function formatIconBadge(value: number | string) {
  if (typeof value === 'number') {
    return value > 999 ? '999+' : String(Math.max(0, value));
  }
  return value;
}
