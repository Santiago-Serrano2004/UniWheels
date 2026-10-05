<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Eliminación real de la cuenta (Habeas Data, Ley 1581): anonimiza todos los datos
 * personales del usuario en auth-service y pide a los otros servicios hacer lo mismo.
 */
class AccountErasureService
{
    public function __construct(private PersonalDataEraser $eraser) {}

    public function erase(User $usuario): void
    {
        $userId = (string) $usuario->id;
        $correoOriginal = $usuario->email;
        $foto = $usuario->profile_photo_path;

        DB::transaction(function () use ($usuario, $userId, $correoOriginal) {
            $usuario->forceFill([
                'name' => 'Usuario eliminado',
                'email' => 'deleted+'.Str::uuid().'@deleted.invalid',
                'id_document_number' => null,
                'phone_number' => null,
                'student_code' => null,
                'academic_program_or_department' => null,
                'profile_photo_path' => null,
                'semester' => null,
                'password' => Hash::make(Str::random(64)),
                'remember_token' => null,
                'is_active' => false,
                'email_verified_at' => null,
                'phone_verified_at' => null,
            ])->save();

            DB::table('password_reset_tokens')->where('email', $correoOriginal)->delete();
            DB::table('sessions')->where('user_id', $userId)->delete();
            DB::table('personal_access_tokens')
                ->where('tokenable_id', $userId)
                ->delete();

            $usuario->delete();
        });

        if ($foto) {
            Storage::disk('public')->delete($foto);
        }

        $this->eraser->eraseEverywhere($userId);
    }
}
