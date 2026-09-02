import type { ImageSourcePropType } from 'react-native';

export type ProfileAvatarType = 'owner' | 'pet' | 'provider';

export const DEFAULT_PROFILE_IMAGES: Record<ProfileAvatarType, ImageSourcePropType> = {
  owner: require('../../assets/profile-defaults/dueno_hupi.jpeg'),
  pet: require('../../assets/profile-defaults/mascota_hupi.jpeg'),
  provider: require('../../assets/profile-defaults/proveedor_hupi.jpeg'),
};

