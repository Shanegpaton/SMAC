'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreatePick() {
  const [sport, setSport] = useState('');
  const [game, setGame] = useState('');
  const [bet, setBet] = useState('');
  const [odds, setOdds] = useState('');
  const [smacCoins, setSmacCoins] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userSmacCoins, setUserSmacCoins] = useState<number>(0);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      fetchUserSmacCoins();
    }
  }, [session]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Validate all required fields
    if (!sport || !game || !bet || !odds || !smacCoins || !date) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    // Validate numeric fields
    const parsedOdds = parseFloat(odds);
    const parsedSmacCoins = parseInt(smacCoins);

    if (isNaN(parsedOdds)) {
      setError('Invalid odds value');
      setIsSubmitting(false);
      return;
    }

    if (isNaN(parsedSmacCoins) || parsedSmacCoins <= 0) {
      setError('SMAC coins must be a positive number');
      setIsSubmitting(false);
      return;
    }

    try {
      // Format the date to ISO string
      const formattedDate = new Date(date).toISOString();

      const formData = {
        sport,
        game,
        bet,
        odds: parsedOdds,
        smacCoins: parsedSmacCoins,
        date: formattedDate,
      };

      console.log('Submitting pick:', formData);

      const response = await fetch('/api/user-smac-picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create pick');
      }

      router.push('/my-posts');
    } catch (error) {
      console.error('Error creating pick:', error);
      setError(error.message || 'Failed to create pick');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p>You need to be signed in to create picks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black">Create SMAC Pick</h1>
          <div className="flex items-center space-x-6">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
                          <span className="text-black">SMAC Coins:</span>
            <span className="ml-2 font-semibold text-black">{userSmacCoins}</span>
            </div>
            <button
              onClick={() => router.push('/my-posts')}
              className="px-4 py-2 text-sm font-medium text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to My Posts
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="sport" className="block text-sm font-medium text-black">
              Sport
            </label>
            <input
              type="text"
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="game" className="block text-sm font-medium text-black">
              Game
            </label>
            <input
              type="text"
              id="game"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label htmlFor="bet" className="block text-sm font-medium text-black">
              Bet
            </label>
            <input
              type="text"
              id="bet"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="odds" className="block text-sm font-medium text-black">
                Odds
              </label>
              <input
                type="number"
                id="odds"
                value={odds}
                onChange={(e) => setOdds(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="smacCoins" className="block text-sm font-medium text-black">
                SMAC Coins
              </label>
              <input
                type="number"
                id="smacCoins"
                value={smacCoins}
                onChange={(e) => setSmacCoins(e.target.value)}
                min="0"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-black">
              Date
            </label>
            <input
              type="datetime-local"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Pick'}
          </button>
        </form>
      </div>
    </div>
  );
} 