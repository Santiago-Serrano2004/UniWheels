<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class GrantRoleCommand extends Command
{
    protected $signature = 'users:grant-role {email} {role}';

    protected $description = 'Asignar un rol (ej. administrador) a un usuario existente por correo institucional.';

    public function handle(): int
    {
        $usuario = User::where('email', $this->argument('email'))->first();

        if (! $usuario) {
            $this->error('No existe ningún usuario registrado con ese correo.');

            return self::FAILURE;
        }

        $usuario->assignRole($this->argument('role'));
        $this->info("Rol '{$this->argument('role')}' asignado a {$usuario->email} exitosamente.");

        return self::SUCCESS;
    }
}
