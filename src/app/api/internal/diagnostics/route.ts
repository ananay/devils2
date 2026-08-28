import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

// Security fix: Whitelist of allowed diagnostic commands to prevent RCE
// Only these predefined commands can be executed
const ALLOWED_COMMANDS: Record<string, string[]> = {
  'health': ['curl', '-s', 'http://localhost:3000/api/health'],
  'disk-usage': ['df', '-h'],
  'memory': ['free', '-m'],
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Changed from 'command' to 'commandKey' to prevent arbitrary command execution
    const { commandKey } = body

    if (!commandKey) {
      return NextResponse.json(
        { error: 'Command key is required' },
        { status: 400 }
      )
    }

    // Security fix: Validate command is in whitelist
    // This prevents attackers from executing arbitrary shell commands
    const allowedArgs = ALLOWED_COMMANDS[commandKey]
    if (!allowedArgs) {
      return NextResponse.json(
        { error: 'Invalid command key' },
        { status: 400 }
      )
    }

    // Security fix: Use execFile with array args instead of exec with string
    // execFile does not spawn a shell, preventing shell injection attacks
    const [command, ...args] = allowedArgs
    const { stdout, stderr } = await execFileAsync(command, args)
    const output = stdout || stderr

    return NextResponse.json({ output })
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { error: 'Command execution failed', details: String(error) },
      { status: 500 }
    )
  }
}