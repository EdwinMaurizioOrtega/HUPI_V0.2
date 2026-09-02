export type AddressCoordinate = {
  latitude: number;
  longitude: number;
};

export type AddressMapProps = {
  coordinate: AddressCoordinate;
  onCoordinateChange: (coordinate: AddressCoordinate) => void;
  recenterKey: number;
  accessibilityLabel: string;
  accessibilityHint: string;
};

