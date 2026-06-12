import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import { getUserByTelegramId } from '../services/userService'
import './Dashboard.css'

export default function Dashboard() {
  const [appUser, setAppUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')

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

  function getCurrencySymbol(currency) {
    const symbols = {
      UAH: '₴',
      USD: '$',
      EUR: '€',
      PLN: 'zł',
    }

    return symbols[currency] || currency
  }

  function formatMoney(value) {
    return `${Number(value).toFixed(2)} ₴`
  }

  function formatTransactionAmount(transaction) {
    const sign = transaction.type === 'income' ? '+' : '-'
    const amount = Number(transaction.amount || 0).toFixed(2)
    const amountUah = Number(transaction.amount_uah || 0).toFixed(2)
    const symbol = getCurrencySymbol(transaction.currency)

    if (transaction.currency !== 'UAH') {
      return (
        <>
          <span>
            {sign}{amount} {symbol}
          </span>
          <small className="amount-uah">
            ≈ {sign}{amountUah} ₴
          </small>
        </>
      )
    }

    return (
      <>
        <span>
          {sign}{amountUah} ₴
        </span>
        <small className="amount-uah amount-placeholder">
          &nbsp;
        </small>
      </>
    )
  }

  if (loading) {
    return <div className="app-shell">Завантаження...</div>
  }

  if (!telegramUser?.id) {
    return <div className="app-shell">Не вдалося отримати дані Telegram</div>
  }

  if (!appUser) {
    return <div className="app-shell">Користувача не знайдено в базі</div>
  }

  return (
    <div className="app-shell">
      <main className="content">
        {activePage === 'dashboard' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">HowMuch</p>
                <h1>Привіт, {telegramUser.first_name} 👋</h1>
              </div>

              <div className="avatar">
                {telegramUser.first_name?.[0] || 'H'}
              </div>
            </header>

            <section className="hero-card glass">
              <div>
                <p>Поточний баланс</p>
                <h2>{formatMoney(balance)}</h2>
              </div>
            </section>

            <section className="stats-row">
              <div className="small-card glass">
                <p>Доходи</p>
                <strong className="positive">{formatMoney(income)}</strong>
              </div>

              <div className="small-card glass">
                <p>Витрати</p>
                <strong className="negative">{formatMoney(expense)}</strong>
              </div>
            </section>

            <section className="section-header">
              <h3>Останні операції</h3>
              <button onClick={() => setActivePage('history')}>
                Дивитись всі
              </button>
            </section>

            <section className="transaction-list">
              {transactions.slice(0, 6).map(transaction => (
                <div className="transaction-card glass" key={transaction.id}>
                  <div className="transaction-info">
                    <strong>{transaction.category}</strong>
                    <p>{transaction.original_text}</p>
                  </div>

                  <div className={transaction.type === 'income' ? 'amount positive' : 'amount negative'}>
                    {formatTransactionAmount(transaction)}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {activePage === 'history' && (
          <EmptyPage title="Операції" text="Тут буде повна історія операцій." />
        )}

        {activePage === 'stats' && (
          <EmptyPage title="Статистика" text="Тут будуть графіки та аналітика." />
        )}

        {activePage === 'settings' && (
          <EmptyPage title="Налаштування" text="Тут будуть налаштування профілю та додатку." />
        )}
      </main>

      <nav className="bottom-nav glass">
        <button
          className={activePage === 'dashboard' ? 'active' : ''}
          onClick={() => setActivePage('dashboard')}
        >
          <span>⌂</span>
          Дашборд
        </button>

        <button
          className={activePage === 'history' ? 'active' : ''}
          onClick={() => setActivePage('history')}
        >
          <span>≡</span>
          Операції
        </button>

        <button
          className={activePage === 'stats' ? 'active' : ''}
          onClick={() => setActivePage('stats')}
        >
          <span>◌</span>
          Статистика
        </button>

        <button
          className={activePage === 'settings' ? 'active' : ''}
          onClick={() => setActivePage('settings')}
        >
          <span>⚙</span>
          Налаштування
        </button>
      </nav>
    </div>
  )
}

function EmptyPage({ title, text }) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">HowMuch</p>
          <h1>{title}</h1>
        </div>
      </header>

      <section className="empty-card glass">
        <h2>{title}</h2>
        <p>{text}</p>
      </section>
    </>
  )
}