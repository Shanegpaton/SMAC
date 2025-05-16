'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    name: string;
  };
}

interface GamePick {
  id: string;
  title: string;
  description: string;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  createdAt: string;
  author: {
    name: string;
  };
}

export default function PublishRequests() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const [articlesResponse, picksResponse] = await Promise.all([
        fetch('/api/articles/publish-requests'),
        fetch('/api/picks/publish-requests')
      ]);

      if (!articlesResponse.ok || !picksResponse.ok) {
        throw new Error('Failed to fetch requests');
      }

      const articlesData = await articlesResponse.json();
      const picksData = await picksResponse.json();

      setArticles(articlesData);
      setPicks(picksData);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type: 'article' | 'pick', id: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/${type}s/${id}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to approve ${type}`);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} approved successfully!`);
      fetchRequests();
    } catch (err) {
      console.error(`Error approving ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to approve ${type}`);
    }
  };

  const handleReject = async (type: 'article' | 'pick', id: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/${type}s/${id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`Failed to reject ${type}`);
      }

      setSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} rejected successfully!`);
      fetchRequests();
    } catch (err) {
      console.error(`Error rejecting ${type}:`, err);
      setError(err instanceof Error ? err.message : `Failed to reject ${type}`);
    }
  };

  if (!session?.user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Publication Requests</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Admin Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Article Requests</h2>
              {articles.length === 0 ? (
                <p className="text-gray-500">No article requests found.</p>
              ) : (
                <div className="grid gap-4">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold">{article.title}</h3>
                          <p className="text-gray-500 text-sm">
                            Author: {article.author.name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Created: {new Date(article.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleApprove('article', article.id)}
                            className="text-green-500 hover:text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject('article', article.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Pick Requests</h2>
              {picks.length === 0 ? (
                <p className="text-gray-500">No pick requests found.</p>
              ) : (
                <div className="grid gap-4">
                  {picks.map((pick) => (
                    <div
                      key={pick.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold">{pick.title}</h3>
                          <p className="text-gray-500 text-sm">
                            Author: {pick.author.name}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Game: {pick.homeTeam} vs {pick.awayTeam}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Date: {new Date(pick.gameDate).toLocaleDateString()}
                          </p>
                          <p className="text-gray-500 text-sm">
                            Pick: {pick.pick}
                          </p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleApprove('pick', pick.id)}
                            className="text-green-500 hover:text-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject('pick', pick.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 