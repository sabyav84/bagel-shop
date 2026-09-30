import { Bagel, Category, CreamCheese, OrderInput, OrderResponse } from '@/types/bagel';
import {
  FULL_MENU_CATEGORIES,
  MOCK_CREAM_CHEESES_EXPANDED,
  FULL_BAGELICIOUS_BAGELS_MENU,
} from './menuData';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

// Full Bagelicious Bagels menu data exports
export const MOCK_CATEGORIES: Category[] = FULL_MENU_CATEGORIES;
export const MOCK_CREAM_CHEESES: CreamCheese[] = MOCK_CREAM_CHEESES_EXPANDED;
export const MOCK_BAGELS: Bagel[] = FULL_BAGELICIOUS_BAGELS_MENU;

// Helper to fetch from Strapi REST API with fallback to mock data
export async function getBagelsFromStrapi(): Promise<Bagel[]> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/bagels?populate=*`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Strapi status: ${res.status}`);
    const data = await res.json();
    if (!data?.data || data.data.length === 0) return MOCK_BAGELS;

    return data.data.map((item: any) => {
      const attrs = item.attributes || item;
      return {
        id: item.id || attrs.documentId,
        name: attrs.name || attrs.title,
        slug: attrs.slug,
        description: attrs.description,
        price: Number(attrs.price),
        imageUrl: attrs.image?.data?.attributes?.url
          ? `${STRAPI_URL}${attrs.image.data.attributes.url}`
          : attrs.imageUrl || 'https://images.unsplash.com/photo-1585478259715-876a6a81fc08?w=800&q=80',
        category: attrs.category?.data?.attributes?.name || attrs.category || 'Bagels',
        inStock: attrs.inStock !== false,
        isPopular: Boolean(attrs.isPopular),
        calories: attrs.calories,
      };
    });
  } catch {
    console.info('Strapi CMS not detected at http://localhost:1337. Operating in mock data fallback mode.');
    return MOCK_BAGELS;
  }
}

export async function getCreamCheesesFromStrapi(): Promise<CreamCheese[]> {
  try {
    const res = await fetch(`${STRAPI_URL}/api/cream-cheeses?populate=*`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`Strapi status: ${res.status}`);
    const data = await res.json();
    if (!data?.data || data.data.length === 0) return MOCK_CREAM_CHEESES;

    return data.data.map((item: any) => {
      const attrs = item.attributes || item;
      return {
        id: item.id || attrs.documentId,
        name: attrs.name || attrs.title,
        slug: attrs.slug,
        description: attrs.description,
        price: Number(attrs.price),
        inStock: attrs.inStock !== false,
        imageUrl: attrs.image?.data?.attributes?.url
          ? `${STRAPI_URL}${attrs.image.data.attributes.url}`
          : attrs.imageUrl || 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80',
      };
    });
  } catch {
    console.info('Strapi CMS not detected at http://localhost:1337. Operating in mock data fallback mode.');
    return MOCK_CREAM_CHEESES;
  }
}

export async function createOrderInStrapi(orderData: OrderInput): Promise<OrderResponse> {
  const orderNumber = `BGL-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    const res = await fetch(`${STRAPI_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          orderNumber,
          customerName: orderData.customerName,
          email: orderData.email,
          phone: orderData.phone,
          pickupTime: orderData.pickupTime,
          notes: orderData.notes,
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          status: 'pending',
        },
      }),
    });

    if (!res.ok) {
      console.warn('Strapi order creation response not ok, creating mock order');
    } else {
      const result = await res.json();
      if (result?.data) {
        return {
          id: result.data.id,
          orderNumber,
          status: 'pending',
          customerName: orderData.customerName,
          totalAmount: orderData.totalAmount,
          createdAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Strapi REST order post fallback', err);
  }

  // Fallback return for smooth demo
  return {
    id: `ord-${Date.now()}`,
    orderNumber,
    status: 'pending',
    customerName: orderData.customerName,
    totalAmount: orderData.totalAmount,
    createdAt: new Date().toISOString(),
  };
}

// GraphQL Alternative Example Query
export const GRAPHQL_QUERIES = {
  GET_BAGELS: `
    query GetBagels {
      bagels {
        data {
          id
          attributes {
            name
            slug
            description
            price
            inStock
            isPopular
            category {
              data {
                attributes {
                  name
                }
              }
            }
          }
        }
      }
    }
  `,
  CREATE_ORDER: `
    mutation CreateOrder($data: OrderInput!) {
      createOrder(data: $data) {
        data {
          id
          attributes {
            orderNumber
            status
            totalAmount
          }
        }
      }
    }
  `
};
