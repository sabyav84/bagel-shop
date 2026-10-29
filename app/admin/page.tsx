'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  AdminOrder,
  OrderResponse,
  OrderItemDetail,
} from '@/types/bagel';
import {
  getAllOrdersFromSupabase,
  updateOrderStatusInSupabase,
  isSupabaseConfigured,
  parseOrderItems,
} from '@/lib/supabase';
import {
  getAllOrdersFromStrapi,
  updateOrderStatusInStrapi,
} from '@/lib/strapi';
import {
  Utensils,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Volume2,
  VolumeX,
  Phone,
  Mail,
  DollarSign,
  ArrowLeft,
  Flame,
  Check,
  PackageCheck,
  CreditCard,
  Banknote,
  ShieldAlert,
  KeyRound,
  ExternalLink,
  ChefHat,
  Square,
  CheckSquare,
  Printer,
  Maximize2,
  FileText,
  Sparkles,
  X,
} from 'lucide-react';

// Sample mock orders for immediate showcase if database is empty or offline
const SAMPLE_ORDERS: AdminOrder[] = [
  {
    id: 'sample-1',
    orderNumber: 'BGL-782910',
    status: 'pending',
    customerName: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '(555) 234-8901',
    pickupTime: 'ASAP (10-15 mins)',
    notes: 'Please cut both bagels in half and include extra napkins. Allergy note: no nuts please.',
    items: [
      {
        bagelName: 'Everything Bagel',
        breadOption: 'Standard Sliced',
        creamCheeseName: 'Scallion Cream Cheese',
        quantity: 2,
        toasted: 'well-done',
        unitPrice: 4.75,
        specialInstructions: 'Extra crispy on the cut side, sliced in quarters',
      },
      {
        bagelName: 'Cinnamon Raisin Bagel',
        breadOption: 'Standard Sliced',
        creamCheeseName: 'Plain Cream Cheese',
        quantity: 1,
        toasted: 'lightly-toasted',
        unitPrice: 3.75,
        specialInstructions: 'Light schmear, easy on the cinnamon sugar',
      },
    ],
    totalAmount: 14.43,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    stripePaymentIntentId: 'pi_test_782910',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'sample-2',
    orderNumber: 'BGL-419082',
    status: 'preparing',
    customerName: 'Michael Chang',
    email: 'mchang@example.com',
    phone: '(555) 912-3456',
    pickupTime: 'In 30 Minutes',
    notes: 'No salt on the eggs if possible. Keep bagels separated in individual bags.',
    items: [
      {
        bagelName: 'Asiago Cheese Bagel',
        breadOption: 'Scooped Out',
        creamCheeseName: 'Jalapeño Cream Cheese',
        quantity: 1,
        toasted: 'well-done',
        unitPrice: 4.50,
        specialInstructions: 'Scoop out dough completely (low-carb), schmear generous',
      },
      {
        bagelName: 'Egg & Cheddar Sandwich',
        breadOption: 'Plain Bagel',
        creamCheeseName: '',
        quantity: 1,
        toasted: 'lightly-toasted',
        unitPrice: 7.25,
        specialInstructions: 'Egg over-medium, ketchup on the side',
      },
    ],
    totalAmount: 12.79,
    paymentMethod: 'counter',
    paymentStatus: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'sample-3',
    orderNumber: 'BGL-302814',
    status: 'ready',
    customerName: 'Emma Watson',
    email: 'emma.w@example.com',
    phone: '(555) 441-2093',
    pickupTime: 'ASAP (10-15 mins)',
    notes: 'Label bags clearly please.',
    items: [
      {
        bagelName: 'Plain Bagel',
        breadOption: 'Standard Sliced',
        creamCheeseName: 'Lox Spread',
        quantity: 2,
        toasted: 'not-toasted',
        unitPrice: 5.50,
        specialInstructions: 'Untoasted, fresh soft bagel with thick lox spread and capers',
      },
    ],
    totalAmount: 11.98,
    paymentMethod: 'stripe',
    paymentStatus: 'paid',
    stripePaymentIntentId: 'pi_test_302814',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

// Helper to clean technical tags from customer notes
function extractCleanNotes(notes?: string) {
  if (!notes) return '';
  return notes.replace(/\[PAID[^\]]*\]\s*/g, '').trim();
}

// Helper to render high-visibility kitchen toasting badges
function getToastingBadge(toasted?: string) {
  const t = (toasted || 'not-toasted').toLowerCase();
  if (t === 'well-done') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-950/90 border border-orange-500/60 text-orange-300">
        <Flame className="w-3 h-3 text-orange-400" /> Well Done (Crispy)
      </span>
    );
  }
  if (t === 'lightly-toasted') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-900/70 border border-amber-600/60 text-amber-300">
        ♨️ Lightly Toasted
      </span>
    );
  }
  if (t === 'scooped') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-950/90 border border-purple-500/60 text-purple-300">
        🥄 Scooped & Toasted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-stone-800/90 border border-stone-700 text-stone-300">
      ❄️ Not Toasted (Fresh/Soft)
    </span>
  );
}


