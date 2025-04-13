import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { FaTimes } from 'react-icons/fa';

type DayMeal = {
  breakfast: { id: string; name: string } | null;
  lunch: { id: string; name: string } | null;
  dinner: { id: string; name: string } | null;
};

type WeeklyPlan = {
  [key: string]: DayMeal;
};

type MealPlan = {
  id: string;
  name: string;
  created_at: string;
  start_date: string;
  end_date: string;
  plan: WeeklyPlan;
  no_repeat: boolean;
};

interface MealPlanEditorProps {
  mealPlan: MealPlan;
  onClose: () => void;
}

export default function MealPlanEditor({ mealPlan, onClose }: MealPlanEditorProps) {
  const { user } = useAuth();
  const [plan, setPlan] = useState(mealPlan.plan);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!user) {
      setError('You must be logged in to edit a meal plan');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('meal_plans')
        .update({
          plan
        })
        .eq('id', mealPlan.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      onClose();
    } catch (err) {
      console.error('Error updating meal plan:', err);
      setError('Failed to update meal plan. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMeal = (date: string, slot: keyof DayMeal) => {
    setPlan(prevPlan => {
      const newPlan = { ...prevPlan };
      const dayMeals = { ...newPlan[date] };
      dayMeals[slot] = null;
      newPlan[date] = dayMeals;
      return newPlan;
    });
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
  };

  const handleDelete = async () => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', mealPlan.id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      onClose();
    } catch (err) {
      console.error('Error deleting meal plan:', err);
      setError('Failed to delete meal plan. Please try again.');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Meal Plans</h2>
          <div className="text-sm text-gray-600">
            {formatDate(mealPlan.start_date)} - {formatDate(mealPlan.end_date)} • {mealPlan.no_repeat ? 'No Repeats' : 'Repeats Allowed'}
          </div>
          <div className="text-sm text-gray-600">
            Created: {formatDate(mealPlan.created_at)}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#2B593F] text-white rounded-md hover:bg-[#1F4530] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            Export CSV
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(plan).map(([date, meals]) => (
          <div key={date} className="rounded-lg bg-white">
            <div className="px-4 py-2 border-b">
              <h3 className="font-medium">{formatDate(date)}</h3>
            </div>
            <div>
              {Object.entries(meals).map(([slot, meal]) => {
                if (!meal) return null;
                return (
                  <div key={slot} className="px-4 py-3 flex items-center justify-between border-b last:border-b-0">
                    <div>
                      <span className="text-gray-600 mr-2 capitalize">{slot}:</span>
                      <span>{meal.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal(date, slot as keyof DayMeal)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 