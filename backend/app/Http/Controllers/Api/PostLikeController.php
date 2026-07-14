<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LikeResource;
use App\Models\Post;
use App\Services\LikeToggleService;
use Illuminate\Http\Request;

class PostLikeController extends Controller
{
    public function store(Request $request, Post $post, LikeToggleService $likes)
    {
        $this->authorize('view', $post);

        return response()->json($likes->toggle($post, $request->user()));
    }

    public function index(Request $request, Post $post)
    {
        $this->authorize('view', $post);

        $likes = $post->likes()->with('user')->latest()->paginate(50);

        return LikeResource::collection($likes);
    }
}
