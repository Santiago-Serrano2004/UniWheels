<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pivote B2B sin pagos (ADR 0001): se eliminan las columnas de pago y comisión
     * de trips y la tabla de eventos Wompi. Ningún índice ni CHECK constraint
     * (trips_status_check, idx_trips_*) referencia estas columnas.
     */
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method',
                'driver_amount_cop',
                'platform_commission_cop',
                'commission_status',
                'payment_confirmed_at',
                'payment_reference',
            ]);
        });

        Schema::dropIfExists('wompi_webhook_events');
    }

    /**
     * Recrea las columnas y la tabla con el esquema de las migraciones históricas.
     */
    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->string('payment_method', 30)->default('efectivo');
            $table->decimal('driver_amount_cop', 10, 2)->default(0.00);
            $table->decimal('platform_commission_cop', 10, 2)->default(0.00);
            $table->string('commission_status', 30)->default('pendiente_debito');
            $table->timestamp('payment_confirmed_at')->nullable();
            $table->string('payment_reference', 100)->nullable();
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
