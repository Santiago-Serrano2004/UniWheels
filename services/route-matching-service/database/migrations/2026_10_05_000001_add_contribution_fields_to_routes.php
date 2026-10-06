<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Aporte sugerido con tope (tarea 3.3): se guarda la distancia vial y el aporte
     * sugerido al publicar, y el aporte indicado por el conductor pasa a ser 0 por defecto.
     */
    public function up(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            $table->decimal('distance_km', 6, 2)->nullable();
            $table->decimal('suggested_contribution_cop', 10, 2)->nullable();
            $table->decimal('base_contribution_cop', 10, 2)->default(0.00)->change();
        });
    }

    public function down(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            $table->dropColumn(['distance_km', 'suggested_contribution_cop']);
            $table->decimal('base_contribution_cop', 10, 2)->default(5000.00)->change();
        });
    }
};
