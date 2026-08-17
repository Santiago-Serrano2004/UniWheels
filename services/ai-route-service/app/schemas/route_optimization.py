from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum


class ModalityEnum(str, Enum):
    DIRECT = "modalidad_1_directa"
    DETOUR = "modalidad_2_desvio"
    REJECTED = "no_viable"


class LatLng(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0, description="Latitud WGS84")
    lng: float = Field(..., ge=-180.0, le=180.0, description="Longitud WGS84")


class RouteSegment(BaseModel):
    origin: LatLng
    destination: LatLng
    estimated_duration_seconds: float
    distance_meters: float


class PassengerRequestSchema(BaseModel):
    passenger_id: str
    passenger_name: str
    pickup_location: LatLng
    pickup_address: str
    destination_location: LatLng
    destination_address: str
    gender: str = Field(default="F", description="Género: 'F' o 'M'")
    faculty: Optional[str] = Field(default=None, description="Facultad o programa académico")
    rating: float = Field(default=5.0, ge=1.0, le=5.0)
    women_only_required: bool = Field(default=False, description="Filtro estricto Solo Mujeres")
    mutual_friends_count: int = Field(default=0, ge=0)
    max_walking_distance_meters: float = 300.0
    desired_arrival_time: Optional[str] = None # ISO format o "07:00 AM"


class DriverRouteSchema(BaseModel):
    driver_id: str
    driver_name: str
    origin: LatLng
    destination: LatLng
    driver_gender: str = Field(default="M", description="Género del conductor: 'F' o 'M'")
    driver_faculty: Optional[str] = Field(default=None, description="Facultad del conductor")
    driver_rating: float = Field(default=5.0, ge=1.0, le=5.0)
    waypoints: List[LatLng] = []
    vehicle_capacity: int = Field(default=3, ge=1, le=6)
    departure_time: str
    max_allowed_detour_minutes: float = Field(default=12.0, ge=2.0, le=30.0)


class RouteEvaluationRequest(BaseModel):
    driver_route: DriverRouteSchema
    passenger_request: PassengerRequestSchema


class CarbonLedgerReport(BaseModel):
    gross_emissions_avoided_kg: float
    net_trip_emissions_kg: float
    gasoline_saved_liters: float
    trees_equivalent_annual: float
    eco_points_earned: int
    vehicle_type_evaluated: str = "gasolina_1_6l"
    iso_14064_compliance_statement: str


class RouteEvaluationResponse(BaseModel):
    is_viable: bool
    modality: ModalityEnum
    detour_minutes: float
    original_duration_minutes: float
    new_total_duration_minutes: float
    suggested_fare_cop: int
    traffic_status: str
    traffic_multiplier_kappa: float
    recommended_pickup: LatLng
    is_smart_pickup_applied: bool = False
    walking_distance_meters: float = 0.0
    walking_time_minutes: float = 0.0
    driver_time_saved_minutes: float = 0.0
    walking_instructions: str = ""
    turn_penalty_seconds: float = 0.0
    turn_breakdown: Optional[Dict[str, int]] = None
    affinity_score: float = 5.0
    affinity_tags: List[str] = []
    carbon_report: Optional[CarbonLedgerReport] = None
    polyline_coordinates: List[List[float]]
    summary_message: str


class RouteStop(BaseModel):
    stop_index: int
    type: str # "origin", "pickup", "dropoff", "destination"
    user_id: str
    user_name: str
    location: LatLng
    address: str
    estimated_arrival: str
    is_smart_walking_stop: bool = False
    walking_distance_meters: float = 0.0
    delay_from_original_seconds: float = 0.0


class MultiPassengerALNSRequest(BaseModel):
    driver_route: DriverRouteSchema
    candidate_passengers: List[PassengerRequestSchema]
    traffic_layer_enabled: bool = True


class MultiPassengerALNSResponse(BaseModel):
    success: bool
    accepted_passengers: List[str]
    rejected_passengers: List[str]
    ordered_stops: List[RouteStop]
    total_distance_km: float
    total_duration_minutes: float
    total_detour_minutes: float
    turn_penalty_seconds: float = 0.0
    turn_breakdown: Optional[Dict[str, int]] = None
    avg_affinity_score: float = 5.0
    affinity_tags: List[str] = []
    co2_reduction_kg: float
    carbon_report: Optional[CarbonLedgerReport] = None
    alns_cost_score: float
    route_polyline: List[List[float]]
    fare_breakdown: Dict[str, int]


class DynamicReoptimizationRequest(BaseModel):
    current_driver_location: LatLng
    current_heading_degrees: Optional[float] = None
    driver_id: str
    driver_name: str
    driver_gender: str = "M"
    driver_capacity: int = 3
    max_allowed_detour_minutes: float = 10.0
    passengers_on_board_ids: List[str] = []
    active_remaining_stops: List[Dict[str, Any]] = []
    new_candidate_passenger: PassengerRequestSchema
    destination_location: LatLng
    destination_address: str = "UNAB Campus El Jardín"


class DynamicReoptimizationResponse(BaseModel):
    accepted: bool
    reason: str
    new_ordered_stops: List[RouteStop]
    detour_added_minutes: float
    new_eta_minutes: float
    new_route_polyline: List[List[float]]
    updated_passenger_etas: Dict[str, str]
    notification_prompt: str
