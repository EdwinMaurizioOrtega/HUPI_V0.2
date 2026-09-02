import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet } from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { colors } from '@/constants/colors';
import { Pressable, Text } from '@/i18n/components';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { ThemedView as View } from '@/theme/ThemedView';

const SWIPE_THRESHOLD = 72;
const MAX_DRAG = 104;

export function SwipeableNotification({
  children,
  onDelete,
  onOpen,
  onPress,
}: {
  children: ReactNode;
  onDelete: () => void;
  onOpen?: () => void;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;

  const reset = () => {
    Animated.spring(translateX, {
      friction: 8,
      tension: 80,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const completeSwipe = (direction: 'delete' | 'open') => {
    Animated.timing(translateX, {
      duration: 150,
      toValue: direction === 'delete' ? 420 : -420,
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'delete') onDelete();
      else onOpen?.();
      translateX.setValue(0);
    });
  };

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => (
      Math.abs(gesture.dx) > 10
      && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5
      && (gesture.dx > 0 || Boolean(onOpen))
    ),
    onPanResponderMove: (_, gesture) => {
      const lowerBound = onOpen ? -MAX_DRAG : 0;
      translateX.setValue(Math.max(lowerBound, Math.min(MAX_DRAG, gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx >= SWIPE_THRESHOLD) {
        completeSwipe('delete');
        return;
      }
      if (onOpen && gesture.dx <= -SWIPE_THRESHOLD) {
        completeSwipe('open');
        return;
      }
      reset();
    },
    onPanResponderTerminate: reset,
  }), [onOpen, translateX]);

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.actions}>
        <View style={[styles.action, styles.deleteAction]}>
          <Ionicons color={colors.white} name="trash-outline" size={20} />
          <Text style={styles.actionText}>{t('notificationActions.delete')}</Text>
        </View>
        {onOpen ? (
          <View style={[styles.action, styles.openAction]}>
            <Ionicons color={colors.white} name="arrow-forward-circle-outline" size={20} />
            <Text style={styles.actionText}>{t('notificationActions.open')}</Text>
          </View>
        ) : null}
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <Pressable
          accessibilityActions={[
            { label: t('notificationActions.open'), name: 'activate' },
            { label: t('notificationActions.delete'), name: 'delete' },
          ]}
          accessibilityRole="button"
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'delete') onDelete();
            else if (onOpen) onOpen();
            else onPress();
          }}
          onPress={onOpen ?? onPress}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 20, overflow: 'hidden' },
  actions: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between' },
  action: { alignItems: 'center', gap: 4, justifyContent: 'center', width: MAX_DRAG },
  deleteAction: { backgroundColor: colors.danger },
  openAction: { backgroundColor: colors.primary, marginLeft: 'auto' },
  actionText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
