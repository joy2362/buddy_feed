<?php

namespace App\Services;

use App\Models\Like;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class LikeToggleService
{
    /**
     * Toggle the given user's like on a likeable model (a Post or a Comment/reply).
     *
     * @return array{liked: bool, likes_count: int}
     */
    public function toggle(Model $likeable, User $user): array
    {
        return DB::transaction(function () use ($likeable, $user) {
            $existing = Like::query()
                ->where('user_id', $user->id)
                ->where('likeable_type', $likeable->getMorphClass())
                ->where('likeable_id', $likeable->getKey())
                ->lockForUpdate()
                ->first();

            if ($existing) {
                $existing->delete();
                $likeable->decrement('likes_count');

                return ['liked' => false, 'likes_count' => $likeable->fresh()->likes_count];
            }

            try {
                Like::create([
                    'user_id' => $user->id,
                    'likeable_type' => $likeable->getMorphClass(),
                    'likeable_id' => $likeable->getKey(),
                ]);
                $likeable->increment('likes_count');
            } catch (QueryException $e) {
                // Unique constraint hit: a concurrent request already created the like.
                if (! str_contains($e->getMessage(), 'unique')) {
                    throw $e;
                }
            }

            return ['liked' => true, 'likes_count' => $likeable->fresh()->likes_count];
        });
    }
}
