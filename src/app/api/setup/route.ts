import { NextRequest, NextResponse } from 'next/server'
import { initSupabaseTable } from '@/lib/supabase'

// This API route is used to initialize Supabase table structure
// Call this after deployment to ensure the database is set up properly

export async function GET(request: NextRequest) {
  try {
    // Check for basic auth to prevent unauthorized initialization
    const authHeader = request.headers.get('authorization')
    const adminPassword = process.env.ADMIN_PASSWORD || 'secure123'
    
    if (authHeader !== `Bearer ${adminPassword}`) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const success = await initSupabaseTable()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Supabase table initialized successfully'
      })
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to initialize Supabase table' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 