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
        Schema::table('trips', function (Blueprint $table) {
            // Se fija cuando Wompi confirma un pago con tarjeta vía webhook —
            // un viaje payment_method=tarjeta no puede completarse sin esto.
            $table->timestamp('payment_confirmed_at')->nullable()->after('commission_status');
            $table->string('payment_reference', 100)->nullable()->after('payment_confirmed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn(['payment_confirmed_at', 'payment_reference']);
        });
    }
};
