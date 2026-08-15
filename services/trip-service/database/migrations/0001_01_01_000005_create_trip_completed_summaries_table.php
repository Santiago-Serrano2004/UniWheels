<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de resumen comprimido post-viaje (conservación de datos esenciales y privacidad).
     */
    public function up(): void
    {
        Schema::create('trip_completed_summaries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trip_id')->unique()->constrained('trips')->cascadeOnDelete();
            $table->decimal('actual_duration_minutes', 6, 2);
            $table->decimal('total_distance_km', 6, 2);
            $table->timestamp('completed_at')->useCurrent();
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_completed_summaries');
    }
};
