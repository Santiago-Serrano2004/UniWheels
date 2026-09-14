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
    // Catálogo de Marcas y Modelos (Híbrido NHTSA API + Local) — referencia pública de solo lectura.
    Route::get('/vehicles/catalog/brands', [VehicleCatalogController::class, 'brands']);
    Route::get('/vehicles/catalog/models', [VehicleCatalogController::class, 'models']);

    // Enlace de aprobación/rechazo por correo (HMAC firmado, sin sesión de usuario —
    // el administrador lo abre directo desde su bandeja de entrada).
    Route::get('/vehicles/{id}/status', [VehicleController::class, 'updateStatusByToken']);

    Route::middleware('jwt.auth')->group(function () {
        Route::get('/vehicles/check-approved', [VehicleController::class, 'checkApprovedVehicle']);
        Route::get('/vehicles', [VehicleController::class, 'index']);
        Route::post('/vehicles', [VehicleController::class, 'store']);
        Route::get('/vehicles/{id}', [VehicleController::class, 'show']);
        Route::get('/vehicles/{id}/public-summary', [VehicleController::class, 'publicSummary']);

        // Documentación y Verificación Legal
        Route::post('/vehicles/{id}/documents', [VehicleController::class, 'uploadDocument']);
        Route::get('/vehicles/{vehicleId}/documents/{documentId}/download', [VehicleController::class, 'downloadDocument'])
            ->name('vehicles.documents.download');
        Route::patch('/vehicles/{vehicleId}/documents/{documentId}/verify', [VehicleController::class, 'verifyDocument']);
    });
});
