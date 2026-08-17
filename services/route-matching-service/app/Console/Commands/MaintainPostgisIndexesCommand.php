<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MaintainPostgisIndexesCommand extends Command
{
    protected $signature = 'postgis:maintain';
    protected $description = 'Ejecutar VACUUM ANALYZE y optimizar las estadísticas de los índices espaciales GiST en PostgreSQL/PostGIS';

    public function handle(): int
    {
        $this->info('Iniciando mantenimiento de índices espaciales PostGIS...');

        try {
            DB::statement('VACUUM ANALYZE routes;');
            DB::statement('VACUUM ANALYZE route_stops;');
            DB::statement('VACUUM ANALYZE trip_requests;');

            $this->info('✓ VACUUM ANALYZE ejecutado exitosamente en tablas espaciales.');
            $this->info('✓ Estadísticas de índices GiST (idx_routes_path_geometry) sincronizadas.');
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Error durante el mantenimiento de PostGIS: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
