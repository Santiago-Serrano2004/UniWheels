<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Eliminación real de datos (Ley 1581): al borrar la cuenta estas columnas
     * personales se ponen en null, así que deben admitirlo.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_document_number', 30)->nullable()->change();
            $table->string('phone_number', 20)->nullable()->change();
            $table->string('academic_program_or_department', 150)->nullable()->change();
        });
    }

    public function down(): void
    {
        // Las filas anonimizadas no caben en las columnas NOT NULL originales.
        Schema::table('users', function (Blueprint $table) {
            $table->string('id_document_number', 30)->nullable(false)->change();
            $table->string('phone_number', 20)->nullable(false)->change();
            $table->string('academic_program_or_department', 150)->nullable(false)->change();
        });
    }
};
