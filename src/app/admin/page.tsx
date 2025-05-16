'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface SMACArticle {
  id: string;
  title: string;
  gameDate: Date;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  reasoning: string;
  imageUrl: string | null;
  published: boolean;
  publishRequest?: boolean;
  authorId: string;
  author?: {
    name: string;
    email: string;
  };
}

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
  potentialYield?: number;
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [articles, setArticles] = useState<SMACArticle[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [smacPicks, setSmacPicks] = useState<SMACPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'articles' | 'users' | 'smac-picks'>('articles');
  const [isCreatingPick, setIsCreatingPick] = useState(false);
  const [newPick, setNewPick] = useState<Omit<SMACPick, 'id' | 'result' | 'yield'>>({
    date: '',
    sport: '',
    game: '',
    bet: '',
    odds: 0,
    smacCoins: 0,
    weekNumber: 1,
    year: new Date().getFullYear(),
    potentialYield: 0
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (activeTab === 'articles') {
          const response = await fetch('/api/admin/picks');
          if (!response.ok) throw new Error('Failed to fetch articles');
          const data = await response.json();
          setArticles(data);
        } else if (activeTab === 'users') {
          const response = await fetch('/api/admin/users');
          if (!response.ok) throw new Error('Failed to fetch users');
          const data = await response.json();
          setUsers(data);
        } else if (activeTab === 'smac-picks') {
          try {
            const response = await fetch('/api/admin/smac-picks');
            const data = await response.json();
            // Always set the picks, even if empty array
            setSmacPicks(Array.isArray(data) ? data : []);
          } catch (fetchError) {
            console.error('Error fetching SMAC picks:', fetchError);
            // Set empty array on error
            setSmacPicks([]);
          }
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, activeTab]);

  const handlePublishToggle = async (articleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/picks/${articleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          published: !currentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.error || 'Failed to update article');
      }

      // Update the local state with the response data
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { ...article, published: data.published }
          : article
      ));
    } catch (err) {
      console.error('Error updating article:', err);
      alert('Failed to update article status');
    }
  };

  const handleAdminToggle = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAdmin: !currentStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isAdmin: !currentStatus }
          : user
      ));
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user status');
    }
  };

  const handleCreateSMACPick = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Validate the form data before sending
      if (!newPick.date || !newPick.sport || !newPick.game || !newPick.bet || !newPick.odds || !newPick.smacCoins) {
        alert('Please fill in all fields');
        return;
      }

      // Format the date to ISO string
      const formattedPick = {
        ...newPick,
        date: new Date(newPick.date).toISOString()
      };

      console.log('Sending pick data:', formattedPick);

      const response = await fetch('/api/admin/smac-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedPick),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create SMAC pick');
      }

      setSmacPicks([...smacPicks, data]);
      setNewPick({
        date: '',
        sport: '',
        game: '',
        bet: '',
        odds: 0,
        smacCoins: 0,
        weekNumber: 1,
        year: new Date().getFullYear(),
        potentialYield: 0
      });
      setIsCreatingPick(false);
    } catch (err: unknown) {
      console.error('Error creating SMAC pick:', err);
      alert(err instanceof Error ? err.message : 'Failed to create SMAC pick. Please try again.');
    }
  };

  const handleUpdateResult = async (pickId: string, result: string, odds: number, smacCoins: number) => {
    try {
      const pickYield = calculateYield(result, odds, smacCoins);
      console.log('Calculating yield:', { result, odds, smacCoins, pickYield });

      const response = await fetch(`/api/admin/smac-picks/${pickId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          result,
          yield: pickYield,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SMAC pick result');
      }

      const updatedPick = await response.json();
      console.log('Updated pick:', updatedPick);

      // Update the picks array with the new pick data
      setSmacPicks(prevPicks => 
        prevPicks.map(pick => 
          pick.id === pickId 
            ? { 
                ...pick, 
                result: result,
                yield: pickYield 
              }
            : pick
        )
      );
    } catch (err) {
      console.error('Error updating SMAC pick result:', err);
      alert('Failed to update SMAC pick result');
    }
  };

  // Update potential yield calculation in the form
  const handleOddsChange = (value: string) => {
    const odds = value === '' ? 0 : parseFloat(value);
    const smacCoins = newPick.smacCoins || 0;
    setNewPick({ 
      ...newPick, 
      odds,
      potentialYield: calculateYield('W', odds, smacCoins)
    });
  };

  const handleSmacCoinsChange = (value: string) => {
    const smacCoins = value === '' ? 0 : parseInt(value);
    const odds = newPick.odds || 0;
    setNewPick({ 
      ...newPick, 
      smacCoins,
      potentialYield: calculateYield('W', odds, smacCoins)
    });
  };

  if (status === 'loading') {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('articles')}
              className={`${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              SMAC Articles
            </button>
            <button
              onClick={() => setActiveTab('smac-picks')}
              className={`${
                activeTab === 'smac-picks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              SMAC Picks
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Manage Users
            </button>
          </nav>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'articles' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">SMAC Articles</h2>
              <button
                onClick={() => router.push('/admin/picks/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create New Article
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Game Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teams
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pick
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className={!article.published ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{article.title}</div>
                        <div className="text-xs text-gray-500">{article.author?.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(article.gameDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {article.homeTeam} vs {article.awayTeam}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{article.pick}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.published 
                            ? 'bg-green-100 text-green-800' 
                            : article.publishRequest 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {article.published ? 'Published' : article.publishRequest ? 'Pending' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handlePublishToggle(article.id, article.published)}
                          className={`mr-4 ${
                            article.published 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {article.published ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          onClick={() => router.push(`/admin/picks/${article.id}/edit`)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this article?')) {
                              try {
                                const response = await fetch(`/api/picks/${article.id}`, {
                                  method: 'DELETE',
                                });
                                if (!response.ok) {
                                  throw new Error('Failed to delete article');
                                }
                                setArticles(articles.filter((a) => a.id !== article.id));
                              } catch (err) {
                                console.error('Error deleting article:', err);
                                alert('Failed to delete article');
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'smac-picks' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">SMAC Picks</h2>
              <button
                onClick={() => setIsCreatingPick(!isCreatingPick)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {isCreatingPick ? 'Cancel' : 'Create SMAC Pick'}
              </button>
            </div>

            {isCreatingPick && (
              <form onSubmit={handleCreateSMACPick} className="bg-white rounded-lg shadow-md p-6 mb-8">
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
                      value={newPick.odds || ''}
                      onChange={(e) => handleOddsChange(e.target.value)}
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
                      min="0"
                      value={newPick.smacCoins || ''}
                      onChange={(e) => handleSmacCoinsChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                  </div>
                </div>
                {newPick.odds !== 0 && newPick.smacCoins !== 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-600">
                      Potential Yield: {newPick.potentialYield?.toFixed(2)}%
                    </p>
                  </div>
                )}
                <button
                  type="submit"
                  className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Pick
                </button>
              </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              {smacPicks.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="mb-4">No SMAC picks have been created yet.</p>
                  <p>Click "Create SMAC Pick" to add your first pick.</p>
                </div>
              ) : (
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
                    {smacPicks.map((pick) => (
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
                                onClick={() => handleUpdateResult(pick.id, 'W', pick.odds, pick.smacCoins)}
                                className="text-green-600 hover:text-green-900"
                              >
                                Win
                              </button>
                              <button
                                onClick={() => handleUpdateResult(pick.id, 'L', pick.odds, pick.smacCoins)}
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
              )}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Manage Users</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.isAdmin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleAdminToggle(user.id, user.isAdmin)}
                          className={user.isAdmin 
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-blue-600 hover:text-blue-900'
                          }
                        >
                          {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
} 