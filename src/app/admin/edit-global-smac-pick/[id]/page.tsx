'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type ResultType = '' | 'win' | 'loss' | 'push';

export default function EditGlobalSMACPickPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pick, setPick] = useState<any>(null);
  const [result, setResult] = useState<ResultType>('');
  const [form, setForm] = useState({
    date: '',
    sport: '',
    game: '',
    bet: '',
    odds: 0,
    smacCoins: 0,
    weekNumber: 0,
    year: 0,
  });

  useEffect(() => {
    const fetchPick = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/smac-picks/${id}`);
        if (!res.ok) throw new Error('Failed to fetch pick');
        const data = await res.json();
        setPick(data);
        setResult((data.result || '') as ResultType);
        setForm({
          date: data.date ? new Date(data.date).toISOString().slice(0,16) : '',
          sport: data.sport || '',
          game: data.game || '',
          bet: data.bet || '',
          odds: data.odds || 0,
          smacCoins: data.smacCoins || 0,
          weekNumber: data.weekNumber || 0,
          year: data.year || new Date().getFullYear(),
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load pick');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPick();
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      // First update details if changed
      const detailsRes = await fetch(`/api/smac-picks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date ? new Date(form.date).toISOString() : undefined,
          sport: form.sport,
          game: form.game,
          bet: form.bet,
          odds: Number(form.odds),
          smacCoins: Number(form.smacCoins),
          weekNumber: Number(form.weekNumber),
          year: Number(form.year),
        }),
      });
      if (!detailsRes.ok) throw new Error('Failed to update pick details');

      // Then update result only if it actually changed
      if ((pick?.result || '') !== result) {
        const res = await fetch(`/api/admin/smac-picks/${id}/result`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ result }),
        });
        if (!res.ok) throw new Error('Failed to update result');
      }
      router.push('/admin');
    } catch (e: any) {
      setError(e.message || 'Failed to update result');
    } finally {
      setSaving(false);
    }
  };

  if (!session?.user?.isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">Access denied. Admin privileges required.</div>
        <button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
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
        <button onClick={() => router.push('/admin')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Back to Admin
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-6">
        <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 mb-4">← Back</button>
        <h1 className="text-2xl font-bold text-black mb-2">Edit Global SMAC Pick</h1>
        <p className="text-gray-600 mb-6">{pick.sport} • {pick.game} • {pick.bet}</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.sport}
                onChange={(e) => setForm({ ...form, sport: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Game</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bet</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.bet}
                onChange={(e) => setForm({ ...form, bet: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Odds</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.odds}
                onChange={(e) => setForm({ ...form, odds: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMAC Coins</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.smacCoins}
                onChange={(e) => setForm({ ...form, smacCoins: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Week Number</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.weekNumber}
                onChange={(e) => setForm({ ...form, weekNumber: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={result}
              onChange={(e) => setResult(e.target.value as ResultType)}
            >
              <option value="">No Result</option>
              <option value="win">Win</option>
              <option value="loss">Loss</option>
              <option value="push">Push</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            <div>Odds: {pick.odds}</div>
            <div>Stake: {pick.smacCoins}</div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => router.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


