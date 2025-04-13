// Shared type definitions for the application

export type Meal = {
  id: string;
  name: string;
};

export type FavoriteFood = Meal & {
  ingredients: string;
  meal_types: string[];
  severity: number;
};

export type DayMeal = {
  breakfast: Meal | null;
  lunch: Meal | null;
  dinner: Meal | null;
};

export type WeeklyPlan = {
  [date: string]: DayMeal;
};

export type MealPlan = {
  id: string;
  name: string;
  user_id: string;
  start_date: string;
  end_date: string;
  plan: WeeklyPlan;
  created_at: string;
  no_repeat: boolean;
}; 