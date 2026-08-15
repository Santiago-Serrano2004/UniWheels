<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\NhtsaVehicleApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleCatalogController extends Controller
{
    /**
     * Listar marcas estandarizadas de carros o motocicletas consumiendo la API de NHTSA y catálogo local.
     */
    public function brands(Request $request, NhtsaVehicleApiService $nhtsaService): JsonResponse
    {
        $tipoVehiculo = $request->query('type', 'carro');
        if (!in_array($tipoVehiculo, ['carro', 'moto'])) {
            $tipoVehiculo = 'carro';
        }

        $marcas = $nhtsaService->getBrands($tipoVehiculo);

        return response()->json([
            'success' => true,
            'data' => $marcas,
        ]);
    }

    /**
     * Listar modelos o líneas comerciales para una marca seleccionada.
     */
    public function models(Request $request, NhtsaVehicleApiService $nhtsaService): JsonResponse
    {
        $marca = $request->query('brand');
        if (empty($marca)) {
            return response()->json([
                'success' => false,
                'message' => 'Debes indicar el parámetro brand para consultar sus modelos.',
            ], 400);
        }

        $modelos = $nhtsaService->getModelsForBrand($marca);

        return response()->json([
            'success' => true,
            'data' => $modelos,
        ]);
    }
}
