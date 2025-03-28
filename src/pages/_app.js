import '@/styles/globals.scss'
import { useEffect } from 'react'
import { logEnvironmentInfo } from '@/utils/init'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Log environment info on app start
    logEnvironmentInfo();

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

  return <Component {...pageProps} />
}