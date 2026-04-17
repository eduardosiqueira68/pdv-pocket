import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useColors } from "@/hooks/use-colors";
import { createProduct } from "@/lib/db/database";
import * as Haptics from "expo-haptics";

export default function NewProductScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ barcode?: string; returnToSale?: string }>();

  const [barcode, setBarcode] = useState(params.barcode || "");
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [category, setCategory] = useState("");
  const [showScanner, setShowScanner] = useState(!params.barcode);
  const [isSaving, setIsSaving] = useState(false);

  // Stock control
  const [trackStock, setTrackStock] = useState(false);
  const [stockQtyInput, setStockQtyInput] = useState("0");
  const [thresholdInput, setThresholdInput] = useState("5");

  const handleBarcodeScanned = (code: string) => {
    setBarcode(code);
    setShowScanner(false);
  };

  const formatPriceInput = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setPriceInput(""); return; }
    const cents = parseInt(digits, 10);
    const str = cents.toString().padStart(3, "0");
    const reais = str.slice(0, -2);
    const centavos = str.slice(-2);
    setPriceInput(`${reais},${centavos}`);
  };

  const getPriceCents = (): number => {
    const digits = priceInput.replace(/\D/g, "");
    return parseInt(digits, 10) || 0;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Atenção", "Informe o nome do produto.");
      return;
    }
    if (getPriceCents() === 0) {
      Alert.alert("Atenção", "Informe o preço do produto.");
      return;
    }

    setIsSaving(true);
    try {
      const product = await createProduct({
        barcode: barcode.trim() || `MANUAL-${Date.now()}`,
        name: name.trim(),
        priceCents: getPriceCents(),
        category: category.trim() || undefined,
        stockQty: trackStock ? (parseInt(stockQtyInput, 10) || 0) : null,
        lowStockThreshold: trackStock ? (parseInt(thresholdInput, 10) || null) : null,
      });

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Simply go back - the sale screen will reload products on focus
      router.back();
    } catch (e: any) {
      if (e?.message?.includes("UNIQUE")) {
        Alert.alert("Erro", "Já existe um produto com este código de barras.");
      } else {
        Alert.alert("Erro", "Não foi possível salvar o produto.");
      }
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="arrow.left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Novo Produto</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Scanner */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Código de Barras</Text>
            {showScanner ? (
              <View style={{ gap: 10 }}>
                <BarcodeScanner onScanned={handleBarcodeScanned} compact />
                <TouchableOpacity
                  style={[styles.skipBtn, { borderColor: colors.border }]}
                  onPress={() => setShowScanner(false)}
                >
                  <Text style={[styles.skipText, { color: colors.muted }]}>
                    Digitar código manualmente
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.barcodeRow}>
                <TextInput
                  style={[styles.input, { flex: 1, color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="Código de barras (opcional)"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  style={[styles.scanBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                  onPress={() => setShowScanner(true)}
                >
                  <IconSymbol name="barcode.viewfinder" size={22} color={colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nome do Produto *</Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Arroz 5kg"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>Preço de Venda *</Text>
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.muted }]}>R$</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
                value={priceInput}
                onChangeText={formatPriceInput}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              Categoria <Text style={{ color: colors.muted }}>(opcional)</Text>
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
              value={category}
              onChangeText={setCategory}
              placeholder="Ex: Bebidas, Laticínios..."
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Stock Control Section */}
          <View style={[styles.stockCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.stockToggleRow}>
              <View style={styles.stockToggleInfo}>
                <IconSymbol name="cube.box.fill" size={20} color={trackStock ? colors.primary : colors.muted} />
                <View>
                  <Text style={[styles.stockToggleLabel, { color: colors.foreground }]}>
                    Controlar Estoque
                  </Text>
                  <Text style={[styles.stockToggleSub, { color: colors.muted }]}>
                    Rastrear quantidade disponível
                  </Text>
                </View>
              </View>
              <Switch
                value={trackStock}
                onValueChange={setTrackStock}
                trackColor={{ false: colors.border, true: colors.primary + "80" }}
                thumbColor={trackStock ? colors.primary : colors.muted}
              />
            </View>

            {trackStock && (
              <View style={[styles.stockFields, { borderTopColor: colors.border }]}>
                <View style={styles.stockFieldRow}>
                  <View style={styles.stockField}>
                    <Text style={[styles.stockFieldLabel, { color: colors.muted }]}>
                      Qtd. em Estoque
                    </Text>
                    <TextInput
                      style={[styles.stockInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                      value={stockQtyInput}
                      onChangeText={(t) => setStockQtyInput(t.replace(/\D/g, ""))}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      placeholder="0"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={styles.stockField}>
                    <Text style={[styles.stockFieldLabel, { color: colors.muted }]}>
                      Alertar abaixo de
                    </Text>
                    <TextInput
                      style={[styles.stockInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                      value={thresholdInput}
                      onChangeText={(t) => setThresholdInput(t.replace(/\D/g, ""))}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      placeholder="5"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>
                <View style={[styles.stockHint, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
                  <IconSymbol name="exclamationmark.triangle.fill" size={14} color={colors.warning} />
                  <Text style={[styles.stockHintText, { color: colors.warning }]}>
                    Você será alertado quando o estoque ficar abaixo de {thresholdInput || "5"} unidades
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
            <Text style={styles.saveBtnText}>
              {isSaving ? "Salvando..." : "Salvar Produto"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { padding: 20, gap: 4, paddingBottom: 40 },
  section: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  barcodeRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  scanBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  skipText: { fontSize: 13 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currency: { fontSize: 20, fontWeight: "600", width: 28 },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: "700",
  },
  // Stock card
  stockCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  stockToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  stockToggleInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  stockToggleLabel: { fontSize: 15, fontWeight: "600" },
  stockToggleSub: { fontSize: 12, marginTop: 1 },
  stockFields: {
    borderTopWidth: 0.5,
    padding: 16,
    gap: 12,
  },
  stockFieldRow: { flexDirection: "row", gap: 12 },
  stockField: { flex: 1, gap: 6 },
  stockFieldLabel: { fontSize: 12, fontWeight: "600" },
  stockInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  stockHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  stockHintText: { fontSize: 12, flex: 1, lineHeight: 17 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  saveBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
