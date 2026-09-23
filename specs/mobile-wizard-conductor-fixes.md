# Arreglos del wizard de registro de conductor (mobile + catálogo de vehículos)

**Documento:** `specs/mobile-wizard-conductor-fixes.md`
**Fecha:** 2026-09-23
**Estado:** Aprobado por Santiago (reporte de pruebas en iPhone) — en implementación

---

## Contexto mínimo (ya diagnosticado contra el código, no repetir)

Santiago probó el wizard en iPhone y reportó: el paso 1 no ocupa toda la pantalla; faltan marcas; los modelos no coinciden con la marca; el selector de fecha muestra la rueda de iOS sin forma de cerrarla; no se valida que se hayan subido las fotos; y la firma no se puede hacer bien porque el scroll de la pantalla se lleva el gesto.

Causas encontradas:

1. **`services/vehicle-service/app/Services/NhtsaVehicleApiService.php`**:
   - `getBrands()` hace `->take(100)`: de toda la lista de NHTSA (`GetMakesForVehicleType/{car|motorcycle}`) solo quedan las primeras 100 marcas.
   - `Cache::remember(..., 30 días)` guarda también el resultado cuando NHTSA falla (timeout de 4 s): la lista incompleta queda un mes.
   - `array_unique` distingue mayúsculas, así que la marca local "Chevrolet" y la de NHTSA "CHEVROLET" salen duplicadas. Lo mismo pasa en `getModelsForBrand()`.
2. **`packages/shared/src/api.js`**:
   - `getCatalogBrands()` no manda `type`. El backend espera `type=carro|moto` (`VehicleCatalogController@brands`, por defecto `carro`), así que para moto trae marcas de carro. Mobile maneja `tipoVehiculo` como `'car' | 'motorcycle'`.
   - `getCatalogModels(brandId)` manda `params: { brand_id }`, pero el backend lee `brand` (`VehicleCatalogController@models`). **El backend nunca recibe la marca**; esa es la causa principal de que los modelos no coincidan.
3. **`mobile/src/components/driver/DriverRegistrationWizard.tsx`** (~líneas 88-135):
   - El efecto de marcas depende de `[tipoVehiculo, marca]`: vuelve a pedir marcas cada vez que cambia la marca.
   - La marca por defecto (`'Chevrolet'` / `'Yamaha'`) se compara sin ignorar mayúsculas contra nombres de NHTSA en mayúsculas.
   - Si la API devuelve **0 modelos**, no se actualiza `modelosDisponibles` y **quedan los modelos de la marca anterior**.
4. **`mobile/src/components/FormDatePicker.tsx`**: en iOS usa `display="spinner"` inline; la rueda aparece dentro del formulario sin botón para cerrarla.
5. **Validación de fotos**: `validarPaso` no exige las fotos. Solo las sube si están (`if (fotoSoat) ...`, `if (requiereTecno && fotoTecno)`, `if (fotoLicencia)`, ~línea 313-335).
6. **Firma** (`wizard-steps/HabeasDataSignatureStep.tsx`): `PanResponder` + `react-native-svg` dentro del `ScrollView` del wizard, así que el scroll le roba el gesto.
7. **Layout**: el wizard no ocupa todo el alto disponible entre el header y la barra de pestañas.

## Alcance

- Se toca: `vehicle-service` (servicio NHTSA + tests), `packages/shared/src/api.js` (2 métodos del catálogo) y `mobile/` (wizard, FormSelect, FormDatePicker, paso de firma).
- `frontend/` (web): congelado, no se toca. La web no usa estos endpoints del catálogo.
- Las validaciones de fotos y la firma en modal son mejoras pedidas explícitamente; no replican la web.

## Tareas

### Tarea 1 — Catálogo completo y bien cacheado (vehicle-service)

En `NhtsaVehicleApiService.php`:
- Quitar `->take(100)`.
- Unificar sin distinguir mayúsculas: si una marca o modelo existe local y en NHTSA, queda uno solo y tiene prioridad el nombre local (mejor capitalizado). Orden alfabético sin distinguir mayúsculas.
- Cachear 30 días **solo si NHTSA respondió bien y con resultados**. Si falló o vino vacío, devolver la lista local y cachearla solo 10 minutos para reintentar pronto.
- Mismo tratamiento en `getModelsForBrand()`.
- Tests Pest con `Http::fake`: más de 100 marcas se devuelven completas; los duplicados por mayúsculas se unifican; un fallo de NHTSA no queda cacheado 30 días; los modelos de una marca no se mezclan con los de otra.

