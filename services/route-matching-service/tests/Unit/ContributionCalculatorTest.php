<?php

namespace Tests\Unit;

use App\Services\ContributionCalculator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ContributionCalculatorTest extends TestCase
{
    public static function casosDeAporte(): array
    {
        return [
            'carro 0 km' => ['carro', 0.0, 2000],
            'carro 5 km' => ['carro', 5.0, 4000],
            'carro 8 km' => ['carro', 8.0, 5200],
            'carro 7.3 km' => ['carro', 7.3, 5000],
            'carro 20 km' => ['carro', 20.0, 10000],
            'moto 5 km' => ['moto', 5.0, 2300],
            'moto 8 km' => ['moto', 8.0, 3000],
            'moto 10 km' => ['moto', 10.0, 3500],
        ];
    }

    #[DataProvider('casosDeAporte')]
    public function test_calcula_el_aporte_sugerido_redondeado_hacia_arriba_a_la_centena(string $tipo, float $km, int $esperado): void
    {
        $this->assertSame($esperado, ContributionCalculator::suggest($km, $tipo));
    }

    public function test_trata_una_distancia_negativa_como_cero(): void
    {
        $this->assertSame(2000, ContributionCalculator::suggest(-3.0, 'carro'));
    }

    public function test_lanza_excepcion_con_un_tipo_de_vehiculo_desconocido(): void
    {
        $this->expectException(InvalidArgumentException::class);

        ContributionCalculator::suggest(5.0, 'bicicleta');
    }
}
