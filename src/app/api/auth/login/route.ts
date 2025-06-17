import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    // Get the password from environment variables
    const envPassword = process.env.ADMIN_PASSWORD || 'secure123'
    
    // Simple string comparison for now (you might want to use hashed passwords in production)
    const isValid = password === envPassword
    
    if (isValid) {
      return NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 