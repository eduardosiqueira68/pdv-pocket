import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { TouchableOpacity } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="flex-1 justify-center items-center px-8">
      <View className="items-center gap-6">
        <View
          className="w-24 h-24 rounded-3xl items-center justify-center"
          style={{ backgroundColor: colors.primary + "15" }}
        >
          <IconSymbol name="cart.fill" size={48} color={colors.primary} />
        </View>

        <View className="items-center gap-2">
          <Text className="text-3xl font-bold text-foreground text-center">
            PDV Pocket
          </Text>
          <Text className="text-base text-muted text-center leading-6">
            Seu caixa simples no celular.{"\n"}
            Escaneie, venda e controle tudo{"\n"}
            sem complicação.
          </Text>
        </View>

        <View className="w-full gap-3 mt-4">
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="barcode.viewfinder" size={22} color={colors.primary} />
            <Text className="text-foreground text-base flex-1">Escaneie códigos de barras pela câmera</Text>
          </View>
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="dollarsign.circle.fill" size={22} color={colors.primary} />
            <Text className="text-foreground text-base flex-1">Soma automática e troco calculado</Text>
          </View>
          <View className="flex-row items-center gap-3 px-4">
            <IconSymbol name="list.bullet.rectangle" size={22} color={colors.primary} />
            <Text className="text-foreground text-base flex-1">Histórico completo de todas as vendas</Text>
          </View>
        </View>
      </View>

      <View className="absolute bottom-12 left-8 right-8">
        <TouchableOpacity
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: colors.primary }}
          onPress={() => router.push("/onboarding/create-store" as any)}
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Começar</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
