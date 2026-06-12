import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { getUserByTelegramId } from '../services/userService'
import './Dashboard.css'

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

    if (!error) {
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

  function formatMoney(value) {
    return `${Number(value).toFixed(2)} ₴`
  }

  function getSign(type) {
    return type === 'income' ? '+' : '-'
  }

  if (loading) {
    return <div className="page">Завантаження...</div>
  }

  if (!telegramUser?.id) {
    return <div className="page">Не вдалося отримати дані Telegram</div>
  }

  if (!appUser) {
    return <div className="page">Користувача не знайдено в базі</div>
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1>💰 HowMuch</h1>
          <p>Привіт, {telegramUser.first_name} 👋</p>
        </div>
      </header>

      <section className="balance-card">
        <p>Поточний баланс</p>
        <h2>{formatMoney(balance)}</h2>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>📈 Доходи</span>
          <strong>{formatMoney(income)}</strong>
        </div>

        <div className="stat-card">
          <span>📉 Витрати</span>
          <strong>{formatMoney(expense)}</strong>
        </div>
      </section>

      <section className="section">
        <h3>Останні операції</h3>

        {transactions.length === 0 && (
          <p className="empty">Операцій поки немає</p>
        )}

        <div className="transaction-list">
          {transactions.slice(0, 10).map(transaction => (
            <div className="transaction-card" key={transaction.id}>
              <div>
                <strong>{transaction.category}</strong>
                <p>{transaction.original_text}</p>
              </div>

              <span className={transaction.type === 'income' ? 'amount income' : 'amount expense'}>
                {getSign(transaction.type)}
                {Number(transaction.amount_uah || 0).toFixed(2)} ₴
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}