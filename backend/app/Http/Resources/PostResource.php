<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'body' => $this->body,
            'image_url' => $this->image_url,
            'visibility' => $this->visibility,
            'likes_count' => $this->likes_count,
            'comments_count' => $this->comments_count,
            'liked_by_me' => $this->relationLoaded('myLike')
                ? $this->myLike !== null
                : $this->likes()->where('user_id', $request->user()?->id)->exists(),
            'created_at' => $this->created_at?->toISOString(),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
        ];
    }
}
