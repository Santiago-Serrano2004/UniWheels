<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Poblar los roles y permisos del sistema.
     */
    public function run(): void
    {
        // Limpiar caché de permisos registrados
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Creación de roles base
        $rolEstudiante = Role::firstOrCreate(['name' => 'estudiante', 'guard_name' => 'web']);
        $rolConductor = Role::firstOrCreate(['name' => 'conductor', 'guard_name' => 'web']);
        $rolAdministrador = Role::firstOrCreate(['name' => 'administrador', 'guard_name' => 'web']);

        // Permisos del sistema
        $permisos = [
            'routes.create',
            'routes.view',
            'trips.request',
            'trips.confirm',
            'vehicles.register',
            'admin.dashboard',
            'admin.verify_documents',
        ];

        foreach ($permisos as $permiso) {
            Permission::firstOrCreate(['name' => $permiso, 'guard_name' => 'web']);
        }

        $rolEstudiante->syncPermissions(['routes.view', 'trips.request', 'vehicles.register']);
        $rolConductor->syncPermissions(['routes.create', 'routes.view', 'trips.confirm', 'vehicles.register']);
        $rolAdministrador->syncPermissions(Permission::all());
    }
}
