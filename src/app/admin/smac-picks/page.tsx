'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SMACPick {
  id: string;
  date: string;
  sport: string;
  game: string;
  bet: string;
  odds: number;
  smacCoins: number;
  result: string | null;
  yield: number | null;
  weekNumber: number;
  year: number;
  published: boolean;
}

export default function AdminSMACPicks() {
  const [picks, setPicks] = useState<SMACPick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [newPick, setNewPick] = useState({
    date: '',
    sport: '',
    game: '',
    bet: '',
    odds: '',
    smacCoins: '',
    result: '',
    yield: '',
  });

  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchPicks();
    }
  }, [session, selectedWeek, selectedYear]);

  const fetchPicks = async () => {
    try {
      setIsLoading(true);
      const url = new URL('/api/smac-picks', window.location.origin);
      if (selectedWeek) url.searchParams.set('week', selectedWeek.toString());
      if (selectedYear) url.searchParams.set('year', selectedYear.toString());

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch picks');
      }
      const data = await response.json();
      setPicks(data);
      setError(null);
    } catch (error) {
      setError('Failed to load picks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/smac-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPick),
      });

      if (!response.ok) {
        throw new Error('Failed to create pick');
      }

      setSuccess('Pick created successfully');
      setIsCreating(false);
      setNewPick({
        date: '',
        sport: '',
        game: '',
        bet: '',
        odds: '',
        smacCoins: '',
        result: '',
        yield: '',
      });
      fetchPicks();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create pick');
    }
  };

  const handleUpdateResult = async (id: string, result: string, yieldAmount: number) => {
    try {
      const response = await fetch(`/api/admin/smac-picks/${id}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pick');
      }

      setSuccess('Pick updated successfully');
      fetchPicks();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update pick');
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
          <h1 className="text-3xl font-bold">SMAC Picks</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Admin Dashboard
          </button>
        </div>

        <div className="mb-6 flex gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-md"
          >
            {[2024, 2023].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <select
            value={selectedWeek || ''}
            onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="">All Weeks</option>
            {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
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

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isCreating ? 'Cancel' : 'Create New Pick'}
        </button>

        {isCreating && (
          <form onSubmit={handleCreatePick} className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newPick.date}
                  onChange={(e) => setNewPick({ ...newPick, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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
                  className="w-full px-3 py-2 border rounded-md"
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

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading picks...</p>
          </div>
        ) : picks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No picks found for the selected period.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!pick.result && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleUpdateResult(pick.id, 'win', 100)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Win
                          </button>
                          <button
                            onClick={() => handleUpdateResult(pick.id, 'push', 0)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Push
                          </button>
                          <button
                            onClick={() => handleUpdateResult(pick.id, 'loss', -100)}
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
        )}
      </div>
    </div>
  );
} 