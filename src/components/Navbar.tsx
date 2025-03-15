'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { FaUser, FaBars, FaTimes, FaCog, FaChevronDown, FaUserCircle } from 'react-icons/fa';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
    // Close the account menu when clicking outside
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

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-light transition-all duration-300 ${isScrolled ? 'py-3 shadow-subtle border-b border-border' : 'py-5'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="font-display font-bold text-xl tracking-tight text-primary">
              WHEELOFMEALS
            </span>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-primary focus:outline-none"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`nav-link ${isActive('/') ? 'nav-link-active' : ''}`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`nav-link ${isActive('/about') ? 'nav-link-active' : ''}`}
            >
              About
            </Link>
            <Link 
              href="/dashboard" 
              className={`nav-link ${pathname.startsWith('/dashboard') ? 'nav-link-active' : ''}`}
            >
              Dashboard
            </Link>
            {user ? (
              <div className="relative" ref={accountMenuRef}>
                <button 
                  className="flex items-center nav-link"
                  onClick={toggleAccountMenu}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="true"
                >
                  <span>Account</span>
                  <FaChevronDown className={`ml-1 text-xs opacity-70 transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right bg-light border border-border rounded-md shadow-medium py-1 z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-accent hover:bg-opacity-5 hover:text-accent"
                    >
                      <FaUserCircle className="inline mr-2 text-accent" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-text-primary hover:bg-accent hover:bg-opacity-5 hover:text-accent"
                    >
                      Dashboard
                    </Link>
                    <div className="divider my-1 mx-4"></div>
                    <button
                      onClick={() => {
                        signOut();
                        setIsAccountMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-accent hover:bg-opacity-5 hover:text-accent"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="nav-link"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border pt-4">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`px-2 py-1 ${isActive('/') ? 'text-accent' : 'text-text-primary hover:text-accent'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`px-2 py-1 ${isActive('/about') ? 'text-accent' : 'text-text-primary hover:text-accent'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/dashboard"
                className={`px-2 py-1 ${pathname.startsWith('/dashboard') ? 'text-accent' : 'text-text-primary hover:text-accent'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="px-2 py-1 text-text-primary hover:text-accent"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FaUserCircle className="inline mr-2 text-accent" />
                    Profile
                  </Link>
                  <div className="divider my-2"></div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-left px-2 py-1 text-text-primary hover:text-accent"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-2 py-1 text-text-primary hover:text-accent"
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