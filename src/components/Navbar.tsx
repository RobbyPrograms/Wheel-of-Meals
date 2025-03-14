'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { FaUser, FaBars, FaTimes, FaCog } from 'react-icons/fa';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-primary text-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Wheel of Meals
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="hover:text-white/80">
              Home
            </Link>
            <Link href="/about" className="hover:text-white/80">
              About
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="hover:text-white/80">
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center hover:text-white/80">
                    <FaUser className="mr-2" />
                    Account
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/setup"
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      <FaCog className="inline mr-2" />
                      Database Setup
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-white/80">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="bg-white text-primary px-4 py-2 rounded-md hover:bg-white/90"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className="hover:bg-primary-dark px-3 py-2 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="hover:bg-primary-dark px-3 py-2 rounded"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hover:bg-primary-dark px-3 py-2 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/setup"
                    className="hover:bg-primary-dark px-3 py-2 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaCog className="inline mr-2" />
                    Database Setup
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left hover:bg-primary-dark px-3 py-2 rounded"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hover:bg-primary-dark px-3 py-2 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-white text-primary px-3 py-2 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 