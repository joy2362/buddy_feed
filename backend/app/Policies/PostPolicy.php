<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    /**
     * A post is visible to everyone if public, or only to its author if private.
     */
    public function view(User $user, Post $post): bool
    {
        return $post->visibility === 'public' || $post->user_id === $user->id;
    }
}
