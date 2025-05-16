'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Article {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  published: boolean;
}

interface GamePick {
  id: string;
  title: string;
  description: string;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  reasoning: string;
  createdAt: string;
  published: boolean;
}

export default function MyPosts() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchMyArticles();
      fetchMyPicks();
    }
  }, [session]);

  const fetchMyArticles = async () => {
    try {
      setError(null);

      const articlesResponse = await fetch('/api/articles/my-articles');

      if (!articlesResponse.ok) {
        throw new Error('Failed to fetch articles');
      }

      const articlesData = await articlesResponse.json();
      setArticles(articlesData);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    }
  };

  const fetchMyPicks = async () => {
    try {
      setError(null);

      const picksResponse = await fetch('/api/picks/my-picks');

      if (!picksResponse.ok) {
        throw new Error('Failed to fetch picks');
      }

      const picksData = await picksResponse.json();
      setPicks(picksData);
    } catch (err) {
      console.error('Error fetching picks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load picks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      setArticles(articles.filter(article => article.id !== id));
    } catch (err) {
      console.error('Error deleting article:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete article');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pick?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/picks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pick');
      }

      setPicks(picks.filter(pick => pick.id !== id));
    } catch (err) {
      console.error('Error deleting pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete pick');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Posts</h1>
        <div className="space-x-4">
          <Link
            href="/create-article"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create New Article
          </Link>
          <Link
            href="/create-pick"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create New Pick
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">My Articles</h2>
            {articles.length === 0 ? (
              <p className="text-gray-500">No articles found.</p>
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
                          Created: {new Date(article.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Status: {article.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Link
                          href={`/edit-article/${article.id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(article.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={deletingId === article.id}
                        >
                          {deletingId === article.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">My Articles</h2>
            {picks.length === 0 ? (
              <p className="text-gray-500">No articles found.</p>
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
                          Game: {pick.homeTeam} vs {pick.awayTeam}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Date: {new Date(pick.gameDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Pick: {pick.pick}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Status: {pick.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Link
                          href={`/edit-pick/${pick.id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeletePick(pick.id)}
                          className="text-red-500 hover:text-red-700"
                          disabled={deletingId === pick.id}
                        >
                          {deletingId === pick.id ? 'Deleting...' : 'Delete'}
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
  );
} 