import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';

import type { AddressIconKey } from '@/domain/address';

const addressIconNames: Record<AddressIconKey, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  briefcase: 'briefcase-outline',
  heart: 'heart-outline',
  people: 'people-outline',
  school: 'school-outline',
  fitness: 'barbell-outline',
  medical: 'medical-outline',
  location: 'location-outline',
};

export function AddressIcon({
  color,
  iconKey,
  size = 20,
}: {
  color: string;
  iconKey: AddressIconKey;
  size?: number;
}) {
  return <Ionicons color={color} name={addressIconNames[iconKey]} size={size} />;
}
