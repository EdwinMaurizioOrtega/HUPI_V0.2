import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet,
} from 'react-native';
import { useTranslation } from '../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { fonts } from '@/constants/typography';
import type { ProfileAvatarType } from '@/constants/defaultProfileImages';
import { Alert, Pressable, Text } from '@/i18n/components';
import { ProfileAvatar } from './ProfileAvatar';

type ProfilePhotoPickerProps = {
  imageUri?: string;
  label: string;
  onChange: (imageUri?: string) => void;
  size?: number;
  editable?: boolean;
  compact?: boolean;
  type: ProfileAvatarType;
};

export function ProfilePhotoPicker({
  imageUri,
  label,
  onChange,
  size = 88,
  editable = true,
  compact = false,
  type,
}: ProfilePhotoPickerProps) {
  const { t } = useTranslation();

  const pickFromLibrary = async () => {
    if (!editable) {
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t('profile.photo.permissionTitle'),
        t('profile.photo.libraryPermission'),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.82,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('profile.photo.permissionTitle'), t('profile.photo.cameraPermission'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      onChange(result.assets[0].uri);
    }
  };

  const openPhotoActions = () => {
    if (!editable) return;
    Alert.alert(
      t('profile.photo.title'),
      t('profile.photo.optional'),
      [
        { text: t('profile.photo.gallery'), onPress: () => void pickFromLibrary() },
        { text: t('profile.photo.camera'), onPress: () => void takePhoto() },
        ...(imageUri ? [{ text: t('profile.photo.remove'), onPress: () => onChange(undefined), style: 'destructive' as const }] : []),
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const photo = (
    <Pressable
      accessibilityLabel={label}
      accessibilityHint={t('profile.photo.accessibilityHint')}
      accessibilityRole="button"
      disabled={!editable}
      onPress={openPhotoActions}
      style={({ pressed }) => [
        styles.photoButton,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
      ]}
    >
      <ProfileAvatar size={size - 4} type={type} uri={imageUri}>
        {editable ? (
          <View style={styles.editBadge}>
            <Ionicons color={colors.white} name="camera-outline" size={14} />
          </View>
        ) : null}
      </ProfileAvatar>
    </Pressable>
  );

  if (compact) {
    return photo;
  }

  return (
    <View style={styles.wrap}>
      {photo}
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {editable ? (
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={openPhotoActions} style={styles.actionButton}>
              <Text style={styles.actionText}>{imageUri ? t('profile.photo.change') : t('profile.photo.add')}</Text>
            </Pressable>
            {imageUri ? (
              <Pressable onPress={() => onChange(undefined)} style={[styles.actionButton, styles.removeButton]}>
                <Text style={[styles.actionText, styles.removeText]}>__hupi_i18n:common.delete</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  photoButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  pressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  editBadge: {
    position: 'absolute',
    right: 3,
    bottom: 3,
    width: 28,
    height: 28,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 8 },
  label: { color: colors.text, fontFamily: fonts.bold, fontSize: 15, fontWeight: '900' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: {
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  removeButton: { backgroundColor: colors.soft },
  actionText: { color: colors.white, fontFamily: fonts.bold, fontSize: 12, fontWeight: '900' },
  removeText: { color: colors.textMuted },
});
