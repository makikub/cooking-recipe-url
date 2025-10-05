'use client'

import Image from 'next/image'
import type { Recipe } from '@/lib/supabase'

type RecipeCardProps = {
  recipe: Recipe
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
  const imageUrl = recipe.image_url || '/default-recipe.png'
  
  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <a
      href={recipe.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      {/* 画像 */}
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          src={imageUrl}
          alt={recipe.title}
          fill
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = '/default-recipe.png'
          }}
        />
      </div>

      {/* コンテンツ */}
      <div className="p-4">
        {/* タイトル */}
        <h2 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h2>

        {/* ジャンル・カテゴリ */}
        <div className="flex gap-2 mb-3">
          {recipe.cuisine_type && (
            <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">
              {recipe.cuisine_type}
            </span>
          )}
          {recipe.category && (
            <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">
              {recipe.category}
            </span>
          )}
        </div>

        {/* 素材タグ */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded"
              >
                {ingredient}
              </span>
            ))}
          </div>
        )}

        {/* 説明文 */}
        {recipe.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* 投稿日時 */}
        <div className="text-xs text-gray-400">
          {formatDate(recipe.posted_at)}
        </div>
      </div>
    </a>
  )
}
