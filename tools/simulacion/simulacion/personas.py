"""20 personas simuladas: 6 conductores (4 carro, 2 moto) y 14 pasajeros.

Los barrios son del área metropolitana de Bucaramanga (coordenadas aproximadas).
Las sedes de destino se leen de GET /institutions en tiempo de ejecución.
"""
from dataclasses import dataclass, field

from .config import DOMINIO, PREFIJO

BARRIOS = {
    "Cabecera del Llano": (7.1110, -73.1065),
    "Cañaveral": (7.0745, -73.1045),
    "Floridablanca Centro": (7.0625, -73.0865),
    "Piedecuesta": (6.9880, -73.0500),
    "Girón": (7.0700, -73.1690),
    "Provenza": (7.0995, -73.1160),
    "Real de Minas": (7.1205, -73.1285),
    "Lagos del Cacique": (7.0960, -73.1080),
    "Mutis": (7.1360, -73.1235),
    "Alarcón": (7.1290, -73.1185),
    "San Alonso": (7.1230, -73.1170),
    "Conucos": (7.1180, -73.1360),
    "Ciudadela Real de Minas": (7.1100, -73.1290),
    "Antonia Santos": (7.1390, -73.1090),
}


@dataclass
class Persona:
    clave: str
    rol: str  # conductor | pasajero
    nombre: str
    barrio: str
    indice: int
    tipo_vehiculo: str | None = None
    marca: str | None = None
    modelo: str | None = None
    anio: int | None = None
    placa: str | None = None
    # estado en tiempo de ejecución
    token: str | None = None
    user_id: str | None = None
    vehicle_id: str | None = None
    extra: dict = field(default_factory=dict)

    @property
    def email(self) -> str:
        return f"{PREFIJO}{self.clave}@{DOMINIO}"

    @property
    def lat_lng(self):
        return BARRIOS[self.barrio]

    @property
    def telefono(self) -> str:
        return f"3009{self.indice:06d}"

    @property
    def doc(self) -> str:
        return f"{PREFIJO}{self.indice:04d}"

    @property
    def codigo_estudiantil(self) -> str:
        return f"U99{self.indice:06d}"

    @property
    def licencia(self) -> str:
        return f"9900{self.indice:05d}"


def _crear():
    conductores = [
        ("c1", "Andrés Quintero", "Cabecera del Llano", "carro", "Mazda", "3", 2023, "SIM001"),
        ("c2", "Laura Mantilla", "Cañaveral", "carro", "Renault", "Sandero", 2022, "SIM002"),
        ("c3", "Camilo Ardila", "Floridablanca Centro", "carro", "Chevrolet", "Onix", 2024, "SIM003"),
        ("c4", "Diana Rueda", "Piedecuesta", "carro", "Kia", "Picanto", 2014, "SIM004"),  # exige RTM
        ("c5", "Julián Pinzón", "Girón", "moto", "Yamaha", "FZ 150", 2025, "SIM05A"),
        ("c6", "Marcela Ortiz", "Provenza", "moto", "Honda", "CB 125", 2025, "SIM06B"),
    ]
    pasajeros = [
        ("p1", "Sofía Gómez", "Cabecera del Llano"),
        ("p2", "Mateo Díaz", "Lagos del Cacique"),
        ("p3", "Valentina Rojas", "Cañaveral"),
        ("p4", "Santiago Parra", "Floridablanca Centro"),
        ("p5", "Isabella Suárez", "Real de Minas"),
        ("p6", "Daniel Camacho", "Provenza"),
        ("p7", "Camila Vargas", "Mutis"),
        ("p8", "Sebastián Niño", "Piedecuesta"),
        ("p9", "Mariana Cárdenas", "Girón"),
        ("p10", "Felipe Duarte", "Alarcón"),
        ("p11", "Juliana Mejía", "San Alonso"),
        ("p12", "Nicolás Becerra", "Conucos"),
        ("p13", "Paula Ríos", "Ciudadela Real de Minas"),
        ("p14", "Esteban Salazar", "Antonia Santos"),
    ]
    personas = {}
    i = 1
    for clave, nombre, barrio, tipo, marca, modelo, anio, placa in conductores:
        personas[clave] = Persona(clave, "conductor", nombre, barrio, i, tipo, marca, modelo, anio, placa)
        i += 1
    for clave, nombre, barrio in pasajeros:
        personas[clave] = Persona(clave, "pasajero", nombre, barrio, i)
        i += 1
    return personas


PERSONAS: dict[str, Persona] = _crear()
CONDUCTORES = [p for p in PERSONAS.values() if p.rol == "conductor"]
PASAJEROS = [p for p in PERSONAS.values() if p.rol == "pasajero"]
