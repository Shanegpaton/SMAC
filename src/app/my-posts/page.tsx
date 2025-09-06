'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  weekNumber: number;
  year: number;
}

export default function MyPosts() {
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [userPicks, setUserPicks] = useState<UserSMACPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [userSmacCoins, setUserSmacCoins] = useState<number>(0);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user) {
      fetchMyPicks();
      fetchUserPicks();
      fetchUserSmacCoins();
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      fetchUserPicks();
    }
  }, [selectedYear, selectedWeek]);

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

  const fetchUserPicks = async () => {
    try {
      const url = new URL('/api/user-smac-picks', window.location.origin);
      if (selectedWeek) url.searchParams.set('week', selectedWeek.toString());
      if (selectedYear) url.searchParams.set('year', selectedYear.toString());
      // Add cache-busting parameter to ensure fresh data
      url.searchParams.set('_t', Date.now().toString());

      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      // Handle 304 Not Modified responses
      if (response.status === 304) {
        console.log('Using cached data for user picks (304 Not Modified)');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user picks');
      }
      const data = await response.json();
      setUserPicks(data);
    } catch (err) {
      console.error('Error fetching user picks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user picks');
    }
  };

  const fetchUserSmacCoins = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const url = new URL('/api/user/smac-coins', window.location.origin);
      url.searchParams.set('_t', Date.now().toString());
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch SMAC coins');
      }
      const data = await response.json();
      setUserSmacCoins(data.smacCoins);
    } catch (err) {
      console.error('Error fetching SMAC coins:', err);
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

  const handleResultUpdate = async (pickId: string, result: string) => {
    try {
      const response = await fetch(`/api/user-smac-picks/${pickId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pick result');
      }

      // Refresh the picks list
      fetchUserPicks();
      // Refresh the user's SMAC coins
      fetchUserSmacCoins();
    } catch (error) {
      console.error('Error updating pick result:', error);
    }
  };

  // Group picks by week
  const picksByWeek = userPicks.reduce((acc, pick) => {
    const weekKey = `${pick.year}-${pick.weekNumber}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(pick);
    return acc;
  }, {} as Record<string, UserSMACPick[]>);

  // Calculate weekly stats
  const weeklyStats = Object.entries(picksByWeek).map(([weekKey, weekPicks]) => {
    const [year, weekNumber] = weekKey.split('-').map(Number);
    const totalPicks = weekPicks.length;
    const wins = weekPicks.filter(pick => pick.result === 'win').length;
    const losses = weekPicks.filter(pick => pick.result === 'loss').length;
    const pending = weekPicks.filter(pick => !pick.result).length;

    // Calculate weighted total yield
    const totalStaked = weekPicks.reduce((sum, pick) => sum + (pick.smacCoins || 0), 0);
    const weightedYield = weekPicks.reduce((sum, pick) => {
      if (!pick.result || !pick.smacCoins) return sum;
      const weight = pick.smacCoins / totalStaked;
      return sum + (pick.yield * weight);
    }, 0);

    return {
      weekKey,
      year,
      weekNumber,
      totalPicks,
      wins,
      losses,
      pending,
      totalYield: Number(weightedYield.toFixed(2)),
      avgYield: Number((weightedYield / (wins + losses)).toFixed(2)),
      picks: weekPicks
    };
  });

  // Sort weeks by year and week number (descending)
  weeklyStats.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.weekNumber - a.weekNumber;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-black">Profile</h1>
        <div className="flex items-center space-x-6">
          <div className="bg-gray-100 px-4 py-2 rounded-lg">
            <span className="text-black">SMAC Coins:</span>
            <span className="ml-2 font-semibold text-black">{userSmacCoins}</span>
          </div>
          <button
            onClick={() => router.push('/create-pick')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create New Pick
          </button>
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
            <h2 className="text-2xl font-semibold mb-4">My SMAC Articles</h2>
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
                        {!pick.published && (
                          <Link
                            href={`/edit-pick/${pick.id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            Edit
                          </Link>
                        )}
                        {!pick.published && (
                          <button
                            onClick={() => handleDeletePick(pick.id)}
                            className="text-red-500 hover:text-red-700"
                            disabled={deletingId === pick.id}
                          >
                            {deletingId === pick.id ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">My SMAC Picks</h2>
            
            <div className="mb-8 flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border rounded-md"
                >
                  {[2025, 2024, 2023].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Week
                </label>
                <select
                  value={selectedWeek || ''}
                  onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Weeks</option>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {weeklyStats.length === 0 ? (
              <p className="text-gray-500">No picks found for the selected period.</p>
            ) : (
              <div className="space-y-8">
                {weeklyStats.map((week) => (
                  <div key={week.weekKey} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                          {week.year} - Week {week.weekNumber}
                        </h2>
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">Wins: {week.wins}</span>
                          <span className="text-red-600">Losses: {week.losses}</span>
                          <span className="text-gray-600">Pending: {week.pending}</span>
                          <span className="font-medium">
                            Yield: {week.totalYield.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <table className="min-w-[900px] divide-y divide-gray-200">
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {week.picks.map((pick) => (
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
                                {pick.result === 'push' ? 'Push' : pick.yield ? `${pick.yield}%` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {!pick.result && (
                                <div className="space-x-2">
                                  <button
                                    onClick={() => handleResultUpdate(pick.id, 'win')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Win
                                  </button>
                                  <button
                                    onClick={() => handleResultUpdate(pick.id, 'push')}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Push
                                  </button>
                                  <button
                                    onClick={() => handleResultUpdate(pick.id, 'loss')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Loss
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
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