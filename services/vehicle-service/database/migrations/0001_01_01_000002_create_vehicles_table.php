<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de vehículos registrados por los conductores.
     */
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index(); // Referencia al usuario en auth_db
            $table->string('vehicle_type', 20); // carro, moto
            $table->string('plate_number', 15)->unique(); // Formato colombiano: AAA000 o AAA00A
            $table->string('brand', 80);
            $table->string('model_line', 100);
            $table->unsignedSmallInteger('year');
            $table->string('color', 40);

            // Capacidad y equipamiento
            $table->unsignedTinyInteger('available_seats')->default(1); // 1 para moto, 1-6 para carro
            $table->boolean('has_ac')->default(false); // Aire acondicionado
            $table->boolean('has_trunk')->default(true); // Espacio en baúl para maletas
            $table->boolean('has_extra_helmet')->default(false); // Obligatorio para motos

            $table->string('perspective_photo_path')->nullable(); // Foto en perspectiva 3/4

            // Estado de validación
            $table->string('status', 30)->default('pendiente_revision'); // pendiente_revision, aprobado, rechazado, documento_vencido, inactivo
            $table->text('rejection_reason')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
