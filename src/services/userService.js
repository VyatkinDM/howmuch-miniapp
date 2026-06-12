import { supabase } from './supabase'

export async function getUserByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}