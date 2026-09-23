<?php

use App\Models\VehicleCatalogBrand;
use App\Models\VehicleCatalogModel;
use App\Services\NhtsaVehicleApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

test('mas de 100 marcas se devuelven completas desde la API de NHTSA', function () {
    $makes = [];
    for ($i = 1; $i <= 130; $i++) {
        $makes[] = ['MakeName' => "BRAND_{$i}"];
    }

    Http::fake([
        '*/GetMakesForVehicleType/car*' => Http::response(['Results' => $makes], 200),
    ]);

    $service = new NhtsaVehicleApiService;
    $brands = $service->getBrands('carro');

    expect(count($brands))->toBe(130)
        ->and($brands)->toContain('BRAND_1', 'BRAND_100', 'BRAND_130');
});

test('los duplicados por mayusculas se unifican dando prioridad al nombre local', function () {
    $brand = VehicleCatalogBrand::create([
        'name' => 'Chevrolet',
        'vehicle_type' => 'carro',
        'is_active' => true,
    ]);

    VehicleCatalogModel::create([
        'brand_id' => $brand->id,
        'line_name' => 'Aveo Family',
        'default_seats' => 5,
        'is_active' => true,
    ]);

    Http::fake([
        '*/GetMakesForVehicleType/car*' => Http::response([
            'Results' => [
                ['MakeName' => 'CHEVROLET'],
                ['MakeName' => 'AUDI'],
            ],
        ], 200),
        '*/GetModelsForMake/Chevrolet*' => Http::response([
            'Results' => [
                ['Model_Name' => 'AVEO FAMILY'],
                ['Model_Name' => 'ONIX'],
            ],
        ], 200),
    ]);

    $service = new NhtsaVehicleApiService;
    $brands = $service->getBrands('carro');
    $models = $service->getModelsForBrand('Chevrolet');

    expect($brands)->toContain('Chevrolet', 'AUDI')
        ->and($brands)->not->toContain('CHEVROLET')
        ->and($models)->toContain('Aveo Family', 'ONIX')
        ->and($models)->not->toContain('AVEO FAMILY');
});

test('un fallo de NHTSA se cachea solo por 10 minutos y no por 30 dias', function () {
    VehicleCatalogBrand::create([
        'name' => 'Mazda',
        'vehicle_type' => 'carro',
        'is_active' => true,
    ]);

    // 1. Configurar secuencia: primero falla con 500, luego responde con éxito
    Http::fake([
        '*/GetMakesForVehicleType/car*' => Http::sequence()
            ->push('Server Error', 500)
            ->push(['Results' => [['MakeName' => 'TOYOTA']]], 200),
    ]);

    $service = new NhtsaVehicleApiService;
    $brandsFirst = $service->getBrands('carro');

    expect($brandsFirst)->toBe(['Mazda']);

    // 2. Avanzar 15 minutos en el tiempo (el TTL de 10 min debe haber expirado)
    $this->travel(15)->minutes();

    // 3. Al consultar nuevamente, reintenta NHTSA y obtiene los datos nuevos
    $brandsSecond = $service->getBrands('carro');

    expect($brandsSecond)->toContain('Mazda', 'TOYOTA');
});

test('los modelos de una marca no se mezclan con los de otra', function () {
    Http::fake([
        '*/GetModelsForMake/Chevrolet*' => Http::response([
            'Results' => [
                ['Model_Name' => 'Cruze'],
                ['Model_Name' => 'Tracker'],
            ],
        ], 200),
        '*/GetModelsForMake/Mazda*' => Http::response([
            'Results' => [
                ['Model_Name' => 'Mazda 2'],
                ['Model_Name' => 'CX-30'],
            ],
        ], 200),
    ]);

    $service = new NhtsaVehicleApiService;
    $modelosChevy = $service->getModelsForBrand('Chevrolet');
    $modelosMazda = $service->getModelsForBrand('Mazda');

    expect($modelosChevy)->toContain('Cruze', 'Tracker')
        ->and($modelosChevy)->not->toContain('Mazda 2', 'CX-30')
        ->and($modelosMazda)->toContain('Mazda 2', 'CX-30')
        ->and($modelosMazda)->not->toContain('Cruze', 'Tracker');
});
