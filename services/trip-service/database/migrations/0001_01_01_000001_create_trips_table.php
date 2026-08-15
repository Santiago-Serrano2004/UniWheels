<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla principal de viajes confirmados y gestión de tarifas/comisiones.
     */
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('route_id')->index(); // Ruta asociada en route_gis_db
            $table->uuid('driver_id')->index(); // Conductor en auth_db
            $table->uuid('passenger_id')->index(); // Pasajero en auth_db
            $table->uuid('vehicle_id')->index(); // Vehículo en vehicle_db

            $table->uuid('pickup_stop_id'); // Parada de recogida
            $table->uuid('dropoff_stop_id')->nullable(); // Campus o parada de bajada

            // Métodos de pago y liquidación de markup/comisión
            $table->string('payment_method', 30)->default('efectivo'); // efectivo, nequi_directo, daviplata_directo, billetera_uniwheels
            $table->decimal('total_fare_cop', 10, 2); // Monto total pagado por el pasajero
            $table->decimal('driver_amount_cop', 10, 2); // Ganancia neta del conductor
            $table->decimal('platform_commission_cop', 10, 2); // Markup / comisión de UniWheels (12-15%)
            $table->string('commission_status', 30)->default('pendiente_debito'); // pendiente_debito, debitada_exitosamente, exonerada

            // Ciclo de vida y máquina de estados
            $table->string('status', 35)->default('confirmado'); 
            // confirmado, en_camino_recogida, en_punto_encuentro, pasajero_a_bordo, en_curso, completado, cancelado_por_conductor, cancelado_por_pasajero, no_asistio

            $table->timestamp('scheduled_pickup_time');
            $table->timestamp('actual_pickup_time')->nullable();
            $table->timestamp('actual_dropoff_time')->nullable();

            $table->softDeletes();
            $table->timestamps();

            $table->index(['driver_id', 'status']);
            $table->index(['passenger_id', 'status']);
        });
    }

    /**
     * Revertir las migraciones.
     */
    public function down(): void
    {
        Schema::dropIfExists('trips');
    }
};
