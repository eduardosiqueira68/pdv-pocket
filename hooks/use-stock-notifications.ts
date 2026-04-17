import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { getLowStockProducts } from "@/lib/db/database";

/**
 * Hook para gerenciar notificações locais de estoque baixo
 * - Solicita permissões de notificação
 * - Agenda verificação diária de estoque baixo
 * - Configura handlers para notificações recebidas
 * - Navega para alertas de estoque ao clicar notificação
 */
export function useStockNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const isInitialized = useRef(false);

  // Solicitar permissões de notificação
  const requestNotificationPermission = async () => {
    if (Platform.OS === "web") {
      return false; // Web não suporta notificações locais da mesma forma
    }

    try {
      // Configurar canal de notificação para Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#1B6B3A",
        });
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Erro ao solicitar permissão de notificação:", error);
      return false;
    }
  };

  // Verificar estoque baixo e enviar notificação (com deduplicação)
  const checkAndNotifyLowStock = async () => {
    try {
      // Verificar se já existe notificação de estoque baixo recente
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const recentLowStock = scheduled.some(
        (n) => n.content.data?.type === "low_stock"
      );

      if (recentLowStock) {
        console.log("Notificação de estoque baixo já agendada");
        return;
      }

      // Obter produtos com estoque baixo
      const lowStockProducts = await getLowStockProducts();

      if (lowStockProducts.length > 0) {
        const productNames = lowStockProducts
          .slice(0, 3)
          .map((p: any) => p.name)
          .join(", ");

        const moreText =
          lowStockProducts.length > 3
            ? ` e mais ${lowStockProducts.length - 3}`
            : "";

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⚠️ Estoque Baixo",
            body: `${productNames}${moreText} precisam de reposição`,
            data: {
              type: "low_stock",
              count: lowStockProducts.length,
            },
            sound: "default",
            vibrate: [0, 250, 250, 250],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 5, // Aguardar 5 segundos antes de enviar
          },
        });
      }
    } catch (error) {
      console.error("Erro ao verificar estoque baixo:", error);
    }
  };

  // Agendar notificação diária às 8:00 da manhã (com deduplicação)
  const scheduleDailyNotification = async () => {
    try {
      // Verificar se já existe notificação agendada
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const alreadyScheduled = scheduled.some(
        (n) => n.content.data?.type === "daily_check"
      );

      if (!alreadyScheduled) {
        // Agendar para 8:00 AM diariamente
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🔔 Verificação de Estoque",
            body: "Verificando produtos com estoque baixo...",
            data: {
              type: "daily_check",
            },
            sound: "default",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour: 8,
            minute: 0,
            repeats: true,
          },
        });
      }

      // Também verificar imediatamente quando o app abre
      await checkAndNotifyLowStock();
    } catch (error) {
      console.error("Erro ao agendar notificação diária:", error);
    }
  };

  // Configurar listeners de notificação (apenas uma vez)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Listener para quando notificação é recebida enquanto app está em foreground
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notificação recebida:", notification);
      });

    // Listener para quando usuário interage com a notificação
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<
          string,
          any
        >;
        if (data.type === "low_stock" || data.type === "daily_check") {
          // Navegar para tela de alertas de estoque
          router.push("/stock-alerts");
        }
      });

    // Inicializar notificações
    const initNotifications = async () => {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        await scheduleDailyNotification();
      }
    };

    initNotifications();

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return {
    checkAndNotifyLowStock,
    scheduleDailyNotification,
    requestNotificationPermission,
  };
}
