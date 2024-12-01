import { serve } from 'https://deno.fresh.run/std@0.168.0/http/server.ts'
import { Twilio } from 'https://esm.sh/twilio@4.19.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, receiptData } = await req.json()

    // Initialize Twilio client
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Missing Twilio credentials')
    }

    const client = new Twilio(accountSid, authToken)

    // Format receipt message
    const message = `
Thank you for shopping with ${receiptData.businessName}!

Receipt #: ${receiptData.receiptNumber}
Date: ${receiptData.date}
Total: ${receiptData.total}

Items:
${receiptData.items.map(item => `${item.name} x${item.quantity} - ${item.price}`).join('\n')}

View full receipt: ${receiptData.receiptUrl}
    `.trim()

    // Send SMS
    await client.messages.create({
      body: message,
      to: phoneNumber,
      from: fromNumber,
    })

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
