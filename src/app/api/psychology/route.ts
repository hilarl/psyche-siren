import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Use HTTP endpoint for server-to-server communication
    const response = await fetch('http://34.171.189.134:8080/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('Psychology API Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to psychology API' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const response = await fetch('http://34.171.189.134:8080/health')
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed' },
      { status: 500 }
    )
  }
}