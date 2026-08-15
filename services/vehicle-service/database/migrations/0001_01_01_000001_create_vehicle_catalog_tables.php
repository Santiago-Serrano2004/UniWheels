<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear el catálogo estandarizado de marcas y modelos de vehículos en Colombia.
     */
    public function up(): void
    {
        Schema::create('vehicle_catalog_brands', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80)->unique();
            $table->string('vehicle_type', 20); // carro, moto
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('vehicle_catalog_models', function (Blueprint $table) {
            $table->id();
            $table->foreignId('brand_id')->constrained('vehicle_catalog_brands')->cascadeOnDelete();
            $table->string('line_name', 100);
            $table->unsignedTinyInteger('default_seats')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['brand_id', 'line_name']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_catalog_models');
        Schema::dropIfExists('vehicle_catalog_brands');
    }
};
