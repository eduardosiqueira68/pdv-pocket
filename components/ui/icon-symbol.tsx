import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  // PDV Pocket icons
  "cart.fill": "shopping-cart",
  "barcode.viewfinder": "qr-code-scanner",
  "cube.box.fill": "inventory-2",
  "list.bullet.rectangle": "receipt-long",
  "chart.bar.fill": "bar-chart",
  "gearshape.fill": "settings",
  "plus.circle.fill": "add-circle",
  "minus.circle.fill": "remove-circle",
  "trash.fill": "delete",
  "magnifyingglass": "search",
  "xmark.circle.fill": "cancel",
  "checkmark.circle.fill": "check-circle",
  "dollarsign.circle.fill": "attach-money",
  "creditcard.fill": "credit-card",
  "qrcode": "qr-code",
  "arrow.left": "arrow-back",
  "arrow.clockwise": "refresh",
  "square.and.arrow.up": "share",
  "calendar": "calendar-today",
  "tag.fill": "local-offer",
  "person.fill": "person",
  "info.circle.fill": "info",
  "pencil": "edit",
  "storefront.fill": "storefront",
  "globe": "public",
  "arrow.up.circle.fill": "upload",
  "arrow.down.circle.fill": "download",
  "bell.fill": "notifications-active",
  "exclamationmark.triangle.fill": "warning",
  "checkmark.seal.fill": "verified",
  "clock.fill": "schedule",
  "doc.text.fill": "description",
  "eye.fill": "visibility",
  "eye.slash.fill": "visibility-off",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
