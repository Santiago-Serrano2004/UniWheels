<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $roles = (array) $request->attributes->get('user_roles', []);

        if (! in_array('administrador', $roles, true)) {
            return response()->json([
                'message' => 'Acceso no autorizado. Se requieren permisos de administrador.',
            ], 403);
        }

        return $next($request);
    }
}
