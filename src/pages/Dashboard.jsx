import WebApp from '../services/telegram'

export default function Dashboard() {
  const user = WebApp.initDataUnsafe?.user

  return (
    <div style={{ padding: 20 }}>
      <h1>💰 HowMuch</h1>

      <h2>Mini App працює v2</h2>

      <pre>
        {JSON.stringify(user, null, 2)}
      </pre>
    </div>
  )
}