
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting Google Sheets test with GID...')
    
    // Get the service account credentials from Supabase secrets
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Google Service Account credentials not configured')
    }

    const credentials = JSON.parse(serviceAccountKey)
    console.log('Credentials loaded successfully')
    
    // Create JWT for Google API authentication
    const header = {
      alg: 'RS256',
      typ: 'JWT',
      kid: credentials.private_key_id
    }

    const now = Math.floor(Date.now() / 1000)
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    // Process the private key properly
    const encoder = new TextEncoder()
    let privateKey = credentials.private_key
    
    // Remove the header and footer lines and any whitespace/newlines
    privateKey = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\\n/g, '')
      .replace(/\n/g, '')
      .replace(/\s/g, '')
    
    // Decode from base64
    const binaryKey = Uint8Array.from(atob(privateKey), c => c.charCodeAt(0))
    
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    // Create JWT
    const headerB64 = btoa(JSON.stringify(header)).replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
    const dataToSign = `${headerB64}.${payloadB64}`
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(dataToSign)
    )
    
    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/[+/=]/g, (m) => ({'+': '-', '/': '_', '=': ''}[m]))
    
    const jwt = `${dataToSign}.${signatureB64}`
    console.log('JWT created successfully')

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      console.error('Token response:', tokenData)
      throw new Error('Failed to get access token')
    }
    console.log('Access token obtained successfully')

    // Test with GID-based URL (using the price sheet GID from your config)
    const spreadsheetId = '1Ljddx01jdNdy7KPhO_8BCUMRmQ-iTznyA03DkJYOhMU'
    const gid = '1324216461' // Price sheet GID
    
    // Use the export format with GID - this bypasses sheet name parsing entirely
    const sheetsUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`
    console.log('Testing with GID URL:', sheetsUrl)
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      }
    })

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text()
      console.error('Google Sheets API error:', sheetsResponse.status, errorText)
      throw new Error(`Google Sheets API error: ${sheetsResponse.status} - ${errorText}`)
    }

    const csvData = await sheetsResponse.text()
    console.log('CSV data retrieved successfully, length:', csvData.length)
    
    // Parse CSV data into rows
    const rows = csvData.split('\n').map(row => row.split(','))
    const filteredRows = rows.filter(row => row.some(cell => cell.trim() !== ''))
    
    console.log('Parsed rows:', filteredRows.length)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connection test successful using GID',
        rowCount: filteredRows.length,
        sampleData: filteredRows.slice(0, 3) // First 3 rows as sample
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in google-sheets-test:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Test failed - check function logs for details'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
