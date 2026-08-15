<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Models\UserReputationStats;
use App\Models\UserWallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo estudiante, docente o colaborador en la comunidad universitaria.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $datosValidados = $request->validated();

        $usuario = DB::transaction(function () use ($datosValidados, $request) {
            $nuevoUsuario = User::create([
                'name' => $datosValidados['name'],
                'email' => $request->input('email'),
                'id_document_number' => $datosValidados['id_document_number'],
                'id_document_type' => $datosValidados['id_document_type'],
                'phone_number' => $datosValidados['phone_number'],
                'institution_id' => $datosValidados['institution_id'],
                'campus_id' => $datosValidados['campus_id'] ?? null,
                'member_type' => $datosValidados['member_type'],
                'student_code' => $datosValidados['student_code'] ?? null,
                'academic_program_or_department' => $datosValidados['academic_program_or_department'],
                'semester' => $datosValidados['semester'] ?? null,
                'password' => Hash::make($datosValidados['password']),
                'is_driver' => $datosValidados['is_driver'] ?? false,
                'is_active' => true,
                'email_verified_at' => now(),
                'verification_expires_at' => now()->addMonths(6), // Ciclo semestral de re-verificación institucional
            ]);

            // Asignación de roles
            $nuevoUsuario->assignRole('estudiante');
            if (!empty($datosValidados['is_driver'])) {
                $nuevoUsuario->assignRole('conductor');
            }

            // Inicialización de estadísticas de reputación y billetera virtual
            UserReputationStats::create(['user_id' => $nuevoUsuario->id]);
            UserWallet::create(['user_id' => $nuevoUsuario->id, 'balance_cop' => 0.00]);

            return $nuevoUsuario;
        });

        $usuario->load(['institution', 'campus', 'reputationStats', 'wallet', 'roles']);
        $tokenAcceso = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente en la comunidad UniWheels.',
            'data' => [
                'user' => new UserResource($usuario),
                'access_token' => $tokenAcceso,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Autenticar un usuario existente y emitir un token Bearer.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $correo = $request->input('email');
        $contrasena = $request->input('password');

        $usuario = User::where('email', $correo)->first();

        if (!$usuario || !Hash::check($contrasena, $usuario->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales ingresadas son incorrectas o no corresponden a un usuario activo.'],
            ]);
        }

        if (!$usuario->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta ha sido suspendida o está inactiva. Contacta a Bienestar Universitario.',
            ], 403);
        }

        $usuario->load(['institution', 'campus', 'reputationStats', 'wallet', 'roles']);
        $tokenAcceso = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'data' => [
                'user' => new UserResource($usuario),
                'access_token' => $tokenAcceso,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Obtener el perfil del usuario autenticado con roles y permisos.
     */
    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $usuario->load(['institution', 'campus', 'reputationStats', 'wallet', 'roles']);

        return response()->json([
            'success' => true,
            'data' => new UserResource($usuario),
        ]);
    }

    /**
     * Revocar el token de acceso actual (cerrar sesión).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente. Token revocado.',
        ]);
    }
}
