import React, { useState, useCallback } from "react";
import { Alert } from "react-native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getDayReport, getTodayString, formatCents, type DayReport } from "@/lib/db/database";
import { generateDayReportPDF, shareReport } from "@/lib/pdf-export";
import { useAppStore } from "@/lib/store/app-store";

export default function ReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state } = useAppStore();
  const [report, setReport] = useState<DayReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateLabel, setDateLabel] = useState("Hoje");
  const [todayStr, setTodayStr] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = await getTodayString();
      setTodayStr(today);
      const data = await getDayReport(today);
      setReport(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleExportPDF = async () => {
    if (!report || !todayStr) return;
    setIsExporting(true);
    try {
      const filePath = await generateDayReportPDF(state.store?.name || "PDV Pocket", todayStr, report);
      await shareReport(filePath, state.store?.name || "PDV Pocket", todayStr);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível exportar o relatório.");
    } finally {
      setIsExporting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReport();
    }, [loadReport])
  );

  const StatCard = ({
    label,
    value,
    icon,
    highlight,
  }: {
    label: string;
    value: string;
    icon: any;
    highlight?: boolean;
  }) => (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: highlight ? colors.primary : colors.surface,
          borderColor: highlight ? colors.primary : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: highlight ? "rgba(255,255,255,0.2)" : colors.primary + "15" },
        ]}
      >
        <IconSymbol name={icon} size={22} color={highlight ? "#fff" : colors.primary} />
      </View>
      <Text style={[styles.statLabel, { color: highlight ? "rgba(255,255,255,0.75)" : colors.muted }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: highlight ? "#fff" : colors.foreground }]}>
        {value}
      </Text>
    </View>
  );

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Relatório do Dia</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={loadReport} style={styles.refreshBtn}>
            <IconSymbol name="arrow.clockwise" size={20} color={colors.primary} />
          </TouchableOpacity>
          {report && (
            <TouchableOpacity
              onPress={handleExportPDF}
              disabled={isExporting}
              style={styles.exportBtn}
            >
              <IconSymbol name="arrow.down.doc.fill" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={report?.topProducts ?? []}
          keyExtractor={(item, i) => `${item.name}-${i}`}
          ListHeaderComponent={
            <View style={styles.headerContent}>
              {/* Date label */}
              <View style={styles.dateBadge}>
                <IconSymbol name="calendar" size={16} color={colors.muted} />
                <Text style={[styles.dateBadgeText, { color: colors.muted }]}>{dateLabel}</Text>
              </View>

              {/* Stats grid */}
              <View style={styles.statsGrid}>
                <StatCard
                  label="Total Vendido"
                  value={formatCents(report?.totalRevenueCents ?? 0)}
                  icon="dollarsign.circle.fill"
                  highlight
                />
                <StatCard
                  label="Nº de Vendas"
                  value={String(report?.totalSales ?? 0)}
                  icon="list.bullet.rectangle"
                />
                <StatCard
                  label="Ticket Médio"
                  value={formatCents(report?.averageTicketCents ?? 0)}
                  icon="chart.bar.fill"
                />
              </View>

              {report?.topProducts && report.topProducts.length > 0 && (
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Top Produtos do Dia
                </Text>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.productRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.rankBadge,
                  { backgroundColor: index < 3 ? colors.primary : colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.rankText,
                    { color: index < 3 ? "#fff" : colors.muted },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.productQty, { color: colors.muted }]}>
                  {item.quantity} {item.quantity === 1 ? "unidade" : "unidades"}
                </Text>
              </View>
              <Text style={[styles.productTotal, { color: colors.primary }]}>
                {formatCents(item.totalCents)}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            report?.totalSales === 0 ? (
              <View style={styles.empty}>
                <IconSymbol name="chart.bar.fill" size={48} color={colors.border} />
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Nenhuma venda hoje ainda
                </Text>
                <TouchableOpacity
                  style={[styles.startBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/sale" as any)}
                >
                  <Text style={styles.startBtnText}>Iniciar Primeira Venda</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerStyle={styles.list}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { padding: 4, marginRight: 8 },
  title: { flex: 1, fontSize: 20, fontWeight: "700" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  refreshBtn: { padding: 4 },
  exportBtn: { padding: 4 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, paddingBottom: 40, gap: 10 },
  headerContent: { gap: 16, marginBottom: 8 },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  dateBadgeText: { fontSize: 14 },
  statsGrid: { gap: 10 },
  statCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13 },
  statValue: { fontSize: 24, fontWeight: "800" },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { fontSize: 13, fontWeight: "700" },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "600" },
  productQty: { fontSize: 12, marginTop: 2 },
  productTotal: { fontSize: 15, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyText: { fontSize: 15 },
  startBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
