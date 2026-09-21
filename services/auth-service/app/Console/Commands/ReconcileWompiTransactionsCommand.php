<?php

namespace App\Console\Commands;

use App\Models\WalletTransaction;
use App\Models\WompiWebhookEvent;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ReconcileWompiTransactionsCommand extends Command
{
    protected $signature = 'uniwheels:reconcile-wompi 
                            {--date= : Fecha específica a conciliar en formato Y-m-d (ej. 2026-09-21)} 
                            {--days=1 : Número de días hacia atrás a conciliar si no se especifica --date}';

    protected $description = 'Concilia eventos de webhooks Wompi persistidos contra transacciones de billetera registradas y reporta discrepancias contables.';

    public function handle(): int
    {
        $fechaEspecifica = $this->option('date');
        $diasAtras = (int) $this->option('days');

        if ($fechaEspecifica) {
            $desde = Carbon::parse($fechaEspecifica)->startOfDay();
            $hasta = Carbon::parse($fechaEspecifica)->endOfDay();
        } else {
            $desde = now()->subDays(max(1, $diasAtras))->startOfDay();
            $hasta = now();
        }

        $this->info('Iniciando conciliación de pagos Wompi...');
        $this->line("Rango evaluado: {$desde->toDateTimeString()} hasta {$hasta->toDateTimeString()}");

        $eventosWompi = WompiWebhookEvent::whereBetween('created_at', [$desde, $hasta])
            ->where(function ($query) {
                $query->where('reference', 'LIKE', 'WR-%')
                    ->orWhereNull('reference');
            })
            ->get();

        $transaccionesRecarga = WalletTransaction::where('transaction_type', 'recarga_tarjeta')
            ->whereBetween('created_at', [$desde, $hasta])
            ->get();

        $discrepancias = [];
        $conciliadasExitosas = 0;

        // 1. Evaluar cada evento Wompi persistido
        foreach ($eventosWompi as $evento) {
            if (! $evento->signature_valid) {
                $discrepancias[] = [
                    'tipo' => 'FIRMA_INVALIDA',
                    'referencia' => $evento->reference ?? 'N/A',
                    'id_wompi' => $evento->transaction_id ?? 'N/A',
                    'estado_wompi' => $evento->status ?? 'N/A',
                    'monto_wompi_cop' => $evento->amount_in_cents ? ($evento->amount_in_cents / 100) : 0,
                    'monto_billetera_cop' => 0,
                    'detalle' => 'Webhook recibido con firma criptográfica inválida.',
                ];

                continue;
            }

            if (! $evento->reference || ! str_starts_with($evento->reference, 'WR-')) {
                continue;
            }

            $tx = $transaccionesRecarga->firstWhere('reference_id', $evento->reference);

            if ($evento->status === 'APPROVED') {
                if (! $tx) {
                    $discrepancias[] = [
                        'tipo' => 'APROBADO_SIN_TRANSACCION',
                        'referencia' => $evento->reference,
                        'id_wompi' => $evento->transaction_id ?? 'N/A',
                        'estado_wompi' => $evento->status,
                        'monto_wompi_cop' => $evento->amount_in_cents ? ($evento->amount_in_cents / 100) : 0,
                        'monto_billetera_cop' => 0,
                        'detalle' => 'Evento Wompi aprobado pero no se acreditó en la billetera del usuario.',
                    ];
                } else {
                    $montoWompiCop = round(($evento->amount_in_cents ?? 0) / 100, 2);
                    $montoTxCop = (float) $tx->amount_cop;

                    if (abs($montoWompiCop - $montoTxCop) > 0.01) {
                        $discrepancias[] = [
                            'tipo' => 'MONTO_DISCREPANTE',
                            'referencia' => $evento->reference,
                            'id_wompi' => $evento->transaction_id ?? 'N/A',
                            'estado_wompi' => $evento->status,
                            'monto_wompi_cop' => $montoWompiCop,
                            'monto_billetera_cop' => $montoTxCop,
                            'detalle' => "Diferencia de monto: Wompi={$montoWompiCop} COP vs Ledger={$montoTxCop} COP.",
                        ];
                    } else {
                        $conciliadasExitosas++;
                    }
                }
            } else {
                // Estado no aprobado (DECLINED, VOIDED, ERROR)
                if ($tx) {
                    $discrepancias[] = [
                        'tipo' => 'CREDITO_INDEBIDO',
                        'referencia' => $evento->reference,
                        'id_wompi' => $evento->transaction_id ?? 'N/A',
                        'estado_wompi' => $evento->status ?? 'UNKNOWN',
                        'monto_wompi_cop' => $evento->amount_in_cents ? ($evento->amount_in_cents / 100) : 0,
                        'monto_billetera_cop' => (float) $tx->amount_cop,
                        'detalle' => "Transacción acreditada en billetera pero el evento Wompi tiene estado '{$evento->status}'.",
                    ];
                }
            }
        }

        // 2. Verificar transacciones huérfanas sin evento Wompi persistido
        foreach ($transaccionesRecarga as $tx) {
            $evento = $eventosWompi->firstWhere('reference', $tx->reference_id);
            if (! $evento) {
                $discrepancias[] = [
                    'tipo' => 'TRANSACCION_SIN_EVENTO',
                    'referencia' => $tx->reference_id ?? 'N/A',
                    'id_wompi' => 'N/A',
                    'estado_wompi' => 'N/A',
                    'monto_wompi_cop' => 0,
                    'monto_billetera_cop' => (float) $tx->amount_cop,
                    'detalle' => 'Transacción de recarga registrada en billetera sin evento webhook de Wompi correspondiente.',
                ];
            }
        }

        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Eventos Wompi analizados', $eventosWompi->count()],
                ['Transacciones de recarga analizadas', $transaccionesRecarga->count()],
                ['Conciliadas exitosamente', $conciliadasExitosas],
                ['Discrepancias encontradas', count($discrepancias)],
            ]
        );

        if (count($discrepancias) > 0) {
            $this->error('Se encontraron '.count($discrepancias).' discrepancia(s) en la conciliación:');
            $this->table(
                ['Tipo', 'Referencia', 'ID Wompi', 'Estado Wompi', 'Monto Wompi', 'Monto Billetera', 'Detalle'],
                $discrepancias
            );

            Log::warning('Conciliación diaria Wompi: discrepancias detectadas.', [
                'total_discrepancias' => count($discrepancias),
                'discrepancias' => $discrepancias,
            ]);

            return self::FAILURE;
        }

        $this->info('Conciliación completada exitosamente sin discrepancias.');

        return self::SUCCESS;
    }
}
