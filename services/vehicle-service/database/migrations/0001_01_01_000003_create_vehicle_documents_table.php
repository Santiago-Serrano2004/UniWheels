<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de documentos reglamentarios del vehículo y conductor.
     */
    public function up(): void
    {
        Schema::create('vehicle_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_id')->constrained('vehicles')->cascadeOnDelete();
            $table->uuid('user_id')->index(); // Propietario / Conductor

            $table->string('document_type', 40); // licencia_conduccion, soat, tarjeta_propiedad, revision_tecnico_mecanica
            $table->string('document_number', 50)->nullable();
            $table->string('issuer_entity', 100)->nullable(); // Aseguradora, CDA, Secretaría de Tránsito
            $table->string('file_path', 255); // Almacenado en disco privado storage/app/private

            $table->date('issued_at')->nullable();
            $table->date('expires_at')->nullable(); // SOAT y RTM

            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->uuid('verified_by_user_id')->nullable(); // Administrador que aprobó
            $table->text('rejection_notes')->nullable();

            $table->timestamps();

            $table->index(['vehicle_id', 'document_type']);
            $table->index('expires_at');
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_documents');
    }
};
