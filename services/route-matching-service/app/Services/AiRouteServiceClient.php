<?php

namespace App\Services;

use App\Models\Route;
use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP hacia ai-route-service (ALNS + XGBoost + TomTom) — motor de
 * optimización real. SpatialMatchingService lo usa como decisor principal;
 * si no responde, se conserva el cálculo PHP/PostGIS local como fallback
 * (mismo patrón defensivo que OsrmRoutingService/LiveTrafficService).
 */
class AiRouteServiceClient
{
    public function __construct(private JwtVerifier $jwtVerifier, private PostGisSpatialRepository $spatialRepo) {}

    private function client()
    {
        $token = $this->jwtVerifier->issueServiceToken('route-matching-service');
        $baseUrl = config('services.ai_route.url');

        return Http::withToken($token)->timeout(4)->baseUrl("{$baseUrl}/api/v1");
    }

    /**
     * Evaluación de un único pasajero candidato contra la ruta activa del conductor.
     * Devuelve el payload crudo de ai-route-service (RouteEvaluationResponse) o null
     * si el servicio no está disponible / la petición falla.
     */
    public function evaluateMatch(Route $route, float $pickupLat, float $pickupLng): ?array
    {
        $puntos = $this->spatialRepo->getOriginDestinationPoints($route->id);
        if (! $puntos) {
            return null;
        }

        try {
            $respuesta = $this->client()->post('/optimize/match', $this->matchPayload($route, $puntos, $pickupLat, $pickupLng));

            if ($respuesta->successful()) {
                return $respuesta->json();
            }
        } catch (\Throwable $e) {
            Log::warning('ai-route-service no disponible, usando fallback PHP/PostGIS.', [
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }

    /**
     * Evaluación en paralelo (Http::pool) de varias candidatas con un timeout corto por
     * llamada. $items: [route_id => ['route' => Route, 'lat' => float, 'lng' => float]].
     * Devuelve [route_id => payload]; las que fallen, venzan el timeout o no tengan
     * geometría se omiten del resultado.
     */
    public function evaluateMatches(array $items): array
    {
        $peticiones = [];
        foreach ($items as $id => $item) {
            $puntos = $this->spatialRepo->getOriginDestinationPoints($item['route']->id);
            if ($puntos) {
                $peticiones[$id] = $this->matchPayload($item['route'], $puntos, $item['lat'], $item['lng']);
            }
        }

        if (! $peticiones) {
            return [];
        }

        $token = $this->jwtVerifier->issueServiceToken('route-matching-service');
        $baseUrl = config('services.ai_route.url');
        $timeout = (int) config('uniwheels.match.ai_timeout', 2);

        try {
            $respuestas = Http::pool(function (Pool $pool) use ($peticiones, $token, $baseUrl, $timeout) {
                foreach ($peticiones as $id => $payload) {
                    $pool->as((string) $id)->withToken($token)->timeout($timeout)
                        ->post("{$baseUrl}/api/v1/optimize/match", $payload);
                }
            });
        } catch (\Throwable $e) {
            Log::warning('ai-route-service (pool) no disponible.', ['exception_class' => get_class($e)]);

            return [];
        }

        $resultados = [];
        foreach ($peticiones as $id => $_) {
            $respuesta = $respuestas[(string) $id] ?? null;
            if ($respuesta instanceof Response && $respuesta->successful()) {
                $resultados[$id] = $respuesta->json();
            }
        }

        return $resultados;
    }

    private function matchPayload(Route $route, array $puntos, float $pickupLat, float $pickupLng): array
    {
        return [
            'driver_route' => [
                'driver_id' => (string) $route->driver_id,
                'driver_name' => 'Conductor',
                'origin' => ['lat' => $puntos['origin'][0], 'lng' => $puntos['origin'][1]],
                'destination' => ['lat' => $puntos['destination'][0], 'lng' => $puntos['destination'][1]],
                'vehicle_capacity' => max(1, (int) $route->available_seats),
                'departure_time' => $route->scheduled_departure_time?->clone()->setTimezone('America/Bogota')->format('h:i A') ?? '06:45 AM',
                'max_allowed_detour_minutes' => (float) ($route->max_detour_minutes ?: 15),
            ],
            'passenger_request' => [
                'passenger_id' => 'candidate',
                'passenger_name' => 'Pasajero',
                'pickup_location' => ['lat' => $pickupLat, 'lng' => $pickupLng],
                'pickup_address' => 'Punto de recogida',
                'destination_location' => ['lat' => $puntos['destination'][0], 'lng' => $puntos['destination'][1]],
                'destination_address' => $route->destination_campus_name,
                'max_walking_distance_meters' => 500.0,
            ],
        ];
    }

    /**
     * Optimización multi-pasajero (ALNS/DARP-TW) del conjunto completo de pasajeros
     * candidatos/confirmados en una ruta. $candidatePassengers usa el shape de
     * PassengerRequestSchema (ver evaluateMatch), uno por pasajero a considerar.
     */
    public function optimizeMultiPassenger(Route $route, array $candidatePassengers): ?array
    {
        $puntos = $this->spatialRepo->getOriginDestinationPoints($route->id);
        if (! $puntos) {
            return null;
        }

        try {
            $respuesta = $this->client()->post('/optimize/multi-passenger-alns', [
                'driver_route' => [
                    'driver_id' => (string) $route->driver_id,
                    'driver_name' => 'Conductor',
                    'origin' => ['lat' => $puntos['origin'][0], 'lng' => $puntos['origin'][1]],
                    'destination' => ['lat' => $puntos['destination'][0], 'lng' => $puntos['destination'][1]],
                    'vehicle_capacity' => max(1, (int) $route->available_seats),
                    'departure_time' => $route->scheduled_departure_time?->clone()->setTimezone('America/Bogota')->format('h:i A') ?? '06:45 AM',
                    'max_allowed_detour_minutes' => (float) ($route->max_detour_minutes ?: 15),
                ],
                'candidate_passengers' => $candidatePassengers,
            ]);

            if ($respuesta->successful()) {
                return $respuesta->json();
            }
        } catch (\Throwable $e) {
            Log::warning('ai-route-service (multi-passenger-alns) no disponible.', [
                'exception_class' => get_class($e),
            ]);
        }

        return null;
    }
}
