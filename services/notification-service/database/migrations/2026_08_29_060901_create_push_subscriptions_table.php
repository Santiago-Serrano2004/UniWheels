<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id')->index();
            $table->text('endpoint');
            $table->string('p256dh_key', 255);
            $table->string('auth_key', 255);
            $table->timestamps();

            // Un mismo endpoint (navegador/dispositivo) no debería duplicarse para
            // el mismo usuario — al reactivar permisos el navegador reutiliza el
            // endpoint existente y solo se debe actualizar, no insertar de nuevo.
            $table->unique(['user_id', 'endpoint']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
