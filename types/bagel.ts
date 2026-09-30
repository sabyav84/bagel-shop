export interface Category {
  id: number | string;
  documentId?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface CreamCheese {
  id: number | string;
  documentId?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  inStock: boolean;
  imageUrl: string;
}

export interface Bagel {
  id: number | string;
  documentId?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  isPopular?: boolean;
  calories?: number;
}

export interface CartItem {
  cartId: string;
  bagel: Bagel;
  breadOption?: string;
  creamCheese?: CreamCheese;
  quantity: number;
  toasted: 'not-toasted' | 'lightly-toasted' | 'well-done' | 'scooped';
  specialInstructions?: string;
}

export interface OrderInput {
  customerName: string;
  email: string;
  phone: string;
  pickupTime: string;
  notes?: string;
  items: {
    bagelName: string;
    breadOption?: string;
    creamCheeseName?: string;
    quantity: number;
    toasted: string;
    unitPrice: number;
  }[];
  totalAmount: number;
}

export interface OrderResponse {
  id: number | string;
  orderNumber: string;
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  customerName: string;
  totalAmount: number;
  createdAt: string;
}
