'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
  imageUrl: string | null;
  published: boolean;
  author?: {
    name: string;
    email: string;
  };
}

export default function RecentPicks() {
  const { data: session, status } = useSession();
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPicks = async () => {
      try {
        const response = await fetch('/api/picks');
        if (!response.ok) {
          throw new Error('Failed to fetch picks');
        }
        const data = await response.json();
        setPicks(data);
      } catch (err) {
        setError('Failed to load picks');
        console.error('Error fetching picks:', err);
      } finally {
        setLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchPicks();
    }
  }, [status]);

  if (loading) {
    return <div className="text-center py-8">Loading picks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (picks.length === 0) {
    return <div className="text-center py-8">No picks available yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {picks.map((pick) => (
        <Link 
          key={pick.id} 
          href={`/picks/${pick.id}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {pick.imageUrl && (
            <div className="relative h-48">
              <Image
                src={pick.imageUrl}
                alt={pick.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">{pick.title}</h3>
              <span className="text-sm text-gray-500">
                {new Date(pick.gameDate).toLocaleDateString()}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">{pick.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="font-semibold">{pick.homeTeam}</p>
                <p className="text-sm text-gray-500">Home</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">{pick.awayTeam}</p>
                <p className="text-sm text-gray-500">Away</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-blue-800">Our Pick: {pick.pick}</p>
              <p className="mt-2 text-blue-700 line-clamp-2">{pick.reasoning}</p>
              <p className="mt-2 text-blue-600 text-sm hover:underline">Read full analysis →</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 