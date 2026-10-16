import { createBrowserClient } from '@supabase/ssr';
import { Bagel, CreamCheese, OrderInput, OrderResponse } from '@/types/bagel';
import { MOCK_BAGELS, MOCK_CREAM_CHEESES } from './strapi';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    Boolean(supabaseKey) &&
    supabaseKey !== 'placeholder-key'
  );
}

export async function getBagelsFromSupabase(): Promise<Bagel[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_BAGELS;
  }

  try {
    const { data, error } = await supabase.from('bagels').select('*');
    if (error || !data || data.length === 0) {
      console.warn('Supabase bagels query returned no data or error:', error?.message);
      return MOCK_BAGELS;
    }

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
      description: item.description || '',
      price: Number(item.price),
      imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1585478259715-876a6a81fc08?w=800&q=80',
      category: item.category || 'Bagels',
      inStock: item.in_stock !== false,
      isPopular: Boolean(item.is_popular),
      calories: item.calories,
    }));
  } catch (err) {
    console.error('Error fetching bagels from Supabase:', err);
    return MOCK_BAGELS;
  }
}

export async function getCreamCheesesFromSupabase(): Promise<CreamCheese[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CREAM_CHEESES;
  }

  try {
    const { data, error } = await supabase.from('cream_cheeses').select('*');
    if (error || !data || data.length === 0) {
      console.warn('Supabase cream_cheeses query returned no data or error:', error?.message);
      return MOCK_CREAM_CHEESES;
    }

    return data.map((item: any) => ({
      id: String(item.id),
      name: item.name,
      slug: item.slug || item.name.toLowerCase().replace(/\s+/g, '-'),
      description: item.description || '',
      price: Number(item.price),
      inStock: item.in_stock !== false,
      imageUrl: item.image_url || item.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80',
    }));
  } catch (err) {
    console.error('Error fetching cream cheeses from Supabase:', err);
    return MOCK_CREAM_CHEESES;
  }
}

export async function createOrderInSupabase(orderData: OrderInput): Promise<OrderResponse> {
  const orderNumber = `BGL-${Math.floor(100000 + Math.random() * 900000)}`;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_name: orderData.customerName,
            email: orderData.email,
            phone: orderData.phone,
            pickup_time: orderData.pickupTime,
            notes: orderData.notes,
            items: orderData.items,
            total_amount: orderData.totalAmount,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          id: String(data.id),
          orderNumber: data.order_number,
          status: data.status,
          customerName: data.customer_name,
          totalAmount: Number(data.total_amount),
          createdAt: data.created_at,
        };
      }
      console.warn('Supabase insert order error, falling back to mock return:', error?.message);
    } catch (err) {
      console.error('Failed to create order in Supabase:', err);
    }
  }

  // Demo fallback response
  return {
    id: `ord-${Date.now()}`,
    orderNumber,
    status: 'pending',
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount,
    createdAt: new Date().toISOString(),
  };
}

export async function getOrderByNumberFromSupabase(orderNumber: string): Promise<OrderResponse | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const cleanNumber = orderNumber.trim();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_number', cleanNumber)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: String(data.id),
      orderNumber: data.order_number,
      status: data.status,
      customerName: data.customer_name,
      totalAmount: Number(data.total_amount),
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error fetching order from Supabase:', err);
    return null;
  }
}

