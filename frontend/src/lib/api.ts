import { supabase } from '@/integrations/supabase/client';

// Transaction Management
export const transactionApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id,
        amount,
        description,
        transaction_date,
        notes,
        categories!inner(name, color),
        cards!inner(name)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(transaction: any) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async exportToExcel(userId: string, type: 'all' | 'monthly' = 'all') {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        description,
        transaction_date,
        categories(name),
        cards(name)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Stock Management
export const stockApi = {
  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select(`
        id,
        symbol,
        shares,
        price_per_share,
        total_amount,
        transaction_type,
        transaction_date,
        notes,
        categories(name, color)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getHoldings(userId: string) {
    const { data, error } = await supabase
      .from('holdings')
      .select(`
        id,
        symbol,
        shares,
        average_price,
        total_cost,
        current_price,
        categories(name, color)
      `)
      .eq('user_id', userId)
      .gt('shares', 0);
    
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction: any) {
    const { data, error } = await supabase
      .from('stock_transactions')
      .insert([transaction])
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Category Management
export const categoryApi = {
  async getAll(userId: string, type?: 'expense' | 'stock') {
    let query = supabase
      .from('categories')
      .select('id, name, color, category_type, parent_category_id')
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (type) {
      query = query.eq('category_type', type);
    }
    
    const { data, error } = await query.order('name');
    if (error) throw error;
    return data;
  },

  async create(category: any) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Cards Management
export const cardApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('cards')
      .select('id, name, card_type')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async create(card: any) {
    const { data, error } = await supabase
      .from('cards')
      .insert([card])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('cards')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  }
};

// Profile Management
export const profileApi = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};

// Budget Management
export const budgetApi = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        id,
        amount,
        month_year,
        categories(name, color)
      `)
      .eq('user_id', userId)
      .order('month_year', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async create(budget: any) {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select();
    
    if (error) throw error;
    return data[0];
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
};
