'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Trader {
  id: string;
  name: string;
  smacCoins: number;
  totalPicks: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: string;
  totalYield: number;
  sports: string[];
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

export default function TraderProfile() {
  const params = useParams();
  const router = useRouter();
  const traderId = params.id as string;
  
  const [trader, setTrader] = useState<Trader | null>(null);
  const [picks, setPicks] = useState<UserSMACPick[]>([]);
  const [articles, setArticles] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'picks' | 'articles'>('picks');

  useEffect(() => {
    if (traderId) {
      fetchTraderData();
    }
  }, [traderId]);

  const fetchTraderData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trader info
      const tradersResponse = await fetch('/api/traders');
      if (!tradersResponse.ok) throw new Error('Failed to fetch traders');
      const traders = await tradersResponse.json();
      const traderData = traders.find((t: Trader) => t.id === traderId);
      
      if (!traderData) {
        throw new Error('Trader not found');
      }
      setTrader(traderData);

      // Fetch trader's picks
      const picksResponse = await fetch(`/api/user-smac-picks?userId=${traderId}`);
      if (picksResponse.ok) {
        const picksData = await picksResponse.json();
        setPicks(picksData);
      }

      // Fetch trader's articles
      const articlesResponse = await fetch(`/api/picks?userId=${traderId}`);
      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        setArticles(articlesData);
      }

    } catch (err) {
      console.error('Error fetching trader data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trader data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !trader) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error || 'Trader not found'}</div>
        <button 
          onClick={() => router.push('/traders')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Back to Traders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push('/traders')} 
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Traders
          </button>
          <h1 className="text-3xl font-bold text-black">{trader.name}</h1>
        </div>

        {/* Trader Stats */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-semibold text-black">Trader Stats</h2>
            <div className="text-right">
              <div className="text-sm text-gray-500">SMAC Coins</div>
              <div className="text-xl font-bold text-indigo-600">{trader.smacCoins}</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Record</div>
                  <div className="font-medium">
                    {trader.wins}-{trader.losses}
                    {trader.pending > 0 && ` (${trader.pending} pending)`}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Win Rate</div>
                  <div className="font-medium">{trader.winRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Picks</div>
                  <div className="font-medium">{trader.totalPicks}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Yield</div>
                  <div className={`font-medium ${trader.totalYield >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trader.totalYield}%
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-medium mb-2">Sports</h3>
              <div className="flex flex-wrap gap-2">
                {trader.sports.map((sport) => (
                  <span key={sport} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {sport}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('picks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'picks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                SMAC Picks ({picks.length})
              </button>
              <button
                onClick={() => setActiveTab('articles')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'articles'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Articles ({articles.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'picks' && (
          <div>
            {picks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No picks found for this trader.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Sport
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Game
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                          Bet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Odds
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          SMAC Coins
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Result
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
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
                              {pick.result === 'push' ? 'Push' : pick.yield ? `${pick.yield}%` : '-'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'articles' && (
          <div>
            {articles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No articles found for this trader.</p>
              </div>
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
                          Game: {article.homeTeam} vs {article.awayTeam}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Date: {new Date(article.gameDate).toLocaleDateString()}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Pick: {article.pick}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Status: {article.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                      <div>
                        <Link
                          href={`/picks/${article.id}`}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          View Article
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
