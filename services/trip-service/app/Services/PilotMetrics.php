<?php

namespace App\Services;

use App\Models\Trip;
use App\Models\TripCancellation;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;

/**
 * Métricas semanales del piloto (semanas ISO, hora de Colombia). Solo agregados:
 * ningún resultado contiene ids de usuario.
 */
class PilotMetrics
{
    private const TZ = 'America/Bogota';

    public const REPEAT_WINDOW_DAYS = 14;

    public function __construct(private RouteMatchingClient $routeMatching) {}

    /**
     * @return list<string> lunes (Y-m-d) de las últimas $weeks semanas, de la más antigua a la actual.
     */
    public function weekStarts(int $weeks): array
    {
        $actual = CarbonImmutable::now(self::TZ)->startOfWeek();

        return collect(range($weeks - 1, 0))
            ->map(fn (int $atras) => $actual->subWeeks($atras)->toDateString())
            ->all();
    }

    private function weekOf(CarbonInterface $momento): string
    {
        return CarbonImmutable::instance($momento)->setTimezone(self::TZ)->startOfWeek()->toDateString();
    }

    /**
     * @return array{partial: bool, data: list<array<string, mixed>>}
     */
    public function weekly(int $weeks): array
    {
        $semanas = $this->weekStarts($weeks);
        $desde = CarbonImmutable::parse($semanas[0], self::TZ)->utc();

        $viajes = Trip::query()
            ->where('status', Trip::STATUS_COMPLETADO)
            ->where('actual_dropoff_time', '>=', $desde)
            ->get(['passenger_id', 'driver_id', 'actual_dropoff_time']);

        $completados = $pasajeros = $conductores = $activos = [];
        foreach ($viajes as $viaje) {
            $semana = $this->weekOf($viaje->actual_dropoff_time);
            $completados[$semana] = ($completados[$semana] ?? 0) + 1;
            $pasajeros[$semana][$viaje->passenger_id] = true;
            $conductores[$semana][$viaje->driver_id] = true;
            $activos[$semana][$this->hash($viaje->passenger_id)] = true;
            $activos[$semana][$this->hash($viaje->driver_id)] = true;
        }

        $tardias = [];
        $canceladas = TripCancellation::query()
            ->where('had_penalty', true)
            ->where('created_at', '>=', $desde)
            ->get(['created_at']);
        foreach ($canceladas as $cancelacion) {
            $semana = $this->weekOf($cancelacion->created_at);
            $tardias[$semana] = ($tardias[$semana] ?? 0) + 1;
        }

        // Unión de activos únicos con los de route-matching (hashes). Si no responde,
        // se devuelven solo los de trip y se marca partial.
        $remotos = $this->routeMatching->weeklyActiveUserHashes($weeks);
        $partial = $remotos === null;

        $repeticion = $this->repeatRates($semanas);

        $data = array_map(function (string $semana) use ($completados, $pasajeros, $conductores, $activos, $tardias, $remotos, $repeticion) {
            $union = $activos[$semana] ?? [];
            foreach ($remotos[$semana] ?? [] as $hash) {
                $union[$hash] = true;
            }

            return [
                'week_start' => $semana,
                'completed_trips' => $completados[$semana] ?? 0,
                'late_cancellations' => $tardias[$semana] ?? 0,
                'active_passengers' => count($pasajeros[$semana] ?? []),
                'active_drivers' => count($conductores[$semana] ?? []),
                'weekly_active_users' => count($union),
            ] + $repeticion[$semana];
        }, $semanas);

        return ['partial' => $partial, 'data' => $data];
    }

    /**
     * Repetición a 14 días por cohorte (semana del primer viaje completado del pasajero):
     * % de pasajeros que completan otro viaje dentro de los 14 días siguientes al primero.
     *
     * @param  list<string>  $semanas
     * @return array<string, array{repeat_14d_rate: float|null, repeat_14d_cohort: int, repeat_14d_immature: bool}>
     */
    public function repeatRates(array $semanas): array
    {
        $desde = CarbonImmutable::parse($semanas[0], self::TZ)->utc();

        $primeros = Trip::query()
            ->where('status', Trip::STATUS_COMPLETADO)
            ->whereNotNull('actual_dropoff_time')
            ->groupBy('passenger_id')
            ->selectRaw('passenger_id, min(actual_dropoff_time) as first_at')
            ->get()
            ->map(fn ($f) => ['passenger_id' => $f->passenger_id, 'first_at' => CarbonImmutable::parse($f->first_at, 'UTC')])
            ->filter(fn (array $f) => $f['first_at'] >= $desde)
            ->keyBy('passenger_id');

        $siguientes = Trip::query()
            ->where('status', Trip::STATUS_COMPLETADO)
            ->whereIn('passenger_id', $primeros->keys())
            ->get(['passenger_id', 'actual_dropoff_time'])
            ->groupBy('passenger_id');

        $cohorte = $repiten = [];
        foreach ($primeros as $id => $primero) {
            $semana = $this->weekOf($primero['first_at']);
            $limite = $primero['first_at']->addDays(self::REPEAT_WINDOW_DAYS);
            $cohorte[$semana] = ($cohorte[$semana] ?? 0) + 1;

            $repitio = $siguientes[$id]->contains(
                fn (Trip $v) => $v->actual_dropoff_time > $primero['first_at'] && $v->actual_dropoff_time <= $limite
            );
            $repiten[$semana] = ($repiten[$semana] ?? 0) + ($repitio ? 1 : 0);
        }

        $ahora = CarbonImmutable::now(self::TZ);
        $resultado = [];
        foreach ($semanas as $semana) {
            $tamano = $cohorte[$semana] ?? 0;
            $cierre = CarbonImmutable::parse($semana, self::TZ)->addWeek()->addDays(self::REPEAT_WINDOW_DAYS);

            $resultado[$semana] = [
                'repeat_14d_rate' => $tamano > 0 ? round($repiten[$semana] / $tamano, 4) : null,
                'repeat_14d_cohort' => $tamano,
                // La ventana de 14 días del último pasajero de la cohorte aún no cierra.
                'repeat_14d_immature' => $cierre->greaterThan($ahora),
            ];
        }

        return $resultado;
    }

    /**
     * Mismo hash que route-matching-service para poder unir activos sin intercambiar ids.
     */
    public function hash(string $userId): string
    {
        return hash_hmac('sha256', $userId, self::hashKey());
    }

    public static function hashKey(): string
    {
        return config('uniwheels.metrics_hash_secret')
            ?: hash_hmac('sha256', 'uniwheels-metrics-v1', (string) config('jwt.secret'));
    }
}
