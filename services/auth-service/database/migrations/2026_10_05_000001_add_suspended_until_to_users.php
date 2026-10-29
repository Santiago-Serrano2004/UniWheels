<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suspensión automática por cancelaciones tardías (tarea 3.4): fecha de fin de la
     * suspensión y bitácora sin administrador para las acciones automáticas.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_until')->nullable();
        });

        Schema::table('user_suspension_logs', function (Blueprint $table) {
            $table->uuid('admin_user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Las filas automáticas (admin_user_id null) no caben en la columna NOT NULL original.
        DB::table('user_suspension_logs')->whereNull('admin_user_id')->delete();

        Schema::table('user_suspension_logs', function (Blueprint $table) {
            $table->uuid('admin_user_id')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('suspended_until');
        });
    }
};
