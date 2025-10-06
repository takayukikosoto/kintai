import { useEffect, useState } from 'react'
import { auth, googleProvider } from '../firebase'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const tokenResult = await u.getIdTokenResult()
        setIsAdmin(!!tokenResult.claims.admin)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return {
    user,
    loading,
    isAdmin,
    signInEmail: (email: string, password: string) =>
      signInWithEmailAndPassword(auth, email, password),
    registerEmail: (email: string, password: string) =>
      createUserWithEmailAndPassword(auth, email, password),
    signInGoogle: () => signInWithPopup(auth, googleProvider),
    signOut: () => signOut(auth)
  }
}
