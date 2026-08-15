<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla de auditoría inmutable de acceso a documentos (Cumplimiento Habeas Data Ley 1581/2012).
     */
    public function up(): void
    {
        Schema::create('document_access_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('auditor_user_id')->index(); // Administrador o usuario que consultó
            $table->uuid('target_user_id')->index(); // Dueño del documento protegido
            $table->foreignUuid('vehicle_id')->nullable()->constrained('vehicles')->nullOnDelete();
            $table->foreignUuid('document_id')->nullable()->constrained('vehicle_documents')->nullOnDelete();

            $table->string('document_type', 40); // licencia, soat, tarjeta, rtm
            $table->string('access_purpose', 50); // verificacion_inicial, auditoria_semestral, inspeccion_soporte, consulta_seguridad
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->string('file_hash_sha256', 64); // Integridad del archivo consultado
            $table->timestamp('accessed_at');

            $table->index(['target_user_id', 'accessed_at']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_access_logs');
    }
};
