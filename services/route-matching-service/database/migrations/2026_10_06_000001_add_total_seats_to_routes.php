<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Control de cupos (SIM-001): total_seats guarda la capacidad ofertada al publicar
     * y es el tope de release-seat. Las filas existentes copian available_seats.
     */
    public function up(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            $table->unsignedTinyInteger('total_seats')->default(1)->after('available_seats');
        });

        DB::statement('UPDATE routes SET total_seats = available_seats');
    }

    public function down(): void
    {
        Schema::table('routes', function (Blueprint $table) {
            $table->dropColumn('total_seats');
        });
    }
};
