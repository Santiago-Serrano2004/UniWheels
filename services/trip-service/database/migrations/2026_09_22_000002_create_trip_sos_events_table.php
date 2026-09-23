<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de auditoría de cada activación del botón de pánico SOS.
     * Nunca se purga automáticamente (a diferencia de trip_tracking_points):
     * es un registro de seguridad/responsabilidad legal, no telemetría de rutina.
     */
    public function up(): void
    {
        Schema::create('trip_sos_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trip_id')->constrained('trips')->cascadeOnDelete();
            $table->uuid('triggered_by_user_id')->index();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('emergency_type')->default('panico_usuario');
            $table->timestamp('triggered_at')->useCurrent();

            $table->index(['trip_id', 'triggered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trip_sos_events');
    }
};
