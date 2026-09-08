import React, { useState, useRef, useMemo } from 'react';
import {
  Palette,
  Radio,
  Plus,
  Trash2,
  Edit3,
  X,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  TrendingUp,
  Calendar,
  FileText,
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  MapPin,
  Mail,
  Phone,
  Truck,
  Package,
  Eye,
  ExternalLink,
  Ban,
  ShieldCheck,
  Sparkles,
  LogOut
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
    updateCourse,
  } = useStudioData();

  const { adminLogout } = useAuth();
  const { orders, cancelOrder, updateOrderStatus, updatePaymentStatus } = useCart();

  // Primary Tab: 'paintings' (Paintings, Sales & Order Tracker) | 'live-demo' (Live Studio & Google Meet)
  const [activeTab, setActiveTab] = useState<'paintings' | 'live-demo'>('paintings');
  const [paintingsSubView, setPaintingsSubView] = useState<'orders' | 'gallery'>('orders');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // -------------------------------------------------------------
  // 1. MONTHLY SALES ANALYTICS ENGINE
  // -------------------------------------------------------------
  const salesAnalytics = useMemo(() => {
    // Current month identifier: 2026-09
    const thisMonthId = '2026-09';
    // Last month identifier: 2026-08
    const lastMonthId = '2026-08';

    let totalLifetimeRevenue = 0;
    let thisMonthRevenue = 0;
    let thisMonthOrdersCount = 0;
    let lastMonthRevenue = 0;
    let lastMonthOrdersCount = 0;
    let paidOrdersCount = 0;
    let pendingOrdersCount = 0;
    let cancelledOrdersCount = 0;

    orders.forEach((order) => {
      const isPaid = order.paymentStatus === 'Paid';
      const isCancelled = order.orderStatus === 'Cancelled' || order.paymentStatus === 'Refunded' || order.paymentStatus === 'Failed';
      const isPending = order.paymentStatus === 'Pending Payment' || order.paymentStatus === 'Processing';

      if (isCancelled) {
        cancelledOrdersCount += 1;
      } else if (isPaid) {
        paidOrdersCount += 1;
        totalLifetimeRevenue += order.totalAmount;

        // Check month
        if (order.orderMonth === thisMonthId || order.date.toLowerCase().includes('sep')) {
          thisMonthRevenue += order.totalAmount;
          thisMonthOrdersCount += 1;
        } else if (order.orderMonth === lastMonthId || order.date.toLowerCase().includes('aug')) {
          lastMonthRevenue += order.totalAmount;
          lastMonthOrdersCount += 1;
        }
      } else if (isPending) {
        pendingOrdersCount += 1;
      }
    });

    const revenueGrowthPercent = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 100;

    return {
      totalLifetimeRevenue,
      thisMonthRevenue,
      thisMonthOrdersCount,
      lastMonthRevenue,
      lastMonthOrdersCount,
      revenueGrowthPercent,
      paidOrdersCount,
      pendingOrdersCount,
      cancelledOrdersCount,
      totalOrdersCount: orders.length
    };
  }, [orders]);

  const formatINR = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN');
  };

  // -------------------------------------------------------------
  // 2. LIVE ORDER TRACKER FILTERS & ACTIONS
  // -------------------------------------------------------------
  const [orderMonthFilter, setOrderMonthFilter] = useState<'all' | 'this_month' | 'last_month'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');

  const [orderToCancel, setOrderToCancel] = useState<OrderRecord | null>(null);
  const [cancellationReasonInput, setCancellationReasonInput] = useState('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Month Filter
      if (orderMonthFilter === 'this_month') {
        const isThis = order.orderMonth === '2026-09' || order.date.toLowerCase().includes('sep');
        if (!isThis) return false;
      } else if (orderMonthFilter === 'last_month') {
        const isLast = order.orderMonth === '2026-08' || order.date.toLowerCase().includes('aug');
        if (!isLast) return false;
      }

      // Status Filter
      if (orderStatusFilter !== 'all') {
        if (orderStatusFilter === 'Paid' && order.paymentStatus !== 'Paid') return false;
        if (orderStatusFilter === 'Pending' && order.paymentStatus !== 'Pending Payment' && order.paymentStatus !== 'Processing') return false;
        if (orderStatusFilter === 'Cancelled' && order.orderStatus !== 'Cancelled') return false;
        if (orderStatusFilter === 'In Transit' && order.orderStatus !== 'In Transit') return false;
        if (orderStatusFilter === 'Delivered' && order.orderStatus !== 'Delivered') return false;
      }

      // Search Query
      if (orderSearchQuery.trim()) {
        const query = orderSearchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(query);
        const matchesCustomer = order.customerName.toLowerCase().includes(query);
        const matchesEmail = order.customerEmail.toLowerCase().includes(query);
        const matchesItem = order.items.some((i) => i.title.toLowerCase().includes(query));
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesItem) return false;
      }

      return true;
    });
  }, [orders, orderMonthFilter, orderStatusFilter, orderSearchQuery]);

  const handleConfirmCancelOrder = () => {
    if (!orderToCancel) return;
    const reason = cancellationReasonInput.trim() || 'Cancelled by Studio Owner';
    cancelOrder(orderToCancel.id, reason);
    showToast(`Order #${orderToCancel.id} has been cancelled in real-time. Status updated.`);
    setOrderToCancel(null);
    setCancellationReasonInput('');
  };

  // -------------------------------------------------------------
  // 3. PAINTINGS UPLOAD & MANAGEMENT (PC Upload / PDF / URL)
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

  const openEditPaintingModal = (art: Artwork) => {
    setEditingArtworkId(art.id);
    setUploadSourceMode(art.fileType === 'pdf' ? 'pdf' : art.image.startsWith('data:') ? 'pc' : 'url');
    setArtworkForm({
      title: art.title,
      subtitle: art.subtitle,
      medium: art.medium,
      dimensions: art.dimensions,
      price: art.price,
      year: art.year,
      image: art.image,
      fileType: art.fileType || 'image',
      fileName: art.fileName || '',
      fileSize: art.fileSize || '',
      pdfUrl: art.pdfUrl || '',
      description: art.description,
      story: art.story,
      status: art.status === 'sold' ? 'sold' : 'available',
      framed: art.framed,
      featured: Boolean(art.featured)
    });
    setIsPaintingModalOpen(true);
  };

  // Handle direct file upload from PC
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

  // Handle PDF upload
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
        // If image is empty, assign artistic document fallback preview
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
      alert('Please upload an image from your PC, select a PDF, or provide an image link.');
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
      showToast(`Artwork "${artworkForm.title}" updated successfully!`);
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
      showToast(`New artwork "${newArt.title}" published!`);
    }
    setIsPaintingModalOpen(false);
  };

  const handleToggleSoldStatus = (art: Artwork) => {
    const newStatus = art.status === 'sold' ? 'available' : 'sold';
    updateArtwork(art.id, { status: newStatus });
    showToast(
      newStatus === 'sold'
        ? `"${art.title}" marked as Private Collection (Sold)!`
        : `"${art.title}" is now Available for Acquisition!`
    );
  };

  // -------------------------------------------------------------
  // 4. LIVE STUDIO & GOOGLE MEET DEMO
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
        ? '🔴 Live Studio Broadcast is ON AIR! Google Meet link active.'
        : 'Live Studio broadcast ended.'
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F3F4F6] pb-24 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F2937] border-2 border-[#E63946] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header / Tab Switcher */}
      <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E63946] to-amber-600 flex items-center justify-center text-white shadow-lg ring-2 ring-[#E63946]/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg text-white tracking-wide">
                  Artist Kuldeep Singh
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Admin Active
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Direct Management: Paintings, Monthly Sales & Live Google Meet Studio
              </p>
            </div>
          </div>

          {/* 2 Primary Navigation Tabs */}
          <div className="flex items-center bg-[#1E293B] p-1.5 rounded-2xl border border-gray-700/60 shadow-inner">
            <button
              onClick={() => setActiveTab('paintings')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'paintings'
                  ? 'bg-gradient-to-r from-[#E63946] to-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>🎨 Paintings & Sales Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('live-demo')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'live-demo'
                  ? 'bg-gradient-to-r from-[#E63946] to-red-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Radio className={`w-4 h-4 ${isLiveBroadcasting ? 'text-red-400 animate-pulse' : ''}`} />
              <span>🔴 Live Studio / Demo</span>
              {isLiveBroadcasting && (
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
              )}
            </button>

            <button
              onClick={adminLogout}
              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 transition-colors ml-1 cursor-pointer"
              title="Sign Out of Studio Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ========================================================= */}
        {/* SECTION 1: PAINTINGS & SALES OPERATIONS                   */}
        {/* ========================================================= */}
        {activeTab === 'paintings' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Sales */}
              <div className="bg-[#131D33] border border-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                  <span>Total Sales Revenue</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  {formatINR(salesAnalytics.totalLifetimeRevenue)}
                </div>
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{salesAnalytics.paidOrdersCount} Paid Orders Lifetime</span>
                </div>
              </div>

              {/* Card 2: This Month Sales */}
              <div className="bg-[#131D33] border border-emerald-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden ring-1 ring-emerald-500/20">
                <div className="flex items-center justify-between text-xs text-emerald-300 mb-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    This Month (Sep 2026)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Current
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-white">
                  {formatINR(salesAnalytics.thisMonthRevenue)}
                </div>
                <div className="mt-2 text-xs text-gray-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>{salesAnalytics.thisMonthOrdersCount}</strong> Active Painting Orders</span>
                </div>
              </div>

              {/* Card 3: Last Month Sales */}
              <div className="bg-[#131D33] border border-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Last Month (Aug 2026)
                  </span>
                  <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                    Previous
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-serif text-gray-200">
                  {formatINR(salesAnalytics.lastMonthRevenue)}
                </div>
                <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{salesAnalytics.revenueGrowthPercent}% MoM Growth</span>
                </div>
              </div>

              {/* Card 4: Orders Health */}
              <div className="bg-[#131D33] border border-gray-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2 font-medium">
                  <span>Pending & Cancelled</span>
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-3">
                  <div className="text-xl sm:text-2xl font-bold text-amber-400">
                    {salesAnalytics.pendingOrdersCount} <span className="text-xs text-gray-400 font-normal">Pending</span>
                  </div>
                  <div className="text-sm text-red-400">
                    • {salesAnalytics.cancelledOrdersCount} Cancelled
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  Total Orders Logged: {salesAnalytics.totalOrdersCount}
                </div>
              </div>
            </div>

            {/* Sub-view Switcher & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#111827] border border-gray-800 p-4 rounded-3xl">
              <div className="flex items-center gap-2 bg-[#0B0F19] p-1.5 rounded-2xl border border-gray-800 w-full sm:w-auto">
                <button
                  onClick={() => setPaintingsSubView('orders')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paintingsSubView === 'orders'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Live Orders & Sales Tracker</span>
                  <span className="bg-black/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setPaintingsSubView('gallery')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    paintingsSubView === 'gallery'
                      ? 'bg-[#E63946] text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Paintings Gallery & Catalog</span>
                  <span className="bg-black/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {artworks.length}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={openNewPaintingModal}
                  className="w-full sm:w-auto bg-[#E63946] hover:bg-[#c92a37] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-[#E63946]/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload New Painting / PDF</span>
                </button>
              </div>
            </div>

            {/* ===================================================== */}
            {/* SUB-VIEW 1: LIVE ORDERS TRACKER                       */}
            {/* ===================================================== */}
            {paintingsSubView === 'orders' && (
              <div className="bg-[#131D33] border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-gray-800">
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Time Filter */}
                    <div className="flex items-center bg-[#0B0F19] rounded-xl border border-gray-700/80 p-1 text-xs">
                      <button
                        onClick={() => setOrderMonthFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          orderMonthFilter === 'all' ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        All Time
                      </button>
                      <button
                        onClick={() => setOrderMonthFilter('this_month')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                          orderMonthFilter === 'this_month' ? 'bg-emerald-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>This Month (Sep)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      </button>
                      <button
                        onClick={() => setOrderMonthFilter('last_month')}
                        className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                          orderMonthFilter === 'last_month' ? 'bg-blue-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Last Month (Aug)
                      </button>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1 bg-[#0B0F19] rounded-xl border border-gray-700/80 px-2 py-1 text-xs">
                      <Filter className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={orderStatusFilter}
                        onChange={(e) => setOrderStatusFilter(e.target.value)}
                        className="bg-transparent text-gray-200 focus:outline-none cursor-pointer pr-2"
                      >
                        <option value="all" className="bg-[#111827]">All Statuses</option>
                        <option value="Paid" className="bg-[#111827]">Paid</option>
                        <option value="Pending" className="bg-[#111827]">Pending Payment</option>
                        <option value="In Transit" className="bg-[#111827]">In Transit</option>
                        <option value="Delivered" className="bg-[#111827]">Delivered</option>
                        <option value="Cancelled" className="bg-[#111827]">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search order #, collector, painting..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full bg-[#0B0F19] border border-gray-700/80 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] tracking-wider font-semibold border-b border-gray-800">
                      <tr>
                        <th className="py-3 px-4">Order ID & Date</th>
                        <th className="py-3 px-4">Art Collector</th>
                        <th className="py-3 px-4">Painting / Item</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Payment</th>
                        <th className="py-3 px-4">Fulfillment / Courier</th>
                        <th className="py-3 px-4 text-right">Live Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60 font-sans">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-500">
                            No orders match the selected filters.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => {
                          const isCancelled = order.orderStatus === 'Cancelled';
                          const isPaid = order.paymentStatus === 'Paid';

                          return (
                            <tr
                              key={order.id}
                              className={`transition-colors hover:bg-gray-800/30 ${
                                isCancelled ? 'opacity-60 bg-red-950/10' : ''
                              }`}
                            >
                              {/* Order ID & Date */}
                              <td className="py-4 px-4">
                                <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                                  <span>{order.id}</span>
                                </div>
                                <div className="text-[11px] text-gray-400 mt-0.5">{order.date}</div>
                                {order.orderMonth && (
                                  <span className="text-[9px] uppercase tracking-wider bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded mt-1 inline-block">
                                    {order.orderMonth}
                                  </span>
                                )}
                              </td>

                              {/* Customer Details */}
                              <td className="py-4 px-4">
                                <div className="font-semibold text-white">{order.customerName}</div>
                                <div className="text-gray-400 flex items-center gap-1 mt-0.5 text-[11px]">
                                  <Mail className="w-3 h-3 text-gray-500" />
                                  <span>{order.customerEmail}</span>
                                </div>
                                {order.customerPhone && (
                                  <div className="text-gray-400 flex items-center gap-1 mt-0.5 text-[11px]">
                                    <Phone className="w-3 h-3 text-gray-500" />
                                    <span>{order.customerPhone}</span>
                                  </div>
                                )}
                                {order.deliveryAddress && (
                                  <div className="text-gray-500 flex items-center gap-1 mt-1 text-[10px] max-w-xs truncate" title={order.deliveryAddress}>
                                    <MapPin className="w-3 h-3 shrink-0 text-amber-500" />
                                    <span className="truncate">{order.deliveryAddress}</span>
                                  </div>
                                )}
                              </td>

                              {/* Items */}
                              <td className="py-4 px-4">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                                    <img
                                      src={item.image}
                                      alt={item.title}
                                      className="w-8 h-8 rounded-lg object-cover border border-gray-700 shrink-0"
                                    />
                                    <div className="max-w-[200px]">
                                      <div className="font-medium text-white truncate text-xs" title={item.title}>
                                        {item.title}
                                      </div>
                                      <div className="text-[10px] text-gray-400">
                                        Qty: {item.quantity} • {formatINR(item.price)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </td>

                              {/* Amount */}
                              <td className="py-4 px-4">
                                <div className="font-bold font-serif text-sm text-white">
                                  {formatINR(order.totalAmount)}
                                </div>
                                <div className="text-[10px] text-gray-400">{order.paymentMethod}</div>
                              </td>

                              {/* Payment Status */}
                              <td className="py-4 px-4">
                                <select
                                  disabled={isCancelled}
                                  value={order.paymentStatus}
                                  onChange={(e) => {
                                    updatePaymentStatus(order.id, e.target.value as OrderRecord['paymentStatus']);
                                    showToast(`Order #${order.id} payment status changed to: ${e.target.value}`);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-[#0B0F19] focus:outline-none cursor-pointer disabled:opacity-50 ${
                                    isPaid
                                      ? 'text-emerald-400 border-emerald-500/40'
                                      : order.paymentStatus === 'Pending Payment'
                                      ? 'text-amber-400 border-amber-500/40'
                                      : 'text-red-400 border-red-500/40'
                                  }`}
                                >
                                  <option value="Paid">Paid (Captured)</option>
                                  <option value="Pending Payment">Pending Payment</option>
                                  <option value="Failed">Failed</option>
                                  <option value="Refunded">Refunded</option>
                                </select>
                              </td>

                              {/* Fulfillment Status & Tracking */}
                              <td className="py-4 px-4">
                                {isCancelled ? (
                                  <div>
                                    <span className="inline-flex items-center gap-1 bg-red-950/60 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-full text-[11px] font-bold">
                                      <Ban className="w-3 h-3" />
                                      <span>Cancelled</span>
                                    </span>
                                    {order.cancellationReason && (
                                      <div className="text-[10px] text-red-300/80 mt-1 max-w-[180px] italic">
                                        "{order.cancellationReason}"
                                      </div>
                                    )}
                                    {order.cancelledAt && (
                                      <div className="text-[9px] text-gray-500 mt-0.5">
                                        {order.cancelledAt}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <select
                                      value={order.orderStatus}
                                      onChange={(e) => {
                                        updateOrderStatus(order.id, e.target.value as OrderRecord['orderStatus']);
                                        showToast(`Order #${order.id} status updated to: ${e.target.value}`);
                                      }}
                                      className="bg-[#0B0F19] text-gray-200 border border-gray-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
                                    >
                                      <option value="Order Placed">Order Placed</option>
                                      <option value="Payment Verified">Payment Verified</option>
                                      <option value="Fine Art Packing">Fine Art Packing</option>
                                      <option value="In Transit">In Transit (Dispatched)</option>
                                      <option value="Delivered">Delivered</option>
                                    </select>

                                    {order.trackingNumber && (
                                      <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                                        <Truck className="w-3 h-3 text-emerald-400" />
                                        <span>{order.trackingNumber}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Live Actions */}
                              <td className="py-4 px-4 text-right">
                                {!isCancelled && (
                                  <button
                                    onClick={() => {
                                      setOrderToCancel(order);
                                      setCancellationReasonInput('');
                                    }}
                                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all border border-red-500/30 flex items-center gap-1.5 ml-auto cursor-pointer"
                                    title="Cancel this order live"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Cancel Live</span>
                                  </button>
                                )}
                                {isCancelled && (
                                  <span className="text-[10px] text-gray-500 italic">
                                    Cancelled & Closed
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===================================================== */}
            {/* SUB-VIEW 2: PAINTINGS GALLERY & CATALOG               */}
            {/* ===================================================== */}
            {paintingsSubView === 'gallery' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {artworks.map((art) => {
                    const isSold = art.status === 'sold';

                    return (
                      <div
                        key={art.id}
                        className="bg-[#131D33] border border-gray-800 rounded-3xl overflow-hidden shadow-xl flex flex-col group hover:border-gray-700 transition-all"
                      >
                        {/* Painting Image or PDF Banner */}
                        <div className="relative aspect-[4/3] bg-black overflow-hidden">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Status Badge */}
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

                          {/* PDF Indicator if applicable */}
                          {art.fileType === 'pdf' && (
                            <div className="absolute top-3 right-3 bg-amber-500/90 text-black px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow">
                              <FileText className="w-3 h-3" />
                              <span>PDF Art Document</span>
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold mb-1">
                              {art.medium} • {art.year}
                            </div>
                            <h3 className="font-serif font-bold text-lg text-white line-clamp-1">
                              {art.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">{art.dimensions}</p>
                            <div className="mt-3 text-lg font-bold font-serif text-white">
                              {formatINR(art.price)}
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="pt-4 border-t border-gray-800 flex items-center justify-between gap-2">
                            {/* Toggle Sold / Available */}
                            <button
                              onClick={() => handleToggleSoldStatus(art)}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                                isSold
                                  ? 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border-emerald-500/30'
                                  : 'bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border-red-500/30'
                              }`}
                              title={isSold ? 'Make Available' : 'Mark as Sold'}
                            >
                              {isSold ? 'Make Available' : 'Make Sold'}
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => openEditPaintingModal(art)}
                              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                              title="Edit Painting Details"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove "${art.title}"?`)) {
                                  deleteArtwork(art.id);
                                  showToast(`Painting "${art.title}" deleted.`);
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
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: LIVE STUDIO & GOOGLE MEET DEMO                 */}
        {/* ========================================================= */}
        {activeTab === 'live-demo' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-[#131D33] border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
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

              {/* Status Banner */}
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
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                  }`}
                >
                  {isLiveBroadcasting ? 'End Broadcast' : 'Start Live Broadcast'}
                </button>
              </div>

              {/* Stream URL Input */}
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
                      className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-3 pl-4 pr-32 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946]"
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

                <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1.5">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>How Kuldeep's Live Studio Works:</span>
                  </div>
                  <p>1. Open Google Meet in your browser or phone camera.</p>
                  <p>2. Paste your Google Meet invite link in the box above.</p>
                  <p>3. Click <strong>"Start Live Broadcast"</strong>.</p>
                  <p>4. All enrolled students will immediately see a pulsating red "Join Live Easel Stream" notification on their site!</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: UPLOAD / EDIT PAINTING (PC File / PDF / URL)     */}
      {/* ========================================================= */}
      {isPaintingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div className="bg-[#131D33] border border-gray-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-[#E63946]" />
                <h3 className="text-lg font-bold font-serif text-white">
                  {editingArtworkId ? 'Edit Artwork Details' : 'Upload New Painting / Art Document'}
                </h3>
              </div>
              <button
                onClick={() => setIsPaintingModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePainting} className="space-y-6">
              {/* Image / File Upload Mode Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Artwork File Source
                </label>
                <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#0B0F19] rounded-2xl border border-gray-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('pc')}
                    className={`py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      uploadSourceMode === 'pc'
                        ? 'bg-[#E63946] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload from PC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('pdf')}
                    className={`py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      uploadSourceMode === 'pdf'
                        ? 'bg-[#E63946] text-white shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Upload PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUploadSourceMode('url')}
                    className={`py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      uploadSourceMode === 'url'
                        ? 'bg-[#E63946] text-white shadow'
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
                    className="border-2 border-dashed border-gray-700 hover:border-[#E63946] rounded-2xl p-6 text-center cursor-pointer bg-[#0B0F19]/60 hover:bg-[#0B0F19] transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-800 text-[#E63946] mx-auto flex items-center justify-center mb-3">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Click to choose painting photo from your PC
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPG, PNG, WEBP, AVIF (Any resolution)
                    </p>
                  </div>

                  {artworkForm.image && artworkForm.image.startsWith('data:') && (
                    <div className="flex items-center gap-3 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl">
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
                        Ready to Save
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
                    className="border-2 border-dashed border-gray-700 hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer bg-[#0B0F19]/60 hover:bg-[#0B0F19] transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      Click to choose artwork PDF from your PC
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Certificate of Authenticity, Artwork Catalog or High-Res PDF
                    </p>
                  </div>

                  {artworkForm.pdfUrl && (
                    <div className="flex items-center gap-3 p-3 bg-[#0B0F19] border border-gray-800 rounded-xl">
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
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946]"
                  />
                  {artworkForm.image && !artworkForm.image.startsWith('data:') && (
                    <div className="mt-2">
                      <img
                        src={artworkForm.image}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover border border-gray-700"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Title & Subtitle */}
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
                    placeholder="e.g., Whispers in Umber"
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Subtitle / Edition
                  </label>
                  <input
                    type="text"
                    value={artworkForm.subtitle}
                    onChange={(e) => setArtworkForm({ ...artworkForm, subtitle: e.target.value })}
                    placeholder="e.g., Original Oil on Belgian Linen"
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946]"
                  />
                </div>
              </div>

              {/* Medium, Dimensions, Price & Year */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Medium
                  </label>
                  <select
                    value={artworkForm.medium}
                    onChange={(e) => setArtworkForm({ ...artworkForm, medium: e.target.value as MediumType })}
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#E63946]"
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
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#E63946]"
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
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#E63946]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">
                    Creation Year
                  </label>
                  <input
                    type="number"
                    value={artworkForm.year}
                    onChange={(e) => setArtworkForm({ ...artworkForm, year: Number(e.target.value) })}
                    className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#E63946]"
                  />
                </div>
              </div>

              {/* Status Toggle: "Make a Sold as Private Collection" */}
              <div className="p-4 bg-[#0B0F19] border border-gray-800 rounded-2xl flex items-center justify-between">
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
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E63946]"></div>
                </label>
              </div>

              {/* Description & Story */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Artistic Description & Technique
                </label>
                <textarea
                  rows={3}
                  value={artworkForm.description}
                  onChange={(e) => setArtworkForm({ ...artworkForm, description: e.target.value })}
                  className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#E63946]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsPaintingModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#E63946] hover:bg-[#c92a37] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#E63946]/30 cursor-pointer"
                >
                  {editingArtworkId ? 'Save Changes' : 'Publish Artwork'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: LIVE CANCEL ORDER CONFIRMATION                   */}
      {/* ========================================================= */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#131D33] border-2 border-red-500/50 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Cancel Order #{orderToCancel.id}?
                </h3>
                <p className="text-xs text-gray-400">
                  This action will cancel the order in real-time and deduct from active sales.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0B0F19] rounded-xl border border-gray-800 text-xs space-y-1">
              <div className="text-gray-300">
                Collector: <strong>{orderToCancel.customerName}</strong>
              </div>
              <div className="text-gray-300">
                Amount: <strong>{formatINR(orderToCancel.totalAmount)}</strong>
              </div>
              <div className="text-gray-400">
                Payment Status will change to: <strong className="text-red-400">Refunded / Failed</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Cancellation Reason (Optional)
              </label>
              <input
                type="text"
                value={cancellationReasonInput}
                onChange={(e) => setCancellationReasonInput(e.target.value)}
                placeholder="e.g., Customer requested cancellation prior to shipment"
                className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl py-2 px-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/30 cursor-pointer"
              >
                Confirm Live Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
