import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useAppStore } from "@/lib/store/app-store";
import { useGoogleDriveSync } from "@/hooks/use-google-drive-sync";
import * as Haptics from "expo-haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { state, updateStoreName } = useAppStore();
  const { state: syncState, loginWithGoogle, logout, uploadDatabase, downloadDatabase } = useGoogleDriveSync();
  const [storeName, setStoreName] = useState(state.store?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert("Atenção", "O nome da loja não pode estar vazio.");
      return;
    }
    setIsSaving(true);
    try {
      await updateStoreName(storeName.trim());
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Salvo!", "Nome da loja atualizado com sucesso.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar.");
    } finally {
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
        <Text style={[styles.title, { color: colors.foreground }]}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Store section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>MINHA LOJA</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.foreground }]}>Nome da Loja</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
            value={storeName}
            onChangeText={setStoreName}
            placeholder="Nome da sua loja"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>{isSaving ? "Salvando..." : "Salvar"}</Text>
          </TouchableOpacity>
        </View>

        {/* About section */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>SOBRE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Aplicativo</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>PDV Pocket</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Versão</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>Armazenamento</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>Local (offline)</Text>
          </View>
        </View>

        {/* Google Drive Sync */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>SINCRONIZAÇÃO COM GOOGLE DRIVE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {!syncState.isAuthenticated ? (
            <>
              <Text style={[styles.syncDescription, { color: colors.muted }]}>
                Faça backup automático de seus dados no Google Drive. Recupere seus dados em caso de perda do dispositivo.
              </Text>
              <TouchableOpacity
                style={[styles.syncBtn, { backgroundColor: colors.primary, opacity: syncState.isLoading ? 0.7 : 1 }]}
                onPress={loginWithGoogle}
                disabled={syncState.isLoading}
                activeOpacity={0.8}
              >
                <IconSymbol name="globe" size={18} color="#fff" />
                <Text style={styles.syncBtnText}>{syncState.isLoading ? "Conectando..." : "Conectar Google Drive"}</Text>
              </TouchableOpacity>
              {syncState.error && (
                <Text style={[styles.errorText, { color: colors.error }]}>{syncState.error}</Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.syncStatus}>
                <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusLabel, { color: colors.foreground }]}>Conectado ao Google Drive</Text>
                  {syncState.lastBackupTime && (
                    <Text style={[styles.statusTime, { color: colors.muted }]}>
                      Último backup: {new Date(syncState.lastBackupTime).toLocaleString("pt-BR")}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.syncActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                  onPress={uploadDatabase}
                  disabled={syncState.isLoading}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="arrow.up.circle.fill" size={18} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    {syncState.isLoading ? "Fazendo backup..." : "Fazer Backup Agora"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
                  onPress={downloadDatabase}
                  disabled={syncState.isLoading}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="arrow.down.circle.fill" size={18} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                    {syncState.isLoading ? "Restaurando..." : "Restaurar Backup"}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: colors.error + "15" }]}
                onPress={logout}
                activeOpacity={0.7}
              >
                <Text style={[styles.logoutBtnText, { color: colors.error }]}>Desconectar Google Drive</Text>
              </TouchableOpacity>
              {syncState.error && (
                <Text style={[styles.errorText, { color: colors.error }]}>{syncState.error}</Text>
              )}
            </>
          )}
        </View>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>FUNCIONALIDADES</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { icon: "barcode.viewfinder", label: "Scanner EAN/UPC pela câmera" },
            { icon: "cube.box.fill", label: "Cadastro rápido de produtos" },
            { icon: "dollarsign.circle.fill", label: "Dinheiro, Pix e Cartão" },
            { icon: "list.bullet.rectangle", label: "Histórico completo de vendas" },
            { icon: "chart.bar.fill", label: "Relatório diário" },
          ].map((feat, i, arr) => (
            <View key={feat.label}>
              <View style={styles.featRow}>
                <View style={[styles.featIcon, { backgroundColor: colors.primary + "15" }]}>
                  <IconSymbol name={feat.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={[styles.featLabel, { color: colors.foreground }]}>{feat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>
      </ScrollView>
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
  content: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionTitle: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, marginTop: 12, marginBottom: 6, marginLeft: 4 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  label: { fontSize: 14, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  divider: { height: 0.5 },
  featRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  featIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  featLabel: { fontSize: 14, flex: 1 },
  syncDescription: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  syncBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10 },
  syncBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  syncStatus: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 14, fontWeight: "600" },
  statusTime: { fontSize: 12, marginTop: 2 },
  syncActions: { gap: 8, marginVertical: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontWeight: "600", fontSize: 14 },
  logoutBtn: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  logoutBtnText: { fontWeight: "600", fontSize: 14 },
  errorText: { fontSize: 12, marginTop: 8 },
});
