'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface MealPlanFormProps {
  onSuccess?: () => void;
}

export default function MealPlanForm({ onSuccess }: MealPlanFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a meal plan');
      return;
    }

    if (!name) {
      setError('Please enter a name for your meal plan');
      return;
    }

    if (!dateRange[0] || !dateRange[1]) {
      setError('Please select a date range for your meal plan');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('meal_plans')
        .insert({
          name,
          user_id: user.id,
          start_date: dateRange[0].toISOString(),
          end_date: dateRange[1].toISOString(),
          plan: {
            meals: []
          }
        });

      if (insertError) {
        throw insertError;
      }

      // Reset form
      setName('');
      setDateRange([null, null]);
      
      // Notify parent of success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating meal plan:', err);
      setError('Failed to create meal plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">
          Plan Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholder="Weekly Meal Plan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-text-primary mb-1">
          Date Range
        </label>
        <DatePicker
          selectsRange
          startDate={dateRange[0]}
          endDate={dateRange[1]}
          onChange={(update) => setDateRange(update)}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          placeholderText="Select date range"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Creating...' : 'Create Meal Plan'}
      </button>
    </form>
  );
} 