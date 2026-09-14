import { Modal, View } from 'react-native';
import { WebView } from 'react-native-webview';

export type WompiWidgetParams = {
  public_key: string;
  currency: string;
  amount_in_cents: number;
  reference: string;
  signature: string;
  redirect_url?: string;
};

/**
 * Equivalente RN de frontend/src/utils/wompiWidget.js — el backend firma todo
 * (nunca el cliente), esto solo carga el script oficial de Wompi dentro de un
 * WebView y abre el checkout. El backend YA calculó el monto/firma antes de
 * llegar aquí (walletService.initRecharge / tripLifecycleService.initCardPayment).
 */
export function WompiWidgetModal({
  isOpen,
  params,
  onClose,
  onResult,
}: {
  isOpen: boolean;
  params: WompiWidgetParams | null;
  onClose: () => void;
  onResult: (result: { success: boolean; transaction?: any }) => void;
}) {
  if (!params) return null;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
    <body style="margin:0;background:#0f172a;">
      <script src="https://checkout.wompi.co/widget.js"></script>
      <script>
        function abrir() {
          if (!window.WidgetCheckout) { setTimeout(abrir, 150); return; }
          var checkout = new WidgetCheckout({
            currency: ${JSON.stringify(params.currency)},
            amountInCents: ${params.amount_in_cents},
            reference: ${JSON.stringify(params.reference)},
            publicKey: ${JSON.stringify(params.public_key)},
            signature: { integrity: ${JSON.stringify(params.signature)} },
            redirectUrl: ${JSON.stringify(params.redirect_url || '')},
          });
          checkout.open(function (result) {
            var transaction = result && result.transaction;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              success: transaction && transaction.status === 'APPROVED',
              transaction: transaction,
            }));
          });
        }
        abrir();
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={isOpen} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <WebView
          source={{ html }}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              onResult(data);
            } catch {
              onResult({ success: false });
            }
          }}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    </Modal>
  );
}
