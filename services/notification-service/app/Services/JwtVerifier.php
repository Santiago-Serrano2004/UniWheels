<?php

namespace App\Services;

use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\SignatureInvalidException;
use Illuminate\Support\Facades\Redis;
use stdClass;
use UnexpectedValueException;

class JwtVerifier
{
    public function verify(string $token): ?stdClass
    {
        try {
            $claims = JWT::decode($token, new Key(config('jwt.secret'), config('jwt.algo')));
        } catch (ExpiredException|SignatureInvalidException|UnexpectedValueException) {
            return null;
        }

        if (isset($claims->jti) && Redis::exists("jwt:blocklist:{$claims->jti}")) {
            return null;
        }

        return $claims;
    }
}
