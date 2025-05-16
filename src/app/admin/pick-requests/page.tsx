'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GamePick {
  id: string;
  title: string;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  reasoning: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    name: string;
  };
}

export default function PickRequests() {
  const [picks, setPicks] = useState<GamePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchPickRequests();
    }
  }, [session]);

  const fetchPickRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/picks/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch pick requests');
      }

      const data = await response.json();
      setPicks(data);
    } catch (err) {
      console.error('Error fetching pick requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pick requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/picks/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to approve pick');
      }

      setSuccess('Pick approved successfully!');
      fetchPickRequests(); // Refresh the list
    } catch (err) {
      console.error('Error approving pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve pick');
    }
  };

  const handleReject = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/picks/${id}/reject`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reject pick');
      }

      setSuccess('Pick rejected successfully!');
      fetchPickRequests(); // Refresh the list
    } catch (err) {
      console.error('Error rejecting pick:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject pick');
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Pick Requests</h1>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Admin Dashboard
          </Link>
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

        {loading ? (
          <div className="text-center">Loading...</div>
        ) : picks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-600">No pick requests found.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {picks.map((pick) => (
              <div
                key={pick.id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{pick.title}</h3>
                    <p className="text-gray-500 text-sm">
                      By {pick.author.name} • {new Date(pick.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => router.push(`/admin/edit-pick/${pick.id}`)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleApprove(pick.id)}
                      className="text-green-500 hover:text-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(pick.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Matchup</h4>
                    <p className="text-lg">
                      {pick.homeTeam} vs {pick.awayTeam}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(pick.gameDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700">Pick</h4>
                    <p className="text-lg font-bold text-blue-600">{pick.pick}</p>
                  </div>
                </div>

                {pick.imageUrl && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700">Image</h4>
                    <img
                      src={pick.imageUrl}
                      alt="Pick image"
                      className="max-w-xs rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-700">Reasoning</h4>
                  <p className="text-gray-600">{pick.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 