<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Habilitar la extensión geoespacial PostGIS en PostgreSQL.
     */
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS postgis;');
    }

    /**
     * Revertir la extensión.
     */
    public function down(): void
    {
        DB::statement('DROP EXTENSION IF EXISTS postgis;');
    }
};
