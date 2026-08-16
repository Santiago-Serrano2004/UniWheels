<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory, HasUuids;

    const TYPE_VIAJE_RESERVADO = 'viaje_reservado';
    const TYPE_CONDUCTOR_EN_CAMINO = 'conductor_en_camino';
    const TYPE_CONDUCTOR_LLEGA = 'conductor_en_punto_encuentro';
    const TYPE_ABORDAJE_PIN = 'abordaje_verificado';
    const TYPE_VIAJE_FINALIZADO = 'viaje_finalizado';
    const TYPE_CANCELACION = 'viaje_cancelado';
    const TYPE_SEGURIDAD = 'alerta_seguridad';

    protected $fillable = [
        'user_id',
        'title',
        'body',
        'type',
        'payload_json',
        'is_read',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'payload_json' => 'array',
            'is_read' => 'boolean',
            'read_at' => 'datetime',
        ];
    }

    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function scopeForUser(Builder $query, string $userId): Builder
    {
        return $query->where('user_id', $userId);
    }
}
