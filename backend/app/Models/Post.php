<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphOne;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

#[Fillable(['user_id', 'body', 'image_path', 'visibility', 'likes_count', 'comments_count'])]
class Post extends Model
{
    /** @use HasFactory<\Database\Factories\PostFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id');
    }

    public function likes(): MorphMany
    {
        return $this->morphMany(Like::class, 'likeable');
    }

    /**
     * The current viewer's own like on this post, if any. Eager-loading this
     * (instead of an exists() query per row) avoids N+1 queries on the feed.
     */
    public function myLike(): MorphOne
    {
        return $this->morphOne(Like::class, 'likeable')->where('user_id', Auth::id());
    }

    /**
     * Scope a query to only posts visible to the given viewer:
     * every public post, plus the viewer's own private posts.
     */
    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        return $query->where(function (Builder $q) use ($viewer) {
            $q->where('visibility', 'public');

            if ($viewer) {
                $q->orWhere(function (Builder $q) use ($viewer) {
                    $q->where('visibility', 'private')->where('user_id', $viewer->id);
                });
            }
        });
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path ? Storage::disk('public')->url($this->image_path) : null;
    }
}
