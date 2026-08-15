<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\InstitutionResource;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;

class InstitutionController extends Controller
{
    /**
     * Listar instituciones universitarias activas y sus sedes geográficas.
     */
    public function index(): JsonResponse
    {
        $instituciones = Institution::with('campuses')->where('is_active', true)->get();

        return response()->json([
            'success' => true,
            'data' => InstitutionResource::collection($instituciones),
        ]);
    }
}
