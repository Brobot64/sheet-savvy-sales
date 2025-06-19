
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
    const { spreadsheetId, range, values } = await req.json()

    // Get the service account credentials from Supabase secrets
    const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY')
    if (!serviceAccountKey) {
      throw new Error('Google Service Account credentials not configured')
    }

    const credentials = JSON.parse(serviceAccountKey)
    
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
      throw new Error('Failed to get access token')
    }

    // Properly format the range for Google Sheets API
    let finalRange = range
    console.log('Original range:', range)
    
    // If the range contains a sheet name with special characters, we need to handle it carefully
    if (range.includes('!')) {
      const [sheetName, cellRange] = range.split('!')
      
      // For sheet names with spaces or special characters, we need to quote them
      // But we should NOT quote them if they're already properly formatted
      let formattedSheetName = sheetName
      
      // Check if sheet name needs quoting (contains spaces, parentheses, etc.)
      if (sheetName.includes(' ') || sheetName.includes('(') || sheetName.includes(')') || sheetName.includes('-')) {
        // Only add quotes if not already quoted
        if (!sheetName.startsWith("'") || !sheetName.endsWith("'")) {
          // Escape any existing single quotes by doubling them
          const escapedName = sheetName.replace(/'/g, "''")
          formattedSheetName = `'${escapedName}'`
        }
      }
      
      finalRange = `${formattedSheetName}!${cellRange}`
    }
    
    console.log('Formatted range:', finalRange)

    // Use access token to write to Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(finalRange)}:append`
    console.log('Full API URL:', sheetsUrl)
    
    const sheetsResponse = await fetch(sheetsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        values: values
      })
    })

    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.json().catch(() => ({}))
      console.error('Google Sheets API error:', sheetsResponse.status, errorData)
      console.error('Request URL was:', sheetsUrl)
      console.error('Final range used:', finalRange)
      throw new Error(`Google Sheets API error: ${sheetsResponse.status} - ${errorData.error?.message || sheetsResponse.statusText}`)
    }

    const data = await sheetsResponse.json()
    
    return new Response(
      JSON.stringify({ success: true, updatedRows: data.updates?.updatedRows || 0 }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in google-sheets-write:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
