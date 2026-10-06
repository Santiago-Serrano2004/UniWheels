<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Aporte sugerido por cupo: base + distancia_km × valor_por_km, redondeado hacia
 * arriba a la centena. Es también el tope que el conductor puede indicar.
 */
class ContributionCalculator
{
    public static function suggest(float $distanceKm, string $vehicleType): int
    {
        $tarifa = config("uniwheels.contribution.{$vehicleType}");

        if (! is_array($tarifa)) {
            throw new InvalidArgumentException("Tipo de vehículo desconocido: {$vehicleType}");
        }

        $valor = $tarifa['base'] + max(0.0, $distanceKm) * $tarifa['per_km'];

        // round() previo evita que el ruido de punto flotante (p. ej. 5000.000000001) suba una centena.
        return (int) (ceil(round($valor, 6) / 100) * 100);
    }
}
