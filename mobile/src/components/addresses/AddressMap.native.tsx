import { ThemedView as View } from '@/theme/ThemedView';
import {
  useEffect,
  useRef } from 'react';
import { StyleSheet,
} from 'react-native';
import MapView, {
  Marker,
} from 'react-native-maps';

import { colors } from '@/constants/colors';
import type { AddressMapProps } from './AddressMap.types';
import { useTheme } from '@/theme/ThemeProvider';

const LATITUDE_DELTA = 0.008;
const LONGITUDE_DELTA = 0.008;

export function AddressMap({
  accessibilityHint,
  accessibilityLabel,
  coordinate,
  onCoordinateChange,
  recenterKey,
}: AddressMapProps) {
  const mapRef = useRef<MapView>(null);
  const { resolvedTheme, tokens } = useTheme();

  useEffect(() => {
    mapRef.current?.animateToRegion({
      ...coordinate,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    }, 280);
  }, [coordinate.latitude, coordinate.longitude, recenterKey]);

  return (
    <View style={styles.frame}>
      <MapView
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="adjustable"
        initialRegion={{
          ...coordinate,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        onPress={(event) => onCoordinateChange(event.nativeEvent.coordinate)}
        ref={mapRef}
        showsCompass={false}
        showsMyLocationButton={false}
        style={styles.map}
        userInterfaceStyle={resolvedTheme}
      >
        <Marker
          accessibilityLabel={accessibilityLabel}
          coordinate={coordinate}
          draggable
          onDragEnd={(event) => onCoordinateChange(event.nativeEvent.coordinate)}
          pinColor={tokens.primary}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 218,
    overflow: 'hidden',
  },
  map: { flex: 1 },
});
