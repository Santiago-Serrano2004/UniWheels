<?php

use App\Http\Controllers\Api\V1\Admin\AdminVehicleController;
use App\Http\Controllers\Api\V1\VehicleCatalogController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Vehicle & Document Verification Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Catálogo de Marcas y Modelos (Híbrido NHTSA API + Local) — referencia pública de solo lectura.
    Route::get('/vehicles/catalog/brands', [VehicleCatalogController::class, 'brands']);
    Route::get('/vehicles/catalog/models', [VehicleCatalogController::class, 'models']);

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/vehicles/check-approved', [VehicleController::class, 'checkApprovedVehicle']);
        Route::get('/vehicles', [VehicleController::class, 'index']);
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::get('/vehicles/{id}', [VehicleController::class, 'show'])->whereUuid('id');
        Route::get('/vehicles/{id}/public-summary', [VehicleController::class, 'publicSummary'])->whereUuid('id');

        // Documentación y Verificación Legal
        Route::post('/vehicles/{id}/documents', [VehicleController::class, 'uploadDocument'])->whereUuid('id');
        Route::get('/vehicles/{vehicleId}/documents/{documentId}/download', [VehicleController::class, 'downloadDocument'])->whereUuid(['vehicleId', 'documentId'])
            ->name('vehicles.documents.download');
        Route::patch('/vehicles/{vehicleId}/documents/{documentId}/verify', [VehicleController::class, 'verifyDocument'])->whereUuid(['vehicleId', 'documentId']);
    });

    // Rutas de administración
    Route::prefix('admin')->middleware(['jwt.auth', 'admin'])->group(function () {
        Route::get('/vehicles', [AdminVehicleController::class, 'index']);
        Route::get('/vehicles/{id}', [AdminVehicleController::class, 'show'])->whereUuid('id');
    });
});
