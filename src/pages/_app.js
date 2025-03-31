import '@/styles/globals.scss'
import { useEffect } from 'react'
import { ComparisonProvider } from '../contexts/ComparisonContext'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
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
      <Component {...pageProps} />
    </ComparisonProvider>
  )
}