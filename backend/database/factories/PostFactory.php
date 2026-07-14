<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'body' => fake()->paragraph(),
            'image_path' => null,
            'visibility' => 'public',
        ];
    }

    public function private(): static
    {
        return $this->state(['visibility' => 'private']);
    }
}
