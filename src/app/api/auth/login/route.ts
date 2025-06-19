import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify password using our new auth system
    const isValid = await verifyAdminPassword(password)
    
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