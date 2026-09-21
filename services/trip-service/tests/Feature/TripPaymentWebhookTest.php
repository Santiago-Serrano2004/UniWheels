<?php

namespace Tests\Feature;

use App\Models\Trip;
use App\Services\WompiService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use ReflectionClass;
use Tests\TestCase;

class TripPaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.wompi.public_key' => 'pub_test_trip_fake',
            'services.wompi.integrity_secret' => 'integridad_trip_test',
            'services.wompi.events_secret' => 'eventos_trip_test',
        ]);
    }

    private function buildWompiWebhookPayload(string $referencia, int $montoCop, string $estado): array
    {
        $data = [
            'transaction' => [
                'id' => 'tr_'.Str::random(8),
                'reference' => $referencia,
                'status' => $estado,
                'amount_in_cents' => $montoCop * 100,
                'currency' => 'COP',
            ],
        ];
        $timestamp = time();
        $propiedades = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];

        $wompi = app(WompiService::class);
        $reflexion = new ReflectionClass($wompi);
        $metodo = $reflexion->getMethod('resolverValorPorRuta');
        $metodo->setAccessible(true);

        $cadena = '';
        foreach ($propiedades as $ruta) {
            $cadena .= (string) $metodo->invoke($wompi, $data, $ruta);
        }
        $cadena .= $timestamp.config('services.wompi.events_secret');

        return [
            'event' => 'transaction.updated',
            'data' => $data,
            'timestamp' => $timestamp,
            'signature' => [
                'checksum' => hash('sha256', $cadena),
                'properties' => $propiedades,
            ],
        ];
    }

    public function test_webhook_persiste_evento_con_firma_invalida(): void
    {
        $response = $this->postJson('/api/v1/webhooks/wompi', [
            'event' => 'transaction.updated',
            'timestamp' => time(),
            'signature' => ['checksum' => 'invalida', 'properties' => ['transaction.id']],
            'data' => ['transaction' => ['id' => 'x1', 'reference' => 'TP-fake', 'status' => 'APPROVED']],
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('wompi_webhook_events', [
            'reference' => 'TP-fake',
            'signature_valid' => false,
        ]);
    }

    public function test_webhook_persiste_evento_aprobado_y_confirma_pago_del_viaje(): void
    {
        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Serrano',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Cañaveral',
            'dropoff_address' => 'Campus El Jardín',
            'scheduled_pickup_time' => Carbon::now()->addHour(),
            'total_fare_cop' => 6000.00,
            'driver_amount_cop' => 5280.00,
            'platform_commission_cop' => 720.00,
            'payment_method' => 'card',
            'payment_reference' => 'TP-test-123456',
            'status' => 'confirmado',
            'boarding_pin' => '4829',
            'is_pin_verified' => false,
        ]);

        $payload = $this->buildWompiWebhookPayload('TP-test-123456', 6000, 'APPROVED');

        $response = $this->postJson('/api/v1/webhooks/wompi', $payload);

        $response->assertStatus(200);
        $this->assertNotNull($trip->fresh()->payment_confirmed_at);
        $this->assertDatabaseHas('wompi_webhook_events', [
            'reference' => 'TP-test-123456',
            'status' => 'APPROVED',
            'processed' => true,
        ]);
    }

    public function test_webhook_persiste_evento_declinado_sin_confirmar_pago(): void
    {
        $trip = Trip::create([
            'route_id' => (string) Str::uuid(),
            'driver_id' => (string) Str::uuid(),
            'passenger_id' => (string) Str::uuid(),
            'driver_name' => 'Carlos Mendoza',
            'passenger_name' => 'Santiago Serrano',
            'vehicle_plate' => 'KLU-492',
            'vehicle_model' => 'Mazda 3',
            'pickup_address' => 'Cañaveral',
            'dropoff_address' => 'Campus El Jardín',
            'scheduled_pickup_time' => Carbon::now()->addHour(),
            'total_fare_cop' => 6000.00,
            'driver_amount_cop' => 5280.00,
            'platform_commission_cop' => 720.00,
            'payment_method' => 'card',
            'payment_reference' => 'TP-test-declined',
            'status' => 'confirmado',
            'boarding_pin' => '4829',
            'is_pin_verified' => false,
        ]);

        $payload = $this->buildWompiWebhookPayload('TP-test-declined', 6000, 'DECLINED');

        $response = $this->postJson('/api/v1/webhooks/wompi', $payload);

        $response->assertStatus(200);
        $this->assertNull($trip->fresh()->payment_confirmed_at);
        $this->assertDatabaseHas('wompi_webhook_events', [
            'reference' => 'TP-test-declined',
            'status' => 'DECLINED',
            'signature_valid' => true,
        ]);
    }
}
