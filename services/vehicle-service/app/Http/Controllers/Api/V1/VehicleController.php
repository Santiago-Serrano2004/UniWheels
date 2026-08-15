<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterVehicleRequest;
use App\Http\Requests\UploadDocumentRequest;
use App\Http\Resources\VehicleDocumentResource;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Services\HabeasDataAuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class VehicleController extends Controller
{
    /**
     * Listar vehículos registrados (opcionalmente filtrados por user_id).
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->query('user_id');

        $consulta = Vehicle::with('documents');
        if ($userId) {
            $consulta->where('user_id', $userId);
        }

        $vehiculos = $consulta->latest()->get();

        return response()->json([
            'success' => true,
            'data' => VehicleResource::collection($vehiculos),
        ]);
    }

    /**
     * Registrar un nuevo vehículo (carro o moto) para un conductor.
     */
    public function store(RegisterVehicleRequest $request): JsonResponse
    {
        $datosValidados = $request->validated();
        $userId = $request->input('user_id'); // Pasado por el Gateway o auth header

        $fotoRuta = null;
        if ($request->hasFile('perspective_photo')) {
            $fotoRuta = $request->file('perspective_photo')->store('vehicles/photos', 'public');
        }

        $vehiculo = Vehicle::create([
            'user_id' => $userId,
            'vehicle_type' => $datosValidados['vehicle_type'],
            'plate_number' => $datosValidados['plate_number'],
            'brand' => $datosValidados['brand'],
            'model_line' => $datosValidados['model_line'],
            'year' => $datosValidados['year'],
            'color' => $datosValidados['color'],
            'available_seats' => $datosValidados['available_seats'],
            'has_ac' => $datosValidados['has_ac'] ?? false,
            'has_trunk' => $datosValidados['has_trunk'] ?? true,
            'has_extra_helmet' => $datosValidados['has_extra_helmet'] ?? false,
            'perspective_photo_path' => $fotoRuta,
            'status' => 'pendiente_revision',
        ]);

        $vehiculo->load('documents');

        return response()->json([
            'success' => true,
            'message' => 'Vehículo registrado exitosamente. Por favor adjunta los documentos requeridos para su validación.',
            'data' => new VehicleResource($vehiculo),
        ], 201);
    }

    /**
     * Consultar el detalle de un vehículo específico.
     */
    public function show(string $id): JsonResponse
    {
        $vehiculo = Vehicle::with('documents')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => new VehicleResource($vehiculo),
        ]);
    }

    /**
     * Subir y asociar un documento legal en disco privado (SOAT, Licencia, Tarjeta, RTM).
     */
    public function uploadDocument(UploadDocumentRequest $request, string $id): JsonResponse
    {
        $vehiculo = Vehicle::findOrFail($id);
        $datosValidados = $request->validated();

        $archivo = $request->file('document_file');
        $nombreArchivo = $datosValidados['document_type'] . '_' . time() . '.' . $archivo->getClientOriginalExtension();
        $rutaPrivada = $archivo->storeAs("documents/{$vehiculo->id}", $nombreArchivo, 'private');

        $documento = VehicleDocument::updateOrCreate(
            [
                'vehicle_id' => $vehiculo->id,
                'document_type' => $datosValidados['document_type'],
            ],
            [
                'user_id' => $vehiculo->user_id,
                'document_number' => $datosValidados['document_number'] ?? null,
                'issuer_entity' => $datosValidados['issuer_entity'] ?? null,
                'file_path' => $rutaPrivada,
                'issued_at' => $datosValidados['issued_at'] ?? null,
                'expires_at' => $datosValidados['expires_at'] ?? null,
                'is_verified' => false,
                'verified_at' => null,
                'verified_by_user_id' => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Documento {$datosValidados['document_type']} subido exitosamente en almacenamiento privado seguro.",
            'data' => new VehicleDocumentResource($documento),
        ], 201);
    }

    /**
     * Descargar documento privado verificando la firma de la URL y auditando el acceso (Habeas Data).
     */
    public function downloadDocument(
        Request $request,
        string $vehicleId,
        string $documentId,
        HabeasDataAuditService $auditService
    ): BinaryFileResponse|JsonResponse {
        if (!$request->hasValidSignature()) {
            return response()->json([
                'success' => false,
                'message' => 'El enlace de descarga es inválido o ha expirado (límite de 10 minutos).',
            ], 403);
        }

        $documento = VehicleDocument::where('vehicle_id', $vehicleId)->findOrFail($documentId);

        if (!Storage::disk('private')->exists($documento->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'El archivo solicitado no existe en el almacenamiento seguro.',
            ], 404);
        }

        // Registro de auditoría obligatorio (Ley 1581 de 2012)
        $auditorId = $request->query('auditor_id', $documento->user_id);
        $auditService->logAccess(
            $auditorId,
            $documento->user_id,
            $documento,
            $request->query('purpose', 'consulta_seguridad'),
            $request->ip(),
            $request->userAgent() ?? 'N/A'
        );

        $rutaAbsoluta = Storage::disk('private')->path($documento->file_path);

        return response()->download($rutaAbsoluta);
    }

    /**
     * Validar y aprobar o rechazar un documento por parte de Bienestar Universitario.
     */
    public function verifyDocument(Request $request, string $vehicleId, string $documentId): JsonResponse
    {
        $request->validate([
            'is_verified' => ['required', 'boolean'],
            'verified_by_user_id' => ['required', 'uuid'],
            'rejection_notes' => ['nullable', 'string', 'max:500'],
        ]);

        $documento = VehicleDocument::where('vehicle_id', $vehicleId)->findOrFail($documentId);
        $vehiculo = $documento->vehicle;

        $documento->update([
            'is_verified' => $request->boolean('is_verified'),
            'verified_at' => $request->boolean('is_verified') ? now() : null,
            'verified_by_user_id' => $request->input('verified_by_user_id'),
            'rejection_notes' => $request->input('rejection_notes'),
        ]);

        // Si el vehículo cumple con todos los documentos requeridos, actualizar su estado a aprobado
        if ($vehiculo->isFullyCompliant()) {
            $vehiculo->update(['status' => 'aprobado', 'rejection_reason' => null]);
        } elseif (!$request->boolean('is_verified')) {
            $vehiculo->update([
                'status' => 'rechazado',
                'rejection_reason' => $request->input('rejection_notes', 'Documento rechazado en verificación.'),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Estado del documento actualizado exitosamente.',
            'data' => [
                'document' => new VehicleDocumentResource($documento),
                'vehicle_status' => $vehiculo->fresh()->status,
            ],
        ]);
    }
}
