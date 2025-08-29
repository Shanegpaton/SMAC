'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserSMACPick {
  id: string;
  date: string;
  sport: string;
  game: string;
  bet: string;
  odds: number;
  smacCoins: number;
  result?: string;
  yield?: number;
}

export default function MyPicks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [picks, setPicks] = useState<UserSMACPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPick, setNewPick] = useState({
    date: '',
    sport: '',
    game: '',
    bet: '',
    odds: '',
    smacCoins: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    } else if (status === 'authenticated') {
      fetchPicks();
    }
  }, [status, router]);

  const fetchPicks = async () => {
    try {
      const response = await fetch('/api/user-smac-picks', {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      // Handle 304 Not Modified responses
      if (response.status === 304) {
        console.log('Using cached data for user picks (304 Not Modified)');
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch picks');
      const data = await response.json();
      setPicks(data);
    } catch (err) {
      setError('Failed to load picks');
      console.error('Error fetching picks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/user-smac-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPick),
      });

      if (!response.ok) {
        throw new Error('Failed to create pick');
      }

      const createdPick = await response.json();
      setPicks([createdPick, ...picks]);
      setIsCreating(false);
      setNewPick({
        date: '',
        sport: '',
        game: '',
        bet: '',
        odds: '',
        smacCoins: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pick');
    }
  };

  if (status === 'loading' || loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p>You need to be signed in to view your picks.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">My SMAC Picks</h1>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isCreating ? 'Cancel' : 'Create New Pick'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreatePick} className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-8 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={newPick.date}
                onChange={(e) => setNewPick({ ...newPick, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <input
                type="text"
                value={newPick.sport}
                onChange={(e) => setNewPick({ ...newPick, sport: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Game
              </label>
              <input
                type="text"
                value={newPick.game}
                onChange={(e) => setNewPick({ ...newPick, game: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bet
              </label>
              <input
                type="text"
                value={newPick.bet}
                onChange={(e) => setNewPick({ ...newPick, bet: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Odds
              </label>
              <input
                type="number"
                step="0.01"
                value={newPick.odds}
                onChange={(e) => setNewPick({ ...newPick, odds: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SMAC Coins
              </label>
              <input
                type="number"
                value={newPick.smacCoins}
                onChange={(e) => setNewPick({ ...newPick, smacCoins: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Create Pick
          </button>
        </form>
      )}

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {picks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No picks found. Create your first pick above!</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sport
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Game
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Odds
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SMAC Coins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Yield
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {picks.map((pick) => (
                <tr key={pick.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(pick.date).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.sport}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.game}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.bet}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.odds}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.smacCoins}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{pick.result || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {pick.yield ? `${pick.yield}%` : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 