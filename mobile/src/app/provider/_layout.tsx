import { Stack } from 'expo-router';

export default function ProviderLayout() {
  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        animation: 'slide_from_right',
        headerShown: false,
      }}
    />
  );
}
