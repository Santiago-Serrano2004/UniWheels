<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de auditoría de cancelaciones y penalizaciones de viaje.
     */
    public function up(): void
    {
        Schema::create('trip_cancellations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('trip_id')->constrained('trips')->cascadeOnDelete();
            $table->uuid('cancelled_by_user_id');
            $table->string('canceller_role', 20); // conductor, pasajero
            $table->string('reason_category', 50); // cambio_planes, demora_excesiva, falla_mecanica, emergencia, otro
            $table->text('detailed_reason')->nullable();
            $table->integer('minutes_before_departure'); // Minutos antes de la hora de salida en que canceló
            $table->boolean('had_penalty')->default(false); // True si el pasajero canceló < 2 min o conductor < 15 min con pasajeros asignados
            $table->timestamp('created_at')->useCurrent();

            $table->index(['cancelled_by_user_id', 'created_at']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('trip_cancellations');
    }
};
