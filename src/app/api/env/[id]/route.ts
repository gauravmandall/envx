import { NextRequest, NextResponse } from 'next/server'
import { getEnvVarById, updateEnvVar, deleteEnvVar } from '@/lib/env-storage'

// Helper function to verify authentication
function isAuthenticated(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const adminPassword = process.env.ADMIN_PASSWORD || 'secure123'
  
  return authHeader === `Bearer ${adminPassword}`
}

// GET /api/env/[id] - Get single environment variable
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const envVar = getEnvVarById(params.id)
    
    if (!envVar) {
      return NextResponse.json(
        { success: false, message: 'Environment variable not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: envVar.id,
        name: envVar.name,
        value: envVar.value,
        createdAt: envVar.createdAt,
        updatedAt: envVar.updatedAt,
        isVisible: false
      }
    })
  } catch (error) {
    console.error('Error fetching environment variable:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch environment variable' },
      { status: 500 }
    )
  }
}

// PUT /api/env/[id] - Update environment variable
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const updatedEnvVar = updateEnvVar(params.id, name, value)
    
    return NextResponse.json({
      success: true,
      message: 'Environment variable updated successfully',
      data: {
        id: updatedEnvVar.id,
        name: updatedEnvVar.name,
        value: updatedEnvVar.value,
        createdAt: updatedEnvVar.createdAt,
        updatedAt: updatedEnvVar.updatedAt,
        isVisible: false
      }
    })
  } catch (error) {
    console.error('Error updating environment variable:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, message: 'Environment variable not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to update environment variable' },
      { status: 500 }
    )
  }
}

// DELETE /api/env/[id] - Delete environment variable
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!isAuthenticated(request)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const deleted = deleteEnvVar(params.id)
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, message: 'Environment variable not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Environment variable deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting environment variable:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete environment variable' },
      { status: 500 }
    )
  }
} 