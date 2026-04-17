import React, { useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as Haptics from "expo-haptics";

interface BarcodeScannerProps {
  onScanned: (barcode: string) => void;
  isActive?: boolean;
  compact?: boolean;
}

export function BarcodeScanner({ onScanned, isActive = true, compact = false }: BarcodeScannerProps) {
  const colors = useColors();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (scanned || !isActive) return;
      setScanned(true);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      onScanned(data);

      // Reset after 1.5s to allow scanning next item
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
      cooldownRef.current = setTimeout(() => {
        setScanned(false);
      }, 1500);
    },
    [scanned, isActive, onScanned]
  );

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="barcode.viewfinder" size={36} color={colors.muted} />
        <Text style={[styles.webText, { color: colors.muted }]}>
          Escanear código de barras
        </Text>
        <Text style={[styles.webSubtext, { color: colors.muted }]}>
          (Digite manualmente no campo acima)
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Text style={[styles.permText, { color: colors.muted }]}>Verificando permissão...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <IconSymbol name="barcode.viewfinder" size={40} color={colors.muted} />
        <Text style={[styles.permText, { color: colors.foreground }]}>
          Permissão de câmera necessária
        </Text>
        <TouchableOpacity
          style={[styles.permBtn, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Permitir Câmera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={compact ? styles.compactWrapper : styles.fullWrapper}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Scanning overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanFrame}>
          {/* Corner decorations */}
          <View style={[styles.corner, styles.topLeft, { borderColor: scanned ? colors.success : "#fff" }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: scanned ? colors.success : "#fff" }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: scanned ? colors.success : "#fff" }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: scanned ? colors.success : "#fff" }]} />
        </View>
        <Text style={styles.hint}>
          {scanned ? "✓ Código lido!" : "Aponte para o código de barras"}
        </Text>
      </View>
    </View>
  );
}

const FRAME_SIZE = 220;

const styles = StyleSheet.create({
  fullWrapper: {
    width: "100%",
    height: 220,
    overflow: "hidden",
    borderRadius: 16,
    position: "relative",
  },
  compactWrapper: {
    width: "100%",
    height: 160,
    overflow: "hidden",
    borderRadius: 12,
    position: "relative",
  },
  container: {
    height: 180,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
  },
  permText: { fontSize: 14, textAlign: "center" },
  permBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  permBtnText: { color: "#fff", fontWeight: "600" },
  webFallback: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  webText: { fontSize: 13 },
  webSubtext: { fontSize: 11, marginTop: 4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  scanFrame: {
    width: FRAME_SIZE,
    height: 80,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: {
    color: "#fff",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
