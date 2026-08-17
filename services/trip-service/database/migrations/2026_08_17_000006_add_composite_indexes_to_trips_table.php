<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear índices compuestos de alto rendimiento para consultas de telemetría y viajes activos.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->index(
                ['driver_id', 'status', 'scheduled_pickup_time'],
                'idx_trips_driver_status_scheduled'
            );
            $table->index(
                ['passenger_id', 'status', 'scheduled_pickup_time'],
                'idx_trips_passenger_status_scheduled'
            );
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropIndex('idx_trips_driver_status_scheduled');
            $table->dropIndex('idx_trips_passenger_status_scheduled');
        });
    }
};
