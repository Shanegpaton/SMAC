'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-white" onClick={closeMenu}>
            SMAC
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white hover:text-gray-300 transition-colors">
              Home
            </Link>
            <Link href="/portfolio" className="text-white hover:text-gray-300 transition-colors">
              Portfolio
            </Link>
            <Link href="/traders" className="text-white hover:text-gray-300 transition-colors">
              Traders
            </Link>
            <Link href="/about" className="text-white hover:text-gray-300 transition-colors">
              About
            </Link>
            <Link href="/submit-pick" className="text-white hover:text-gray-300 transition-colors">
              Submit SMAC Article
            </Link>
            {session?.user?.isAdmin && (
              <Link href="/admin" className="text-white hover:text-gray-300 transition-colors">
                Admin
              </Link>
            )}
            {session && (
              <Link href="/my-posts" className="text-white hover:text-gray-300 transition-colors">
                My Posts
              </Link>
            )}
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <span className="text-white">Loading...</span>
            ) : session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-white">{session.user?.name || session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {status === 'loading' ? (
              <span className="text-sm text-white">Loading...</span>
            ) : session ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm truncate max-w-20 text-white">{session.user?.name || session.user?.email}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  href="/auth/signin"
                  className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
            
            <button
              onClick={toggleMenu}
              className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

                       {/* Mobile Navigation Menu */}
               <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} pb-4`}>
                 <div className="flex flex-col space-y-3 pt-2 border-t border-gray-700">
                   <Link
                     href="/"
                     className="text-white hover:text-gray-300 transition-colors py-2"
                     onClick={closeMenu}
                   >
                     Home
                   </Link>
                   <Link
                     href="/portfolio"
                     className="text-white hover:text-gray-300 transition-colors py-2"
                     onClick={closeMenu}
                   >
                     Portfolio
                   </Link>
                   <Link
                     href="/traders"
                     className="text-white hover:text-gray-300 transition-colors py-2"
                     onClick={closeMenu}
                   >
                     Traders
                   </Link>
                   <Link
                     href="/about"
                     className="text-white hover:text-gray-300 transition-colors py-2"
                     onClick={closeMenu}
                   >
                     About
                   </Link>
                   <Link
                     href="/submit-pick"
                     className="text-white hover:text-gray-300 transition-colors py-2"
                     onClick={closeMenu}
                   >
                     Submit SMAC Article
                   </Link>
                   {session?.user?.isAdmin && (
                     <Link
                       href="/admin"
                       className="text-white hover:text-gray-300 transition-colors py-2"
                       onClick={closeMenu}
                     >
                       Admin
                     </Link>
                   )}
                   {session && (
                     <Link
                       href="/my-posts"
                       className="text-white hover:text-gray-300 transition-colors py-2"
                       onClick={closeMenu}
                     >
                       My Posts
                     </Link>
                   )}
                 </div>
               </div>
      </div>
    </nav>
  );
} 