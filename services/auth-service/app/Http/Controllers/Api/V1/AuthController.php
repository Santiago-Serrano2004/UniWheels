<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterDriverRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Mail\BienvenidaUsuarioMail;
use App\Mail\CuentaEliminadaMail;
use App\Mail\RecuperacionClaveMail;
use App\Mail\VerificacionCorreoMail;
use App\Models\User;
use App\Models\UserReputationStats;
use App\Services\AccountErasureService;
use App\Services\JwtService;
use App\Services\SmsService;
use App\Services\UserSuspensionService;
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
    public function __construct(private JwtService $jwtService, private SmsService $smsService) {}

    /**
     * Registrar un nuevo estudiante, docente o colaborador en la comunidad universitaria.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $datosValidados = $request->validated();
        $correo = $request->input('email');
        $codigoIngresado = $datosValidados['verification_code'] ?? null;

        // Validar que el código PIN coincida con el almacenado en Cache
        $codigoAlmacenado = Cache::get('email_verification_'.$correo);

        if (! $codigoAlmacenado || $codigoAlmacenado !== $codigoIngresado) {
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación PIN es inválido o ha expirado. Por favor solicita uno nuevo.',
            ], 422);
        }

        // Solo se verifica el correo institucional (prueba pertenencia a la
        // universidad); el celular se guarda sin verificar porque el SMS cuesta
        // dinero por mensaje. phone_verification_code se acepta pero se ignora
        // porque la web (congelada) lo sigue enviando.

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
                'is_driver' => false,
                'is_active' => true,
                'email_verified_at' => now(),
                'phone_verified_at' => now(),
                'verification_expires_at' => now()->addMonths(6), // Ciclo semestral de re-verificacion
            ]);

            // Asignacion de roles. El rol "conductor" solo se otorga vía /driver/register
            // (registerDriver), tras validar vehículo/documentos — nunca autodeclarado aquí.
            $nuevoUsuario->assignRole('estudiante');

            // Inicializacion de estadisticas de reputacion
            UserReputationStats::create(['user_id' => $nuevoUsuario->id]);

            return $nuevoUsuario;
        });

        Cache::forget('email_verification_'.$correo);

        // Enviar correo de bienvenida
        try {
            $codigoActivacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
            Mail::to($usuario->email)->send(new BienvenidaUsuarioMail($usuario, $codigoActivacion));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de bienvenida: '.$e->getMessage());
        }

        $usuario->load(['institution', 'campus', 'reputationStats', 'roles']);
        $tokenAcceso = $this->jwtService->issue($usuario);

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado y verificado exitosamente. Se ha enviado un correo de bienvenida.',
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

        if (! $usuario || ! Hash::check($contrasena, $usuario->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales ingresadas son incorrectas o no corresponden a un usuario activo.'],
            ]);
        }

        app(UserSuspensionService::class)->liftIfExpired($usuario);

        if (! $usuario->is_active && $usuario->suspended_until) {
            return response()->json([
                'success' => false,
                'message' => app(UserSuspensionService::class)->suspensionMessage($usuario),
                'suspended_until' => $usuario->suspended_until->toISOString(),
            ], 403);
        }

        if (! $usuario->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta ha sido suspendida o esta inactiva. Contacta a Bienestar Universitario.',
            ], 403);
        }

        $usuario->load(['institution', 'campus', 'reputationStats', 'roles']);
        $tokenAcceso = $this->jwtService->issue($usuario);

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

        if (! $usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No encontramos una cuenta registrada con este correo institucional.',
            ], 404);
        }

        // Generar codigo de 6 digitos y almacenar por 15 minutos en cache
        $codigoVerificacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('password_reset_'.$correo, $codigoVerificacion, now()->addMinutes(15));

        // Enviar correo electrónico con la plantilla oficial
        try {
            Mail::to($usuario->email)->send(new RecuperacionClaveMail($usuario, $codigoVerificacion));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de recuperación: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Hemos enviado un código de verificación de 6 dígitos a tu correo institucional.',
            'data' => [
                'email' => $correo,
                'debug_code' => (app()->environment('local') && config('app.debug')) ? $codigoVerificacion : null,
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

        $codigoAlmacenado = Cache::get('password_reset_'.$correo);

        if (! $codigoAlmacenado || $codigoAlmacenado !== $codigoIngresado) {
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación es inválido o ha expirado.',
            ], 422);
        }

        $usuario = User::where('email', $correo)->first();
        if (! $usuario) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $usuario->update([
            'password' => Hash::make($nuevaContrasena),
        ]);

        Cache::forget('password_reset_'.$correo);

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
        Cache::put('email_verification_'.$correo, $codigoVerificacion, now()->addMinutes(15));

        // Enviar correo electrónico con el código PIN de verificación
        try {
            Mail::to($correo)->send(new VerificacionCorreoMail($correo, $codigoVerificacion));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de verificación institucional: '.$e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Código de verificación institucional enviado exitosamente a tu correo.',
            'data' => [
                'email' => $correo,
                'debug_code' => (app()->environment('local') && config('app.debug')) ? $codigoVerificacion : null,
            ],
        ]);
    }

    /**
     * Enviar código de verificación SMS previo al registro — canal independiente
     * del código de correo, ambos se validan por separado en /auth/register.
     */
    public function sendSmsCode(Request $request): JsonResponse
    {
        $request->validate([
            'phone_number' => ['required', 'string', 'regex:/^3[0-9]{9}$/'],
        ], [
            'phone_number.regex' => 'Ingresa un celular colombiano válido de 10 dígitos (ej: 3151234567).',
        ]);

        $telefono = $request->input('phone_number');

        $codigoVerificacion = str_pad((string) random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        Cache::put('sms_verification_'.$telefono, $codigoVerificacion, now()->addMinutes(15));

        $this->smsService->send(
            $telefono,
            "UniWheels: tu código de verificación es {$codigoVerificacion}. Vence en 15 minutos."
        );

        return response()->json([
            'success' => true,
            'message' => 'Código de verificación enviado exitosamente por SMS.',
            'data' => [
                'phone_number' => $telefono,
                'debug_code' => (app()->environment('local') && config('app.debug')) ? $codigoVerificacion : null,
            ],
        ]);
    }

    /**
     * Obtener el perfil del usuario autenticado con roles y permisos.
     */
    public function me(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $usuario->load(['institution', 'campus', 'reputationStats', 'roles']);

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

        // El middleware jwt.auth garantiza que $request->user() es un usuario real
        // y autenticado del token — no existe (ni debe existir) ningún fallback aquí.
        $usuario = $request->user();

        $usuario->update([
            'is_driver' => true,
        ]);

        if (! $usuario->hasRole('conductor')) {
            $usuario->assignRole('conductor');
        }

        $usuario->load(['institution', 'campus', 'reputationStats', 'roles']);

        return response()->json([
            'success' => true,
            'message' => 'Solicitud de conductor registrada y verificada exitosamente bajo la Ley 1581.',
            'data' => [
                'user' => new UserResource($usuario),
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
     * Renovar la sesión (sesión deslizante, SIM-021). Acepta un token vigente o vencido hace
     * menos de 7 días con firma válida y fuera de la blocklist: emite uno nuevo con TTL completo
     * y revoca el anterior. Firma inválida o vencido hace más de 7 días -> 401.
     */
    public function refresh(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        $claimsAnteriores = $token ? $this->jwtService->verifyForRefresh($token) : null;
        $usuario = $claimsAnteriores ? User::find($claimsAnteriores->sub) : null;

        if (! $usuario || ! $usuario->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido, expirado o revocado.',
            ], 401);
        }

        $nuevoToken = $this->jwtService->issue($usuario);
        $this->jwtService->revoke($claimsAnteriores);

        return response()->json([
            'success' => true,
            'data' => [
                'access_token' => $nuevoToken,
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Revocar el token de acceso actual (cerrar sesión).
     */
    public function logout(Request $request): JsonResponse
    {
        $claims = $request->attributes->get('jwt_claims');

        if ($claims) {
            $this->jwtService->revoke($claims);
        }

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente. Token revocado.',
        ]);
    }

    /**
     * Eliminar la cuenta del usuario autenticado (Habeas Data Ley 1581) y enviar correo de despedida.
     */
    public function deleteAccount(Request $request, AccountErasureService $erasure): JsonResponse
    {
        $usuario = $request->user();

        if (! $usuario) {
            return response()->json([
                'success' => false,
                'message' => 'No autorizado. Debes iniciar sesión para eliminar tu cuenta.',
            ], 401);
        }

        // Si se provee contraseña para confirmación, verificarla
        if ($request->filled('password') && ! Hash::check($request->input('password'), $usuario->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña ingresada es incorrecta.',
            ], 422);
        }

        // Enviar correo de confirmación de eliminación con mensaje de despedida
        try {
            Mail::to($usuario->email)->send(new CuentaEliminadaMail($usuario));
        } catch (\Throwable $e) {
            Log::error('Error al enviar correo de cuenta eliminada: '.$e->getMessage());
        }

        // Revocar el token de acceso actual
        $claims = $request->attributes->get('jwt_claims');
        if ($claims) {
            $this->jwtService->revoke($claims);
        }

        // Anonimizar los datos personales (aquí y en los demás servicios) y soft-delete.
        $erasure->erase($usuario);

        return response()->json([
            'success' => true,
            'message' => 'Tu cuenta ha sido eliminada exitosamente. Te hemos enviado un correo de confirmación.',
        ]);
    }

    /**
     * Obtener estadísticas de reputación del usuario autenticado.
     */
    public function reputationStats(Request $request): JsonResponse
    {
        $stats = $request->user()->reputationStats;

        if (! $stats) {
            return response()->json([
                'success' => true,
                'data' => [
                    'rating_average_driver' => null,
                    'rating_average_passenger' => null,
                    'total_trips_as_driver' => 0,
                    'total_trips_as_passenger' => 0,
                    'reviews_count' => 0,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'rating_average_driver' => $stats->average_rating_as_driver,
                'rating_average_passenger' => $stats->average_rating_as_passenger,
                'total_trips_as_driver' => $stats->total_trips_as_driver,
                'total_trips_as_passenger' => $stats->total_trips_as_passenger,
                'reviews_count' => $stats->rating_count_as_driver + $stats->rating_count_as_passenger,
            ],
        ]);
    }
}
