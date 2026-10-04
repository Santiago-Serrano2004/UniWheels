<?php

use App\Services\ContributionCalculator;

it('calcula el aporte sugerido redondeado hacia arriba a la centena', function (string $tipo, float $km, int $esperado) {
    expect(ContributionCalculator::suggest($km, $tipo))->toBe($esperado);
})->with([
    'carro 0 km' => ['carro', 0.0, 2000],
    'carro 5 km' => ['carro', 5.0, 4000],
    'carro 8 km' => ['carro', 8.0, 5200],
    'carro 7.3 km' => ['carro', 7.3, 5000],
    'carro 20 km' => ['carro', 20.0, 10000],
    'moto 5 km' => ['moto', 5.0, 2300],
    'moto 8 km' => ['moto', 8.0, 3000],
    'moto 10 km' => ['moto', 10.0, 3500],
]);

it('trata una distancia negativa como cero', function () {
    expect(ContributionCalculator::suggest(-3.0, 'carro'))->toBe(2000);
});

it('lanza excepción con un tipo de vehículo desconocido', function () {
    ContributionCalculator::suggest(5.0, 'bicicleta');
})->throws(InvalidArgumentException::class);
