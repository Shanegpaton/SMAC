'use client';

import { useState, useEffect } from 'react';

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

export default function Traders() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTraders = async () => {
      try {
        const response = await fetch('/api/traders');
        if (!response.ok) {
          throw new Error('Failed to fetch traders');
        }
        const data = await response.json();
        console.log('Fetched traders data:', data); // Debug log
        setTraders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load traders');
      } finally {
        setLoading(false);
      }
    };

    fetchTraders();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Our Traders</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {traders.map((trader) => (
            <div key={trader.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold">{trader.name}</h2>
                <div className="text-right">
                  <div className="text-sm text-gray-500">SMAC Coins</div>
                  <div className="text-xl font-bold text-indigo-600">{trader.smacCoins}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded">
                  <div className="grid grid-cols-2 gap-4">
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
          ))}
        </div>
      </div>
    </div>
  );
} 