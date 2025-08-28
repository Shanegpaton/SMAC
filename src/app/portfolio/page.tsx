'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface SMACPick {
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

// Helper function to calculate yield
function calculateYield(result: string, odds: number, stake: number): number {
  if (result === 'W') {
    const profit = odds > 0 
      ? stake * (odds / 100)
      : stake * (100 / Math.abs(odds));
    return Number(((profit / stake) * 100).toFixed(2));
  }
  if (result === 'L') {
    return -100;
  }
  return 0;
}

export default function Portfolio() {
  const { data: session, status } = useSession();
  const [picks, setPicks] = useState<SMACPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [globalSMACCoins, setGlobalSMACCoins] = useState<number>(0);

  useEffect(() => {
    fetchPicks();
    fetchGlobalSMACCoins(); // Always fetch global SMAC coins, regardless of login status
  }, [selectedYear, selectedWeek, session]);

  const fetchPicks = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching SMAC picks (attempt ${retryCount + 1})`);
      
      const url = new URL('/api/smac-picks', window.location.origin);
      if (selectedWeek) url.searchParams.set('week', selectedWeek.toString());
      if (selectedYear) url.searchParams.set('year', selectedYear.toString());
      // Add cache-busting parameter to ensure fresh data
      url.searchParams.set('_t', Date.now().toString());

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      clearTimeout(timeoutId);
      
      // Handle 304 Not Modified responses (these are successful, just use cached data)
      if (response.status === 304) {
        console.log('Using cached data (304 Not Modified)');
        // For 304 responses, we don't need to parse JSON since the browser will use cached data
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched SMAC picks data:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      
      setPicks(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching SMAC picks:', err);
      
      // Retry logic for network errors or timeouts
      if (retryCount < 2 && (err instanceof Error && (err.name === 'AbortError' || err.message.includes('Failed to fetch')))) {
        console.log(`Retrying SMAC picks... (${retryCount + 1}/2)`);
        setTimeout(() => fetchPicks(retryCount + 1), 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(err instanceof Error ? err.message : 'Failed to load picks');
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalSMACCoins = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const url = new URL('/api/global-smac-coins', window.location.origin);
      url.searchParams.set('_t', Date.now().toString());
      
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch global SMAC coins');
      }
      const data = await response.json();
      setGlobalSMACCoins(data.balance);
    } catch (err) {
      console.error('Error fetching global SMAC coins:', err);
    }
  };

  // Group picks by week
  const picksByWeek = picks.reduce((acc, pick) => {
    const weekKey = `${pick.year}-${pick.weekNumber}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(pick);
    return acc;
  }, {} as Record<string, SMACPick[]>);

  // Calculate weekly stats
  const weeklyStats = Object.entries(picksByWeek).map(([weekKey, weekPicks]) => {
    const [year, weekNumber] = weekKey.split('-').map(Number);
    const totalPicks = weekPicks.length;
    const wins = weekPicks.filter(pick => pick.result === 'W').length;
    const losses = weekPicks.filter(pick => pick.result === 'L').length;
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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Portfolio</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SMAC Coins Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">SMAC Coins</h2>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-indigo-600">{globalSMACCoins}</span>
              <span className="text-gray-500">Balance</span>
            </div>
          </div>

          {/* Add more portfolio cards here */}
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">SMAC Portfolio</h2>

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
            <div className="text-center py-8">
              <p className="text-gray-500">No picks found for the selected period.</p>
            </div>
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
                            <div className={`text-sm font-medium ${
                              pick.result === 'W' ? 'text-green-600' :
                              pick.result === 'L' ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {pick.result || 'Pending'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              pick.yield && pick.yield > 0 ? 'text-green-600' :
                              pick.yield && pick.yield < 0 ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {pick.yield ? `${pick.yield.toFixed(2)}%` : '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 