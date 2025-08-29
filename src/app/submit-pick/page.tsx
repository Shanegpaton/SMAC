'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SubmitPick() {
  const [title, setTitle] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [pick, setPick] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const { data: session } = useSession();
  const router = useRouter();

  // Add debug info
  console.log('Current session:', session);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      console.log('Submitting pick with data:', {
        title,
        gameDate,
        homeTeam,
        awayTeam,
        pick,
        reasoning,
        imageUrl,
      });

      const response = await fetch('/api/picks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          gameDate,
          homeTeam,
          awayTeam,
          pick,
          reasoning,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error response:', data);
        throw new Error(data.details || data.error || 'Failed to submit pick');
      }

      setSuccess('Pick submitted successfully! It will be reviewed by our team.');
      // Clear form
      setTitle('');
      setGameDate('');
      setHomeTeam('');
      setAwayTeam('');
      setPick('');
      setReasoning('');
      setImageUrl('');
      
      // Redirect to my-posts after a short delay
      setTimeout(() => {
        router.push('/my-posts');
      }, 2000);
    } catch (err) {
      console.error('Error submitting pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit pick');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Submit SMAC Article</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">
            Please sign in to submit an article.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Submit SMAC Article</h1>
        <div className="flex items-center gap-4">
          <p className="text-sm text-gray-600">
            Signed in as: {session.user?.email}
          </p>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-[80vh]">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., NFL Week 5: Chiefs vs Bills"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 mb-1">
              Game Date
            </label>
            <input
              type="datetime-local"
              id="gameDate"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="homeTeam" className="block text-sm font-medium text-gray-700 mb-1">
              Home Team
            </label>
            <input
              type="text"
              id="homeTeam"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Kansas City Chiefs"
            />
          </div>

          <div>
            <label htmlFor="awayTeam" className="block text-sm font-medium text-gray-700 mb-1">
              Away Team
            </label>
            <input
              type="text"
              id="awayTeam"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Buffalo Bills"
            />
          </div>

          <div>
            <label htmlFor="pick" className="block text-sm font-medium text-gray-700 mb-1">
              Your Pick
            </label>
            <input
              type="text"
              id="pick"
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Chiefs -3.5"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-1">
            Reasoning
          </label>
          <textarea
            id="reasoning"
            value={reasoning}
            onChange={(e) => setReasoning(e.target.value)}
            required
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Explain your analysis and reasoning for this pick"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Pick'}
          </button>
        </div>
      </form>
    </div>
  );
} 