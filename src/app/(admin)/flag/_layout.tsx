import { Stack } from "expo-router";

export default function FlagLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan" />
    </Stack>
  );
}
