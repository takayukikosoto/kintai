import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // アニメーション完了後にクローズ
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const colors = {
    success: {
      bg: '#d1fae5',
      border: '#34d399',
      text: '#065f46',
      icon: '✓'
    },
    error: {
      bg: '#fee2e2',
      border: '#f87171',
      text: '#991b1b',
      icon: '✕'
    },
    info: {
      bg: '#dbeafe',
      border: '#60a5fa',
      text: '#1e40af',
      icon: 'ℹ'
    },
    warning: {
      bg: '#fef3c7',
      border: '#fbbf24',
      text: '#92400e',
      icon: '⚠'
    }
  }

  const style = colors[type]

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        minWidth: '300px',
        maxWidth: '500px',
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 10000,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }}
    >
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: style.text
      }}>
        {style.icon}
      </div>
      <div style={{
        flex: 1,
        color: style.text,
        fontSize: '0.9rem',
        lineHeight: '1.4'
      }}>
        {message}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: style.text,
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0 4px',
          opacity: 0.7
        }}
      >
        ×
      </button>
    </div>
  )
}

// トーストマネージャー用のコンテナ
interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
const toastListeners: Set<(toasts: ToastMessage[]) => void> = new Set()
let currentToasts: ToastMessage[] = []

export function showToast(message: string, type: ToastType = 'info') {
  const toast: ToastMessage = {
    id: toastId++,
    message,
    type
  }
  currentToasts = [...currentToasts, toast]
  toastListeners.forEach(listener => listener(currentToasts))

  // 自動削除
  setTimeout(() => {
    removeToast(toast.id)
  }, 3000)
}

function removeToast(id: number) {
  currentToasts = currentToasts.filter(t => t.id !== id)
  toastListeners.forEach(listener => listener(currentToasts))
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    toastListeners.add(setToasts)
    return () => {
      toastListeners.delete(setToasts)
    }
  }, [])

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            position: 'fixed',
            top: `${20 + index * 80}px`,
            right: '20px',
            zIndex: 10000
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </>
  )
}
