<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'post_id' => $this->post_id,
            'parent_id' => $this->parent_id,
            'body' => $this->body,
            'likes_count' => $this->likes_count,
            'liked_by_me' => $this->relationLoaded('myLike')
                ? $this->myLike !== null
                : $this->likes()->where('user_id', $request->user()?->id)->exists(),
            'created_at' => $this->created_at?->toISOString(),
            'user' => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ],
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
        ];
    }
}
