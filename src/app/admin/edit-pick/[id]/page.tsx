'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { use } from 'react';

interface GamePick {
  id: string;
  title: string;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  reasoning: string;
  imageUrl: string | null;
  published: boolean;
  publishRequest: boolean;
}

export default function AdminEditPick({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [pick, setPick] = useState<GamePick | null>(null);
  const [title, setTitle] = useState('');
  const [gameDate, setGameDate] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [pickValue, setPickValue] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchPick();
    }
  }, [session, resolvedParams.id]);

  const fetchPick = async () => {
    try {
      const response = await fetch(`/api/picks/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pick');
      }
      const data = await response.json();
      setPick(data);
      setTitle(data.title);
      setGameDate(data.gameDate.split('T')[0]);
      setHomeTeam(data.homeTeam);
      setAwayTeam(data.awayTeam);
      setPickValue(data.pick);
      setReasoning(data.reasoning);
      setImageUrl(data.imageUrl);
    } catch (error) {
      setError('Failed to load pick');
      console.error('Error fetching pick:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setImageUrl(data.url);
      setSuccess('Image uploaded successfully');
    } catch (error) {
      setError('Failed to upload image');
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/picks/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          gameDate,
          homeTeam,
          awayTeam,
          pick: pickValue,
          reasoning,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      setSuccess('Pick updated successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error updating pick:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
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

  if (!pick) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Edit SMAC Article</h1>
        <button
          onClick={() => router.push('/admin/pick-requests')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back to Requests
        </button>
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

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="gameDate" className="block text-sm font-medium text-gray-700 mb-1">
              Game Date
            </label>
            <input
              type="date"
              id="gameDate"
              value={gameDate}
              onChange={(e) => setGameDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pick" className="block text-sm font-medium text-gray-700 mb-1">
              Pick
            </label>
            <input
              type="text"
              id="pick"
              value={pickValue}
              onChange={(e) => setPickValue(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {isUploading && <span className="text-sm text-gray-500">Uploading...</span>}
          </div>
          {imageUrl && (
            <div className="mt-2">
              <Image
                src={imageUrl}
                alt="Pick image"
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/admin/pick-requests')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 