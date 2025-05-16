'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          SMAC
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link href="/portfolio" className="hover:text-gray-300">
            Portfolio
          </Link>
          <Link href="/traders" className="hover:text-gray-300">
            Traders
          </Link>
          <Link href="/about" className="hover:text-gray-300">
            About
          </Link>
          <Link href="/submit-pick" className="hover:text-gray-300">
            Submit SMAC Article
          </Link>
          {session?.user?.isAdmin && (
            <Link href="/admin" className="hover:text-gray-300">
              Admin
            </Link>
          )}
          {session && (
            <Link href="/my-posts" className="hover:text-gray-300">
              My Posts
            </Link>
          )}
        </div>
        <div className="space-x-4">
          {status === 'loading' ? (
            <span>Loading...</span>
          ) : session ? (
            <div className="flex items-center space-x-4">
              <span>{session.user?.name || session.user?.email}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                href="/auth/signin"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
} 