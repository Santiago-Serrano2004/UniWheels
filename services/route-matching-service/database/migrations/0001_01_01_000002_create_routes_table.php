<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de rutas de viaje con soporte geoespacial nativo PostGIS e indexación GiST.
     */
    public function up(): void
    {
        Schema::create('routes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('driver_id')->index(); // Referencia al usuario en auth_db
            $table->uuid('vehicle_id')->index(); // Referencia al vehículo en vehicle_db

            $table->string('origin_name', 150);
            $table->unsignedBigInteger('destination_campus_id'); // ID de la sede UNAB
            $table->string('destination_campus_name', 100);

            // Horarios programados
            $table->timestamp('scheduled_departure_time');
            $table->timestamp('target_arrival_time'); // Hora límite en que el conductor debe estar en el campus
            $table->decimal('estimated_duration_minutes', 6, 2);

            // Umbrales de desvío de la IA (Modalidad 2)
            $table->unsignedTinyInteger('max_detour_minutes')->default(15); // Máximo 15 min de retraso total acumulado
            $table->decimal('accumulated_detour_minutes', 5, 2)->default(0.00);

            // Cupos y tarifas colaborativas
            $table->unsignedTinyInteger('available_seats')->default(1);
            $table->decimal('base_contribution_cop', 10, 2)->default(5000.00); // Tarifa base por pasajero

            $table->string('status', 30)->default('publicada'); // publicada, en_curso, finalizada, cancelada
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'scheduled_departure_time']);
        });

        // Agregar columnas de geometría nativa PostGIS (SRID 4326 - WGS 84)
        DB::statement('ALTER TABLE routes ADD COLUMN path_geometry GEOMETRY(LineString, 4326);');
        DB::statement('ALTER TABLE routes ADD COLUMN origin_geom GEOMETRY(Point, 4326);');
        DB::statement('ALTER TABLE routes ADD COLUMN destination_geom GEOMETRY(Point, 4326);');

        // Creación obligatoria de índices espaciales GiST (Generalized Search Tree)
        DB::statement('CREATE INDEX idx_routes_path_geometry ON routes USING GIST (path_geometry);');
        DB::statement('CREATE INDEX idx_routes_origin_geom ON routes USING GIST (origin_geom);');
        DB::statement('CREATE INDEX idx_routes_destination_geom ON routes USING GIST (destination_geom);');
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('routes');
    }
};
