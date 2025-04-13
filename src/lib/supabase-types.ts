export type FavoriteFood = {
  id: string;
  user_id: string;
  name: string;
  ingredients: string[];
  recipe: string;
  rating?: number;
  meal_types: string[];
  created_at: string;
  visibility?: 'public' | 'private';
};

export type MealPlan = {
  id: string;
  user_id: string;
  meals: Meal[];
  duration: number;
  created_at: string;
};

export type Meal = {
  id: string;
  name: string;
  ingredients?: string[];
  day?: number;
  mealTime?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}; 