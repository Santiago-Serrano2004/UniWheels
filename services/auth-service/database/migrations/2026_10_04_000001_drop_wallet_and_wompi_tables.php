<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivote B2B sin pagos (ADR 0001): se eliminan billetera, transacciones y eventos Wompi.
     */
    public function up(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('user_wallets');
        Schema::dropIfExists('wompi_webhook_events');
    }

    /**
     * Recrea las tablas con el esquema de las migraciones históricas.
     */
    public function down(): void
    {
        Schema::create('user_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->decimal('balance_cop', 12, 2)->default(0.00);
            $table->boolean('is_locked')->default(false);
            $table->timestamps();
        });

        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('wallet_id')->constrained('user_wallets')->cascadeOnDelete();
            $table->string('transaction_type', 40);
            $table->decimal('amount_cop', 12, 2);
            $table->decimal('balance_before_cop', 12, 2);
            $table->decimal('balance_after_cop', 12, 2);
            $table->string('reference_id', 100)->nullable()->unique();
            $table->string('status', 20)->default('completado');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['wallet_id', 'created_at']);
        });

        Schema::create('wompi_webhook_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_type', 100)->nullable();
            $table->string('transaction_id', 100)->nullable()->index();
            $table->string('reference', 100)->nullable()->index();
            $table->string('status', 50)->nullable();
            $table->bigInteger('amount_in_cents')->nullable();
            $table->string('currency', 10)->default('COP');
            $table->string('checksum', 128)->nullable();
            $table->boolean('signature_valid')->default(true);
            $table->boolean('processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('payload');
            $table->timestamps();

            $table->index(['reference', 'status']);
            $table->index(['created_at']);
        });
    }
};
