<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Lista de espera previa al lanzamiento (validación de demanda).
     */
    public function up(): void
    {
        Schema::create('waitlist_entries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('email')->unique();
            $table->string('role', 20);
            $table->string('neighborhood', 80);
            $table->foreignId('campus_id')->nullable()->constrained('institution_campuses')->nullOnDelete();
            $table->string('usual_time', 5);
            $table->string('direction', 20);
            $table->timestamp('consent_at');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waitlist_entries');
    }
};
