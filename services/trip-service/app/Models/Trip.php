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
        ];
    }

    /**
     * Verificar el PIN de abordaje de 4 dígitos dictado por el pasajero al conductor.
     */
    public function verifyBoardingPin(string $pin): bool
    {
        if (trim($pin) !== trim($this->boarding_pin)) {
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
     * Completar el viaje exitosamente y liquidar comisiones.
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
            'commission_status' => 'debitada_exitosamente',
        ]);
    }

    /**
     * Cancelar el viaje por parte del conductor (aplica penalización si ya estaba confirmado).
     */
    public function cancelByDriver(string $reason): array
    {
        $aplicaPenalizacion = in_array($this->status, [
            self::STATUS_CONFIRMADO,
            self::STATUS_EN_CAMINO,
            self::STATUS_EN_PUNTO_ENCUENTRO,
        ]);

        $this->update([
            'status' => self::STATUS_CANCELADO_CONDUCTOR,
        ]);

        return [
            'penalized' => $aplicaPenalizacion,
            'penalty_cop' => $aplicaPenalizacion ? self::DRIVER_CANCEL_PENALTY_COP : 0.0,
            'reason' => $reason,
        ];
    }

    /**
     * Cancelar el viaje por parte del pasajero.
     */
    public function cancelByPassenger(string $reason): void
    {
        $this->update([
            'status' => self::STATUS_CANCELADO_PASAJERO,
        ]);
    }
}
