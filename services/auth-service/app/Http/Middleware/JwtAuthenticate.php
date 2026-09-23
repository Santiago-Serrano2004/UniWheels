<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function __construct(private JwtService $jwtService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado. Se requiere un token Bearer válido.',
            ], 401);
        }

        $claims = $this->jwtService->verify(substr($header, 7));

        if (! $claims) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido, expirado o revocado.',
            ], 401);
        }

        $userId = (string) $claims->sub;

        try {
            if (Redis::exists("uniwheels:suspended_user:{$userId}")) {
                return response()->json([
                    'message' => 'Tu cuenta está suspendida.',
                ], 403);
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo verificar el estado de suspensión en Redis: '.$e->getMessage(), [
                'user_id' => $userId,
            ]);
        }

        $usuario = User::find($userId);

        if (! $usuario || ! $usuario->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'La cuenta asociada a este token no existe o está inactiva.',
            ], 401);
        }

        $request->setUserResolver(fn () => $usuario);
        $request->attributes->set('user_id', (string) $usuario->id);
        $request->attributes->set('user_roles', $claims->roles ?? []);
        $request->attributes->set('jwt_claims', $claims);

        return $next($request);
    }
}
