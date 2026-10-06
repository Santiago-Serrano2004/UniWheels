<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\GetAdminWaitlistRequest;
use App\Models\WaitlistEntry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminWaitlistController extends Controller
{
    public function index(GetAdminWaitlistRequest $request): JsonResponse
    {
        $perPage = (int) ($request->input('per_page') ?: 15);
        $entries = $this->filtered($request)
            ->with('campus:id,name')
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => collect($entries->items())->map(fn (WaitlistEntry $e) => [
                'id' => $e->id,
                'email' => $e->email,
                'role' => $e->role,
                'neighborhood' => $e->neighborhood,
                'campus_id' => $e->campus_id,
                'campus_name' => $e->campus?->name,
                'usual_time' => $e->usual_time,
                'direction' => $e->direction,
                'consent_at' => $e->consent_at?->toIso8601String(),
                'created_at' => $e->created_at?->toIso8601String(),
            ])->all(),
            'meta' => [
                'current_page' => $entries->currentPage(),
                'last_page' => $entries->lastPage(),
                'per_page' => $entries->perPage(),
                'total' => $entries->total(),
            ],
            'totals' => $this->totals(),
        ]);
    }

    public function export(GetAdminWaitlistRequest $request): StreamedResponse
    {
        $query = $this->filtered($request)->with('campus:id,name')->orderBy('created_at');

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['id', 'email', 'role', 'neighborhood', 'campus_id', 'campus', 'usual_time', 'direction', 'consent_at', 'created_at']);
            foreach ($query->cursor() as $e) {
                fputcsv($out, [
                    $e->id, $e->email, $e->role, $this->csvSafe($e->neighborhood), $e->campus_id,
                    $this->csvSafe($e->campus?->name), $e->usual_time, $e->direction,
                    $e->consent_at?->toIso8601String(), $e->created_at?->toIso8601String(),
                ]);
            }
            fclose($out);
        }, 'lista-espera.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function filtered(GetAdminWaitlistRequest $request): Builder
    {
        return WaitlistEntry::query()
            ->when($request->input('role'), fn (Builder $q, $v) => $q->where('role', $v))
            ->when($request->input('campus_id'), fn (Builder $q, $v) => $q->where('campus_id', $v))
            ->when($request->input('direction'), fn (Builder $q, $v) => $q->where('direction', $v));
    }

    /** Totales sobre toda la lista (sin filtros). */
    private function totals(): array
    {
        $byRole = WaitlistEntry::selectRaw('role, count(*) as total')->groupBy('role')->pluck('total', 'role');

        $byCampus = WaitlistEntry::query()
            ->leftJoin('institution_campuses', 'institution_campuses.id', '=', 'waitlist_entries.campus_id')
            ->selectRaw('waitlist_entries.campus_id as campus_id, institution_campuses.name as campus_name, count(*) as total')
            ->groupBy('waitlist_entries.campus_id', 'institution_campuses.name')
            ->orderByDesc('total')->limit(10)->get()
            ->map(fn ($r) => ['campus_id' => $r->campus_id, 'campus_name' => $r->campus_name ?? 'Sin sede', 'total' => (int) $r->total])
            ->all();

        $byNeighborhood = WaitlistEntry::selectRaw('lower(neighborhood) as neighborhood, count(*) as total')
            ->groupByRaw('lower(neighborhood)')->orderByDesc('total')->orderByRaw('lower(neighborhood)')->limit(10)->get()
            ->map(fn ($r) => ['neighborhood' => $r->neighborhood, 'total' => (int) $r->total])
            ->all();

        $byTime = WaitlistEntry::selectRaw('usual_time, count(*) as total')
            ->groupBy('usual_time')->orderBy('usual_time')->get()
            ->map(fn ($r) => ['usual_time' => $r->usual_time, 'total' => (int) $r->total])
            ->all();

        return [
            'total' => (int) $byRole->sum(),
            'by_role' => [
                'pasajero' => (int) ($byRole['pasajero'] ?? 0),
                'conductor' => (int) ($byRole['conductor'] ?? 0),
                'ambos' => (int) ($byRole['ambos'] ?? 0),
            ],
            'by_campus' => $byCampus,
            'by_neighborhood' => $byNeighborhood,
            'by_usual_time' => $byTime,
        ];
    }

    /** Evita inyección de fórmulas al abrir el CSV en una hoja de cálculo. */
    private function csvSafe(?string $value): ?string
    {
        return $value !== null && preg_match('/^[=+\-@\t\r]/', $value) ? "'".$value : $value;
    }
}
