import { getRecipes } from '@/lib/api'
import RecipeList from '@/components/RecipeList'
import type { Recipe } from '@/lib/api'

export const runtime = 'edge' // Cloudflare Pages用
export const revalidate = 0 // 常に最新データを取得

async function fetchRecipes(): Promise<Recipe[]> {
  try {
    return await getRecipes()
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return []
  }
}

export default async function Home() {
  const recipes = await fetchRecipes()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🍳 料理レシピ集
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Discordから収集したレシピ一覧
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {recipes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              レシピがまだ登録されていません
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Pythonスクリプトを実行してレシピを収集してください
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600">
                全 <span className="font-bold text-gray-900">{recipes.length}</span> 件のレシピ
              </p>
            </div>
            <RecipeList recipes={recipes} />
          </>
        )}
      </div>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            料理レシピURL管理システム
          </p>
        </div>
      </footer>
    </main>
  )
}
