import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { getUserByTelegramId } from '../services/userService'

export default function Dashboard() {
  const [appUser, setAppUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    if (!telegramUser?.id) {
      setLoading(false)
      return
    }

    const user = await getUserByTelegramId(telegramUser.id)

    if (!user) {
      setLoading(false)
      return
    }

    setAppUser(user)

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setTransactions(data || [])
    }

    setLoading(false)
  }

  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount_uah || 0), 0)

  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount_uah || 0), 0)

  const balance = income - expense

  if (loading) {
    return <div style={{ padding: 20 }}>Завантаження...</div>
  }

  if (!telegramUser?.id) {
    return <div style={{ padding: 20 }}>Не вдалося отримати дані Telegram</div>
  }

  if (!appUser) {
    return <div style={{ padding: 20 }}>Користувача не знайдено в базі</div>
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>💰 HowMuch</h1>

      <p>Привіт, {telegramUser.first_name} 👋</p>

      <h2>Баланс: {balance.toFixed(2)} ₴</h2>

      <p>📈 Доходи: {income.toFixed(2)} ₴</p>
      <p>📉 Витрати: {expense.toFixed(2)} ₴</p>

      <h3>Останні операції</h3>

      {transactions.length === 0 && <p>Операцій поки немає</p>}

      {transactions.slice(0, 10).map(transaction => (
        <div key={transaction.id} style={{ marginBottom: 12 }}>
          <strong>
            {transaction.type === 'income' ? '+' : '-'}
            {Number(transaction.amount).toFixed(2)} {transaction.currency}
          </strong>
          <div>{transaction.category}</div>
          <small>{transaction.original_text}</small>
        </div>
      ))}
    </div>
  )
}