import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { notificationsService } from '@uniwheels/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let cachedPushToken: string | null = null;

export function getLastPushToken(): string | null {
  return cachedPushToken;
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.info('[PushNotificationService] Las notificaciones push requieren un dispositivo físico.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('trip_alerts', {
      name: 'Alertas de Viaje y SOS',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('general_alerts', {
      name: 'Alertas Generales',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[PushNotificationService] Permiso de notificaciones push no otorgado.');
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    // Sin proyecto EAS (por ejemplo en Expo Go antes de `eas build:configure`) no hay projectId
    // y Expo no puede emitir el token: se omite el registro sin tratarlo como error.
    if (!projectId) {
      console.warn('[PushNotificationService] Sin projectId de EAS: se omite el registro de notificaciones push.');
      return null;
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenResponse.data;
    cachedPushToken = pushToken;

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'expo';
    const deviceName = Device.deviceName || Device.modelName || null;
    const appVersion = Constants?.expoConfig?.version || '1.0.0';

    try {
      await notificationsService.registerDeviceToken({
        token: pushToken,
        platform,
        deviceName,
        appVersion,
      });
    } catch (err) {
      console.warn('[PushNotificationService] Error al registrar token en backend (se reintentará en backend real):', err);
    }

    return pushToken;
  } catch (error) {
    console.error('[PushNotificationService] Error al obtener el push token de Expo:', error);
    return null;
  }
}

export async function unregisterPushNotificationsAsync(token?: string | null): Promise<void> {
  const tokenToUnregister = token || cachedPushToken;
  if (!tokenToUnregister) return;

  try {
    await notificationsService.unregisterDeviceToken(tokenToUnregister);
  } catch (error) {
    console.warn('[PushNotificationService] Error al remover token en backend:', error);
  } finally {
    if (tokenToUnregister === cachedPushToken) {
      cachedPushToken = null;
    }
  }
}
