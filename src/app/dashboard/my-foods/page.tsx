  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Food Name</label>
    <input
      type="text"
      placeholder="e.g., Pizza"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    />
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Meal Type</label>
    <div className="flex flex-wrap gap-2">
      {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert'].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => setMealType(type)}
          className={`px-4 py-2 rounded-md ${
            mealType === type
              ? 'bg-accent text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Rating</label>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className="text-xl"
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Main Ingredients</label>
    <textarea
      placeholder="e.g., Dough, tomato sauce, cheese"
      value={ingredients}
      onChange={(e) => setIngredients(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
      rows={3}
    />
  </div>

  <div className="mb-4">
    <label className="block text-sm font-medium mb-2">Recipe Instructions</label>
    <textarea
      placeholder="e.g., 1. Preheat oven to 450°F 2. Roll out the dough 3. Add toppings 4. Bake for 15-20 minutes"
      value={recipe}
      onChange={(e) => setRecipe(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
      rows={4}
    />
  </div>

  <div className="mb-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={`w-12 h-6 rounded-full transition-colors relative ${
          isPublic ? 'bg-accent' : 'bg-gray-200'
        }`}
        onClick={() => setIsPublic(!isPublic)}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            isPublic ? 'left-7' : 'left-1'
          }`}
        />
      </div>
      <span className="text-sm font-medium text-gray-700">
        {isPublic ? (
          <span className="flex items-center gap-1">
            <FaEye /> Public - Friends can see this meal
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <FaEyeSlash /> Private - Only you can see this meal
          </span>
        )}
      </span>
    </label>
  </div>

  <div className="flex justify-end gap-2">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-gray-600 hover:text-gray-800"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
    >
      Add Food
    </button>
  </div> 