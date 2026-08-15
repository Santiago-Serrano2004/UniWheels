<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ejecutar las migraciones de usuarios universitarios, recuperación de claves y sesiones.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 120);
            $table->string('email', 150)->unique();
            $table->string('id_document_number', 30)->unique();
            $table->string('id_document_type', 10)->default('CC'); // CC, CE, TI, PASAPORTE
            $table->string('phone_number', 20);
            $table->string('profile_photo_path')->nullable();

            $table->foreignId('institution_id')->constrained('institutions')->restrictOnDelete();
            $table->foreignId('campus_id')->nullable()->constrained('institution_campuses')->nullOnDelete();

            $table->string('member_type', 20)->default('estudiante'); // estudiante, docente, administrativo
            $table->string('student_code', 20)->nullable(); // Formato UXXXXXXXX
            $table->string('academic_program_or_department', 150);
            $table->unsignedTinyInteger('semester')->nullable(); // 1 a 12 para estudiantes

            $table->string('password');
            $table->boolean('is_driver')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('verification_expires_at')->nullable(); // Expiración semestral (6 meses)

            $table->rememberToken();
            $table->softDeletes();
            $table->timestamps();

            // Índices para búsquedas de alta concurrencia
            $table->index(['institution_id', 'is_active']);
            $table->index('student_code');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
