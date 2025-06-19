import { NextRequest, NextResponse } from 'next/server'
import { getAllEnvVars, createEnvVar } from '@/lib/env-storage'

// Helper function to verify authentication
function isAuthenticated(request: NextRequest): boolean {
  // In a real app, you'd check for JWT tokens or session cookies
  // For now, we'll use a simple header check
  const authHeader = request.headers.get('authorization')
  const adminPassword = process.env.ADMIN_PASSWORD || 'secure123'
  
  return authHeader === `Bearer ${adminPassword}`
}

// GET /api/env - Get all environment variables
export async function GET(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const envVars = await getAllEnvVars()
    
    return NextResponse.json({
      success: true,
      data: envVars.map(env => ({
        id: env.id,
        name: env.name,
        value: env.value,
        createdAt: env.createdAt,
        updatedAt: env.updatedAt,
        isVisible: false // Default to hidden for security
      }))
    })
  } catch (error) {
    console.error('Error fetching environment variables:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch environment variables' },
      { status: 500 }
    )
  }
}

// POST /api/env - Create new environment variable
export async function POST(request: NextRequest) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, value } = await request.json()
    
    if (!name || !value) {
      return NextResponse.json(
        { success: false, message: 'Name and value are required' },
        { status: 400 }
      )
    }

    // Validate environment variable name
    if (!/^[A-Z][A-Z0-9_]*$/.test(name)) {
      return NextResponse.json(
        { success: false, message: 'Environment variable name must start with a letter and contain only uppercase letters, numbers, and underscores' },
        { status: 400 }
      )
    }

    const newEnvVar = await createEnvVar(name, value)
    
    return NextResponse.json({
      success: true,
      message: 'Environment variable created successfully',
      data: {
        id: newEnvVar.id,
        name: newEnvVar.name,
        value: newEnvVar.value,
        createdAt: newEnvVar.createdAt,
        updatedAt: newEnvVar.updatedAt,
        isVisible: false
      }
    })
  } catch (error) {
    console.error('Error creating environment variable:', error)
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to create environment variable' },
      { status: 500 }
    )
  }
} 