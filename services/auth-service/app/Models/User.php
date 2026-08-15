<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'id_document_number',
        'id_document_type',
        'phone_number',
        'profile_photo_path',
        'institution_id',
        'campus_id',
        'member_type',
        'student_code',
        'academic_program_or_department',
        'semester',
        'password',
        'is_driver',
        'is_active',
        'email_verified_at',
        'verification_expires_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'semester' => 'integer',
            'is_driver' => 'boolean',
            'is_active' => 'boolean',
            'email_verified_at' => 'datetime',
            'verification_expires_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function institution(): BelongsTo
    {
        return $this->belongsTo(Institution::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(InstitutionCampus::class, 'campus_id');
    }

    public function reputationStats(): HasOne
    {
        return $this->hasOne(UserReputationStats::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(UserWallet::class);
    }

    /**
     * Verifica si la validación semestral de correo institucional sigue vigente.
     */
    public function hasValidInstitutionalVerification(): bool
    {
        if (!$this->verification_expires_at) {
            return false;
        }

        return $this->verification_expires_at->isFuture();
    }
}
