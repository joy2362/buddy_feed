<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LikeResource;
use App\Models\Comment;
use App\Services\LikeToggleService;
use Illuminate\Http\Request;

class CommentLikeController extends Controller
{
    public function store(Request $request, Comment $comment, LikeToggleService $likes)
    {
        $this->authorize('view', $comment->post);

        return response()->json($likes->toggle($comment, $request->user()));
    }

    public function index(Request $request, Comment $comment)
    {
        $this->authorize('view', $comment->post);

        $likes = $comment->likes()->with('user')->latest()->paginate(50);

        return LikeResource::collection($likes);
    }
}
