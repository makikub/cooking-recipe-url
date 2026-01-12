'use client'

import { useState, useMemo } from 'react'
import RecipeCard from './RecipeCard'
import type { Recipe } from '@/lib/api'

type RecipeListProps = {
  recipes: Recipe[]
}

export default function RecipeList({ recipes }: RecipeListProps) {
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All')

  // ユニークなジャンル一覧を取得
  const cuisineTypes = useMemo(() => {
    const types = new Set(recipes.map((r) => r.cuisine_type).filter(Boolean))
    return ['All', ...Array.from(types)]
  }, [recipes])

  // フィルタリングされたレシピ
  const filteredRecipes = useMemo(() => {
    if (selectedCuisine === 'All') return recipes
    return recipes.filter((r) => r.cuisine_type === selectedCuisine)
  }, [recipes, selectedCuisine])

  return (
    <div>
      {/* フィルターボタン */}
      <div className="flex flex-wrap gap-2 mb-8">
        {cuisineTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedCuisine(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCuisine === type
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            {type === 'All' ? 'すべて' : type}
          </button>
        ))}
      </div>

      {/* レシピグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  )
}
