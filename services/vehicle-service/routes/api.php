<?php

use App\Http\Controllers\Api\V1\VehicleCatalogController;
use App\Http\Controllers\Api\V1\VehicleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — UniWheels Vehicle & Document Verification Service
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Catálogo de Marcas y Modelos (Híbrido NHTSA API + Local)
    Route::get('/vehicles/catalog/brands', [VehicleCatalogController::class, 'brands']);
    Route::get('/vehicles/catalog/models', [VehicleCatalogController::class, 'models']);

    // Gestión de Vehículos
    Route::get('/vehicles/check-approved', [VehicleController::class, 'checkApprovedVehicle']);
    Route::get('/vehicles/{id}/status', [VehicleController::class, 'updateStatusByToken']);
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::get('/vehicles/{id}', [VehicleController::class, 'show']);

    // Documentación y Verificación Legal
    Route::post('/vehicles/{id}/documents', [VehicleController::class, 'uploadDocument']);
    Route::get('/vehicles/{vehicleId}/documents/{documentId}/download', [VehicleController::class, 'downloadDocument'])
        ->name('vehicles.documents.download');
    Route::patch('/vehicles/{vehicleId}/documents/{documentId}/verify', [VehicleController::class, 'verifyDocument']);
});
