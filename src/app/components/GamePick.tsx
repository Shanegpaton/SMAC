'use client';

import { useState, useEffect } from 'react';

interface GamePick {
  id: string;
  title: string;
  description: string;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  reasoning: string;
}

export default function GamePick() {
  const [pick, setPick] = useState<GamePick | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestPick();
  }, []);

  const fetchLatestPick = async () => {
    try {
      const response = await fetch('/api/picks/latest');
      if (!response.ok) {
        throw new Error('Failed to fetch pick');
      }
      const data = await response.json();
      setPick(data);
    } catch (error) {
      setError('Failed to load game pick');
      console.error('Error fetching pick:', error);
    }
  };

  if (error) {
    return null; // Don't show anything if there's an error
  }

  if (!pick) {
    return null; // Don't show anything while loading
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4">Today's Game Pick</h2>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{pick.title}</h3>
        <p className="text-gray-600">{pick.description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="font-medium text-gray-700">Matchup</h4>
          <p className="text-lg">
            {pick.homeTeam} vs {pick.awayTeam}
          </p>
        </div>
        <div>
          <h4 className="font-medium text-gray-700">Game Date</h4>
          <p className="text-lg">
            {new Date(pick.gameDate).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="mb-4">
        <h4 className="font-medium text-gray-700">Our Pick</h4>
        <p className="text-xl font-bold text-blue-600">{pick.pick}</p>
      </div>
      <div>
        <h4 className="font-medium text-gray-700">Reasoning</h4>
        <p className="text-gray-700">{pick.reasoning}</p>
      </div>
    </div>
  );
} 