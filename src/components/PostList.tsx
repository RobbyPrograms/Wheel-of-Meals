'use client';

import { Post } from '@/types/post';
import { FaHeart, FaComment } from 'react-icons/fa';
import Link from 'next/link';

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Link 
          key={post.id} 
          href={`/post/${post.id}`}
          className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
            <p className="text-gray-600 text-sm mb-3">{post.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <FaHeart className="text-[#319141]" />
                <span>{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaComment className="text-[#319141]" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 