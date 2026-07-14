<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::query()
            ->visibleTo($request->user())
            ->with(['user', 'myLike'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->cursorPaginate(10)
            ->withQueryString();

        return PostResource::collection($posts);
    }

    public function store(StorePostRequest $request)
    {
        $path = null;

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('posts', 'public');
        }

        $post = $request->user()->posts()->create([
            'body' => $request->validated('body'),
            'image_path' => $path,
            'visibility' => $request->validated('visibility'),
            'likes_count' => 0,
            'comments_count' => 0,
        ]);

        $post->load('user');

        return new PostResource($post);
    }

    public function show(Request $request, Post $post)
    {
        $this->authorize('view', $post);

        $post->load(['user', 'myLike']);

        return new PostResource($post);
    }
}
