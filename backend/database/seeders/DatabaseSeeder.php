<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use App\Services\LikeToggleService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo users, posts, comments,
     * replies and likes so the feed looks realistic out of the box.
     */
    public function run(): void
    {
        $likeService = app(LikeToggleService::class);

        $people = [
            ['first_name' => 'Karim', 'last_name' => 'Saif', 'email' => 'karim@example.com'],
            ['first_name' => 'Radovan', 'last_name' => 'Novak', 'email' => 'radovan@example.com'],
            ['first_name' => 'Jane', 'last_name' => 'Doe', 'email' => 'jane@example.com'],
            ['first_name' => 'Ryan', 'last_name' => 'Miles', 'email' => 'ryan@example.com'],
        ];

        $users = collect($people)->map(fn ($p) => User::factory()->create([
            ...$p,
            'password' => 'password',
        ]));

        // A convenient known account for the reviewer/demo video to log in with.
        $demoUser = User::factory()->create([
            'first_name' => 'Demo',
            'last_name' => 'User',
            'email' => 'demo@example.com',
            'password' => 'password',
        ]);
        $users->push($demoUser);

        $sampleImages = $this->copySampleImages();

        $posts = collect();

        foreach ($users as $user) {
            $postCount = random_int(2, 4);

            for ($i = 0; $i < $postCount; $i++) {
                $isPrivate = random_int(1, 5) === 1; // ~20% private
                $withImage = $sampleImages->isNotEmpty() && random_int(0, 1) === 1;

                $posts->push(Post::create([
                    'user_id' => $user->id,
                    'body' => fake()->realText(random_int(60, 220)),
                    'image_path' => $withImage ? $sampleImages->random() : null,
                    'visibility' => $isPrivate ? 'private' : 'public',
                    'created_at' => now()->subMinutes(random_int(1, 60 * 24 * 5)),
                ]));
            }
        }

        foreach ($posts as $post) {
            $commenters = $users->random(min($users->count(), random_int(0, 3)));

            foreach ($commenters as $commenter) {
                $comment = Comment::create([
                    'post_id' => $post->id,
                    'user_id' => $commenter->id,
                    'parent_id' => null,
                    'body' => fake()->sentence(random_int(6, 16)),
                ]);
                $post->increment('comments_count');

                if (random_int(0, 1) === 1) {
                    $replier = $users->random();
                    Comment::create([
                        'post_id' => $post->id,
                        'user_id' => $replier->id,
                        'parent_id' => $comment->id,
                        'body' => fake()->sentence(random_int(4, 12)),
                    ]);
                    $post->increment('comments_count');
                }

                // A handful of random likes on the comment.
                foreach ($users->random(min($users->count(), random_int(0, 2))) as $liker) {
                    $likeService->toggle($comment, $liker);
                }
            }

            // A handful of random likes on the post itself.
            foreach ($users->random(min($users->count(), random_int(0, 4))) as $liker) {
                $likeService->toggle($post, $liker);
            }
        }
    }

    /**
     * Copy a few sample images from the provided design assets into the
     * public disk so seeded posts can showcase image posts.
     *
     * @return \Illuminate\Support\Collection<int, string>
     */
    private function copySampleImages(): \Illuminate\Support\Collection
    {
        $source = base_path('../Selection Task/assets/images');
        $names = ['img1.png', 'img2.png', 'img3.png', 'post_img.png', 'img10.png', 'img11.png'];

        $paths = collect();

        if (! File::isDirectory($source)) {
            return $paths;
        }

        Storage::disk('public')->makeDirectory('posts');

        foreach ($names as $name) {
            $from = $source.'/'.$name;

            if (! File::exists($from)) {
                continue;
            }

            $destination = 'posts/seed-'.$name;
            Storage::disk('public')->put($destination, File::get($from));
            $paths->push($destination);
        }

        return $paths;
    }
}
