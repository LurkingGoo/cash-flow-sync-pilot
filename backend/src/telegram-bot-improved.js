import express from 'express';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN; // Use environment variable for security

if (!supabaseUrl || !supabaseServiceKey || !telegramToken) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendTelegramMessage(chatId, text) {
  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      console.error('Failed to send Telegram message:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

async function getUserByTelegramId(telegramId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error getting user by telegram ID:', error);
      return null;
    }
    
    return data?.id;
  } catch (error) {
    console.error('Error in getUserByTelegramId:', error);
    return null;
  }
}

async function linkUser(telegramId, email) {
  try {
    // Find user by email in profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, telegram_id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found for email:', email);
      return { success: false, message: 'Email not found. Please use the email you registered with.' };
    }

    // Check if already linked to another telegram account
    if (profile.telegram_id && profile.telegram_id !== telegramId) {
      return { success: false, message: 'This account is already linked to another Telegram account.' };
    }

    // Check if this telegram ID is already linked to another account
    const { data: existingLink } = await supabase
      .from('profiles')
      .select('id')
      .eq('telegram_id', telegramId)
      .neq('id', profile.id)
      .single();

    if (existingLink) {
      return { success: false, message: 'This Telegram account is already linked to another user.' };
    }

    // Update the profile with telegram_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ telegram_id: telegramId })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error linking user:', updateError);
      return { success: false, message: 'Failed to link account. Please try again.' };
    }

    return { success: true, message: 'Account linked successfully!' };
  } catch (error) {
    console.error('Error in linkUser:', error);
    return { success: false, message: 'An error occurred while linking your account.' };
  }
}

async function getCategories(userId, type) {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)
      .eq('category_type', type)
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error getting categories:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCategories:', error);
    return [];
  }
}

async function getCards(userId) {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.error('Error getting cards:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getCards:', error);
    return [];
  }
}

async function addTransaction(userId, amount, description, categoryName, cardName) {
  try {
    // Get category by name
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', categoryName)
      .eq('category_type', 'expense')
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return { success: false, message: `Category "${categoryName}" not found.` };
    }

    // Get card by name
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id')
      .eq('user_id', userId)
      .eq('name', cardName)
      .eq('is_active', true)
      .single();

    if (cardError || !card) {
      return { success: false, message: `Card "${cardName}" not found.` };
    }

    // Insert transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: amount,
        description: description,
        category_id: category.id,
        card_id: card.id,
        transaction_date: new Date().toISOString().split('T')[0]
      });

    if (transactionError) {
      console.error('Error adding transaction:', transactionError);
      return { success: false, message: 'Failed to add transaction.' };
    }

    return { success: true, message: `Transaction added: $${amount.toFixed(2)} for ${description}` };
  } catch (error) {
    console.error('Error in addTransaction:', error);
    return { success: false, message: 'An error occurred while adding the transaction.' };
  }
}

async function addStockTransaction(userId, symbol, shares, price, type) {
  try {
    // Get a stock category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('category_type', 'stock')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (categoryError || !category) {
      return { success: false, message: 'No stock category found. Please create a stock category first.' };
    }

    const totalAmount = shares * price;

    // Insert stock transaction
    const { error: stockError } = await supabase
      .from('stock_transactions')
      .insert({
        user_id: userId,
        symbol: symbol.toUpperCase(),
        shares: shares,
        price_per_share: price,
        total_amount: totalAmount,
        transaction_type: type,
        category_id: category.id,
        transaction_date: new Date().toISOString().split('T')[0]
      });

    if (stockError) {
      console.error('Error adding stock transaction:', stockError);
      return { success: false, message: 'Failed to add stock transaction.' };
    }

    return { 
      success: true, 
      message: `Stock transaction added: ${type.toUpperCase()} ${shares} shares of ${symbol.toUpperCase()} at $${price.toFixed(2)}` 
    };
  } catch (error) {
    console.error('Error in addStockTransaction:', error);
    return { success: false, message: 'An error occurred while adding the stock transaction.' };
  }
}

