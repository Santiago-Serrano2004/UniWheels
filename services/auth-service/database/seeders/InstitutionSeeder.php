<?php

namespace Database\Seeders;

use App\Models\Institution;
use App\Models\InstitutionCampus;
use Illuminate\Database\Seeder;

class InstitutionSeeder extends Seeder
{
    /**
     * Poblar la institución UNAB y sus sedes geográficas oficiales en Bucaramanga y Floridablanca.
     */
    public function run(): void
    {
        $unab = Institution::updateOrCreate(
            ['domain' => 'unab.edu.co'],
            [
                'name' => 'Universidad Autónoma de Bucaramanga',
                'code' => 'UNAB',
                'logo_url' => 'https://unab.edu.co/wp-content/uploads/2022/07/logo-unab-footer.png',
                'welcome_image_url' => '/assets/institutions/unab-mascot.png',
                'is_active' => true,
            ]
        );

        $sedes = [
            [
                'name' => 'Campus El Jardín',
                'code' => 'JARDIN',
                'address' => 'Avenida 42 No. 48 - 11, Bucaramanga, Santander',
                'image_url' => '/assets/institutions/campuses/el-jardin.webp',
                'latitude' => 7.1193460,
                'longitude' => -73.1042780,
                'is_main_campus' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Campus El Bosque',
                'code' => 'BOSQUE',
                'address' => 'Calle 158 No. 20 - 40, Cañaveral, Floridablanca, Santander',
                'image_url' => '/assets/institutions/campuses/el-bosque.webp',
                'latitude' => 7.0664910,
                'longitude' => -73.1037890,
                'is_main_campus' => false,
                'is_active' => true,
            ],
            [
                'name' => 'CSU — Centro de Servicios Universitarios',
                'code' => 'CSU',
                'address' => 'Carrera 45 No. 44 - 15, Terrazas, Bucaramanga, Santander',
                'image_url' => '/assets/institutions/campuses/csu.webp',
                'latitude' => 7.1138210,
                'longitude' => -73.1068420,
                'is_main_campus' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Campus La Casona',
                'code' => 'CASONA',
                'address' => 'Calle 42 No. 34 - 14, Bucaramanga, Santander',
                'image_url' => '/assets/institutions/campuses/la-casona.webp',
                'latitude' => 7.1182100,
                'longitude' => -73.1165200,
                'is_main_campus' => false,
                'is_active' => true,
            ],
        ];

        foreach ($sedes as $sede) {
            InstitutionCampus::updateOrCreate(
                ['institution_id' => $unab->id, 'code' => $sede['code']],
                $sede
            );
        }
    }
}
