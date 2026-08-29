import { NextRequest, NextResponse } from 'next/server'
import { prisma, rawQuery } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

// Whitelisted fields for product creation to prevent mass assignment
const ALLOWED_FIELDS = [
  'name', 'slug', 'description', 'price', 'imageUrl',
  'stock', 'featured', 'abv', 'origin', 'categoryId'
]

// GET products with search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'name'
    const order = searchParams.get('order') || 'asc'

    if (search) {
      const products = await rawQuery<{
        id: number
        name: string
        slug: string
        description: string
        price: number
        image_url: string
        stock: number
        abv: number
        origin: string
        category_id: number
      }>(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.name ILIKE '%${search}%' OR p.description ILIKE '%${search}%'
        ORDER BY p.${sort} ${order}
      `)

      return NextResponse.json({ products })
    }

    // Regular Prisma query for non-search
    const where: Record<string, unknown> = {}
    if (category) {
      where.category = { slug: category }
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { [sort]: order },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Get products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', details: String(error) },
      { status: 500 }
    )
  }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization check - admin only
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Mass assignment protection - only allow whitelisted fields
    const sanitized: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        sanitized[field] = body[field]
      }
    }

    const product = await prisma.product.create({
      data: sanitized as any,
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product', details: String(error) },
      { status: 500 }
    )
  }
}