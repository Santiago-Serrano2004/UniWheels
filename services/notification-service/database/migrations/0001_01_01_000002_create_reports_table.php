<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de reportes de incidentes y seguridad para Bienestar Universitario.
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('reporter_user_id')->index(); // Denunciante
            $table->uuid('reported_user_id')->index(); // Denunciado
            $table->uuid('trip_id')->nullable()->index();
            $table->uuid('reported_comment_id')->nullable(); // Para reportar comentarios abusivos

            $table->string('category', 50); 
            // acoso_o_inseguridad, cobro_indebido_o_diferente, conduccion_peligrosa, vehiculo_en_mal_estado, suplantacion_o_cuenta_falsa, incumplimiento_horario, comportamiento_inadecuado, otro

            $table->text('description');
            $table->string('evidence_photo_path')->nullable();

            $table->string('status', 35)->default('abierto'); 
            // abierto, en_investigacion, resuelto_con_advertencia, resuelto_con_suspension, desestimado

            $table->text('resolution_notes')->nullable();
            $table->uuid('resolved_by_user_id')->nullable(); // Administrador que resolvió
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
