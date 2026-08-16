<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends Controller
{
    /**
     * Obtener viajes disponibles en los corredores universitarios
     */
    public function getAvailableTrips(Request $request): JsonResponse
    {
        $viajes = [
            [
                'id' => 'ride_101',
                'driver_name' => 'Carlos Mendoza',
                'vehicle' => 'Mazda 3 (Rojo)',
                'plate' => 'KLU-492',
                'rating' => 4.95,
                'origin' => 'Cañaveral - C.C. Cañaveral',
                'destination' => 'Campus El Jardín',
                'departure_time' => '06:45 AM',
                'available_seats' => 3,
                'fare' => '$ 4.500',
                'fare_cop' => 4500,
                'detour_minutes' => '+4 min',
                'driver_avatar_initials' => 'CM',
            ],
            [
                'id' => 'ride_102',
                'driver_name' => 'Valentina Ríos',
                'vehicle' => 'Chevrolet Onix (Gris)',
                'plate' => 'WYX-810',
                'rating' => 4.88,
                'origin' => 'Cabecera - Parque San Pío',
                'destination' => 'CSU — Centro de Servicios Universitarios',
                'departure_time' => '07:15 AM',
                'available_seats' => 2,
                'fare' => '$ 4.000',
                'fare_cop' => 4000,
                'detour_minutes' => '+2 min',
                'driver_avatar_initials' => 'VR',
            ],
            [
                'id' => 'ride_103',
                'driver_name' => 'Juan Pablo Duarte',
                'vehicle' => 'Renault Duster (Blanco)',
                'plate' => 'LMN-304',
                'rating' => 4.92,
                'origin' => 'Provenza - Estación Metrolínea',
                'destination' => 'Campus El Bosque',
                'departure_time' => '06:30 AM',
                'available_seats' => 4,
                'fare' => '$ 4.500',
                'fare_cop' => 4500,
                'detour_minutes' => '+3 min',
                'driver_avatar_initials' => 'JD',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $viajes,
        ]);
    }

    /**
     * Obtener historial de viajes realizados por el conductor
     */
    public function getDriverHistory(Request $request): JsonResponse
    {
        $historial = [
            [
                'id' => 'dtrip_1',
                'date' => 'Hoy, 06:45 AM',
                'origin' => 'Cañaveral - C.C. Cañaveral',
                'destination' => 'Campus El Jardín',
                'duration' => '24 min',
                'distance' => '8.4 km',
                'total_earned' => 13500,
                'commission_paid' => 1620,
                'net_earned' => 11880,
                'passengers' => [
                    ['id' => 'p_1', 'name' => 'Laura Gómez', 'program' => 'Medicina', 'pickup' => 'Parque San Pío', 'rated' => false],
                    ['id' => 'p_2', 'name' => 'Mateo Cárdenas', 'program' => 'Ingeniería de Sistemas', 'pickup' => 'Estación Provenza', 'rated' => true, 'rating_score' => 5],
                    ['id' => 'p_3', 'name' => 'Camila Duarte', 'program' => 'Derecho', 'pickup' => 'Cañaveral', 'rated' => false],
                ],
            ],
            [
                'id' => 'dtrip_2',
                'date' => 'Ayer, 01:15 PM',
                'origin' => 'Campus El Jardín',
                'destination' => 'Cabecera - Parque Santander',
                'duration' => '18 min',
                'distance' => '6.2 km',
                'total_earned' => 9000,
                'commission_paid' => 1080,
                'net_earned' => 7920,
                'passengers' => [
                    ['id' => 'p_4', 'name' => 'Andrés Suárez', 'program' => 'Administración', 'pickup' => 'El Jardín', 'rated' => true, 'rating_score' => 5],
                    ['id' => 'p_5', 'name' => 'Sofía Rueda', 'program' => 'Psicología', 'pickup' => 'El Jardín', 'rated' => true, 'rating_score' => 5],
                ],
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $historial,
        ]);
    }

    /**
     * Obtener historial de viajes del pasajero
     */
    public function getPassengerHistory(Request $request): JsonResponse
    {
        $historial = [
            [
                'id' => 'ptrip_1',
                'date' => 'Ayer, 07:15 AM',
                'driver_name' => 'Valentina Ríos',
                'vehicle' => 'Chevrolet Onix (Gris)',
                'plate' => 'WYX-810',
                'pickup' => 'Cabecera - Parque San Pío',
                'destination' => 'Campus El Jardín',
                'duration' => '22 min',
                'distance' => '7.8 km',
                'fare_paid' => 4000,
                'rated' => false,
                'rating_score' => 5,
            ],
            [
                'id' => 'ptrip_2',
                'date' => '14 Ago, 06:30 PM',
                'driver_name' => 'Carlos Mendoza',
                'vehicle' => 'Mazda 3 (Rojo)',
                'plate' => 'KLU-492',
                'pickup' => 'Campus El Jardín',
                'destination' => 'Cañaveral - La Florida',
                'duration' => '26 min',
                'distance' => '8.4 km',
                'fare_paid' => 4500,
                'rated' => true,
                'rating_score' => 5,
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => $historial,
        ]);
    }

    /**
     * Obtener movimientos de la billetera de conductor
     */
    public function getWalletTransactions(Request $request): JsonResponse
    {
        $transacciones = [
            [
                'id' => 'tx_101',
                'title' => 'Bono de Activación de Conductor',
                'date' => 'Hoy',
                'amount' => '+$ 25.000',
                'amount_num' => 25000,
                'type' => 'credit',
                'desc' => 'Saldo inicial para publicación de rutas',
            ],
            [
                'id' => 'tx_102',
                'title' => 'Comisión Viaje Cañaveral ➔ El Jardín',
                'date' => 'Hoy, 07:10 AM',
                'amount' => '-$ 1.620',
                'amount_num' => -1620,
                'type' => 'debit',
                'desc' => 'Comisión de plataforma 12% sobre 3 cupos',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'balance_cop' => 25000,
                'transactions' => $transacciones,
            ],
        ]);
    }

    /**
     * Enviar calificación y actualizar reputación
     */
    public function submitRating(Request $request): JsonResponse
    {
        $request->validate([
            'target_type' => 'required|in:passenger,driver',
            'rating' => 'required|integer|min:1|max:5',
            'tags' => 'nullable|array',
            'comment' => 'nullable|string|max:500',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Calificación registrada exitosamente en el sistema de reputación.',
        ]);
    }
}
