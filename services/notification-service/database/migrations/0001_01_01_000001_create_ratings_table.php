<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de calificaciones bidireccionales con comentarios públicos opcionales.
     */
    public function up(): void
    {
        Schema::create('ratings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('trip_id')->index(); // Viaje evaluado en trip_db
            $table->uuid('rater_user_id')->index(); // Evaluador
            $table->uuid('rated_user_id')->index(); // Evaluado
            $table->string('role_rated', 20); // conductor, pasajero
            $table->unsignedTinyInteger('score'); // Calificación 1 a 5 estrellas
            $table->text('optional_comment')->nullable(); // Comentario visible para la comunidad
            $table->timestamps();

            $table->unique(['trip_id', 'rater_user_id', 'rated_user_id']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
    }
};