**Verificación**: `composer test` y `./vendor/bin/pint --test` en vehicle-service. Commit: `fix(vehicle-service): catalogo NHTSA completo, sin duplicados y sin cachear fallos`.

### Tarea 2 — Parámetros correctos en `packages/shared/src/api.js`

- `getCatalogBrands(tipoVehiculo)`: mandar `params: { type }` mapeando `'car'|'carro'` → `'carro'` y `'motorcycle'|'moto'` → `'moto'`.
- `getCatalogModels(marca)`: mandar `params: { brand: marca }` (no `brand_id`). Renombrar el parámetro.

**Verificación**: `cd mobile && npx tsc --noEmit`. Commit: `fix(shared): enviar tipo de vehiculo y marca con los nombres que espera el backend`.

### Tarea 3 — Marcas y modelos en el wizard + selector con búsqueda

En `DriverRegistrationWizard.tsx`:
- El efecto de marcas depende solo de `tipoVehiculo` y llama `getCatalogBrands(tipoVehiculo)`. La marca por defecto se busca sin distinguir mayúsculas; si no está, queda la primera de la lista.
- El efecto de modelos llama `getCatalogModels(marca)` y **siempre reemplaza la lista**: si viene vacía, queda `[]` y se limpia `modelo`. Con la opción de marca personalizada no se consulta el catálogo.
- Hay cientos de marcas, así que `FormSelect` necesita búsqueda: agregar una prop opcional `searchable?: boolean` que muestre un campo de búsqueda arriba de la lista en la hoja inferior (filtra sin distinguir mayúsculas ni acentos). El resto de los usos de `FormSelect` no cambia. Usarla en marca y modelo.

**Verificación**: tsc/lint. Commit: `fix(mobile): marcas y modelos del wizard coinciden y se pueden buscar`.

### Tarea 4 — Layout del wizard a pantalla completa

El wizard ocupa todo el alto disponible entre el header y la barra de pestañas en todos los pasos (revisar `flex-1` en la cadena `index.tsx` → `DriverOnboardingView` → `DriverRegistrationWizard` → pasos). Los botones de navegación quedan visibles y el contenido hace scroll dentro de ese espacio.

**Verificación**: tsc/lint. Commit: `fix(mobile): wizard de conductor a pantalla completa`.

### Tarea 5 — Selector de fecha que se puede cerrar

`FormDatePicker.tsx`:
- **iOS**: el campo muestra la fecha. Al tocarlo se abre una hoja inferior (mismo estilo que el modal de `FormSelect`) con el `DateTimePicker` y botones "Cancelar" / "Listo". Nada inline.
- **Android**: se mantiene el diálogo nativo, que ya se cierra solo al elegir o cancelar. Verificar que no quede montado después de cerrar.

Misma API de props.

**Verificación**: tsc/lint. Commit: `fix(mobile): selector de fecha en hoja inferior en iOS`.

### Tarea 6 — Fotos obligatorias

`validarPaso` impide avanzar si falta alguna foto que ese paso pide. Tecnomecánica solo si `requiereTecno`. El mensaje sale en el mismo banner de error que las demás validaciones, diciendo qué foto falta. Revisar todos los tipos de foto del wizard (`configFotoActual.tipo`) y el envío final. Validar también el formato: imagen (jpg/png/heic); si hoy se acepta PDF, mantenerlo, con el límite de 10 MB del backend.

**Verificación**: tsc/lint. Commit: `feat(mobile): exigir las fotos de documentos en el wizard de conductor`.

### Tarea 7 — Firma en un modal a pantalla completa

En `HabeasDataSignatureStep.tsx`, el paso muestra la vista previa de la firma (o un aviso de "Sin firma") y un botón "Firmar" que abre un `Modal` a pantalla completa (sin `ScrollView`) con el lienzo (`PanResponder` + `Svg`, la misma lógica que hoy) y los botones "Limpiar", "Cancelar" y "Guardar firma". Guardar cierra el modal y llena `signatureSvgPath`. No se puede terminar el registro sin firma (validación con mensaje). Respetar el safe area.

**Verificación**: tsc/lint. Commit: `feat(mobile): firma de Habeas Data en modal a pantalla completa`.

---

## Verificación final

`cd mobile && npx expo export --platform ios` compila; después Santiago lo prueba en el iPhone. El despliegue de vehicle-service a producción lo hace Claude.
