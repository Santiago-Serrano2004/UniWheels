<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabla de auditoría y conciliación: almacena el payload completo de CADA evento webhook
     * recibido desde la pasarela Wompi (aprobados, declinados, anulados, con firma inválida o error).
     */
    public function up(): void
    {
        Schema::create('wompi_webhook_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('event_type', 100)->nullable(); // ej. 'transaction.updated'
            $table->string('transaction_id', 100)->nullable()->index(); // ID asignado por Wompi
            $table->string('reference', 100)->nullable()->index(); // WR-... o TP-...
            $table->string('status', 50)->nullable(); // APPROVED, DECLINED, VOIDED, ERROR, etc.
            $table->bigInteger('amount_in_cents')->nullable();
            $table->string('currency', 10)->default('COP');
            $table->string('checksum', 128)->nullable();
            $table->boolean('signature_valid')->default(true);
            $table->boolean('processed')->default(false);
            $table->timestamp('processed_at')->nullable();
            $table->text('error_message')->nullable();
            $table->json('payload'); // Payload JSON completo recibido
            $table->timestamps();

            $table->index(['reference', 'status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wompi_webhook_events');
    }
};
