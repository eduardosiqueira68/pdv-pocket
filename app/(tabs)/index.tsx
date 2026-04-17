import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store/app-store";
import {
  getDayReport,
  getTodayString,
  formatCents,
  getLowStockCount,
  type DayReport,
} from "@/lib/db/database";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useStockNotifications } from "@/hooks/use-stock-notifications";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state } = useAppStore();
  const [report, setReport] = useState<DayReport | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);
  const { scheduleDailyNotification } = useStockNotifications();

  const loadData = useCallback(async () => {
    try {
      const today = await getTodayString();
      const [data, alertCount] = await Promise.all([
        getDayReport(today),
        getLowStockCount(),
      ]);
      setReport(data);
      setLowStockCount(alertCount);
    } catch {
      // DB not ready yet
    }
  }, []);

  // Notificações são inicializadas automaticamente pelo hook

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handlePress = (route: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(route as any);
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <ScreenContainer className="flex-1">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-1">
          <Text className="text-muted text-sm">{greeting()}</Text>
          <Text className="text-foreground text-xl font-bold" numberOfLines={1}>
            {state.store?.name || "Minha Loja"}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => handlePress("/settings")}
          activeOpacity={0.7}
        >
          <IconSymbol name="gearshape.fill" size={22} color={colors.muted} />
        </TouchableOpacity>
      </View>

      {/* Day Summary Card */}
      <View
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white/70 text-sm mb-1">Vendas de Hoje</Text>
        <Text className="text-white text-3xl font-bold">
          {report ? formatCents(report.totalRevenueCents) : "R$ 0,00"}
        </Text>
        <View className="flex-row mt-3 gap-6">
          <View>
            <Text className="text-white/60 text-xs">Vendas</Text>
            <Text className="text-white text-lg font-semibold">
              {report?.totalSales ?? 0}
            </Text>
          </View>
          <View>
            <Text className="text-white/60 text-xs">Ticket Médio</Text>
            <Text className="text-white text-lg font-semibold">
              {report ? formatCents(report.averageTicketCents) : "R$ 0,00"}
            </Text>
          </View>
        </View>
      </View>

      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "50" }]}
          onPress={() => handlePress("/stock-alerts")}
          activeOpacity={0.8}
        >
          <View style={[styles.alertIconBox, { backgroundColor: colors.warning + "25" }]}>
            <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: colors.warning }]}>
              {lowStockCount} produto{lowStockCount !== 1 ? "s" : ""} com estoque baixo
            </Text>
            <Text style={[styles.alertSub, { color: colors.warning + "CC" }]}>
              Toque para ver e repor
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={16} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Action Grid */}
      <View className="flex-row flex-wrap gap-3 mt-2">
        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.primary, backgroundColor: colors.primary + "08" }]}
          onPress={() => handlePress("/sale")}
          activeOpacity={0.7}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary + "18" }}
          >
            <IconSymbol name="barcode.viewfinder" size={30} color={colors.primary} />
          </View>
          <Text className="text-foreground text-base font-semibold">Iniciar Venda</Text>
          <Text className="text-muted text-xs mt-0.5">Abrir o caixa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => handlePress("/products")}
          activeOpacity={0.7}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary + "12" }}
          >
            <IconSymbol name="cube.box.fill" size={28} color={colors.primary} />
          </View>
          <Text className="text-foreground text-base font-semibold">Produtos</Text>
          <Text className="text-muted text-xs mt-0.5">Cadastrar e editar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => handlePress("/history")}
          activeOpacity={0.7}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary + "12" }}
          >
            <IconSymbol name="list.bullet.rectangle" size={28} color={colors.primary} />
          </View>
          <Text className="text-foreground text-base font-semibold">Vendas</Text>
          <Text className="text-muted text-xs mt-0.5">Histórico completo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => handlePress("/report")}
          activeOpacity={0.7}
        >
          <View
            className="w-14 h-14 rounded-2xl items-center justify-center mb-3"
            style={{ backgroundColor: colors.primary + "12" }}
          >
            <IconSymbol name="chart.bar.fill" size={28} color={colors.primary} />
          </View>
          <Text className="text-foreground text-base font-semibold">Relatório</Text>
          <Text className="text-muted text-xs mt-0.5">Resumo do dia</Text>
        </TouchableOpacity>

        {/* Stock Alerts shortcut card */}
        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              borderColor: lowStockCount > 0 ? colors.warning + "60" : colors.border,
              backgroundColor: lowStockCount > 0 ? colors.warning + "08" : colors.surface,
            },
          ]}
          onPress={() => handlePress("/stock-alerts")}
          activeOpacity={0.7}
        >
          <View style={{ position: "relative", width: 56, height: 56, marginBottom: 12 }}>
            <View
              style={[
                styles.stockIconBox,
                {
                  backgroundColor:
                    lowStockCount > 0 ? colors.warning + "18" : colors.primary + "12",
                },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={28}
                color={lowStockCount > 0 ? colors.warning : colors.primary}
              />
            </View>
            {lowStockCount > 0 && (
              <View style={[styles.badgeDot, { backgroundColor: colors.warning }]}>
                <Text style={styles.badgeDotText}>
                  {lowStockCount > 99 ? "99+" : String(lowStockCount)}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-foreground text-base font-semibold">Estoque</Text>
          <Text className="text-muted text-xs mt-0.5">
            {lowStockCount > 0 ? `${lowStockCount} alerta${lowStockCount !== 1 ? "s" : ""}` : "Tudo em dia"}
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 4,
  },
  alertIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: { fontSize: 13, fontWeight: "700" },
  alertSub: { fontSize: 11, marginTop: 1 },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  stockIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeDotText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
