<?php

namespace Tests\Feature\Admin;

use App\Models\Trip;
use App\Models\WompiWebhookEvent;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminTripsAndPaymentsTest extends TestCase
{
    use RefreshDatabase;

    protected function crearViaje(array $attributes = []): Trip
    {
        return Trip::create(array_merge([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
            'driver_name' => 'Conductor Prueba',
            'passenger_name' => 'Pasajero Prueba',
            'vehicle_plate' => 'KLU492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'UNAB Central',
            'dropoff_address' => 'Cabecera',
            'boarding_pin' => '1234',
            'is_pin_verified' => true,
            'total_fare_cop' => 10000,
            'driver_amount_cop' => 8800,
            'platform_commission_cop' => 1200,
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_COMPLETADO,
            'payment_method' => Trip::PAYMENT_METHOD_EFECTIVO,
            'scheduled_pickup_time' => Carbon::now()->subHours(2),
            'actual_pickup_time' => Carbon::now()->subHours(2),
            'actual_dropoff_time' => Carbon::now()->subHours(1),
        ], $attributes));
    }

    public function test_rutas_de_viajes_y_pagos_requieren_rol_administrador(): void
    {
        $userId = (string) Str::uuid();

        $this->getJson('/api/v1/admin/trips')->assertStatus(401);
        $this->getJson('/api/v1/admin/payments/trips')->assertStatus(401);

        $tokenUsuario = $this->jwtDePrueba($userId, ['estudiante']);

        $this->withToken($tokenUsuario)
            ->getJson('/api/v1/admin/trips')
            ->assertStatus(403);

        $this->withToken($tokenUsuario)
            ->getJson('/api/v1/admin/payments/trips')
            ->assertStatus(403);
    }

    public function test_un_administrador_puede_listar_viajes_con_filtros(): void
    {
        $adminId = (string) Str::uuid();
        $tokenAdmin = $this->jwtDePrueba($adminId, ['administrador']);

        $v1 = $this->crearViaje([
            'status' => Trip::STATUS_COMPLETADO,
            'created_at' => Carbon::now()->subDays(2),
        ]);

        $v2 = $this->crearViaje([
            'status' => Trip::STATUS_CANCELADO_CONDUCTOR,
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $response = $this->withToken($tokenAdmin)
            ->getJson('/api/v1/admin/trips?status=completado');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $v1->id)
            ->assertJsonPath('data.0.status', 'completado');
    }

    public function test_un_administrador_puede_consultar_pagos_de_viajes_con_totales(): void
    {
        $adminId = (string) Str::uuid();
        $tokenAdmin = $this->jwtDePrueba($adminId, ['administrador']);

        $referencia = 'TP-'.(string) Str::uuid().'-'.time();

        $trip = $this->crearViaje([
            'payment_reference' => $referencia,
            'payment_method' => Trip::PAYMENT_METHOD_TARJETA,
            'total_fare_cop' => 12000,
            'platform_commission_cop' => 1440,
            'commission_status' => 'retenido_tarjeta',
            'status' => Trip::STATUS_COMPLETADO,
            'payment_confirmed_at' => now(),
        ]);

        // Otro viaje en efectivo con comisión pendiente
        $this->crearViaje([
            'payment_method' => Trip::PAYMENT_METHOD_EFECTIVO,
            'total_fare_cop' => 8000,
            'platform_commission_cop' => 960,
            'commission_status' => 'pendiente_debito',
            'status' => Trip::STATUS_COMPLETADO,
        ]);

        $evento = WompiWebhookEvent::create([
            'event_type' => 'transaction.updated',
            'transaction_id' => 'tx-12345',
            'reference' => $referencia,
            'status' => 'APPROVED',
            'amount_in_cents' => 1200000,
            'currency' => 'COP',
            'signature_valid' => true,
            'processed' => true,
            'processed_at' => now(),
            'payload' => ['data' => ['transaction' => ['id' => 'tx-12345']]],
        ]);

        $response = $this->withToken($tokenAdmin)
            ->getJson('/api/v1/admin/payments/trips?status=APPROVED');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'summary' => [
                    'total_collected_cop' => 20000.0,
                    'platform_commission_cop' => 2400.0,
                    'pending_commission_cop' => 960.0,
                ],
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $evento->id)
            ->assertJsonPath('data.0.reference', $referencia)
            ->assertJsonPath('data.0.trip.id', $trip->id)
            ->assertJsonPath('data.0.trip.vehicle_plate', 'KLU492');
    }
}
