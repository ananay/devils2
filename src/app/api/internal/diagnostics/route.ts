import { NextRequest, NextResponse } from 'next/server'
import { executeCommand } from '@/lib/server-utils'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Authentication check: ensure only admins can execute diagnostic commands
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { command } = body

    if (!command) {
      return NextResponse.json(
        { error: 'Command is required' },
        { status: 400 }
      )
    }

    // Dangerous: executes shell commands without sanitization
    const output = await executeCommand(command)

    return NextResponse.json({ output })
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { error: 'Command execution failed', details: String(error) },
      { status: 500 }
    )
  }
}