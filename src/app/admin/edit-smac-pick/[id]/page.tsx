'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
  userId: string;
  user: {
    name: string;
  };
}

export default function EditSMACPick() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const pickId = params.id as string;
  
  const [pick, setPick] = useState<UserSMACPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    date: '',
    sport: '',
    game: '',
    bet: '',
    odds: 0,
    smacCoins: 0,
    result: '',
    weekNumber: 0,
    year: 0
  });

  useEffect(() => {
    if (pickId) {
      fetchPick();
    }
  }, [pickId]);

  const fetchPick = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/user-smac-picks/${pickId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pick');
      }

      const pickData = await response.json();
      setPick(pickData);
      
      // Set form data
      setFormData({
        date: pickData.date ? new Date(pickData.date).toISOString().slice(0, 16) : '',
        sport: pickData.sport || '',
        game: pickData.game || '',
        bet: pickData.bet || '',
        odds: pickData.odds || 0,
        smacCoins: pickData.smacCoins || 0,
        result: pickData.result || '',
        weekNumber: pickData.weekNumber || 0,
        year: pickData.year || new Date().getFullYear()
      });

    } catch (err) {
      console.error('Error fetching pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pick');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/user-smac-picks/${pickId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date(formData.date).toISOString(),
          odds: Number(formData.odds),
          smacCoins: Number(formData.smacCoins),
          weekNumber: Number(formData.weekNumber),
          year: Number(formData.year)
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pick');
      }

      // Redirect back to trader profile
      router.push(`/traders/${pick?.userId}`);
    } catch (err) {
      console.error('Error updating pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to update pick');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!session?.user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Access denied. Admin privileges required.</div>
        <button 
          onClick={() => router.push('/')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Go Home
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error || !pick) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error || 'Pick not found'}</div>
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
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => router.push(`/traders/${pick.userId}`)} 
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to {pick.user.name}'s Profile
          </button>
          <h1 className="text-3xl font-bold text-black">Edit SMAC Pick</h1>
          <p className="text-gray-600">Editing pick for {pick.user.name}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-2">
                  Sport
                </label>
                <input
                  type="text"
                  id="sport"
                  name="sport"
                  value={formData.sport}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="game" className="block text-sm font-medium text-gray-700 mb-2">
                  Game
                </label>
                <input
                  type="text"
                  id="game"
                  name="game"
                  value={formData.game}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="bet" className="block text-sm font-medium text-gray-700 mb-2">
                  Bet
                </label>
                <input
                  type="text"
                  id="bet"
                  name="bet"
                  value={formData.bet}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="odds" className="block text-sm font-medium text-gray-700 mb-2">
                  Odds
                </label>
                <input
                  type="number"
                  step="0.1"
                  id="odds"
                  name="odds"
                  value={formData.odds}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="smacCoins" className="block text-sm font-medium text-gray-700 mb-2">
                  SMAC Coins
                </label>
                <input
                  type="number"
                  id="smacCoins"
                  name="smacCoins"
                  value={formData.smacCoins}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="result" className="block text-sm font-medium text-gray-700 mb-2">
                  Result
                </label>
                <select
                  id="result"
                  name="result"
                  value={formData.result}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Result</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="push">Push</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calculated Yield (%)
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                  {formData.result === 'win' 
                    ? formData.odds > 0 
                      ? `${formData.odds}%` 
                      : `${Math.floor((100 * 100) / Math.abs(formData.odds))}%`
                    : formData.result === 'loss' 
                      ? '-100%' 
                      : formData.result === 'push' 
                        ? '0%' 
                        : 'Pending...'}
                </div>
              </div>

              <div>
                <label htmlFor="weekNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Week Number
                </label>
                <input
                  type="number"
                  id="weekNumber"
                  name="weekNumber"
                  value={formData.weekNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/traders/${pick.userId}`)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
