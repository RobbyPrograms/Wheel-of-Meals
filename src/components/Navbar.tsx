'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaUser, FaBars, FaTimes, FaCog, FaChevronDown, FaUserCircle } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const pathname = usePathname();
  const accountMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAccountMenu = () => {
    setIsAccountMenuOpen(!isAccountMenuOpen);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchUsername = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) setUsername(data.username);
      } catch (err) {
        console.error('Error fetching username:', err);
      }
    };

    fetchUsername();
  }, [user]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-primary/95 backdrop-blur-md shadow-lg py-3' 
          : 'bg-primary py-5'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <img 
              src="/logo.svg" 
              alt="SavoryCircle Logo" 
              className="w-10 h-10 mr-3 transition-transform duration-300 group-hover:scale-110" 
            />
            <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-[#319141] transition-colors">
              SAVORYCIRCLE
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white/90 hover:text-white focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`px-4 py-2 text-white/90 hover:text-white transition-colors relative group ${
                isActive('/') ? 'text-white' : ''
              }`}
            >
              <span>Home</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-highlight transform origin-left transition-transform duration-300 ${
                isActive('/') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}></span>
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-4 py-2 text-white/90 hover:text-white transition-colors relative group ${
                pathname.startsWith('/dashboard') ? 'text-white' : ''
              }`}
            >
              <span>Dashboard</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-highlight transform origin-left transition-transform duration-300 ${
                pathname.startsWith('/dashboard') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}></span>
            </Link>
            <Link 
              href="/about" 
              className={`px-4 py-2 text-white/90 hover:text-white transition-colors relative group ${
                isActive('/about') ? 'text-white' : ''
              }`}
            >
              <span>About</span>
              <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-highlight transform origin-left transition-transform duration-300 ${
                isActive('/about') ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}></span>
            </Link>
            
            {user ? (
              <div className="relative ml-2" ref={accountMenuRef}>
                <button 
                  onClick={toggleAccountMenu}
                  className="flex items-center px-4 py-2 text-white/90 hover:text-white transition-colors"
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="true"
                >
                  <FaUserCircle className="text-xl mr-2" />
                  <span>{username || 'Account'}</span>
                  <FaChevronDown className={`ml-2 text-xs transition-transform duration-200 ${
                    isAccountMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>
                
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-xl shadow-xl border border-gray-100 backdrop-blur-lg">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-accent hover:text-white transition-colors"
                    >
                      <FaUserCircle className="mr-2" />
                      Profile
                    </Link>
                    <div className="h-px bg-gray-200 my-2 mx-4"></div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsAccountMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 px-4 py-2 bg-accent hover:bg-highlight text-white rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10 pt-4">
            <div className="flex flex-col space-y-3">
              <Link
                href="/"
                className={`px-2 py-2 rounded-lg transition-colors ${
                  isActive('/') 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className={`px-2 py-2 rounded-lg transition-colors ${
                  pathname.startsWith('/dashboard')
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/about"
                className={`px-2 py-2 rounded-lg transition-colors ${
                  isActive('/about')
                    ? 'bg-white/10 text-white'
                    : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              
              {user ? (
                <>
                  <div className="h-px bg-white/10 my-2"></div>
                  <Link
                    href="/profile"
                    className="px-2 py-2 rounded-lg text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUserCircle className="inline mr-2" />
                    {username || 'Profile'}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="px-2 py-2 rounded-lg text-left text-red-300 hover:bg-white/5 hover:text-red-200 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-2 py-2 bg-accent hover:bg-highlight text-white rounded-lg transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 