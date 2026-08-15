<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de notificaciones internas y push móviles.
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->string('title', 150);
            $table->text('body');
            $table->string('type', 50); // match_encontrado, viaje_confirmado, conductor_en_camino, viaje_finalizado, calificacion_recibida, recarga_exitosa, alerta_deuda_billetera, seguridad
            $table->json('payload_json')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_read']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
