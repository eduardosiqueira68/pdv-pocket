import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/store/cart-store";
import { createSale, decrementStock, formatCents } from "@/lib/db/database";
import * as Haptics from "expo-haptics";

type PaymentMethod = "dinheiro" | "pix" | "cartao";

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: any }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: "dollarsign.circle.fill" },
  { key: "pix", label: "Pix", icon: "qrcode" },
  { key: "cartao", label: "Cartão", icon: "creditcard.fill" },
];

export default function CheckoutScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, clearCart, getTotal } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("dinheiro");
  const [receivedInput, setReceivedInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const total = getTotal();

  const formatReceived = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setReceivedInput(""); return; }
    const cents = parseInt(digits, 10);
    const str = cents.toString().padStart(3, "0");
    setReceivedInput(`${str.slice(0, -2)},${str.slice(-2)}`);
  };

  const getReceivedCents = (): number => {
    const digits = receivedInput.replace(/\D/g, "");
    return parseInt(digits, 10) || 0;
  };

  const changeCents = paymentMethod === "dinheiro"
    ? Math.max(0, getReceivedCents() - total)
    : 0;

  const canFinish = () => {
    if (paymentMethod === "dinheiro") {
      return getReceivedCents() >= total;
    }
    return true;
  };

  const handleFinish = async () => {
    if (!canFinish()) {
      Alert.alert("Valor insuficiente", "O valor recebido é menor que o total da venda.");
      return;
    }

    setIsSaving(true);
    try {
      const saleId = await createSale({
        items: state.items,
        discountTotalCents: state.discountTotalCents,
        paymentMethod,
        receivedCents: paymentMethod === "dinheiro" ? getReceivedCents() : undefined,
        changeCents: paymentMethod === "dinheiro" ? changeCents : undefined,
      });

      // Decrement stock for each item sold
      await decrementStock(state.items);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      clearCart();
      router.replace(`/sale/success?saleId=${saleId}` as any);
    } catch {
      Alert.alert("Erro", "Não foi possível finalizar a venda.");
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
        <Text style={[styles.title, { color: colors.foreground }]}>Finalizar Venda</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Total */}
          <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.totalLabel}>Total a Pagar</Text>
            <Text style={styles.totalValue}>{formatCents(total)}</Text>
            <Text style={styles.itemCount}>
              {state.items.reduce((s, i) => s + i.quantity, 0)} itens
            </Text>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Forma de Pagamento
            </Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.paymentBtn,
                    {
                      backgroundColor:
                        paymentMethod === opt.key
                          ? colors.primary
                          : colors.surface,
                      borderColor:
                        paymentMethod === opt.key
                          ? colors.primary
                          : colors.border,
                    },
                  ]}
                  onPress={() => setPaymentMethod(opt.key)}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name={opt.icon}
                    size={24}
                    color={paymentMethod === opt.key ? "#fff" : colors.muted}
                  />
                  <Text
                    style={[
                      styles.paymentLabel,
                      {
                        color: paymentMethod === opt.key ? "#fff" : colors.foreground,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cash section */}
          {paymentMethod === "dinheiro" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Valor Recebido
              </Text>
              <View style={styles.receivedRow}>
                <Text style={[styles.currency, { color: colors.muted }]}>R$</Text>
                <TextInput
                  style={[
                    styles.receivedInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                      borderColor: getReceivedCents() > 0 && getReceivedCents() < total
                        ? colors.error
                        : colors.border,
                    },
                  ]}
                  value={receivedInput}
                  onChangeText={formatReceived}
                  placeholder="0,00"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                  autoFocus
                />
              </View>

              {/* Change */}
              {getReceivedCents() >= total && getReceivedCents() > 0 && (
                <View style={[styles.changeCard, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
                  <Text style={[styles.changeLabel, { color: colors.success }]}>Troco</Text>
                  <Text style={[styles.changeValue, { color: colors.success }]}>
                    {formatCents(changeCents)}
                  </Text>
                </View>
              )}

              {getReceivedCents() > 0 && getReceivedCents() < total && (
                <View style={[styles.changeCard, { backgroundColor: colors.error + "15", borderColor: colors.error }]}>
                  <Text style={[styles.changeLabel, { color: colors.error }]}>Faltam</Text>
                  <Text style={[styles.changeValue, { color: colors.error }]}>
                    {formatCents(total - getReceivedCents())}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Items summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Resumo dos Itens
            </Text>
            {state.items.map((item) => (
              <View
                key={item.barcode}
                style={[styles.summaryItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.summaryName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.quantity}× {item.name}
                </Text>
                <Text style={[styles.summaryTotal, { color: colors.foreground }]}>
                  {formatCents(item.unitPriceCents * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Finish button */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.finishBtn,
              {
                backgroundColor: canFinish() ? colors.primary : colors.border,
                opacity: isSaving ? 0.7 : 1,
              },
            ]}
            onPress={handleFinish}
            disabled={!canFinish() || isSaving}
            activeOpacity={0.8}
          >
            <IconSymbol name="checkmark.circle.fill" size={24} color="#fff" />
            <Text style={styles.finishBtnText}>
              {isSaving ? "Finalizando..." : "Concluir Venda"}
            </Text>
          </TouchableOpacity>
        </View>
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
  content: { padding: 20, gap: 4, paddingBottom: 20 },
  totalCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 8,
  },
  totalLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  totalValue: { color: "#fff", fontSize: 42, fontWeight: "800", marginVertical: 4 },
  itemCount: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  paymentGrid: { flexDirection: "row", gap: 10 },
  paymentBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  paymentLabel: { fontSize: 13, fontWeight: "600" },
  receivedRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  currency: { fontSize: 22, fontWeight: "600", width: 30 },
  receivedInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: "700",
  },
  changeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 12,
  },
  changeLabel: { fontSize: 15, fontWeight: "600" },
  changeValue: { fontSize: 22, fontWeight: "800" },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  summaryName: { flex: 1, fontSize: 14, marginRight: 8 },
  summaryTotal: { fontSize: 14, fontWeight: "600" },
  footer: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 0.5,
  },
  finishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
    borderRadius: 18,
  },
  finishBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
