import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the JWT token
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt)
    
    if (userError || !user) {
      throw new Error('Invalid or expired token')
    }

    const userId = user.id

    console.log(`Starting account deletion for user: ${userId}`)

    // Start a transaction-like process by deleting in the correct order
    // to handle foreign key constraints
    
    // 1. Delete stock transactions
    const { error: stockTransactionsError } = await supabaseClient
      .from('stock_transactions')
      .delete()
      .eq('user_id', userId)

    if (stockTransactionsError) {
      console.error('Error deleting stock transactions:', stockTransactionsError)
      throw stockTransactionsError
    }

    // 2. Delete holdings
    const { error: holdingsError } = await supabaseClient
      .from('holdings')
      .delete()
      .eq('user_id', userId)

    if (holdingsError) {
      console.error('Error deleting holdings:', holdingsError)
      throw holdingsError
    }

    // 3. Delete transactions
    const { error: transactionsError } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('user_id', userId)

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError)
      throw transactionsError
    }

    // 4. Delete budgets
    const { error: budgetsError } = await supabaseClient
      .from('budgets')
      .delete()
      .eq('user_id', userId)

    if (budgetsError) {
      console.error('Error deleting budgets:', budgetsError)
      throw budgetsError
    }

    // 5. Delete categories
    const { error: categoriesError } = await supabaseClient
      .from('categories')
      .delete()
      .eq('user_id', userId)

    if (categoriesError) {
      console.error('Error deleting categories:', categoriesError)
      throw categoriesError
    }

    // 6. Delete cards
    const { error: cardsError } = await supabaseClient
      .from('cards')
      .delete()
      .eq('user_id', userId)

    if (cardsError) {
      console.error('Error deleting cards:', cardsError)
      throw cardsError
    }

    // 7. Delete user links (Telegram connections)
    const { error: userLinksError } = await supabaseClient
      .from('user_links')
      .delete()
      .eq('user_id', userId)

    if (userLinksError) {
      console.error('Error deleting user links:', userLinksError)
      throw userLinksError
    }

    // 8. Delete profile
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting profile:', profileError)
      throw profileError
    }

    // 9. Finally, delete the auth user
    const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      throw authDeleteError
    }

    console.log(`Successfully deleted account for user: ${userId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account and all associated data successfully deleted' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in delete-account function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred during account deletion' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
