<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Coordenadas reales del punto de recogida. Antes solo se guardaba el texto y la app
     * adivinaba la ubicación por el nombre.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->decimal('pickup_lat', 10, 7)->nullable()->after('pickup_address');
            $table->decimal('pickup_lng', 10, 7)->nullable()->after('pickup_lat');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn(['pickup_lat', 'pickup_lng']);
        });
    }
};
