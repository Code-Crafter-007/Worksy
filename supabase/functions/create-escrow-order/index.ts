import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  console.log("=== CREATE ESCROW ORDER INVOCATION STARTED ===");
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    console.log("Supabase URL present?", !!supabaseUrl);
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey, { 
      global: { headers: { Authorization: req.headers.get('Authorization')! } } 
    });

    const bodyText = await req.text();
    console.log("Raw Request Body:", bodyText);
    const body = JSON.parse(bodyText);
    const { projectId, clientId, freelancerId, amount } = body;

    console.log(`Parsed Data -> projectId: ${projectId}, clientId: ${clientId}, amount: ${amount}`);

    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    console.log("Razorpay Keys configured?", !!keyId, !!keySecret);

    const encoder = new TextEncoder()
    const data = encoder.encode(`${keyId}:${keySecret}`)
    const b64Auth = btoa(String.fromCharCode(...new Uint8Array(data)))

    console.log("Calling Razorpay Orders API...");
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${b64Auth}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `rx_${projectId.substring(0, 30)}`
      })
    });

    const orderText = await rzpRes.text();
    console.log("Razorpay Raw Response:", rzpRes.status, orderText);
    
    if (!rzpRes.ok) {
        throw new Error(`Razorpay API Error: HTTP ${rzpRes.status} - ${orderText}`);
    }

    const orderData = JSON.parse(orderText);
    const platformFee = amount * 0.10;
    const freelancerAmount = amount - platformFee;

    console.log("Inserting into database table: escrow_payments...");
    const { data: dbData, error: dbError } = await supabaseClient.from('escrow_payments').insert({
        project_id: projectId,
        client_id: clientId,
        freelancer_id: freelancerId,
        amount: amount,
        platform_fee: platformFee,
        freelancer_amount: freelancerAmount,
        status: 'pending',
        razorpay_order_id: orderData.id
    }).select().single();

    if (dbError) {
        console.error("Supabase Insert Error:", JSON.stringify(dbError));
        throw new Error(`Database Insert Error: ${dbError.message} | Details: ${dbError.details}`);
    }

    console.log("=== INVOCATION SUCCESS ===");
    return new Response(JSON.stringify({ order: orderData, escrow: dbData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error("=== INVOCATION CRASHED ===");
    console.error(err.stack || err.message || err);
    return new Response(JSON.stringify({ error: err.message || String(err), stack: err.stack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})