async function setBudget(userId, categoryName, amount, monthYear) {
  try {
    // Get category by name
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', categoryName)
      .eq('category_type', 'expense')
      .eq('is_active', true)
      .single();

    if (categoryError || !category) {
      return { success: false, message: `Category "${categoryName}" not found.` };
    }

    // Upsert budget
    const { error: budgetError } = await supabase
      .from('budgets')
      .upsert({
        user_id: userId,
        category_id: category.id,
        amount: amount,
        month_year: monthYear
      });

    if (budgetError) {
      console.error('Error setting budget:', budgetError);
      return { success: false, message: 'Failed to set budget.' };
    }

    return { 
      success: true, 
      message: `Budget set: $${amount.toFixed(2)} for ${categoryName} in ${monthYear}` 
    };
  } catch (error) {
    console.error('Error in setBudget:', error);
    return { success: false, message: 'An error occurred while setting the budget.' };
  }
}

async function getSummary(userId) {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get expenses for current month
    const { data: expenses, error: expenseError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('transaction_date', currentMonth + '-01');

    if (expenseError) {
      console.error('Error getting expenses:', expenseError);
    }

    // Get stock holdings
    const { data: holdings, error: holdingError } = await supabase
      .from('holdings')
      .select('shares, average_price, current_price')
      .eq('user_id', userId);

    if (holdingError) {
      console.error('Error getting holdings:', holdingError);
    }

    const totalExpenses = expenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalStockValue = holdings?.reduce((sum, h) => {
      const price = Number(h.current_price) || Number(h.average_price);
      return sum + (Number(h.shares) * price);
    }, 0) || 0;

    return { totalExpenses, totalStockValue };
  } catch (error) {
    console.error('Error in getSummary:', error);
    return { totalExpenses: 0, totalStockValue: 0 };
  }
}

