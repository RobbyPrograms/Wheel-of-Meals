// Shared type definitions for the application

export type FavoriteFood = {
  id: string;
  name: string;
  ingredients: string[];
  meal_types: string[];
  severity: number;
};

export type DayMeal = {
  breakfast: { name: string } | null;
  lunch: { name: string } | null;
  dinner: { name: string } | null;
};

export type WeeklyPlan = {
  [key: string]: DayMeal;
};

export type MealPlan = {
  id: string;
  name: string;
  created_at: string;
  start_date: string;
  end_date: string;
  plan: WeeklyPlan;
  no_repeat: boolean;
}; 