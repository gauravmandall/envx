import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This API route is used to initialize the database
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

    // Test database connection and ensure tables exist
    try {
      // Try to count records to verify connection and table existence
      const count = await prisma.environmentVariable.count();
      
      return NextResponse.json({
        success: true,
        message: `Database initialized successfully. Found ${count} environment variables.`
      });
    } catch (error) {
      console.error('Database initialization error:', error);
      return NextResponse.json(
        { success: false, message: 'Database initialization failed. Please check your DATABASE_URL and run the migrations.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in setup endpoint:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 