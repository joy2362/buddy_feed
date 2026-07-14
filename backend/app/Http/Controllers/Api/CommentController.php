<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CommentController extends Controller
{
    public function index(Request $request, Post $post)
    {
        $this->authorize('view', $post);

        $comments = $post->comments()
            ->with(['user', 'myLike', 'replies.user', 'replies.myLike'])
            ->orderBy('created_at')
            ->cursorPaginate(10)
            ->withQueryString();

        return CommentResource::collection($comments);
    }

    public function store(StoreCommentRequest $request, Post $post)
    {
        $this->authorize('view', $post);

        $comment = $post->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
            'likes_count' => 0,
        ]);
        $post->increment('comments_count');

        $comment->load('user');

        return new CommentResource($comment);
    }

    public function storeReply(StoreCommentRequest $request, Comment $comment)
    {
        if ($comment->parent_id !== null) {
            throw ValidationException::withMessages([
                'comment' => 'Replies can only be added to a top-level comment.',
            ]);
        }

        $post = $comment->post;
        $this->authorize('view', $post);

        $reply = Comment::create([
            'post_id' => $comment->post_id,
            'user_id' => $request->user()->id,
            'parent_id' => $comment->id,
            'body' => $request->validated('body'),
            'likes_count' => 0,
        ]);
        $post->increment('comments_count');

        $reply->load('user');

        return new CommentResource($reply);
    }
}
