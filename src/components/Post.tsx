import Image from 'next/image';
import { format as formatDate } from 'date-fns';

interface PostProps {
  title: string;
  ingredients: string[];
  recipe: string[];
  author: string;
  created_at: string;
  image_url?: string | null;
}

export default function Post({ title, ingredients, recipe, author, created_at, image_url }: PostProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {image_url && (
        <div className="relative w-full aspect-video">
          <Image
            src={image_url}
            alt={title}
            fill
            className="object-cover"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-500">
            {formatDate(new Date(created_at), 'MMM d, yyyy')}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Recipe</h3>
            <ol className="list-decimal list-inside space-y-2">
              {recipe.map((step, index) => (
                <li key={index} className="text-gray-700">{step}</li>
              ))}
            </ol>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Posted by <span className="font-medium text-gray-700">{author}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 