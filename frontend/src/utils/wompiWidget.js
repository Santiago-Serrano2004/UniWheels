/**
 * Utilidad compartida para abrir el Widget de Checkout de Wompi — usada tanto
 * para el pago con tarjeta de un viaje como para la recarga de billetera. El
 * backend siempre calcula el monto y la firma de integridad (nunca el
 * navegador), así que este archivo solo carga el script oficial y abre el
 * widget con los parámetros que el backend ya firmó.
 *
 * https://docs.wompi.co/docs/colombia/widget-checkout-web/
 */

const WOMPI_SCRIPT_URL = 'https://checkout.wompi.co/widget.js';

let cargandoScript = null;

function cargarScriptWompi() {
  if (window.WidgetCheckout) return Promise.resolve();
  if (cargandoScript) return cargandoScript;

  cargandoScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el widget de pagos de Wompi.'));
    document.body.appendChild(script);
  });

  return cargandoScript;
}

/**
 * Abre el widget de Wompi con los parámetros ya firmados por el backend.
 * @param {{public_key:string, currency:string, amount_in_cents:number, reference:string, signature:string, redirect_url?:string}} params
 * @returns {Promise<{success:boolean, transaction?:object}>}
 */
export async function openWompiWidget(params) {
  if (!params?.public_key) {
    throw new Error('El servicio de pagos no está configurado todavía (falta la llave pública de Wompi).');
  }

  await cargarScriptWompi();

  return new Promise((resolve) => {
    const checkout = new window.WidgetCheckout({
      currency: params.currency,
      amountInCents: params.amount_in_cents,
      reference: params.reference,
      publicKey: params.public_key,
      signature: { integrity: params.signature },
      redirectUrl: params.redirect_url,
    });

    checkout.open((result) => {
      const transaction = result?.transaction;
      resolve({
        success: transaction?.status === 'APPROVED',
        transaction,
      });
    });
  });
}
