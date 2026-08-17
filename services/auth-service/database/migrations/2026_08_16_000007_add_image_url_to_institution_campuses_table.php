<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Agregar columna image_url a la tabla institution_campuses.
     */
    public function up(): void
    {
        Schema::table('institution_campuses', function (Blueprint $table) {
            $table->string('image_url', 255)->nullable()->after('address');
        });
    }

    /**
     * Revertir la migración.
     */
    public function down(): void
    {
        Schema::table('institution_campuses', function (Blueprint $table) {
            $table->dropColumn('image_url');
        });
    }
};
