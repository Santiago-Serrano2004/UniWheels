<?php

namespace App\Services;

use App\Models\VehicleCatalogBrand;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class NhtsaVehicleApiService
{
    protected string $baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';

    /**
     * Obtener el listado de marcas para un tipo de vehículo (carro o moto).
     */
    public function getBrands(string $vehicleType = 'carro'): array
    {
        $tipoNhtsa = $vehicleType === 'moto' ? 'motorcycle' : 'car';
        $cacheKey = "vehicle_brands_{$vehicleType}";

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // 1. Obtener marcas locales registradas en base de datos
        $marcasLocales = VehicleCatalogBrand::where('vehicle_type', $vehicleType)
            ->where('is_active', true)
            ->pluck('name')
            ->toArray();

        // 2. Consultar API de NHTSA
        $marcasApi = [];
        $nhtsaExitoso = false;
        try {
            $respuesta = Http::timeout(4)->get("{$this->baseUrl}/GetMakesForVehicleType/{$tipoNhtsa}?format=json");
            if ($respuesta->successful()) {
                $resultados = $respuesta->json('Results', []);
                $marcasApi = collect($resultados)
                    ->pluck('MakeName')
                    ->filter()
                    ->map(fn ($m) => trim((string) $m))
                    ->filter(fn ($m) => $m !== '')
                    ->values()
                    ->toArray();
                $nhtsaExitoso = true;
            }
        } catch (\Throwable $e) {
            // Si la red externa falla, mantener la lista local sin interrumpir al usuario
        }

        if ($nhtsaExitoso && count($marcasApi) > 0) {
            $resultado = $this->unifyLists($marcasLocales, $marcasApi);
            Cache::put($cacheKey, $resultado, now()->addDays(30));

            return $resultado;
        }

        $resultado = $this->unifyLists($marcasLocales, []);
        Cache::put($cacheKey, $resultado, now()->addMinutes(10));

        return $resultado;
    }

    /**
     * Obtener los modelos o líneas comerciales para una marca dada.
     */
    public function getModelsForBrand(string $brandName): array
    {
        $nombreLimpio = trim($brandName);
        $cacheKey = 'vehicle_models_'.strtolower(str_replace(' ', '_', $nombreLimpio));

        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        // 1. Modelos locales en base de datos
        $marcaLocal = VehicleCatalogBrand::whereRaw('LOWER(name) = ?', [strtolower($nombreLimpio)])->first();
        $modelosLocales = [];
        if ($marcaLocal) {
            $modelosLocales = $marcaLocal->models()->where('is_active', true)->pluck('line_name')->toArray();
        }

        // 2. Modelos desde la API de NHTSA
        $modelosApi = [];
        $nhtsaExitoso = false;
        try {
            $marcaEncoded = urlencode($nombreLimpio);
            $respuesta = Http::timeout(4)->get("{$this->baseUrl}/GetModelsForMake/{$marcaEncoded}?format=json");
            if ($respuesta->successful()) {
                $resultados = $respuesta->json('Results', []);
                $modelosApi = collect($resultados)
                    ->pluck('Model_Name')
                    ->filter()
                    ->map(fn ($m) => trim((string) $m))
                    ->filter(fn ($m) => $m !== '')
                    ->values()
                    ->toArray();
                $nhtsaExitoso = true;
            }
        } catch (\Throwable $e) {
            // Respaldo silencioso con base de datos local
        }

        if ($nhtsaExitoso && count($modelosApi) > 0) {
            $resultado = $this->unifyLists($modelosLocales, $modelosApi);
            Cache::put($cacheKey, $resultado, now()->addDays(30));

            return $resultado;
        }

        $resultado = $this->unifyLists($modelosLocales, []);
        Cache::put($cacheKey, $resultado, now()->addMinutes(10));

        return $resultado;
    }

    /**
     * Unifica listas local y externa: prioridad a la local, deduplicación insensible a mayúsculas y orden natural.
     *
     * @param  array<int, string>  $locales
     * @param  array<int, string>  $api
     * @return array<int, string>
     */
    protected function unifyLists(array $locales, array $api): array
    {
        $map = [];

        foreach ($api as $item) {
            $trimmed = trim((string) $item);
            if ($trimmed !== '') {
                $key = mb_strtolower($trimmed, 'UTF-8');
                $map[$key] = $trimmed;
            }
        }

        foreach ($locales as $item) {
            $trimmed = trim((string) $item);
            if ($trimmed !== '') {
                $key = mb_strtolower($trimmed, 'UTF-8');
                $map[$key] = $trimmed;
            }
        }

        $result = array_values($map);
        sort($result, SORT_NATURAL | SORT_FLAG_CASE);

        return $result;
    }
}
