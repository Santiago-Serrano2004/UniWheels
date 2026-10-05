<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterVehicleRequest;
use App\Http\Requests\UploadDocumentRequest;
use App\Http\Requests\VerifyDocumentRequest;
use App\Http\Resources\VehicleDocumentResource;
use App\Http\Resources\VehicleResource;
use App\Mail\SolicitudVehiculoAdminMail;
use App\Models\Vehicle;
use App\Models\VehicleDocument;
use App\Services\HabeasDataAuditService;
use App\Services\VehicleDocumentVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class VehicleController extends Controller
{
    public function __construct(
        private readonly VehicleDocumentVerificationService $verificationService
    ) {}

    /**
     * Listar vehículos registrados (opcionalmente filtrados por user_id).
     */
    public function index(Request $request): JsonResponse
    {
        $esAdmin = in_array('administrador', $request->attributes->get('user_roles', []), true);
        // Un usuario no-admin solo puede listar sus propios vehículos, sin importar
        // qué user_id venga en la query string.
        $userId = $esAdmin ? $request->query('user_id') : $request->attributes->get('user_id');

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
     * Verificar si el usuario autenticado tiene un vehículo aprobado y con documentos al día.
     */
    public function checkApprovedVehicle(Request $request): JsonResponse
    {
        $userId = $request->attributes->get('user_id');

        $vehiculo = Vehicle::with('documents')
            ->where('user_id', $userId)
            ->where('status', 'aprobado')
            ->first();

        if (! $vehiculo) {
            return response()->json([
                'success' => true,
                'has_approved_vehicle' => false,
                'vehicle' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'has_approved_vehicle' => true,
            'vehicle' => new VehicleResource($vehiculo),
        ]);
    }

    /**
     * Registrar un nuevo vehículo asociado al usuario autenticado.
     */
    public function store(RegisterVehicleRequest $request): JsonResponse
    {
        $datosValidados = $request->validated();
        // El user_id NUNCA se toma del body (previene secuestro de vehículos entre cuentas).
        $userId = $request->attributes->get('user_id');

        // Si la placa ya pertenece a otro usuario, no se permite "secuestrarla" reasignándola.
        $existente = Vehicle::where('plate_number', $datosValidados['plate_number'])->first();
        if ($existente && (string) $existente->user_id !== (string) $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Esta placa ya se encuentra registrada por otro usuario.',
            ], 409);
        }

        $fotoRuta = null;
        if ($request->hasFile('perspective_photo')) {
            $fotoRuta = $request->file('perspective_photo')->store('vehicles/photos', 'public');
        }

        $vehiculo = Vehicle::updateOrCreate(
            ['plate_number' => $datosValidados['plate_number'], 'user_id' => $userId],
            [
                'vehicle_type' => $datosValidados['vehicle_type'],
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
            ]
        );

        $vehiculo->load('documents');

        $datosDocumentos = [
            'soat_number' => $request->input('soat_number'),
            'soat_expires_at' => $request->input('soat_expires_at'),
            'soat_photo' => $request->input('soat_photo'),
            'rtm_number' => $request->input('rtm_number'),
            'rtm_expires_at' => $request->input('rtm_expires_at'),
            'rtm_photo' => $request->input('rtm_photo'),
            'driver_license_number' => $request->input('driver_license_number'),
            'driver_license_category' => $request->input('driver_license_category'),
            'driver_license_expires_at' => $request->input('driver_license_expires_at'),
            'driver_license_photo' => $request->input('driver_license_photo'),
        ];

        // Notificar al administrador sobre la nueva solicitud de vehículo con enlace al panel
        try {
            $adminEmail = env('ADMIN_EMAIL', 'uniwheelscontact@gmail.com');

            Mail::to($adminEmail)->send(new SolicitudVehiculoAdminMail($vehiculo, $datosDocumentos));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo admin de solicitud vehicular: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Vehículo registrado exitosamente. Se ha enviado la solicitud de validación al equipo de UniWheels.',
            'data' => new VehicleResource($vehiculo),
        ], 201);
    }

    /**
     * Consultar el detalle de un vehículo específico.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $vehiculo = Vehicle::with('documents')->findOrFail($id);

        $esAdmin = in_array('administrador', $request->attributes->get('user_roles', []), true);
        if (! $esAdmin && (string) $vehiculo->user_id !== (string) $request->attributes->get('user_id')) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para consultar este vehículo.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => new VehicleResource($vehiculo),
        ]);
    }

    /**
     * Resumen público mínimo de un vehículo (placa, marca, modelo, color) para que
     * route-matching-service enriquezca los resultados de búsqueda del pasajero.
     */
    public function publicSummary(Request $request, string $id): JsonResponse
    {
        $vehiculo = Vehicle::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $vehiculo->id,
                'owner_id' => $vehiculo->user_id,
                'vehicle_type' => $vehiculo->vehicle_type,
                'plate_number' => $vehiculo->plate_number,
                'brand' => $vehiculo->brand,
                'model_line' => $vehiculo->model_line,
                'year' => $vehiculo->year,
                'color' => $vehiculo->color,
                'available_seats' => $vehiculo->available_seats,
                'features' => [
                    'has_ac' => (bool) $vehiculo->has_ac,
                    'has_trunk' => (bool) $vehiculo->has_trunk,
                    'has_extra_helmet' => (bool) $vehiculo->has_extra_helmet,
                ],
                'perspective_photo_url' => $vehiculo->perspective_photo_path ? asset('storage/'.$vehiculo->perspective_photo_path) : null,
                'status' => $vehiculo->status,
            ],
        ]);
    }

    /**
     * Subir y asociar un documento legal en disco privado (SOAT, Licencia, Tarjeta, RTM).
     */
    public function uploadDocument(UploadDocumentRequest $request, string $id): JsonResponse
    {
        $vehiculo = Vehicle::findOrFail($id);

        if ((string) $vehiculo->user_id !== (string) $request->attributes->get('user_id')) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para subir documentos a este vehículo.',
            ], 403);
        }

        $datosValidados = $request->validated();

        $archivo = $request->file('document_file');
        $nombreArchivo = $datosValidados['document_type'].'_'.time().'.'.$archivo->getClientOriginalExtension();
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
    ): StreamedResponse|JsonResponse {
        if (! $request->hasValidSignature()) {
            return response()->json([
                'success' => false,
                'message' => 'El enlace de descarga es inválido o ha expirado (límite de 10 minutos).',
            ], 403);
        }

        $documento = VehicleDocument::where('vehicle_id', $vehicleId)->findOrFail($documentId);

        $esAdmin = in_array('administrador', $request->attributes->get('user_roles', []), true);
        if (! $esAdmin && (string) $documento->user_id !== (string) $request->attributes->get('user_id')) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado para descargar este documento.',
            ], 403);
        }

        if (! Storage::disk('private')->exists($documento->file_path)) {
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

        return Storage::disk('private')->download($documento->file_path, basename($documento->file_path));
    }

    /**
     * Validar y aprobar o rechazar un documento por parte de Bienestar Universitario.
     */
    public function verifyDocument(VerifyDocumentRequest $request, string $vehicleId, string $documentId): JsonResponse
    {
        if (! in_array('administrador', $request->attributes->get('user_roles', []), true)) {
            return response()->json([
                'success' => false,
                'message' => 'Solo un administrador de Bienestar Universitario puede verificar documentos.',
            ], 403);
        }

        $documento = VehicleDocument::where('vehicle_id', $vehicleId)->findOrFail($documentId);
        $adminUserId = (string) $request->attributes->get('user_id');

        $documentoActualizado = $this->verificationService->verifyDocument(
            $documento,
            $request->boolean('is_verified'),
            $request->input('rejection_notes'),
            $adminUserId
        );

        $vehiculo = $documentoActualizado->vehicle->fresh();

        return response()->json([
            'success' => true,
            'message' => 'Estado del documento actualizado exitosamente.',
            'data' => [
                'document' => new VehicleDocumentResource($documentoActualizado),
                'vehicle_status' => $vehiculo->status,
            ],
        ]);
    }
}
