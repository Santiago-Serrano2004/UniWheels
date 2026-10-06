<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Registro de cada búsqueda de ruta, solo para las métricas agregadas del piloto.
     */
    public function up(): void
    {
        Schema::create('search_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('passenger_id');
            $table->unsignedInteger('results_count');
            $table->unsignedInteger('modality_1_count');
            $table->unsignedInteger('modality_2_count');
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_logs');
    }
};