// Helper to play a kitchen order chime using Web Audio API (zero audio assets required)
function playKitchenChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio context may be restricted by browser until first interaction
  }
}

export default function AdminDashboardPage() {
  // Passcode gate state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Orders and filtering
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCount = useRef<number>(0);

  // Kitchen interactive preparation checklist state: { [orderNumber]: { [itemIndex]: boolean } }
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});
  // Selected order for focused Kitchen Prep Ticket modal / print
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<AdminOrder | null>(null);

  const toggleItemCheck = (orderNumber: string, itemIdx: number) => {
    setCheckedItems((prev) => {
      const orderChecks = { ...(prev[orderNumber] || {}) };
      orderChecks[itemIdx] = !orderChecks[itemIdx];
      return { ...prev, [orderNumber]: orderChecks };
    });
  };

  const handlePrintSlip = (order: AdminOrder) => {
    setSelectedTicketOrder(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Check session passcode
  useEffect(() => {
    const auth = sessionStorage.getItem('bagel_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === '1234' || passcodeInput === 'admin' || passcodeInput === 'bagel123') {
      sessionStorage.setItem('bagel_admin_auth', 'true');
      setIsAuthenticated(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid passcode. Default is 1234');
    }
  };

  // Fetch orders from database (Supabase -> Strapi -> localStorage fallback)
  const loadOrders = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      let fetched: AdminOrder[] = [];

      if (isSupabaseConfigured()) {
        fetched = await getAllOrdersFromSupabase();
      } else {
        fetched = await getAllOrdersFromStrapi();
      }

      // Check localStorage for orders placed locally
      let localRecent: AdminOrder[] = [];
      try {
        const stored = localStorage.getItem('bagel_shop_recent_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            localRecent = parsed.map((item: any) => ({
              ...item,
              items: parseOrderItems(item.items),
            }));
          }
        }
      } catch {}

      // Combine orders ensuring no duplicates by orderNumber
      const combinedMap = new Map<string, AdminOrder>();

      // Put fetched orders first with parsed items
      fetched.forEach((o) => {
        combinedMap.set(o.orderNumber, {
          ...o,
          items: parseOrderItems(o.items),
        });
      });

      // Merge local orders if missing in remote or if remote order is missing prep items
      localRecent.forEach((localOrder) => {
        const parsedLocalItems = parseOrderItems(localOrder.items);
        const enrichedLocal: AdminOrder = {
          ...localOrder,
          items: parsedLocalItems,
        };

        const existing = combinedMap.get(localOrder.orderNumber);
        if (existing) {
          // If remote order has no items or empty items, restore from local!
          if ((!existing.items || existing.items.length === 0) && parsedLocalItems.length > 0) {
            existing.items = parsedLocalItems;
          }
          if (!existing.notes && localOrder.notes) existing.notes = localOrder.notes;
          if (!existing.phone && localOrder.phone) existing.phone = localOrder.phone;
          if (!existing.email && localOrder.email) existing.email = localOrder.email;
          if (!existing.pickupTime && localOrder.pickupTime) existing.pickupTime = localOrder.pickupTime;
        } else {
          combinedMap.set(localOrder.orderNumber, enrichedLocal);
        }
      });

      // If map is completely empty, populate with samples for demonstration
      if (combinedMap.size === 0) {
        SAMPLE_ORDERS.forEach((o) => combinedMap.set(o.orderNumber, o));
      }

      const allOrders = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Trigger audio chime if new pending orders appeared
      if (prevOrderCount.current > 0 && allOrders.length > prevOrderCount.current && soundEnabled) {
        playKitchenChime();
      }
      prevOrderCount.current = allOrders.length;

      setOrders(allOrders);
    } catch (err) {
      console.error('Failed to load orders for admin dashboard:', err);
      // Fallback to sample orders
      setOrders(SAMPLE_ORDERS);
    } finally {
      setIsLoading(false);
      if (isManual) setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      // Auto poll every 12 seconds
      const interval = setInterval(() => {
        loadOrders();
      }, 12000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, soundEnabled]);

  // Update status handler
  const handleStatusChange = async (
    order: AdminOrder,
    newStatus: 'pending' | 'preparing' | 'ready' | 'completed'
  ) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.orderNumber === order.orderNumber ? { ...o, status: newStatus } : o))
    );

    // Update in Supabase / Strapi
    try {
      if (isSupabaseConfigured()) {
        await updateOrderStatusInSupabase(order.id ? String(order.id) : order.orderNumber, newStatus);
      } else {
        await updateOrderStatusInStrapi(String(order.id), newStatus);
      }

      // Also sync localStorage
      try {
        const stored = localStorage.getItem('bagel_shop_recent_orders');
        if (stored) {
          const parsed: AdminOrder[] = JSON.parse(stored);
          const updated = parsed.map((o) =>
            o.orderNumber === order.orderNumber ? { ...o, status: newStatus } : o
          );
          localStorage.setItem('bagel_shop_recent_orders', JSON.stringify(updated));
        }
      } catch {}
    } catch (err) {
      console.error('Failed to update status on server:', err);
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        (order.phone && order.phone.includes(query)) ||
        (order.email && order.email.toLowerCase().includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [orders, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const preparing = orders.filter((o) => o.status === 'preparing').length;
    const ready = orders.filter((o) => o.status === 'ready').length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const revenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return { total, pending, preparing, ready, completed, revenue };
  }, [orders]);

  // PASSCODE LOCK SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-amber-950 text-amber-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl bg-amber-900/40 border border-amber-800/80 p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-900/80 border border-amber-700/80 flex items-center justify-center mx-auto text-amber-400 shadow-md">
            <KeyRound className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-amber-100">Kitchen & Staff Portal</h2>
            <p className="text-xs text-amber-300/80">Enter passcode to access live orders dashboard</p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter passcode (1234)"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                autoFocus
                className="w-full text-center px-4 py-3 rounded-xl bg-amber-950/80 border border-amber-800 text-amber-100 font-mono text-lg tracking-widest focus:outline-none focus:border-amber-400 placeholder:text-xs placeholder:tracking-normal placeholder:font-sans placeholder:text-amber-600"
              />
              {passcodeError && (
                <p className="mt-2 text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {passcodeError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-bold text-sm shadow-lg transition cursor-pointer"
            >
              Unlock Dashboard
            </button>
          </form>

          <div className="pt-2 border-t border-amber-800/50">
            <Link
              href="/"
              className="text-xs text-amber-400/80 hover:text-amber-300 flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // MAIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-stone-950 text-amber-50 font-sans flex flex-col selection:bg-amber-500 selection:text-amber-950">
      
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 bg-amber-950/95 border-b border-amber-800/60 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-900 border border-amber-800/60 text-xs text-amber-300 hover:text-amber-200 transition"
              title="Return to customer menu"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Storefront</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-900/80 border border-amber-700/80 flex items-center justify-center text-amber-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold font-serif text-amber-100 flex items-center gap-2">
                  Kitchen Order Manager
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700/60 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE SYNC
                  </span>
                </h1>
                <p className="text-[11px] text-amber-300/80">Bagelicious Bagels • Order Fulfillment Dashboard</p>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border transition cursor-pointer text-xs flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-amber-900/60 border-amber-700 text-amber-300'
                  : 'bg-stone-900 border-stone-800 text-stone-500'
              }`}
              title={soundEnabled ? 'Order sound alert ON' : 'Order sound alert OFF'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>

            <button
              onClick={() => loadOrders(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-300 flex items-center gap-1.5 text-xs transition cursor-pointer disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => {
                sessionStorage.removeItem('bagel_admin_auth');
                setIsAuthenticated(false);
              }}
              className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-semibold transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>

        </div>
      </header>

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        
        {/* KPI / Statistics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-amber-100">{stats.total}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Pending</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-yellow-400">{stats.pending}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>In The Oven</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-orange-400">{stats.preparing}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Ready for Pickup</span>
              <PackageCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-emerald-400">{stats.ready}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-stone-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-stone-300">{stats.completed}</div>
          </div>

          <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/50 space-y-1">
            <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center justify-between">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-serif text-amber-300">${stats.revenue.toFixed(2)}</div>
          </div>

        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-amber-950/60 border border-amber-800/60 overflow-x-auto text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-amber-800 text-amber-100 shadow-sm font-bold'
                  : 'text-amber-300/80 hover:text-amber-100'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                filterStatus === 'pending'
                  ? 'bg-yellow-600 text-amber-950 font-bold shadow-sm'
                  : 'text-yellow-400/80 hover:text-yellow-300'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('preparing')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                filterStatus === 'preparing'
                  ? 'bg-orange-600 text-amber-950 font-bold shadow-sm'
                  : 'text-orange-400/80 hover:text-orange-300'
              }`}
            >
              In Oven ({stats.preparing})
            </button>
            <button
              onClick={() => setFilterStatus('ready')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                filterStatus === 'ready'
                  ? 'bg-emerald-600 text-emerald-950 font-bold shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300'
              }`}
            >
              Ready ({stats.ready})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer ${
                filterStatus === 'completed'
                  ? 'bg-stone-700 text-stone-100 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-300'
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Search by order #, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-100 text-xs placeholder:text-amber-600 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
          </div>

        </div>

        {/* Order Cards Grid / List */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm text-amber-300/80 font-medium">Loading live kitchen orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center rounded-2xl bg-amber-900/10 border border-amber-800/40 space-y-3">
            <div className="w-14 h-14 rounded-full bg-amber-900/40 border border-amber-800 flex items-center justify-center mx-auto text-2xl">
              🥯
            </div>
            <p className="text-sm font-bold text-amber-200">No orders found</p>
            <p className="text-xs text-amber-400/60">
              {searchQuery ? 'Try clearing your search query filter.' : 'All caught up in the kitchen!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOrders.map((order) => {
              const isPaid = order.paymentStatus === 'paid' || order.notes?.includes('[PAID');
              const cleanNotes = extractCleanNotes(order.notes);
              const itemsList = order.items || [];
              const orderChecks = checkedItems[order.orderNumber] || {};
              const checkedCount = itemsList.filter((_, idx) => Boolean(orderChecks[idx])).length;
              const allItemsPrepared = itemsList.length > 0 && checkedCount === itemsList.length;

              return (
                <div
                  key={order.orderNumber}
                  className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all ${
                    order.status === 'pending'
                      ? 'bg-amber-950/85 border-yellow-600/70 shadow-yellow-950/20'
                      : order.status === 'preparing'
                      ? 'bg-amber-950/85 border-orange-600/70 shadow-orange-950/20'
                      : order.status === 'ready'
                      ? 'bg-amber-950/85 border-emerald-600/70 shadow-emerald-950/20'
                      : 'bg-stone-900/60 border-stone-800 opacity-75'
                  }`}
                >
                  <div className="space-y-3.5">
                    
                    {/* Card Header: Order Number, Actions, & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-amber-200">
                            #{order.orderNumber}
                          </span>
                          <button
                            onClick={() => setSelectedTicketOrder(order)}
                            title="Inspect Full Kitchen Prep Ticket"
                            className="p-1 rounded-md bg-amber-900/60 text-amber-300 hover:bg-amber-800 hover:text-amber-100 transition cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintSlip(order)}
                            title="Print Kitchen Slip"
                            className="p-1 rounded-md bg-amber-900/60 text-amber-300 hover:bg-amber-800 hover:text-amber-100 transition cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-amber-400/60">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {order.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-950 border border-yellow-600/60 text-yellow-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                        {order.status === 'preparing' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-950 border border-orange-600/60 text-orange-400 flex items-center gap-1 animate-pulse">
                            <Flame className="w-3.5 h-3.5" /> In Oven
                          </span>
                        )}
                        {order.status === 'ready' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950 border border-emerald-600/60 text-emerald-400 flex items-center gap-1">
                            <PackageCheck className="w-3.5 h-3.5" /> Ready
                          </span>
                        )}
                        {order.status === 'completed' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-800 border border-stone-700 text-stone-300 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer Info & Pickup Bar */}
                    <div className="p-3 rounded-xl bg-amber-900/30 border border-amber-800/60 text-xs space-y-1.5">
                      <div className="font-bold text-amber-100 text-sm flex items-center justify-between">
                        <span>{order.customerName}</span>
                        <span className="font-serif text-amber-300 font-bold">
                          ${order.totalAmount.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-amber-300/80 text-[11px]">
                        {order.phone && (
                          <a
                            href={`tel:${order.phone}`}
                            className="flex items-center gap-1 hover:text-amber-200 transition"
                          >
                            <Phone className="w-3 h-3 text-amber-400" />
                            {order.phone}
                          </a>
                        )}
                        {order.email && (
                          <span className="flex items-center gap-1 truncate max-w-[180px]">
                            <Mail className="w-3 h-3 text-amber-400" />
                            {order.email}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-amber-800/40 text-[11px]">
                        <span className="flex items-center gap-1 text-amber-300 font-bold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Pickup: {order.pickupTime || 'ASAP (10-15 mins)'}
                        </span>

                        {isPaid ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <CreditCard className="w-3 h-3" /> Paid (Stripe)
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-yellow-400 font-bold">
                            <Banknote className="w-3 h-3" /> Pay at Counter
                          </span>
                        )}
                      </div>
                    </div>

                    {/* KITCHEN PREPARATION TICKET */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                          <ChefHat className="w-4 h-4 text-amber-300" />
                          <span>Preparation Items ({itemsList.length})</span>
                        </span>
                        {itemsList.length > 0 && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            allItemsPrepared
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/60'
                              : 'text-amber-400/80'
                          }`}>
                            {checkedCount}/{itemsList.length} Prep Done
                          </span>
                        )}
                      </div>

                      {/* Items Cards List */}
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {itemsList.length > 0 ? (
                          itemsList.map((item, idx) => {
                            const isChecked = Boolean(orderChecks[idx]);

                            return (
                              <div
                                key={idx}
                                onClick={() => toggleItemCheck(order.orderNumber, idx)}
                                className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                  isChecked
                                    ? 'bg-emerald-950/40 border-emerald-600/60 opacity-85'
                                    : 'bg-amber-900/25 border-amber-800/60 hover:border-amber-600/70'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <div className="mt-0.5">
                                      {isChecked ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                                      ) : (
                                        <Square className="w-4 h-4 text-amber-400/60 shrink-0" />
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      {/* Quantity & Bagel Name */}
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`px-2 py-0.5 rounded text-xs font-black ${
                                          isChecked
                                            ? 'bg-emerald-600/30 text-emerald-300'
                                            : 'bg-amber-400 text-amber-950'
                                        }`}>
                                          {item.quantity}x
                                        </span>
                                        <span className={`font-bold text-sm ${
                                          isChecked ? 'text-emerald-200 line-through' : 'text-amber-100'
                                        }`}>
                                          {item.bagelName}
                                        </span>
                                      </div>

                                      {/* Toasting & Bread Option Badges */}
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        {getToastingBadge(item.toasted)}
                                        {item.breadOption && (
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-950 border border-amber-800 text-amber-200">
                                            🍞 {item.breadOption}
                                          </span>
                                        )}
                                      </div>

                                      {/* Cream Cheese / Spread */}
                                      {item.creamCheeseName ? (
                                        <div className="text-[11px] text-amber-200 font-medium flex items-center gap-1">
                                          <span className="text-amber-400">🧀 Schmear:</span>
                                          <span className="text-amber-100 font-bold underline decoration-amber-500/60">
                                            {item.creamCheeseName}
                                          </span>
                                        </div>
                                      ) : null}

                                      {/* Special Kitchen Prep Instructions */}
                                      {item.specialInstructions && (
                                        <div className="mt-1 p-1.5 rounded-lg bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 text-[11px] flex items-start gap-1.5">
                                          <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                                          <div>
                                            <span className="font-bold text-yellow-300">Prep Note: </span>
                                            <span>{item.specialInstructions}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <span className="text-amber-300/80 font-mono text-[11px] shrink-0">
                                    ${(item.unitPrice * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-800/40 text-center space-y-1">
                            <p className="text-xs text-amber-300 font-medium">Standard Counter Order</p>
                            <p className="text-[11px] text-amber-400/60 italic">Check customer receipt notes below</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Customer Packaging / Allergy Notes */}
                    {cleanNotes && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-[11px] text-amber-100 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Customer Prep & Packaging Instructions:</span>
                        </div>
                        <p className="italic pl-5 text-amber-200">{cleanNotes}</p>
                      </div>
                    )}

                  </div>

                  {/* Kitchen Action Button */}
                  <div className="pt-3 border-t border-amber-800/50 space-y-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusChange(order, 'preparing')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-amber-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Preparing (In Oven)</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusChange(order, 'ready')}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-emerald-950 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Mark Ready for Pickup</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusChange(order, 'completed')}
                        className="w-full py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Complete & Hand to Customer</span>
                      </button>
                    )}

                    {/* Quick Tools: Ticket View + Print + Manual Status Selector */}
                    <div className="flex items-center justify-between text-[11px] text-amber-400/80 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedTicketOrder(order)}
                          className="px-2 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-900 text-amber-200 flex items-center gap-1 transition"
                        >
                          <FileText className="w-3 h-3 text-amber-400" /> Ticket
                        </button>
                        <button
                          onClick={() => handlePrintSlip(order)}
                          className="px-2 py-1 rounded-lg bg-amber-900/50 hover:bg-amber-900 text-amber-200 flex items-center gap-1 transition"
                        >
                          <Printer className="w-3 h-3 text-amber-400" /> Print
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-amber-400/60">Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order,
                              e.target.value as 'pending' | 'preparing' | 'ready' | 'completed'
                            )
                          }
                          className="px-2 py-1 rounded-lg bg-amber-900/60 border border-amber-800 text-amber-200 text-[11px] focus:outline-none focus:border-amber-400"
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">In Oven</option>
                          <option value="ready">Ready</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* FULL-SCREEN / STATION KITCHEN PREP TICKET MODAL */}
      {selectedTicketOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedTicketOrder(null)}
        >
          <div
            className="relative w-full max-w-xl rounded-2xl bg-amber-950 border border-amber-800 p-6 shadow-2xl text-amber-50 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-amber-800/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-800 text-amber-300">
                    Kitchen Prep Slip
                  </span>
                  <span className="text-xs text-amber-400/60">
                    {new Date(selectedTicketOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <h2 className="text-2xl font-bold font-serif text-amber-100 mt-1">
                  Order #{selectedTicketOrder.orderNumber}
                </h2>
                <div className="text-xs text-amber-300 font-medium">
                  Customer: <strong className="text-amber-100 text-sm">{selectedTicketOrder.customerName}</strong>
                  {selectedTicketOrder.phone && ` • ${selectedTicketOrder.phone}`}
                </div>
              </div>

              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 flex items-center justify-center hover:bg-amber-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Timing & Payment Alert */}
            <div className="p-3 rounded-xl bg-amber-900/40 border border-amber-800/80 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-amber-200 font-bold">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Target Pickup: {selectedTicketOrder.pickupTime || 'ASAP (10-15 mins)'}</span>
              </span>
              <span className="font-bold text-amber-300">
                {selectedTicketOrder.paymentStatus === 'paid' ? '💳 Paid Online' : '💵 Pay at Counter'}
              </span>
            </div>

            {/* Preparation Items List */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ChefHat className="w-4 h-4 text-amber-300" />
                <span>Bagel Preparation Checklist ({selectedTicketOrder.items?.length || 0} items)</span>
              </div>

              <div className="space-y-2.5">
                {selectedTicketOrder.items && selectedTicketOrder.items.length > 0 ? (
                  selectedTicketOrder.items.map((item, idx) => {
                    const isChecked = Boolean(checkedItems[selectedTicketOrder.orderNumber]?.[idx]);

                    return (
                      <div
                        key={idx}
                        onClick={() => toggleItemCheck(selectedTicketOrder.orderNumber, idx)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200'
                            : 'bg-amber-900/30 border-amber-800/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-amber-400/60 shrink-0" />
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-sm font-black ${
                                  isChecked ? 'bg-emerald-600/30 text-emerald-300' : 'bg-amber-400 text-amber-950'
                                }`}>
                                  {item.quantity}x
                                </span>
                                <span className={`font-bold text-base ${isChecked ? 'line-through text-emerald-200' : 'text-amber-100'}`}>
                                  {item.bagelName}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {getToastingBadge(item.toasted)}
                                {item.breadOption && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950 border border-amber-800 text-amber-200">
                                    🍞 {item.breadOption}
                                  </span>
                                )}
                              </div>

                              {item.creamCheeseName && (
                                <div className="text-xs text-amber-200 font-medium flex items-center gap-1.5">
                                  <span className="text-amber-400 font-bold">🧀 Schmear:</span>
                                  <span className="underline decoration-amber-500 text-amber-100 font-bold">{item.creamCheeseName}</span>
                                </div>
                              )}

                              {item.specialInstructions && (
                                <div className="mt-1 p-2 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-xs flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                  <div>
                                    <strong className="text-yellow-300">Prep Note: </strong>
                                    <span>{item.specialInstructions}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="font-mono text-xs text-amber-300 font-bold">
                            ${(item.unitPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-amber-400/60 italic">No specific item details logged for this ticket.</p>
                )}
              </div>
            </div>

            {/* Customer Packaging Notes */}
            {extractCleanNotes(selectedTicketOrder.notes) && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-100 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Customer Prep & Packaging Instructions:</span>
                </div>
                <p className="italic pl-5.5 text-amber-200">
                  {extractCleanNotes(selectedTicketOrder.notes)}
                </p>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-800/60">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-amber-100 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print Kitchen Slip</span>
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedTicketOrder.status === 'pending' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTicketOrder, 'preparing');
                      setSelectedTicketOrder({ ...selectedTicketOrder, status: 'preparing' });
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 text-amber-950 font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" /> Start Preparing
                  </button>
                )}

                {selectedTicketOrder.status === 'preparing' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTicketOrder, 'ready');
                      setSelectedTicketOrder({ ...selectedTicketOrder, status: 'ready' });
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-emerald-950 font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <PackageCheck className="w-4 h-4" /> Mark Ready
                  </button>
                )}

                {selectedTicketOrder.status === 'ready' && (
                  <button
                    onClick={() => {
                      handleStatusChange(selectedTicketOrder, 'completed');
                      setSelectedTicketOrder({ ...selectedTicketOrder, status: 'completed' });
                    }}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-100 font-bold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Mark Completed
                  </button>
                )}

                <button
                  onClick={() => setSelectedTicketOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-amber-900/60 hover:bg-amber-800 text-amber-300 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
