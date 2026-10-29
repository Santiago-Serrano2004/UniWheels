# Guía de grabación del anuncio (flujo completo, 60 s)

Necesitas **dos cuentas de prueba**: un **conductor** con vehículo aprobado y un **pasajero**. Lo ideal son dos teléfonos; si solo tienes uno, graba primero todo lo del conductor y después lo del pasajero.

## Cuentas listas (ya creadas en producción)
| Rol | Nombre visible | Qué tiene |
|---|---|---|
| Conductor | Andrés R. | Rol de conductor, carro **Mazda 2 gris, placa UNW123, 4 cupos, aprobado** |
| Pasajera | Laura M. | Cuenta de estudiante verificada |

- Los correos y las contraseñas están en **`marketing/anuncio/.cuentas-demo.txt`**, solo en tu PC. **No se sube al repo.**
- **Orden recomendado:**
  1. Con el conductor, publica una ruta para **mañana temprano**, desde un barrio (por ejemplo Cabecera) hacia el campus.
  2. Con la pasajera, búscala desde un punto cercano y resérvala.
  3. Sigue con el resto del flujo.
- **Al terminar:** elimina las dos cuentas desde la app (Perfil > Eliminar cuenta). Si las vas a reutilizar, por lo menos cancela los viajes que hayan quedado activos.

## Antes de grabar
- Activa **No molestar**, para que no aparezcan notificaciones personales.
- Batería cargada, Wi-Fi visible y hora limpia (por ejemplo, la mañana).
- Usa nombres de prueba en las cuentas (por ejemplo "Andrés R." y "Laura M."). **Nada de datos reales.**
- Grabar: Centro de Control > botón de grabación de pantalla (sin micrófono).
- Cada clip dura **lo indicado o un poco más**: el anuncio recorta. Toca la pantalla con calma, sin prisa.
- Copia los videos a `public/clips/` con el **nombre exacto** de la tabla y escríbelo en `src/clips.ts`.

## Clips
| # | Archivo | Quién | Duración | Qué hacer en pantalla |
|---|---|---|---|---|
| 1 | `conductor_publicar.mp4` | Conductor | 7 s | Abrir "Publicar ruta", elegir origen, destino y hora, ver el **aporte sugerido**, tocar "75 %" y luego "Publicar" |
| 2 | `pasajero_buscar.mp4` | Pasajero | 6 s | Inicio: elegir "Hacia el campus" y ver aparecer las rutas, entre ellas la recién publicada |
| 3 | `pasajero_reservar.mp4` | Pasajero | 6 s | Abrir esa ruta, ver el mapa y el **aporte**, tocar "Reservar cupo" y ver la confirmación |
| 4 | `conductor_reserva_recibida.mp4` | Conductor | 6 s | Su pantalla de inicio o de ruta mostrando que llegó la reserva del pasajero |
| 5 | `pasajero_viaje_activo.mp4` | Pasajero | 6 s | La tarjeta de su viaje activo: conductor, vehículo, punto de encuentro y aporte |
| 6 | `conductor_navegacion.mp4` | Conductor | 6 s | Iniciar el viaje y ver el mapa con la ruta hacia el punto de recogida |
| 7 | `pasajero_pin.mp4` | Pasajero | 7 s | La pantalla con su **PIN de 4 dígitos** |
| 8 | `conductor_pin.mp4` | Conductor | 7 s | Escribir el PIN y ver "PIN correcto, viaje iniciado" |
| 9 | `pasajero_en_viaje.mp4` | Pasajero | 5 s | El viaje en curso, con el mapa y el botón SOS visible. **No lo toques** |
| 10 | `conductor_completar.mp4` | Conductor | 6 s | Al llegar: ver el aporte a recibir y tocar "Completar viaje" |
| 11 | `pasajero_calificar.mp4` | Pasajero | 4 s | Poner 5 estrellas y enviar |

> Los clips 4 y 5 aparecen **lado a lado**, igual que el 7 y el 8. Si los grabas en el mismo momento con dos teléfonos, el anuncio se ve más real.

## Exportar
```bash
cd marketing/anuncio
npm run studio      # vista previa en el navegador para ajustar
npm run render      # exporta out/uniwheels-anuncio-9x16.mp4 y -16x9.mp4
```

Si un clip queda corto o largo, avisa: se ajusta el tiempo de su escena en `src/Anuncio.tsx` (`seg`).
