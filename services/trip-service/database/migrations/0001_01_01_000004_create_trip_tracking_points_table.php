<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de telemetría GPS en tiempo real (reporte cada 5 segundos).
     */
    public function up(): void
    {
        Schema::create('trip_tracking_points', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trip_id')->constrained('trips')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->decimal('speed_kmh', 5, 2)->nullable();
            $table->decimal('heading_degrees', 5, 2)->nullable();
            $table->decimal('accuracy_meters', 5, 2)->nullable();
            $table->timestamp('recorded_at');

            $table->index(['trip_id', 'recorded_at']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_tracking_points');
    }
};
