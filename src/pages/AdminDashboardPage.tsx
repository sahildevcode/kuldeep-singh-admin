import React, { useState, useRef, useMemo } from 'react';
import {
  LayoutDashboard,
  Package,
  Palette,
  Radio,
  BarChart3,
  Truck,
  Search,
  HelpCircle,
  Mail,
  Bell,
  Plus,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  MapPin,
  Phone,
  ChevronRight,
  Upload,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  X,
  Eye,
  LogOut,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Trash2,
  Edit3
} from 'lucide-react';
import { useStudioData } from '../context/StudioDataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { Artwork, MediumType, OrderRecord } from '../types';

interface AdminDashboardPageProps {
  onBackToSite?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => {
  const {
    artworks,
    courses,
    addArtwork,
    updateArtwork,
    deleteArtwork,
    updateCourse
  } = useStudioData();

  const { adminLogout } = useAuth();
  const { orders, advanceOrderStep, deleteOrder, updateOrder, addOrder } = useCart();

  // Navigation State: 'dashboard' | 'orders' | 'artworks' | 'live-studio' | 'analytics'
  const [activeNav, setActiveNav] = useState<'dashboard' | 'orders' | 'artworks' | 'live-studio' | 'analytics'>('dashboard');

  const [cashFlowView, setCashFlowView] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);

  // Selected Order for Detail Modal
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderRecord | null>(null);

