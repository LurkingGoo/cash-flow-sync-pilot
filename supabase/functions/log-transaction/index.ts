
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

    const { user_id, amount, description, category_name, card_name } = await req.json()

    if (!user_id || !amount || !description || !category_name || !card_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, amount, description, category_name, card_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Logging transaction for user:', user_id, 'amount:', amount, 'description:', description)

    // Find category by name
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user_id)
      .eq('name', category_name)
      .eq('category_type', 'expense')
      .eq('is_active', true)
      .single()

    if (categoryError || !category) {
      console.error('Category not found:', category_name, categoryError)
      return new Response(
        JSON.stringify({ error: `Category '${category_name}' not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find card by name
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', user_id)
      .eq('name', card_name)
      .eq('is_active', true)
      .single()

    if (cardError || !card) {
      console.error('Card not found:', card_name, cardError)
      return new Response(
        JSON.stringify({ error: `Card '${card_name}' not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        amount: parseFloat(amount),
        description,
        category_id: category.id,
        card_id: card.id,
        transaction_date: new Date().toISOString().split('T')[0] // Today's date
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction insert error:', transactionError)
      return new Response(
        JSON.stringify({ error: transactionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Transaction logged successfully:', transaction.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Transaction logged successfully',
        transaction_id: transaction.id,
        amount: transaction.amount,
        description: transaction.description
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in log-transaction function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
