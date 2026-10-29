<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PersonalDataController extends Controller
{
    /**
     * Eliminación de datos personales de un usuario (Habeas Data, Ley 1581), pedida por
     * auth-service al borrar la cuenta. Borra archivos de documentos y fotos, elimina los
     * registros de documentos (número de documento) y da de baja los vehículos (soft delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $documentos = VehicleDocument::where('user_id', $id)->get();
        $vehiculos = Vehicle::where('user_id', $id)->get();
        $fotos = $vehiculos->pluck('perspective_photo_path')->filter();

        DB::transaction(function () use ($id, $documentos, $vehiculos) {
            VehicleDocument::where('user_id', $id)->delete();

            foreach ($vehiculos as $vehiculo) {
                // La placa es única; se libera para que otro usuario pueda registrarla.
                $vehiculo->forceFill([
                    'plate_number' => 'DEL'.Str::upper(Str::random(8)),
                    'perspective_photo_path' => null,
                    'rejection_reason' => null,
                    'status' => 'inactivo',
                ])->save();
                $vehiculo->delete();
            }
        });

        foreach ($documentos as $documento) {
            Storage::disk('private')->delete($documento->file_path);
        }
        foreach ($fotos as $foto) {
            Storage::disk('public')->delete($foto);
        }

        return response()->json(['success' => true]);
    }
}
