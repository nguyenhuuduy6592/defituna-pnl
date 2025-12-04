import '@/styles/globals.scss'
import { useEffect } from 'react'
import { PriceProvider } from '../contexts/PriceContext'
import { DisplayCurrencyProvider } from '../contexts/DisplayCurrencyContext'

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .catch(error => {
            console.error('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return (
    <PriceProvider>
      <DisplayCurrencyProvider>
        <Component {...pageProps} />
      </DisplayCurrencyProvider>
    </PriceProvider>
  )
}