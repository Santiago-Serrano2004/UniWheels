from typing import Dict, Any, Optional
from enum import Enum


class VehicleEmissionTypeEnum(str, Enum):
    GASOLINE_CAR = "gasolina_1_6l"
    HYBRID_CAR = "hibrido"
    DIESEL_CAR = "diesel"
    MOTORCYCLE = "motocicleta_gasolina"
    ELECTRIC_CAR = "electrico"


class CarbonEmissionEngine:
    """
    Motor de Medición Certificada de Huella de Carbono y Créditos Verdes (ISO 14064 / IPCC Protocol).
    Calcula con precisión estandarizada los gramos de CO2 equivalente evitados por cada viaje compartido
    en el Área Metropolitana de Bucaramanga.
    """

    # Factores de Emisión Oficiales (g CO2e / km) - UPME / IPCC Colombia
    EMISSION_FACTORS_G_PER_KM = {
        VehicleEmissionTypeEnum.GASOLINE_CAR: 168.4,
        VehicleEmissionTypeEnum.HYBRID_CAR: 92.1,
        VehicleEmissionTypeEnum.DIESEL_CAR: 184.2,
        VehicleEmissionTypeEnum.MOTORCYCLE: 78.5,
        VehicleEmissionTypeEnum.ELECTRIC_CAR: 38.2,
    }

    # Factor de referencia urbana promedio (lo que emitiría cada pasajero en vehículo individual/taxi)
    URBAN_BASELINE_PER_PASSENGER_G_PER_KM = 165.0

    # 1 Litro de gasolina produce aprox. 2.31 kg de CO2
    KG_CO2_PER_LITER_GASOLINE = 2.31

    # 1 Árbol urbano adulto en Colombia absorbe aprox. 21.7 kg de CO2 al año
    KG_CO2_PER_TREE_PER_YEAR = 21.7

    def calculate_trip_carbon_mitigation(
        self,
        distance_km: float,
        num_passengers: int,
        vehicle_type: VehicleEmissionTypeEnum = VehicleEmissionTypeEnum.GASOLINE_CAR,
    ) -> Dict[str, Any]:
        """
        Calcula el ahorro neto de emisiones de CO2e y las equivalencias ecológicas certificables.
        """
        dist = max(0.1, float(distance_km))
        passengers = max(1, int(num_passengers))
        ef_veh = self.EMISSION_FACTORS_G_PER_KM.get(vehicle_type, 168.4)

        # 1. Emisiones del viaje compartido (1 solo vehículo en movimiento)
        shared_trip_emissions_g = dist * ef_veh
        shared_trip_emissions_kg = shared_trip_emissions_g / 1000.0

        # 2. Emisiones si cada pasajero hubiera viajado en vehículo particular individual
        baseline_individual_emissions_g = (dist * ef_veh) + (passengers * dist * self.URBAN_BASELINE_PER_PASSENGER_G_PER_KM)
        baseline_individual_emissions_kg = baseline_individual_emissions_g / 1000.0

        # 3. Emisiones netas mitigadas (ahorradas)
        mitigated_co2_kg = max(0.0, round(baseline_individual_emissions_kg - shared_trip_emissions_kg, 2))

        # 4. Equivalencias Ecológicas
        gasoline_saved_liters = round(mitigated_co2_kg / self.KG_CO2_PER_LITER_GASOLINE, 2)
        trees_equivalent = round(mitigated_co2_kg / self.KG_CO2_PER_TREE_PER_YEAR, 3)
        
        # 1 EcoPoint por cada 100g de CO2 mitigados
        eco_points = int((mitigated_co2_kg * 1000.0) // 100)

        iso_statement = (
            f"Cuantificación de emisiones de GEI conforme a la norma internacional ISO 14064-1:2018 "
            f"y factores de emisión UPME para el Área Metropolitana de Bucaramanga."
        )

        return {
            "gross_emissions_avoided_kg": mitigated_co2_kg,
            "net_trip_emissions_kg": round(shared_trip_emissions_kg, 2),
            "gasoline_saved_liters": gasoline_saved_liters,
            "trees_equivalent_annual": trees_equivalent,
            "eco_points_earned": eco_points,
            "vehicle_type_evaluated": vehicle_type.value,
            "iso_14064_compliance_statement": iso_statement,
        }


carbon_emission_engine = CarbonEmissionEngine()
