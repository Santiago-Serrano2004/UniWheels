<?php

namespace App\Http\Middleware;

use App\Services\JwtVerifier;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restringe un endpoint a llamadas servicio-a-servicio: exige un JWT válido con
 * claim type=service. Usado en la exportación de datos de entrenamiento hacia
 * ai-route-service, que nunca debe ser invocable directamente por la app cliente.
 */
class JwtServiceOnly
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        $claims = $this->jwtVerifier->verify(substr($header, 7));

        if (! $claims || ($claims->type ?? null) !== 'service') {
            return response()->json([
                'success' => false,
                'message' => 'Este endpoint solo puede ser invocado por servicios internos del backend.',
            ], 403);
        }

        return $next($request);
    }
}
