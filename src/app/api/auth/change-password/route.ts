import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import { verifyAdminPassword, saveAdminCredentials } from '@/lib/auth'

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
    const isValidPassword = await verifyAdminPassword(currentPassword)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Save new password to database
    await saveAdminCredentials(newPassword)
    
    // Also update the .env.local file to keep it in sync
    // This is for development environments that don't use database
    try {
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
    } catch (error) {
      console.error('Error updating .env.local file:', error)
      // This is not a critical error, we still consider the password change successful
      // as it's stored in the database
    }
    
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