<?php

namespace App\Services;

use App\Models\VehicleCatalogBrand;
use App\Models\VehicleCatalogModel;
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

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($tipoNhtsa, $vehicleType) {
            // 1. Obtener marcas locales registradas en base de datos
            $marcasLocales = VehicleCatalogBrand::where('vehicle_type', $vehicleType)
                ->where('is_active', true)
                ->pluck('name')
                ->toArray();

            // 2. Consultar API de NHTSA
            $marcasApi = [];
            try {
                $respuesta = Http::timeout(4)->get("{$this->baseUrl}/GetMakesForVehicleType/{$tipoNhtsa}?format=json");
                if ($respuesta->successful()) {
                    $resultados = $respuesta->json('Results', []);
                    $marcasApi = collect($resultados)
                        ->pluck('MakeName')
                        ->filter()
                        ->unique()
                        ->take(100)
                        ->toArray();
                }
            } catch (\Throwable $e) {
                // Si la red externa falla, mantener la lista local sin interrumpir al usuario
            }

            $todasLasMarcas = array_unique(array_merge($marcasLocales, $marcasApi));
            sort($todasLasMarcas, SORT_NATURAL | SORT_FLAG_CASE);

            return array_values($todasLasMarcas);
        });
    }

    /**
     * Obtener los modelos o líneas comerciales para una marca dada.
     */
    public function getModelsForBrand(string $brandName): array
    {
        $nombreLimpio = trim($brandName);
        $cacheKey = 'vehicle_models_' . strtolower(str_replace(' ', '_', $nombreLimpio));

        return Cache::remember($cacheKey, now()->addDays(30), function () use ($nombreLimpio) {
            // 1. Modelos locales en base de datos
            $marcaLocal = VehicleCatalogBrand::whereRaw('LOWER(name) = ?', [strtolower($nombreLimpio)])->first();
            $modelosLocales = [];
            if ($marcaLocal) {
                $modelosLocales = $marcaLocal->models()->where('is_active', true)->pluck('line_name')->toArray();
            }

            // 2. Modelos desde la API de NHTSA
            $modelosApi = [];
            try {
                $marcaEncoded = urlencode($nombreLimpio);
                $respuesta = Http::timeout(4)->get("{$this->baseUrl}/GetModelsForMake/{$marcaEncoded}?format=json");
                if ($respuesta->successful()) {
                    $resultados = $respuesta->json('Results', []);
                    $modelosApi = collect($resultados)
                        ->pluck('Model_Name')
                        ->filter()
                        ->unique()
                        ->toArray();
                }
            } catch (\Throwable $e) {
                // Respaldo silencioso con base de datos local
            }

            $todosLosModelos = array_unique(array_merge($modelosLocales, $modelosApi));
            sort($todosLosModelos, SORT_NATURAL | SORT_FLAG_CASE);

            return array_values($todosLosModelos);
        });
    }
}
