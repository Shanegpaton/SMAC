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

interface SMACCoinsDistribution {
  id: string;
  isActive: boolean;
  weeklyAmount: number;
  lastDistributed: string | null;
}

interface ResetCoinsResponse {
  success: boolean;
  message: string;
  users: Array<{
    email: string;
    newBalance: number;
  }>;
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
  const [activeTab, setActiveTab] = useState<'articles' | 'users' | 'smac-picks' | 'smac-coins'>('articles');
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
  const [distribution, setDistribution] = useState<SMACCoinsDistribution | null>(null);
  const [distributionAmount, setDistributionAmount] = useState<number>(0);
  const [isUpdatingDistribution, setIsUpdatingDistribution] = useState(false);
  const [isForcingDistribution, setIsForcingDistribution] = useState(false);
  const [distributionMessage, setDistributionMessage] = useState<string | null>(null);
  const [nextDistribution, setNextDistribution] = useState<Date | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (status !== 'authenticated') {
          console.log('Not authenticated, skipping fetch');
          return;
        }

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
            setSmacPicks(Array.isArray(data) ? data : []);
          } catch (fetchError) {
            console.error('Error fetching SMAC picks:', fetchError);
            setSmacPicks([]);
          }
        } else if (activeTab === 'smac-coins') {
          fetchDistributionSettings();
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

  useEffect(() => {
    if (activeTab === 'smac-coins') {
      fetchDistributionSettings();
    }
  }, [activeTab]);

  const fetchDistributionSettings = async () => {
    try {
      if (status !== 'authenticated') {
        console.log('Not authenticated, skipping distribution settings fetch');
        return;
      }

      console.log('Fetching distribution settings...');
      const response = await fetch('/api/admin/smac-coins-distribution');
      console.log('Distribution settings response:', response);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Distribution settings error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch distribution settings');
      }
      
      const data = await response.json();
      console.log('Distribution settings data:', data);
      setDistribution(data);
      setDistributionAmount(data.weeklyAmount || 0);
    } catch (error) {
      console.error('Error fetching distribution settings:', error);
      setError('Failed to load distribution settings');
    }
  };

  const handleDistributionToggle = async () => {
    try {
      setIsUpdatingDistribution(true);
      const response = await fetch('/api/admin/smac-coins-distribution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !distribution?.isActive,
          weeklyAmount: distributionAmount,
        }),
      });

      if (!response.ok) throw new Error('Failed to update distribution settings');
      const data = await response.json();
      setDistribution(data);
    } catch (error) {
      console.error('Error updating distribution settings:', error);
      setError('Failed to update distribution settings');
    } finally {
      setIsUpdatingDistribution(false);
    }
  };

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

  const handleUpdateResult = async (pickId: string, result: string) => {
    try {
      const response = await fetch(`/api/admin/smac-picks/${pickId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result }),
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
                yield: updatedPick.yield 
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

  const resetUserCoins = async (newBalance: number) => {
    try {
      const response = await fetch('/api/admin/reset-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newBalance }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset coin balances');
      }

      const data: ResetCoinsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error resetting coin balances:', error);
      throw error;
    }
  };

  const ResetCoinsSection = () => {
    const [newBalance, setNewBalance] = useState<number>(1000);
    const [isResetting, setIsResetting] = useState(false);
    const [resetMessage, setResetMessage] = useState<string | null>(null);

    const handleReset = async () => {
      if (!confirm('Are you sure you want to reset all users\' SMAC coin balances? This action cannot be undone.')) {
        return;
      }

      setIsResetting(true);
      setResetMessage(null);

      try {
        const result = await resetUserCoins(newBalance);
        setResetMessage(result.message);
      } catch (error) {
        setResetMessage(error instanceof Error ? error.message : 'Failed to reset coin balances');
      } finally {
        setIsResetting(false);
      }
    };

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      // Remove leading zeros and convert to number
      const numberValue = value === '' ? 0 : parseInt(value.replace(/^0+/, ''), 10);
      setNewBalance(numberValue);
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Reset User Coin Balances</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="newBalance" className="block text-sm font-medium text-gray-700">
              New Balance
            </label>
            <input
              type="number"
              id="newBalance"
              value={newBalance || ''}
              onChange={handleBalanceChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isResetting ? 'Resetting...' : 'Reset All Balances'}
          </button>
          {resetMessage && (
            <div className={`mt-2 text-sm ${resetMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
              {resetMessage}
            </div>
          )}
        </div>
      </div>
    );
  };

  const SMACCoinsDistributionSection = () => {
    const handleForceDistribution = async () => {
      if (!confirm('Are you sure you want to force distribute SMAC coins now?')) {
        return;
      }

      setIsForcingDistribution(true);
      setDistributionMessage(null);

      try {
        const response = await fetch('/api/admin/smac-coins-distribution/force', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to force distribution');
        }

        setDistributionMessage(data.message);
        // Refresh the distribution settings
        fetchDistributionSettings();
      } catch (error) {
        console.error('Error forcing distribution:', error);
        setDistributionMessage(error instanceof Error ? error.message : 'Failed to force distribution');
      } finally {
        setIsForcingDistribution(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekly Distribution Amount
              </label>
              <input
                type="number"
                min="0"
                value={distributionAmount}
                onChange={(e) => setDistributionAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                disabled={isUpdatingDistribution}
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleDistributionToggle}
                disabled={isUpdatingDistribution}
                className={`px-4 py-2 rounded-md text-white ${
                  distribution?.isActive
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isUpdatingDistribution
                  ? 'Updating...'
                  : distribution?.isActive
                  ? 'Stop Distribution'
                  : 'Start Distribution'}
              </button>

              {distribution?.isActive && (
                <button
                  onClick={handleForceDistribution}
                  disabled={isForcingDistribution}
                  className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isForcingDistribution ? 'Distributing...' : 'Force Distribution Now'}
                </button>
              )}

              {distribution?.isActive && (
                <span className="text-sm text-gray-500">
                  Last distributed: {distribution.lastDistributed
                    ? new Date(distribution.lastDistributed).toLocaleString()
                    : 'Never'}
                </span>
              )}
            </div>

            {distributionMessage && (
              <div className={`mt-2 p-4 rounded-md ${
                distributionMessage.includes('Failed') 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`}>
                {distributionMessage}
              </div>
            )}

            {distribution?.isActive && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  Weekly distribution is active. Each user will receive {distribution.weeklyAmount} SMAC coins every week.
                </p>
              </div>
            )}
          </div>
        </div>
        <ResetCoinsSection />
      </div>
    );
  };

  // Function to check distribution status
  const checkDistribution = async () => {
    try {
      const response = await fetch('/api/admin/smac-coins-distribution/check');
      const data = await response.json();
      
      if (data.nextDistribution) {
        setNextDistribution(new Date(data.nextDistribution));
      }
    } catch (error) {
      console.error('Error checking distribution:', error);
    }
  };

  // Set up interval to check distribution every minute
  useEffect(() => {
    if (distribution?.isActive) {
      // Check immediately
      checkDistribution();
      
      // Then check every minute
      const interval = setInterval(checkDistribution, 60000);
      return () => clearInterval(interval);
    }
  }, [distribution?.isActive]);

  if (status === 'loading') {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session?.user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold mb-4 text-black">Access Denied</h1>
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
    <div className="w-full max-w-7xl mx-auto p-3 md:p-6">
      <h1 className="text-3xl font-bold mb-8 text-black">Admin Dashboard</h1>
      
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap space-x-2 md:space-x-8">
            <button
              onClick={() => setActiveTab('articles')}
              className={`${
                activeTab === 'articles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm`}
              style={{ color: activeTab === 'articles' ? '#2563eb' : '#000000' }}
            >
              SMAC Articles
            </button>
            <button
              onClick={() => setActiveTab('smac-picks')}
              className={`${
                activeTab === 'smac-picks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm`}
              style={{ color: activeTab === 'smac-picks' ? '#2563eb' : '#000000' }}
            >
              SMAC Picks
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm`}
              style={{ color: activeTab === 'users' ? '#2563eb' : '#000000' }}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('smac-coins')}
              className={`${
                activeTab === 'smac-coins'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-black hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm`}
              style={{ color: activeTab === 'smac-coins' ? '#2563eb' : '#000000' }}
            >
              SMAC Coins
            </button>
          </nav>
        </div>
      </div>

      <div className="space-y-8">
        {activeTab === 'articles' && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">SMAC Articles</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Title
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Game Date
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Teams
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Pick
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                      <tr key={article.id} className={!article.published ? 'bg-yellow-50' : ''}>
                        <td className="px-3 md:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{article.title}</div>
                          <div className="text-xs text-gray-500">{article.author?.name}</div>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(article.gameDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {article.homeTeam} vs {article.awayTeam}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">{article.pick}</div>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
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
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                          onClick={() => router.push(`/admin/edit-article/${article.id}`)}
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
              </div>
            </div>
          </section>
        )}

        {activeTab === 'smac-picks' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold">SMAC Picks</h2>
              </div>
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
                <div className="relative">
                  <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                          Date
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Sport
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Game
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">
                          Bet
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Odds
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          SMAC Coins
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Result
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">
                          Yield
                        </th>
                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {smacPicks.map((pick) => (
                        <tr key={pick.id}>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(pick.date).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pick.sport}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{pick.game}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{pick.bet}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pick.odds}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pick.smacCoins}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{pick.result || '-'}</div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {pick.yield ? `${pick.yield}%` : '-'}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!pick.result && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleUpdateResult(pick.id, 'win')}
                                className="text-green-600 hover:text-green-900"
                              >
                                Win
                              </button>
                              <button
                                onClick={() => handleUpdateResult(pick.id, 'push')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Push
                              </button>
                              <button
                                onClick={() => handleUpdateResult(pick.id, 'loss')}
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
                  {/* Scroll indicators */}
                  <button 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) container.scrollBy({ left: -200, behavior: 'smooth' });
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50 z-10"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) container.scrollBy({ left: 200, behavior: 'smooth' });
                    }}
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Manage Users</h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="relative">
                <div className="overflow-x-auto border border-gray-200 rounded-lg" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Name
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">
                        Email
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                        Status
                      </th>
                      <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-3 md:px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{user.name}</div>
                        </td>
                        <td className="px-3 md:px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">{user.email}</div>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.isAdmin 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
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
              </div>
            </div>
          </section>
        )}

        {activeTab === 'smac-coins' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">SMAC Coins Distribution</h2>
            </div>

            <SMACCoinsDistributionSection />
          </section>
        )}
      </div>
    </div>
  );
} 