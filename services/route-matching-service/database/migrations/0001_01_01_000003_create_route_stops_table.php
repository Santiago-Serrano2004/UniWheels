<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de paradas secuenciales de la ruta (Punto de inicio, recogidas y campus de destino).
     */
    public function up(): void
    {
        Schema::create('route_stops', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('route_id')->constrained('routes')->cascadeOnDelete();
            $table->unsignedTinyInteger('stop_order'); // 0 = Origen, 1..N = Recogidas, N+1 = Destino
            $table->string('stop_type', 30); // origen_conductor, recogida_pasajero, destino_campus
            $table->string('stop_name', 150);

            $table->uuid('passenger_id')->nullable()->index(); // ID del pasajero asignado
            $table->boolean('is_detour')->default(false); // Indica si la parada fue producto de un desvío IA
            $table->decimal('detour_minutes_added', 5, 2)->default(0.00);
            $table->decimal('extra_fee_cop', 10, 2)->default(0.00); // Recargo por desvío (+ $300 COP / min)

            $table->timestamp('estimated_arrival_time');
            $table->timestamps();

            $table->index(['route_id', 'stop_order']);
        });

        DB::statement('ALTER TABLE route_stops ADD COLUMN stop_geom GEOMETRY(Point, 4326);');
        DB::statement('CREATE INDEX idx_route_stops_geom ON route_stops USING GIST (stop_geom);');
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_stops');
    }
};
