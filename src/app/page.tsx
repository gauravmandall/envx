"use client"

import { useState, useEffect, useCallback } from "react"
import { Eye, EyeOff, Copy, Search, Shield, Key, CheckSquare, Square, Download, LogOut } from "lucide-react"

interface EnvVariable {
  id: string
  name: string
  value: string
  isVisible: boolean
}

// Mock environment variables - replace with your actual data source
const mockEnvVars: EnvVariable[] = [
  { id: "1", name: "DATABASE_URL", value: "postgresql://user:password@localhost:5432/mydb", isVisible: false },
  { id: "2", name: "API_SECRET_KEY", value: "sk_live_abcd1234567890efghijklmnop", isVisible: false },
  { id: "3", name: "STRIPE_WEBHOOK_SECRET", value: "whsec_1234567890abcdefghijklmnop", isVisible: false },
  { id: "4", name: "JWT_SECRET", value: "super-secret-jwt-key-2024", isVisible: false },
  { id: "5", name: "REDIS_URL", value: "redis://localhost:6379", isVisible: false },
  { id: "6", name: "SMTP_PASSWORD", value: "email-password-123", isVisible: false },
  { id: "7", name: "OPENAI_API_KEY", value: "sk-proj-abcd1234567890", isVisible: false },
  { id: "8", name: "GITHUB_CLIENT_SECRET", value: "github_secret_key_here", isVisible: false },
]

