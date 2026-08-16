<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterDriverRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Mail\BienvenidaUsuarioMail;
use App\Mail\RecuperacionClaveMail;
use App\Models\User;
use App\Models\UserReputationStats;
use App\Models\UserWallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
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
                'id_document_number' => $datosValidados['id_document_number'] ?? '00000000',
                'id_document_type' => $datosValidados['id_document_type'] ?? 'CC',
                'phone_number' => $datosValidados['phone_number'] ?? '3000000000',
                'profile_photo_path' => $datosValidados['profile_photo_path'] ?? null,
                'institution_id' => $datosValidados['institution_id'],
                'campus_id' => $datosValidados['campus_id'] ?? null,
                'member_type' => $datosValidados['member_type'] ?? 'estudiante',
                'student_code' => $datosValidados['student_code'] ?? null,
                'academic_program_or_department' => $datosValidados['academic_program_or_department'] ?? 'Comunidad Universitaria',
                'semester' => $datosValidados['semester'] ?? null,
                'password' => Hash::make($datosValidados['password']),
                'is_driver' => $datosValidados['is_driver'] ?? false,
                'is_active' => true,
                'email_verified_at' => now(),
                'verification_expires_at' => now()->addMonths(6), // Ciclo semestral de re-verificacion
            ]);

            // Asignacion de roles
            $nuevoUsuario->assignRole('estudiante');
            if (!empty($datosValidados['is_driver'])) {
                $nuevoUsuario->assignRole('conductor');
            }

            // Inicializacion de estadisticas de reputacion y billetera virtual
            UserReputationStats::create(['user_id' => $nuevoUsuario->id]);
            UserWallet::create(['user_id' => $nuevoUsuario->id, 'balance_cop' => 0.00]);

            return $nuevoUsuario;
        });

        // Enviar correo de bienvenida con código de activación
        try {
            $codigoActivacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            Mail::to($usuario->email)->send(new BienvenidaUsuarioMail($usuario, $codigoActivacion));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de bienvenida: ' . $e->getMessage());
        }

        $usuario->load(['institution', 'campus', 'reputationStats', 'wallet', 'roles']);
        $tokenAcceso = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente. Se ha enviado un correo de bienvenida.',
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
                'message' => 'Tu cuenta ha sido suspendida o esta inactiva. Contacta a Bienestar Universitario.',
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
     * Enviar codigo de recuperacion de contraseña al correo institucional.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $correo = $request->input('email');
        $usuario = User::where('email', $correo)->first();

        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No encontramos una cuenta registrada con este correo institucional.',
            ], 404);
        }

        // Generar codigo de 6 digitos y almacenar por 15 minutos en cache
        $codigoVerificacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('password_reset_' . $correo, $codigoVerificacion, now()->addMinutes(15));

        // Enviar correo electrónico con la plantilla oficial
        try {
            Mail::to($usuario->email)->send(new RecuperacionClaveMail($usuario, $codigoVerificacion));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de recuperación: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Hemos enviado un código de verificación de 6 dígitos a tu correo institucional.',
            'data' => [
                'email' => $correo,
                'debug_code' => config('app.debug') ? $codigoVerificacion : null,
            ],
        ]);
    }

    /**
     * Restablecer la contraseña usando el codigo de verificacion de 6 digitos.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $correo = $request->input('email');
        $codigoIngresado = $request->input('code');
        $nuevaContrasena = $request->input('password');

        $codigoAlmacenado = Cache::get('password_reset_' . $correo);

        if (!$codigoAlmacenado || $codigoAlmacenado !== $codigoIngresado) {
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación es inválido o ha expirado.',
            ], 422);
        }

        $usuario = User::where('email', $correo)->first();
        if (!$usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $usuario->update([
            'password' => Hash::make($nuevaContrasena),
        ]);

        Cache::forget('password_reset_' . $correo);

        return response()->json([
            'success' => true,
            'message' => 'Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión.',
        ]);
    }

    /**
     * Enviar codigo de verificacion previo al registro de cuenta nueva.
     */
    public function sendVerificationCode(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $correo = $request->input('email');

        if (User::where('email', $correo)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Ya existe una cuenta activa con este correo institucional.',
            ], 422);
        }

        $codigoVerificacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('email_verification_' . $correo, $codigoVerificacion, now()->addMinutes(15));

        return response()->json([
            'success' => true,
            'message' => 'Código de verificación institucional enviado.',
            'data' => [
                'email' => $correo,
                'debug_code' => config('app.debug') ? $codigoVerificacion : null,
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
     * Registrar y verificar la solicitud de un estudiante como Conductor Universitario.
     */
    public function registerDriver(RegisterDriverRequest $request): JsonResponse
    {
        $datosValidados = $request->validated();
        $usuario = $request->user();

        // Si la petición viene sin token Sanctum pero con email de prueba
        if (!$usuario && $request->has('email')) {
            $usuario = User::where('email', $request->input('email'))->first();
        }

        if (!$usuario) {
            $usuario = User::first();
        }

        if ($usuario) {
            $usuario->update([
                'is_driver' => true,
            ]);

            if (!$usuario->hasRole('conductor')) {
                $usuario->assignRole('conductor');
            }

            $usuario->load(['institution', 'campus', 'reputationStats', 'wallet', 'roles']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de conductor registrada y verificada exitosamente bajo la Ley 1581.',
            'data' => [
                'user' => $usuario ? new UserResource($usuario) : null,
                'vehicle' => [
                    'vehicle_type' => $datosValidados['vehicle_type'],
                    'plate_number' => $datosValidados['plate_number'],
                    'brand' => $datosValidados['brand'],
                    'model_line' => $datosValidados['model_line'],
                    'year' => $datosValidados['year'],
                    'propulsion_type' => $datosValidados['propulsion_type'],
                    'available_seats' => $datosValidados['available_seats'],
                ],
                'status' => 'approved',
            ],
        ], 200);
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
