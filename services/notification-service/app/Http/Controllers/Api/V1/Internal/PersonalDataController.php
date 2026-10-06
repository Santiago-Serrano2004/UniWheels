<?php

namespace App\Http\Controllers\Api\V1\Internal;

use App\Http\Controllers\Controller;
use App\Models\DevicePushToken;
use App\Models\Notification;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PersonalDataController extends Controller
{
    /**
     * Eliminación de datos personales (Habeas Data, Ley 1581), pedida por auth-service al
     * eliminar la cuenta: borra notificaciones y tokens de push (móvil y web) del usuario.
     */
    public function destroy(string $id): JsonResponse
    {
        DB::transaction(function () use ($id) {
            Notification::where('user_id', $id)->delete();
            DevicePushToken::where('user_id', $id)->delete();
            PushSubscription::where('user_id', $id)->delete();
        });

        return response()->json(['success' => true]);
    }
}
