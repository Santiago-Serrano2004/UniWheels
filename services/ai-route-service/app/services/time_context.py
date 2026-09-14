from datetime import datetime


def parse_departure_hour(departure_time: str, default_hour: float = 7.0) -> float:
    """
    Convierte la hora de salida del conductor (ej. "06:45 AM") a un float de hora
    del día (6.75) que espera el modelo XGBoost. Antes esto se ignoraba por
    completo en la llamada de inferencia y siempre se usaba el valor por defecto,
    sin importar la hora real de la ruta evaluada.
    """
    if not departure_time:
        return default_hour

    formatos = ["%I:%M %p", "%H:%M", "%I:%M%p"]
    for formato in formatos:
        try:
            dt = datetime.strptime(departure_time.strip(), formato)
            return dt.hour + dt.minute / 60.0
        except ValueError:
            continue

    return default_hour


def current_day_of_week() -> int:
    """
    Día de la semana real (0=Lunes ... 6=Domingo, igual convención que el dataset
    de entrenamiento) en el momento de la solicitud — no hay fecha explícita del
    viaje en el payload, así que la fecha actual del servidor es la mejor señal
    real disponible (mucho mejor que un valor fijo de "siempre martes").
    """
    return datetime.now().weekday()
