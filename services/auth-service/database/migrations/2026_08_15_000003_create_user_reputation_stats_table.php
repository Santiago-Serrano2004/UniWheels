<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de estadísticas y reputación de usuarios.
     */
    public function up(): void
    {
        Schema::create('user_reputation_stats', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedInteger('total_trips_as_driver')->default(0);
            $table->unsignedInteger('total_trips_as_passenger')->default(0);
            $table->unsignedInteger('rating_count_as_driver')->default(0);
            $table->unsignedInteger('rating_count_as_passenger')->default(0);
            $table->decimal('rating_sum_as_driver', 10, 2)->default(0.00);
            $table->decimal('rating_sum_as_passenger', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_reputation_stats');
    }
};
