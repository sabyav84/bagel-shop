import { createBrowserClient } from '@supabase/ssr';
import { Bagel, CreamCheese, OrderInput, OrderResponse, AdminOrder, OrderItemDetail } from '@/types/bagel';
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

export function parseOrderItems(rawItems: any): OrderItemDetail[] {
  if (!rawItems) return [];
  if (Array.isArray(rawItems)) {
    return rawItems.map((item: any) => ({
      bagelName: item.bagelName || item.name || 'Bagel',
      breadOption: item.breadOption || 'Standard Sliced',
      creamCheeseName: item.creamCheeseName || item.creamCheese || undefined,
      quantity: Number(item.quantity) || 1,
      toasted: item.toasted || 'not-toasted',
      unitPrice: Number(item.unitPrice) || 0,
      specialInstructions: item.specialInstructions || '',
    }));
  }
  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems);
      return parseOrderItems(parsed);
    } catch {
      return [];
    }
  }
  return [];
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
      const enrichedNotes = orderData.paymentStatus === 'paid'
        ? `[PAID via Stripe Test (${orderData.stripePaymentIntentId || 'test_card'})] ${orderData.notes || ''}`.trim()
        : orderData.notes;

      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_name: orderData.customerName,
            email: orderData.email,
            phone: orderData.phone,
            pickup_time: orderData.pickupTime,
            notes: enrichedNotes,
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
          email: data.email || orderData.email,
          phone: data.phone || orderData.phone,
          pickupTime: data.pickup_time || orderData.pickupTime,
          notes: data.notes || orderData.notes,
          items: parseOrderItems(data.items).length > 0 ? parseOrderItems(data.items) : orderData.items,
          totalAmount: Number(data.total_amount),
          paymentMethod: orderData.paymentMethod || 'stripe',
          paymentStatus: orderData.paymentStatus || 'paid',
          stripePaymentIntentId: orderData.stripePaymentIntentId,
          createdAt: data.created_at,
        };
      }
      console.warn('Supabase insert order error, falling back to mock return:', error?.message);
    } catch (err) {
      console.error('Failed to create order in Supabase:', err);
    }
  }

  // Demo fallback response with full preparation details preserved
  return {
    id: `ord-${Date.now()}`,
    orderNumber,
    status: 'pending',
    customerName: orderData.customerName,
    email: orderData.email,
    phone: orderData.phone,
    pickupTime: orderData.pickupTime,
    notes: orderData.notes,
    items: orderData.items,
    totalAmount: orderData.totalAmount,
    paymentMethod: orderData.paymentMethod || 'stripe',
    paymentStatus: orderData.paymentStatus || 'paid',
    stripePaymentIntentId: orderData.stripePaymentIntentId,
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
      email: data.email,
      phone: data.phone,
      pickupTime: data.pickup_time,
      notes: data.notes,
      items: parseOrderItems(data.items),
      totalAmount: Number(data.total_amount),
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Error fetching order from Supabase:', err);
    return null;
  }
}

export async function getAllOrdersFromSupabase(): Promise<AdminOrder[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Error fetching all orders from Supabase:', error?.message);
      return [];
    }

    return data.map((item: any) => ({
      id: String(item.id),
      orderNumber: item.order_number,
      status: item.status || 'pending',
      customerName: item.customer_name,
      email: item.email,
      phone: item.phone,
      pickupTime: item.pickup_time,
      notes: item.notes,
      items: parseOrderItems(item.items),
      totalAmount: Number(item.total_amount),
      paymentMethod: item.payment_method || 'stripe',
      paymentStatus: item.payment_status || (item.notes?.includes('[PAID') ? 'paid' : 'pending'),
      stripePaymentIntentId: item.stripe_payment_id,
      createdAt: item.created_at,
    }));
  } catch (err) {
    console.error('Failed to fetch orders from Supabase:', err);
    return [];
  }
}

export async function updateOrderStatusInSupabase(
  orderIdOrNumber: string,
  newStatus: 'pending' | 'preparing' | 'ready' | 'completed'
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  // Bypass remote call for sample/local demo orders
  if (
    orderIdOrNumber.startsWith('sample-') ||
    orderIdOrNumber.startsWith('ord-')
  ) {
    return true;
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderIdOrNumber);
    const query = supabase.from('orders').update({ status: newStatus });

    const { error } = isUuid
      ? await query.eq('id', orderIdOrNumber)
      : await query.ilike('order_number', orderIdOrNumber);

    if (error) {
      console.warn('Supabase update order status error (check RLS UPDATE policy):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to update order status in Supabase:', err);
    return false;
  }
}