  // Edit Order Modal State
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<OrderRecord | null>(null);
  const [editOrderForm, setEditOrderForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCity: '',
    deliveryAddress: '',
    itemTitle: '',
    totalAmount: 0,
    currentStep: 1 as 1 | 2 | 3 | 4,
    trackingNumber: '',
    carrierName: '',
    notes: ''
  });

  // Record New Sale Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerCity: '',
    deliveryAddress: '',
    paintingTitle: '',
    paintingMedium: 'Oil on Canvas',
    totalAmount: 95000,
    currentStep: 4 as 1 | 2 | 3 | 4,
    orderDate: '08 Sep, 2026'
  });

  // Search & Filter for Orders table
  const [orderSearch, setOrderSearch] = useState('');
  const [stepFilter, setStepFilter] = useState<'all' | 1 | 2 | 3 | 4>('all');

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3800);
  };

  const openEditOrderModal = (e: React.MouseEvent | null, order: OrderRecord) => {
    if (e) e.stopPropagation();
    setOrderToEdit(order);
    setEditOrderForm({
      customerName: order.customerName || '',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      customerCity: order.customerCity || '',
      deliveryAddress: order.deliveryAddress || '',
      itemTitle: order.items[0]?.title || '',
      totalAmount: order.totalAmount || 0,
      currentStep: (order.currentStep || 1) as 1 | 2 | 3 | 4,
      trackingNumber: order.trackingNumber || '',
      carrierName: order.carrierName || 'BlueDart Express',
      notes: order.notes || ''
    });
    setIsEditOrderModalOpen(true);
  };

  const handleSaveOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderToEdit) return;

    const updatedItems = orderToEdit.items.map((it, idx) => {
      if (idx === 0) {
        return {
          ...it,
          title: editOrderForm.itemTitle || it.title,
          price: Number(editOrderForm.totalAmount) || it.price
        };
      }
      return it;
    });

    const stepStatuses: Record<number, OrderRecord['stepStatus']> = {
      1: 'placed',
      2: 'accepted',
      3: 'dispatched',
      4: 'delivered'
    };

    const updatedData: Partial<OrderRecord> = {
      customerName: editOrderForm.customerName,
      customerEmail: editOrderForm.customerEmail,
      customerPhone: editOrderForm.customerPhone,
      customerCity: editOrderForm.customerCity,
      deliveryAddress: editOrderForm.deliveryAddress,
      totalAmount: Number(editOrderForm.totalAmount),
      currentStep: editOrderForm.currentStep,
      stepStatus: stepStatuses[editOrderForm.currentStep] || 'placed',
      trackingNumber: editOrderForm.trackingNumber,
      carrierName: editOrderForm.carrierName,
      notes: editOrderForm.notes,
      items: updatedItems
    };

    updateOrder(orderToEdit.id, updatedData);

    if (selectedOrderForModal?.id === orderToEdit.id) {
      setSelectedOrderForModal((prev) =>
        prev
          ? {
              ...prev,
              ...updatedData
            }
          : null
      );
    }

    setIsEditOrderModalOpen(false);
    showToast(`Order #${orderToEdit.id} successfully updated!`);
  };

  const handleDeleteOrder = (e: React.MouseEvent | null, orderId: string) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete Order #${orderId}? This cannot be undone.`)) {
      deleteOrder(orderId);
      if (selectedOrderForModal?.id === orderId) {
        setSelectedOrderForModal(null);
      }
      showToast(`Order #${orderId} deleted.`);
    }
  };

  const handleClearAllDefaultOrders = () => {
    if (orders.length === 0) {
      showToast('No orders to delete.');
      return;
    }
    if (
      window.confirm(
        'Kya aap saare default / existing orders delete karna chahte hain taaki fresh start kar sakein?'
      )
    ) {
      orders.forEach((o) => deleteOrder(o.id));
      setSelectedOrderForModal(null);
      showToast('All orders cleared! Ab orders list bilkul fresh hai.');
    }
  };

  const handleCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'ORD_' + Math.floor(10000 + Math.random() * 90000);
    const now = new Date();
    const nowMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const stepStatuses: Record<number, OrderRecord['stepStatus']> = {
      1: 'placed',
      2: 'accepted',
      3: 'dispatched',
      4: 'delivered'
    };

    const newOrderRecord: OrderRecord = {
      id: newId,
      customerName: newOrderForm.customerName,
      customerEmail: newOrderForm.customerEmail || 'collector@kuldeepsingh.art',
      customerPhone: newOrderForm.customerPhone || '+91 98000 00000',
      customerCity: newOrderForm.customerCity || 'New Delhi',
      date: newOrderForm.orderDate || '08 Sep, 2026',
      orderTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderMonth: nowMonth,
      items: [
        {
          id: 'art-' + Date.now(),
          type: 'artwork',
          title: newOrderForm.paintingTitle,
          subtitle: `Original ${newOrderForm.paintingMedium}`,
          price: Number(newOrderForm.totalAmount),
          image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
          quantity: 1,
          mediumOrCategory: newOrderForm.paintingMedium
        }
      ],
      subtotal: Number(newOrderForm.totalAmount),
      discount: 0,
      shipping: 0,
      totalAmount: Number(newOrderForm.totalAmount),
      paymentMethod: 'Direct Payment / Wire',
      paymentStatus: 'Paid',
      orderStatus: newOrderForm.currentStep === 4 ? 'Delivered' : 'Order Placed',
      currentStep: newOrderForm.currentStep,
      stepStatus: stepStatuses[newOrderForm.currentStep] || 'placed',
      deliveryAddress: newOrderForm.deliveryAddress || 'Fine Art Insured Crated Handover',
      stepTimestamps: {
        placed: newOrderForm.orderDate
      }
    };

    addOrder(newOrderRecord);
    setIsNewOrderModalOpen(false);
    showToast(`New sale recorded: Order #${newId} for ₹${Number(newOrderForm.totalAmount).toLocaleString('en-IN')}!`);
  };

  // -------------------------------------------------------------
  // 1. DYNAMIC FINANCIAL ANALYTICS & SOLD ARTWORKS (100% LIVE)
  // -------------------------------------------------------------
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    let totalOutflow = 0;
    let activePipelineValue = 0;
    let activeOrdersCount = 0;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap: Record<string, { inflow: number; outflow: number; count: number; titles: string[] }> = {};
    monthNames.forEach((m) => {
      monthlyMap[m] = { inflow: 0, outflow: 0, count: 0, titles: [] };
    });

    orders.forEach((o) => {
      const amt = Number(o.totalAmount) || 0;
      totalRevenue += amt;

      const crating = o.shipping > 0 ? o.shipping : Math.round(amt * 0.05);
      totalOutflow += crating;

      if (o.currentStep < 4) {
        activePipelineValue += amt;
        activeOrdersCount += 1;
      }

      monthNames.forEach((mName, mIdx) => {
        const mNumStr = String(mIdx + 1).padStart(2, '0');
        const matchesName = o.date && o.date.toLowerCase().includes(mName.toLowerCase());
        const matchesNum = o.orderMonth && o.orderMonth.endsWith(`-${mNumStr}`);
        if (matchesName || matchesNum) {
          monthlyMap[mName].inflow += amt;
          monthlyMap[mName].outflow += crating;
          monthlyMap[mName].count += (o.items?.length || 1);
          (o.items || []).forEach((it) => {
            if (it.title && !monthlyMap[mName].titles.includes(it.title)) {
              monthlyMap[mName].titles.push(it.title);
            }
          });
        }
      });
    });

    const netProfit = totalRevenue - totalOutflow;

    const monthlyStats = monthNames.map((m) => ({
      month: m,
      inflow: monthlyMap[m].inflow,
      outflow: monthlyMap[m].outflow,
      count: monthlyMap[m].count,
      titles: monthlyMap[m].titles
    }));

    const maxInflow = Math.max(...monthlyStats.map((m) => m.inflow), 100000);

    const activeMonthWithSales = monthlyStats.slice().reverse().find((m) => m.inflow > 0);
    const latestMonthName = activeMonthWithSales ? activeMonthWithSales.month : 'Aug';
    const latestMonthRevenue = activeMonthWithSales ? activeMonthWithSales.inflow : 0;

    return {
      totalRevenue,
      totalOutflow,
      netProfit,
      activePipelineValue,
      activeOrdersCount,
      monthlyStats,
      maxInflow,
      latestMonthName,
      latestMonthRevenue
    };
  }, [orders]);

  // Extract all sold paintings directly from orders
  const soldArtworks = useMemo(() => {
    const list: Array<{
      orderId: string;
      itemKey: string;
      title: string;
      subtitle?: string;
      price: number;
      medium: string;
      image: string;
      date: string;
      collectorName: string;
      collectorCity?: string;
      currentStep: number;
      stepStatus: string;
    }> = [];

    orders.forEach((order) => {
      (order.items || []).forEach((item, idx) => {
        list.push({
          orderId: order.id,
          itemKey: `${order.id}-${item.id || idx}`,
          title: item.title,
          subtitle: item.subtitle,
          price: item.price || order.totalAmount,
          medium: item.mediumOrCategory || 'Fine Art Original',
          image: item.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
          date: order.date,
          collectorName: order.customerName,
          collectorCity: order.customerCity,
          currentStep: order.currentStep,
          stepStatus: order.stepStatus
        });
      });
    });

    return list;
  }, [orders]);

  const formatINR = (num: number) => {
    return '₹' + num.toLocaleString('en-IN');
  };

  // -------------------------------------------------------------
  // 2. ORDER STEP ADVANCEMENT HANDLER
  // -------------------------------------------------------------
  const handleAdvanceStep = (e: React.MouseEvent, order: OrderRecord) => {
    e.stopPropagation();
    advanceOrderStep(order.id);

    if (order.currentStep === 1) {
      showToast(`Order #${order.id} Accepted! Customer notified: "Order Proceeded & Packing Initiated"`);
    } else if (order.currentStep === 2) {
      showToast(`Order #${order.id} Dispatched! Customer notified: "Your package is out for delivery"`);
    } else if (order.currentStep === 3) {
      showToast(`Order #${order.id} marked as Delivered & Collected!`);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (stepFilter !== 'all' && o.currentStep !== stepFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchId = o.id.toLowerCase().includes(q);
        const matchCity = (o.customerCity || '').toLowerCase().includes(q);
        const matchItem = o.items.some((i) => i.title.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchCity && !matchItem) return false;
      }
      return true;
    });
  }, [orders, stepFilter, orderSearch]);

  // -------------------------------------------------------------
  // 3. PAINTING UPLOAD / EDIT MODAL STATE
  // -------------------------------------------------------------
  const [isPaintingModalOpen, setIsPaintingModalOpen] = useState(false);
  const [editingArtworkId, setEditingArtworkId] = useState<string | null>(null);
  const [uploadSourceMode, setUploadSourceMode] = useState<'pc' | 'pdf' | 'url'>('pc');

  const [artworkForm, setArtworkForm] = useState({
    title: '',
    subtitle: '',
    medium: 'Oil on Canvas' as MediumType,
    dimensions: '36 x 48 in (91 x 122 cm)',
    price: 280000,
    year: 2026,
    image: '',
    fileType: 'image' as 'image' | 'pdf',
    fileName: '',
    fileSize: '',
    pdfUrl: '',
    description: '',
    story: '',
    status: 'available' as 'available' | 'sold',
    framed: true,
    featured: true
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const openNewPaintingModal = () => {
    setEditingArtworkId(null);
    setUploadSourceMode('pc');
    setArtworkForm({
      title: '',
      subtitle: 'Original Fine Art Masterpiece',
      medium: 'Oil on Canvas',
      dimensions: '36 x 48 in (91 x 122 cm)',
      price: 280000,
      year: 2026,
      image: '',
      fileType: 'image',
      fileName: '',
      fileSize: '',
      pdfUrl: '',
      description: 'Handcrafted master oil painting infused with classical chiaroscuro and raw contemporary soul.',
      story: 'Created by Artist Kuldeep Singh over a 4-month studio residency, layering multiple transparent glazes.',
      status: 'available',
      framed: true,
      featured: true
    });
    setIsPaintingModalOpen(true);
  };

  const handlePcFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArtworkForm((prev) => ({
        ...prev,
        image: dataUrl,
        fileType: 'image',
        fileName: file.name,
        fileSize: sizeFormatted
      }));
      showToast(`Selected image "${file.name}" loaded from PC!`);
    };

    reader.readAsDataURL(file);
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setArtworkForm((prev) => ({
        ...prev,
        pdfUrl: dataUrl,
        image: prev.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop',
        fileType: 'pdf',
        fileName: file.name,
        fileSize: sizeFormatted
      }));
      showToast(`PDF Document "${file.name}" loaded!`);
    };

    reader.readAsDataURL(file);
  };

  const handleSavePainting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artworkForm.title) {
      alert('Please enter a title for the painting.');
      return;
    }
    if (!artworkForm.image && !artworkForm.pdfUrl) {
      alert('Please choose an image file from PC, PDF, or enter a URL.');
      return;
    }

    const fallbackImage = artworkForm.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop';

    if (editingArtworkId) {
      updateArtwork(editingArtworkId, {
        title: artworkForm.title,
        subtitle: artworkForm.subtitle,
        medium: artworkForm.medium,
        dimensions: artworkForm.dimensions,
        price: Number(artworkForm.price),
        year: Number(artworkForm.year),
        image: fallbackImage,
        fileType: artworkForm.fileType,
        fileName: artworkForm.fileName,
        fileSize: artworkForm.fileSize,
        pdfUrl: artworkForm.pdfUrl,
        description: artworkForm.description,
        story: artworkForm.story,
        status: artworkForm.status,
        framed: artworkForm.framed,
        featured: artworkForm.featured
      });
      showToast(`Artwork "${artworkForm.title}" updated!`);
    } else {
      const newArt: Artwork = {
        id: 'art-' + Date.now(),
        title: artworkForm.title,
        subtitle: artworkForm.subtitle,
        medium: artworkForm.medium,
        dimensions: artworkForm.dimensions,
        price: Number(artworkForm.price),
        year: Number(artworkForm.year),
        image: fallbackImage,
        fileType: artworkForm.fileType,
        fileName: artworkForm.fileName,
        fileSize: artworkForm.fileSize,
        pdfUrl: artworkForm.pdfUrl,
        description: artworkForm.description,
        story: artworkForm.story,
        status: artworkForm.status,
        framed: artworkForm.framed,
        featured: artworkForm.featured,
        paletteColors: ['#C5A059', '#1A1816', '#0E2A47', '#D97706'],
        weight: '12 lbs',
        varnishType: 'Archival Dammar Satin'
      };
      addArtwork(newArt);
      showToast(`New artwork "${newArt.title}" published to Collection!`);
    }
    setIsPaintingModalOpen(false);
  };

  // -------------------------------------------------------------
  // 4. LIVE STUDIO BROADCAST STATE
  // -------------------------------------------------------------
  const liveTargetCourse = courses[0];
  const [liveStreamUrl, setLiveStreamUrl] = useState<string>(
    liveTargetCourse?.liveClassUrl || 'https://meet.google.com/ks-studio-atelier'
  );
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(
    liveTargetCourse?.liveClassStatus === 'live'
  );

  const handleToggleBroadcast = () => {
    const willBeLive = !isLiveBroadcasting;
    setIsLiveBroadcasting(willBeLive);
    if (liveTargetCourse) {
      updateCourse(liveTargetCourse.id, {
        liveClassStatus: willBeLive ? 'live' : 'offline',
        liveClassUrl: liveStreamUrl
      });
    }
    showToast(
      willBeLive
        ? '🔴 Live Studio Broadcast is ON AIR! Google Meet link live.'
        : 'Live Studio broadcast ended.'
    );
  };

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E1E4EA] font-sans flex antialiased selection:bg-[#FF5722] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161A22] border border-[#FF5722] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in ring-4 ring-[#FF5722]/10">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toast}</span>
          <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* LEFT SIDEBAR (Matching Reference UI)                      */}
      {/* ========================================================= */}
      <aside className="w-64 bg-[#111318] border-r border-[#1B1F27] flex flex-col justify-between shrink-0 select-none min-h-screen">
        <div>
          {/* Brand Header */}
          <div className="px-5 py-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5722] via-[#FF7A45] to-[#FFA07A] flex items-center justify-center text-white shadow-lg shadow-[#FF5722]/20 ring-2 ring-[#FF5722]/30">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-[0.14em] text-white uppercase">
                  Kuldeep
                </span>
                <span className="font-light text-sm tracking-[0.14em] text-[#FF5722] uppercase">
                  Singh
                </span>
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-gray-500 font-bold mt-0.5">
                Fine Art Atelier
              </div>
            </div>
          </div>

          {/* Search Box in Sidebar */}
          <div className="px-4 mb-5">
            <div className="relative flex items-center bg-[#181B22] border border-[#232732] rounded-xl px-3 py-2 text-xs text-gray-400 focus-within:border-[#FF5722] transition-colors">
              <Search className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search"
                className="bg-transparent text-white placeholder-gray-500 text-xs w-full focus:outline-none"
              />
              <span className="text-[10px] font-mono bg-[#232732] text-gray-400 px-1.5 py-0.5 rounded border border-gray-700/50">
                ⌘K
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 text-xs">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-[#161920]'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeNav === 'dashboard' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                <span>Dashboard</span>
              </div>
              {activeNav === 'dashboard' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5722]"></span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'orders'
                  ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-[#161920]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className={`w-4 h-4 ${activeNav === 'orders' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                <span>Live Orders</span>
              </div>
              <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('artworks')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'artworks'
                  ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-[#161920]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Palette className={`w-4 h-4 ${activeNav === 'artworks' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                <span>Artworks Catalog</span>
              </div>
              <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {artworks.length}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('live-studio')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'live-studio'
                  ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-[#161920]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${isLiveBroadcasting ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
                <span>Live Studio Demo</span>
              </div>
              {isLiveBroadcasting && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeNav === 'analytics'
                  ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                  : 'text-gray-400 hover:text-white hover:bg-[#161920]'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-4 h-4 ${activeNav === 'analytics' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                <span>Sales Analytics</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Bottom Pro Card (Matching Screenshot) */}
        <div className="p-4">
          <div className="bg-[#181C24] border border-[#242A36] rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
              <span>Artist Studio Pro</span>
              <span className="text-amber-400">👑</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              12 Years Fine Art Master Edition • All Systems Active
            </p>
            <button
              onClick={openNewPaintingModal}
              className="w-full py-2 bg-gradient-to-r from-[#FF5722] to-[#E63946] hover:opacity-95 text-white rounded-xl text-xs font-semibold shadow-md shadow-[#FF5722]/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Painting</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA                                         */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 px-6 border-b border-[#1B1F27] bg-[#0E1015]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="hover:text-white cursor-pointer">Artist Studio</span>
            <span>&gt;</span>
            <span className="text-white font-medium capitalize">
              {activeNav === 'dashboard' ? 'Dashboard' : activeNav.replace('-', ' ')}
            </span>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-xl bg-[#181B22] hover:bg-[#202530] border border-[#242A36] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
              <HelpCircle className="w-4 h-4" />
            </button>

            <button className="w-8 h-8 rounded-xl bg-[#181B22] hover:bg-[#202530] border border-[#242A36] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
              <Mail className="w-4 h-4" />
            </button>

            <button className="relative w-8 h-8 rounded-xl bg-[#181B22] hover:bg-[#202530] border border-[#242A36] flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF5722] rounded-full"></span>
            </button>

            {/* Kuldeep Singh Avatar with Green Dot */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-800">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
                  alt="Artist Kuldeep Singh"
                  className="w-8 h-8 rounded-xl object-cover ring-1 ring-gray-700"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0C0E12]"></span>
              </div>
            </div>

            {/* Primary Orange Upload Action Button (Matching Screenshot) */}
            <button
              onClick={openNewPaintingModal}
              className="ml-2 bg-gradient-to-r from-[#FF5722] to-[#FF6E40] hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-[#FF5722]/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Artwork</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={adminLogout}
              className="p-2 text-gray-500 hover:text-red-400 transition-colors cursor-pointer ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="p-6 sm:p-8 space-y-8 max-w-7xl">
          {(activeNav === 'dashboard' || activeNav === 'orders' || activeNav === 'analytics') && (
            <div className="space-y-8">
              {/* ===================================================== */}
              {/* OVERVIEW SECTION & 3 HERO CARDS                       */}
              {/* ===================================================== */}
              <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold font-serif text-white tracking-tight">
                  Overview
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Here is the summary of overall studio data & collector acquisitions
                </p>
              </div>

              {/* Right Filter Pills */}
              <div className="flex items-center gap-2 text-xs">
                <div className="bg-[#181B22] border border-[#242A36] rounded-xl px-3 py-1.5 text-gray-300 flex items-center gap-2 cursor-pointer hover:border-gray-600 transition-colors">
                  <span>This Month</span>
                  <span className="text-gray-500 text-[10px]">▼</span>
                </div>
                <button
                  onClick={() => showToast('Studio data synchronized with cloud ledger.')}
                  className="bg-[#181B22] hover:bg-[#202530] border border-[#242A36] rounded-xl px-3 py-1.5 text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Data</span>
                </button>
              </div>
            </div>

            {/* 3 Top Cards (100% Live from Orders) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Vibrant Orange-Coral Gradient Card */}
              <div className="bg-gradient-to-br from-[#FF5722] via-[#FF6A3D] to-[#E63946] rounded-3xl p-6 text-white shadow-xl shadow-[#FF5722]/20 relative overflow-hidden flex flex-col justify-between group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-black/20 backdrop-blur-md flex items-center justify-center">
                      <Palette className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Total Studio Sales</div>
                      <div className="text-[11px] text-white/80">Collector Acquisitions & Booking</div>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-0.5">
                    {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold tracking-tight font-serif">
                      {formatINR(analytics.totalRevenue)}
                    </span>
                    <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      {soldArtworks.length} Sold <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs font-medium">
                  <span className="text-white/90">Net Profit: {formatINR(analytics.netProfit)}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Dark Glass Card (Recent Inflow / Monthly Sales) */}
              <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between hover:border-gray-700 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1C202B] border border-[#282F3E] flex items-center justify-center text-gray-300">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{analytics.latestMonthName} Sales Inflow</div>
                      <div className="text-[11px] text-gray-400">Recorded Monthly Realization</div>
                    </div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Live
                  </span>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold tracking-tight font-serif text-white">
                      {formatINR(analytics.latestMonthRevenue)}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      {soldArtworks.length > 0 ? '+100%' : '₹0'} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-white">
                  <span>Outflow: {formatINR(analytics.totalOutflow)}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Dark Glass Card (Active Orders Pipeline) */}
              <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between hover:border-gray-700 transition-colors group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#1C202B] border border-[#282F3E] flex items-center justify-center text-gray-300">
                      <Truck className="w-5 h-5 text-[#FF5722]" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">Active Order Pipeline</div>
                      <div className="text-[11px] text-gray-400">{analytics.activeOrdersCount} In-Flight Shipments</div>
                    </div>
                  </div>
                </div>

                <div className="my-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold tracking-tight font-serif text-white">
                      {formatINR(analytics.activePipelineValue)}
                    </span>
                    {analytics.activeOrdersCount === 0 ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        All Fulfilled ✓
                      </span>
                    ) : (
                      <span className="bg-[#FF5722]/10 text-[#FF5722] border border-[#FF5722]/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        {analytics.activeOrdersCount} Pending <ArrowUpRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs font-medium text-gray-400 group-hover:text-white">
                  <span>{analytics.activeOrdersCount === 0 ? 'Zero pending deliveries' : 'Courier in transit'}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* MIDDLE ROW: SOLD COLLECTION PORTFOLIO & CASH FLOW     */}
          {/* ===================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Box: Sold Collection Portfolio (100% Live from Orders) */}
            <div className="lg:col-span-5 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Collection Portfolio</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                        Live Sold
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsNewOrderModalOpen(true)}
                    className="text-xs bg-[#FF5722] hover:bg-[#e64a19] text-white px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#FF5722]/20"
                    title="Record a newly sold painting"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Sale</span>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  Only paintings actually sold & their realized amounts
                </p>

                {/* Sold Artworks Grid */}
                {soldArtworks.length === 0 ? (
                  <div className="bg-[#181C24] border border-[#242A36] rounded-2xl p-6 text-center space-y-2.5">
                    <Palette className="w-8 h-8 text-gray-600 mx-auto" />
                    <div className="font-bold text-sm text-white">No Paintings Sold Yet</div>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Jaise hi koi painting order hogi ya sale record karenge, wo yahan live dikhegi.
                    </p>
                    <button
                      onClick={() => setIsNewOrderModalOpen(true)}
                      className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-white px-3.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record First Sale</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {soldArtworks.map((art) => (
                      <div
                        key={art.itemKey}
                        className="bg-[#181C24] border border-[#242A36] hover:border-gray-700 rounded-2xl p-3.5 transition-colors flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start gap-2.5 mb-2">
                            <img
                              src={art.image}
                              alt={art.title}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-700 shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-white truncate" title={art.title}>
                                {art.title}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">
                                {art.medium}
                              </div>
                            </div>
                          </div>

                          <div className="font-bold text-lg font-serif text-[#FF5722] tracking-tight">
                            {formatINR(art.price)}
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-gray-400 truncate max-w-[110px]" title={art.collectorName}>
                            {art.collectorName}
                          </span>
                          <span className="text-emerald-400 font-semibold shrink-0">
                            {art.currentStep === 4 ? '✓ Delivered' : 'In Transit'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Note */}
              <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span>Total Realized Value</span>
                <span className="font-bold text-white font-serif text-sm">
                  {formatINR(analytics.totalRevenue)} ({soldArtworks.length} {soldArtworks.length === 1 ? 'Painting' : 'Paintings'} Sold)
                </span>
              </div>
            </div>

            {/* Right Box: Cash Flow Chart (Matching Screenshot + 100% Live) */}
            <div className="lg:col-span-7 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
                    <span>Cash Flow & Sales Trend</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                      Live
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-3 mt-1">
                    <div className="text-2xl font-bold font-serif text-white">
                      {formatINR(analytics.totalRevenue)}
                    </div>
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <span>Inflow: {formatINR(analytics.totalRevenue)}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      • Outflow: {formatINR(analytics.totalOutflow)}
                    </div>
                  </div>
                </div>

                {/* Monthly / Yearly Toggle */}
                <div className="flex items-center bg-[#181C24] border border-[#242A36] p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setCashFlowView('monthly')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      cashFlowView === 'monthly' ? 'bg-[#252C3A] text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setCashFlowView('yearly')}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                      cashFlowView === 'yearly' ? 'bg-[#FF5722] text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              {/* Sleek Bar Chart (100% Live from orders) */}
              <div className="relative pt-8 pb-2">
                {/* Active Tooltip showing active or hovered month data */}
                {(() => {
                  const targetMonthName = selectedChartMonth || analytics.latestMonthName;
                  const targetData = analytics.monthlyStats.find((m) => m.month === targetMonthName) || analytics.monthlyStats[7];
                  const targetIdx = analytics.monthlyStats.findIndex((m) => m.month === targetMonthName);
                  const leftPercent = Math.min(86, Math.max(14, ((targetIdx + 0.5) / 12) * 100));

                  return (
                    <div
                      style={{ left: `${leftPercent}%` }}
                      className="hidden sm:flex absolute -top-1 -translate-x-1/2 bg-[#1C202B] border border-[#2B3342] px-3 py-2 rounded-xl shadow-2xl flex-col text-[10px] text-gray-300 z-10 min-w-[130px] pointer-events-none transition-all"
                    >
                      <span className="text-gray-400 font-medium">{targetMonthName} 2026</span>
                      <span className="font-bold text-white text-xs">{formatINR(targetData.inflow)}</span>
                      {targetData.inflow > 0 ? (
                        <>
                          <span className="text-emerald-400 font-semibold">
                            +{targetData.count} Masterwork{targetData.count > 1 ? 's' : ''} Sold
                          </span>
                          {targetData.titles.length > 0 && (
                            <span className="text-[9px] text-gray-400 truncate max-w-[150px]">
                              {targetData.titles.join(', ')}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-500">₹0 Inflow</span>
                      )}
                    </div>
                  );
                })()}

                <div className="h-44 flex items-end justify-between gap-2 px-2 border-b border-gray-800 pb-2">
                  {analytics.monthlyStats.map((mStat) => {
                    const hasSales = mStat.inflow > 0;
                    const isSelected = (selectedChartMonth || analytics.latestMonthName) === mStat.month;
                    const barHeight = hasSales
                      ? Math.max(36, Math.round((mStat.inflow / analytics.maxInflow) * 135))
                      : 8;

                    return (
                      <div
                        key={mStat.month}
                        onMouseEnter={() => setSelectedChartMonth(mStat.month)}
                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                      >
                        <div
                          style={{ height: `${barHeight}px` }}
                          className={`w-full rounded-xl transition-all duration-300 relative ${
                            hasSales
                              ? 'bg-gradient-to-t from-[#FF5722] via-[#FF6E40] to-white shadow-lg shadow-[#FF5722]/30 group-hover:opacity-90 ring-1 ring-[#FF5722]/40'
                              : isSelected
                              ? 'bg-[#2A3142]'
                              : 'bg-[#1F2430] hover:bg-[#2A3142]'
                          }`}
                        >
                          {hasSales && (
                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium transition-colors ${
                            hasSales
                              ? 'text-[#FF5722] font-bold'
                              : isSelected
                              ? 'text-white'
                              : 'text-gray-500 group-hover:text-gray-300'
                          }`}
                        >
                          {mStat.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================== */}
          {/* BOTTOM SECTION: 4-STEP LIVE ORDER TRACKING PIPELINE   */}
          {/* ===================================================== */}
          <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-800">
              <div>
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <span>Recent Activities & Live Orders</span>
                  <span className="text-xs bg-[#FF5722]/20 text-[#FF5722] font-semibold px-2 py-0.5 rounded-full">
                    4-Step Live Tracking
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Track orders step-by-step: Placed ➔ Accepted ➔ Out for Delivery ➔ Delivered
                </p>
              </div>

              {/* Search & Filter Bar (Matching Screenshot) */}
              <div className="flex items-center gap-3">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search collector, city, item..."
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                <div className="flex items-center bg-[#181C24] border border-[#242A36] p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setStepFilter('all')}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      stepFilter === 'all' ? 'bg-[#252C3A] text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStepFilter(1)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      stepFilter === 1 ? 'bg-[#FF5722] text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Step 1 (New)
                  </button>
                  <button
                    onClick={() => setStepFilter(2)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      stepFilter === 2 ? 'bg-amber-500 text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Step 2 (Packing)
                  </button>
                  <button
                    onClick={() => setStepFilter(3)}
                    className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                      stepFilter === 3 ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Step 3 (Dispatched)
                  </button>
                </div>

                {orders.length > 0 && (
                  <button
                    onClick={handleClearAllDefaultOrders}
                    className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Delete all sample orders"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Orders</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table (Matching Screenshot Aesthetic) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-800 pb-2">
                  <tr>
                    <th className="py-3 px-3">Collector & City</th>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Artwork Item</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Live 4-Step Pipeline</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 font-sans">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">
                        No orders found in this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const item = order.items[0];

                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrderForModal(order)}
                          className="hover:bg-[#181C24] transition-colors cursor-pointer group"
                        >
                          {/* Collector Name & Location */}
                          <td className="py-4 px-3">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{order.customerName}</span>
                            </div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-[#FF5722] shrink-0" />
                              <span className="font-medium text-gray-300">{order.customerCity || 'India'}</span>
                            </div>
                          </td>

                          {/* Order ID */}
                          <td className="py-4 px-3 font-mono font-bold text-gray-300 text-xs">
                            {order.id}
                          </td>

                          {/* Date & Time */}
                          <td className="py-4 px-3 text-gray-400 text-xs">
                            <div>{order.date}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{order.orderTime || '03:30 PM'}</div>
                          </td>

                          {/* Artwork Item */}
                          <td className="py-4 px-3">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={item?.image}
                                alt={item?.title}
                                className="w-9 h-9 rounded-xl object-cover border border-gray-700 shrink-0"
                              />
                              <div className="max-w-[180px]">
                                <div className="font-medium text-white truncate text-xs" title={item?.title}>
                                  {item?.title}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {item?.mediumOrCategory || 'Fine Art'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="py-4 px-3 font-bold font-serif text-sm text-white">
                            {formatINR(order.totalAmount)}
                          </td>

                          {/* Visual 4-Step Progress Indicator */}
                          <td className="py-4 px-3">
                            <div className="space-y-1.5 min-w-[220px]">
                              {/* Stepper Dots & Bar */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4].map((stepNum) => {
                                  const isDone = order.currentStep >= stepNum;
                                  const isCurrent = order.currentStep === stepNum;

                                  return (
                                    <React.Fragment key={stepNum}>
                                      <div
                                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                          isCurrent
                                            ? 'bg-[#FF5722] text-white ring-2 ring-[#FF5722]/40 scale-110'
                                            : isDone
                                            ? 'bg-emerald-500 text-black'
                                            : 'bg-gray-800 text-gray-500'
                                        }`}
                                      >
                                        {isDone && !isCurrent ? '✓' : stepNum}
                                      </div>
                                      {stepNum < 4 && (
                                        <div
                                          className={`flex-1 h-1 rounded-full ${
                                            order.currentStep > stepNum ? 'bg-emerald-500' : 'bg-gray-800'
                                          }`}
                                        ></div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>

                              {/* Label Description */}
                              <div className="text-[10px] font-medium flex items-center justify-between">
                                <span
                                  className={
                                    order.currentStep === 1
                                      ? 'text-amber-400 font-bold'
                                      : order.currentStep === 2
                                      ? 'text-blue-400 font-bold'
                                      : order.currentStep === 3
                                      ? 'text-[#FF5722] font-bold'
                                      : 'text-emerald-400 font-bold'
                                  }
                                >
                                  {order.currentStep === 1 && 'Step 1: Order Placed (Waiting Accept)'}
                                  {order.currentStep === 2 && 'Step 2: Order Accepted & Packing'}
                                  {order.currentStep === 3 && 'Step 3: Out for Delivery'}
                                  {order.currentStep === 4 && 'Step 4: Delivered & Collected ✓'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Action Buttons: One-Click Progression + Edit + Delete */}
                          <td className="py-4 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {order.currentStep === 1 && (
                                <button
                                  onClick={(e) => handleAdvanceStep(e, order)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                  title="Accept this order and start packing"
                                >
                                  Accept Order
                                </button>
                              )}

                              {order.currentStep === 2 && (
                                <button
                                  onClick={(e) => handleAdvanceStep(e, order)}
                                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1 cursor-pointer"
                                  title="Dispatch package for delivery"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>Dispatch</span>
                                </button>
                              )}

                              {order.currentStep === 3 && (
                                <button
                                  onClick={(e) => handleAdvanceStep(e, order)}
                                  className="px-3.5 py-1.5 bg-[#FF5722] hover:bg-[#e64a19] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5722]/20 cursor-pointer"
                                  title="Mark as delivered"
                                >
                                  Mark Delivered
                                </button>
                              )}

                              {order.currentStep === 4 && (
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Completed</span>
                                </span>
                              )}

                              {/* Edit Order button */}
                              <button
                                onClick={(e) => openEditOrderModal(e, order)}
                                className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-gray-700/50"
                                title="Edit Order Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Order button */}
                              <button
                                onClick={(e) => handleDeleteOrder(e, order.id)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-xl transition-colors cursor-pointer border border-red-900/40"
                                title="Delete Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* ARTWORKS CATALOG VIEW (When activeNav === 'artworks') */}
      {/* ===================================================== */}
      {activeNav === 'artworks' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
            <div>
              <h2 className="text-xl font-bold font-serif text-white">Artworks Catalog & Gallery</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage original fine art paintings, availability & pricing</p>
            </div>
            <button
              onClick={openNewPaintingModal}
              className="bg-gradient-to-r from-[#FF5722] to-[#FF6E40] hover:opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5722]/30 flex items-center gap-2 cursor-pointer w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Painting / PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artworks.map((art) => {
              const isSold = art.status === 'sold';

              return (
                <div
                  key={art.id}
                  className="bg-[#14171E] border border-[#202530] rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-gray-700 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-black overflow-hidden">
                    <img
                      src={art.image}
                      alt={art.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-lg backdrop-blur-md border ${
                          isSold
                            ? 'bg-red-950/80 text-red-300 border-red-500/40'
                            : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {isSold ? 'Private Collection (Sold)' : 'Available for Acquisition'}
                      </span>
                    </div>

                    {art.fileType === 'pdf' && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow">
                        <FileText className="w-3 h-3" />
                        <span>PDF Doc</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#FF5722] font-semibold mb-1">
                        {art.medium} • {art.year}
                      </div>
                      <h3 className="font-serif font-bold text-base text-white line-clamp-1">
                        {art.title}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">{art.dimensions}</p>
                      <div className="mt-3 text-lg font-bold font-serif text-white">
                        {formatINR(art.price)}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const newStatus = isSold ? 'available' : 'sold';
                          updateArtwork(art.id, { status: newStatus });
                          showToast(newStatus === 'sold' ? `"${art.title}" marked as Sold!` : `"${art.title}" is now Available!`);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          isSold
                            ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                            : 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border-red-500/30'
                        }`}
                      >
                        {isSold ? 'Make Available' : 'Make Sold'}
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Delete artwork "${art.title}"?`)) {
                            deleteArtwork(art.id);
                            showToast(`Artwork "${art.title}" deleted.`);
                          }
                        }}
                        className="p-2 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                        title="Delete Painting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* LIVE STUDIO DEMO VIEW (When activeNav === 'live-studio')  */}
      {/* ========================================================= */}
      {activeNav === 'live-studio' && (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <Radio className={`w-6 h-6 ${isLiveBroadcasting ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif text-white">
                  Live Studio & Google Meet Masterclass
                </h2>
                <p className="text-xs text-gray-400">
                  Broadcast live easel sessions directly to enrolled students.
                </p>
              </div>
            </div>

            <div
              className={`p-5 rounded-2xl border mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isLiveBroadcasting
                  ? 'bg-red-950/20 border-red-500/40 text-red-200'
                  : 'bg-gray-800/40 border-gray-700/60 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative">
                  {isLiveBroadcasting && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      isLiveBroadcasting ? 'bg-red-500' : 'bg-gray-500'
                    }`}
                  ></span>
                </span>
                <div>
                  <div className="font-bold text-sm">
                    {isLiveBroadcasting ? '🔴 BROADCAST IS ON AIR' : 'Studio is Currently Offline'}
                  </div>
                  <div className="text-xs opacity-80">
                    {isLiveBroadcasting
                      ? 'Students can now click "Join Live Easel Stream" on their portal.'
                      : 'Students see: "Next Live Workshop Scheduled Soon".'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleToggleBroadcast}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg cursor-pointer ${
                  isLiveBroadcasting
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                    : 'bg-[#FF5722] hover:bg-[#e64a19] text-white shadow-[#FF5722]/30'
                }`}
              >
                {isLiveBroadcasting ? 'End Broadcast' : 'Start Live Broadcast'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Google Meet / Live Workshop Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={liveStreamUrl}
                    onChange={(e) => setLiveStreamUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-3 pl-4 pr-32 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                  />
                  <a
                    href={liveStreamUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>Open Meet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Paste your Google Meet room code or link above. Students enrolled in your courses can enter directly.
                </p>
              </div>

              <div className="p-4 bg-[#181C24] rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF5722]" />
                  <span>How Kuldeep's Live Studio Works:</span>
                </div>
                <p>1. Open Google Meet on your laptop or phone camera.</p>
                <p>2. Paste your Google Meet invite link in the box above.</p>
                <p>3. Click <strong>"Start Live Broadcast"</strong>.</p>
                <p>4. All enrolled students will immediately see a pulsating red "Join Live Easel Stream" notification on their site!</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  </div>

      {/* ========================================================= */}
      {/* MODAL 1: ORDER DETAIL & 4-STEP TIMELINE                   */}
      {/* ========================================================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white font-serif">
                    Order #{selectedOrderForModal.id}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Placed on {selectedOrderForModal.date} at {selectedOrderForModal.orderTime || '07:45 PM'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Collector Information */}
            <div className="bg-[#181C24] border border-[#242A36] rounded-2xl p-4 space-y-2 text-xs">
              <div className="font-bold text-white text-sm">
                {selectedOrderForModal.customerName}
              </div>
              <div className="text-gray-300 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{selectedOrderForModal.customerEmail}</span>
              </div>
              <div className="text-gray-300 flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-500" />
                <span>{selectedOrderForModal.customerPhone || '+91 98210 44521'}</span>
              </div>
              <div className="text-gray-300 flex items-center gap-2 pt-1 border-t border-gray-800">
                <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
                <span>{selectedOrderForModal.deliveryAddress || 'Fine Art Insured Crating'}</span>
              </div>
            </div>

            {/* 4-Step Interactive Lifecycle */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Order Lifecycle Progression
              </div>

              <div className="space-y-2">
                {/* Step 1 */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedOrderForModal.currentStep >= 1
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-gray-800/30 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
                      1
                    </span>
                    <div>
                      <div className="font-bold">Step 1: Order Placed</div>
                      <div className="text-[10px] text-gray-400">
                        {selectedOrderForModal.stepTimestamps?.placed || selectedOrderForModal.date}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold">✓ Logged</span>
                </div>

                {/* Step 2 */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedOrderForModal.currentStep >= 2
                      ? 'bg-blue-950/20 border-blue-500/40 text-blue-300'
                      : 'bg-gray-800/30 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center font-bold text-blue-400">
                      2
                    </span>
                    <div>
                      <div className="font-bold">Step 2: Order Accepted & Packing</div>
                      <div className="text-[10px] text-gray-400">
                        {selectedOrderForModal.stepTimestamps?.accepted || 'Waiting for studio owner accept'}
                      </div>
                    </div>
                  </div>
                  {selectedOrderForModal.currentStep >= 2 ? (
                    <span className="text-[10px] font-bold">✓ Proceeded</span>
                  ) : (
                    <button
                      onClick={() => {
                        advanceOrderStep(selectedOrderForModal.id);
                        setSelectedOrderForModal({
                          ...selectedOrderForModal,
                          currentStep: 2,
                          stepStatus: 'accepted'
                        });
                        showToast(`Order #${selectedOrderForModal.id} Accepted!`);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px]"
                    >
                      Accept Now
                    </button>
                  )}
                </div>

                {/* Step 3 */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedOrderForModal.currentStep >= 3
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : 'bg-gray-800/30 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
                      3
                    </span>
                    <div>
                      <div className="font-bold">Step 3: Out for Delivery (Dispatched)</div>
                      <div className="text-[10px] text-gray-400">
                        {selectedOrderForModal.stepTimestamps?.dispatched || 'Courier dispatch in progress'}
                      </div>
                    </div>
                  </div>
                  {selectedOrderForModal.currentStep >= 3 ? (
                    <span className="text-[10px] font-bold">✓ In Transit</span>
                  ) : selectedOrderForModal.currentStep === 2 ? (
                    <button
                      onClick={() => {
                        advanceOrderStep(selectedOrderForModal.id);
                        setSelectedOrderForModal({
                          ...selectedOrderForModal,
                          currentStep: 3,
                          stepStatus: 'dispatched'
                        });
                        showToast(`Order #${selectedOrderForModal.id} Dispatched!`);
                      }}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[10px]"
                    >
                      Dispatch Now
                    </button>
                  ) : (
                    <span className="text-[10px]">Pending Step 2</span>
                  )}
                </div>

                {/* Step 4 */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                    selectedOrderForModal.currentStep >= 4
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-gray-800/30 border-gray-800 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-400">
                      4
                    </span>
                    <div>
                      <div className="font-bold">Step 4: Delivered & Collected</div>
                      <div className="text-[10px] text-gray-400">
                        {selectedOrderForModal.stepTimestamps?.delivered || 'Awaiting delivery confirmation'}
                      </div>
                    </div>
                  </div>
                  {selectedOrderForModal.currentStep === 4 ? (
                    <span className="text-[10px] font-bold">✓ Delivered</span>
                  ) : selectedOrderForModal.currentStep === 3 ? (
                    <button
                      onClick={() => {
                        advanceOrderStep(selectedOrderForModal.id);
                        setSelectedOrderForModal({
                          ...selectedOrderForModal,
                          currentStep: 4,
                          stepStatus: 'delivered'
                        });
                        showToast(`Order #${selectedOrderForModal.id} Delivered!`);
                      }}
                      className="px-2.5 py-1 bg-[#FF5722] text-white rounded-lg font-bold text-[10px]"
                    >
                      Confirm Delivered
                    </button>
                  ) : (
                    <span className="text-[10px]">Pending Step 3</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    openEditOrderModal(e, selectedOrderForModal);
                  }}
                  className="px-3.5 py-2 bg-[#252C3A] hover:bg-gray-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors border border-gray-700"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FF5722]" />
                  <span>Edit Order</span>
                </button>
                <button
                  onClick={(e) => {
                    handleDeleteOrder(e, selectedOrderForModal.id);
                  }}
                  className="px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Order</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT ORDER DETAILS                                 */}
      {/* ========================================================= */}
      {isEditOrderModalOpen && orderToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    Edit Order #{orderToEdit.id}
                  </h3>
                  <p className="text-xs text-gray-400">Modify collector information, pricing or tracking pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditOrderModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Customer Name */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Collector / Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editOrderForm.customerName}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, customerName: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="Full Name"
                  />
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Phone Number</label>
                  <input
                    type="text"
                    value={editOrderForm.customerPhone}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, customerPhone: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Customer Email */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Email Address</label>
                  <input
                    type="email"
                    value={editOrderForm.customerEmail}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, customerEmail: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="email@domain.com"
                  />
                </div>

                {/* Customer City */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">City</label>
                  <input
                    type="text"
                    value={editOrderForm.customerCity}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, customerCity: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. Mumbai, Delhi, Jaipur"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Full Delivery Address</label>
                <textarea
                  rows={2}
                  value={editOrderForm.deliveryAddress}
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, deliveryAddress: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  placeholder="Street address, apartment, pincode..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Artwork Title */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Artwork Title / Item</label>
                  <input
                    type="text"
                    required
                    value={editOrderForm.itemTitle}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, itemTitle: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="Painting Title"
                  />
                </div>

                {/* Total Price INR */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Total Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editOrderForm.totalAmount}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, totalAmount: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="Amount in ₹"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Order Step */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Pipeline Step</label>
                  <select
                    value={editOrderForm.currentStep}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, currentStep: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value={1}>Step 1: Placed</option>
                    <option value={2}>Step 2: Accepted & Packing</option>
                    <option value={3}>Step 3: Out for Delivery</option>
                    <option value={4}>Step 4: Delivered</option>
                  </select>
                </div>

                {/* Courier / Carrier */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Carrier / Courier</label>
                  <input
                    type="text"
                    value={editOrderForm.carrierName}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, carrierName: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. BlueDart Express"
                  />
                </div>

                {/* Tracking Number */}
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Tracking AWB #</label>
                  <input
                    type="text"
                    value={editOrderForm.trackingNumber}
                    onChange={(e) => setEditOrderForm({ ...editOrderForm, trackingNumber: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. BD-984210"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Internal Studio Notes</label>
                <input
                  type="text"
                  value={editOrderForm.notes}
                  onChange={(e) => setEditOrderForm({ ...editOrderForm, notes: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  placeholder="e.g. Insured wooden crate packaging requested"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={(e) => handleDeleteOrder(e, orderToEdit.id)}
                  className="px-4 py-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/40 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Order</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditOrderModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF6E40] hover:opacity-95 text-white rounded-xl font-bold shadow-lg shadow-[#FF5722]/30 cursor-pointer transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECORD NEW SALE / ORDER                            */}
      {/* ========================================================= */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    Record New Painting Sale
                  </h3>
                  <p className="text-xs text-gray-400">Live updates Collection Portfolio & Cash Flow ledger</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-semibold">Painting Title / Artwork</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.paintingTitle}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, paintingTitle: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  placeholder="e.g. Symphony of the Solitary Tide"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Medium / Category</label>
                  <select
                    value={newOrderForm.paintingMedium}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, paintingMedium: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="Oil on Canvas">Oil on Canvas</option>
                    <option value="Charcoal & Graphite">Charcoal & Graphite</option>
                    <option value="24K Gold Leaf">24K Gold Leaf</option>
                    <option value="Limited Edition Print">Limited Edition Print</option>
                    <option value="Mixed Media">Mixed Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Sale Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.totalAmount}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmount: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="95000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Collector / Buyer Name</label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.customerName}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="Collector Full Name"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">City / Location</label>
                  <input
                    type="text"
                    value={newOrderForm.customerCity}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerCity: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. Mumbai, New Delhi"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Order Pipeline Status</label>
                  <select
                    value={newOrderForm.currentStep}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, currentStep: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value={1}>Step 1: Order Placed</option>
                    <option value={2}>Step 2: Accepted & Packing</option>
                    <option value={3}>Step 3: Out for Delivery</option>
                    <option value={4}>Step 4: Delivered & Collected ✓</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 font-semibold">Sale Date</label>
                  <input
                    type="text"
                    value={newOrderForm.orderDate}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, orderDate: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. 08 Sep, 2026"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF6E40] hover:opacity-95 text-white rounded-xl font-bold shadow-lg shadow-[#FF5722]/30 cursor-pointer transition-all"
                >
                  Save & Record Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: UPLOAD / EDIT PAINTING (PC File / PDF / URL)     */}
      {/* ========================================================= */}
      {isPaintingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/10 border border-[#FF5722]/30 flex items-center justify-center text-[#FF5722]">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    {editingArtworkId ? 'Edit Artwork' : 'Upload New Painting / PDF'}
                  </h3>
                  <p className="text-xs text-gray-400">Direct PC File, Document or Cloudflare Link</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaintingModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePainting} className="space-y-6">
              {/* File Source Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Choose Upload Method
                </label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0C0E12] rounded-2xl border border-gray-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('pc')}
                    className={`py-2.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      uploadSourceMode === 'pc'
                        ? 'bg-[#FF5722] text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('pdf')}
                    className={`py-2.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      uploadSourceMode === 'pdf'
                        ? 'bg-[#FF5722] text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('url')}
                    className={`py-2.5 px-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      uploadSourceMode === 'url'
                        ? 'bg-[#FF5722] text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Web Image URL</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Upload from PC */}
              {uploadSourceMode === 'pc' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/avif"
                    onChange={handlePcFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#242A36] hover:border-[#FF5722] rounded-2xl p-8 text-center cursor-pointer bg-[#0C0E12] hover:bg-[#10131A] transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#181C24] text-[#FF5722] mx-auto flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Choose painting photo from your PC
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, WEBP, AVIF (Reads instantly from local disk)
                    </p>
                  </div>

                  {artworkForm.image && artworkForm.image.startsWith('data:') && (
                    <div className="flex items-center gap-3 p-3 bg-[#0C0E12] border border-[#242A36] rounded-xl">
                      <img
                        src={artworkForm.image}
                        alt="Preview"
                        className="w-12 h-12 rounded-lg object-cover border border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {artworkForm.fileName || 'Selected Image File'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {artworkForm.fileSize || 'Local File Ready'}
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">
                        Ready to Publish
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Upload PDF */}
              {uploadSourceMode === 'pdf' && (
                <div className="space-y-3">
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => pdfInputRef.current?.click()}
                    className="border-2 border-dashed border-[#242A36] hover:border-amber-500 rounded-2xl p-8 text-center cursor-pointer bg-[#0C0E12] hover:bg-[#10131A] transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Choose artwork PDF from your PC
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Certificate of Authenticity, Artwork Catalog or High-Res PDF
                    </p>
                  </div>

                  {artworkForm.pdfUrl && (
                    <div className="flex items-center gap-3 p-3 bg-[#0C0E12] border border-[#242A36] rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {artworkForm.fileName || 'Artwork Document.pdf'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {artworkForm.fileSize || 'PDF Attached'}
                        </div>
                      </div>
                      <a
                        href={artworkForm.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Web Image URL */}
              {uploadSourceMode === 'url' && (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Image URL (Cloudflare / Bunny / Unsplash)
                  </label>
                  <input
                    type="url"
                    value={artworkForm.image}
                    onChange={(e) => setArtworkForm({ ...artworkForm, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
              )}

              {/* Details Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Artwork Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={artworkForm.title}
                    onChange={(e) => setArtworkForm({ ...artworkForm, title: e.target.value })}
                    placeholder="e.g., Symphony of the Solitary Tide"
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={artworkForm.price}
                    onChange={(e) => setArtworkForm({ ...artworkForm, price: Number(e.target.value) })}
                    placeholder="280000"
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
              </div>

              {/* Medium & Dimensions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Medium
                  </label>
                  <select
                    value={artworkForm.medium}
                    onChange={(e) => setArtworkForm({ ...artworkForm, medium: e.target.value as MediumType })}
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="Oil on Canvas">Oil on Canvas</option>
                    <option value="Charcoal & Graphite">Charcoal & Graphite</option>
                    <option value="Watercolor & Ink">Watercolor & Ink</option>
                    <option value="Acrylic & Mixed Media">Acrylic & Mixed Media</option>
                    <option value="Limited Edition Print">Limited Edition Print</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Dimensions
                  </label>
                  <input
                    type="text"
                    value={artworkForm.dimensions}
                    onChange={(e) => setArtworkForm({ ...artworkForm, dimensions: e.target.value })}
                    placeholder="36 x 48 in"
                    className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
              </div>

              {/* Status Toggle: Make Sold as Private Collection */}
              <div className="p-4 bg-[#0C0E12] border border-gray-800 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Make Sold as Private Collection</span>
                    {artworkForm.status === 'sold' && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono">
                        SOLD
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    When checked, collectors see "Acquired / Private Collection" instead of Add to Cart.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={artworkForm.status === 'sold'}
                    onChange={(e) => setArtworkForm({
                      ...artworkForm,
                      status: e.target.checked ? 'sold' : 'available'
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF5722]"></div>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsPaintingModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF6E40] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF5722]/30 cursor-pointer"
                >
                  Publish to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
