
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, symbol, shares, price_per_share, type } = await req.json()

    if (!user_id || !symbol || !shares || !price_per_share || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, symbol, shares, price_per_share, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['buy', 'sell'].includes(type.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Type must be either "buy" or "sell"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Logging stock transaction for user:', user_id, 'symbol:', symbol, 'type:', type)

    const numShares = parseFloat(shares)
    const numPrice = parseFloat(price_per_share)
    const totalAmount = numShares * numPrice

    // Get default stock category (first active stock category)
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user_id)
      .eq('category_type', 'stock')
      .eq('is_active', true)
      .order('created_at')
      .limit(1)
      .single()

    if (categoryError) {
      console.error('Stock category not found:', categoryError)
      return new Response(
        JSON.stringify({ error: 'No active stock category found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert stock transaction
    const { data: stockTransaction, error: transactionError } = await supabase
      .from('stock_transactions')
      .insert({
        user_id,
        symbol: symbol.toUpperCase(),
        shares: numShares,
        price_per_share: numPrice,
        total_amount: totalAmount,
        transaction_type: type.toLowerCase(),
        category_id: category.id,
        transaction_date: new Date().toISOString().split('T')[0] // Today's date
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Stock transaction insert error:', transactionError)
      return new Response(
        JSON.stringify({ error: transactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Stock transaction logged successfully:', stockTransaction.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction logged successfully`,
        transaction_id: stockTransaction.id,
        symbol: stockTransaction.symbol,
        shares: stockTransaction.shares,
        price_per_share: stockTransaction.price_per_share,
        total_amount: stockTransaction.total_amount,
        type: stockTransaction.transaction_type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in log-stock function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
