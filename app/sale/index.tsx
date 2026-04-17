import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { useColors } from "@/hooks/use-colors";
import { useCart } from "@/lib/store/cart-store";
import { getProductByBarcode, createProduct, formatCents, type CartItem, getAllProducts, type Product } from "@/lib/db/database";
import { useKeepAwake } from "expo-keep-awake";
import * as Haptics from "expo-haptics";

// Quick register modal when product not found
function QuickRegisterModal({
  visible,
  barcode,
  onSave,
  onCancel,
  colors,
}: {
  visible: boolean;
  barcode: string;
  onSave: (item: CartItem) => void;
  onCancel: () => void;
  colors: any;
}) {
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");

  const formatPrice = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setPriceInput(""); return; }
    const cents = parseInt(digits, 10);
    const str = cents.toString().padStart(3, "0");
    setPriceInput(`${str.slice(0, -2)},${str.slice(-2)}`);
  };

  const getPriceCents = () => {
    const digits = priceInput.replace(/\D/g, "");
    return parseInt(digits, 10) || 0;
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Atenção", "Informe o nome."); return; }
    if (getPriceCents() === 0) { Alert.alert("Atenção", "Informe o preço."); return; }

    try {
      const product = await createProduct({
        barcode,
        name: name.trim(),
        priceCents: getPriceCents(),
      });
      onSave({
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: 1,
        discountCents: 0,
      });
      setName("");
      setPriceInput("");
    } catch {
      Alert.alert("Erro", "Não foi possível cadastrar o produto.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Produto não encontrado
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
            Código: {barcode}
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
            Cadastre agora para adicionar ao cupom:
          </Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Nome do produto"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.muted }]}>R$</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                value={priceInput}
                onChangeText={formatPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1.5 }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Salvar e Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Manual item modal
function ManualItemModal({
  visible,
  onSave,
  onCancel,
  colors,
}: {
  visible: boolean;
  onSave: (item: CartItem) => void;
  onCancel: () => void;
  colors: any;
}) {
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");

  const formatPrice = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) { setPriceInput(""); return; }
    const cents = parseInt(digits, 10);
    const str = cents.toString().padStart(3, "0");
    setPriceInput(`${str.slice(0, -2)},${str.slice(-2)}`);
  };

  const getPriceCents = () => {
    const digits = priceInput.replace(/\D/g, "");
    return parseInt(digits, 10) || 0;
  };

  const handleSave = () => {
    if (!name.trim()) { Alert.alert("Atenção", "Informe o nome."); return; }
    if (getPriceCents() === 0) { Alert.alert("Atenção", "Informe o preço."); return; }
    onSave({
      productId: null,
      barcode: `MANUAL-${Date.now()}`,
      name: name.trim(),
      unitPriceCents: getPriceCents(),
      quantity: 1,
      discountCents: 0,
    });
    setName("");
    setPriceInput("");
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            Adicionar Item Manual
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
            Para produtos sem código (pão, hortifruti, etc.)
          </Text>

          <View style={{ gap: 12, marginTop: 8 }}>
            <TextInput
              style={[styles.modalInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Nome do item"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
            />
            <View style={styles.priceRow}>
              <Text style={[styles.currency, { color: colors.muted }]}>R$</Text>
              <TextInput
                style={[styles.priceInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="0,00"
                placeholderTextColor={colors.muted}
                value={priceInput}
                onChangeText={formatPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtn, { backgroundColor: colors.primary, flex: 1.5 }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalBtnText, { color: "#fff" }]}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Cart item row
function CartItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  colors,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  colors: any;
}) {
  const lineTotal = item.unitPriceCents * item.quantity - item.discountCents;

  return (
    <View style={[styles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cartItemInfo}>
        <Text style={[styles.cartItemName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.cartItemUnit, { color: colors.muted }]}>
          {formatCents(item.unitPriceCents)} un.
        </Text>
      </View>
      <View style={styles.cartItemControls}>
        <TouchableOpacity
          style={[styles.qtyBtn, { backgroundColor: colors.error + "15" }]}
          onPress={onDecrement}
        >
          <IconSymbol name="minus.circle.fill" size={20} color={colors.error} />
        </TouchableOpacity>
        <Text style={[styles.qty, { color: colors.foreground }]}>{item.quantity}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, { backgroundColor: colors.primary + "15" }]}
          onPress={onIncrement}
        >
          <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.lineTotal, { color: colors.primary }]}>
          {formatCents(lineTotal)}
        </Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <IconSymbol name="xmark.circle.fill" size={20} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SaleScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, addItem, increment, decrement, removeItem, clearCart, getTotal, getItemCount } = useCart();
  const [scannerActive, setScannerActive] = useState(true);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  // Keep screen awake during sale
  useKeepAwake();

  // Pause scanner when screen is not focused
  useFocusEffect(
    useCallback(() => {
      setScannerActive(true);
      return () => setScannerActive(false);
    }, [])
  );

  const handleBarcodeScanned = useCallback(
    async (barcode: string) => {
      try {
        const product = await getProductByBarcode(barcode);
        if (product) {
          // Check current cart qty for this product
          const existingItem = state.items.find((i) => i.productId === product.id);
          const cartQty = existingItem ? existingItem.quantity : 0;
          const newQty = cartQty + 1;

          // Warn if stock is tracked and would go below threshold or zero
          if (product.stockQty !== null) {
            if (product.stockQty === 0) {
              Alert.alert(
                "Sem Estoque",
                `"${product.name}" está sem estoque. Deseja adicionar mesmo assim?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Adicionar",
                    onPress: () => {
                      addItem({ productId: product.id, barcode: product.barcode, name: product.name, unitPriceCents: product.priceCents, quantity: 1, discountCents: 0 });
                    },
                  },
                ]
              );
              return;
            }
            if (newQty > product.stockQty) {
              Alert.alert(
                "Estoque Insuficiente",
                `Apenas ${product.stockQty} unidade${product.stockQty !== 1 ? "s" : ""} em estoque. Deseja adicionar mesmo assim?`,
                [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Adicionar",
                    onPress: () => {
                      addItem({ productId: product.id, barcode: product.barcode, name: product.name, unitPriceCents: product.priceCents, quantity: 1, discountCents: 0 });
                    },
                  },
                ]
              );
              return;
            }
          }

          addItem({
            productId: product.id,
            barcode: product.barcode,
            name: product.name,
            unitPriceCents: product.priceCents,
            quantity: 1,
            discountCents: 0,
          });
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          setUnknownBarcode(barcode);
          setScannerActive(false);
        }
      } catch {
        // ignore
      }
    },
    [addItem, state.items]
  );

  const handleQuickRegisterSave = (item: CartItem) => {
    addItem(item);
    setUnknownBarcode(null);
    setScannerActive(true);
  };

  const handleManualSave = (item: CartItem) => {
    addItem(item);
    setShowManual(false);
  };

  const handleSearchChange = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const all = await getAllProducts();
        const filtered = all.filter(
          (p) =>
            p.active &&
            (p.name.toLowerCase().includes(query.toLowerCase()) ||
              (p.barcode && p.barcode.includes(query)))
        );
        setSearchResults(filtered.slice(0, 10));
      } catch {
        setSearchResults([]);
      }
    },
    []
  );

  const handleSearchSelect = (product: Product) => {
    // Validar estoque antes de adicionar
    if (product.stockQty !== null) {
      if (product.stockQty === 0) {
        Alert.alert(
          "Sem Estoque",
          `"${product.name}" está sem estoque. Deseja adicionar mesmo assim?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Adicionar",
              onPress: () => {
                addItem({
                  productId: product.id,
                  barcode: product.barcode,
                  name: product.name,
                  unitPriceCents: product.priceCents,
                  quantity: 1,
                  discountCents: 0,
                });
                setSearchQuery("");
                setSearchResults([]);
                setShowSearch(false);
              },
            },
          ]
        );
        return;
      }
      if (product.stockQty < 1) {
        Alert.alert(
          "Estoque Insuficiente",
          `Apenas ${product.stockQty} unidade${product.stockQty !== 1 ? "s" : ""} em estoque. Deseja adicionar mesmo assim?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Adicionar",
              onPress: () => {
                addItem({
                  productId: product.id,
                  barcode: product.barcode,
                  name: product.name,
                  unitPriceCents: product.priceCents,
                  quantity: 1,
                  discountCents: 0,
                });
                setSearchQuery("");
                setSearchResults([]);
                setShowSearch(false);
              },
            },
          ]
        );
        return;
      }
    }

    addItem({
      productId: product.id,
      barcode: product.barcode,
      name: product.name,
      unitPriceCents: product.priceCents,
      quantity: 1,
      discountCents: 0,
    });
    setSearchQuery("");
    setSearchResults([]);
    setShowSearch(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleClearCart = () => {
    if (state.items.length === 0) { router.back(); return; }
    Alert.alert("Cancelar Venda", "Deseja limpar o cupom e cancelar a venda?", [
      { text: "Não", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: () => { clearCart(); router.back(); },
      },
    ]);
  };

  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleClearCart} style={styles.backBtn}>
          <IconSymbol name="xmark.circle.fill" size={24} color={colors.muted} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Venda{itemCount > 0 ? ` · ${itemCount} ${itemCount === 1 ? "item" : "itens"}` : ""}
        </Text>
        <TouchableOpacity
          style={styles.manualBtn}
          onPress={() => setShowManual(true)}
        >
          <IconSymbol name="plus.circle.fill" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Buscar produto..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={() => setShowSearch(true)}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(""); setSearchResults([]); }}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Dropdown */}
      {showSearch && searchQuery.length > 0 && searchResults.length > 0 && (
        <View style={[styles.searchResults, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.searchResultItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSearchSelect(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.searchResultName, { color: colors.foreground }]}>
                    {item.name}
                  </Text>
                  {item.barcode && (
                    <Text style={[styles.searchResultBarcode, { color: colors.muted }]}>
                      {item.barcode}
                    </Text>
                  )}
                </View>
                <Text style={[styles.searchResultPrice, { color: colors.primary }]}>
                  {formatCents(item.priceCents)}
                </Text>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Scanner */}
      {!showSearch && (
        <View style={styles.scannerWrapper}>
          <BarcodeScanner
            onScanned={handleBarcodeScanned}
            isActive={scannerActive && !unknownBarcode && !showManual}
            compact
          />
        </View>
      )}

      {/* Cart List */}
      {!showSearch && (
      <FlatList
        data={[...state.items].reverse()}
        keyExtractor={(item) => item.barcode}
        renderItem={({ item }) => (
          <CartItemRow
            item={item}
            onIncrement={() => increment(item.barcode)}
            onDecrement={() => decrement(item.barcode)}
            onRemove={() => removeItem(item.barcode)}
            colors={colors}
          />
        )}
        contentContainerStyle={styles.cartList}
        ListEmptyComponent={
          <View style={styles.emptyCart}>
            <IconSymbol name="barcode.viewfinder" size={40} color={colors.border} />
            <Text style={[styles.emptyCartText, { color: colors.muted }]}>
              Escaneie um produto para começar
            </Text>
          </View>
        }
      />
      )}

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatCents(total)}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.checkoutBtn,
            { backgroundColor: state.items.length > 0 ? colors.primary : colors.border },
          ]}
          onPress={() => state.items.length > 0 && router.push("/sale/checkout" as any)}
          disabled={state.items.length === 0}
          activeOpacity={0.8}
        >
          <IconSymbol name="checkmark.circle.fill" size={22} color="#fff" />
          <Text style={styles.checkoutBtnText}>Finalizar Venda</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Register Modal */}
      <QuickRegisterModal
        visible={!!unknownBarcode}
        barcode={unknownBarcode || ""}
        onSave={handleQuickRegisterSave}
        onCancel={() => { setUnknownBarcode(null); setScannerActive(true); }}
        colors={colors}
      />

      {/* Manual Item Modal */}
      <ManualItemModal
        visible={showManual}
        onSave={handleManualSave}
        onCancel={() => setShowManual(false)}
        colors={colors}
      />
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
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  manualBtn: { padding: 4 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  searchResults: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  searchResultName: { fontSize: 14, fontWeight: "600" },
  searchResultBarcode: { fontSize: 12, marginTop: 2 },
  searchResultPrice: { fontSize: 14, fontWeight: "700", marginLeft: 12 },
  scannerWrapper: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  cartList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8, flexGrow: 1 },
  cartItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  cartItemInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cartItemName: { flex: 1, fontSize: 15, fontWeight: "600" },
  cartItemUnit: { fontSize: 13 },
  cartItemControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: { borderRadius: 8, padding: 2 },
  qty: { fontSize: 17, fontWeight: "700", minWidth: 24, textAlign: "center" },
  lineTotal: { flex: 1, textAlign: "right", fontSize: 15, fontWeight: "700" },
  emptyCart: { alignItems: "center", paddingTop: 30, gap: 10 },
  emptyCartText: { fontSize: 14 },
  footer: {
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    gap: 12,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 32, fontWeight: "800" },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  checkoutBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 8,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#ccc",
    alignSelf: "center",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalSubtitle: { fontSize: 13, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
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
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalBtnText: { fontSize: 15, fontWeight: "600" },
});
