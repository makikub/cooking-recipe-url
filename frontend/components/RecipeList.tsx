'use client'

import RecipeCard from './RecipeCard'
import type { Recipe } from '@/lib/supabase'

type RecipeListProps = {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: RecipeListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
