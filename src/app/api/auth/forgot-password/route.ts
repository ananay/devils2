import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateResetToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Return generic success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent',
      })
    }

    // Generate reset token
    const resetToken = generateResetToken(email)

    // Store reset token
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken },
    })

    // In a real app, send email here - NEVER return token in response
    // const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    // await sendPasswordResetEmail(user.email, resetToken, resetUrl);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred', details: String(error) },
      { status: 500 }
    )
  }
}