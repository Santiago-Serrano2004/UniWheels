<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trip extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    const STATUS_SOLICITADO = 'solicitado';

    const STATUS_CONFIRMADO = 'confirmado';

    const STATUS_EN_CAMINO = 'en_camino';

    const STATUS_EN_PUNTO_ENCUENTRO = 'en_punto_encuentro';

    const STATUS_RECOGIDO = 'recogido';

    const STATUS_COMPLETADO = 'completado';

    const STATUS_CANCELADO_CONDUCTOR = 'cancelado_por_conductor';

    const STATUS_CANCELADO_PASAJERO = 'cancelado_por_pasajero';

    const COMMISSION_RATE = 0.12; // 12% comisión operativa

    const DRIVER_CANCEL_PENALTY_COP = 3000.00; // $3.000 COP penalización por cancelar con pasajeros

    // efectivo/nequi_directo/daviplata_directo: el pasajero paga P2P directo al
    // conductor — UniWheels nunca custodia ese dinero, pero igual cobra su
    // comisión débitandola de la billetera interna del conductor al completar
    // el viaje. tarjeta: el pasajero paga a través de la plataforma (Wompi); la
    // comisión ya queda retenida ahí mismo y la ganancia del conductor se
    // acredita a su billetera interna (no hay pasarela de desembolso bancario).
    const PAYMENT_METHOD_EFECTIVO = 'efectivo';

    const PAYMENT_METHOD_NEQUI_DIRECTO = 'nequi_directo';

    const PAYMENT_METHOD_DAVIPLATA_DIRECTO = 'daviplata_directo';

    const PAYMENT_METHOD_TARJETA = 'tarjeta';

    const PAYMENT_METHODS = [
        self::PAYMENT_METHOD_EFECTIVO,
        self::PAYMENT_METHOD_NEQUI_DIRECTO,
        self::PAYMENT_METHOD_DAVIPLATA_DIRECTO,
        self::PAYMENT_METHOD_TARJETA,
    ];

    const P2P_PAYMENT_METHODS = [
        self::PAYMENT_METHOD_EFECTIVO,
        self::PAYMENT_METHOD_NEQUI_DIRECTO,
        self::PAYMENT_METHOD_DAVIPLATA_DIRECTO,
    ];

    protected $fillable = [
        'route_id',
        'driver_id',
        'passenger_id',
        'vehicle_id',
        'driver_name',
        'passenger_name',
        'vehicle_plate',
        'vehicle_model',
        'pickup_stop_id',
        'pickup_address',
        'dropoff_stop_id',
        'dropoff_address',
        'boarding_pin',
        'is_pin_verified',
        'pin_verified_at',
        'payment_method',
        'total_fare_cop',
        'driver_amount_cop',
        'platform_commission_cop',
        'commission_status',
        'status',
        'scheduled_pickup_time',
        'actual_pickup_time',
        'actual_dropoff_time',
        'payment_confirmed_at',
        'payment_reference',
    ];

    protected function casts(): array
    {
        return [
            'is_pin_verified' => 'boolean',
            'pin_verified_at' => 'datetime',
            'total_fare_cop' => 'float',
            'driver_amount_cop' => 'float',
            'platform_commission_cop' => 'float',
            'scheduled_pickup_time' => 'datetime',
            'actual_pickup_time' => 'datetime',
            'actual_dropoff_time' => 'datetime',
            'payment_confirmed_at' => 'datetime',
        ];
    }

    public function isPaymentByCard(): bool
    {
        return $this->payment_method === self::PAYMENT_METHOD_TARJETA;
    }

    /**
     * Verificar el PIN de abordaje de 4 dígitos dictado por el pasajero al conductor.
     */
    public function verifyBoardingPin(string $pin): bool
    {
        // Nunca se puede "resucitar" un viaje ya cancelado, recogido o completado
        // verificando el PIN sobre un estado terminal.
        $estadosTerminales = [
            self::STATUS_RECOGIDO,
            self::STATUS_COMPLETADO,
            self::STATUS_CANCELADO_CONDUCTOR,
            self::STATUS_CANCELADO_PASAJERO,
        ];
        if (in_array($this->status, $estadosTerminales, true)) {
            return false;
        }

        if (! hash_equals(trim((string) $this->boarding_pin), trim($pin))) {
            return false;
        }

        $this->update([
            'is_pin_verified' => true,
            'pin_verified_at' => now(),
            'actual_pickup_time' => now(),
            'status' => self::STATUS_RECOGIDO,
        ]);

        return true;
    }

    /**
     * Iniciar el desplazamiento del conductor hacia el punto de recogida.
     */
    public function startDriving(): void
    {
        if (in_array($this->status, [self::STATUS_SOLICITADO, self::STATUS_CONFIRMADO])) {
            $this->update(['status' => self::STATUS_EN_CAMINO]);
        }
    }

    /**
     * Notificar que el conductor llegó al punto de encuentro.
     */
    public function arriveAtMeetingPoint(): void
    {
        if ($this->status === self::STATUS_EN_CAMINO) {
            $this->update(['status' => self::STATUS_EN_PUNTO_ENCUENTRO]);
        }
    }

    /**
     * Marcar el viaje como completado y fijar el reparto de tarifa. La
     * liquidación real (débito de comisión P2P o acreditación de ganancia por
     * tarjeta) la resuelve el controlador contra auth-service — este método ya
     * NO marca 'commission_status' como exitoso a ciegas, solo dice qué se debe
     * cobrar; el estado real se fija según lo que efectivamente ocurra.
     */
    public function complete(): void
    {
        $comision = round($this->total_fare_cop * self::COMMISSION_RATE, 2);
        $gananciaConductor = round($this->total_fare_cop - $comision, 2);

        $this->update([
            'status' => self::STATUS_COMPLETADO,
            'actual_dropoff_time' => now(),
            'platform_commission_cop' => $comision,
            'driver_amount_cop' => $gananciaConductor,
        ]);
    }

    // Ventanas de cancelación sin penalización (docs/REGLAS_DE_NEGOCIO_Y_TARIFAS.md § 3).
    const PASSENGER_FREE_CANCEL_MINUTES = 2;

    const DRIVER_FREE_CANCEL_MINUTES = 15;

    private function minutesBeforeDeparture(): int
    {
        if (! $this->scheduled_pickup_time) {
            return 0;
        }

        return max(0, (int) round(now()->diffInSeconds($this->scheduled_pickup_time, false) / 60));
    }

    /**
     * Cancelar el viaje por parte del conductor. Aplica penalización si ya tenía
     * pasajero confirmado y cancela con menos de 15 min de anticipación.
     */
    public function cancelByDriver(string $reason, ?string $cancelledByUserId = null): array
    {
        $teniaPasajeroConfirmado = in_array($this->status, [
            self::STATUS_CONFIRMADO,
            self::STATUS_EN_CAMINO,
            self::STATUS_EN_PUNTO_ENCUENTRO,
        ]);

        $minutosAntes = $this->minutesBeforeDeparture();
        $aplicaPenalizacion = $teniaPasajeroConfirmado && $minutosAntes < self::DRIVER_FREE_CANCEL_MINUTES;

        $this->update(['status' => self::STATUS_CANCELADO_CONDUCTOR]);

        TripCancellation::create([
            'trip_id' => $this->id,
            'cancelled_by_user_id' => $cancelledByUserId ?? $this->driver_id,
            'canceller_role' => 'conductor',
            'reason_category' => 'otro',
            'detailed_reason' => $reason,
            'minutes_before_departure' => $minutosAntes,
            'had_penalty' => $aplicaPenalizacion,
        ]);

        return [
            'penalized' => $aplicaPenalizacion,
            'penalty_cop' => $aplicaPenalizacion ? self::DRIVER_CANCEL_PENALTY_COP : 0.0,
            'reason' => $reason,
        ];
    }

    /**
     * Cancelar el viaje por parte del pasajero. Sin penalización hasta 2 min antes
     * de la hora de salida programada; con menos tiempo, se registra infracción.
     */
    public function cancelByPassenger(string $reason, ?string $cancelledByUserId = null): array
    {
        $minutosAntes = $this->minutesBeforeDeparture();
        $aplicaPenalizacion = $minutosAntes < self::PASSENGER_FREE_CANCEL_MINUTES;

        $this->update(['status' => self::STATUS_CANCELADO_PASAJERO]);

        TripCancellation::create([
            'trip_id' => $this->id,
            'cancelled_by_user_id' => $cancelledByUserId ?? $this->passenger_id,
            'canceller_role' => 'pasajero',
            'reason_category' => 'otro',
            'detailed_reason' => $reason,
            'minutes_before_departure' => $minutosAntes,
            'had_penalty' => $aplicaPenalizacion,
        ]);

        return [
            'penalized' => $aplicaPenalizacion,
        ];
    }
}
