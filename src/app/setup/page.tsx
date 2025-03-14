'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { checkDatabaseSetup, type DatabaseCheckResult } from '@/lib/check-database';
import { supabase } from '@/lib/supabase';

export default function SetupPage() {
  const { user, loading } = useAuth();
  const [dbCheckResult, setDbCheckResult] = useState<DatabaseCheckResult | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [setupStatus, setSetupStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  const handleCheckDatabase = async () => {
    setCheckingDb(true);
    try {
      const result = await checkDatabaseSetup();
      setDbCheckResult(result);
    } catch (err: any) {
      console.error('Error checking database:', err);
    } finally {
      setCheckingDb(false);
    }
  };

  const handleSetupDatabase = async () => {
    setSetupStatus('running');
    setSetupError(null);
    setSetupSuccess(null);

    try {
      // Create favorite_foods table
      const { error: createFavoriteFoodsError } = await supabase.rpc('setup_favorite_foods_table');

      if (createFavoriteFoodsError) {
        throw new Error(`Error creating favorite_foods table: ${createFavoriteFoodsError.message}`);
      }

      // Create meal_plans table
      const { error: createMealPlansError } = await supabase.rpc('setup_meal_plans_table');

      if (createMealPlansError) {
        throw new Error(`Error creating meal_plans table: ${createMealPlansError.message}`);
      }

      setSetupSuccess('Database tables created successfully! You can now use the application.');
      setSetupStatus('success');
      
      // Re-check database after setup
      await handleCheckDatabase();
    } catch (err: any) {
      console.error('Error setting up database:', err);
      setSetupError(err.message || 'An error occurred while setting up the database');
      setSetupStatus('error');
    }
  };

  useEffect(() => {
    if (!loading) {
      handleCheckDatabase();
    }
  }, [loading]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Wheel of Meals - Database Setup</h1>
        </div>
      </header>

      <main className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Database Configuration</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="mb-4">
                  This page helps you set up the necessary database tables for the Wheel of Meals application.
                  Before using the app, you need to ensure your Supabase database is properly configured.
                </p>

                {!user && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
                    <p className="text-yellow-700">
                      You are not logged in. Some database operations may require authentication.{' '}
                      <Link href="/login" className="text-blue-600 hover:underline">
                        Log in here
                      </Link>
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Database Status</h3>
                
                <button
                  onClick={handleCheckDatabase}
                  disabled={checkingDb}
                  className="mb-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {checkingDb ? 'Checking...' : 'Check Database Status'}
                </button>

                {dbCheckResult && (
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Database Check Results:</h4>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center">
                        <span className={`inline-block w-6 h-6 rounded-full mr-2 ${dbCheckResult.tablesExist.favorite_foods ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>favorite_foods table: {dbCheckResult.tablesExist.favorite_foods ? 'Exists' : 'Missing'}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`inline-block w-6 h-6 rounded-full mr-2 ${dbCheckResult.tablesExist.meal_plans ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>meal_plans table: {dbCheckResult.tablesExist.meal_plans ? 'Exists' : 'Missing'}</span>
                      </div>
                    </div>

                    {dbCheckResult.errors.length > 0 && (
                      <div className="bg-red-50 p-3 rounded-md mb-4">
                        <h5 className="text-red-700 font-medium mb-1">Errors:</h5>
                        <ul className="list-disc pl-5 text-red-700">
                          {dbCheckResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {dbCheckResult.success ? (
                      <div className="bg-green-50 p-3 rounded-md">
                        <p className="text-green-700">
                          Your database is properly configured! You can now use the application.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 p-3 rounded-md">
                        <p className="text-yellow-700">
                          Your database needs to be set up. Click the "Setup Database" button below.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {dbCheckResult && !dbCheckResult.success && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Setup Database</h3>
                  
                  {setupError && (
                    <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
                      <p className="text-red-700">{setupError}</p>
                    </div>
                  )}
                  
                  {setupSuccess && (
                    <div className="bg-green-100 border-l-4 border-green-500 p-4 mb-4">
                      <p className="text-green-700">{setupSuccess}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <p className="mb-2">
                      This will create the following tables in your Supabase database:
                    </p>
                    <ul className="list-disc pl-5 mb-2">
                      <li>favorite_foods - Stores your favorite food items</li>
                      <li>meal_plans - Stores your meal plans</li>
                    </ul>
                    <p className="text-sm text-gray-600">
                      Note: You need to have the appropriate Supabase functions set up for this to work.
                      See the SUPABASE_SETUP.md file for manual setup instructions.
                    </p>
                  </div>

                  <button
                    onClick={handleSetupDatabase}
                    disabled={setupStatus === 'running'}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300"
                  >
                    {setupStatus === 'running' ? 'Setting Up...' : 'Setup Database'}
                  </button>
                </div>
              )}

              <div className="mt-8 pt-4 border-t">
                <Link href="/" className="text-blue-600 hover:underline">
                  ← Back to Home
                </Link>
                {dbCheckResult?.success && (
                  <Link href="/dashboard" className="ml-4 text-blue-600 hover:underline">
                    Go to Dashboard →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
} 