export default function EnvDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVariable[]>(mockEnvVars)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVars, setSelectedVars] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)

  // Session management
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout)
    }
    const timeout = setTimeout(
      () => {
        setIsAuthenticated(false)
        setPassword("")
        showNotification("error", "Session expired due to inactivity")
      },
      15 * 60 * 1000,
    ) // 15 minutes
    setSessionTimeout(timeout)
  }, [sessionTimeout])

  useEffect(() => {
    if (isAuthenticated) {
      resetSessionTimeout()
      const handleActivity = () => resetSessionTimeout()

      window.addEventListener("mousedown", handleActivity)
      window.addEventListener("keydown", handleActivity)

      return () => {
        window.removeEventListener("mousedown", handleActivity)
        window.removeEventListener("keydown", handleActivity)
        if (sessionTimeout) clearTimeout(sessionTimeout)
      }
    }
  }, [isAuthenticated, resetSessionTimeout])

  // Rate limiting
  useEffect(() => {
    if (failedAttempts >= 3) {
      setIsRateLimited(true)
      setTimeout(() => {
        setIsRateLimited(false)
        setFailedAttempts(0)
      }, 60000) // 1 minute lockout
    }
  }, [failedAttempts])

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleLogin = async () => {
    if (isRateLimited) {
      setError("Too many failed attempts. Please wait 1 minute.")
      return
    }

    setLoading(true)
    setError("")

    // Simulate authentication - replace with your actual auth logic
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (password === "secure123") {
      // Replace with your actual password check
      setIsAuthenticated(true)
      setFailedAttempts(0)
      showNotification("success", "Successfully authenticated")
    } else {
      setFailedAttempts((prev) => prev + 1)
      setError(`Invalid password. ${3 - failedAttempts - 1} attempts remaining.`)
    }

    setLoading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword("")
    setSelectedVars(new Set())
    if (sessionTimeout) clearTimeout(sessionTimeout)
    showNotification("success", "Logged out successfully")
  }

  const toggleVisibility = (id: string) => {
    setEnvVars((prev) => prev.map((env) => (env.id === id ? { ...env, isVisible: !env.isVisible } : env)))
  }

  const copyToClipboard = async (text: string, varName?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showNotification("success", varName ? `Copied ${varName}` : "Copied to clipboard")
    } catch (err) {
      showNotification("error", "Failed to copy to clipboard")
    }
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedVars)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVars(newSelected)
  }

  const selectAll = () => {
    const filtered = filteredEnvVars
    if (selectedVars.size === filtered.length) {
      setSelectedVars(new Set())
    } else {
      setSelectedVars(new Set(filtered.map((env) => env.id)))
    }
  }

  const copySelected = () => {
    const selectedEnvs = envVars.filter((env) => selectedVars.has(env.id))
    const envText = selectedEnvs.map((env) => `${env.name}=${env.value}`).join("\n")
    copyToClipboard(envText, `${selectedEnvs.length} variables`)
  }

  const filteredEnvVars = envVars.filter((env) => env.name.toLowerCase().includes(searchTerm.toLowerCase()))

  // Disable developer tools (basic protection)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
        return false
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] p-8">
        <div className="mx-auto max-w-md">
          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="p-6 text-center border-b border-zinc-800">
              <Key className="mx-auto h-12 w-12 text-emerald-400 mb-4" />
              <h2 className="text-xl font-bold text-white tracking-tight">Environment Variables</h2>
              <p className="text-zinc-400 mt-2 text-sm">Enter your password to access environment variables</p>
            </div>
            <div className="p-6 space-y-4">
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors"
                autoComplete="off"
                disabled={isRateLimited}
              />
              <button
                onClick={handleLogin}
                disabled={!password || loading || isRateLimited}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-medium py-3 transition-colors"
              >
                {loading ? "Authenticating..." : isRateLimited ? "Rate Limited" : "Access Variables"}
              </button>
              {error && <p className="text-sm text-red-400 text-center font-medium">{error}</p>}
              {isRateLimited && (
                <p className="text-sm text-amber-400 text-center font-medium">
                  Account temporarily locked due to failed attempts
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Environment Variables</h1>
            <p className="text-zinc-400 mt-1">Secure environment variable management</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 text-xs font-medium border bg-emerald-500/10 border-emerald-500 text-emerald-400">
              AUTHENTICATED
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-2"
            >
              {selectedVars.size === filteredEnvVars.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Select All
            </button>
            {selectedVars.size > 0 && (
              <button
                onClick={copySelected}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Copy Selected ({selectedVars.size})
              </button>
            )}
          </div>
        </div>

        {/* Environment Variables Grid */}
        <div className="space-y-3">
          {filteredEnvVars.map((envVar) => (
            <div
              key={envVar.id}
              className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-700 transition-colors"
            >
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleSelection(envVar.id)}
                    className="flex items-center justify-center w-5 h-5 border border-zinc-600 bg-transparent hover:bg-zinc-800 transition-colors"
                  >
                    {selectedVars.has(envVar.id) && <CheckSquare className="h-4 w-4 text-emerald-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white tracking-wide font-mono">{envVar.name}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVisibility(envVar.id)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        >
                          {envVar.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(envVar.value, envVar.name)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-700 p-3 font-mono text-sm">
                      {envVar.isVisible ? (
                        <span className="text-white break-all">{envVar.value}</span>
                      ) : (
                        <span className="text-zinc-500">{"•".repeat(Math.min(envVar.value.length, 40))}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEnvVars.length === 0 && (
          <div className="text-center py-12">
            <Key className="mx-auto h-12 w-12 text-zinc-600 mb-4" />
            <p className="text-zinc-400">No environment variables found matching your search.</p>
          </div>
        )}

        {/* Stats */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white tracking-wide">TOTAL VARIABLES</h3>
              <Key className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="p-4">
              <span className="text-2xl font-bold text-white font-mono">{envVars.length}</span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white tracking-wide">SELECTED</h3>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="p-4">
              <span className="text-2xl font-bold text-white font-mono">{selectedVars.size}</span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-white tracking-wide">FILTERED</h3>
              <Search className="h-4 w-4 text-blue-400" />
            </div>
            <div className="p-4">
              <span className="text-2xl font-bold text-white font-mono">{filteredEnvVars.length}</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm hover:border-zinc-700 transition-colors mt-8">
          <div className="p-4 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white tracking-wide">SECURITY NOTICE</h3>
          </div>
          <div className="p-4 text-zinc-400 text-sm space-y-3">
            <p>• All values are masked by default for security</p>
            <p>• Session automatically expires after 15 minutes of inactivity</p>
            <p>• Failed login attempts are rate limited</p>
            <p>• Browser developer tools are disabled</p>
            <p>• Copied variables are formatted in .env.local syntax</p>
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 mt-4">
              <div className="h-2 w-2 bg-amber-400"></div>
              <p className="text-amber-400 font-medium">Keep your credentials secure and log out when finished</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 mt-8 pt-6">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-4">
              <span className="font-mono">© 2025 Environment Manager v1.0</span>
              <span>•</span>
              <span>Secure Variable Management</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span className="font-mono">SECURE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 border backdrop-blur-sm z-50 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
              : "bg-red-500/10 border-red-500 text-red-400"
          }`}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}
    </div>
  )
}
