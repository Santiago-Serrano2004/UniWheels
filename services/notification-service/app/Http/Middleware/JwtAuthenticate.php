<?php

namespace App\Http\Middleware;

use App\Services\JwtVerifier;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function __construct(private JwtVerifier $jwtVerifier) {}

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado. Se requiere un token Bearer válido.',
            ], 401);
        }

        $claims = $this->jwtVerifier->verify(substr($header, 7));

        if (! $claims) {
            return response()->json([
                'success' => false,
                'message' => 'Token inválido, expirado o revocado.',
            ], 401);
        }

        $request->attributes->set('user_id', (string) $claims->sub);
        $request->attributes->set('user_roles', $claims->roles ?? []);
        $request->attributes->set('jwt_claims', $claims);

        return $next($request);
    }
}
