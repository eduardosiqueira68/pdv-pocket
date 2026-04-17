import { Stack } from "expo-router";
import { useColors } from "@/hooks/use-colors";

export default function SaleLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
      <Stack.Screen name="success" options={{ presentation: "fullScreenModal", animation: "fade" }} />
    </Stack>
  );
}
