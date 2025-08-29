'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useDebounce } from '@/hooks/useDebounce';

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
  imageUrl: string | null;
  published: boolean;
  upvotes: number;
  downvotes: number;
  commentCount: number;
  author?: {
    name: string;
    email: string;
  };
}

export default function RecentPicks() {
  const { data: session, status } = useSession();
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Debounce the status to prevent rapid-fire requests
  const debouncedStatus = useDebounce(status, 300);

  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchPicks = async () => {
      try {
        // Cancel any ongoing request
        if (abortController) {
          abortController.abort();
        }
        
        abortController = new AbortController();
        
        console.log('RecentPicks: Starting fetch (attempt', retryCount + 1, ')');
        
        // Add aggressive cache-busting parameters to ensure fresh data
        const url = new URL('/api/picks', window.location.origin);
        url.searchParams.set('_t', Date.now().toString());
        url.searchParams.set('_v', Math.random().toString(36).substring(7));
        url.searchParams.set('_cache', 'no');
        
        // Add timeout to the fetch request
        const timeoutId = setTimeout(() => abortController?.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
          signal: abortController.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        });
        
        clearTimeout(timeoutId);
        
        // Check if component is still mounted
        if (!isMounted) return;
        
        console.log('RecentPicks: Response status:', response.status);
        
        // Handle 304 Not Modified responses
        if (response.status === 304) {
          console.log('Using cached data for recent picks (304 Not Modified)');
          return;
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('RecentPicks: Fetched data:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }
        
        if (isMounted) {
          setPicks(data);
          setError(null);
          setRetryCount(0); // Reset retry count on success
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error('RecentPicks: Error fetching picks:', err);
        
        // Don't retry on 500 errors to prevent infinite loops
        if (err instanceof Error && err.message.includes('500')) {
          setError('Server error - please try again later');
          return;
        }
        
        // Retry logic for network errors or timeouts
        if (retryCount < 2 && (err instanceof Error && (err.name === 'AbortError' || err.message.includes('Failed to fetch')))) {
          console.log('RecentPicks: Retrying... (', retryCount + 1, '/2)');
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchPicks(), 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        setError(err instanceof Error ? err.message : 'Failed to load picks');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (debouncedStatus !== 'loading') {
      fetchPicks();
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [debouncedStatus, retryCount]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading picks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            setRetryCount(0);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (picks.length === 0) {
    return <div className="text-center py-8">No picks available yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {picks.map((pick) => (
        <Link 
          key={pick.id} 
          href={`/articles/${pick.id}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {pick.imageUrl && (
            <div className="relative h-48">
              <Image
                src={pick.imageUrl}
                alt={pick.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-black">{pick.title}</h3>
                              <span className="text-sm text-black">
                  {new Date(pick.gameDate).toLocaleDateString()}
                </span>
            </div>
            <div className="mb-4">
              <p className="text-black">{pick.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="font-semibold">{pick.homeTeam}</p>
                <p className="text-sm text-black">Home</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{pick.awayTeam}</p>
                <p className="text-sm text-black">Away</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-800">Our Pick: {pick.pick}</p>
              <p className="mt-2 text-blue-700 line-clamp-2">{pick.reasoning}</p>
              <div className="flex justify-between items-center mt-3">
                <div className="flex items-center space-x-4 text-sm text-black">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-600">▲</span>
                    <span>{pick.upvotes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-red-600">▼</span>
                    <span>{pick.downvotes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600">💬</span>
                    <span>{pick.commentCount}</span>
                  </div>
                </div>
                <p className="text-blue-600 text-sm hover:underline">Read full analysis →</p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 