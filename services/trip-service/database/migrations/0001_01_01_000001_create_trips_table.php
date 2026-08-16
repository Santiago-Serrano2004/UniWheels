<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear la tabla principal de viajes y gestión del ciclo de vida.
     */
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('route_id')->index(); // Ruta asociada en route_gis_db
            $table->uuid('driver_id')->index(); // Conductor en auth_db
            $table->uuid('passenger_id')->index(); // Pasajero en auth_db
            $table->uuid('vehicle_id')->nullable()->index(); // Vehículo en vehicle_db

            $table->string('driver_name', 120)->nullable();
            $table->string('passenger_name', 120)->nullable();
            $table->string('vehicle_plate', 10)->nullable();
            $table->string('vehicle_model', 80)->nullable();

            $table->uuid('pickup_stop_id')->nullable();
            $table->string('pickup_address', 150);
            $table->uuid('dropoff_stop_id')->nullable();
            $table->string('dropoff_address', 150);

            // Protocolo Criptográfico de Abordaje (PIN de 4 dígitos)
            $table->string('boarding_pin', 10)->default('4829');
            $table->boolean('is_pin_verified')->default(false);
            $table->timestamp('pin_verified_at')->nullable();

            // Tarifas y Comisión Colaborativa
            $table->string('payment_method', 30)->default('efectivo'); // efectivo, nequi_directo, daviplata_directo, billetera_uniwheels
            $table->decimal('total_fare_cop', 10, 2); // Monto total pagado por el pasajero
            $table->decimal('driver_amount_cop', 10, 2); // Ganancia neta del conductor
            $table->decimal('platform_commission_cop', 10, 2)->default(0.00); // Markup / comisión operativa (12%)
            $table->string('commission_status', 30)->default('pendiente_debito'); // pendiente_debito, debitada_exitosamente, exonerada

            // Máquina de estados finita
            $table->string('status', 35)->default('confirmado'); 
            // solicitado, confirmado, en_camino, en_punto_encuentro, recogido, completado, cancelado_por_conductor, cancelado_por_pasajero, no_asistio

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
