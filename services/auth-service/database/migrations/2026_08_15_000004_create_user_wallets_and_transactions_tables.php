<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear las tablas de billeteras y transacciones financieras (Prepago de comisiones y recargas).
     */
    public function up(): void
    {
        Schema::create('user_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->decimal('balance_cop', 12, 2)->default(0.00); // Permite saldo negativo hasta límite configurado
            $table->boolean('is_locked')->default(false); // Bloqueado si excede deuda máxima de comisión (-$5.000 COP)
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained('user_wallets')->cascadeOnDelete();
            $table->string('transaction_type', 40); // recarga_nequi, recarga_pse, cobro_comision_viaje, pago_recibido_billetera, ajuste_administrativo
            $table->decimal('amount_cop', 12, 2); // Positivo (ingreso) o Negativo (débito de comisión)
            $table->decimal('balance_before_cop', 12, 2);
            $table->decimal('balance_after_cop', 12, 2);
            $table->string('reference_id', 100)->nullable(); // trip_id o pasarela_ref
            $table->string('status', 20)->default('completado'); // pendiente, completado, fallido, revertido
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('user_wallets');
    }
};
