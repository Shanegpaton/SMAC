'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
}

export default function ManagePicks() {
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newPick, setNewPick] = useState({
    title: '',
    description: '',
    gameDate: '',
    homeTeam: '',
    awayTeam: '',
    pick: '',
    reasoning: '',
  });
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchPicks();
    }
  }, [session]);

  const fetchPicks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/picks');
      if (!response.ok) {
        throw new Error('Failed to fetch picks');
      }
      const data = await response.json();
      setPicks(data);
      setError(null);
    } catch (error) {
      setError('No picks found. Create your first pick below!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePick = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      console.log('Submitting pick:', newPick);
      const response = await fetch('/api/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPick),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        if (data.missingFields) {
          const missingFields = Object.entries(data.missingFields)
            .filter(([_, isMissing]) => isMissing)
            .map(([field]) => field)
            .join(', ');
          throw new Error(`Please fill in all required fields: ${missingFields}`);
        }
        throw new Error(data.error || data.details || 'Failed to create pick');
      }

      setSuccess('Pick created successfully');
      setIsCreating(false);
      setNewPick({
        title: '',
        description: '',
        gameDate: '',
        homeTeam: '',
        awayTeam: '',
        pick: '',
        reasoning: '',
      });
      fetchPicks();
    } catch (error) {
      console.error('Detailed error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create pick');
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-black">Manage Articles</h1>
          <button
            onClick={() => router.push('/admin')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Admin Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
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
                  Title
                </label>
                <input
                  type="text"
                  value={newPick.title}
                  onChange={(e) => setNewPick({ ...newPick, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Game Date
                </label>
                <input
                  type="date"
                  value={newPick.gameDate}
                  onChange={(e) => setNewPick({ ...newPick, gameDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Home Team
                </label>
                <input
                  type="text"
                  value={newPick.homeTeam}
                  onChange={(e) => setNewPick({ ...newPick, homeTeam: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Away Team
                </label>
                <input
                  type="text"
                  value={newPick.awayTeam}
                  onChange={(e) => setNewPick({ ...newPick, awayTeam: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pick
                </label>
                <input
                  type="text"
                  value={newPick.pick}
                  onChange={(e) => setNewPick({ ...newPick, pick: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newPick.description}
                  onChange={(e) => setNewPick({ ...newPick, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reasoning
              </label>
              <textarea
                value={newPick.reasoning}
                onChange={(e) => setNewPick({ ...newPick, reasoning: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                rows={4}
                required
              />
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
            <p className="text-gray-600">No picks found. Create your first pick above!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pick
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {picks.map((pick) => (
                  <tr key={pick.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pick.homeTeam} vs {pick.awayTeam}
                      </div>
                      <div className="text-sm text-gray-500">{pick.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(pick.gameDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {pick.pick}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(pick.createdAt).toLocaleDateString()}
                      </div>
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