"use client"

import { useState, useEffect, useCallback } from "react"
import { Eye, EyeOff, Copy, Search, Shield, Key, CheckSquare, Square, Download, LogOut, Settings, Plus, Edit, Trash2 } from "lucide-react"

interface EnvVariable {
  id: string
  name: string
  value: string
  isVisible: boolean
  createdAt?: string
  updatedAt?: string
}

export default function EnvDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [envVars, setEnvVars] = useState<EnvVariable[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedVars, setSelectedVars] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showAddEnvVar, setShowAddEnvVar] = useState(false)
  const [showEditEnvVar, setShowEditEnvVar] = useState<string | null>(null)
  const [envVarFormData, setEnvVarFormData] = useState({
    name: "",
    value: ""
  })
  const [rateLimitTimeRemaining, setRateLimitTimeRemaining] = useState("");

  // API functions for environment variables
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${password}`,
    'Content-Type': 'application/json'
  })

  const fetchEnvVars = async () => {
    try {
      const response = await fetch('/api/env', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        setEnvVars(data.data)
      } else {
        showNotification("error", "Failed to fetch environment variables")
      }
    } catch (error) {
      console.error('Error fetching env vars:', error)
      showNotification("error", "Failed to fetch environment variables")
    }
  }

  const createEnvVar = async (name: string, value: string) => {
    try {
      const response = await fetch('/api/env', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, value })
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchEnvVars() // Refresh the list
        showNotification("success", "Environment variable created successfully")
        return true
      } else {
        showNotification("error", data.message || "Failed to create environment variable")
        return false
      }
    } catch (error) {
      console.error('Error creating env var:', error)
      showNotification("error", "Failed to create environment variable")
      return false
    }
  }

  const updateEnvVar = async (id: string, name: string, value: string) => {
    try {
      const response = await fetch(`/api/env/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, value })
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchEnvVars() // Refresh the list
        showNotification("success", "Environment variable updated successfully")
        return true
      } else {
        showNotification("error", data.message || "Failed to update environment variable")
        return false
      }
    } catch (error) {
      console.error('Error updating env var:', error)
      showNotification("error", "Failed to update environment variable")
      return false
    }
  }

  const deleteEnvVar = async (id: string) => {
    try {
      const response = await fetch(`/api/env/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchEnvVars() // Refresh the list
        showNotification("success", "Environment variable deleted successfully")
        return true
      } else {
        showNotification("error", data.message || "Failed to delete environment variable")
        return false
      }
    } catch (error) {
      console.error('Error deleting env var:', error)
      showNotification("error", "Failed to delete environment variable")
      return false
    }
  }

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
    // Check if there's an existing rate limit in localStorage
    const storedLimitData = localStorage.getItem('envx_rate_limit');
    
    // For debugging - log the localStorage contents
    console.log('Rate limit data in storage:', storedLimitData);
    
    if (storedLimitData) {
      try {
        const limitData = JSON.parse(storedLimitData);
        const now = Date.now();
        
        // Log the parsed rate limiting data
        console.log('Parsed rate limit data:', limitData);
        console.log('Current time:', now);
        console.log('Rate limit expires at:', limitData.expiresAt);
        console.log('Time remaining (ms):', limitData.expiresAt - now);
        
        // If the stored limit is still active
        if (now < limitData.expiresAt) {
          console.log('Rate limit is active, applying limitations');
          setIsRateLimited(true);
          setFailedAttempts(limitData.attempts);
          
          // Set a timer to remove the rate limit when it expires
          const timeoutId = setTimeout(() => {
            console.log('Rate limit expired, removing limitations');
            setIsRateLimited(false);
            setFailedAttempts(0);
            localStorage.removeItem('envx_rate_limit');
          }, limitData.expiresAt - now);
          
          return () => clearTimeout(timeoutId);
        } else {
          // Clear expired rate limit
          console.log('Rate limit has already expired, removing it from storage');
          localStorage.removeItem('envx_rate_limit');
        }
      } catch (error) {
        console.error('Error parsing rate limit data:', error);
        localStorage.removeItem('envx_rate_limit');
      }
    } else {
      console.log('No rate limit data found in storage');
    }
  }, []);

  // Progressive rate limiting logic
  useEffect(() => {
    if (failedAttempts >= 3) {
      // Calculate timeout duration based on consecutive failures
      // 3 failures = 3 minutes, 6 failures = 5 minutes, 9 failures = 10 minutes, 12+ failures = 30 minutes
      let timeoutMinutes = 3;
      
      if (failedAttempts >= 12) {
        timeoutMinutes = 30;
      } else if (failedAttempts >= 9) {
        timeoutMinutes = 10;
      } else if (failedAttempts >= 6) {
        timeoutMinutes = 5;
      }
      
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const expiresAt = Date.now() + timeoutMs;
      
      // Store rate limit data in localStorage
      localStorage.setItem('envx_rate_limit', JSON.stringify({
        attempts: failedAttempts,
        expiresAt: expiresAt
      }));
      
      setIsRateLimited(true);
      
      // Set timeout to remove rate limiting
      const timeoutId = setTimeout(() => {
        setIsRateLimited(false);
        setFailedAttempts(0);
        localStorage.removeItem('envx_rate_limit');
      }, timeoutMs);
      
      return () => clearTimeout(timeoutId);
    }
  }, [failedAttempts]);
  
  // Function to get rate limit remaining time in minutes and seconds
  const getRateLimitTimeRemaining = (): string => {
    try {
      const storedLimitData = localStorage.getItem('envx_rate_limit');
      if (!storedLimitData) return '';
      
      const limitData = JSON.parse(storedLimitData);
      const remainingMs = Math.max(0, limitData.expiresAt - Date.now());
      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      
      return `${minutes}m ${seconds}s`;
    } catch (error) {
      return '';
    }
  }

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleLogin = async () => {
    if (isRateLimited) {
      const remainingTime = getRateLimitTimeRemaining();
      setError(`Too many failed attempts. Please wait ${remainingTime || "until timeout expires"}.`)
      return
    }

    setLoading(true)
    setError("")

    try {
      console.log("Attempting login with password:", password.replace(/./g, '*'))
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      console.log("Login response status:", response.status)
      const data = await response.json()
      console.log("Login response data:", data)

      if (data.success) {
        setIsAuthenticated(true)
        setFailedAttempts(0)
        showNotification("success", "Successfully authenticated")
        // Fetch environment variables after successful login
        await fetchEnvVars()
      } else {
        setFailedAttempts((prev) => prev + 1)
        console.log("Failed attempts increased to:", failedAttempts + 1)
        setError(`Invalid password. ${Math.max(0, 3 - failedAttempts - 1)} attempts remaining before timeout.`)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Failed to authenticate. Please try again.")
    }

    setLoading(false)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setPassword("")
    setSelectedVars(new Set())
    setShowChangePassword(false)
    setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    if (sessionTimeout) clearTimeout(sessionTimeout)
    showNotification("success", "Logged out successfully")
  }

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = changePasswordData

    if (!currentPassword || !newPassword || !confirmPassword) {
      showNotification("error", "All fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      showNotification("error", "New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      showNotification("error", "New password must be at least 6 characters long")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (data.success) {
        showNotification("success", "Password changed successfully")
        setShowChangePassword(false)
        setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        showNotification("error", data.message || "Failed to change password")
      }
    } catch (error) {
      console.error("Change password error:", error)
      showNotification("error", "Failed to change password. Please try again.")
    }

    setLoading(false)
  }

  // Environment variable management handlers
  const handleAddEnvVar = async () => {
    const { name, value } = envVarFormData;
    
    if (!name || !value) {
      showNotification("error", "Name and value are required");
      return;
    }
    
    setLoading(true);
    const success = await createEnvVar(name, value);
    
    if (success) {
      setShowAddEnvVar(false);
      setEnvVarFormData({ name: "", value: "" });
      
      // Check for pending environment variables to import
      const pendingVarsJSON = sessionStorage.getItem('pendingEnvVars');
      if (pendingVarsJSON) {
        try {
          const pendingVars = JSON.parse(pendingVarsJSON);
          if (Array.isArray(pendingVars) && pendingVars.length > 0) {
            // Clear pending vars to avoid duplicates
            sessionStorage.removeItem('pendingEnvVars');
            
            // Process bulk import
            bulkImportEnvVars(pendingVars);
          }
        } catch (error) {
          console.error('Error processing pending env vars:', error);
        }
      }
    }
    
    setLoading(false);
  }
  
  // Bulk import environment variables
  const bulkImportEnvVars = async (envVars: Array<{ name: string; value: string }>) => {
    let successCount = 0;
    let errorCount = 0;
    
    // Process each environment variable
    for (const { name, value } of envVars) {
      if (!name || !value) {
        errorCount++;
        continue;
      }
      
      try {
        const success = await createEnvVar(name, value);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`Error importing ${name}:`, error);
        errorCount++;
      }
    }
    
    // Update the notification
    if (successCount > 0) {
      showNotification("success", `Successfully imported ${successCount} variables${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
    } else if (errorCount > 0) {
      showNotification("error", `Failed to import ${errorCount} variables`);
    }
    
    // Refresh the list
    await fetchEnvVars();
  }

  const handleEditEnvVar = async () => {
    const { name, value } = envVarFormData
    
    if (!name || !value || !showEditEnvVar) {
      showNotification("error", "Name and value are required")
      return
    }
    
    setLoading(true)
    const success = await updateEnvVar(showEditEnvVar, name, value)
    
    if (success) {
      setShowEditEnvVar(null)
      setEnvVarFormData({ name: "", value: "" })
    }
    
    setLoading(false)
  }

  const handleDeleteEnvVar = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setLoading(true)
      await deleteEnvVar(id)
      setLoading(false)
    }
  }

  const openEditModal = (envVar: EnvVariable) => {
    setEnvVarFormData({ name: envVar.name, value: envVar.value })
    setShowEditEnvVar(envVar.id)
  }

  const toggleVisibility = (id: string) => {
    setEnvVars((prev) => prev.map((env) => (env.id === id ? { ...env, isVisible: !env.isVisible } : env)))
  }

  const copyToClipboard = async (text: string, varName?: string) => {
    try {
      // If varName is provided, we're copying a single variable
      // In this case, format it as KEY=VALUE like in multi-select
      if (varName) {
        const envVar = envVars.find(env => env.name === varName);
        if (envVar) {
          await navigator.clipboard.writeText(`${envVar.name}=${envVar.value}`);
          showNotification("success", `Copied ${varName}`);
          return;
        }
      }
      
      // If no matching variable or it's a multi-select copy
      await navigator.clipboard.writeText(text);
      showNotification("success", varName ? `Copied ${varName}` : "Copied to clipboard");
    } catch (err) {
      showNotification("error", "Failed to copy to clipboard");
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

  // Add a useEffect to update the countdown timer every second when rate limited
  useEffect(() => {
    if (isRateLimited) {
      // Update the timer immediately
      setRateLimitTimeRemaining(getRateLimitTimeRemaining());
      
      // Then update it every second
      const intervalId = setInterval(() => {
        const remaining = getRateLimitTimeRemaining();
        setRateLimitTimeRemaining(remaining);
        
        // If the time is up, clear the interval
        if (remaining === '') {
          clearInterval(intervalId);
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [isRateLimited]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] p-3 sm:p-5 md:p-8">
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
                  Account temporarily locked due to failed attempts.<br />
                  Try again in {rateLimitTimeRemaining}.
                </p>
              )}
              
              <div className="border-t border-zinc-800 pt-4 mt-4 flex flex-col gap-3">
                <a
                  href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fgauravmandall%2Fenvx&env=DATABASE_URL%2CADMIN_PASSWORD%2CMASTER_ENCRYPTION_KEY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 justify-center bg-black hover:bg-zinc-800 text-white py-2 px-4 border border-zinc-700 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white"/>
                  </svg>
                  Deploy with Vercel
                </a>
                
                <a
                  href="https://grvx.dev/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
                  </svg>
                  Support the Project
                </a>
                
                <a
                  href="https://github.com/gauravmandall/envx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 justify-center bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] p-3 sm:p-5 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Environment Variables</h1>
            <p className="text-zinc-400 mt-1">Secure environment variable management</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://grvx.dev/support"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
              </svg>
              <span className="hidden sm:inline">Donate</span>
            </a>
            <div className="hidden sm:block px-3 py-1 text-xs font-medium border bg-emerald-500/10 border-emerald-500 text-emerald-400">
              AUTHENTICATED
            </div>
            <button
              onClick={() => setShowChangePassword(true)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Change Password</span>
              <span className="sm:hidden">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search variables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-2 focus:outline-none focus:border-emerald-400 transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-sm font-medium transition-colors flex items-center gap-2"
              >
                {selectedVars.size === filteredEnvVars.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Select All</span>
              </button>
              {selectedVars.size > 0 && (
                <button
                  onClick={copySelected}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Copy</span> ({selectedVars.size})
                </button>
              )}
              <button
                onClick={() => setShowAddEnvVar(true)}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span> Variable
              </button>
            </div>
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
                    className="flex-shrink-0 flex items-center justify-center w-5 h-5 border border-zinc-600 bg-transparent hover:bg-zinc-800 transition-colors"
                  >
                    {selectedVars.has(envVar.id) && <CheckSquare className="h-4 w-4 text-emerald-400" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white tracking-wide font-mono break-all">{envVar.name}</h3>
                      <div className="flex flex-wrap items-center gap-2">
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
                        <button
                          onClick={() => openEditModal(envVar)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEnvVar(envVar.id, envVar.name)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-zinc-950 border border-zinc-700 p-3 font-mono text-sm overflow-x-auto">
                      {envVar.isVisible ? (
                        <span className="text-white break-all whitespace-pre-wrap">{envVar.value}</span>
                      ) : (
                        <span className="text-zinc-500 select-none overflow-hidden">{"•".repeat(Math.min(envVar.value.length, 40))}</span>
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
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800">
              <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide">TOTAL VARS</h3>
              <Key className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="p-3 sm:p-4">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">{envVars.length}</span>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800">
              <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide">SELECTED</h3>
              <CheckSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="p-3 sm:p-4">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">{selectedVars.size}</span>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800">
              <h3 className="text-xs sm:text-sm font-semibold text-white tracking-wide">FILTERED</h3>
              <Search className="h-4 w-4 text-blue-400" />
            </div>
            <div className="p-3 sm:p-4">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono">{filteredEnvVars.length}</span>
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

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white tracking-tight">Change Password</h3>
              <p className="text-zinc-400 mt-1 text-sm">Update your admin password</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={changePasswordData.currentPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors"
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={changePasswordData.newPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors"
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={changePasswordData.confirmPassword}
                  onChange={(e) => setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-medium py-3 transition-colors"
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false)
                    setChangePasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                  }}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 text-white font-medium py-3 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Environment Variable Modal */}
      {showAddEnvVar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white tracking-tight">Add Environment Variable</h3>
              <p className="text-zinc-400 mt-1 text-sm">Add a new environment variable</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Variable Name</label>
                <input
                  type="text"
                  value={envVarFormData.name}
                  onChange={(e) => setEnvVarFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  onPaste={(e) => {
                    // Get pasted text from clipboard
                    const pastedText = e.clipboardData.getData('text');
                    
                    // Check if it looks like an environment variable with NAME=VALUE format
                    const envVarRegex = /^([A-Z][A-Z0-9_]*)=(.+)$/;
                    const match = pastedText.trim().match(envVarRegex);
                    
                    if (match) {
                      // It's a NAME=VALUE format, prevent default and set both fields
                      e.preventDefault();
                      setEnvVarFormData({
                        name: match[1],
                        value: match[2]
                      });
                    } else if (pastedText.includes('\n')) {
                      // It might contain multiple environment variables
                      e.preventDefault();
                      const lines = pastedText.split('\n').filter(line => line.trim());
                      if (lines.length > 0) {
                        // Take the first line for this form
                        const firstLine = lines[0];
                        const firstMatch = firstLine.match(envVarRegex);
                        
                        if (firstMatch) {
                          setEnvVarFormData({
                            name: firstMatch[1],
                            value: firstMatch[2]
                          });
                          
                          // If there are more lines, process them after this one is created
                          if (lines.length > 1) {
                            const remainingVars = lines.slice(1).map(line => {
                              const match = line.match(envVarRegex);
                              if (match) {
                                return { name: match[1], value: match[2] };
                              }
                              return null;
                            }).filter(Boolean);
                            
                            // Queue these for bulk import after this one is saved
                            if (remainingVars.length > 0) {
                              // Store for bulk import after current variable is saved
                              sessionStorage.setItem('pendingEnvVars', JSON.stringify(remainingVars));
                              showNotification("success", `Found ${remainingVars.length} more variables to import`);
                            }
                          }
                        }
                        // If it's not in NAME=VALUE format, let default paste behavior happen
                      }
                    }
                    // If it doesn't match any of our patterns, let default paste behavior happen
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                  placeholder="DATABASE_URL"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-500 mt-1">Use uppercase letters, numbers, and underscores only. Paste NAME=VALUE to fill both fields.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Variable Value</label>
                <textarea
                  value={envVarFormData.value}
                  onChange={(e) => setEnvVarFormData(prev => ({ ...prev, value: e.target.value }))}
                  onPaste={(e) => {
                    // Prevent default paste behavior
                    e.preventDefault();
                    
                    // Get pasted text from clipboard
                    const pastedText = e.clipboardData.getData('text');
                    
                    // Check if it looks like an environment variable with NAME=VALUE format
                    const envVarRegex = /^([A-Z][A-Z0-9_]*)=(.+)$/;
                    const match = pastedText.trim().match(envVarRegex);
                    
                    if (match) {
                      // It's a single NAME=VALUE format
                      setEnvVarFormData({
                        name: match[1],
                        value: match[2]
                      });
                    } else if (pastedText.includes('\n')) {
                      // It might contain multiple environment variables
                      const lines = pastedText.split('\n').filter(line => line.trim());
                      if (lines.length > 0) {
                        // Take the first line for this form
                        const firstLine = lines[0];
                        const firstMatch = firstLine.match(envVarRegex);
                        
                        if (firstMatch) {
                          setEnvVarFormData({
                            name: firstMatch[1],
                            value: firstMatch[2]
                          });
                          
                          // If there are more lines, process them after this one is created
                          if (lines.length > 1) {
                            const remainingVars = lines.slice(1).map(line => {
                              const match = line.match(envVarRegex);
                              if (match) {
                                return { name: match[1], value: match[2] };
                              }
                              return null;
                            }).filter(Boolean);
                            
                            // Queue these for bulk import after this one is saved
                            if (remainingVars.length > 0) {
                              // Store for bulk import after current variable is saved
                              sessionStorage.setItem('pendingEnvVars', JSON.stringify(remainingVars));
                              showNotification("success", `Found ${remainingVars.length} more variables to import`);
                            }
                          }
                        } else {
                          // Not in NAME=VALUE format, just use as value
                          setEnvVarFormData(prev => ({ ...prev, value: pastedText }));
                        }
                      }
                    } else {
                      // Not in NAME=VALUE format, just use as value
                      setEnvVarFormData(prev => ({ ...prev, value: pastedText }));
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                  placeholder="Enter the value or paste NAME=VALUE format"
                  rows={3}
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-500 mt-1">Paste in NAME=VALUE format to auto-fill both fields</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddEnvVar}
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-medium py-3 transition-colors"
                >
                  {loading ? "Adding..." : "Add Variable"}
                </button>
                <button
                  onClick={() => {
                    setShowAddEnvVar(false)
                    setEnvVarFormData({ name: "", value: "" })
                  }}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 text-white font-medium py-3 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Environment Variable Modal */}
      {showEditEnvVar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-zinc-900 border border-zinc-800 max-w-md w-full overflow-y-auto max-h-[90vh]">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white tracking-tight">Edit Environment Variable</h3>
              <p className="text-zinc-400 mt-1 text-sm">Update environment variable</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Variable Name</label>
                <input
                  type="text"
                  value={envVarFormData.name}
                  onChange={(e) => setEnvVarFormData(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                  onPaste={(e) => {
                    // Get pasted text from clipboard
                    const pastedText = e.clipboardData.getData('text');
                    
                    // Check if it looks like an environment variable with NAME=VALUE format
                    const envVarRegex = /^([A-Z][A-Z0-9_]*)=(.+)$/;
                    const match = pastedText.trim().match(envVarRegex);
                    
                    if (match) {
                      // It's a NAME=VALUE format, prevent default and set both fields
                      e.preventDefault();
                      setEnvVarFormData({
                        name: match[1],
                        value: match[2]
                      });
                    } else if (pastedText.includes('\n')) {
                      // It might contain multiple environment variables
                      e.preventDefault();
                      const lines = pastedText.split('\n').filter(line => line.trim());
                      if (lines.length > 0) {
                        // Take the first line for this form
                        const firstLine = lines[0];
                        const firstMatch = firstLine.match(envVarRegex);
                        
                        if (firstMatch) {
                          setEnvVarFormData({
                            name: firstMatch[1],
                            value: firstMatch[2]
                          });
                        }
                      }
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                  placeholder="DATABASE_URL"
                  autoComplete="off"
                />
                <p className="text-xs text-zinc-500 mt-1">Use uppercase letters, numbers, and underscores only. Paste NAME=VALUE to fill both fields.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Variable Value</label>
                <textarea
                  value={envVarFormData.value}
                  onChange={(e) => setEnvVarFormData(prev => ({ ...prev, value: e.target.value }))}
                  onPaste={(e) => {
                    // Prevent default paste behavior
                    e.preventDefault();
                    
                    // Get pasted text from clipboard
                    const pastedText = e.clipboardData.getData('text');
                    
                    // Check if it looks like an environment variable with NAME=VALUE format
                    const envVarRegex = /^([A-Z][A-Z0-9_]*)=(.+)$/;
                    const match = pastedText.trim().match(envVarRegex);
                    
                    if (match) {
                      // It's a single NAME=VALUE format
                      setEnvVarFormData({
                        name: match[1],
                        value: match[2]
                      });
                    } else {
                      // Not in NAME=VALUE format, just use as value
                      setEnvVarFormData(prev => ({ ...prev, value: pastedText }));
                    }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 text-white px-4 py-3 focus:outline-none focus:border-emerald-400 transition-colors font-mono"
                  placeholder="Enter the value or paste NAME=VALUE format"
                  rows={3}
                  autoComplete="off"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleEditEnvVar}
                  disabled={loading}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:text-zinc-400 text-black font-medium py-3 transition-colors"
                >
                  {loading ? "Updating..." : "Update Variable"}
                </button>
                <button
                  onClick={() => {
                    setShowEditEnvVar(null)
                    setEnvVarFormData({ name: "", value: "" })
                  }}
                  disabled={loading}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-700 text-white font-medium py-3 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
