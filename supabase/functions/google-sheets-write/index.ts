
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
    const requestBody = await req.json()
    const { spreadsheetId, range, values, gid } = requestBody
    
    console.log('Writing to sheet with params:', { 
      spreadsheetId: spreadsheetId?.substring(0, 10) + '...', 
      range, 
      gid, 
      rowCount: values?.length,
      hasValues: !!values
    })

    // Validate input parameters
    if (!spreadsheetId || !range || !values || !Array.isArray(values)) {
      console.error('Invalid input parameters:', { spreadsheetId: !!spreadsheetId, range: !!range, values: !!values })
      throw new Error('Missing required parameters: spreadsheetId, range, and values are required')
    }

    if (values.length === 0) {
      console.error('Empty values array provided')
      throw new Error('Values array cannot be empty')
    }

    // Get the service account credentials from Supabase secrets
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      console.error('Google Service Account credentials not found in environment')
      throw new Error('Google Service Account credentials not configured')
    }

    let credentials
    try {
      credentials = JSON.parse(serviceAccountKey)
    } catch (parseError) {
      console.error('Failed to parse service account key:', parseError)
      throw new Error('Invalid Google Service Account credentials format')
    }
    
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
      throw new Error(`Failed to get access token: ${tokenData.error || 'Unknown token error'}`)
    }

    // Use the correct append API endpoint and request format
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`
    
    console.log('Write URL:', sheetsUrl)
    console.log('Values to write (first row):', values[0])
    
    const sheetsResponse = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: values
      })
    })

    if (!sheetsResponse.ok) {
      let errorData
      try {
        errorData = await sheetsResponse.json()
      } catch {
        errorData = { message: await sheetsResponse.text() }
      }
      
      console.error('Google Sheets API error:', {
        status: sheetsResponse.status,
        statusText: sheetsResponse.statusText,
        error: errorData,
        url: sheetsUrl
      })
      
      throw new Error(`Google Sheets API error (${sheetsResponse.status}): ${errorData.error?.message || errorData.message || sheetsResponse.statusText}`)
    }

    const data = await sheetsResponse.json()
    console.log('Write successful:', {
      updatedRows: data.updates?.updatedRows || 0,
      updatedRange: data.updates?.updatedRange
    })
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedRows: data.updates?.updatedRows || 0,
        updatedRange: data.updates?.updatedRange
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in google-sheets-write:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
