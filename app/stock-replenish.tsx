import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getLowStockProducts, addStockMovement, formatCents, type Product } from "@/lib/db/database";
import * as Haptics from "expo-haptics";

const REPLENISH_REASONS = ["compra", "devolução", "ajuste"];

export default function StockReplenishScreen() {
  const router = useRouter();
  const colors = useColors();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const [selectedReason, setSelectedReason] = useState("compra");
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLowStockProducts();
      setProducts(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleReplenish = async () => {
    if (!selectedProduct) return;
    if (!quantityInput.trim()) {
      Alert.alert("Atenção", "Informe a quantidade.");
      return;
    }

    const qty = parseInt(quantityInput, 10);
    if (qty <= 0) {
      Alert.alert("Atenção", "A quantidade deve ser maior que zero.");
      return;
    }

    setIsSaving(true);
    try {
      await addStockMovement(selectedProduct.id, "entrada", qty, selectedReason);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSelectedProduct(null);
      setQuantityInput("");
      setSelectedReason("compra");
      await loadProducts();
    } catch {
      Alert.alert("Erro", "Não foi possível registrar a entrada.");
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
        <Text style={[styles.title, { color: colors.foreground }]}>Repor Estoque</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.success + "15" }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color={colors.success} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Estoque em dia!
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Nenhum produto com estoque baixo no momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setSelectedProduct(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.productInfo, { color: colors.muted }]}>
                  {item.stockQty ?? 0} un. (mín: {item.lowStockThreshold ?? 5})
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.price, { color: colors.muted }]}>
                  {formatCents(item.priceCents)}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Replenish Modal */}
      <Modal visible={selectedProduct !== null} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Repor Estoque
            </Text>
            {selectedProduct && (
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                {selectedProduct.name}
              </Text>
            )}

            <View style={{ gap: 12, marginTop: 16 }}>
              {/* Current stock info */}
              {selectedProduct && (
                <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.infoLabel, { color: colors.muted }]}>Estoque atual</Text>
                  <Text style={[styles.infoValue, { color: colors.foreground }]}>
                    {selectedProduct.stockQty ?? 0} unidades
                  </Text>
                </View>
              )}

              {/* Quantity input */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>Quantidade a adicionar</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                  placeholder="0"
                  placeholderTextColor={colors.muted}
                  value={quantityInput}
                  onChangeText={(t) => setQuantityInput(t.replace(/\D/g, ""))}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>

              {/* Reason selector */}
              <View>
                <Text style={[styles.label, { color: colors.foreground }]}>Motivo</Text>
                <View style={styles.reasonGrid}>
                  {REPLENISH_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonBtn,
                        {
                          backgroundColor: selectedReason === reason ? colors.primary : colors.background,
                          borderColor: selectedReason === reason ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedReason(reason)}
                    >
                      <Text
                        style={[
                          styles.reasonBtnText,
                          { color: selectedReason === reason ? "#fff" : colors.foreground },
                        ]}
                      >
                        {reason.charAt(0).toUpperCase() + reason.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.border }]}
                onPress={() => setSelectedProduct(null)}
                disabled={isSaving}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1.5, opacity: isSaving ? 0.7 : 1 }]}
                onPress={handleReplenish}
                disabled={isSaving}
              >
                <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
                <Text style={styles.modalBtnText}>
                  {isSaving ? "Salvando..." : "Confirmar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { padding: 16, paddingBottom: 24, gap: 10 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardContent: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "600" },
  productInfo: { fontSize: 12, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  price: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 12 },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "600",
  },
  reasonGrid: {
    flexDirection: "row",
    gap: 8,
  },
  reasonBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  reasonBtnText: { fontSize: 12, fontWeight: "600" },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  modalBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
