import express from 'express';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendTelegramMessage(chatId, text) {
  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}

async function getUserByTelegramId(telegramId) {
  const { data } = await supabase
    .from('user_links')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single();
  return data?.user_id;
}

async function linkUser(telegramId, userId) {
  const { error } = await supabase
    .from('user_links')
    .insert({ telegram_id: telegramId, user_id: userId });
  return !error;
}

async function getCategories(userId, type) {
  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .eq('category_type', type)
    .eq('is_active', true);
  return data || [];
}

async function getCards(userId) {
  const { data } = await supabase
    .from('cards')
    .select('id, name')
    .eq('user_id', userId)
    .eq('is_active', true);
  return data || [];
}

async function addTransaction(userId, amount, description, categoryName, cardName) {
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('name', categoryName)
    .eq('category_type', 'expense')
    .single();

  const { data: card } = await supabase
    .from('cards')
    .select('id')
    .eq('user_id', userId)
    .eq('name', cardName)
    .single();

  if (!category || !card) {
    return false;
  }

  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      amount: amount,
      description: description,
      category_id: category.id,
      card_id: card.id,
      transaction_date: new Date().toISOString().split('T')[0]
    });

  return !error;
}

async function addStockTransaction(userId, symbol, shares, price, type) {
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .eq('category_type', 'stock')
    .limit(1)
    .single();

  if (!category) {
    return false;
  }

  const { error } = await supabase
    .from('stock_transactions')
    .insert({
      user_id: userId,
      symbol: symbol.toUpperCase(),
      shares: shares,
      price_per_share: price,
      total_amount: shares * price,
      transaction_type: type,
      category_id: category.id,
      transaction_date: new Date().toISOString().split('T')[0]
    });

  return !error;
}

async function getSummary(userId) {
  const { data: expenses } = await supabase
    .from('transactions')
    .select('amount')
    .eq('user_id', userId);

  const { data: holdings } = await supabase
    .from('holdings')
    .select('shares, average_price')
    .eq('user_id', userId);

  const totalExpenses = expenses?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalStockValue = holdings?.reduce((sum, h) => sum + (Number(h.shares) * Number(h.average_price)), 0) || 0;

  return { totalExpenses, totalStockValue };
}

async function handleCommand(telegramId, command, args) {
  const userId = await getUserByTelegramId(telegramId);

  if (!userId && !command.startsWith('/link')) {
    return "Please link your account first using: /link [your-email]";
  }

  switch (command) {
    case '/start':
    case '/help':
      return `*Finance Tracker Bot Commands:*

📊 *Account Management:*
/link [your-email] - Link your Telegram to your account
/balance - Show your financial summary

💰 *Add Transactions:*
/add_expense [amount] [description] [category] [card] - Add expense
Example: /add_expense 25.50 Coffee Dining MainCard

📈 *Stock Transactions:*
/add_stock [symbol] [shares] [price] [buy/sell] - Add stock transaction
Example: /add_stock AAPL 10 150.25 buy

📋 *Information:*
/categories - List available categories
/cards - List available cards

Need help? Just type /help anytime!`;

    case '/link':
      if (args.length !== 1) {
        return "Usage: /link [your-email]";
      }
      // Look up user_id by email
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', args[0])
        .single();

      if (!profile) {
        return "❌ Email not found. Please use the email you registered with.";
      }

      const success = await linkUser(telegramId, profile.id);
      return success
        ? "✅ Account linked successfully!"
        : "❌ Failed to link account. Please try again.";

    case '/balance':
      const summary = await getSummary(userId);
      return `💰 *Your Financial Summary:*

💸 Total Expenses: $${summary.totalExpenses.toFixed(2)}
📊 Stock Portfolio Value: $${summary.totalStockValue.toFixed(2)}
📈 Net Worth: $${(summary.totalStockValue - summary.totalExpenses).toFixed(2)}`;

    case '/categories':
      const categories = await getCategories(userId, 'expense');
      return `📋 *Available Categories:*\n${categories.map(c => `• ${c.name}`).join('\n')}`;

    case '/cards':
      const cards = await getCards(userId);
      return `💳 *Available Cards:*\n${cards.map(c => `• ${c.name}`).join('\n')}`;

    case '/add_expense':
      if (args.length < 4) {
        return "Usage: /add_expense [amount] [description] [category] [card]\nExample: /add_expense 25.50 Coffee Dining MainCard";
      }
      const amount = parseFloat(args[0]);
      const description = args[1];
      const category = args[2];
      const card = args[3];

      if (isNaN(amount)) {
        return "❌ Invalid amount. Please enter a valid number.";
      }

      const expenseSuccess = await addTransaction(userId, amount, description, category, card);
      return expenseSuccess ?
        `✅ Expense added: $${amount.toFixed(2)} for ${description}` :
        "❌ Failed to add expense. Check category and card names.";

    case '/add_stock':
      if (args.length < 4) {
        return "Usage: /add_stock [symbol] [shares] [price] [buy/sell]\nExample: /add_stock AAPL 10 150.25 buy";
      }
      const symbol = args[0];
      const shares = parseFloat(args[1]);
      const price = parseFloat(args[2]);
      const type = args[3].toLowerCase();

      if (isNaN(shares) || isNaN(price) || !['buy', 'sell'].includes(type)) {
        return "❌ Invalid parameters. Check shares, price, and type (buy/sell).";
      }

      const stockSuccess = await addStockTransaction(userId, symbol, shares, price, type);
      return stockSuccess ?
        `✅ Stock transaction added: ${type.toUpperCase()} ${shares} shares of ${symbol} at $${price}` :
        "❌ Failed to add stock transaction.";

    default:
      return "❓ Unknown command. Type /help for available commands.";
  }
}

app.post('/telegram-bot', async (req, res) => {
  console.log('Received Telegram update:', req.body); // Add this line
  try {
    const update = req.body;

    if (update.message?.text) {
      const chatId = update.message.chat.id;
      const telegramId = update.message.from.id;
      const text = update.message.text.trim();

      let response = '';

      if (text.startsWith('/')) {
        const parts = text.split(' ');
        const command = parts[0];
        const args = parts.slice(1);
        response = await handleCommand(telegramId, command, args);
      } else {
        response = "I don't understand. Type /help for available commands.";
      }

      await sendTelegramMessage(chatId, response);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing update:', error);
    res.status(500).send('Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Telegram bot server running on port ${PORT}`);
});