<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Endurece la tabla trips: quita el default hardcodeado del PIN de abordaje
     * (siempre se genera server-side) y añade un CHECK de estados válidos a nivel
     * de base de datos. Solo aplica en PostgreSQL — sqlite (usado en tests) no
     * soporta estas operaciones vía ALTER TABLE y no las necesita para validar.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE trips ALTER COLUMN boarding_pin DROP DEFAULT');

        DB::statement("ALTER TABLE trips ADD CONSTRAINT trips_status_check CHECK (status IN (
            'solicitado', 'confirmado', 'en_camino', 'en_punto_encuentro', 'recogido',
            'completado', 'cancelado_por_conductor', 'cancelado_por_pasajero', 'no_asistio'
        ))");
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check');
        DB::statement("ALTER TABLE trips ALTER COLUMN boarding_pin SET DEFAULT '4829'");
    }
};
