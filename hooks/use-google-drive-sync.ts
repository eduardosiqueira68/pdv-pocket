import { useEffect, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { Platform, Alert } from "react-native";

/**
 * IMPORTANTE: Para usar Google Drive Sync em produção, você precisa:
 * 1. Criar OAuth 2.0 credentials no Google Cloud Console
 * 2. Configurar redirect URI: exp://YOUR_EXPO_SLUG/oauth/google
 * 3. Implementar backend para trocar code por access_token (segurança)
 * 4. Atualizar GOOGLE_CLIENT_ID e BACKEND_URL
 *
 * Por enquanto, este hook é um placeholder que mostra a estrutura.
 */

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
const BACKEND_URL = "https://your-backend.com/api";

export interface GoogleDriveSyncState {
  isAuthenticated: boolean;
  isLoading: boolean;
  lastBackupTime: string | null;
  error: string | null;
}

/**
 * Hook para gerenciar sincronização com Google Drive
 * NOTA: Requer configuração OAuth e backend para produção
 */
export function useGoogleDriveSync() {
  const [state, setState] = useState<GoogleDriveSyncState>({
    isAuthenticated: false,
    isLoading: false,
    lastBackupTime: null,
    error: null,
  });

  const accessTokenRef = useRef<string | null>(null);

  // Obter token armazenado ao inicializar
  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const token = await SecureStore.getItemAsync("google_drive_token");
        const lastBackup = await SecureStore.getItemAsync("last_backup_time");

        if (token) {
          accessTokenRef.current = token;
          setState((prev) => ({
            ...prev,
            isAuthenticated: true,
            lastBackupTime: lastBackup,
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar token armazenado:", error);
      }
    };

    loadStoredToken();
  }, []);

  // Fazer login com Google
  const loginWithGoogle = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Não suportado", "Google Drive sync não é suportado em web. Use em Android ou iOS.");
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Mostrar aviso de que é placeholder
      Alert.alert(
        "Configuração Necessária",
        "Para usar Google Drive Sync, você precisa:\n\n" +
          "1. Criar OAuth credentials no Google Cloud Console\n" +
          "2. Configurar backend para trocar code por token\n" +
          "3. Atualizar GOOGLE_CLIENT_ID e BACKEND_URL\n\n" +
          "Por enquanto, este é um placeholder."
      );

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Google Drive Sync requer configuração OAuth",
      }));
    } catch (error) {
      console.error("Erro ao fazer login com Google:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Erro ao autenticar com Google",
      }));
    }
  };

  // Fazer logout
  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("google_drive_token");
      await SecureStore.deleteItemAsync("last_backup_time");
      accessTokenRef.current = null;
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        lastBackupTime: null,
      }));
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // Fazer upload do banco para Google Drive
  const uploadDatabase = async () => {
    if (!accessTokenRef.current) {
      setState((prev) => ({
        ...prev,
        error: "Não autenticado com Google Drive",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const dbPath = `${FileSystem.documentDirectory}pdvpocket.db`;

      // Verificar se arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      if (!fileInfo.exists) {
        throw new Error("Arquivo de banco não encontrado");
      }

      // Ler arquivo como base64
      const fileContent = await FileSystem.readAsStringAsync(dbPath, {
        encoding: "base64",
      });

      // Fazer upload via backend (que faz upload para Google Drive)
      const response = await fetch(`${BACKEND_URL}/backup/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
        body: JSON.stringify({
          fileName: `pdvpocket_${new Date().toISOString()}.db`,
          fileContent: fileContent,
        }),
      });

      if (response.ok) {
        const now = new Date().toISOString();
        await SecureStore.setItemAsync("last_backup_time", now);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          lastBackupTime: now,
        }));
        Alert.alert("Sucesso", "Backup realizado com sucesso!");
        return true;
      } else {
        throw new Error("Erro ao fazer upload");
      }
    } catch (error) {
      console.error("Erro ao fazer upload do banco:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Erro ao fazer backup: ${errorMsg}`,
      }));
      Alert.alert("Erro", `Falha ao fazer backup: ${errorMsg}`);
      return false;
    }
  };

  // Fazer download do banco do Google Drive
  const downloadDatabase = async () => {
    if (!accessTokenRef.current) {
      setState((prev) => ({
        ...prev,
        error: "Não autenticado com Google Drive",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fazer download via backend
      const response = await fetch(`${BACKEND_URL}/backup/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessTokenRef.current}`,
        },
      });

      if (!response.ok) {
        throw new Error("Nenhum backup encontrado");
      }

      // Obter conteúdo como base64
      const data = await response.json();
      const fileContent = data.fileContent;

      if (!fileContent) {
        throw new Error("Conteúdo do backup vazio");
      }

      const dbPath = `${FileSystem.documentDirectory}pdvpocket.db`;

      // Escrever arquivo do banco
      await FileSystem.writeAsStringAsync(dbPath, fileContent, {
        encoding: "base64",
      });

      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
      Alert.alert("Sucesso", "Backup restaurado com sucesso! App será reiniciado.");
      return true;
    } catch (error) {
      console.error("Erro ao fazer download do banco:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: `Erro ao restaurar backup: ${errorMsg}`,
      }));
      Alert.alert("Erro", `Falha ao restaurar backup: ${errorMsg}`);
      return false;
    }
  };

  return {
    state,
    loginWithGoogle,
    logout,
    uploadDatabase,
    downloadDatabase,
  };
}
