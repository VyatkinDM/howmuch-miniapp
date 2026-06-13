import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabase'
import { getUserByTelegramId } from '../services/userService'
import './Dashboard.css'

const ITEMS_PER_PAGE = 10

export default function Dashboard() {
  const [appUser, setAppUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activePage, setActivePage] = useState('dashboard')

  const [periodFilter, setPeriodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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

  const filteredTransactions = useMemo(() => {
    const now = new Date()

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at)

      if (periodFilter === 'today') {
        return transactionDate.toDateString() === now.toDateString()
      }

      if (periodFilter === 'month') {
        return (
          transactionDate.getMonth() === now.getMonth() &&
          transactionDate.getFullYear() === now.getFullYear()
        )
      }

      if (periodFilter === 'custom') {
        if (!dateFrom || !dateTo) return true

        const from = parseDateInput(dateFrom)
        const to = parseDateInput(dateTo, true)

        if (!from || !to) return true

        return transactionDate >= from && transactionDate <= to
      }

      return true
    })
  }, [transactions, periodFilter, dateFrom, dateTo])

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  function changePeriodFilter(value) {
    setPeriodFilter(value)
    setCurrentPage(1)
  }

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

  function formatDate(date) {
    return new Date(date).toLocaleString('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(',', ' •')
  }
  
  function parseDateInput(value, endOfDay = false) {
    const [day, month, year] = value.split('.')
  
    if (!day || !month || !year) return null
  
    const hours = endOfDay ? 23 : 0
    const minutes = endOfDay ? 59 : 0
    const seconds = endOfDay ? 59 : 0
  
    return new Date(Number(year), Number(month) - 1, Number(day), hours, minutes, seconds)
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
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  formatTransactionAmount={formatTransactionAmount}
                  formatDate={formatDate}
                />
              ))}
            </section>
          </>
        )}

        {activePage === 'history' && (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">HowMuch</p>
                <h1>Операції</h1>
              </div>
            </header>

            <section className="filters-card glass">
              <div className="period-tabs">
                <button
                  className={periodFilter === 'today' ? 'active' : ''}
                  onClick={() => changePeriodFilter('today')}
                >
                  Сьогодні
                </button>

                <button
                  className={periodFilter === 'month' ? 'active' : ''}
                  onClick={() => changePeriodFilter('month')}
                >
                  Місяць
                </button>

                <button
                  className={periodFilter === 'all' ? 'active' : ''}
                  onClick={() => changePeriodFilter('all')}
                >
                  Увесь час
                </button>

                <button
                  className={periodFilter === 'custom' ? 'active' : ''}
                  onClick={() => changePeriodFilter('custom')}
                >
                  Свій період
                </button>
              </div>

              {periodFilter === 'custom' && (
                <div className="date-filters">
                  <label>
                    Від
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="13.06.2026"
                      value={dateFrom}
                      onChange={event => {
                      setDateFrom(event.target.value)
                      setCurrentPage(1)
                    }}
                  />
                  </label>

                  <label>
                    До
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="13.06.2026"
                      value={dateTo}
                      onChange={event => {
                        setDateTo(event.target.value)
                        setCurrentPage(1)
                      }}
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="section-header history-header">
              <h3>Історія</h3>
              <span>{filteredTransactions.length} операцій</span>
            </section>

            <section className="transaction-list">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map(transaction => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    formatTransactionAmount={formatTransactionAmount}
                    formatDate={formatDate}
                  />
                ))
              ) : (
                <div className="empty-card glass">
                  <h2>Операцій немає</h2>
                  <p>За вибраний період операції не знайдені.</p>
                </div>
              )}
            </section>

            {totalPages > 1 && (
              <section className="pagination">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Назад
                </button>

                <span>
                  {currentPage} / {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Далі
                </button>
              </section>
            )}
          </>
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

function TransactionCard({ transaction, formatTransactionAmount, formatDate }) {
  return (
    <div className="transaction-card glass">
      <div className="transaction-info">
        <strong>{transaction.category}</strong>
        <p>{transaction.original_text}</p>
        <small>{formatDate(transaction.created_at)}</small>
      </div>

      <div className={transaction.type === 'income' ? 'amount positive' : 'amount negative'}>
        {formatTransactionAmount(transaction)}
      </div>
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