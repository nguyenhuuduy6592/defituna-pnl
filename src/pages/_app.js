import '@/styles/globals.scss'
import { useEffect } from 'react'
import { ComparisonProvider } from '../contexts/ComparisonContext'
import AppVersionDisplay from '../components/AppVersionDisplay'
import styles from '@/styles/AppVersion.module.scss';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('Service Worker registered:', registration)
          })
          .catch(error => {
            console.error('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return (
    <ComparisonProvider>
      <>
        <Component {...pageProps} />
        {/* Add version display below the main component, fixed to bottom */}
        <div className={styles.versionContainer}>
          <AppVersionDisplay />
        </div>
      </>
    </ComparisonProvider>
  )
}