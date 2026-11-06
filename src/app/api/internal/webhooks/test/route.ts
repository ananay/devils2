import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_WEBHOOK_DOMAINS = [
  'hooks.slack.com',
  'discord.com',
  'api.github.com',
]

function isAllowedWebhookUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  try {
    const parsedUrl = new URL(value)

    // Restrict outbound requests to approved HTTPS webhook providers.
    return parsedUrl.protocol === 'https:' &&
      !parsedUrl.username &&
      !parsedUrl.password &&
      ALLOWED_WEBHOOK_DOMAINS.some(domain =>
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`)
      )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, event } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    if (!isAllowedWebhookUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid webhook URL' },
        { status: 400 }
      )
    }

    // Construct webhook payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook from Devil\'s Advocate',
      },
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
      },
      body: JSON.stringify(payload),
      // Do not follow redirects to potentially private or internal destinations.
      redirect: 'error',
    })

    return NextResponse.json({
      message: 'Webhook test completed',
      status: response.status,
      statusText: response.statusText,
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json(
      { error: 'Failed to send webhook' },
      { status: 500 }
    )
  }
}
