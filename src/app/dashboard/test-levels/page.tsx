'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { FaStar, FaComment, FaPlus, FaHeart } from 'react-icons/fa';

export default function TestLevels() {
  const { user } = useAuth();
  const [levelInfo, setLevelInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchLevelInfo();
    }
  }, [user]);

  const fetchLevelInfo = async () => {
    const { data, error } = await supabase
      .rpc('get_level_progress', { user_id: user?.id });
    if (!error && data) {
      setLevelInfo(data[0]);
    }
  };

  const simulateAction = async (action: string) => {
    setLoading(true);
    setMessage('');
    try {
      switch (action) {
        case 'post':
          // Create a test post
          const { data: post, error: postError } = await supabase
            .from('posts')
            .insert([{
              user_id: user?.id,
              food_id: '6f10c2dd-5164-4519-9c6a-bd73c6c81186', // Use an existing food_id from your DB
              caption: 'Test post for XP',
              is_explore: true
            }])
            .select()
            .single();
          
          if (postError) throw postError;
          setMessage('Created a new post! (+50 XP)');
          break;

        case 'like':
          // Simulate getting a like on your post
          const { data: posts } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user?.id)
            .limit(1)
            .single();

          if (posts) {
            await supabase
              .from('post_likes')
              .insert([{
                post_id: posts.id,
                user_id: '7ea5c340-9cf3-443d-9710-b3d3b3d3b3d3' // Use a different test user ID
              }]);
            setMessage('Received a like on your post! (+10 XP)');
          }
          break;

        case 'comment':
          // Simulate getting a comment on your post
          const { data: userPosts } = await supabase
            .from('posts')
            .select('id')
            .eq('user_id', user?.id)
            .limit(1)
            .single();

          if (userPosts) {
            // You'll need to create a comments table first
            await supabase
              .from('comments')
              .insert([{
                post_id: userPosts.id,
                user_id: '7ea5c340-9cf3-443d-9710-b3d3b3d3b3d3', // Use a different test user ID
                content: 'Test comment for XP'
              }]);
            setMessage('Received a comment on your post! (+15 XP)');
          }
          break;

        case 'makeComment':
          // Simulate commenting on someone else's post
          const { data: otherPosts } = await supabase
            .from('posts')
            .select('id')
            .neq('user_id', user?.id)
            .limit(1)
            .single();

          if (otherPosts) {
            await supabase
              .from('comments')
              .insert([{
                post_id: otherPosts.id,
                user_id: user?.id,
                content: 'Test comment for XP'
              }]);
            setMessage('Commented on another post! (+5 XP)');
          }
          break;
      }

      // Refresh level info after action
      await fetchLevelInfo();
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6">Please log in to test the leveling system.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Leveling System</h1>

      {/* Level Info Display */}
      {levelInfo && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{levelInfo.current_icon}</span>
            <div>
              <h2 className="text-xl font-semibold">{levelInfo.current_title}</h2>
              <p className="text-gray-600">Division {levelInfo.current_division}</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{levelInfo.current_xp} XP</span>
              <span>{levelInfo.xp_for_next_level} XP</span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${levelInfo.progress_percentage}%` }}
              />
            </div>
            <p className="text-center text-sm mt-1">
              {levelInfo.progress_percentage}% to next level
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => simulateAction('post')}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          <FaPlus /> Create Test Post (+50 XP)
        </button>

        <button
          onClick={() => simulateAction('like')}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
        >
          <FaHeart /> Simulate Getting a Like (+10 XP)
        </button>

        <button
          onClick={() => simulateAction('comment')}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          <FaComment /> Simulate Receiving Comment (+15 XP)
        </button>

        <button
          onClick={() => simulateAction('makeComment')}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
        >
          <FaComment /> Simulate Making Comment (+5 XP)
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
} 