import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store/app-store";

export default function CreateStoreScreen() {
  const router = useRouter();
  const colors = useColors();
  const { completeOnboarding } = useAppStore();
  const [storeName, setStoreName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!storeName.trim()) return;
    setIsLoading(true);
    try {
      await completeOnboarding(storeName.trim());
      router.replace("/(tabs)");
    } catch (e) {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 px-8">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center"
      >
        <View className="gap-6">
          <View className="items-center gap-2">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: colors.primary + "15" }}
            >
              <IconSymbol name="storefront.fill" size={32} color={colors.primary} />
            </View>
            <Text className="text-2xl font-bold text-foreground text-center">
              Criar sua Loja
            </Text>
            <Text className="text-base text-muted text-center">
              Como se chama o seu negócio?
            </Text>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Nome da Loja</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3.5 text-lg text-foreground"
              placeholder="Ex: Mercearia do João"
              placeholderTextColor={colors.muted}
              value={storeName}
              onChangeText={setStoreName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
          </View>

          <TouchableOpacity
            className="rounded-2xl py-4 items-center mt-2"
            style={{
              backgroundColor: storeName.trim() ? colors.primary : colors.border,
            }}
            onPress={handleCreate}
            disabled={!storeName.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Text
              className="text-lg font-semibold"
              style={{ color: storeName.trim() ? "#FFFFFF" : colors.muted }}
            >
              {isLoading ? "Criando..." : "Criar Loja e Começar"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
