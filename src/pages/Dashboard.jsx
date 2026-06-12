export default function Dashboard() {
  const telegram = window.Telegram
  const webApp = window.Telegram?.WebApp
  const user = webApp?.initDataUnsafe?.user

  return (
    <div style={{ padding: 20 }}>
      <h1>💰 HowMuch</h1>

      <h2>Діагностика Telegram WebApp</h2>

      <p>window.Telegram: {telegram ? 'є' : 'немає'}</p>
      <p>window.Telegram.WebApp: {webApp ? 'є' : 'немає'}</p>
      <p>user: {user ? 'є' : 'немає'}</p>

      <h3>initDataUnsafe:</h3>
      <pre>{JSON.stringify(webApp?.initDataUnsafe, null, 2)}</pre>
    </div>
  )
}