<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('trip_sos_events', function (Blueprint $table) {
            $table->timestamp('attended_at')->nullable()->after('triggered_at');
            $table->uuid('attended_by_user_id')->nullable()->after('attended_at');
            $table->text('attention_notes')->nullable()->after('attended_by_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('trip_sos_events', function (Blueprint $table) {
            $table->dropColumn(['attended_at', 'attended_by_user_id', 'attention_notes']);
        });
    }
};
