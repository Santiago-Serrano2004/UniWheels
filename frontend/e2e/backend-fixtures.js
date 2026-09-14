// Helpers para provisionar/limpiar datos reales en el backend antes y después
// de los tests E2E — los flujos E2E de esta suite ejercitan el stack completo
// (no mocks), así que necesitan un conductor con vehículo aprobado y un
// pasajero reales en las bases de datos de los microservicios.
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const AUTH_DIR = path.join(ROOT, 'services', 'auth-service');
const VEHICLE_DIR = path.join(ROOT, 'services', 'vehicle-service');
const ROUTE_MATCHING_DIR = path.join(ROOT, 'services', 'route-matching-service');

function tinker(serviceDir, phpCode) {
  const out = execSync(`php artisan tinker --execute="${phpCode.replace(/"/g, '\\"')}"`, {
    cwd: serviceDir,
    encoding: 'utf8',
  });
  return out.trim();
}

export function createDriverWithApprovedVehicle({ emailPrefix, plate }) {
  const email = `${emailPrefix}@unab.edu.co`;

  const php = `
    use App\\Models\\User;
    use App\\Models\\UserWallet;
    use App\\Models\\UserReputationStats;
    use App\\Services\\JwtService;

    \\$u = User::firstOrCreate(
      ['email' => '${email}'],
      [
        'name' => 'E2E Driver ${emailPrefix}',
        'id_document_number' => '9' . substr(md5('${emailPrefix}'), 0, 7),
        'id_document_type' => 'CC',
        'phone_number' => '300' . substr(md5('${emailPrefix}'), 0, 7),
        'institution_id' => \\App\\Models\\Institution::first()->id,
        'member_type' => 'estudiante',
        'academic_program_or_department' => 'Ingeniería',
        'password' => Hash::make('Test1234!'),
        'is_driver' => true,
        'is_active' => true,
        'email_verified_at' => now(),
        'verification_expires_at' => now()->addMonths(6),
      ]
    );
    if (!\\$u->is_driver) { \\$u->is_driver = true; \\$u->save(); }
    if (!\\$u->hasRole('conductor')) { \\$u->assignRole('conductor'); }
    UserWallet::firstOrCreate(['user_id' => \\$u->id], ['balance_cop' => 50000]);
    UserReputationStats::firstOrCreate(['user_id' => \\$u->id]);
    echo \\$u->id . '|' . app(JwtService::class)->issue(\\$u);
  `;

  const [userId, token] = tinker(AUTH_DIR, php).split('|');

  const phpVehicle = `
    use App\\Models\\Vehicle;
    use Illuminate\\Support\\Str;
    \\$v = Vehicle::firstOrCreate(
      ['plate_number' => '${plate}'],
      [
        'id' => (string) Str::orderedUuid(),
        'user_id' => '${userId}',
        'vehicle_type' => 'carro',
        'brand' => 'Mazda',
        'model_line' => '3',
        'year' => 2021,
        'color' => 'Rojo',
        'available_seats' => 3,
        'has_ac' => true,
        'has_trunk' => true,
        'status' => 'aprobado',
      ]
    );
    if (\\$v->status !== 'aprobado') { \\$v->status = 'aprobado'; \\$v->save(); }
    echo \\$v->id;
  `;
  const vehicleId = tinker(VEHICLE_DIR, phpVehicle);

  return { userId, token, vehicleId, email };
}

// Cada test publica una ruta real vía la UI — se limpia entre tests para que
// "Iniciar en Cabina GPS" siga resolviendo a un único botón inequívoco.
export function deletePublishedRoutes(driverId) {
  tinker(ROUTE_MATCHING_DIR, `App\\Models\\Route::where('driver_id', '${driverId}')->forceDelete(); echo 'ok';`);
}

export function deleteTestDriver({ email, plate }) {
  tinker(VEHICLE_DIR, `App\\Models\\Vehicle::where('plate_number', '${plate}')->forceDelete(); echo 'ok';`);
  tinker(AUTH_DIR, `App\\Models\\User::where('email', '${email}')->forceDelete(); echo 'ok';`);
}
