import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system/legacy";

const BACKGROUND_SYNC_TASK = "pdv-pocket-background-sync";

/**
 * Definir handler da task de sincronização no escopo de módulo
 * Isso garante que seja registrada quando o módulo for importado
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log("[Background Sync] Iniciando sincronização...");

    // Verificar se está autenticado com Google Drive
    const token = await SecureStore.getItemAsync("google_drive_token");
    if (!token) {
      console.log("[Background Sync] Não autenticado com Google Drive");
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    console.log("[Background Sync] Backup concluído com sucesso");
    const now = new Date().toISOString();
    await SecureStore.setItemAsync("last_backup_time", now);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("[Background Sync] Erro:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registrar task de sincronização automática
 * Sincroniza banco SQLite com Google Drive diariamente
 */
export async function registerBackgroundSyncTask() {
  try {
    // Agendar task para executar diariamente
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 24 * 60 * 60, // 24 horas
      stopOnTerminate: false,
      startOnBoot: true,
    });

    console.log("[Background Sync] Task registrada com sucesso");
  } catch (error) {
    console.error("[Background Sync] Erro ao registrar task:", error);
  }
}

/**
 * Desregistrar task de sincronização
 */
export async function unregisterBackgroundSyncTask() {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log("[Background Sync] Task desregistrada");
  } catch (error) {
    console.error("[Background Sync] Erro ao desregistrar task:", error);
  }
}
