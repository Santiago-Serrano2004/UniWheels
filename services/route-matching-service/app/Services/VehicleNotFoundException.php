<?php

namespace App\Services;

use RuntimeException;

/**
 * vehicle-service respondió 404: el vehículo no existe (SIM-019). Se distingue de un
 * fallo de red o un 5xx, que es un problema temporal (503).
 */
class VehicleNotFoundException extends RuntimeException {}
