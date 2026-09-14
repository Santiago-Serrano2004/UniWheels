import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ArrowDownRight, ArrowUpRight, PlusCircle, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { authService, tripsService, walletService } from '@uniwheels/shared';
import { WompiWidgetModal, type WompiWidgetParams } from '@/components/WompiWidgetModal';

const ETIQUETAS_TRANSACCION: Record<string, string> = {
  recarga_nequi: 'Recarga Nequi',
  recarga_pse: 'Recarga PSE',
  recarga_tarjeta: 'Recarga con Tarjeta',
  cobro_comision_viaje: 'Comisión de Viaje',
  pago_recibido_billetera: 'Pago de Viaje (Tarjeta)',
  ajuste_administrativo: 'Ajuste Administrativo',
};

const MONTOS_RAPIDOS = [10000, 20000, 50000];

export default function WalletScreen() {
  const [saldo, setSaldo] = useState(0);
  const [cargandoSaldo, setCargandoSaldo] = useState(true);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [montoRecarga, setMontoRecarga] = useState(20000);
  const [procesando, setProcesando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [widgetParams, setWidgetParams] = useState<WompiWidgetParams | null>(null);

  const cargarSaldoYMovimientos = useCallback(async () => {
    const [perfil, transacciones] = await Promise.all([authService.me(), tripsService.getWalletTransactions()]);
    if (perfil?.wallet?.balance_cop != null) setSaldo(Number(perfil.wallet.balance_cop));
    setMovimientos(Array.isArray(transacciones) ? transacciones : []);
    setCargandoSaldo(false);
  }, []);

  useEffect(() => {
    cargarSaldoYMovimientos();
  }, [cargarSaldoYMovimientos]);

  const iniciarRecarga = async () => {
    setMensajeError('');
    setMensajeExito('');
    setProcesando(true);
    try {
      const params = await walletService.initRecharge(montoRecarga);
      if (!params?.public_key) {
        throw new Error('El servicio de pagos no está configurado todavía (falta la llave pública de Wompi en el backend).');
      }
      setWidgetParams(params as WompiWidgetParams);
    } catch (err: any) {
      setMensajeError(err?.message || 'No se pudo iniciar la recarga.');
      setProcesando(false);
    }
  };

  const handleWidgetResult = async (result: { success: boolean }) => {
    setWidgetParams(null);
    if (!result.success) {
      setMensajeError('El pago no se completó. Puedes intentarlo de nuevo.');
      setProcesando(false);
      return;
    }
    setMensajeExito('Pago aprobado. Actualizando tu saldo...');
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      await cargarSaldoYMovimientos();
    }
    setMensajeExito(`¡Recarga de $ ${montoRecarga.toLocaleString('es-CO')} COP acreditada a tu saldo UniWheels!`);
    setProcesando(false);
    setTimeout(() => setMensajeExito(''), 6000);
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-slate-100 dark:bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Tarjeta de saldo */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Wallet size={14} color="#0284c7" />
              <Text className="text-xs font-semibold text-lochmara-600 dark:text-lochmara-400">Billetera UniWheels</Text>
            </View>
            <View className="flex-row items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <ShieldCheck size={12} color="#10b981" />
              <Text className="text-[11px] font-bold text-emerald-500">Prepago Seguro</Text>
            </View>
          </View>

          <View>
            <Text className="text-xs text-slate-500 dark:text-slate-400">Saldo Disponible</Text>
            {cargandoSaldo ? (
              <ActivityIndicator style={{ marginTop: 6, alignSelf: 'flex-start' }} color="#0284c7" />
            ) : (
              <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                $ {saldo.toLocaleString('es-CO')} <Text className="text-sm font-normal text-slate-400">COP</Text>
              </Text>
            )}
          </View>
        </View>

        {mensajeExito ? (
          <View className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex-row items-start gap-2.5">
            <CheckCircle2 size={16} color="#10b981" />
            <Text className="text-xs font-bold text-emerald-500 flex-1">{mensajeExito}</Text>
          </View>
        ) : null}
        {mensajeError ? (
          <View className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex-row items-start gap-2.5">
            <AlertCircle size={16} color="#e11d48" />
            <Text className="text-xs font-bold text-rose-500 flex-1">{mensajeError}</Text>
          </View>
        ) : null}

        {/* Recarga */}
        <View className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 gap-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-300">Recargar Saldo</Text>
          <View className="flex-row gap-2">
            {MONTOS_RAPIDOS.map((monto) => (
              <Pressable
                key={monto}
                onPress={() => setMontoRecarga(monto)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  montoRecarga === monto
                    ? 'bg-lochmara-600 border-lochmara-600'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <Text className={`text-xs font-bold ${montoRecarga === monto ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  ${monto.toLocaleString('es-CO')}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text className="text-[10px] text-slate-500 dark:text-slate-400">
            Al continuar se abre una ventana segura de pago (Wompi) con tarjeta, PSE o Nequi.
          </Text>
          <Pressable
            onPress={iniciarRecarga}
            disabled={procesando}
            className="py-3 rounded-2xl bg-lochmara-600 flex-row items-center justify-center gap-2 disabled:opacity-60"
          >
            {procesando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <PlusCircle size={15} color="#ffffff" />
                <Text className="text-white text-xs font-bold">Recargar $ {montoRecarga.toLocaleString('es-CO')} COP</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Historial */}
        <View className="gap-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Historial de Movimientos</Text>
          <View className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {movimientos.length > 0 ? (
              movimientos.map((tx) => {
                const esCredito = Number(tx.amount_cop) > 0;
                return (
                  <View
                    key={tx.id}
                    className="p-3.5 flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                  >
                    <View className="flex-row items-center gap-2.5 flex-1">
                      <View className={`w-8 h-8 rounded-xl items-center justify-center ${esCredito ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {esCredito ? <ArrowDownRight size={15} color="#10b981" /> : <ArrowUpRight size={15} color="#e11d48" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                          {ETIQUETAS_TRANSACCION[tx.transaction_type] || tx.transaction_type}
                        </Text>
                        <Text className="text-[10px] text-slate-400">
                          {tx.created_at ? new Date(tx.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                    </View>
                    <Text className={`text-xs font-extrabold ${esCredito ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {esCredito ? '+' : ''} $ {Number(tx.amount_cop).toLocaleString('es-CO')}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="p-4 text-center text-xs text-slate-400">No hay movimientos recientes en tu billetera.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <WompiWidgetModal
        isOpen={Boolean(widgetParams)}
        params={widgetParams}
        onClose={() => { setWidgetParams(null); setProcesando(false); }}
        onResult={handleWidgetResult}
      />
    </SafeAreaView>
  );
}
