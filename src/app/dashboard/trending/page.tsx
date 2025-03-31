import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Post } from "@/types/post";
import PostList from "@/components/PostList";
import { TrendingUp } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function TrendingPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data, error } = await supabase
    .rpc('get_trending_posts');

  // Type assertion since we know the RPC returns an array of posts
  const posts = data as Post[];

  if (error) {
    console.error('Error loading trending posts:', error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500">Error loading trending posts</div>
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">No Trending Posts Yet</h2>
        <p className="text-gray-500 text-center">
          Check back soon to see what&apos;s trending in the last 24 hours!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-[#319141]" />
        <h1 className="text-2xl font-bold text-gray-900">Trending Now</h1>
      </div>
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-[#319141]/20 to-[#319141]/10 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600">
            Popular recipes from the last 24 hours
          </p>
        </div>
        <PostList posts={posts} />
      </div>
    </div>
  );
} 