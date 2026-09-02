import { ThemedView as View } from '@/theme/ThemedView';
import {
  useEffect,
  useState,
  type ReactNode } from 'react';
import {
  Image,
  StyleSheet,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import {
  DEFAULT_PROFILE_IMAGES,
  type ProfileAvatarType,
} from '@/constants/defaultProfileImages';
import { colors } from '@/constants/colors';

type ProfileAvatarProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
  type: ProfileAvatarType;
  uri?: string | null;
};

const defaultAccessibilityKeys = {
  owner: 'accessibility.ownerAvatar',
  pet: 'accessibility.petAvatar',
  provider: 'accessibility.providerAvatar',
} as const;

export function hasUsableProfileImageUri(uri?: string | null) {
  return Boolean(uri?.trim());
}

export function getProfileAvatarSource(
  type: ProfileAvatarType,
  uri?: string | null,
  remoteImageFailed = false,
): ImageSourcePropType {
  if (hasUsableProfileImageUri(uri) && !remoteImageFailed) {
    return { uri: uri!.trim() };
  }
  return DEFAULT_PROFILE_IMAGES[type];
}

export function ProfileAvatar({
  accessibilityLabel,
  children,
  size = 48,
  style,
  type,
  uri,
}: ProfileAvatarProps) {
  const { t } = useTranslation();
  const [remoteImageFailed, setRemoteImageFailed] = useState(false);
  const normalizedUri = uri?.trim() || undefined;

  useEffect(() => {
    setRemoteImageFailed(false);
  }, [normalizedUri, type]);

  const source = getProfileAvatarSource(type, normalizedUri, remoteImageFailed);
  const label = accessibilityLabel ?? t(defaultAccessibilityKeys[type]);
  const flattenedStyle = StyleSheet.flatten(style);
  const borderRadius = typeof flattenedStyle?.borderRadius === 'number'
    ? flattenedStyle.borderRadius
    : size / 2;
  const usesRemoteImage = Boolean(normalizedUri) && !remoteImageFailed;
  const resizeMode = usesRemoteImage ? 'cover' : 'contain';

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="image"
      accessible
      style={[
        styles.container,
        style,
        {
          borderRadius,
          height: size,
          width: size,
        },
      ]}
    >
      <View
        style={[
          styles.imageContainer,
          {
            borderRadius,
            height: size,
            width: size,
          },
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          accessible={false}
          onError={() => {
            if (normalizedUri) {
              setRemoteImageFailed(true);
            }
          }}
          resizeMode={resizeMode}
          source={source}
          style={styles.image}
        />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.soft,
    flexShrink: 0,
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageContainer: {
    overflow: 'hidden',
  },
});
