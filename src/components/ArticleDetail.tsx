'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ArticleDetailProps {
  article: {
    id: string;
    title: string;
    gameDate: string;
    homeTeam: string;
    awayTeam: string;
    pick: string;
    reasoning: string;
    imageUrl: string | null;
    author: {
      name: string;
    };
  };
}

export default function ArticleDetail({ article }: ArticleDetailProps) {
  const { data: session } = useSession();
  const [upvotes, setUpvotes] = useState(0);
  const [downvotes, setDownvotes] = useState(0);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Fetch votes and comments on component mount
  useEffect(() => {
    fetchVotes();
    fetchComments();
  }, [article.id]);

  const fetchVotes = async () => {
    try {
      const response = await fetch(`/api/articles/${article.id}/vote`);
      if (response.ok) {
        const data = await response.json();
        setUpvotes(data.upvotes);
        setDownvotes(data.downvotes);
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/articles/${article.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleVote = async (vote: number) => {
    if (!session?.user) {
      alert('Please sign in to vote');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);
    try {
      const response = await fetch(`/api/articles/${article.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      });

      if (response.ok) {
        // Refresh votes
        await fetchVotes();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      alert('Please sign in to comment');
      return;
    }

    if (!newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/articles/${article.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setComments([newCommentData, ...comments]);
        setNewComment('');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <article className="bg-white rounded-lg shadow-md overflow-hidden">
        {article.imageUrl && (
          <div className="relative h-64 md:h-96">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-black">{article.title}</h1>
          
          <div className="flex items-center gap-4 mb-6 text-black">
            <span>By {article.author.name}</span>
            <span>•</span>
            <span>{new Date(article.gameDate).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{article.homeTeam}</p>
              <p className="text-sm text-black">Home</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-semibold">{article.awayTeam}</p>
              <p className="text-sm text-black">Away</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-black">Our Pick</h2>
            <p className="text-lg md:text-xl font-bold text-blue-600 mb-2">{article.pick}</p>
            <p className="text-black whitespace-pre-wrap">{article.reasoning}</p>
          </div>

          {/* Voting Section */}
          <div className="border-t border-gray-200 pt-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-black">Rate this analysis</h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleVote(1)}
                disabled={isVoting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  userVote === 1
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 border border-gray-300'
                }`}
              >
                <span className="text-lg">▲</span>
                <span>{upvotes}</span>
              </button>
              <button
                onClick={() => handleVote(-1)}
                disabled={isVoting}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  userVote === -1
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-50 border border-gray-300'
                }`}
              >
                <span className="text-lg">▼</span>
                <span>{downvotes}</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold mb-4 text-black">Comments ({comments.length})</h3>
            
            {/* Comment Form */}
            {session?.user && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts on this analysis..."
                  className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-black">{comment.user.name}</span>
                    <span className="text-sm text-black">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-black">{comment.content}</p>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-black text-center py-4">No comments yet. Be the first to share your thoughts!</p>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
