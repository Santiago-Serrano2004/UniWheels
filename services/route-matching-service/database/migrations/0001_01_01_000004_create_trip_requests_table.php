<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de solicitudes de emparejamiento de trayecto (Modalidad 1 Directo y Modalidad 2 Desvío IA).
     */
    public function up(): void
    {
        Schema::create('trip_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('passenger_id')->index();
            $table->foreignUuid('route_id')->constrained('routes')->cascadeOnDelete();

            $table->string('pickup_name', 150);
            $table->unsignedBigInteger('dropoff_campus_id');

            $table->string('request_mode', 30); // match_directo, desvio_ia
            $table->decimal('calculated_detour_minutes', 5, 2)->default(0.00);
            $table->decimal('suggested_contribution_cop', 10, 2);

            $table->string('status', 30)->default('solicitado'); // solicitado, aceptado, rechazado, cancelado
            $table->timestamps();

            $table->index(['route_id', 'status']);
        });

        DB::statement('ALTER TABLE trip_requests ADD COLUMN pickup_geom GEOMETRY(Point, 4326);');
        DB::statement('ALTER TABLE trip_requests ADD COLUMN dropoff_geom GEOMETRY(Point, 4326);');

        DB::statement('CREATE INDEX idx_trip_requests_pickup ON trip_requests USING GIST (pickup_geom);');
        DB::statement('CREATE INDEX idx_trip_requests_dropoff ON trip_requests USING GIST (dropoff_geom);');
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_requests');
    }
};
