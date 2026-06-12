export default function Dashboard() {
  const webApp = window.Telegram?.WebApp
  const user = webApp?.initDataUnsafe?.user

  return (
    <div style={{ padding: 20 }}>
      <h1>💰 HowMuch</h1>

      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}