async function handleCommand(telegramId, command, args) {
  const userId = await getUserByTelegramId(telegramId);

  if (!userId && !command.startsWith('/link')) {
    return "Please link your account first using: /link [your-email]";
  }

  switch (command) {
    case '/start':
    case '/help':
      return `*🏦 CashFlow Sync Bot*

📊 *Account Management:*
/link [email] - Link your Telegram to your account
/balance - Show your financial summary

💸 *Expense Management:*
/add_expense [amount] [description] [category] [card]
Example: /add_expense 25.50 "Morning Coffee" "Food & Dining" "Main Card"

📈 *Stock Management:*
/add_stock [symbol] [shares] [price] [buy/sell]
Example: /add_stock AAPL 10 150.25 buy

💰 *Budget Management:*
/set_budget [category] [amount] [month-year]
Example: /set_budget "Food & Dining" 500 2024-12

📋 *Information:*
/categories - List expense categories
/cards - List payment cards

💡 *Tips:*
• Use quotes for multi-word descriptions
• Category and card names are case-sensitive
• Get your Telegram ID: @userinfobot

Need help? Type /help anytime!`;

    case '/link':
      if (args.length !== 1) {
        return "Usage: /link [your-email]\nExample: /link john@example.com";
      }
      
      const email = args[0];
      const linkResult = await linkUser(telegramId, email);
      return linkResult.success ? `✅ ${linkResult.message}` : `❌ ${linkResult.message}`;

    case '/balance':
      const summary = await getSummary(userId);
      return `💰 *Your Financial Summary:*

💸 This Month's Expenses: $${summary.totalExpenses.toLocaleString()}
📊 Stock Portfolio Value: $${summary.totalStockValue.toLocaleString()}
📈 Net Worth: $${(summary.totalStockValue - summary.totalExpenses).toLocaleString()}

_Last updated: ${new Date().toLocaleString()}_`;

    case '/categories':
      const categories = await getCategories(userId, 'expense');
      if (categories.length === 0) {
        return "❌ No expense categories found. Please create categories in the dashboard first.";
      }
      return `📋 *Available Expense Categories:*\n\n${categories.map(c => `• ${c.name}`).join('\n')}`;

    case '/cards':
      const cards = await getCards(userId);
      if (cards.length === 0) {
        return "❌ No cards found. Please create cards in the dashboard first.";
      }
      return `💳 *Available Cards:*\n\n${cards.map(c => `• ${c.name}`).join('\n')}`;

    case '/add_expense':
      if (args.length < 4) {
        return `❌ Usage: /add_expense [amount] [description] [category] [card]

Example: /add_expense 25.50 "Morning Coffee" "Food & Dining" "Main Card"

💡 Use /categories and /cards to see available options.`;
      }

      const amount = parseFloat(args[0]);
      const description = args[1].replace(/"/g, '');
      const category = args[2].replace(/"/g, '');
      const card = args[3].replace(/"/g, '');

      if (isNaN(amount) || amount <= 0) {
        return "❌ Invalid amount. Please enter a positive number.";
      }

      const expenseResult = await addTransaction(userId, amount, description, category, card);
      return expenseResult.success ? `✅ ${expenseResult.message}` : `❌ ${expenseResult.message}`;

    case '/add_stock':
      if (args.length < 4) {
        return `❌ Usage: /add_stock [symbol] [shares] [price] [buy/sell]

Example: /add_stock AAPL 10 150.25 buy`;
      }

      const symbol = args[0].toUpperCase();
      const shares = parseFloat(args[1]);
      const price = parseFloat(args[2]);
      const type = args[3].toLowerCase();

      if (isNaN(shares) || shares <= 0) {
        return "❌ Invalid shares amount. Please enter a positive number.";
      }

      if (isNaN(price) || price <= 0) {
        return "❌ Invalid price. Please enter a positive number.";
      }

      if (!['buy', 'sell'].includes(type)) {
        return "❌ Invalid transaction type. Use 'buy' or 'sell'.";
      }

      const stockResult = await addStockTransaction(userId, symbol, shares, price, type);
      return stockResult.success ? `✅ ${stockResult.message}` : `❌ ${stockResult.message}`;

    case '/set_budget':
      if (args.length < 3) {
        return `❌ Usage: /set_budget [category] [amount] [month-year]

Example: /set_budget "Food & Dining" 500 2024-12

💡 Use /categories to see available categories.`;
      }

      const budgetCategory = args[0].replace(/"/g, '');
      const budgetAmount = parseFloat(args[1]);
      const monthYear = args[2];

      if (isNaN(budgetAmount) || budgetAmount <= 0) {
        return "❌ Invalid amount. Please enter a positive number.";
      }

      if (!/^\d{4}-\d{2}$/.test(monthYear)) {
        return "❌ Invalid month format. Use YYYY-MM (e.g., 2024-12).";
      }

      const budgetResult = await setBudget(userId, budgetCategory, budgetAmount, monthYear);
      return budgetResult.success ? `✅ ${budgetResult.message}` : `❌ ${budgetResult.message}`;

    default:
      return `❓ Unknown command: ${command}

Type /help for available commands.`;
  }
}

app.post('/telegram-bot', async (req, res) => {
  console.log('Received Telegram update:', JSON.stringify(req.body, null, 2));
  
  try {
    const update = req.body;

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from.id;
      const text = update.message.text.trim();

      let response = '';

      if (text.startsWith('/')) {
        // Parse command with proper quote handling
        const parts = text.match(/\S+|"[^"]+"/g) || [];
        const command = parts[0];
        const args = parts.slice(1);
        
        console.log(`Processing command: ${command} with args:`, args);
        response = await handleCommand(telegramId, command, args);
      } else {
        response = "I don't understand. Type /help for available commands.";
      }

      await sendTelegramMessage(chatId, response);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Telegram update:', error);
    res.status(500).send('Error');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Telegram bot server running on port ${PORT}`);
  console.log(`📊 Connected to Supabase at: ${supabaseUrl}`);
});
