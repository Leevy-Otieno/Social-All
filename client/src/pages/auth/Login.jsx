import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { setToken, setAdminToken, getAdminToken } from '@/lib/auth'
import { authAPI, adminAPI } from '@/lib/api'
import { getConfig } from '@/config'
import { isNativePlatform } from '@/lib/platform'

export default function Login({ admin = false }) {
  const navigate = useNavigate()
  const { setUser, setToken: setStoreToken, setAdminToken: setStoreAdmin } = useAuthStore()
  const config = getConfig()
  const [isNative, setIsNative] = useState(isNativePlatform())

  useEffect(() => {
    // Re-check native status after mount
    setIsNative(isNativePlatform())
  }, [])

  useEffect(() => {
    // Standard Google Identity Services for Web
    if (isNative) return

    const init = () => {
      if (!window.__gsi_initialized) {
        window.google.accounts.id.initialize({
          client_id: config.google?.clientId || '',
          callback: handleCredentialResponse,
        });
        window.__gsi_initialized = true;
      }
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'outline', size: 'large', width: '250', shape: 'rectangular', text: 'signin_with' }
      )
    }

    if (window.google?.accounts) {
      init()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = init
      document.body.appendChild(script)
    }
  }, [admin])

  // Removed handleNativeGoogleLogin as we now use standard Web login in the native wrapper

  const handleCredentialResponse = async (response) => {
    const idToken = response.credential
    try {
      if (admin) {
        const r = await adminAPI.googleLogin(idToken)
        setAdminToken(r.data.token)
        setStoreAdmin(r.data.token)
        navigate('/admin/dashboard')
      } else {
        const r = await authAPI.googleLogin(idToken)
        if (r.data.role === 'admin') {
          setAdminToken(r.data.token)
          setStoreAdmin(r.data.token)
          navigate(r.data.redirectTo || '/admin/dashboard')
          return
        }
        setToken(r.data.token)
        setStoreToken(r.data.token)
        setUser(r.data.user) // Always set user to populate the store immediately

        if (r.data.is_profile_complete) {
          navigate('/')
        } else {
          navigate(`/setup/step${r.data.profile_step || 1}`)
        }
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--primary)' }}>
            {admin ? 'Admin Panel' : (config.name || 'YouBGram')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
            {admin ? 'Restricted to authorized administrators' : (config.tagline || 'Connect with the world')}
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-card-md">
          <p className="text-sm font-medium text-center mb-6" style={{ color: 'var(--text-2)' }}>
            {admin ? 'Sign in with your admin Google account' : 'Continue with Google to get started'}
          </p>
          
          <div className="w-full flex justify-center">
              <div id="google-btn" className="min-h-[44px]" />
          </div>
          {admin && (
            <p className="text-xs text-center mt-5" style={{ color: 'var(--text-3)' }}>
              Only authorized Google accounts can access the admin panel.
            </p>
          )}
        </div>

        <p className="text-xs text-center mt-6" style={{ color: 'var(--text-3)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
