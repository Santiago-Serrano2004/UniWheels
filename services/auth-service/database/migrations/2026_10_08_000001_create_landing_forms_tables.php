<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Formularios de la landing: universidad en la lista de espera, inscripción a la beta
     * y contacto de universidades.
     */
    public function up(): void
    {
        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->string('university', 120)->nullable()->after('email');
        });

        Schema::create('beta_signups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 80);
            $table->string('email')->unique();
            $table->string('university', 120);
            $table->string('platform', 10);
            $table->string('role', 20);
            $table->timestamp('consent_at');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('university_contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 80);
            $table->string('email');
            $table->string('university', 120);
            $table->string('position', 80);
            $table->string('phone', 30)->nullable();
            $table->text('message');
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('university_contacts');
        Schema::dropIfExists('beta_signups');
        Schema::table('waitlist_entries', function (Blueprint $table) {
            $table->dropColumn('university');
        });
    }
};
