import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Verify current password
    const currentEnvPassword = process.env.ADMIN_PASSWORD || 'secure123'
    
    if (currentPassword !== currentEnvPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Update the .env.local file
    const envPath = join(process.cwd(), '.env.local')
    let envContent = ''
    
    try {
      envContent = readFileSync(envPath, 'utf8')
    } catch (error) {
      // File doesn't exist, create new content
      envContent = ''
    }
    
    // Update or add ADMIN_PASSWORD
    const lines = envContent.split('\n')
    const adminPasswordIndex = lines.findIndex(line => line.startsWith('ADMIN_PASSWORD='))
    
    if (adminPasswordIndex !== -1) {
      lines[adminPasswordIndex] = `ADMIN_PASSWORD=${newPassword}`
    } else {
      lines.push(`ADMIN_PASSWORD=${newPassword}`)
    }
    
    // Write back to file
    writeFileSync(envPath, lines.join('\n'))
    
    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 