import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

const NotFound = () => {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '2px solid rgba(99, 102, 241, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <AlertCircle size={36} color="var(--color-primary-light)" strokeWidth={1.5} />
        </div>

        <h1 style={{
          fontSize: '5rem', fontWeight: '800', lineHeight: 1,
          background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-info))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text', marginBottom: '0.5rem',
        }}>
          404
        </h1>

        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--color-text-primary)' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <button className="btn btn-primary" onClick={() => navigate(ROUTES.HOME)}
          style={{ gap: '0.5rem' }}>
          <Home size={16} />
          Go Home
        </button>
      </div>
    </div>
  )
}

export default NotFound
