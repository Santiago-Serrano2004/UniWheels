<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\InstitutionCampus;
use App\Models\User;
use App\Models\UserReputationStats;
use App\Models\UserWallet;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Poblar la base de datos inicial con instituciones, sedes, roles y cuentas de prueba.
     */
    public function run(): void
    {
        $this->call([
            InstitutionSeeder::class,
            RoleSeeder::class,
        ]);

        $unab = Institution::where('code', 'UNAB')->first();
        $campusJardin = InstitutionCampus::where('code', 'JARDIN')->first();
        $claveBase = env('SEED_DEFAULT_PASSWORD', 'UniWheels2026' . Str::random(4) . '!');

        // 1. Usuario Administrador de Bienestar Universitario
        $admin = User::firstOrCreate(
            ['email' => 'bienestar@unab.edu.co'],
            [
                'name' => 'Administrador Bienestar UNAB',
                'id_document_number' => '1098765432',
                'id_document_type' => 'CC',
                'phone_number' => '3150000000',
                'institution_id' => $unab->id,
                'campus_id' => $campusJardin->id,
                'member_type' => 'administrativo',
                'student_code' => null,
                'academic_program_or_department' => 'Dirección de Bienestar Universitario',
                'semester' => null,
                'password' => Hash::make($claveBase),
                'is_driver' => false,
                'is_active' => true,
                'email_verified_at' => now(),
                'verification_expires_at' => now()->addMonths(6),
            ]
        );
        $admin->assignRole('administrador');

        UserReputationStats::firstOrCreate(['user_id' => $admin->id]);
        UserWallet::firstOrCreate(['user_id' => $admin->id], ['balance_cop' => 0.00]);

        // 2. Estudiante de Prueba (Conductor)
        $estudianteConductor = User::firstOrCreate(
            ['email' => 'estudiante.demo@unab.edu.co'],
            [
                'name' => 'Santiago Serrano (Demo Conductor)',
                'id_document_number' => '1098123456',
                'id_document_type' => 'CC',
                'phone_number' => '3161234567',
                'institution_id' => $unab->id,
                'campus_id' => $campusJardin->id,
                'member_type' => 'estudiante',
                'student_code' => 'U00123456',
                'academic_program_or_department' => 'Ingeniería de Sistemas',
                'semester' => 8,
                'password' => Hash::make($claveBase),
                'is_driver' => true,
                'is_active' => true,
                'email_verified_at' => now(),
                'verification_expires_at' => now()->addMonths(6),
            ]
        );
        $estudianteConductor->assignRole(['estudiante', 'conductor']);

        UserReputationStats::firstOrCreate(
            ['user_id' => $estudianteConductor->id],
            [
                'total_trips_as_driver' => 12,
                'rating_count_as_driver' => 10,
                'rating_sum_as_driver' => 49.50,
            ]
        );
        UserWallet::firstOrCreate(
            ['user_id' => $estudianteConductor->id],
            ['balance_cop' => 25000.00]
        );
    }
}
