import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Recipe = {
  id: string
  url: string
  title: string
  image_url: string | null
  description: string | null
  ingredients: string[]
  cuisine_type: string
  category: string
  posted_at: string
  created_at: string
  updated_at: string
}
