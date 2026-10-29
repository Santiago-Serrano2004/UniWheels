<?php

namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

/**
 * Métricas semanales del piloto (semanas ISO, hora de Colombia). Solo agregados:
 * los ids de usuario salen únicamente como hash HMAC por el endpoint interno.
 */
class PilotMetrics
{
    private const TZ = 'America/Bogota';

    /** Expresión SQL: lunes (hora Colombia) de la semana de una columna timestamp en UTC. */
    private const WEEK_SQL = "date_trunc('week', (%s AT TIME ZONE 'UTC') AT TIME ZONE 'America/Bogota')::date";

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

    /**
     * @return array{searches: array<string,int>, hits: array<string,int>, drivers: array<string,int>, active: array<string,int>}
     */
    private function aggregate(int $weeks): array
    {
        $desde = CarbonImmutable::parse($this->weekStarts($weeks)[0], self::TZ)->utc();
        $semanaLog = sprintf(self::WEEK_SQL, 'created_at');

        $busquedas = DB::table('search_logs')
            ->where('created_at', '>=', $desde)
            ->selectRaw("$semanaLog as week, count(*) as searches, count(*) filter (where results_count > 0) as hits")
            ->groupBy('week')
            ->get()
            ->keyBy('week');

        $conductores = DB::table('routes')
            ->where('created_at', '>=', $desde)
            ->selectRaw("$semanaLog as week, count(distinct driver_id) as drivers")
            ->groupBy('week')
            ->pluck('drivers', 'week');

        $activos = [];
        foreach ($this->activeUserIds($weeks) as $semana => $ids) {
            $activos[$semana] = count($ids);
        }

        return [
            'searches' => $busquedas->map(fn ($f) => (int) $f->searches)->all(),
            'hits' => $busquedas->map(fn ($f) => (int) $f->hits)->all(),
            'drivers' => $conductores->map(fn ($n) => (int) $n)->all(),
            'active' => $activos,
        ];
    }

    /**
     * @return list<array{week_start: string, searches: int, searches_with_results: int, hit_rate: float|null, publishing_drivers: int, active_users: int}>
     */
    public function weekly(int $weeks): array
    {
        $datos = $this->aggregate($weeks);

        return array_map(function (string $semana) use ($datos) {
            $busquedas = $datos['searches'][$semana] ?? 0;
            $conResultado = $datos['hits'][$semana] ?? 0;

            return [
                'week_start' => $semana,
                'searches' => $busquedas,
                'searches_with_results' => $conResultado,
                'hit_rate' => $busquedas > 0 ? round($conResultado / $busquedas, 4) : null,
                'publishing_drivers' => $datos['drivers'][$semana] ?? 0,
                'active_users' => $datos['active'][$semana] ?? 0,
            ];
        }, $this->weekStarts($weeks));
    }

    /**
     * Hashes HMAC-SHA256 de los usuarios que buscaron o publicaron, por semana.
     *
     * @return array<string, list<string>>
     */
    public function activeUserHashes(int $weeks): array
    {
        $llave = self::hashKey();

        return array_map(
            fn (array $ids) => array_map(fn (string $id) => hash_hmac('sha256', $id, $llave), $ids),
            $this->activeUserIds($weeks),
        );
    }

    /**
     * @return array<string, list<string>> semana => ids distintos (uso interno, nunca se serializa).
     */
    private function activeUserIds(int $weeks): array
    {
        $desde = CarbonImmutable::parse($this->weekStarts($weeks)[0], self::TZ)->utc();
        $semana = sprintf(self::WEEK_SQL, 'created_at');

        $buscadores = DB::table('search_logs')->where('created_at', '>=', $desde)
            ->selectRaw("distinct $semana as week, passenger_id as uid");
        $conductores = DB::table('routes')->where('created_at', '>=', $desde)
            ->selectRaw("distinct $semana as week, driver_id as uid");

        $porSemana = [];
        foreach ($buscadores->union($conductores)->get() as $fila) {
            $porSemana[$fila->week][] = (string) $fila->uid;
        }

        return array_map('array_unique', $porSemana);
    }

    /**
     * Misma llave en route-matching y trip-service para poder unir activos sin exponer ids.
     * METRICS_HASH_SECRET si está definida; si no, se deriva del secreto JWT compartido.
     */
    public static function hashKey(): string
    {
        return config('uniwheels.metrics_hash_secret')
            ?: hash_hmac('sha256', 'uniwheels-metrics-v1', (string) config('jwt.secret'));
    }
}
