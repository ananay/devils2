import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// Helper to verify user authentication and authorization
async function authorizeUser(request: NextRequest, targetUserId: number) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return { authorized: false, error: 'Unauthorized', status: 401 }
  }
  
  const currentUserId = parseInt(session.user.id)
  const isAdmin = session.user.role === 'admin'
  
  // Users can only access their own data unless they are admin
  if (currentUserId !== targetUserId && !isAdmin) {
    return { authorized: false, error: 'Forbidden', status: 403 }
  }
  
  return { authorized: true, user: session.user }
}

// GET user by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    // Security fix: Check authentication and authorization
    const auth = await authorizeUser(request, userId)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        // Security fix: Removed sensitive fields (resetToken, preferences)
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    // Security fix: Check authentication and authorization
    const auth = await authorizeUser(request, userId)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    
    // Security fix: Whitelist allowed fields to prevent mass assignment
    const allowedFields = ['name', 'bio', 'avatarUrl']
    const updateData: Record<string, unknown> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatarUrl: true,
        role: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const userId = parseInt(id)

    // Security fix: Check authentication and authorization
    const auth = await authorizeUser(request, userId)
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ message: 'User deleted' })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}