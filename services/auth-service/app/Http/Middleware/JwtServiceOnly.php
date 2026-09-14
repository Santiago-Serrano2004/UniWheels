<?php

namespace App\Http\Middleware;

use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe un endpoint a llamadas servicio-a-servicio: exige un JWT válido con
 * claim type=service (emitido por otro microservicio del backend, nunca por un
 * usuario final). El jwt.auth normal de auth-service rechaza tokens de servicio
 * porque busca un User real con el `sub` del token — este middleware evita eso
 * para las rutas de enriquecimiento cross-service (ej. perfil público del conductor).
 */
class JwtServiceOnly
{
    public function __construct(private JwtService $jwtService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $claims = $this->jwtService->verify(substr($header, 7));

        if (! $claims || ($claims->type ?? null) !== 'service') {
            return response()->json([
                'success' => false,
                'message' => 'Este endpoint solo puede ser invocado por servicios internos del backend.',
            ], 403);
        }

        return $next($request);
    }
}
