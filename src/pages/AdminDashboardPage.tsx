import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Palette,
  Radio,
  BarChart3,
  Search,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  ExternalLink,
  Trash2,
  Edit3,
  Video,
  Users,
  Calendar,
  LogOut,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Lock,
  Film,
  Link as LinkIcon,
  FileVideo,
  AlertCircle,
  Cloud,
  Play,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  ShieldCheck,
  Check,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Star,
  Flame,
  Quote,
  Save,
  ArrowUpRight,
  Tag,
  Truck,
} from 'lucide-react';
import * as tus from 'tus-js-client';
import { useStudioData, getBackendUrls, deleteBunnyVideo } from '../context/StudioDataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { PromoCode, Artwork, MediumType, OrderRecord, Course, CourseLecture, EnrolledStudent, StudioReel, RegisteredUser, UpcomingCourse, CollectorReview } from '../types';

const DEFAULT_STUDIO_REELS: StudioReel[] = [
  {
    id: 'reel-1',
    title: 'Master Oil Glazing & Luminous Flesh Tones',
    category: 'Featured Reel',
    duration: '0:58',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'reel-2',
    title: 'Impasto Palette Knife Sculptural Textures',
    category: 'Palette Knife',
    duration: '0:45',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'reel-3',
    title: 'Sight-Size Charcoal Portrait Anatomy',
    category: 'Charcoal Study',
    duration: '1:12',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1577720643272-265f09367456?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 'reel-4',
    title: 'Raw Mineral Pigment & Walnut Oil Prep',
    category: 'Atelier Secrets',
    duration: '0:52',
    videoUrl: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.360p.vp9.webm',
    thumbnail: 'https://images.unsplash.com/photo-1582561424760-0321d75e81fa?q=80&w=900&auto=format&fit=crop',
  },
];

const isEmbedUrl = (url: string) => {
  return (
    url.includes('mediadelivery.net') ||
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('vimeo.com') ||
    url.includes('instagram.com')
  );
};

const getAdminEmbedUrl = (url: string) => {
  if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
    const match = url.match(/instagram\.com\/(?:reel|p)\/([^/?#&]+)/i);
    if (match && match[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed`;
    }
  }
  if (url.includes('mediadelivery.net') || url.includes('vimeo.com')) {
    return url;
  }
  if (url.includes('youtube.com/shorts/')) {
    const id = url.split('shorts/')[1]?.split('?')[0];
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (url.includes('watch?v=')) {
    const id = url.split('watch?v=')[1]?.split('&')[0];
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  return url;
};

interface AdminDashboardPageProps {
  onBackToSite?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => {
  const {
    artworks,
    courses,
    students,
    users,
    inquiries,
    artistProfile,
    updateArtistProfile,
    addArtwork,
    updateArtwork,
    deleteArtwork,
    addCourse,
    updateCourse,
    deleteCourse,
    addStudent,
    updateStudent,
    deleteStudent,
    updateUser,
    deleteUser,
    updateInquiryStatus,
    deleteInquiry,
    addLectureToModule,
    updateLectureInModule,
    deleteLectureFromModule,
    upcomingCourses,
    addUpcomingCourse,
    updateUpcomingCourse,
    deleteUpcomingCourse,
    promoCodes,
    deliverySettings,
    addPromoCode,
    updatePromoCode,
    deletePromoCode,
    updateDeliverySettings,
    reviews,
    addReview,
    updateReview,
    deleteReview
  } = useStudioData();

  const { adminLogout } = useAuth();
  const { orders, advanceOrderStep, deleteOrder, addOrder } = useCart();

  // =========================================================
  // MASTER 2-MODE SWITCHER: 'gallery' (Art & Sales) vs 'academy' (Live Classes & LMS)
  // PERSISTENT ACROSS PAGE RELOADS VIA LOCALSTORAGE & URL HASH
  // =========================================================
  const [adminMode, setAdminMode] = useState<'gallery' | 'academy'>(() => {
    try {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'academy' || hash === 'live' || hash === 'courses') return 'academy';
      if (hash === 'gallery' || hash === 'art' || hash === 'orders') return 'gallery';
      const saved = localStorage.getItem('ks_admin_mode');
      if (saved === 'academy' || saved === 'gallery') return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'gallery';
  });

  // Sub-Navigation for Mode 1: Art Gallery & Sales
  const [galleryNav, setGalleryNav] = useState<'orders' | 'artworks' | 'hero' | 'inquiries' | 'analytics' | 'settings' | 'video' | 'testimonials' | 'promos'>(() => {
    try {
      const saved = localStorage.getItem('ks_admin_gallery_nav');
      if (saved === 'orders' || saved === 'artworks' || saved === 'hero' || saved === 'inquiries' || saved === 'analytics' || saved === 'settings' || saved === 'video' || saved === 'testimonials') return saved as any;
    } catch (e) {
      console.warn(e);
    }
    return 'orders';
  });

  // Sub-Navigation for Mode 2: Live Académie & Masterclasses
  const [academyNav, setAcademyNav] = useState<'batches' | 'curriculum' | 'upcoming' | 'students' | 'users' | 'testimonials'>(() => {
    try {
      const saved = localStorage.getItem('ks_admin_academy_nav');
      if (saved === 'batches' || saved === 'curriculum' || saved === 'upcoming' || saved === 'students' || saved === 'users' || saved === 'testimonials') return saved;
    } catch (e) {
      console.warn(e);
    }
    return 'batches';
  });

  // Persist navigation choices on change
  useEffect(() => {
    try {
      localStorage.setItem('ks_admin_mode', adminMode);
      window.history.replaceState(null, '', `#${adminMode}`);
    } catch (e) {
      console.warn(e);
    }
  }, [adminMode]);

  useEffect(() => {
    try {
      localStorage.setItem('ks_admin_gallery_nav', galleryNav);
    } catch (e) {
      console.warn(e);
    }
  }, [galleryNav]);

  useEffect(() => {
    try {
      localStorage.setItem('ks_admin_academy_nav', academyNav);
    } catch (e) {
      console.warn(e);
    }
  }, [academyNav]);

  // Global Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // =========================================================
  // PROMOS & DELIVERY SETTINGS STATE
  const [isAddPromoModalOpen, setIsAddPromoModalOpen] = useState(false);
  const [promoToEdit, setPromoToEdit] = useState<PromoCode | null>(null);
  const [promoForm, setPromoForm] = useState<Partial<PromoCode>>({
    code: '',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 0,
    isActive: true,
    description: ''
  });

  const [deliveryFeeForm, setDeliveryFeeForm] = useState<number>(() => deliverySettings?.deliveryFee ?? 180);
  const [freeThresholdForm, setFreeThresholdForm] = useState<number>(() => deliverySettings?.freeDeliveryThreshold ?? 3000);
  const [deliveryLabelForm, setDeliveryLabelForm] = useState<string>(() => deliverySettings?.deliveryLabel || 'Insured Fine Art Delivery');
  const [isDeliveryEnabledForm, setIsDeliveryEnabledForm] = useState<boolean>(() => deliverySettings?.isEnabled ?? true);

  // Sync delivery form when deliverySettings updates from cloud/storage
  useEffect(() => {
    if (deliverySettings) {
      setDeliveryFeeForm(deliverySettings.deliveryFee ?? 180);
      setFreeThresholdForm(deliverySettings.freeDeliveryThreshold ?? 3000);
      setDeliveryLabelForm(deliverySettings.deliveryLabel || 'Insured Fine Art Delivery');
      setIsDeliveryEnabledForm(deliverySettings.isEnabled ?? true);
    }
  }, [deliverySettings]);

  const handleSaveDeliverySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateDeliverySettings({
      deliveryFee: Number(deliveryFeeForm),
      freeDeliveryThreshold: Number(freeThresholdForm),
      deliveryLabel: deliveryLabelForm.trim() || 'Insured Fine Art Delivery',
      isEnabled: isDeliveryEnabledForm
    });
    showToast('Insured Delivery settings updated successfully!');
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.code?.trim()) {
      showToast('Please enter a valid coupon code');
      return;
    }
    const cleanCode = promoForm.code.trim().toUpperCase();

    if (promoToEdit) {
      updatePromoCode(promoToEdit.id, {
        code: cleanCode,
        discountType: promoForm.discountType || 'percentage',
        discountValue: Number(promoForm.discountValue) || 10,
        minOrderAmount: Number(promoForm.minOrderAmount) || 0,
        isActive: promoForm.isActive !== false,
        description: promoForm.description?.trim() || ''
      });
      showToast(`Promo code "${cleanCode}" updated successfully!`);
    } else {
      const newPromo: PromoCode = {
        id: 'promo-' + Date.now(),
        code: cleanCode,
        discountType: promoForm.discountType || 'percentage',
        discountValue: Number(promoForm.discountValue) || 10,
        minOrderAmount: Number(promoForm.minOrderAmount) || 0,
        isActive: promoForm.isActive !== false,
        description: promoForm.description?.trim() || ''
      };
      addPromoCode(newPromo);
      showToast(`Promo code "${cleanCode}" created!`);
    }
    setIsAddPromoModalOpen(false);
    setPromoToEdit(null);
  };


  const renderPromosAndDeliveryTabContent = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-[#FF5722]" />
            <span>Store Promo Codes & Fine Art Delivery Settings</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure collector coupon discounts and set insured delivery shipping rules in real time
          </p>
        </div>
        <button
          onClick={() => {
            setPromoToEdit(null);
            setPromoForm({
              code: '',
              discountType: 'percentage',
              discountValue: 15,
              minOrderAmount: 0,
              isActive: true,
              description: ''
            });
            setIsAddPromoModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF7A45] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Promo Code</span>
        </button>
      </div>

      {/* SECTION 1: INSURED FINE ART DELIVERY CONTROL CARD */}
      <div className="bg-[#14171E] border border-[#242A36] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-serif text-white">Insured Fine Art Delivery Controls</h3>
              <p className="text-xs text-gray-400">Set shipping rates, complimentary order thresholds & display label</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#1A1E27] px-4 py-2 rounded-2xl border border-gray-800">
            <span className="text-xs font-semibold text-gray-300">Delivery Status:</span>
            <button
              type="button"
              onClick={() => setIsDeliveryEnabledForm(!isDeliveryEnabledForm)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDeliveryEnabledForm
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {isDeliveryEnabledForm ? 'Active (Charged / Free Threshold)' : 'Disabled (Always Complimentary)'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveDeliverySettings} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Standard Delivery Fee (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={deliveryFeeForm}
                  onChange={(e) => setDeliveryFeeForm(Number(e.target.value))}
                  placeholder="e.g. 180"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl pl-8 pr-3.5 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-[#FF5722]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Default fee charged when subtotal is below the free threshold.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Complimentary (Free) Delivery Above (INR ₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={freeThresholdForm}
                  onChange={(e) => setFreeThresholdForm(Number(e.target.value))}
                  placeholder="e.g. 3000"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl pl-8 pr-3.5 py-2.5 text-white font-semibold text-sm focus:outline-none focus:border-[#FF5722]"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Orders reaching this value get ₹0 complimentary delivery (Set 0 for always free).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Delivery Label (Cart & Checkout)
              </label>
              <input
                type="text"
                required
                value={deliveryLabelForm}
                onChange={(e) => setDeliveryLabelForm(e.target.value)}
                placeholder="Insured Fine Art Delivery"
                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-medium text-sm focus:outline-none focus:border-[#FF5722]"
              />
              <p className="text-[11px] text-gray-500 mt-1">Text displayed beside the delivery fee on the buyer cart.</p>
            </div>
          </div>

          {/* Real-time Simulator Preview */}
          <div className="p-4 rounded-2xl bg-[#161922] border border-[#252B38] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Live Cart Behavior Simulator</span>
              <div className="text-gray-300">
                {isDeliveryEnabledForm ? (
                  <span>
                    Cart below ₹{freeThresholdForm.toLocaleString('en-IN')}: <strong className="text-white">₹{deliveryFeeForm} {deliveryLabelForm}</strong>.
                    Cart ₹{freeThresholdForm.toLocaleString('en-IN')}+: <strong className="text-emerald-400">Complimentary (₹0)</strong>.
                  </span>
                ) : (
                  <span className="text-emerald-400 font-bold">Complimentary Delivery on all orders (Delivery Fee is Disabled)</span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow cursor-pointer shrink-0"
            >
              Save Delivery Settings
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: PROMO CODES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold font-serif text-white">Active Promo Codes & Vouchers</h3>
            <span className="bg-[#242934] text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {promoCodes ? promoCodes.length : 0} Total
            </span>
          </div>
        </div>

        {(!promoCodes || promoCodes.length === 0) ? (
          <div className="p-12 text-center bg-[#14171E] rounded-3xl border border-[#242A36] text-gray-400 text-xs">
            No promo codes configured. Click &quot;+ Create New Promo Code&quot; to add your first discount coupon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promoCodes.map((promo) => (
              <div
                key={promo.id}
                className={`bg-[#14171E] border rounded-2xl p-5 space-y-3 transition-all relative ${
                  promo.isActive ? 'border-[#242A36] hover:border-gray-700' : 'border-gray-800 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-sm rounded-xl tracking-wider">
                    {promo.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      promo.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {promo.isActive ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-800/80">
                  <div className="text-xl font-bold font-serif text-white">
                    {promo.discountType === 'percentage' ? `${promo.discountValue}% OFF` : `₹${promo.discountValue} OFF`}
                  </div>
                  {promo.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{promo.description}</p>
                  )}
                  <div className="text-[11px] text-gray-500 mt-2">
                    {promo.minOrderAmount && promo.minOrderAmount > 0 ? (
                      <span>Min Order: ₹{promo.minOrderAmount.toLocaleString('en-IN')}</span>
                    ) : (
                      <span>No Minimum Order</span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      updatePromoCode(promo.id, { isActive: !promo.isActive });
                      showToast(`Promo ${promo.code} ${promo.isActive ? 'paused' : 'activated'}!`);
                    }}
                    className="text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                  >
                    {promo.isActive ? 'Pause Code' : 'Activate Code'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPromoToEdit(promo);
                        setPromoForm({ ...promo });
                        setIsAddPromoModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                      title="Edit Promo"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete promo code "${promo.code}"?`)) {
                          deletePromoCode(promo.id);
                          showToast(`Promo code ${promo.code} deleted`);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                      title="Delete Promo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // SIDE A: ARTWORKS & ORDERS STATE & HANDLERS
  // =========================================================
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [orderCategoryTab, setOrderCategoryTab] = useState<'paintings' | 'courses' | 'all'>('paintings');

  const isOrderCourse = (o: OrderRecord) => {
    return (
      (o.items || []).some((it) => it.type === 'course') ||
      (o.items || []).some((it) => {
        const t = (it.title || '').toLowerCase();
        return t.includes('course') || t.includes('masterclass') || t.includes('batch');
      })
    );
  };

  const paintingOrdersCount = useMemo(() => orders.filter((o) => !isOrderCourse(o)).length, [orders]);
  const courseOrdersCount = useMemo(() => orders.filter((o) => isOrderCourse(o)).length, [orders]);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<OrderRecord | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    paintingTitle: '',
    paintingMedium: 'Oil on Canvas',
    customerName: '',
    customerEmail: '',
    customerCity: '',
    totalAmount: 95000,
    currentStep: 1 as 1 | 2 | 3 | 4,
    orderDate: '24 Sep, 2026'
  });

  // Upcoming Courses Management
  const [upcomingSearchQuery, setUpcomingSearchQuery] = useState('');
  const [upcomingCategoryFilter, setUpcomingCategoryFilter] = useState('All');
  const [isUpcomingModalOpen, setIsUpcomingModalOpen] = useState(false);
  const [editingUpcomingCourse, setEditingUpcomingCourse] = useState<UpcomingCourse | null>(null);
  const [upcomingForm, setUpcomingForm] = useState<Partial<UpcomingCourse>>({
    title: '',
    category: 'Oil Painting Masterclass',
    badge: 'Launching Soon • Limited 15 Seats',
    startDate: 'November 2026',
    duration: '6 Weeks • 12 Live Sessions',
    level: 'All Levels',
    price: 4999,
    originalPrice: 8500,
    description: '',
    instructorQuote: '',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    seatsTotal: 15,
    seatsLeft: 5,
    status: 'open_for_booking',
    isActive: true,
    studentTestimonial: {
      name: '',
      role: 'Fine Arts Scholar',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      quote: '',
      rating: 5
    }
  });

  // Testimonials / Reviews Management
  const [testimonialSearchQuery, setTestimonialSearchQuery] = useState('');
  const [testimonialCategoryFilter, setTestimonialCategoryFilter] = useState<'all' | 'student' | 'upcoming' | 'collector'>('all');
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<CollectorReview | null>(null);
  const [testimonialSectionTitleInput, setTestimonialSectionTitleInput] = useState(() => artistProfile?.testimonialSectionTitle || 'Upcoming Courses');
  const [testimonialSectionSubtitleInput, setTestimonialSectionSubtitleInput] = useState(() => artistProfile?.testimonialSectionSubtitle || 'Student Reviews & Atelier Experiences');
  const [testimonialForm, setTestimonialForm] = useState<Partial<CollectorReview>>({
    name: '',
    role: 'Student & Fine Arts Scholar',
    location: 'Delhi, India',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop',
    artworkImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=900&auto=format&fit=crop',
    comment: '',
    rating: 5,
    verifiedPurchase: true,
    category: 'upcoming',
    courseTaken: 'Venetian Oil Glazing Masterclass',
    isActive: true
  });

  // Artwork Management
  const [artworkCategoryFilter, setArtworkCategoryFilter] = useState<string>('All');
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');
  const [isAddArtworkModalOpen, setIsAddArtworkModalOpen] = useState(false);
  const [artworkToEdit, setArtworkToEdit] = useState<Artwork | null>(null);

  // Customer Inquiries Management
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'contacted' | 'resolved'>('all');
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [newArtworkForm, setNewArtworkForm] = useState<Partial<Artwork>>({
    title: '',
    subtitle: '',
    year: 2026,
    medium: 'Oil on Canvas',
    dimensions: '36 x 48 in (91 x 122 cm)',
    price: 95000,
    image: '',
    detailImages: [],
    description: '',
    story: '',
    framed: true,
    status: 'available',
    featured: true,
    varnishType: 'Archival Satin Varnish'
  });
  const [artworkUrlInput, setArtworkUrlInput] = useState('');
  const [isProcessingArtworkImages, setIsProcessingArtworkImages] = useState(false);
  const [isBulkUploadingPaintings, setIsBulkUploadingPaintings] = useState(false);

  // Atelier 4-Reels Video Showcase State (Video Upload / Update)
  const [activeReelIndex, setActiveReelIndex] = useState<number>(0);
  const [adminReels, setAdminReels] = useState<StudioReel[]>(() => {
    if (artistProfile?.studioReels && artistProfile.studioReels.length >= 4) {
      return artistProfile.studioReels;
    }
    const def = [...DEFAULT_STUDIO_REELS];
    if (artistProfile?.studioVideoUrl) {
      def[0] = {
        ...def[0],
        videoUrl: artistProfile.studioVideoUrl,
        title: artistProfile.studioVideoTitle || def[0].title,
        thumbnail: artistProfile.studioVideoPoster || def[0].thumbnail,
      };
    }
    return def;
  });

  const [videoTitle, setVideoTitle] = useState(() => adminReels[0]?.title || '');
  const [videoUrl, setVideoUrl] = useState(() => adminReels[0]?.videoUrl || '');
  const [videoPoster, setVideoPoster] = useState(() => adminReels[0]?.thumbnail || '');
  const [videoCategory, setVideoCategory] = useState(() => adminReels[0]?.category || 'Featured Reel');
  const [videoDuration, setVideoDuration] = useState(() => adminReels[0]?.duration || '0:55');
  const [videoFileFeedback, setVideoFileFeedback] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);

  const [hasInitializedReels, setHasInitializedReels] = useState(false);

  useEffect(() => {
    if (!hasInitializedReels && artistProfile?.studioReels && artistProfile.studioReels.length >= 4) {
      setAdminReels(artistProfile.studioReels);
      const curr = artistProfile.studioReels[activeReelIndex] || artistProfile.studioReels[0];
      setVideoTitle(curr.title || '');
      setVideoUrl(curr.videoUrl || '');
      setVideoPoster(curr.thumbnail || '');
      setVideoCategory(curr.category || 'Featured Reel');
      setVideoDuration(curr.duration || '0:50');
      setHasInitializedReels(true);
    }
  }, [artistProfile?.studioReels, hasInitializedReels, activeReelIndex]);

  const handleSelectReelSlot = (index: number) => {
    // Preserve current edits in adminReels
    const updated = [...adminReels];
    if (updated[activeReelIndex]) {
      updated[activeReelIndex] = {
        ...updated[activeReelIndex],
        title: videoTitle,
        videoUrl: videoUrl,
        thumbnail: videoPoster,
        category: videoCategory,
        duration: videoDuration,
      };
      setAdminReels(updated);
    }

    setActiveReelIndex(index);
    const target = updated[index] || DEFAULT_STUDIO_REELS[index];
    if (target) {
      setVideoTitle(target.title || '');
      setVideoUrl(target.videoUrl || '');
      setVideoPoster(target.thumbnail || '');
      setVideoCategory(target.category || 'Featured Reel');
      setVideoDuration(target.duration || '0:50');
      setVideoFileFeedback('');
    }
  };

  const updateCurrentReelField = (fields: Partial<StudioReel>) => {
    if (fields.title !== undefined) setVideoTitle(fields.title);
    if (fields.videoUrl !== undefined) setVideoUrl(fields.videoUrl);
    if (fields.thumbnail !== undefined) setVideoPoster(fields.thumbnail);
    if (fields.category !== undefined) setVideoCategory(fields.category);
    if (fields.duration !== undefined) setVideoDuration(fields.duration);

    setAdminReels((prev) => {
      const next = [...prev];
      if (next[activeReelIndex]) {
        next[activeReelIndex] = {
          ...next[activeReelIndex],
          ...fields,
        };
      }
      return next;
    });
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast('⚠️ Please select a valid video file (.mp4, .webm, .mov)');
      return;
    }

    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setVideoFileFeedback(`⏳ Uploading "${file.name}" (${fileSizeMB} MB) to Bunny Stream Cloud CDN...`);
    setIsUploadingVideo(true);
    showToast(`⏳ Uploading Reel ${activeReelIndex + 1} to Bunny Stream Cloud...`);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', videoTitle || file.name);

      let res: Response;
      try {
        res = await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/upload/video', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('Remote cloud upload failed');
      } catch {
        res = await fetch('http://localhost:5000/api/upload/video', {
          method: 'POST',
          body: formData,
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || `Upload failed with status ${res.status}`);
      }

      const result = await res.json();
      const finalUrl = result.embedUrl || result.directPlayUrl;
      const finalPoster = result.thumbnailUrl || videoPoster;
      const finalTitle = videoTitle.trim() || file.name.replace(/\.[^/.]+$/, '');

      setVideoUrl(finalUrl);
      if (result.thumbnailUrl) {
        setVideoPoster(result.thumbnailUrl);
      }
      setVideoFileFeedback(`✅ Successfully uploaded to Bunny Stream! (GUID: ${result.videoGuid})`);
      showToast(`🚀 Reel ${activeReelIndex + 1} uploaded to Bunny Stream!`);

      // Update in adminReels array immediately
      const updated = [...adminReels];
      updated[activeReelIndex] = {
        ...updated[activeReelIndex],
        videoUrl: finalUrl,
        thumbnail: finalPoster,
        title: finalTitle,
      };
      setAdminReels(updated);

      updateArtistProfile({
        studioReels: updated,
        studioVideoUrl: updated[0]?.videoUrl,
        studioVideoTitle: updated[0]?.title,
        studioVideoPoster: updated[0]?.thumbnail,
      });

      // Sync to backend PUT /api/profile
      try {
        await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studioReels: updated,
            studioVideoUrl: updated[0]?.videoUrl,
            studioVideoTitle: updated[0]?.title,
            studioVideoPoster: updated[0]?.thumbnail,
          }),
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('Bunny video upload error:', err);
      const objUrl = URL.createObjectURL(file);
      setVideoUrl(objUrl);
      setVideoFileFeedback(`⚠️ Cloud upload error: ${err.message}. Showing local preview.`);
      showToast(`⚠️ Upload failed: ${err.message}`);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleVideoPosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setVideoPoster(reader.result);
        const updated = [...adminReels];
        if (updated[activeReelIndex]) {
          updated[activeReelIndex].thumbnail = reader.result;
          setAdminReels(updated);
        }
        showToast('✅ Poster image updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVideoShowcase = async () => {
    if (!videoUrl.trim()) {
      showToast('⚠️ Please enter or upload a video for this reel');
      return;
    }

    const updated = [...adminReels];
    updated[activeReelIndex] = {
      ...updated[activeReelIndex],
      title: videoTitle.trim() || `Reel ${activeReelIndex + 1}`,
      videoUrl: videoUrl.trim(),
      thumbnail: videoPoster.trim() || updated[activeReelIndex].thumbnail,
      category: videoCategory.trim() || 'Featured Reel',
      duration: videoDuration.trim() || '0:50',
    };
    setAdminReels(updated);

    updateArtistProfile({
      studioReels: updated,
      studioVideoUrl: updated[0]?.videoUrl,
      studioVideoTitle: updated[0]?.title,
      studioVideoPoster: updated[0]?.thumbnail,
    });

    const payload = {
      studioReels: updated,
      studioVideoUrl: updated[0]?.videoUrl,
      studioVideoTitle: updated[0]?.title,
      studioVideoPoster: updated[0]?.thumbnail,
    };

    try {
      await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    showToast(`🎉 Reel ${activeReelIndex + 1} ("${videoTitle}") saved & live on website!`);
  };

  const handleDeleteCurrentReelVideo = async (targetIndex = activeReelIndex) => {
    const oldVideo = adminReels[targetIndex]?.videoUrl;
    if (oldVideo) {
      deleteBunnyVideo(oldVideo).catch(() => {});
    }

    const updated = [...adminReels];
    const defaultReel = DEFAULT_STUDIO_REELS[targetIndex] || {
      id: `reel-${targetIndex + 1}`,
      title: `Atelier Reel #${targetIndex + 1}`,
      videoUrl: '',
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
      category: 'Master Technique',
      duration: '0:45',
    };

    updated[targetIndex] = {
      ...defaultReel,
      videoUrl: '',
      title: `Atelier Reel #${targetIndex + 1}`,
    };

    if (targetIndex === activeReelIndex) {
      setVideoUrl('');
      setVideoTitle(`Atelier Reel #${targetIndex + 1}`);
      setVideoPoster(defaultReel.thumbnail);
      setVideoCategory(defaultReel.category);
      setVideoDuration('0:45');
      setVideoFileFeedback('');
    }

    setAdminReels(updated);

    const payload = {
      studioReels: updated,
      studioVideoUrl: updated[0]?.videoUrl || '',
      studioVideoTitle: updated[0]?.title || '',
      studioVideoPoster: updated[0]?.thumbnail || '',
    };

    updateArtistProfile(payload);

    try {
      await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    }

    showToast(`🗑️ Reel #${targetIndex + 1} video permanently deleted!`);
  };

  // =========================================================
  // HERO SHOWCASE (CANVAS / VIDEO) STATE & HANDLERS
  // =========================================================
  const [heroType, setHeroType] = useState<'painting' | 'video'>(() => artistProfile?.heroShowcaseType || 'video');
  const [heroBadge, setHeroBadge] = useState<string>(() => artistProfile?.heroShowcaseBadge || 'Featured Canvas');
  const [heroTitle, setHeroTitle] = useState<string>(() => artistProfile?.heroShowcaseTitle || 'Artist Kuldeep Singh');
  const [heroSubtitle, setHeroSubtitle] = useState<string>(() => artistProfile?.heroShowcaseSubtitle || 'Original Oil on Belgian Linen (40 x 54 in)');
  const [heroPrice, setHeroPrice] = useState<string>(() => artistProfile?.heroShowcasePrice || '₹4,12,250');
  const [heroImage, setHeroImage] = useState<string>(() => artistProfile?.heroShowcaseImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop');
  const [heroVideoUrl, setHeroVideoUrl] = useState<string>(() => artistProfile?.heroShowcaseVideoUrl || artistProfile?.studioVideoUrl || '/videos/hero-cinematic.mp4');
  const [heroCert, setHeroCert] = useState<string>(() => artistProfile?.heroShowcaseCertificateText || 'Archival Certificate');
  const [heroArtworkId, setHeroArtworkId] = useState<string>(() => artistProfile?.heroShowcaseArtworkId || '');
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [isUploadingHeroVideo, setIsUploadingHeroVideo] = useState(false);
  const [heroVideoProgress, setHeroVideoProgress] = useState<number>(0);
  const [heroVideoFeedback, setHeroVideoFeedback] = useState<string>('');

  // Sync hero showcase fields from artistProfile (works on mount, on cloud fetch, and on refresh)
  useEffect(() => {
    if (artistProfile) {
      if (artistProfile.heroShowcaseType) setHeroType(artistProfile.heroShowcaseType);
      if (artistProfile.heroShowcaseBadge) setHeroBadge(artistProfile.heroShowcaseBadge);
      if (artistProfile.heroShowcaseTitle) setHeroTitle(artistProfile.heroShowcaseTitle);
      if (artistProfile.heroShowcaseSubtitle) setHeroSubtitle(artistProfile.heroShowcaseSubtitle);
      if (artistProfile.heroShowcasePrice !== undefined) setHeroPrice(artistProfile.heroShowcasePrice);
      if (artistProfile.heroShowcaseImage) setHeroImage(artistProfile.heroShowcaseImage);
      if (artistProfile.heroShowcaseVideoUrl) setHeroVideoUrl(artistProfile.heroShowcaseVideoUrl);
      if (artistProfile.heroShowcaseCertificateText) setHeroCert(artistProfile.heroShowcaseCertificateText);
      if (artistProfile.heroShowcaseArtworkId) setHeroArtworkId(artistProfile.heroShowcaseArtworkId);
    }
  }, [
    artistProfile?.heroShowcaseType,
    artistProfile?.heroShowcaseBadge,
    artistProfile?.heroShowcaseTitle,
    artistProfile?.heroShowcaseSubtitle,
    artistProfile?.heroShowcasePrice,
    artistProfile?.heroShowcaseImage,
    artistProfile?.heroShowcaseVideoUrl,
    artistProfile?.heroShowcaseCertificateText,
    artistProfile?.heroShowcaseArtworkId
  ]);

  const handleSaveHeroShowcase = async () => {
    if (heroVideoUrl && heroVideoUrl.startsWith('data:video')) {
      alert('Video file is still uploading to Bunny Stream CDN. Please wait for upload to complete, or paste a YouTube / Vimeo / direct video link.');
      return;
    }

    setIsSavingHero(true);
    const updates = {
      heroShowcaseType: heroType,
      heroShowcaseBadge: heroBadge,
      heroShowcaseTitle: heroTitle,
      heroShowcaseSubtitle: heroSubtitle,
      heroShowcasePrice: heroPrice,
      heroShowcaseImage: heroImage,
      heroShowcaseVideoUrl: heroVideoUrl,
      studioVideoUrl: heroVideoUrl,
      studioVideoPoster: heroImage,
      heroShowcaseCertificateText: heroCert,
      heroShowcaseArtworkId: heroArtworkId,
    };

    updateArtistProfile(updates);

    let saved = false;
    for (const base of getBackendUrls()) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${base}/api/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          saved = true;
          break; // Stop immediately after first successful cloud sync
        }
      } catch (e) {
        console.warn('Hero showcase sync error with', base, e);
      }
    }

    setIsSavingHero(false);
    if (saved) {
      showToast(`🎉 Hero Showcase updated & live on website! (${heroType === 'video' ? 'Video' : 'Painting'})`);
    } else {
      showToast(`⚠️ Updated locally. Cloud sync will retry automatically.`);
    }
  };

  const handleDeleteHeroVideo = async () => {
    if (!heroVideoUrl) return;
    if (!window.confirm('Are you sure you want to permanently delete this video from Bunny.net CDN and website?')) return;

    const videoToDelete = heroVideoUrl;
    setHeroVideoUrl('');
    showToast('⏳ Deleting video from Bunny.net CDN...');

    await deleteBunnyVideo(videoToDelete);

    persistHeroShowcaseData({
      heroShowcaseType: heroType,
      heroShowcaseVideoUrl: '',
    });

    showToast('🗑️ Video permanently deleted from Bunny.net and website!');
  };

  const handleSelectCatalogPaintingForHero = (artworkId: string) => {
    setHeroArtworkId(artworkId);
    if (!artworkId) return;
    const art = artworks.find((a) => a.id === artworkId);
    if (art) {
      setHeroType('painting');
      setHeroTitle(art.title);
      setHeroSubtitle(`${art.medium} (${art.dimensions})`);
      setHeroPrice(`₹${art.price.toLocaleString('en-IN')}`);
      setHeroImage(art.image);
      setHeroBadge('Featured Canvas');
      setHeroCert('Archival Certificate');
    }
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingHeroImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setHeroImage(compressed);
          setIsUploadingHeroImage(false);
          showToast('✓ Hero image uploaded and compressed successfully');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const persistHeroShowcaseData = async (updates: Record<string, any>) => {
    updateArtistProfile(updates);
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        break;
      } catch {
        // try next
      }
    }
  };

  const fallbackHeroVideoUpload = async (file: File) => {
    setHeroVideoFeedback('⏳ Uploading video file via cloud API...');
    setHeroVideoProgress(25);
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', heroTitle || file.name);

    let res: Response | null = null;
    for (const base of getBackendUrls()) {
      try {
        res = await fetch(`${base}/api/upload/video`, {
          method: 'POST',
          body: formData,
        });
        if (res.ok) break;
      } catch {
        // try next
      }
    }

    if (!res || !res.ok) {
      throw new Error('Cloud upload unavailable. Please paste a YouTube/Vimeo embed or direct MP4 URL.');
    }

    const result = await res.json();
    const finalUrl = result.embedUrl || result.directPlayUrl;
    setHeroVideoUrl(finalUrl);
    const finalPoster = result.thumbnailUrl || heroImage;
    if (result.thumbnailUrl) {
      setHeroImage(result.thumbnailUrl);
    }
    setHeroType('video');
    setIsUploadingHeroVideo(false);
    setHeroVideoProgress(100);
    setHeroVideoFeedback('✅ Uploaded to Bunny Stream CDN & Saved!');
    showToast('🚀 Hero Showcase video uploaded & saved to website!');

    persistHeroShowcaseData({
      heroShowcaseType: 'video',
      heroShowcaseVideoUrl: finalUrl,
      heroShowcaseImage: finalPoster,
      heroShowcaseTitle: heroTitle || file.name.replace(/\.[^/.]+$/, ''),
      heroShowcaseBadge: heroBadge || 'Featured Canvas',
      heroShowcaseSubtitle: heroSubtitle,
      heroShowcasePrice: heroPrice,
      heroShowcaseCertificateText: heroCert,
      heroShowcaseArtworkId: heroArtworkId,
    });
  };

  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 250 * 1024 * 1024) {
      alert('Video file size exceeds 250MB. Please use an embed/stream URL or compress video.');
      return;
    }

    setIsUploadingHeroVideo(true);
    setHeroVideoFeedback(`⏳ Connecting to Bunny Stream Cloud CDN...`);
    setHeroVideoProgress(5);
    showToast('⏳ Uploading video to Bunny Stream Cloud CDN...');

    try {
      // 1. Request Bunny Stream Upload Token
      let tokenRes: Response | null = null;
      for (const base of getBackendUrls()) {
        try {
          tokenRes = await fetch(`${base}/api/upload/bunny-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: heroTitle || file.name }),
          });
          if (tokenRes.ok) break;
        } catch {
          // try next
        }
      }

      if (tokenRes && tokenRes.ok) {
        const authData = await tokenRes.json();
        const { libraryId, videoId, expiration, signature, embedUrl, thumbnailUrl } = authData;

        const upload = new tus.Upload(file, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          chunkSize: 10 * 1024 * 1024,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            AuthorizationSignature: signature,
            AuthorizationExpire: expiration.toString(),
            LibraryId: libraryId.toString(),
            VideoId: videoId,
          },
          metadata: {
            filename: file.name,
            filetype: file.type || 'video/mp4',
            title: heroTitle || file.name,
          },
          onError: async (err) => {
            console.warn('TUS Direct Upload failed, using fallback FormData:', err);
            await fallbackHeroVideoUpload(file);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100));
            setHeroVideoProgress(pct);
            const uploadedMb = (bytesUploaded / (1024 * 1024)).toFixed(1);
            const totalMb = (bytesTotal / (1024 * 1024)).toFixed(1);
            setHeroVideoFeedback(`Uploading to CDN: ${pct}% (${uploadedMb} MB / ${totalMb} MB)`);
          },
          onSuccess: () => {
            const finalUrl = embedUrl || `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
            setHeroVideoUrl(finalUrl);
            const finalPoster = thumbnailUrl || heroImage;
            if (thumbnailUrl) {
              setHeroImage(thumbnailUrl);
            }
            setHeroType('video');
            setIsUploadingHeroVideo(false);
            setHeroVideoProgress(100);
            setHeroVideoFeedback('✅ Uploaded to Bunny Stream CDN & Saved!');
            showToast('🚀 Hero Showcase video uploaded & saved to website!');

            persistHeroShowcaseData({
              heroShowcaseType: 'video',
              heroShowcaseVideoUrl: finalUrl,
              heroShowcaseImage: finalPoster,
              heroShowcaseTitle: heroTitle || file.name.replace(/\.[^/.]+$/, ''),
              heroShowcaseBadge: heroBadge || 'Featured Canvas',
              heroShowcaseSubtitle: heroSubtitle,
              heroShowcasePrice: heroPrice,
              heroShowcaseCertificateText: heroCert,
              heroShowcaseArtworkId: heroArtworkId,
            });
          },
        });

        upload.start();
        return;
      }

      // Fallback
      await fallbackHeroVideoUpload(file);
    } catch (err: any) {
      console.error('Video upload error:', err);
      setIsUploadingHeroVideo(false);
      setHeroVideoFeedback(`❌ Upload error: ${err.message || 'Failed'}`);
      showToast(`❌ Video upload failed: ${err.message || 'Failed'}`);
    }
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const isCourse = isOrderCourse(o);
      if (orderCategoryTab === 'paintings' && isCourse) return false;
      if (orderCategoryTab === 'courses' && !isCourse) return false;

      const matchesSearch =
        o.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.items.some((it) => it.title.toLowerCase().includes(orderSearchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (orderFilter === 'all') return true;
      if (orderFilter === 'step1') return o.currentStep === 1;
      if (orderFilter === 'step2') return o.currentStep === 2;
      if (orderFilter === 'step3') return o.currentStep === 3;
      if (orderFilter === 'step4') return o.currentStep === 4;
      return true;
    });
  }, [orders, orderSearchQuery, orderFilter, orderCategoryTab]);

  // Filtered Artworks
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      let matchesCategory = true;
      if (artworkCategoryFilter !== 'All') {
        const cat = artworkCategoryFilter.toLowerCase();
        const med = (art.medium || '').toLowerCase();
        if (cat.includes('acrylic')) {
          matchesCategory = med.includes('acrylic');
        } else if (cat.includes('oil')) {
          matchesCategory = med.includes('oil');
        } else if (cat.includes('charcoal')) {
          matchesCategory = med.includes('charcoal');
        } else if (cat.includes('water')) {
          matchesCategory = med.includes('water');
        } else if (cat.includes('print')) {
          matchesCategory = med.includes('print');
        } else {
          matchesCategory = med === cat;
        }
      }
      const matchesSearch =
        art.title.toLowerCase().includes(artworkSearchQuery.toLowerCase()) ||
        art.subtitle.toLowerCase().includes(artworkSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [artworks, artworkCategoryFilter, artworkSearchQuery]);

  // Filtered Customer Inquiries
  const filteredInquiries = useMemo(() => {
    return (inquiries || []).filter((inq) => {
      const matchesFilter = inquiryFilter === 'all' || inq.status === inquiryFilter;
      const q = inquirySearchQuery.toLowerCase().trim();
      if (!q) return matchesFilter;
      const matchesSearch =
        (inq.name && inq.name.toLowerCase().includes(q)) ||
        (inq.phone && inq.phone.toLowerCase().includes(q)) ||
        (inq.email && inq.email.toLowerCase().includes(q)) ||
        (inq.subject && inq.subject.toLowerCase().includes(q)) ||
        (inq.message && inq.message.toLowerCase().includes(q)) ||
        (inq.city && inq.city.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [inquiries, inquiryFilter, inquirySearchQuery]);

  // Filtered Upcoming Courses
  const filteredUpcomingCourses = useMemo(() => {
    return (upcomingCourses || []).filter((c) => {
      const q = upcomingSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));
      const matchesCategory =
        upcomingCategoryFilter === 'All' ||
        (c.category && c.category.toLowerCase().includes(upcomingCategoryFilter.toLowerCase()));
      return matchesSearch && matchesCategory;
    });
  }, [upcomingCourses, upcomingSearchQuery, upcomingCategoryFilter]);

  const newInquiriesCount = useMemo(() => {
    return (inquiries || []).filter((i) => i.status === 'new').length;
  }, [inquiries]);

  const filteredTestimonials = useMemo(() => {
    return (reviews || []).filter((r) => {
      const q = testimonialSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.comment.toLowerCase().includes(q) ||
        (r.role && r.role.toLowerCase().includes(q)) ||
        (r.courseTaken && r.courseTaken.toLowerCase().includes(q)) ||
        (r.artworkAcquired && r.artworkAcquired.toLowerCase().includes(q)) ||
        (r.location && r.location.toLowerCase().includes(q));

      const matchesCategory =
        testimonialCategoryFilter === 'all' ||
        (testimonialCategoryFilter === 'student' && (r.category === 'student' || (!r.category && r.courseTaken))) ||
        (testimonialCategoryFilter === 'upcoming' && r.category === 'upcoming') ||
        (testimonialCategoryFilter === 'collector' && (r.category === 'collector' || (!r.category && r.artworkAcquired)));

      return matchesSearch && matchesCategory;
    });
  }, [reviews, testimonialSearchQuery, testimonialCategoryFilter]);

  const handleTestimonialImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setTestimonialForm((prev) => ({ ...prev, artworkImage: reader.result as string }));
        showToast('🖼️ Testimonial artwork image uploaded!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTestimonial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.name?.trim()) {
      showToast('Please enter author name');
      return;
    }
    if (!testimonialForm.comment?.trim()) {
      showToast('Please enter review comment');
      return;
    }

    const payload: CollectorReview = {
      id: editingTestimonial ? editingTestimonial.id : `rev-${Date.now()}`,
      name: testimonialForm.name.trim(),
      role: testimonialForm.role?.trim() || 'Fine Arts Scholar',
      location: testimonialForm.location?.trim() || 'Delhi, India',
      artworkImage: testimonialForm.artworkImage?.trim() || '',
      comment: testimonialForm.comment.trim(),
      verifiedPurchase: testimonialForm.verifiedPurchase !== false,
      category: testimonialForm.category || 'student',
      courseTaken: testimonialForm.courseTaken?.trim() || undefined,
      artworkAcquired: testimonialForm.artworkAcquired?.trim() || undefined,
      isActive: testimonialForm.isActive !== false
    };

    if (editingTestimonial) {
      updateReview(editingTestimonial.id, payload);
      showToast(`Testimonial by "${payload.name}" updated successfully!`);
    } else {
      addReview(payload);
      showToast(`New testimonial by "${payload.name}" published!`);
    }

    setIsTestimonialModalOpen(false);
    setEditingTestimonial(null);
  };

  const handleSaveTestimonialSectionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateArtistProfile({
      testimonialSectionTitle: testimonialSectionTitleInput.trim() || 'Upcoming Courses',
      testimonialSectionSubtitle: testimonialSectionSubtitleInput.trim() || 'Student Reviews & Atelier Experiences'
    });
    showToast('✅ Homepage Testimonial section titles updated live!');
  };

  const handleSaveUpcomingCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcomingForm.title?.trim()) {
      showToast('Please enter course title');
      return;
    }

    const payload: UpcomingCourse = {
      id: editingUpcomingCourse ? editingUpcomingCourse.id : `up-course-${Date.now()}`,
      title: upcomingForm.title.trim(),
      category: upcomingForm.category || 'Oil Painting Masterclass',
      badge: upcomingForm.badge?.trim() || 'Launching Soon • Limited 15 Seats',
      startDate: upcomingForm.startDate?.trim() || 'November 2026',
      duration: upcomingForm.duration?.trim() || '6 Weeks • 12 Live Sessions',
      level: upcomingForm.level || 'All Levels',
      price: Number(upcomingForm.price) || 0,
      originalPrice: upcomingForm.originalPrice ? Number(upcomingForm.originalPrice) : undefined,
      description: upcomingForm.description?.trim() || '',
      instructorQuote: upcomingForm.instructorQuote?.trim() || undefined,
      thumbnail: upcomingForm.thumbnail?.trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
      seatsTotal: Number(upcomingForm.seatsTotal) || 15,
      seatsLeft: Number(upcomingForm.seatsLeft) || 5,
      status: (upcomingForm.status as any) || 'open_for_booking',
      isActive: upcomingForm.isActive !== false,
      studentTestimonial: upcomingForm.studentTestimonial?.quote?.trim() ? {
        name: upcomingForm.studentTestimonial.name?.trim() || 'Fine Arts Scholar',
        role: upcomingForm.studentTestimonial.role?.trim() || 'Alumnus',
        avatar: upcomingForm.studentTestimonial.avatar?.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
        quote: upcomingForm.studentTestimonial.quote.trim(),
        rating: Number(upcomingForm.studentTestimonial.rating) || 5
      } : undefined
    };

    if (editingUpcomingCourse) {
      updateUpcomingCourse(editingUpcomingCourse.id, payload);
      showToast(`Upcoming course "${payload.title}" updated successfully!`);
    } else {
      addUpcomingCourse(payload);
      showToast(`New upcoming course "${payload.title}" published!`);
    }

    setIsUpcomingModalOpen(false);
    setEditingUpcomingCourse(null);
  };

  const handleArtworkImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingArtworkImages(true);
    const fileList = Array.from(files);

    const processImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1600;
              let width = img.width;
              let height = img.height;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
                return;
              }
              resolve(reader.result as string);
            };
            img.onerror = () => resolve(reader.result as string);
            img.src = reader.result as string;
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const results = await Promise.all(fileList.map(processImage));
      const validImages = results.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        setNewArtworkForm((prev) => {
          const currentList = [prev.image, ...(prev.detailImages || [])].filter(
            (url): url is string => Boolean(url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=12'))
          );
          const combined = [...currentList, ...validImages];
          return {
            ...prev,
            image: combined[0] || '',
            detailImages: combined.slice(1)
          };
        });
        showToast(`✅ ${validImages.length} image(s) uploaded!`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading images');
    } finally {
      setIsProcessingArtworkImages(false);
      e.target.value = '';
    }
  };

  const handleSetArtworkCoverImage = (index: number) => {
    setNewArtworkForm((prev) => {
      const all = [prev.image, ...(prev.detailImages || [])].filter(Boolean) as string[];
      if (index < 0 || index >= all.length) return prev;
      const target = all[index];
      const remaining = all.filter((_, i) => i !== index);
      return {
        ...prev,
        image: target,
        detailImages: remaining
      };
    });
    showToast('★ Primary cover photo updated!');
  };

  const handleRemoveArtworkImage = (index: number) => {
    setNewArtworkForm((prev) => {
      const all = [prev.image, ...(prev.detailImages || [])].filter(Boolean) as string[];
      const remaining = all.filter((_, i) => i !== index);
      return {
        ...prev,
        image: remaining[0] || '',
        detailImages: remaining.slice(1)
      };
    });
    showToast('Photo removed');
  };

  const handleAddArtworkImageUrl = () => {
    if (!artworkUrlInput.trim()) return;
    const url = artworkUrlInput.trim();
    setNewArtworkForm((prev) => {
      const all = [prev.image, ...(prev.detailImages || [])].filter(Boolean) as string[];
      const combined = [...all, url];
      return {
        ...prev,
        image: combined[0] || url,
        detailImages: combined.slice(1)
      };
    });
    setArtworkUrlInput('');
    showToast('Image URL added!');
  };

  const handleBulkPaintingsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBulkUploadingPaintings(true);
    const fileList = Array.from(files);
    showToast(`⏳ Uploading & processing ${fileList.length} painting(s)...`);

    let addedCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1600;
              let width = img.width;
              let height = img.height;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
                return;
              }
              resolve(reader.result as string);
            };
            img.onerror = () => resolve(reader.result as string);
            img.src = reader.result as string;
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });

      if (dataUrl) {
        const rawTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const formattedTitle = rawTitle.replace(/\b\w/g, (c) => c.toUpperCase());
        const newArt: Artwork = {
          id: `art-${Date.now()}-${i}`,
          title: formattedTitle || `Masterpiece ${artworks.length + i + 1}`,
          subtitle: 'Original Fine Art Oil / Canvas',
          year: new Date().getFullYear(),
          medium: 'Oil on Canvas',
          dimensions: '36 x 48 in (91 x 122 cm)',
          price: 95000,
          image: dataUrl,
          detailImages: [],
          description: 'Original fine art composition created in atelier.',
          story: 'Handcrafted with classical technique on archival linen.',
          framed: true,
          status: 'available',
          featured: false,
          paletteColors: ['#1A1816', '#C5A059', '#E63946'],
          varnishType: 'Archival Dammar Varnish'
        };
        addArtwork(newArt);
        addedCount++;
      }
    }

    setIsBulkUploadingPaintings(false);
    showToast(`🎉 ${addedCount} paintings uploaded directly to gallery catalog!`);
    e.target.value = '';
  };

  const handleSaveArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtworkForm.title?.trim()) {
      showToast('⚠️ Please enter painting title');
      return;
    }

    const allImages = [newArtworkForm.image, ...(newArtworkForm.detailImages || [])].filter(
      (url): url is string => Boolean(url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=12'))
    );

    if (allImages.length === 0) {
      showToast('⚠️ Please upload at least one painting photo');
      return;
    }

    const primaryImage = allImages[0];
    const detailImages = allImages.slice(1);

    if (artworkToEdit) {
      updateArtwork(artworkToEdit.id, {
        ...newArtworkForm,
        image: primaryImage,
        detailImages: detailImages
      });
      showToast(`Artwork "${newArtworkForm.title}" updated successfully!`);
      setArtworkToEdit(null);
    } else {
      const newId = 'art-' + Date.now();
      const newArt: Artwork = {
        id: newId,
        title: newArtworkForm.title.trim(),
        subtitle: newArtworkForm.subtitle?.trim() || 'Classical Atelier Original',
        year: Number(newArtworkForm.year) || 2026,
        medium: (newArtworkForm.medium as MediumType) || 'Oil on Canvas',
        dimensions: newArtworkForm.dimensions?.trim() || '36 x 48 in (91 x 122 cm)',
        price: newArtworkForm.price !== undefined && !isNaN(Number(newArtworkForm.price)) ? Number(newArtworkForm.price) : 95000,
        image: primaryImage,
        detailImages: detailImages,
        description: newArtworkForm.description?.trim() || '',
        story: newArtworkForm.story?.trim() || '',
        framed: Boolean(newArtworkForm.framed !== false),
        status: newArtworkForm.status || 'available',
        featured: Boolean(newArtworkForm.featured),
        paletteColors: ['#1A1816', '#C5A059', '#E63946'],
        varnishType: newArtworkForm.varnishType || 'Archival Dammar Varnish'
      };
      addArtwork(newArt);
      showToast(`Masterpiece "${newArt.title}" added to Atelier gallery!`);
    }
    setIsAddArtworkModalOpen(false);
  };

  const handleCreateNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = 'ORD_' + Math.floor(10000 + Math.random() * 90000);
    const newOrderRecord: OrderRecord = {
      id: newId,
      customerName: newOrderForm.customerName,
      customerEmail: newOrderForm.customerEmail || 'collector@kuldeepsingh.art',
      customerCity: newOrderForm.customerCity || 'New Delhi',
      date: newOrderForm.orderDate || 'Today',
      items: [
        {
          id: 'item-' + Date.now(),
          type: 'artwork',
          title: newOrderForm.paintingTitle,
          subtitle: newOrderForm.paintingMedium,
          price: Number(newOrderForm.totalAmount),
          image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
          quantity: 1
        }
      ],
      subtotal: Number(newOrderForm.totalAmount),
      discount: 0,
      shipping: 0,
      totalAmount: Number(newOrderForm.totalAmount),
      paymentMethod: 'Bank Wire / Direct Atelier Transfer',
      paymentStatus: 'Paid',
      orderStatus: 'Order Placed',
      currentStep: newOrderForm.currentStep,
      stepStatus: (['placed', 'accepted', 'dispatched', 'delivered'][newOrderForm.currentStep - 1] || 'placed') as 'placed' | 'accepted' | 'dispatched' | 'delivered',
      deliveryAddress: `${newOrderForm.customerCity}, India (Art Vault Delivery)`
    };

    addOrder(newOrderRecord);
    setIsNewOrderModalOpen(false);
    showToast(`Order #${newId} recorded in sales ledger!`);
  };

  // =========================================================
  // SIDE B: LIVE CLASSES & VIDEO LMS STATE & HANDLERS
  // =========================================================
  const [selectedLiveBatchId, setSelectedLiveBatchId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('ks_admin_selected_batch');
      if (saved) return saved;
    } catch (e) {
      console.warn(e);
    }
    return courses[0]?.id || 'course-oil-mastery';
  });

  useEffect(() => {
    if (selectedLiveBatchId) {
      try {
        localStorage.setItem('ks_admin_selected_batch', selectedLiveBatchId);
      } catch (e) {
        console.warn(e);
      }
    }
  }, [selectedLiveBatchId]);

  const activeCourse = courses.find((c) => c.id === selectedLiveBatchId) || courses[0];

  const [cloudLiveInfo, setCloudLiveInfo] = useState<{
    isLive: boolean;
    liveStreamUrl: string;
    courseId?: string | null;
    courseTitle?: string | null;
  } | null>(null);

  const [liveStreamUrl, setLiveStreamUrl] = useState<string>(
    activeCourse?.liveClassUrl || 'https://meet.google.com/ks-studio-atelier'
  );
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(
    activeCourse?.liveClassStatus === 'live'
  );

  // Sync initial live broadcast status from cloud backend
  useEffect(() => {
    fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/live')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setCloudLiveInfo(data);
          if (data.liveStreamUrl && (!activeCourse?.liveClassUrl || activeCourse?.id === data.courseId)) {
            setLiveStreamUrl(data.liveStreamUrl);
          }
        }
      })
      .catch((err) => console.warn('Could not fetch cloud live status:', err));
  }, []);

  // Update controls whenever selected batch changes or cloudLiveInfo updates
  useEffect(() => {
    if (activeCourse) {
      if (activeCourse.liveClassUrl) {
        setLiveStreamUrl(activeCourse.liveClassUrl);
      }
      const isBatchLive =
        activeCourse.liveClassStatus === 'live' ||
        Boolean(cloudLiveInfo?.isLive && cloudLiveInfo?.courseId === activeCourse.id);
      setIsLiveBroadcasting(isBatchLive);
    }
  }, [selectedLiveBatchId, activeCourse?.id, activeCourse?.liveClassStatus, cloudLiveInfo]);

  const handleToggleBroadcast = async () => {
    const willBeLive = !isLiveBroadcasting;
    setIsLiveBroadcasting(willBeLive);

    const targetCourseId = willBeLive ? (activeCourse ? activeCourse.id : null) : null;
    const targetCourseTitle = willBeLive ? (activeCourse ? activeCourse.title : null) : null;

    setCloudLiveInfo({
      isLive: willBeLive,
      liveStreamUrl: liveStreamUrl,
      courseId: targetCourseId,
      courseTitle: targetCourseTitle
    });

    try {
      await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLive: willBeLive,
          liveStreamUrl: liveStreamUrl,
          courseId: targetCourseId,
          courseTitle: targetCourseTitle
        })
      });
    } catch (e) {
      console.error('Failed to sync live broadcast to cloud:', e);
    }

    if (activeCourse) {
      if (willBeLive) {
        courses.forEach((c) => {
          if (c.id === activeCourse.id) {
            updateCourse(c.id, {
              liveClassStatus: 'live',
              liveClassUrl: liveStreamUrl
            });
          } else if (c.liveClassStatus === 'live') {
            updateCourse(c.id, {
              liveClassStatus: 'offline'
            });
          }
        });
      } else {
        updateCourse(activeCourse.id, {
          liveClassStatus: 'offline',
          liveClassUrl: liveStreamUrl
        });
      }
    }

    showToast(
      willBeLive
        ? `🔴 Live Broadcast ON AIR for "${activeCourse?.title || 'Selected Course'}"! Google Meet active for enrolled students.`
        : `Live Broadcast ended for "${activeCourse?.title || 'Course'}".`
    );
  };

  const handleUpdateLiveUrl = async () => {
    try {
      await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLive: isLiveBroadcasting,
          liveStreamUrl: liveStreamUrl,
          courseId: isLiveBroadcasting ? (activeCourse ? activeCourse.id : null) : null,
          courseTitle: isLiveBroadcasting ? (activeCourse ? activeCourse.title : null) : null
        })
      });
      if (activeCourse) {
        updateCourse(activeCourse.id, { liveClassUrl: liveStreamUrl });
      }
      showToast('✅ Google Meet link saved and updated for all students!');
    } catch (e) {
      console.error('Error saving live link:', e);
      showToast('⚠️ Could not update link to cloud.');
    }
  };

  // Schedule & Edit Live Batch Modal State
  const [isNewBatchModalOpen, setIsNewBatchModalOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [categorySelect, setCategorySelect] = useState<string>('Oil Painting');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [batchImageUrlInput, setBatchImageUrlInput] = useState('');
  const [newBatchForm, setNewBatchForm] = useState<{
    title: string;
    startDate: string;
    schedule: string;
    price: number;
    durationMonths: string;
    maxSeats: number;
    thumbnail: string;
    images: string[];
    liveClassUrl: string;
    summary: string;
    whatYouWillLearn: string[];
    materialsNeeded: string[];
  }>({
    title: '',
    startDate: '22 Oct, 2026',
    schedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    price: 9999,
    durationMonths: '1 Month',
    maxSeats: 25,
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
    images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop'],
    liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
    summary: 'Direct atelier mentorship, live easel demonstration and critique with Artist Kuldeep Singh.',
    whatYouWillLearn: [
      'Live Real-Time Easel Demonstrations',
      'Direct 1-on-1 Critique & Q&A Rooms',
      'Permanent Access to HD Class Recordings & Archives'
    ],
    materialsNeeded: [
      'Linseed Oil & Turpentine',
      'Raw Pigments & Oil Paints',
      'Belgian Stretched Linen'
    ]
  });

  const STANDARD_CATEGORIES = [
    'Oil Painting',
    'Realistic Sketching',
    'Watercolor & Fluid',
    'Color Theory',
    'Acrylic Painting'
  ];

  const handleOpenNewBatch = () => {
    setCourseToEdit(null);
    setCategorySelect('Oil Painting');
    setCustomCategory('');
    setBatchImageUrlInput('');
    setNewBatchForm({
      title: '',
      startDate: '22 Oct, 2026',
      schedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
      price: 9999,
      durationMonths: '1 Month',
      maxSeats: 25,
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
      images: ['https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop'],
      liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
      summary: 'Direct atelier mentorship, live easel demonstration and critique with Artist Kuldeep Singh.',
      whatYouWillLearn: [
        'Live Real-Time Easel Demonstrations',
        'Direct 1-on-1 Critique & Q&A Rooms',
        'Permanent Access to HD Class Recordings & Archives'
      ],
      materialsNeeded: [
        'Linseed Oil & Turpentine',
        'Raw Pigments & Oil Paints',
        'Belgian Stretched Linen'
      ]
    });
    setIsNewBatchModalOpen(true);
  };

  const handleOpenEditBatch = (course: Course) => {
    setCourseToEdit(course);
    if (STANDARD_CATEGORIES.includes(course.category)) {
      setCategorySelect(course.category);
      setCustomCategory('');
    } else {
      setCategorySelect('Other');
      setCustomCategory(course.category || '');
    }
    setBatchImageUrlInput('');
    const rawImages = Array.isArray(course.images) && course.images.length > 0
      ? course.images
      : (course.thumbnail ? [course.thumbnail] : []);
    setNewBatchForm({
      title: course.title,
      startDate: course.startDate || '22 Oct, 2026',
      schedule: course.schedule || 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
      price: course.price,
      durationMonths: course.durationMonths || '1 Month',
      maxSeats: 25,
      thumbnail: rawImages[0] || course.thumbnail || '',
      images: rawImages,
      liveClassUrl: course.liveClassUrl || 'https://meet.google.com/ks-studio-atelier',
      summary: course.summary || course.description || '',
      whatYouWillLearn: Array.isArray(course.whatYouWillLearn) && course.whatYouWillLearn.length > 0
        ? [...course.whatYouWillLearn]
        : [
            'Live Real-Time Easel Demonstrations',
            'Direct 1-on-1 Critique & Q&A Rooms',
            'Permanent Access to HD Class Recordings & Archives'
          ],
      materialsNeeded: Array.isArray(course.materialsNeeded) && course.materialsNeeded.length > 0
        ? [...course.materialsNeeded]
        : [
            'Linseed Oil & Turpentine',
            'Raw Pigments & Oil Paints',
            'Belgian Stretched Linen'
          ]
    });
    setIsNewBatchModalOpen(true);
  };

  const handleMultipleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const processImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const img = new Image();
            img.onload = () => {
              const maxDim = 1200;
              let width = img.width;
              let height = img.height;
              if (width > maxDim || height > maxDim) {
                if (width > height) {
                  height = Math.round((height * maxDim) / width);
                  width = maxDim;
                } else {
                  width = Math.round((width * maxDim) / height);
                  height = maxDim;
                }
              }
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
                return;
              }
              resolve(reader.result as string);
            };
            img.onerror = () => resolve(reader.result as string);
            img.src = reader.result as string;
          } else {
            resolve('');
          }
        };
        reader.readAsDataURL(file);
      });
    };

    try {
      const results = await Promise.all(fileList.map(processImage));
      const validImages = results.filter((img) => Boolean(img));
      if (validImages.length > 0) {
        setNewBatchForm((prev) => {
          const updated = [...prev.images, ...validImages];
          return {
            ...prev,
            images: updated,
            thumbnail: prev.thumbnail || updated[0]
          };
        });
        showToast(`✅ ${validImages.length} image(s) uploaded successfully!`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error uploading images');
    }
    e.target.value = '';
  };

  const handleAddBatchImageUrl = () => {
    if (!batchImageUrlInput.trim()) return;
    const url = batchImageUrlInput.trim();
    setNewBatchForm((prev) => {
      const updated = [...prev.images, url];
      return {
        ...prev,
        images: updated,
        thumbnail: prev.thumbnail || updated[0]
      };
    });
    setBatchImageUrlInput('');
    showToast('✅ Image URL added to gallery!');
  };

  const handleRemoveBatchImage = (indexToRemove: number) => {
    setNewBatchForm((prev) => {
      const updated = prev.images.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        images: updated,
        thumbnail: updated[0] || ''
      };
    });
    showToast('Image removed from batch');
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setNewBatchForm((prev) => {
      const target = prev.images[indexToPrimary];
      const remaining = prev.images.filter((_, idx) => idx !== indexToPrimary);
      const reordered = [target, ...remaining];
      return {
        ...prev,
        images: reordered,
        thumbnail: target
      };
    });
    showToast('Set as main banner');
  };

  const handleCreateLiveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchForm.title.trim()) {
      showToast('Please enter a batch/course title');
      return;
    }

    const finalCategory =
      categorySelect === 'Other'
        ? (customCategory.trim() || 'Fine Art')
        : categorySelect;

    const finalImages = newBatchForm.images.length > 0 
      ? newBatchForm.images 
      : (newBatchForm.thumbnail ? [newBatchForm.thumbnail] : []);
    const primaryThumbnail = finalImages[0] || newBatchForm.thumbnail || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop';

    const cleanWhatYouWillLearn = (newBatchForm.whatYouWillLearn || [])
      .map((s) => s.trim())
      .filter(Boolean);
    const cleanMaterialsNeeded = (newBatchForm.materialsNeeded || [])
      .map((s) => s.trim())
      .filter(Boolean);

    if (courseToEdit) {
      updateCourse(courseToEdit.id, {
        title: newBatchForm.title,
        startDate: newBatchForm.startDate,
        schedule: newBatchForm.schedule,
        category: finalCategory,
        price: Number(newBatchForm.price),
        durationMonths: newBatchForm.durationMonths,
        thumbnail: primaryThumbnail,
        images: finalImages,
        liveClassUrl: newBatchForm.liveClassUrl,
        summary: newBatchForm.summary,
        description: newBatchForm.summary,
        whatYouWillLearn: cleanWhatYouWillLearn.length > 0 ? cleanWhatYouWillLearn : [
          'Live Real-Time Easel Demonstrations',
          'Direct 1-on-1 Critique & Q&A Rooms',
          'Permanent Access to HD Class Recordings & Archives'
        ],
        materialsNeeded: cleanMaterialsNeeded.length > 0 ? cleanMaterialsNeeded : [
          'Linseed Oil & Turpentine',
          'Raw Pigments & Oil Paints',
          'Belgian Stretched Linen'
        ]
      });
      showToast(`Batch "${newBatchForm.title}" updated successfully!`);
      setCourseToEdit(null);
    } else {
      const newBatchId = 'course-batch-' + Date.now();
      const newBatch: Course = {
        id: newBatchId,
        title: newBatchForm.title,
        subtitle: `${finalCategory} • Live Atelier Batch`,
        level: 'All Levels',
        category: finalCategory,
        durationHours: 36,
        durationMonths: newBatchForm.durationMonths,
        schedule: newBatchForm.schedule,
        startDate: newBatchForm.startDate,
        mode: 'Live Studio Broadcast + HD Video Recordings',
        certification: 'Kuldeep Singh Atelier Master Diploma',
        totalLessons: 0,
        price: Number(newBatchForm.price),
        originalPrice: Number(newBatchForm.price) * 1.5,
        rating: 5.0,
        studentsEnrolled: 0,
        thumbnail: primaryThumbnail,
        images: finalImages,
        summary: newBatchForm.summary,
        description: newBatchForm.summary,
        whatYouWillLearn: cleanWhatYouWillLearn.length > 0 ? cleanWhatYouWillLearn : [
          'Live Real-Time Easel Demonstrations',
          'Direct 1-on-1 Critique & Q&A Rooms',
          'Permanent Access to HD Class Recordings & Archives'
        ],
        materialsNeeded: cleanMaterialsNeeded.length > 0 ? cleanMaterialsNeeded : [
          'Linseed Oil & Turpentine',
          'Raw Pigments & Oil Paints',
          'Belgian Stretched Linen'
        ],
        modules: [
          {
            id: `mod-${Date.now()}-1`,
            title: 'Module 1: Foundations & Live Orientation',
            duration: '2 Weeks',
            lessonsCount: 0,
            topics: [],
            lectures: []
          }
        ],
        liveClassUrl: newBatchForm.liveClassUrl,
        liveClassStatus: 'offline'
      };

      addCourse(newBatch);
      setSelectedLiveBatchId(newBatchId);
      showToast(`🎉 New Live Batch "${newBatch.title}" scheduled for ${newBatch.startDate}!`);
    }

    setIsNewBatchModalOpen(false);
  };

  // Upload Video Lecture Modal State
  const [isAddLectureModalOpen, setIsAddLectureModalOpen] = useState(false);
  const [previewingLecture, setPreviewingLecture] = useState<CourseLecture | null>(null);
  const [targetCourseIdForUpload, setTargetCourseIdForUpload] = useState<string>('');
  const [targetModuleIndexForAdd, setTargetModuleIndexForAdd] = useState(0);
  const [lectureForm, setLectureForm] = useState<{
    title: string;
    duration: string;
    videoUrl: string;
    summary: string;
    accessType: 'enrolled' | 'free';
  }>({
    title: '',
    duration: '45 Mins',
    videoUrl: '',
    summary: '',
    accessType: 'enrolled'
  });

  const [videoUploadSource, setVideoUploadSource] = useState<'file' | 'link'>('file');
  const [selectedVideoFile, setSelectedVideoFile] = useState<{
    name: string;
    size: string;
    sizeBytes: number;
    previewUrl?: string;
  } | null>(null);
  const [isProcessingVideoFile, setIsProcessingVideoFile] = useState(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadedBytesStr, setUploadedBytesStr] = useState<string>('');
  const [uploadSpeedStr, setUploadSpeedStr] = useState<string>('');
  const [currentTusUpload, setCurrentTusUpload] = useState<tus.Upload | null>(null);

  const handleVideoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    const sizeStr = sizeMb >= 1024 ? (sizeMb / 1024).toFixed(2) + ' GB' : sizeMb.toFixed(1) + ' MB';
    const preview = URL.createObjectURL(file);

    setSelectedVideoFile({
      name: file.name,
      size: sizeStr,
      sizeBytes: file.size,
      previewUrl: preview
    });

    const isWhatsAppOrNumber = /whatsapp|^\d+$/i.test(file.name.replace(/\.[^/.]+$/, '').trim());
    const cleanTitle = isWhatsAppOrNumber
      ? `Lecture Session (${new Date().toLocaleDateString('en-GB')})`
      : file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]+/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

    const titleToUse = lectureForm.title.trim() || cleanTitle;
    if (!lectureForm.title.trim()) {
      setLectureForm((prev) => ({ ...prev, title: cleanTitle }));
    }

    setIsProcessingVideoFile(true);
    setUploadProgressPercent(0);
    setUploadedBytesStr(`0 MB / ${sizeStr}`);
    setUploadSpeedStr('');
    showToast(`⏳ Connecting directly to Bunny.net for "${file.name}" (${sizeStr})...`);

    try {
      // 1. Get Direct TUS Upload Token from Backend
      let tokenRes: Response;
      try {
        tokenRes = await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/upload/bunny-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleToUse })
        });
        if (!tokenRes.ok) throw new Error('Remote token generation failed');
      } catch {
        tokenRes = await fetch('http://localhost:5000/api/upload/bunny-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: titleToUse })
        });
      }

      if (!tokenRes.ok) {
        const err = await tokenRes.json().catch(() => ({}));
        throw new Error(err.details || err.error || `Token request failed status ${tokenRes.status}`);
      }

      const authData = await tokenRes.json();
      const { libraryId, videoId, expiration, signature, embedUrl } = authData;

      let lastLoaded = 0;
      let lastTime = Date.now();

      // 2. Direct TUS Resumable Upload Straight From Browser into Bunny.net CDN
      // Optimized 25MB chunk size for high-throughput bandwidth saturation
      const upload = new tus.Upload(file, {
        endpoint: 'https://video.bunnycdn.com/tusupload',
        chunkSize: 25 * 1024 * 1024, // 25 MB chunks eliminate HTTP round-trip latency
        retryDelays: [0, 1000, 3000, 5000],
        headers: {
          AuthorizationSignature: signature,
          AuthorizationExpire: expiration.toString(),
          LibraryId: libraryId.toString(),
          VideoId: videoId
        },
        metadata: {
          filename: file.name,
          filetype: file.type || 'video/mp4',
          title: titleToUse
        },
        onError: (error) => {
          console.error('Bunny TUS Direct Upload Error:', error);
          setIsProcessingVideoFile(false);
          showToast(`❌ Bunny.net upload error: ${error.message}`);
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percent = Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100));
          const uploadedMb = (bytesUploaded / (1024 * 1024)).toFixed(1);
          const totalMb = (bytesTotal / (1024 * 1024)).toFixed(1);
          const now = Date.now();
          const timeDiff = (now - lastTime) / 1000;
          if (timeDiff >= 0.8) {
            const bytesDiff = bytesUploaded - lastLoaded;
            const bytesPerSec = bytesDiff / timeDiff;
            const speedMb = (bytesPerSec / (1024 * 1024)).toFixed(1);
            const remainingBytes = bytesTotal - bytesUploaded;
            const remainingSec = bytesPerSec > 0 ? Math.round(remainingBytes / bytesPerSec) : 0;
            const eta = remainingSec > 60 ? `${Math.ceil(remainingSec / 60)}m left` : `${remainingSec}s left`;
            setUploadSpeedStr(`${speedMb} MB/s (${eta})`);
            lastLoaded = bytesUploaded;
            lastTime = now;
          }
          setUploadProgressPercent(percent);
          setUploadedBytesStr(`${uploadedMb} MB / ${totalMb} MB`);
        },
        onSuccess: async () => {
          setIsProcessingVideoFile(false);
          setUploadProgressPercent(100);

          const finalTitle = lectureForm.title.trim() || titleToUse || file.name.replace(/\.[^/.]+$/, '');
          const finalCourseId = targetCourseIdForUpload || selectedLiveBatchId || (courses[0]?.id);
          const isFree = lectureForm.accessType === 'free';
          const finalVideoUrl = embedUrl || `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;

          const newLec: CourseLecture = {
            id: `lec-${Date.now()}`,
            title: finalTitle,
            duration: lectureForm.duration?.trim() || '45 Mins',
            videoUrl: finalVideoUrl,
            summary: lectureForm.summary?.trim() || (isFree ? 'Free introductory trailer & demonstration.' : 'Master practical demonstration by Artist Kuldeep Singh.'),
            accessType: lectureForm.accessType || 'enrolled',
            isFreePreview: isFree
          };

          if (finalCourseId) {
            await addLectureToModule(finalCourseId, targetModuleIndexForAdd, newLec);
          }

          // Automatically close modal immediately so user does not have to wait or wonder
          setIsAddLectureModalOpen(false);
          setSelectedVideoFile(null);
          setUploadProgressPercent(0);
          setUploadedBytesStr('');
          setUploadSpeedStr('');
          setLectureForm({ title: '', duration: '45 Mins', videoUrl: '', summary: '', accessType: 'enrolled' });

          showToast(`🎉 100% Uploaded & Saved! Lecture "${finalTitle}" is now live in Admin!`);
        }
      });

      setCurrentTusUpload(upload);
      upload.start();
    } catch (err: any) {
      console.warn('Bunny Stream lecture upload error:', err);
      showToast(`⚠️ Direct Bunny upload error: ${err.message}. You can paste a YouTube / Google Drive / MP4 link.`);
      setIsProcessingVideoFile(false);
      setLectureForm((prev) => ({ ...prev, videoUrl: preview }));
    }
  };

  const handleOpenAddLectureModal = (courseId?: string, moduleIndex: number = 0) => {
    const cId = courseId || selectedLiveBatchId || (courses.length > 0 ? courses[0].id : '');
    setTargetCourseIdForUpload(cId);
    setTargetModuleIndexForAdd(moduleIndex);
    setVideoUploadSource('file');
    setSelectedVideoFile(null);
    setIsProcessingVideoFile(false);
    setLectureForm({
      title: '',
      duration: '45 Mins',
      videoUrl: '',
      summary: '',
      accessType: 'enrolled'
    });
    setIsAddLectureModalOpen(true);
  };

  const handleSaveLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessingVideoFile) {
      showToast('⏳ Video is still uploading. Please wait until 100%...');
      return;
    }
    const finalTitle = lectureForm.title.trim() || selectedVideoFile?.name?.replace(/\.[^/.]+$/, '') || 'Master Class Video Lecture';
    const finalVideoUrl = lectureForm.videoUrl.trim() || selectedVideoFile?.previewUrl;
    if (!finalVideoUrl) {
      showToast('Please provide a video file or paste a video URL');
      return;
    }
    const finalCourseId = targetCourseIdForUpload || selectedLiveBatchId || (courses[0]?.id);
    if (!finalCourseId) {
      showToast('Please select a course to attach the lecture to.');
      return;
    }

    const isFree = lectureForm.accessType === 'free';
    const newLec: CourseLecture = {
      id: `lec-${Date.now()}`,
      title: finalTitle,
      duration: lectureForm.duration.trim() || '45 Mins',
      videoUrl: finalVideoUrl,
      summary: lectureForm.summary.trim() || (isFree ? 'Free introductory trailer & demonstration.' : 'Master practical demonstration by Artist Kuldeep Singh.'),
      accessType: lectureForm.accessType,
      isFreePreview: isFree
    };

    // Close modal immediately so UI does not stay stuck
    setIsAddLectureModalOpen(false);
    setSelectedVideoFile(null);
    setUploadProgressPercent(0);
    setLectureForm({ title: '', duration: '45 Mins', videoUrl: '', summary: '', accessType: 'enrolled' });

    await addLectureToModule(finalCourseId, targetModuleIndexForAdd, newLec);
    showToast(`✅ Video Lecture "${newLec.title}" saved as ${isFree ? 'Free Preview / Trailer' : 'Enrolled Access'}!`);
  };

  // Edit Lecture Modal State
  const [isEditLectureModalOpen, setIsEditLectureModalOpen] = useState(false);
  const [lectureToEdit, setLectureToEdit] = useState<{
    courseId: string;
    moduleIndex: number;
    lectureIndex: number;
    lecture: CourseLecture;
  } | null>(null);
  const [editLectureForm, setEditLectureForm] = useState({
    title: '',
    duration: '',
    videoUrl: '',
    summary: '',
    accessType: 'enrolled' as 'enrolled' | 'free'
  });

  const handleOpenEditLecture = (courseId: string, moduleIndex: number, lectureIndex: number, lec: CourseLecture) => {
    setLectureToEdit({ courseId, moduleIndex, lectureIndex, lecture: lec });
    setEditLectureForm({
      title: lec.title || '',
      duration: lec.duration || '45 Mins',
      videoUrl: lec.videoUrl || '',
      summary: lec.summary || '',
      accessType: lec.accessType || (lec.isFreePreview ? 'free' : 'enrolled')
    });
    setIsEditLectureModalOpen(true);
  };

  const handleSaveEditedLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lectureToEdit) return;
    const finalTitle = editLectureForm.title.trim() || 'Master Class Video Lecture';
    const isFree = editLectureForm.accessType === 'free';
    
    await updateLectureInModule(lectureToEdit.courseId, lectureToEdit.moduleIndex, lectureToEdit.lectureIndex, {
      title: finalTitle,
      duration: editLectureForm.duration.trim() || '45 Mins',
      videoUrl: editLectureForm.videoUrl.trim() || lectureToEdit.lecture.videoUrl,
      summary: editLectureForm.summary.trim() || (isFree ? 'Free introductory trailer & demonstration.' : 'Master practical demonstration by Artist Kuldeep Singh.'),
      accessType: editLectureForm.accessType,
      isFreePreview: isFree
    });

    setIsEditLectureModalOpen(false);
    setLectureToEdit(null);
    showToast(`✅ Video Lecture updated to "${finalTitle}"!`);
  };

  // Grant Student Access Modal State
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({
    name: '',
    email: '',
    phone: '',
    courseId: selectedLiveBatchId
  });

  // Attendance Toggle
  const handleToggleAttendance = (studentId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'Attended' ? 'Absent' : 'Attended';
    updateStudent(studentId, { attendanceStatus: nextStatus });
    showToast(`Attendance updated: ${nextStatus === 'Attended' ? '🟢 Present (Attended)' : '⚪ Absent'}`);
  };

  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // User Accounts & Password Management States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [visibleUserPasswords, setVisibleUserPasswords] = useState<Record<string, boolean>>({});
  const [visibleStudentPasswords, setVisibleStudentPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'collector' | 'admin'
  });
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<EnrolledStudent | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    name: '',
    email: '',
    username: '',
    plainPassword: '',
    courseId: '',
    courseTitle: '',
    feesPaid: 349,
    batchSchedule: '',
    phone: ''
  });
  const [isEditStudentModalOpen, setIsEditStudentModalOpen] = useState(false);

  const handleCopyPassword = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    showToast('🔑 Password copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const renderTestimonialsTabContent = () => (
    <div className="space-y-6">
      {/* 1. Header & Live Section Title Settings */}
      <div className="bg-[#161920] p-6 rounded-2xl border border-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <h3 className="font-serif font-bold text-2xl text-white">Collector & Student Testimonials Management</h3>
            </div>
            <p className="text-xs text-gray-400 max-w-2xl">
              Manage student reviews, upcoming course anticipation testimonials, and art collector feedback displayed on the live website homepage. Customize the section heading, review quotes, star ratings, and student details.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingTestimonial(null);
              setTestimonialForm({
                name: '',
                role: 'Student & Fine Arts Scholar',
                location: 'Delhi, India',
                artworkImage: '',
                comment: '',
                verifiedPurchase: true,
                category: 'upcoming',
                courseTaken: '',
                artworkAcquired: '',
                isActive: true
              });
              setIsTestimonialModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Testimonial</span>
          </button>
        </div>

        {/* Live Section Title Customization Form */}
        <form onSubmit={handleSaveTestimonialSectionSettings} className="pt-4 border-t border-gray-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              Homepage Section Main Title:
            </label>
            <input
              type="text"
              value={testimonialSectionTitleInput}
              onChange={(e) => setTestimonialSectionTitleInput(e.target.value)}
              placeholder="e.g. Collector & Student Testimonials or Upcoming Courses"
              className="w-full bg-[#101216] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-[11px] font-semibold text-gray-300 mb-1">
              Top Subtitle / Tagline:
            </label>
            <input
              type="text"
              value={testimonialSectionSubtitleInput}
              onChange={(e) => setTestimonialSectionSubtitleInput(e.target.value)}
              placeholder="e.g. Acclaimed by Patrons & Academy Scholars"
              className="w-full bg-[#101216] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2 bg-[#222834] hover:bg-gray-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Titles</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
          <span className="text-xs text-gray-400 block font-medium">Total Testimonials</span>
          <span className="text-2xl font-bold text-white mt-1 block">{reviews.length}</span>
        </div>
        <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
          <span className="text-xs text-gray-400 block font-medium">Active on Homepage</span>
          <span className="text-2xl font-bold text-emerald-400 mt-1 block">
            {reviews.filter((r) => r.isActive !== false).length}
          </span>
        </div>
        <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
          <span className="text-xs text-gray-400 block font-medium">Student & Upcoming Scholars</span>
          <span className="text-2xl font-bold text-amber-400 mt-1 block">
            {reviews.filter((r) => r.category === 'student' || r.category === 'upcoming' || r.courseTaken).length}
          </span>
        </div>
        <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
          <span className="text-xs text-gray-400 block font-medium">Art Collectors</span>
          <span className="text-2xl font-bold text-purple-400 mt-1 block">
            {reviews.filter((r) => r.category === 'collector' || r.artworkAcquired).length}
          </span>
        </div>
      </div>

      {/* 3. Search and Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161920] p-3 rounded-xl border border-gray-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reviews by name, quote, course, or location..."
            value={testimonialSearchQuery}
            onChange={(e) => setTestimonialSearchQuery(e.target.value)}
            className="w-full bg-[#101216] border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: `All (${reviews.length})` },
            { id: 'student', label: `Student Reviews (${reviews.filter((r) => r.category === 'student' || (!r.category && r.courseTaken)).length})` },
            { id: 'upcoming', label: `Upcoming Batch (${reviews.filter((r) => r.category === 'upcoming').length})` },
            { id: 'collector', label: `Collectors (${reviews.filter((r) => r.category === 'collector' || (!r.category && r.artworkAcquired)).length})` }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setTestimonialCategoryFilter(cat.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                testimonialCategoryFilter === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-[#101216] text-gray-400 hover:text-white border border-gray-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Testimonials Cards Grid */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-[#161920] p-12 text-center rounded-2xl border border-gray-800">
          <Star className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-gray-300">No testimonials match your filter.</p>
          <p className="text-xs text-gray-500 mt-1">Click &quot;+ Add New Testimonial&quot; to publish a new scholar review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((r) => (
            <div
              key={r.id}
              className={`bg-[#161920] rounded-2xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                r.isActive !== false ? 'border-gray-800 hover:border-gray-700' : 'border-red-900/40 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Quote className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
                      {r.category === 'upcoming'
                        ? 'Upcoming Course'
                        : r.category === 'student' || r.courseTaken
                        ? 'Student Alumnus'
                        : 'Art Collector'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {r.isActive !== false ? 'Live' : 'Hidden'}
                    </span>
                  </div>
                </div>

                {/* Optional Attached Artwork / Slide Image Preview */}
                {r.artworkImage && (
                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-black/60 border border-gray-800 my-1 group">
                    <img src={r.artworkImage} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-1 right-1.5 text-[9px] bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded text-amber-300 font-mono border border-white/10">
                      Slide Visual
                    </span>
                  </div>
                )}

                <p className="text-xs text-gray-300 italic leading-relaxed">
                  &quot;{r.comment}&quot;
                </p>

                {(r.courseTaken || r.artworkAcquired) && (
                  <div className="pt-1">
                    <span className="inline-block text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {r.courseTaken ? `🎓 ${r.courseTaken}` : `🎨 Acquired: ${r.artworkAcquired}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500/25 to-amber-700/35 border border-amber-500/40 flex items-center justify-center text-amber-300 font-serif font-bold text-xs shrink-0 shadow-sm">
                    {r.name ? r.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : '★'}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white leading-tight">{r.name}</h5>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                      {r.role} {r.location ? `• ${r.location}` : ''}
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      updateReview(r.id, { isActive: !r.isActive });
                      showToast(r.isActive !== false ? 'Testimonial hidden from website' : 'Testimonial is now live on website!');
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                      r.isActive !== false
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                        : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30'
                    }`}
                  >
                    {r.isActive !== false ? 'Hide' : 'Publish'}
                  </button>

                  <button
                    onClick={() => {
                      setEditingTestimonial(r);
                      setTestimonialForm({
                        ...r,
                        category: r.category || (r.courseTaken ? 'student' : 'collector'),
                        isActive: r.isActive !== false
                      });
                      setIsTestimonialModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded bg-[#242934] hover:bg-gray-700 text-amber-300 hover:text-white border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Edit Testimonial & Image"
                  >
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Delete testimonial by "${r.name}"?`)) {
                        deleteReview(r.id);
                        showToast(`Testimonial by "${r.name}" deleted.`);
                      }
                    }}
                    className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                    title="Delete Testimonial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0C0E12] text-[#E1E4EA] font-sans flex flex-col antialiased selection:bg-[#FF5722] selection:text-white">
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
      {/* TOP HEADER: BRAND + 2-SIDE MASTER SWITCH                  */}
      {/* ========================================================= */}
      <header className="bg-[#111318] border-b border-[#1B1F27] px-4 sm:px-8 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-xl">
        {/* Brand */}
        <div className="flex items-center gap-3">
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
            <div className="text-[9px] uppercase tracking-[0.25em] text-gray-500 font-bold">
              Artist Master Console
            </div>
          </div>
        </div>

        {/* 2-SIDE MASTER TOGGLE SWITCH */}
        <div className="flex items-center bg-[#0C0E12] p-1.5 rounded-2xl border border-[#232732] shadow-inner">
          <button
            onClick={() => setAdminMode('gallery')}
            className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminMode === 'gallery'
                ? 'bg-gradient-to-r from-[#FF5722] to-[#FF7A45] text-white shadow-lg shadow-[#FF5722]/30'
                : 'text-gray-400 hover:text-white hover:bg-[#181C24]'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>🎨 Side 1: Art Gallery & Sales</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              adminMode === 'gallery' ? 'bg-black/30 text-white' : 'bg-[#181C24] text-gray-400'
            }`}>
              {artworks.length} Art • {orders.length} Orders
            </span>
          </button>

          <button
            onClick={() => setAdminMode('academy')}
            className={`flex items-center gap-2.5 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              adminMode === 'academy'
                ? 'bg-gradient-to-r from-red-600 to-[#FF5722] text-white shadow-lg shadow-red-500/30'
                : 'text-gray-400 hover:text-white hover:bg-[#181C24]'
            }`}
          >
            <Radio className={`w-4 h-4 ${isLiveBroadcasting ? 'text-white animate-pulse' : ''}`} />
            <span>🎥 Side 2: Live Académie & Courses</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              adminMode === 'academy' ? 'bg-black/30 text-white' : 'bg-[#181C24] text-gray-400'
            }`}>
              {courses.length} Batches • {students.length} Students
            </span>
          </button>
        </div>

        {/* Right Quick Controls */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.artistkuldeepsingh.com/#student-portal"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-[#181C24] hover:bg-[#202530] text-gray-300 hover:text-white text-xs font-medium border border-gray-700/60 transition-colors flex items-center gap-1.5"
          >
            <span>Preview Student Website</span>
            <ExternalLink className="w-3 h-3 text-[#FF5722]" />
          </a>

          <button
            onClick={adminLogout}
            className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-gray-800 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN LAYOUT (Sidebar + Content)                           */}
      {/* ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#111318] border-r border-[#1B1F27] flex flex-col justify-between shrink-0 select-none p-4 space-y-4">
          <div className="space-y-4">
            {/* Active Mode Tag */}
            <div className="px-3 py-2 rounded-xl bg-[#161920] border border-[#232732] text-xs">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Active Console Mode:
              </span>
              <span className="font-bold text-sm text-white flex items-center gap-1.5 mt-0.5">
                {adminMode === 'gallery' ? '🎨 Art Gallery Studio' : '🎥 Live Académie LMS'}
              </span>
            </div>

            {/* Navigation links based on activeMode */}
            <nav className="space-y-1 text-xs">
              {adminMode === 'gallery' ? (
                <>
                  <button
                    onClick={() => setGalleryNav('orders')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'orders'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className={`w-4 h-4 ${galleryNav === 'orders' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Live Orders & Sales</span>
                    </div>
                    <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setGalleryNav('artworks')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'artworks'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Palette className={`w-4 h-4 ${galleryNav === 'artworks' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Artworks Catalog</span>
                    </div>
                    <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {artworks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setGalleryNav('hero')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'hero'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className={`w-4 h-4 ${galleryNav === 'hero' ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>Homepage Hero Video</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {heroType}
                    </span>
                  </button>

                  <button
                    onClick={() => setGalleryNav('inquiries')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'inquiries'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className={`w-4 h-4 ${galleryNav === 'inquiries' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Customer Inquiries & Leads</span>
                    </div>
                    {newInquiriesCount > 0 ? (
                      <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        {newInquiriesCount} New
                      </span>
                    ) : (
                      <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {inquiries.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setGalleryNav('analytics')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'analytics'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className={`w-4 h-4 ${galleryNav === 'analytics' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Sales & Revenue Ledger</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setGalleryNav('video')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'video'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Film className={`w-4 h-4 ${galleryNav === 'video' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Atelier Video Showcase</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Live Reel
                    </span>
                  </button>

                  <button
                    onClick={() => setGalleryNav('testimonials')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      galleryNav === 'testimonials'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Star className={`w-4 h-4 ${galleryNav === 'testimonials' ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>Testimonials & Reviews</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {reviews.length}
                    </span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setAcademyNav('batches')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'batches'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Radio className={`w-4 h-4 ${isLiveBroadcasting ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
                      <span>Live Batches & Stream</span>
                    </div>
                    <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
                      {courses.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAcademyNav('curriculum')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'curriculum'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Video className={`w-4 h-4 ${academyNav === 'curriculum' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Video Lectures (LMS)</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setAcademyNav('upcoming')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'upcoming'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className={`w-4 h-4 ${academyNav === 'upcoming' ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>Upcoming Courses</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {upcomingCourses.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAcademyNav('students')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'students'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Users className={`w-4 h-4 ${academyNav === 'students' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Enrolled Students</span>
                    </div>
                    <span className="bg-[#242934] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {students.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAcademyNav('users')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'users'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <KeyRound className={`w-4 h-4 ${academyNav === 'users' ? 'text-[#FF5722]' : 'text-gray-400'}`} />
                      <span>Registered Logins</span>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {users.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setAcademyNav('testimonials')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      academyNav === 'testimonials'
                        ? 'bg-[#1D212A] text-white font-semibold shadow-sm border border-gray-700/40'
                        : 'text-gray-400 hover:text-white hover:bg-[#161920]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Quote className={`w-4 h-4 ${academyNav === 'testimonials' ? 'text-amber-400' : 'text-gray-400'}`} />
                      <span>Student Testimonials</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {reviews.length}
                    </span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Quick info card */}
          <div className="bg-[#14171E] p-3 rounded-2xl border border-[#202530] text-[11px] text-gray-400 space-y-1">
            <div className="flex items-center justify-between font-bold text-white">
              <span>Local Dev Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p>Admin running on port 5174. 100% free offline mode.</p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* ========================================================= */}
          {/* SIDE 1: ART GALLERY & SALES CONTENT                       */}
          {/* ========================================================= */}
          {adminMode === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
              {/* ORDERS TAB */}
              {galleryNav === 'orders' && (
                <div className="space-y-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Physical Art Orders</span>
                      <div className="text-2xl font-bold font-serif text-white mt-1">{paintingOrdersCount}</div>
                      <span className="text-[11px] text-emerald-400 mt-1 block">Packaging & Courier Pipeline</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Course Enrollments</span>
                      <div className="text-2xl font-bold font-serif text-[#FF5722] mt-1">
                        {courseOrdersCount}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Live Atelier Students</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">In Transit / Crating</span>
                      <div className="text-2xl font-bold font-serif text-blue-400 mt-1">
                        {orders.filter((o) => !isOrderCourse(o) && o.currentStep === 3).length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Step 3 out for delivery</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Delivered Artworks</span>
                      <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
                        {orders.filter((o) => !isOrderCourse(o) && o.currentStep === 4).length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Step 4 completed ✓</span>
                    </div>
                  </div>

                  {/* Category Switcher: Physical Paintings vs Course Enrollments */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-[#14171E] border border-[#202530] p-3 rounded-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setOrderCategoryTab('paintings')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          orderCategoryTab === 'paintings'
                            ? 'bg-gradient-to-r from-[#FF5722] to-[#FF7A45] text-white shadow-md'
                            : 'bg-[#181C24] text-gray-400 hover:text-white'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>🎨 Physical Painting Orders (Courier Delivery)</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] font-mono">
                          {paintingOrdersCount}
                        </span>
                      </button>

                      <button
                        onClick={() => setOrderCategoryTab('courses')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                          orderCategoryTab === 'courses'
                            ? 'bg-gradient-to-r from-red-600 to-[#FF5722] text-white shadow-md'
                            : 'bg-[#181C24] text-gray-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>🎓 Course Enrollments</span>
                        <span className="bg-black/30 px-2 py-0.5 rounded-full text-[10px] font-mono">
                          {courseOrdersCount}
                        </span>
                      </button>

                      <button
                        onClick={() => setOrderCategoryTab('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          orderCategoryTab === 'all'
                            ? 'bg-gray-700 text-white shadow-md'
                            : 'bg-[#181C24] text-gray-400 hover:text-white'
                        }`}
                      >
                        <span>All Transactions ({orders.length})</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setAdminMode('academy');
                        setAcademyNav('students');
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ml-auto"
                      title="Open Side 2: Live Académie to view students, passwords & attendance"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Open Académie Students List ({students.length}) →</span>
                    </button>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {orderCategoryTab !== 'courses' ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                        {['all', 'step1', 'step2', 'step3', 'step4'].map((st) => (
                          <button
                            key={st}
                            onClick={() => setOrderFilter(st)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                              orderFilter === st
                                ? 'bg-[#FF5722] text-white shadow-md'
                                : 'bg-[#14171E] text-gray-400 hover:text-white'
                            }`}
                          >
                            {st === 'all' && 'All Steps'}
                            {st === 'step1' && 'Step 1: Placed'}
                            {st === 'step2' && 'Step 2: Packing'}
                            {st === 'step3' && 'Step 3: Out for Delivery'}
                            {st === 'step4' && 'Step 4: Delivered ✓'}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Online Courses are digital access products. Students get instant login credentials and access to masterclasses.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 ml-auto">
                      <div className="relative w-48 sm:w-60">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search orders, collector, ID..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          className="w-full bg-[#181C24] border border-[#232732] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                        />
                      </div>

                      <button
                        onClick={() => setIsNewOrderModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF7A45] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Record Sale</span>
                      </button>
                    </div>
                  </div>

                  {/* Orders List Table */}
                  <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Order ID</th>
                          <th className="pb-3 font-semibold">{orderCategoryTab === 'courses' ? 'Student' : 'Collector'}</th>
                          <th className="pb-3 font-semibold">{orderCategoryTab === 'courses' ? 'Course / Masterclass' : 'Item / Painting'}</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">{orderCategoryTab === 'courses' ? 'Course Access Status' : 'Status / Pipeline'}</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {filteredOrders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500 text-xs">
                              {orderCategoryTab === 'paintings'
                                ? 'No physical painting orders yet.'
                                : orderCategoryTab === 'courses'
                                ? 'No course orders found.'
                                : 'No orders found matching your search.'}
                            </td>
                          </tr>
                        ) : (
                          filteredOrders.map((ord) => {
                            const isCourse = isOrderCourse(ord);
                            return (
                              <tr key={ord.id} className="hover:bg-gray-900/40 transition-colors">
                                <td className="py-3.5 font-mono text-gray-300 font-bold">#{ord.id}</td>
                                <td className="py-3.5">
                                  <div className="font-bold text-white">{ord.customerName}</div>
                                  <div className="text-[11px] text-gray-400 font-mono">{ord.customerEmail}</div>
                                </td>
                                <td className="py-3.5 text-gray-300 font-medium">
                                  <div className="flex items-center gap-2">
                                    {isCourse ? (
                                      <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0">
                                        Course
                                      </span>
                                    ) : (
                                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider shrink-0">
                                        Painting
                                      </span>
                                    )}
                                    <span className="truncate max-w-[220px]">{ord.items[0]?.title || 'Fine Art Original'}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 font-bold text-emerald-400">
                                  ₹{ord.totalAmount.toLocaleString('en-IN')}
                                </td>
                                <td className="py-3.5">
                                  {isCourse ? (
                                    <div className="flex items-center gap-2">
                                      <span className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Active in Académie ✓</span>
                                      </span>
                                      <button
                                        onClick={() => {
                                          setAdminMode('academy');
                                          setAcademyNav('students');
                                          setStudentSearchQuery(ord.customerEmail || ord.customerName);
                                        }}
                                        className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[#181C24] hover:bg-[#202530] text-gray-300 hover:text-white border border-gray-700 flex items-center gap-1 transition-all cursor-pointer"
                                        title="View in Enrolled Students list"
                                      >
                                        <span>Manage Student</span>
                                        <ArrowUpRight className="w-3 h-3 text-[#FF5722]" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => advanceOrderStep(ord.id)}
                                      className="px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer flex items-center gap-1.5 bg-[#181C24] hover:bg-[#202530] border-gray-700 text-white"
                                      title="Click to advance to next step"
                                    >
                                      <span>Step {ord.currentStep}/4:</span>
                                      <span className="text-[#FF5722]">
                                        {ord.currentStep === 1 && 'Placed → Pack'}
                                        {ord.currentStep === 2 && 'Packing → Ship'}
                                        {ord.currentStep === 3 && 'Out for Delivery → Deliver'}
                                        {ord.currentStep === 4 && 'Delivered ✓'}
                                      </span>
                                    </button>
                                  )}
                                </td>
                                <td className="py-3.5 text-right space-x-2">
                                  <button
                                    onClick={() => setSelectedOrderForModal(ord)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold cursor-pointer"
                                  >
                                    Details
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Delete Order #${ord.id}?`)) {
                                        deleteOrder(ord.id);
                                        showToast('Order deleted.');
                                      }
                                    }}
                                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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

              {/* ARTWORKS CATALOG TAB */}
              {galleryNav === 'artworks' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Artworks & Paintings Inventory</h3>
                      <p className="text-xs text-gray-400">Add, edit, or remove original paintings from the gallery store.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative w-44 sm:w-56">
                        <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search paintings..."
                          value={artworkSearchQuery}
                          onChange={(e) => setArtworkSearchQuery(e.target.value)}
                          className="w-full bg-[#181C24] border border-[#232732] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                        />
                      </div>

                      <select
                        value={artworkCategoryFilter}
                        onChange={(e) => setArtworkCategoryFilter(e.target.value)}
                        className="bg-[#181C24] border border-[#232732] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5722] cursor-pointer"
                      >
                        <option value="All">All Mediums</option>
                        <option value="Acrylic & Mixed Media">Acrylic & Mixed Media</option>
                        <option value="Oil on Canvas">Oil on Canvas</option>
                        <option value="Charcoal & Graphite">Charcoal on Paper</option>
                        <option value="Watercolor & Ink">Watercolor</option>
                        <option value="Limited Edition Print">Limited Edition Print</option>
                      </select>

                      <button
                        onClick={() => setGalleryNav('hero')}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-500/40 shadow shrink-0 transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Homepage Hero Video</span>
                      </button>

                      <label className="px-4 py-2 rounded-xl bg-[#1A1E26] hover:bg-[#222834] text-white font-bold text-xs flex items-center gap-2 cursor-pointer border border-gray-700/80 shadow shrink-0 transition-all">
                        <Upload className="w-4 h-4 text-[#FF5722]" />
                        <span>{isBulkUploadingPaintings ? 'Processing...' : '⚡ Bulk Upload Paintings'}</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleBulkPaintingsUpload}
                          className="hidden"
                          disabled={isBulkUploadingPaintings}
                        />
                      </label>

                      <button
                        onClick={() => {
                          setArtworkToEdit(null);
                          setArtworkUrlInput('');
                          setNewArtworkForm({
                            title: '',
                            subtitle: '',
                            year: 2026,
                            medium: 'Oil on Canvas',
                            dimensions: '36 x 48 in (91 x 122 cm)',
                            price: 95000,
                            image: '',
                            detailImages: [],
                            description: '',
                            story: '',
                            framed: true,
                            status: 'available',
                            featured: true
                          });
                          setIsAddArtworkModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5722] to-[#FF7A45] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add New Painting</span>
                      </button>
                    </div>
                  </div>

                  {/* Artwork Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredArtworks.map((art) => (
                      <div key={art.id} className="bg-[#14171E] border border-[#202530] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
                        <div className="relative aspect-[4/3] bg-black overflow-hidden">
                          <img src={art.image} alt={art.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                            {art.medium}
                          </div>
                          <div className="absolute top-3 right-3 z-10">
                            <select
                              value={art.status || 'available'}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'available' | 'sold' | 'reserved';
                                updateArtwork(art.id, { status: newStatus });
                                showToast(`Artwork "${art.title}" status changed to ${newStatus.toUpperCase()}`);
                              }}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-lg cursor-pointer focus:outline-none transition-all ${
                                art.status === 'sold'
                                  ? 'bg-red-500/90 text-white border-red-400'
                                  : art.status === 'reserved'
                                  ? 'bg-amber-500/90 text-white border-amber-400'
                                  : 'bg-emerald-500/90 text-white border-emerald-400'
                              }`}
                              title="Click to change Artwork Status"
                            >
                              <option value="available" className="bg-[#14171E] text-emerald-400 font-semibold">🟢 Available</option>
                              <option value="reserved" className="bg-[#14171E] text-amber-400 font-semibold">🟡 Reserved</option>
                              <option value="sold" className="bg-[#14171E] text-red-400 font-semibold">🔴 Sold</option>
                            </select>
                          </div>
                        </div>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-gray-400 font-mono">{art.dimensions} • {art.year}</div>
                            <h4 className="font-serif font-bold text-white text-lg mt-0.5">{art.title}</h4>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{art.description}</p>
                          </div>

                          {/* Quick 1-Click Status Changer */}
                          <div className="bg-[#181C24] p-2.5 rounded-2xl border border-[#242A36] flex items-center justify-between">
                            <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                art.status === 'sold' ? 'bg-red-500' : art.status === 'reserved' ? 'bg-amber-500' : 'bg-emerald-500'
                              }`} />
                              Status:
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  updateArtwork(art.id, { status: 'available' });
                                  showToast(`"${art.title}" marked as AVAILABLE`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  art.status === 'available' || !art.status
                                    ? 'bg-emerald-500 text-white shadow'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                                title="Mark as Available in Atelier"
                              >
                                Available
                              </button>

                              <button
                                onClick={() => {
                                  updateArtwork(art.id, { status: 'reserved' });
                                  showToast(`"${art.title}" marked as RESERVED`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  art.status === 'reserved'
                                    ? 'bg-amber-500 text-white shadow'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                                title="Mark as Reserved for Exhibition"
                              >
                                Reserved
                              </button>

                              <button
                                onClick={() => {
                                  updateArtwork(art.id, { status: 'sold' });
                                  showToast(`"${art.title}" marked as SOLD`);
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  art.status === 'sold'
                                    ? 'bg-red-500 text-white shadow'
                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                                title="Mark as Sold"
                              >
                                Sold
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                            <span className="font-serif font-bold text-lg text-emerald-400">
                              ₹{art.price.toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setArtworkToEdit(art);
                                  setArtworkUrlInput('');
                                  setNewArtworkForm({
                                    ...art,
                                    detailImages: art.detailImages || []
                                  });
                                  setIsAddArtworkModalOpen(true);
                                }}
                                className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                                title="Edit Painting"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete artwork "${art.title}"?`)) {
                                    deleteArtwork(art.id);
                                    showToast(`Artwork deleted.`);
                                  }
                                }}
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                                title="Delete Painting"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FEATURED HERO SHOWCASE TAB (CANVAS / VIDEO) */}
              {galleryNav === 'hero' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h3 className="font-serif font-bold text-2xl text-white">Main Homepage Hero Video Manager</h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Website Homepage par sabse upar dikhne wali main cinematic video yahan se upload ya change karein.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href="https://artist-kuldeep-singh.vercel.app"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-[#181C24] hover:bg-[#202530] text-gray-300 hover:text-white text-xs font-medium border border-gray-700/60 transition-colors flex items-center gap-1.5"
                      >
                        <span>Preview Website</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#FF5722]" />
                      </a>

                      <button
                        onClick={handleSaveHeroShowcase}
                        disabled={isSavingHero}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-red-600 hover:from-[#ff6b3d] hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingHero ? 'Saving to Website...' : '💾 Save & Publish'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode Switcher Banner */}
                  <div className="bg-[#14171E] border border-[#202530] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-bold text-white block text-sm">Choose Showcase Mode:</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Choose whether to showcase an <strong>Original Painting</strong> or a <strong>Studio Video</strong> in the hero section.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#181C24] p-1.5 rounded-xl border border-gray-700/60 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setHeroType('painting');
                          if (heroBadge.toLowerCase().includes('video')) setHeroBadge('Featured Canvas');
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          heroType === 'painting'
                            ? 'bg-[#FF5722] text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        <span>🖼️ Painting / Canvas Mode</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setHeroType('video');
                          if (heroBadge.toLowerCase().includes('canvas')) setHeroBadge('Featured Atelier Video');
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          heroType === 'video'
                            ? 'bg-red-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                      >
                        <Film className="w-3.5 h-3.5" />
                        <span>🎬 Video Showcase Mode</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Editor + Live Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT: Controls & Form */}
                    <div className="lg:col-span-7 bg-[#14171E] border border-[#202530] rounded-3xl p-6 space-y-5">
                      <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-[#FF5722]" />
                          <span>{heroType === 'painting' ? 'Painting Showcase Settings' : 'Video Showcase Settings'}</span>
                        </span>
                        <span className="text-[11px] text-gray-400">
                          Mode: <strong className="text-white capitalize">{heroType}</strong>
                        </span>
                      </div>

                      {/* PAINTING FORM */}
                      {heroType === 'painting' && (
                        <div className="space-y-4">
                          {/* Quick Select From Catalog */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center justify-between">
                              <span>Select From Existing Artworks (Quick Autofill)</span>
                              <span className="text-[10px] text-amber-400 font-normal">Optional</span>
                            </label>
                            <select
                              value={heroArtworkId}
                              onChange={(e) => handleSelectCatalogPaintingForHero(e.target.value)}
                              className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722] cursor-pointer"
                            >
                              <option value="">-- Choose from your catalog paintings --</option>
                              {artworks.map((art) => (
                                <option key={art.id} value={art.id}>
                                  {art.title} ({art.medium}) — ₹{art.price.toLocaleString('en-IN')}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Image Upload from Device */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                              Painting Image (Upload from Device or URL)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <label className="flex-1 border-2 border-dashed border-gray-700 hover:border-[#FF5722] bg-[#181C24] p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-gray-300 hover:text-white">
                                <Upload className="w-4 h-4 text-[#FF5722]" />
                                <span>{isUploadingHeroImage ? 'Processing Image...' : 'Upload Image from Device'}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleHeroImageUpload}
                                  className="hidden"
                                  disabled={isUploadingHeroImage}
                                />
                              </label>
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Or paste image URL here..."
                                  value={heroImage}
                                  onChange={(e) => setHeroImage(e.target.value)}
                                  className="w-full h-full bg-[#181C24] border border-[#242A36] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Title & Badge */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Painting Title</label>
                              <input
                                type="text"
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                placeholder="e.g. Symphony of the Solitary Tide"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Badge Label (Top-Left Tag)</label>
                              <input
                                type="text"
                                value={heroBadge}
                                onChange={(e) => setHeroBadge(e.target.value)}
                                placeholder="e.g. Featured Canvas"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                              />
                            </div>
                          </div>

                          {/* Subtitle & Price */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subtitle (Medium & Dimensions)</label>
                              <input
                                type="text"
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                placeholder="e.g. Original Oil on Belgian Linen (40 x 54 in)"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Price Display Tag</label>
                              <input
                                type="text"
                                value={heroPrice}
                                onChange={(e) => setHeroPrice(e.target.value)}
                                placeholder="e.g. ₹4,12,250"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                              />
                            </div>
                          </div>

                          {/* Certificate Text */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Bottom Certificate / Guarantee Tag</label>
                            <input
                              type="text"
                              value={heroCert}
                              onChange={(e) => setHeroCert(e.target.value)}
                              placeholder="e.g. Archival Certificate"
                              className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#FF5722]"
                            />
                          </div>
                        </div>
                      )}

                      {/* VIDEO FORM */}
                      {heroType === 'video' && (
                        <div className="space-y-4">
                          {/* Video Upload or URL */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                              Video Source (Upload Video File or Paste Video URL / Embed)
                            </label>
                            <div className="space-y-2.5">
                              <label className="w-full border-2 border-dashed border-gray-700 hover:border-red-500 bg-[#181C24] p-3 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-xs text-gray-300 hover:text-white">
                                <div className="flex items-center gap-2">
                                  <FileVideo className="w-4 h-4 text-red-500" />
                                  <span>{isUploadingHeroVideo ? (heroVideoFeedback || 'Uploading to Bunny Stream CDN...') : 'Upload Video File from Device (MP4 / WebM)'}</span>
                                </div>
                                {isUploadingHeroVideo && (
                                  <div className="w-full max-w-xs bg-gray-800 h-2 rounded-full overflow-hidden mt-1 border border-gray-700">
                                    <div className="bg-gradient-to-r from-red-600 to-orange-500 h-full transition-all duration-200" style={{ width: `${heroVideoProgress}%` }} />
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={handleHeroVideoUpload}
                                  className="hidden"
                                  disabled={isUploadingHeroVideo}
                                />
                              </label>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div className="relative flex-1">
                                  <LinkIcon className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    type="text"
                                    placeholder="Or paste Direct MP4 URL, Bunny Stream, YouTube, or Vimeo embed link..."
                                    value={heroVideoUrl}
                                    onChange={(e) => setHeroVideoUrl(e.target.value)}
                                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                                  />
                                </div>
                                {heroVideoUrl && (
                                  <button
                                    type="button"
                                    onClick={handleDeleteHeroVideo}
                                    className="px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                                    title="Delete video from Bunny.net CDN and website"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Video</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Poster Image */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                              Video Poster / Thumbnail Image
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <label className="flex-1 border border-gray-700 hover:border-red-500 bg-[#181C24] p-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs text-gray-300 hover:text-white">
                                <ImageIcon className="w-4 h-4 text-red-400" />
                                <span>Upload Poster Image</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleHeroImageUpload}
                                  className="hidden"
                                />
                              </label>
                              <input
                                type="text"
                                placeholder="Poster image URL..."
                                value={heroImage}
                                onChange={(e) => setHeroImage(e.target.value)}
                                className="flex-1 bg-[#181C24] border border-[#242A36] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>

                          {/* Title & Badge */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Video Title</label>
                              <input
                                type="text"
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                placeholder="e.g. Behind the Canvas • Master Oil Demonstration"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Badge Label (Top-Left Tag)</label>
                              <input
                                type="text"
                                value={heroBadge}
                                onChange={(e) => setHeroBadge(e.target.value)}
                                placeholder="e.g. Featured Atelier Video"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>

                          {/* Subtitle & Certificate */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Subtitle / Description</label>
                              <input
                                type="text"
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                placeholder="e.g. Watch Artist Kuldeep Singh create in the atelier"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-300 mb-1.5">Archive Tag</label>
                              <input
                                type="text"
                                value={heroCert}
                                onChange={(e) => setHeroCert(e.target.value)}
                                placeholder="e.g. Atelier Studio Archive"
                                className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Save Button */}
                      <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Direct real-time synchronization with website</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleSaveHeroShowcase}
                          disabled={isSavingHero}
                          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5722] to-red-600 hover:from-[#ff6b3d] hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingHero ? 'Publishing...' : '💾 Save & Publish'}</span>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT: Live Interactive Preview */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-[#FF5722]" />
                          <span>Homepage Widescreen Video Preview</span>
                        </span>
                        <span className="text-[11px] bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span>Live Player</span>
                        </span>
                      </div>

                      {/* Video Player Preview Container */}
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-gray-700 bg-black aspect-video group">
                        {heroVideoUrl ? (
                          heroVideoUrl.includes('iframe') || heroVideoUrl.includes('embed') || heroVideoUrl.includes('youtube') || heroVideoUrl.includes('vimeo') || heroVideoUrl.includes('mediadelivery.net') ? (
                            <iframe
                              src={heroVideoUrl}
                              title="Homepage Hero Video Preview"
                              className="w-full h-full border-0"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={heroVideoUrl}
                              poster={heroImage}
                              controls
                              autoPlay
                              muted
                              loop
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                            <Film className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-xs">No video configured yet. Upload a video or enter a URL on the left.</p>
                          </div>
                        )}
                      </div>

                      {/* Video Status Information */}
                      <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-4 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active on Main Homepage</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Display Format:</span>
                          <span className="text-white font-medium">Cinema Widescreen (16:9 / 21:9)</span>
                        </div>
                        {heroVideoUrl && (
                          <div className="pt-2 border-t border-gray-800">
                            <span className="text-gray-400 block mb-1">Current Video URL:</span>
                            <p className="text-[11px] text-gray-300 font-mono break-all line-clamp-2 bg-[#181C24] p-2 rounded-lg border border-gray-800">
                              {heroVideoUrl}
                            </p>
                          </div>
                        )}
                        <div className="pt-2 flex items-center justify-between border-t border-gray-800/80">
                          <span className="text-[11px] text-gray-400">Auto-plays muted on homepage load</span>
                          <a
                            href="https://artist-kuldeep-singh.vercel.app"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#FF5722] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Open Live Site</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ANALYTICS TAB */}
              {galleryNav === 'analytics' && (
                <div className="space-y-6">
                  <h3 className="font-serif font-bold text-2xl text-white">Sales & Revenue Ledger</h3>
                  <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 sm:p-8 space-y-4">
                    <div className="text-lg font-bold text-white">Lifetime Painting Sales</div>
                    <div className="text-4xl font-serif font-bold text-emerald-400">
                      ₹{orders.reduce((acc, o) => acc + o.totalAmount, 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-xs text-gray-400">
                      Calculated from all confirmed collector acquisitions across {orders.length} orders.
                    </p>
                  </div>
                </div>
              )}

              {/* ATELIER VIDEO SHOWCASE TAB - 4 REELS MANAGER */}
              {galleryNav === 'video' && (
                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <h3 className="font-serif font-bold text-2xl text-white">
                          Atelier 9:16 Portrait Video Reels (4-in-1 Frame)
                        </h3>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Manage all 4 portrait reels displayed simultaneously in one frame on the live website homepage. Click any reel slot to upload or edit.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveVideoShowcase}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Save & Publish All 4 Reels to Website</span>
                    </button>
                  </div>

                  {/* 4-SLOT REEL SELECTOR CARDS */}
                  <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-5 shadow-xl space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                          Select Reel Slot to Configure (4 in 1 Frame on Homepage):
                        </span>
                        <p className="text-[11px] text-gray-500">
                          Click any reel card below to change its video, title, thumbnail, or category.
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FF5722]/15 text-[#FF5722] border border-[#FF5722]/30 self-start sm:self-auto flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FF5722] animate-ping" />
                        Currently Editing: Reel #{activeReelIndex + 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      {[0, 1, 2, 3].map((idx) => {
                        const reel = adminReels[idx] || DEFAULT_STUDIO_REELS[idx];
                        const isSelected = activeReelIndex === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectReelSlot(idx)}
                            className={`relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden ${
                              isSelected
                                ? 'bg-[#1C202B] border-[#FF5722] shadow-xl shadow-red-500/15 ring-2 ring-[#FF5722]/50'
                                : 'bg-[#0C0E12] border-gray-800 hover:border-gray-700 hover:bg-[#14171E]'
                            }`}
                          >
                            {/* Card Top: Slot Number & Active Badge */}
                            <div className="flex items-center justify-between mb-2 z-10 w-full">
                              <span
                                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                  isSelected ? 'bg-[#FF5722] text-white' : 'bg-gray-800 text-gray-400 group-hover:text-white'
                                }`}
                              >
                                Reel #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {reel.videoUrl && (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Are you sure you want to delete the video from Reel #${idx + 1}?`)) {
                                        handleDeleteCurrentReelVideo(idx);
                                      }
                                    }}
                                    className="p-1 rounded-md bg-red-600/20 hover:bg-red-600/50 text-red-400 hover:text-white border border-red-500/30 transition-colors cursor-pointer"
                                    title={`Delete video from Reel #${idx + 1}`}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                )}
                                {isSelected ? (
                                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Editing
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Edit</span>
                                )}
                              </div>
                            </div>

                            {/* Mini 9:16 Aspect Preview Thumbnail */}
                            <div className="relative aspect-[9/16] w-full max-h-36 rounded-xl overflow-hidden bg-black/60 border border-gray-800 mb-2.5">
                              {reel.thumbnail ? (
                                <img
                                  src={reel.thumbnail}
                                  alt={reel.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  <FileVideo className="w-6 h-6" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30" />
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 rounded-full bg-[#FF5722] text-white flex items-center justify-center shadow-lg">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                              </div>
                              <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[9px] text-white/90">
                                <span className="bg-black/70 px-1.5 py-0.5 rounded backdrop-blur-sm truncate max-w-[70px]">
                                  {reel.category || 'Reel'}
                                </span>
                                <span className="bg-black/70 px-1.5 py-0.5 rounded font-mono">
                                  {reel.duration || '0:50'}
                                </span>
                              </div>
                            </div>

                            {/* Reel Title Snippet */}
                            <div className="z-10 w-full">
                              <h5 className="font-serif font-bold text-xs text-white line-clamp-1 group-hover:text-[#FF5722] transition-colors">
                                {reel.title || `Reel Slot #${idx + 1}`}
                              </h5>
                              <span className="text-[10px] text-gray-500 block truncate mt-0.5 font-mono">
                                {reel.videoUrl ? '✓ Video Linked' : 'No video set'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main Grid: Upload Controls (Left) & Live Preview (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: 6 Cols - Controls for Selected Reel Slot */}
                    <div className="lg:col-span-6 space-y-5 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl">
                      {/* Active Slot Header Indicator */}
                      <div className="p-3 bg-[#0C0E12] rounded-2xl border border-[#FF5722]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5722]" />
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            Editing Slot: Reel #{activeReelIndex + 1}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] text-[#FF5722] font-mono">
                            Slot {activeReelIndex + 1} of 4
                          </span>
                          {videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete and remove the video from Reel #${activeReelIndex + 1}?`)) {
                                  handleDeleteCurrentReelVideo(activeReelIndex);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-white border border-red-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Video</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Step 1: Reel Title */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          1. Reel Title / Headline
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => updateCurrentReelField({ title: e.target.value })}
                          placeholder="e.g. Master Sight-Size Portrait Demo in 9:16"
                          className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                        />
                      </div>

                      {/* Step 2: Category Badge & Duration */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                            2. Technique Category
                          </label>
                          <input
                            type="text"
                            value={videoCategory}
                            onChange={(e) => updateCurrentReelField({ category: e.target.value })}
                            placeholder="e.g. Oil Glazing, Palette Knife"
                            className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                            Duration Tag
                          </label>
                          <input
                            type="text"
                            value={videoDuration}
                            onChange={(e) => updateCurrentReelField({ duration: e.target.value })}
                            placeholder="e.g. 0:45 or 1:12"
                            className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] font-mono"
                          />
                        </div>
                      </div>

                      {/* Step 3: Video File Upload to Bunny Stream */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          3. Upload 9:16 Reel Video File (.mp4, .webm, .mov)
                        </label>
                        <div className="border-2 border-dashed border-gray-700/80 hover:border-[#FF5722]/80 rounded-2xl p-5 text-center transition-all bg-[#0C0E12] group">
                          <FileVideo className="w-8 h-8 text-[#FF5722] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs text-white font-medium">Click to select portrait reel from your PC / Phone</p>
                          <p className="text-[10px] text-gray-500 mt-1">Recommended: 9:16 Portrait Reel format (30 to 60 seconds)</p>

                          <label
                            className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                              isUploadingVideo
                                ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 cursor-wait'
                                : 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer border-gray-700'
                            } font-bold text-xs border transition-colors`}
                          >
                            {isUploadingVideo ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                <span>Uploading Reel #{activeReelIndex + 1} to Bunny Stream...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-[#FF5722]" />
                                <span>Browse Video File for Reel #{activeReelIndex + 1}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              onChange={handleVideoFileUpload}
                              disabled={isUploadingVideo}
                              className="hidden"
                            />
                          </label>

                          {videoFileFeedback && (
                            <p className="text-xs text-emerald-400 mt-2 font-mono">{videoFileFeedback}</p>
                          )}
                        </div>
                      </div>

                      {/* Step 4: Or Paste Direct Video / YouTube URL */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                            4. Or Paste YouTube Shorts / Reel Video URL
                          </label>
                          {videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Clear and remove video from Reel #${activeReelIndex + 1}?`)) {
                                  handleDeleteCurrentReelVideo(activeReelIndex);
                                }
                              }}
                              className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete Video</span>
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => updateCurrentReelField({ videoUrl: e.target.value })}
                            placeholder="https://youtube.com/shorts/... or https://domain.com/reel.mp4"
                            className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] font-mono"
                          />
                          {videoUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete and remove video from Reel #${activeReelIndex + 1}?`)) {
                                  handleDeleteCurrentReelVideo(activeReelIndex);
                                }
                              }}
                              className="px-3 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                              title="Delete Video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500">
                          Supports YouTube Shorts, Instagram Reels, Bunny Stream links, Cloud videos, or direct vertical MP4 files.
                        </p>
                      </div>

                      {/* Step 5: Thumbnail / Poster Image */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          5. Cover Thumbnail / Poster (Vertical 9:16 Recommended)
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={videoPoster}
                            onChange={(e) => updateCurrentReelField({ thumbnail: e.target.value })}
                            placeholder="Thumbnail Image URL..."
                            className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] font-mono text-[11px]"
                          />
                          <label className="px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs cursor-pointer border border-gray-700 shrink-0 flex items-center gap-1.5 transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleVideoPosterUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Zero-Lag Performance Note */}
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">100% Zero Website Lag Guarantee:</strong>
                          <span className="text-gray-300 text-[11px] leading-relaxed">
                            Vertical reels stream on-demand using modern HTML5 byte-streaming. The website loads in milliseconds without freezing 3D animations or slowing down page scroll.
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveVideoShowcase}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Save & Publish All 4 Reels to Live Website</span>
                      </button>
                    </div>

                    {/* Right: 6 Cols - Live Preview Player (9:16 Portrait Reel) */}
                    <div className="lg:col-span-6 space-y-4 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Reel #{activeReelIndex + 1} Preview (9:16 Portrait):
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                            Vertical 9:16 Player
                          </span>
                        </div>

                        {/* Player Frame (9:16 Portrait Reel) */}
                        <div className="relative aspect-[9/16] max-w-[280px] mx-auto rounded-3xl overflow-hidden bg-black border border-gray-800 shadow-2xl flex items-center justify-center group">
                          {videoUrl ? (
                            isEmbedUrl(videoUrl) ? (
                              <iframe
                                src={getAdminEmbedUrl(videoUrl)}
                                title="Reel Preview"
                                className="w-full h-full border-0"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                              />
                            ) : (
                              <video
                                key={videoUrl}
                                src={videoUrl}
                                poster={videoPoster}
                                controls
                                playsInline
                                className="w-full h-full object-contain bg-black"
                              >
                                Your browser does not support HTML5 video preview.
                              </video>
                            )
                          ) : (
                            <div className="text-center p-6 text-gray-500">
                              <FileVideo className="w-10 h-10 mx-auto mb-2 opacity-40" />
                              <span className="text-xs">No video loaded. Upload a file or paste URL on the left.</span>
                            </div>
                          )}
                        </div>

                        {/* Preview Details Cards */}
                        <div className="p-3 bg-[#0C0E12] rounded-xl border border-gray-800/80 space-y-1.5">
                          <span className="text-[10px] text-gray-500 uppercase block font-semibold">
                            Reel #{activeReelIndex + 1} Title & Badges:
                          </span>
                          <h4 className="font-serif font-bold text-white text-sm sm:text-base">
                            {videoTitle || `Reel Slot #${activeReelIndex + 1}`}
                          </h4>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {videoCategory || 'Featured Reel'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                              ⏱ {videoDuration || '0:50'}
                            </span>
                          </div>
                        </div>

                        {videoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the video from Reel #${activeReelIndex + 1}?`)) {
                                handleDeleteCurrentReelVideo(activeReelIndex);
                              }
                            }}
                            className="w-full py-2.5 px-4 rounded-xl bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Video from Reel #{activeReelIndex + 1}</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Status: Ready to Stream</span>
                        </span>
                        <a
                          href="https://artist-kuldeep-singh.vercel.app"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#FF5722] hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>View on Live Site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CUSTOMER INQUIRIES & LEADS TAB */}
              {galleryNav === 'inquiries' && (
                <div className="space-y-6">
                  {/* Top Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Total Inquiries</span>
                      <div className="text-2xl font-bold font-serif text-white mt-1">{inquiries.length}</div>
                      <span className="text-[11px] text-gray-400 mt-1 block">All website leads</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">New / Unread Leads</span>
                      <div className="text-2xl font-bold font-serif text-red-400 mt-1 flex items-center gap-2">
                        <span>{newInquiriesCount}</span>
                        {newInquiriesCount > 0 && (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                        )}
                      </div>
                      <span className="text-[11px] text-red-400 mt-1 block">Awaiting response</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">In Contact</span>
                      <div className="text-2xl font-bold font-serif text-amber-400 mt-1">
                        {inquiries.filter((i) => i.status === 'contacted').length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Follow-up active</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Resolved</span>
                      <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
                        {inquiries.filter((i) => i.status === 'resolved').length}
                      </div>
                      <span className="text-[11px] text-emerald-400 mt-1 block">Successfully closed ✓</span>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 flex-1">
                      {[
                        { id: 'all', label: `All (${inquiries.length})` },
                        { id: 'new', label: `New Leads (${newInquiriesCount})` },
                        { id: 'contacted', label: `Contacted (${inquiries.filter((i) => i.status === 'contacted').length})` },
                        { id: 'resolved', label: `Resolved (${inquiries.filter((i) => i.status === 'resolved').length})` }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setInquiryFilter(tab.id as any)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            inquiryFilter === tab.id
                              ? 'bg-[#FF5722] text-white shadow-md'
                              : 'bg-[#14171E] text-gray-400 hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search name, phone, email, subject..."
                        value={inquirySearchQuery}
                        onChange={(e) => setInquirySearchQuery(e.target.value)}
                        className="w-full bg-[#181C24] border border-[#232732] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                      />
                    </div>
                  </div>

                  {/* Inquiries Cards List */}
                  {filteredInquiries.length === 0 ? (
                    <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-800/60 text-gray-500 flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif font-bold text-white text-lg">No inquiries found</h4>
                      <p className="text-xs text-gray-400 max-w-md mx-auto">
                        When visitors click &quot;Enquire / पूछताछ&quot; on the website navbar or submit a contact request, their details and messages will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredInquiries.map((inq) => {
                        const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '').slice(-10);
                        const waText = encodeURIComponent(
                          `Hello ${inq.name}, Artist Kuldeep Singh Atelier connecting regarding your inquiry on "${inq.subject}". How may we assist you?`
                        );
                        const waUrl = `https://wa.me/91${cleanPhone}?text=${waText}`;

                        return (
                          <div
                            key={inq.id}
                            className="bg-[#14171E] border border-[#202530] hover:border-gray-700/80 rounded-3xl p-6 shadow-xl space-y-4 transition-all"
                          >
                            {/* Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800/80 pb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF5722] to-amber-600 text-white font-bold flex items-center justify-center text-sm shadow">
                                  {inq.name ? inq.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <h4 className="font-bold text-white text-base leading-tight">{inq.name}</h4>
                                  <span className="text-[11px] text-gray-400">
                                    Subject: <strong className="text-gray-200">{inq.subject}</strong>
                                  </span>
                                </div>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ml-1 ${
                                    inq.status === 'new'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : inq.status === 'contacted'
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  }`}
                                >
                                  {inq.status === 'new' && '● New Lead'}
                                  {inq.status === 'contacted' && '⏳ Contacted'}
                                  {inq.status === 'resolved' && '✓ Resolved'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <span className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                                  <Clock className="w-3 h-3" />
                                  {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete inquiry from ${inq.name}?`)) {
                                      deleteInquiry(inq.id);
                                      showToast(`Inquiry deleted.`);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                                  title="Delete inquiry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Contact Info Pills */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                              <div className="bg-[#0C0E12] border border-gray-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-gray-300">
                                <Phone className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                                <span className="font-mono font-bold truncate">{inq.phone || 'N/A'}</span>
                              </div>
                              <div className="bg-[#0C0E12] border border-gray-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-gray-300">
                                <Mail className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                                <span className="truncate">{inq.email || 'N/A'}</span>
                              </div>
                              <div className="bg-[#0C0E12] border border-gray-800/80 rounded-xl px-3 py-2 flex items-center gap-2 text-gray-300">
                                <MapPin className="w-3.5 h-3.5 text-[#FF5722] shrink-0" />
                                <span className="truncate">{inq.city || 'Delhi, India'}</span>
                              </div>
                            </div>

                            {/* Customer Message */}
                            <div className="bg-[#0C0E12] border border-gray-800/80 rounded-2xl p-4 text-xs text-gray-300 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                                Client Inquiry Message:
                              </span>
                              <p className="whitespace-pre-wrap leading-relaxed text-gray-200">{inq.message}</p>
                            </div>

                            {/* Action Bar */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                              {/* Direct Contact Buttons */}
                              <div className="flex flex-wrap items-center gap-2">
                                {cleanPhone && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow transition-colors"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>WhatsApp Customer</span>
                                  </a>
                                )}

                                {inq.phone && (
                                  <a
                                    href={`tel:${inq.phone}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Call</span>
                                  </a>
                                )}

                                {inq.email && (
                                  <a
                                    href={`mailto:${inq.email}?subject=${encodeURIComponent(`Regarding your Inquiry with Artist Kuldeep Singh - ${inq.subject}`)}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Email</span>
                                  </a>
                                )}
                              </div>

                              {/* Status Toggles */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-500 uppercase font-bold mr-1">Status:</span>
                                {inq.status !== 'new' && (
                                  <button
                                    onClick={() => {
                                      updateInquiryStatus(inq.id, 'new');
                                      showToast(`Inquiry marked as NEW`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer"
                                  >
                                    Mark New
                                  </button>
                                )}
                                {inq.status !== 'contacted' && (
                                  <button
                                    onClick={() => {
                                      updateInquiryStatus(inq.id, 'contacted');
                                      showToast(`Inquiry marked as CONTACTED`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 cursor-pointer"
                                  >
                                    Mark Contacted
                                  </button>
                                )}
                                {inq.status !== 'resolved' && (
                                  <button
                                    onClick={() => {
                                      updateInquiryStatus(inq.id, 'resolved');
                                      showToast(`Inquiry marked as RESOLVED`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 cursor-pointer"
                                  >
                                    Mark Resolved ✓
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TESTIMONIALS & REVIEWS TAB (Gallery Console) */}
              {galleryNav === 'testimonials' && renderTestimonialsTabContent()}
              {galleryNav === 'promos' && renderPromosAndDeliveryTabContent()}
            </div>
          )}

          {/* ========================================================= */}
          {/* SIDE 2: LIVE ACADÉMIE & MASTERCLASSES CONTENT             */}
          {/* ========================================================= */}
          {adminMode === 'academy' && (
            <div className="space-y-8 animate-fade-in">
              {/* TOP METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Scheduled Batches</span>
                  <div className="text-2xl font-bold font-serif text-white mt-1">{courses.length}</div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">Active cohorts in database</span>
                </div>

                <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Enrolled Students</span>
                  <div className="text-2xl font-bold font-serif text-white mt-1">{students.length}</div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Total across all masterclasses</span>
                </div>

                <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Tuition Fees Collected</span>
                  <div className="text-2xl font-bold font-serif text-amber-400 mt-1">
                    ₹{students.reduce((acc, s) => acc + (s.feesPaid || 0), 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Course revenue ledger</span>
                </div>

                <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Live Attendance Today</span>
                  <div className="text-2xl font-bold font-serif text-red-400 mt-1">
                    {students.filter((s) => s.attendanceStatus === 'Attended').length}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 block">Marked present for stream</span>
                </div>
              </div>

              {/* BATCHES & STREAM TAB */}
              {academyNav === 'batches' && (
                <div className="space-y-6">
                  {/* Action Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Live Masterclass Batches & Meet Broadcast</h3>
                      <p className="text-xs text-gray-400">
                        Create future course batches (e.g. 22 Oct 2026), broadcast via Google Meet, and upload class recordings.
                      </p>
                    </div>

                    <button
                      onClick={handleOpenNewBatch}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Schedule New Live Batch</span>
                    </button>
                  </div>

                  {/* Batch Selection Cards */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Select Batch to Manage:</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {courses.map((c) => {
                        const isSelected = c.id === selectedLiveBatchId;
                        const batchStudents = students.filter((s) => s.courseId === c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => setSelectedLiveBatchId(c.id)}
                            className={`p-5 rounded-3xl border transition-all cursor-pointer space-y-3 relative group ${
                              isSelected
                                ? 'bg-gradient-to-br from-[#1C1F28] to-[#14171E] border-[#FF5722] ring-2 ring-[#FF5722]/30 shadow-xl'
                                : 'bg-[#14171E] hover:bg-[#181C24] border-[#202530]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] uppercase font-bold text-[#FF5722] bg-[#FF5722]/10 px-2.5 py-0.5 rounded-full border border-[#FF5722]/20">
                                  Starts: {c.startDate || '22 Oct, 2026'}
                                </span>
                                {(c.liveClassStatus === 'live' || (cloudLiveInfo?.isLive && cloudLiveInfo?.courseId === c.id)) && (
                                  <span className="text-[9px] uppercase font-black text-white bg-red-600 px-2 py-0.5 rounded-full animate-pulse shadow flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    LIVE NOW
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white mr-1">₹{c.price.toLocaleString('en-IN')}</span>

                                {/* EDIT BATCH BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditBatch(c);
                                  }}
                                  className="p-1.5 rounded-lg bg-[#242A36] hover:bg-[#FF5722] text-gray-300 hover:text-white transition-colors cursor-pointer"
                                  title={`Edit Batch: ${c.title}`}
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* DELETE BATCH BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete batch "${c.title}"? This will remove all associated data.`)) {
                                      deleteCourse(c.id);
                                      showToast(`Batch "${c.title}" deleted.`);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-[#242A36] hover:bg-red-600 text-gray-400 hover:text-white transition-colors cursor-pointer"
                                  title={`Delete Batch: ${c.title}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-serif font-bold text-white text-base line-clamp-1">{c.title}</h4>
                            <div className="text-xs text-gray-400 line-clamp-1">{c.schedule}</div>
                            <div className="pt-2 border-t border-gray-800 flex items-center justify-between text-xs text-gray-300">
                              <span>👥 <strong>{batchStudents.length}</strong> Enrolled</span>
                              <span className="text-emerald-400 font-bold">₹{(batchStudents.length * c.price).toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Batch Controls */}
                  {activeCourse && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#14171E] border border-[#202530] rounded-3xl p-6 sm:p-8 shadow-xl">
                      {/* Left 6 Cols: Live Google Meet Controller */}
                      <div className="lg:col-span-6 space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#FF5722] tracking-wider">Live Broadcast Control</span>
                            <h4 className="font-serif font-bold text-lg text-white mt-0.5">{activeCourse.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditBatch(activeCourse)}
                              className="px-3 py-1.5 rounded-xl bg-[#242A36] hover:bg-[#FF5722] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-gray-700"
                              title="Edit this batch details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Batch</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete batch "${activeCourse.title}"?`)) {
                                  deleteCourse(activeCourse.id);
                                  showToast(`Batch "${activeCourse.title}" deleted.`);
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Delete this batch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Batch</span>
                            </button>
                          </div>
                        </div>

                        {/* On Air / Offline Box */}
                        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                          isLiveBroadcasting ? 'bg-red-950/20 border-red-500/40 text-red-200' : 'bg-gray-800/40 border-gray-700/60 text-gray-300'
                        }`}>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 relative">
                              {isLiveBroadcasting && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLiveBroadcasting ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                            </span>
                            <div>
                              <div className="font-bold text-xs">{isLiveBroadcasting ? '🔴 CLASS IS CURRENTLY LIVE' : 'Class is Offline'}</div>
                              <div className="text-[10px] text-gray-400">
                                {isLiveBroadcasting
                                  ? `Only enrolled students of "${activeCourse.title}" see "Join Live Class"`
                                  : cloudLiveInfo?.isLive && cloudLiveInfo.courseId && cloudLiveInfo.courseId !== activeCourse.id
                                  ? `(Note: "${cloudLiveInfo.courseTitle || 'Another batch'}" is currently live on air)`
                                  : 'Awaiting live session'}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleToggleBroadcast}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow cursor-pointer ${
                              isLiveBroadcasting
                                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600'
                                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30'
                            }`}
                          >
                            {isLiveBroadcasting ? 'End Live' : 'Go Live Now'}
                          </button>
                        </div>

                        {/* Meet link input */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Google Meet / Live Workshop Link
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              value={liveStreamUrl}
                              onChange={(e) => setLiveStreamUrl(e.target.value)}
                              placeholder="https://meet.google.com/xyz-abcd-efg"
                              className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                            />
                            <a
                              href={liveStreamUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-3 py-2.5 rounded-xl flex items-center gap-1 transition-colors shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={handleUpdateLiveUrl}
                            className="w-full py-2.5 bg-stone-800 hover:bg-[#FF5722] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow border border-gray-700 cursor-pointer"
                          >
                            Save & Update Meet Link
                          </button>
                        </div>
                      </div>

                      {/* Right 6 Cols: Upload Video Lecture to this batch */}
                      <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-gray-800 lg:pl-6 pt-4 lg:pt-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Class Recordings & Video LMS</span>
                        <h4 className="font-serif font-bold text-lg text-white">Upload Class Video Lecture</h4>
                        <p className="text-xs text-gray-400">
                          Whenever a live session finishes, paste its video link here (Cloudflare R2 MP4, YouTube Unlisted, Vimeo). It immediately becomes available for enrolled students on their portal!
                        </p>

                        <button
                          onClick={() => handleOpenAddLectureModal(activeCourse.id, 0)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                          <Video className="w-4 h-4" />
                          <span>+ Upload Recorded Lecture to this Batch</span>
                        </button>

                        <div className="bg-[#0C0E12] p-4 rounded-2xl border border-gray-800 space-y-2 text-xs">
                          <span className="font-bold text-white">Current Lectures in this Batch:</span>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {(() => {
                              const batchLectures = activeCourse.modules.flatMap((m, mIdx) =>
                                (m.lectures || []).map((lec, lIdx) => ({ lec, mIdx, lIdx }))
                              );
                              if (batchLectures.length === 0) {
                                return (
                                  <div className="text-gray-500 text-[11px] py-3 text-center">
                                    No video lectures uploaded yet for this batch.
                                  </div>
                                );
                              }
                              return batchLectures.map(({ lec, mIdx, lIdx }) => (
                                <div key={lec.id || lIdx} className="flex items-center justify-between p-2 rounded-xl bg-gray-900/60 border border-gray-800 text-[11px]">
                                  <div className="truncate mr-2">
                                    <div className="flex items-center gap-1.5">
                                      <strong className="text-white truncate">{lec.title}</strong>
                                      {(lec.accessType === 'free' || lec.isFreePreview) && (
                                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">Free</span>
                                      )}
                                    </div>
                                    <span className="text-gray-500 block truncate font-mono text-[10px]">{lec.videoUrl}</span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Permanently delete video lecture "${lec.title}"?`)) {
                                        deleteLectureFromModule(activeCourse.id, mIdx, lIdx);
                                        showToast('Video lecture deleted.');
                                      }
                                    }}
                                    className="text-gray-500 hover:text-red-400 p-1 cursor-pointer"
                                    title="Delete Video"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CURRICULUM LMS TAB */}
              {academyNav === 'curriculum' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Course Curriculum & Video Lectures</h3>
                      <p className="text-xs text-gray-400">Manage modules, upload class recordings, and set free preview trailers or enrolled-only access.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      {/* Course Switcher */}
                      {courses.length > 0 && (
                        <div className="flex items-center gap-2 bg-[#14171E] border border-[#242A36] rounded-xl px-3 py-1.5">
                          <span className="text-[11px] text-gray-400 font-semibold">Course:</span>
                          <select
                            value={selectedLiveBatchId}
                            onChange={(e) => setSelectedLiveBatchId(e.target.value)}
                            className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer max-w-[180px] sm:max-w-xs truncate"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id} className="bg-[#14171E] text-white">
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        onClick={() => handleOpenAddLectureModal(activeCourse?.id, 0)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add Video Lecture</span>
                      </button>
                    </div>
                  </div>

                  {/* Modules & Lectures list */}
                  {(!activeCourse?.modules || activeCourse.modules.length === 0) ? (
                    <div className="p-8 text-center bg-[#14171E] border border-[#202530] rounded-3xl space-y-3">
                      <Film className="w-8 h-8 text-gray-500 mx-auto" />
                      <div className="text-white font-serif font-bold">No Modules Found in this Course</div>
                      <p className="text-xs text-gray-400">Add your first video lecture to automatically create a module.</p>
                      <button
                        onClick={() => handleOpenAddLectureModal(activeCourse?.id, 0)}
                        className="px-4 py-2 bg-[#FF5722] hover:bg-[#e64a19] text-white rounded-xl text-xs font-bold transition-all shadow"
                      >
                        + Upload First Video
                      </button>
                    </div>
                  ) : (
                    activeCourse.modules.map((mod, modIdx) => (
                      <div key={mod.id || modIdx} className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#1D212A] text-[#FF5722] font-bold text-xs flex items-center justify-center border border-gray-700">
                              {modIdx + 1}
                            </div>
                            <div>
                              <h4 className="font-serif font-bold text-white text-base">{mod.title}</h4>
                              <span className="text-[11px] text-gray-400">{(mod.lectures || []).length} Recorded Video Lectures Uploaded</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenAddLectureModal(activeCourse.id, modIdx)}
                            className="px-3 py-1.5 bg-[#FF5722] hover:bg-[#e64a19] text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Lecture</span>
                          </button>
                        </div>

                        {/* Lectures */}
                        <div className="space-y-2 pt-2 border-t border-gray-800">
                          {(!mod.lectures || mod.lectures.length === 0) ? (
                            <div className="py-6 text-center text-xs text-gray-500 bg-[#0C0E12]/50 rounded-2xl border border-dashed border-gray-800">
                              No video lectures yet. Click <strong className="text-gray-300">"+ Add Lecture"</strong> to upload a video or free trailer.
                            </div>
                          ) : (
                            mod.lectures.map((lec, lecIdx) => {
                              const isFree = lec.accessType === 'free' || lec.isFreePreview;
                              return (
                                <div key={lec.id || lecIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-[#0C0E12] border border-gray-800 gap-3">
                                  <div className="flex items-center gap-3">
                                    <Video className="w-4 h-4 text-[#FF5722] shrink-0" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white">{lec.title} ({lec.duration})</span>
                                        {/* Access Status Badge */}
                                        <button
                                          onClick={() => {
                                            const newAccess = isFree ? 'enrolled' : 'free';
                                            updateLectureInModule(activeCourse.id, modIdx, lecIdx, {
                                              accessType: newAccess,
                                              isFreePreview: newAccess === 'free'
                                            });
                                            showToast(`Access updated to ${newAccess === 'free' ? 'Free Preview' : 'Enrolled Only'}`);
                                          }}
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                                            isFree
                                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                                          }`}
                                          title="Click to toggle between Free Preview and Enrolled Only"
                                        >
                                          {isFree ? (
                                            <>
                                              <Film className="w-2.5 h-2.5" />
                                              <span>Free Preview / Trailer</span>
                                            </>
                                          ) : (
                                            <>
                                              <Lock className="w-2.5 h-2.5" />
                                              <span>Enrolled Only</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <div className="text-[11px] text-gray-400 font-mono truncate max-w-md mt-0.5">{lec.videoUrl}</div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                      onClick={() => setPreviewingLecture(lec)}
                                      className="px-2.5 py-1.5 bg-[#1B202B] hover:bg-[#252C3B] text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                                      title="Watch / Preview Video Lecture in Admin"
                                    >
                                      <Film className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Watch Video</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenEditLecture(activeCourse.id, modIdx, lecIdx, lec)}
                                      className="px-2.5 py-1.5 bg-[#1B202B] hover:bg-[#252C3B] text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold border border-amber-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                                      title="Edit Lecture Title, Duration, Access & Summary"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Permanently delete video lecture "${lec.title}"?`)) {
                                          deleteLectureFromModule(activeCourse.id, modIdx, lecIdx);
                                          showToast(`Video lecture deleted.`);
                                        }
                                      }}
                                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer transition-colors"
                                      title="Permanently Delete Lecture"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* UPCOMING COURSES & TESTIMONIALS TAB */}
              {academyNav === 'upcoming' && (
                <div className="space-y-6">
                  {/* Header & Quick Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161920] p-6 rounded-2xl border border-gray-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <h3 className="font-serif font-bold text-2xl text-white">Upcoming Courses & Testimonials</h3>
                      </div>
                      <p className="text-xs text-gray-400 max-w-2xl">
                        Customize next-generation atelier batches, announcement badges, launch dates, pre-booking fees, and student anticipation testimonials shown on the website homepage.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setEditingUpcomingCourse(null);
                        setUpcomingForm({
                          title: '',
                          category: 'Oil Painting Masterclass',
                          badge: 'Launching Soon • Limited 15 Seats',
                          startDate: 'November 2026',
                          duration: '6 Weeks • 12 Live Sessions',
                          level: 'All Levels',
                          price: 4999,
                          originalPrice: 8500,
                          description: '',
                          instructorQuote: '',
                          thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
                          seatsTotal: 15,
                          seatsLeft: 5,
                          status: 'open_for_booking',
                          isActive: true,
                          studentTestimonial: {
                            name: '',
                            role: 'Fine Arts Scholar',
                            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                            quote: '',
                            rating: 5
                          }
                        });
                        setIsUpcomingModalOpen(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Upcoming Course</span>
                    </button>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
                      <span className="text-xs text-gray-400 block font-medium">Total Upcoming Batches</span>
                      <span className="text-2xl font-bold text-white mt-1 block">{upcomingCourses.length}</span>
                    </div>
                    <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
                      <span className="text-xs text-gray-400 block font-medium">Active on Homepage</span>
                      <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                        {upcomingCourses.filter(c => c.isActive !== false).length}
                      </span>
                    </div>
                    <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
                      <span className="text-xs text-gray-400 block font-medium">Pre-Booking Open</span>
                      <span className="text-2xl font-bold text-amber-400 mt-1 block">
                        {upcomingCourses.filter(c => c.status === 'open_for_booking').length}
                      </span>
                    </div>
                    <div className="bg-[#161920] p-4 rounded-xl border border-gray-800">
                      <span className="text-xs text-gray-400 block font-medium">Total Anticipated Seats</span>
                      <span className="text-2xl font-bold text-purple-400 mt-1 block">
                        {upcomingCourses.reduce((sum, c) => sum + (c.seatsTotal || 0), 0)}
                      </span>
                    </div>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161920] p-3 rounded-xl border border-gray-800">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search upcoming courses or badges..."
                        value={upcomingSearchQuery}
                        onChange={(e) => setUpcomingSearchQuery(e.target.value)}
                        className="w-full bg-[#101216] border border-gray-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                      {['All', 'Oil Painting Masterclass', 'Charcoal & Graphite', 'Landscape & Nature'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setUpcomingCategoryFilter(cat)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                            upcomingCategoryFilter === cat
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-[#101216] text-gray-400 hover:text-white border border-gray-800'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Courses Grid */}
                  {filteredUpcomingCourses.length === 0 ? (
                    <div className="bg-[#161920] p-12 text-center rounded-2xl border border-gray-800">
                      <Sparkles className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-300">No upcoming courses match your filter.</p>
                      <p className="text-xs text-gray-500 mt-1">Click "+ Add Upcoming Course" to create a new batch.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredUpcomingCourses.map((c) => (
                        <div
                          key={c.id}
                          className={`bg-[#161920] rounded-2xl overflow-hidden border transition-all flex flex-col justify-between ${
                            c.isActive !== false ? 'border-gray-800 hover:border-gray-700' : 'border-red-900/40 opacity-70'
                          }`}
                        >
                          {/* Image & Header Tags */}
                          <div className="relative h-44 overflow-hidden bg-black">
                            <img src={c.thumbnail} alt={c.title} className="w-full h-full object-cover opacity-80" />
                            <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                              <span className="bg-amber-500 text-black text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                <Flame className="w-2.5 h-2.5" />
                                {c.badge}
                              </span>
                              <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-full">
                                {c.category}
                              </span>
                            </div>

                            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white">
                              <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-amber-400" />
                                {c.startDate}
                              </span>
                              <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {c.duration}
                              </span>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-serif font-bold text-base text-white leading-tight">{c.title}</h4>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                  c.isActive !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {c.isActive !== false ? 'Active' : 'Hidden'}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                            </div>

                            {/* Testimonial preview */}
                            {c.studentTestimonial && (
                              <div className="p-2.5 bg-[#101216] rounded-xl border border-gray-800 text-[11px]">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-0.5 text-amber-400">
                                    {[...Array(c.studentTestimonial.rating || 5)].map((_, i) => (
                                      <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                                    ))}
                                  </div>
                                  <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Scholar Testimonial</span>
                                </div>
                                <p className="text-gray-300 italic line-clamp-2">"{c.studentTestimonial.quote}"</p>
                                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-gray-400">
                                  <img src={c.studentTestimonial.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                  <span className="font-medium text-white">{c.studentTestimonial.name}</span>
                                  <span>• {c.studentTestimonial.role}</span>
                                </div>
                              </div>
                            )}

                            {/* Pricing & Seats */}
                            <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between text-xs">
                              <div>
                                <span className="text-[10px] text-gray-500 block">Pre-Booking Fee</span>
                                <div className="flex items-baseline gap-1.5">
                                  {c.originalPrice && (
                                    <span className="text-[11px] text-gray-500 line-through">₹{c.originalPrice}</span>
                                  )}
                                  <span className="font-bold text-white text-sm">₹{c.price}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-gray-500 block">Atelier Seats</span>
                                <span className="text-xs font-semibold text-amber-300">
                                  {c.seatsLeft || 0} / {c.seatsTotal || 15} left
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-2 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  updateUpcomingCourse(c.id, { isActive: !c.isActive });
                                  showToast(c.isActive ? 'Upcoming course hidden from homepage' : 'Upcoming course is now live on homepage!');
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center ${
                                  c.isActive !== false
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}
                              >
                                {c.isActive !== false ? 'Hide' : 'Publish'}
                              </button>

                              <button
                                onClick={() => {
                                  setEditingUpcomingCourse(c);
                                  setUpcomingForm({
                                    ...c,
                                    studentTestimonial: c.studentTestimonial || {
                                      name: '',
                                      role: 'Fine Arts Scholar',
                                      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
                                      quote: '',
                                      rating: 5
                                    }
                                  });
                                  setIsUpcomingModalOpen(true);
                                }}
                                className="p-1.5 rounded-lg bg-[#242934] hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                title="Edit Upcoming Course"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete upcoming course "${c.title}"?`)) {
                                    deleteUpcomingCourse(c.id);
                                    showToast(`Upcoming course "${c.title}" deleted.`);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                                title="Delete Upcoming Course"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STUDENTS & ATTENDANCE TAB */}
              {academyNav === 'students' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Enrolled Students & Live Attendance</h3>
                      <p className="text-xs text-gray-400">Track students enrolled across all masterclasses and mark attendance for live sessions.</p>
                    </div>

                    <button
                      onClick={() => {
                        setNewStudentForm({ name: '', email: '', phone: '', courseId: selectedLiveBatchId });
                        setIsAddStudentModalOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow shrink-0"
                    >
                      <Users className="w-4 h-4" />
                      <span>+ Grant Free Student Access</span>
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="flex items-center gap-2 bg-[#14171E] border border-[#202530] rounded-2xl px-4 py-2.5 text-xs">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      placeholder="Search student by name, email or course..."
                      className="bg-transparent text-white placeholder-gray-500 text-xs w-full focus:outline-none"
                    />
                  </div>

                  {/* Students Table */}
                  <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Student</th>
                          <th className="pb-3 font-semibold">Enrolled Course / Batch</th>
                          <th className="pb-3 font-semibold">Tuition Fee</th>
                          <th className="pb-3 font-semibold">Student Password</th>
                          <th className="pb-3 font-semibold text-center">Live Attendance</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {students
                          .filter((s) => {
                            const q = studentSearchQuery.toLowerCase();
                            const matchedOrderPhone = orders.find(o => o.customerEmail?.toLowerCase() === s.email?.toLowerCase())?.customerPhone || '';
                            const matchedInqPhone = inquiries.find(i => i.email?.toLowerCase() === s.email?.toLowerCase())?.phone || '';
                            const sPhone = (s.phone || matchedOrderPhone || matchedInqPhone).toLowerCase();
                            return (
                              (s.name || '').toLowerCase().includes(q) ||
                              (s.email || '').toLowerCase().includes(q) ||
                              (s.courseTitle || '').toLowerCase().includes(q) ||
                              (s.username || '').toLowerCase().includes(q) ||
                              sPhone.includes(q)
                            );
                          })
                          .map((stu) => {
                            const isAttended = stu.attendanceStatus === 'Attended';
                            const isRevealed = visibleStudentPasswords[stu.id];
                            const passText = stu.plainPassword || 'art123456';
                            return (
                              <tr key={stu.id} className="hover:bg-gray-900/40 transition-colors">
                                <td className="py-3.5">
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>{stu.name}</span>
                                    {stu.username && (
                                      <span className="text-[11px] text-gray-500 font-mono font-normal">@{stu.username}</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-gray-400 font-mono">{stu.email}</div>
                                  {(() => {
                                    const registeredNumber = stu.phone || orders.find(o => o.customerEmail?.toLowerCase() === stu.email?.toLowerCase())?.customerPhone || inquiries.find(i => i.email?.toLowerCase() === stu.email?.toLowerCase())?.phone || '';
                                    if (registeredNumber) {
                                      const cleanPhone = registeredNumber.replace(/[^\d+]/g, '');
                                      return (
                                        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 mt-1 font-semibold">
                                          <Phone className="w-3 h-3 text-[#FF5722]" />
                                          <a
                                            href={`tel:${cleanPhone}`}
                                            className="hover:underline"
                                            title="Click to Call / WhatsApp"
                                          >
                                            {registeredNumber}
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleCopyPassword(registeredNumber, `phone-${stu.id}`)}
                                            className="text-gray-500 hover:text-white p-0.5 cursor-pointer ml-0.5"
                                            title="Copy Register Number"
                                          >
                                            {copiedKey === `phone-${stu.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                          </button>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div className="text-[10px] text-gray-600 font-mono mt-0.5 flex items-center gap-1">
                                        <Phone className="w-2.5 h-2.5 text-gray-600" />
                                        <span>No number registered</span>
                                      </div>
                                    );
                                  })()}
                                </td>
                                <td className="py-3.5 text-gray-300 font-medium">
                                  <div>{stu.courseTitle}</div>
                                  <div className="text-[10px] text-gray-500">{stu.batchSchedule || 'Weekend Atelier'}</div>
                                </td>
                                <td className="py-3.5 font-bold text-emerald-400">
                                  ₹{(stu.feesPaid || 9999).toLocaleString('en-IN')} <span className="text-[10px] text-emerald-500/80">Paid ✓</span>
                                </td>
                                <td className="py-3.5">
                                  <div className="inline-flex items-center gap-1.5 bg-[#1B1F2A] border border-gray-700/60 rounded-xl px-2.5 py-1 font-mono text-xs text-emerald-400">
                                    <span>{isRevealed ? passText : '••••••••'}</span>
                                    <button
                                      type="button"
                                      onClick={() => setVisibleStudentPasswords((prev) => ({ ...prev, [stu.id]: !prev[stu.id] }))}
                                      className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassword(passText, `stu-${stu.id}`)}
                                      className="text-gray-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                                      title="Copy Password"
                                    >
                                      {copiedKey === `stu-${stu.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3.5 text-center">
                                  <button
                                    onClick={() => handleToggleAttendance(stu.id, stu.attendanceStatus)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                                      isAttended
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                                        : 'bg-gray-800/80 text-gray-400 border border-gray-700 hover:text-white'
                                    }`}
                                    title="Click to toggle attendance status"
                                  >
                                    {isAttended ? (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Attended ✓</span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                        <span>Mark Present</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingStudent(stu);
                                        setEditStudentForm({
                                          name: stu.name,
                                          email: stu.email,
                                          username: stu.username || stu.email.split('@')[0],
                                          plainPassword: stu.plainPassword || '',
                                          courseId: stu.courseId,
                                          courseTitle: stu.courseTitle,
                                          feesPaid: stu.feesPaid || 349,
                                          batchSchedule: stu.batchSchedule || '',
                                          phone: stu.phone || ''
                                        });
                                        setIsEditStudentModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-[#FF5722] text-gray-300 hover:text-white transition-all cursor-pointer"
                                      title="Edit Student & Password"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Remove ${stu.name} from enrolled masterclasses?`)) {
                                          deleteStudent(stu.id);
                                          showToast('Student access removed.');
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-all cursor-pointer"
                                      title="Remove Student Access"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REGISTERED USERS & WEBSITE LOGINS TAB */}
              {academyNav === 'users' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Registered Accounts & Website Logins</h3>
                      <p className="text-xs text-gray-400">View registered student accounts, manage passwords, or update login credentials if a student forgets their password.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>{users.length} Active Accounts</span>
                      </span>
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="flex items-center gap-2 bg-[#14171E] border border-[#202530] rounded-2xl px-4 py-2.5 text-xs">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search accounts by name, email, or @username..."
                      className="bg-transparent text-white placeholder-gray-500 text-xs w-full focus:outline-none"
                    />
                  </div>

                  {/* Users Table */}
                  <div className="bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase tracking-wider">
                          <th className="pb-3 font-semibold">User Profile</th>
                          <th className="pb-3 font-semibold">Email Address</th>
                          <th className="pb-3 font-semibold">Website Login Password</th>
                          <th className="pb-3 font-semibold text-center">Courses Enrolled</th>
                          <th className="pb-3 font-semibold text-center">Role</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {users
                          .filter((u) => {
                            const q = userSearchQuery.toLowerCase();
                            return (
                              (u.name || '').toLowerCase().includes(q) ||
                              (u.email || '').toLowerCase().includes(q) ||
                              (u.username || '').toLowerCase().includes(q)
                            );
                          })
                          .map((u) => {
                            const isRevealed = visibleUserPasswords[u.id];
                            const passText = u.plainPassword || 'art123456';
                            return (
                              <tr key={u.id} className="hover:bg-gray-900/40 transition-colors">
                                <td className="py-3.5">
                                  <div className="font-bold text-white flex items-center gap-2">
                                    <span>{u.name}</span>
                                    <span className="text-[11px] text-gray-500 font-mono font-normal">@{u.username || u.email.split('@')[0]}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 text-gray-300 font-mono text-[11px]">{u.email}</td>
                                <td className="py-3.5">
                                  <div className="inline-flex items-center gap-2 bg-[#1B1F2A] border border-gray-700/60 rounded-xl px-2.5 py-1 font-mono text-xs text-emerald-400">
                                    <span>{isRevealed ? passText : '••••••••'}</span>
                                    <button
                                      type="button"
                                      onClick={() => setVisibleUserPasswords((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                                      className="text-gray-400 hover:text-white p-0.5 cursor-pointer"
                                      title={isRevealed ? 'Hide Password' : 'Show Password'}
                                    >
                                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyPassword(passText, `user-${u.id}`)}
                                      className="text-gray-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                                      title="Copy Password"
                                    >
                                      {copiedKey === `user-${u.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3.5 text-center">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {(u.enrolledCourseIds || []).length} Courses
                                  </span>
                                </td>
                                <td className="py-3.5 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    u.role === 'collector'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}>
                                    {u.role || 'student'}
                                  </span>
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingUser(u);
                                        setEditUserForm({
                                          name: u.name || '',
                                          username: u.username || u.email.split('@')[0],
                                          email: u.email || '',
                                          password: u.plainPassword || '',
                                          role: u.role || 'student'
                                        });
                                        setIsEditUserModalOpen(true);
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-[#FF5722] text-gray-300 hover:text-white transition-all cursor-pointer"
                                      title="Edit Login ID & Password"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Permanently delete user account "${u.name}" (${u.email})?`)) {
                                          deleteUser(u.id);
                                          showToast('User account deleted.');
                                        }
                                      }}
                                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-600 text-gray-400 hover:text-white transition-all cursor-pointer"
                                      title="Delete Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TESTIMONIALS & REVIEWS TAB (Academy Console) */}
              {academyNav === 'testimonials' && renderTestimonialsTabContent()}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: SCHEDULE NEW LIVE BATCH / MASTERCLASS (Side 2)   */}
      {/* ========================================================= */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-xl shadow-2xl my-auto relative text-white flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between p-5 sm:p-8 pb-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5722] to-[#FF7A45] flex items-center justify-center text-white shadow-lg shadow-[#FF5722]/30">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    {courseToEdit ? 'Edit Live Batch / Course' : 'Schedule New Live Batch / Course'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {courseToEdit
                      ? `Updating parameters for ${courseToEdit.title}`
                      : 'Publish an upcoming masterclass batch for students to enroll in.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsNewBatchModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLiveBatch} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-8 overflow-y-auto flex-1 space-y-4 text-xs overscroll-contain">
              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Course / Masterclass Batch Title *</label>
                <input
                  type="text"
                  required
                  value={newBatchForm.title}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, title: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  placeholder="e.g. Master Oil Glazing & Portraiture (Winter 2026)"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Batch Start Date * (e.g. 22 Oct, 2026)</label>
                  <input
                    type="text"
                    required
                    value={newBatchForm.startDate}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, startDate: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="22 Oct, 2026"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Category / Medium *</label>
                  <select
                    value={categorySelect}
                    onChange={(e) => setCategorySelect(e.target.value)}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="Oil Painting">Oil Painting</option>
                    <option value="Realistic Sketching">Realistic Sketching</option>
                    <option value="Watercolor & Fluid">Watercolor & Fluid</option>
                    <option value="Color Theory">Color Theory</option>
                    <option value="Acrylic Painting">Acrylic Painting</option>
                    <option value="Other">Other (Custom Medium)...</option>
                  </select>

                  {categorySelect === 'Other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        required
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Type custom medium (e.g. Charcoal, Resin Art, etc.)..."
                        className="w-full bg-[#12141A] border border-[#FF5722]/70 focus:border-[#FF5722] rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none ring-1 ring-[#FF5722]/30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Class Images & Gallery (Multiple Photos for Students) */}
              <div className="space-y-3 bg-[#181C24]/80 border border-[#242A36] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF5722]" />
                    <span>Batch Images & Student Gallery (Multiple Photos)</span>
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {newBatchForm.images.length} Image{newBatchForm.images.length === 1 ? '' : 's'} Selected
                  </span>
                </div>

                {/* Multiple Images Grid Preview */}
                {newBatchForm.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1 bg-black/30 rounded-xl border border-gray-800">
                    {newBatchForm.images.map((imgUrl, imgIdx) => {
                      const isPrimary = imgIdx === 0;
                      return (
                        <div
                          key={imgIdx}
                          className={`relative rounded-xl overflow-hidden aspect-video border group shadow-md ${
                            isPrimary ? 'border-[#FF5722] ring-2 ring-[#FF5722]/40' : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Batch image ${imgIdx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop';
                            }}
                          />
                          {isPrimary && (
                            <span className="absolute top-1 left-1 bg-[#FF5722] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              ★ Main Banner
                            </span>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {!isPrimary && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(imgIdx)}
                                className="px-1.5 py-1 rounded bg-[#FF5722] hover:brightness-110 text-white text-[9px] font-bold cursor-pointer"
                                title="Set as Main Banner"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveBatchImage(imgIdx)}
                              className="p-1 rounded bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                              title="Delete Image"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-5 border border-dashed border-gray-700 rounded-xl bg-black/20 text-gray-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-500 opacity-60" />
                    <p className="text-xs">No images added yet.</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Upload photos below to showcase syllabus paintings & atelier demonstrations to students.</p>
                  </div>
                )}

                {/* Upload Buttons & URL Input */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-red-500/10 transition-all shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Multiple Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleImageUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="url"
                      value={batchImageUrlInput}
                      onChange={(e) => setBatchImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBatchImageUrl();
                        }
                      }}
                      placeholder="Paste image URL (https://...)"
                      className="w-full bg-[#12141A] border border-[#242A36] rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                    />
                    <button
                      type="button"
                      onClick={handleAddBatchImageUrl}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border border-gray-700"
                    >
                      + Add URL
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Duration * (e.g. 1 Month, 2 Months)</label>
                  <input
                    type="text"
                    required
                    value={newBatchForm.durationMonths}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, durationMonths: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. 1 Month"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Tuition Fee (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={newBatchForm.price}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, price: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="9999"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Schedule / Class Timings</label>
                  <input
                    type="text"
                    value={newBatchForm.schedule}
                    onChange={(e) => setNewBatchForm({ ...newBatchForm, schedule: e.target.value })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    placeholder="e.g. Saturday & Sunday • 6:00 PM – 8:00 PM IST"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Google Meet / Live Workshop Link</label>
                <input
                  type="url"
                  value={newBatchForm.liveClassUrl}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, liveClassUrl: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Syllabus Overview / Description</label>
                <textarea
                  rows={2}
                  value={newBatchForm.summary}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, summary: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              {/* What You Will Master Section */}
              <div className="space-y-3 bg-[#181C24]/80 border border-[#242A36] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>What You Will Master ({newBatchForm.whatYouWillLearn?.length || 0} Points)</span>
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Key bullet points shown with checkmarks on the course page
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewBatchForm({
                      ...newBatchForm,
                      whatYouWillLearn: [...(newBatchForm.whatYouWillLearn || []), '']
                    })}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-amber-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-gray-700 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Point</span>
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {(newBatchForm.whatYouWillLearn || []).map((point, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-gray-500 font-mono text-[11px]">{pIdx + 1}.</span>
                      <input
                        type="text"
                        value={point}
                        onChange={(e) => {
                          const next = [...(newBatchForm.whatYouWillLearn || [])];
                          next[pIdx] = e.target.value;
                          setNewBatchForm({ ...newBatchForm, whatYouWillLearn: next });
                        }}
                        placeholder="e.g. Live Real-Time Easel Demonstrations"
                        className="flex-1 bg-[#12141A] border border-[#242A36] rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (newBatchForm.whatYouWillLearn || []).filter((_, i) => i !== pIdx);
                          setNewBatchForm({ ...newBatchForm, whatYouWillLearn: next });
                        }}
                        disabled={(newBatchForm.whatYouWillLearn?.length || 0) <= 1}
                        className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30 cursor-pointer rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete Point"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materials & Equipment Needed Section */}
              <div className="space-y-3 bg-[#181C24]/80 border border-[#242A36] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-gray-300 font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Materials & Equipment Needed ({newBatchForm.materialsNeeded?.length || 0} Items)</span>
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Tools & pigments students need for this course
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewBatchForm({
                      ...newBatchForm,
                      materialsNeeded: [...(newBatchForm.materialsNeeded || []), '']
                    })}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-emerald-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer border border-gray-700 flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Material</span>
                  </button>
                </div>

                <div className="space-y-2 mt-2">
                  {(newBatchForm.materialsNeeded || []).map((mat, mIdx) => (
                    <div key={mIdx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-gray-500 font-mono text-[11px]">•</span>
                      <input
                        type="text"
                        value={mat}
                        onChange={(e) => {
                          const next = [...(newBatchForm.materialsNeeded || [])];
                          next[mIdx] = e.target.value;
                          setNewBatchForm({ ...newBatchForm, materialsNeeded: next });
                        }}
                        placeholder="e.g. Belgian Stretched Linen, Raw Pigments"
                        className="flex-1 bg-[#12141A] border border-[#242A36] rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = (newBatchForm.materialsNeeded || []).filter((_, i) => i !== mIdx);
                          setNewBatchForm({ ...newBatchForm, materialsNeeded: next });
                        }}
                        disabled={(newBatchForm.materialsNeeded?.length || 0) <= 1}
                        className="p-2 text-gray-400 hover:text-red-400 disabled:opacity-30 cursor-pointer rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:p-8 pt-3 border-t border-gray-800 bg-[#14171E] shrink-0">
                <button type="button" onClick={() => setIsNewBatchModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  {courseToEdit ? 'Save Changes' : 'Publish & Schedule Live Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: UPLOAD VIDEO LECTURE (Side 2)                     */}
      {/* ========================================================= */}
      {isAddLectureModalOpen && (() => {
        const uploadTargetCourse =
          courses.find((c) => c.id === targetCourseIdForUpload) || activeCourse || courses[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
            <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-lg shadow-2xl relative text-white flex flex-col max-h-[92vh] my-auto overflow-hidden">
              <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-serif text-white">Upload Course Video / Trailer</h3>
                    <p className="text-xs text-gray-400">
                      Add video lecture or free preview trailer to {uploadTargetCourse?.title || 'Selected Course'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddLectureModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveLecture} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs overscroll-contain">
                {/* 1. Course Selection Dropdown */}
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Select Course / Live Batch *</label>
                  <select
                    value={targetCourseIdForUpload || uploadTargetCourse?.id || ''}
                    onChange={(e) => {
                      setTargetCourseIdForUpload(e.target.value);
                      setTargetModuleIndexForAdd(0);
                    }}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-[#FF5722]"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.startDate || 'Scheduled'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">This video will be attached and saved directly into this chosen course.</p>
                </div>

                {/* 2. Access Permission Selector (Free Trailer vs Enrolled Only) */}
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Video Access Permission *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLectureForm({ ...lectureForm, accessType: 'enrolled' })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        lectureForm.accessType === 'enrolled'
                          ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20 text-white'
                          : 'bg-[#181C24] border-[#242A36] text-gray-400 hover:text-white'
                      }`}
                    >
                      <Lock className={`w-4 h-4 mt-0.5 shrink-0 ${lectureForm.accessType === 'enrolled' ? 'text-amber-400' : 'text-gray-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Enrolled Students Only</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Locked for students enrolled in this batch.</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLectureForm({ ...lectureForm, accessType: 'free' })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                        lectureForm.accessType === 'free'
                          ? 'bg-emerald-500/10 border-emerald-500/60 ring-2 ring-emerald-500/20 text-white'
                          : 'bg-[#181C24] border-[#242A36] text-gray-400 hover:text-white'
                      }`}
                    >
                      <Film className={`w-4 h-4 mt-0.5 shrink-0 ${lectureForm.accessType === 'free' ? 'text-emerald-400' : 'text-gray-500'}`} />
                      <div>
                        <div className="text-xs font-bold text-white">Free Preview / Trailer</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">Free for all visitors to watch before enrolling.</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Title */}
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Video / Lecture Title *</label>
                  <input
                    type="text"
                    required
                    value={lectureForm.title}
                    onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                    placeholder={
                      lectureForm.accessType === 'free'
                        ? 'e.g. Course Trailer & Orientation Demo'
                        : 'e.g. Master Sight-Size Portrait Demo Part 1'
                    }
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                  <p className="text-[10px] text-amber-400/90 mt-1">
                    💡 Ye naam students ko portal me dikhega. Yahan saaf title likhein (jaise "Lesson 1: Oil Painting Foundations").
                  </p>
                </div>

                {/* 4. Video Source (Computer File vs Stream Link) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-gray-300 font-semibold">Video Source *</label>
                    <div className="flex items-center p-0.5 bg-[#181C24] border border-[#242A36] rounded-xl text-[11px]">
                      <button
                        type="button"
                        onClick={() => setVideoUploadSource('file')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          videoUploadSource === 'file'
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <FileVideo className="w-3.5 h-3.5" />
                        <span>📁 Computer Video File</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoUploadSource('link')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          videoUploadSource === 'link'
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>🔗 Paste Link / Cloud URL</span>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: FILE PICKER FROM COMPUTER */}
                  {videoUploadSource === 'file' && (
                    <div className="space-y-2.5">
                      <label className="block border-2 border-dashed border-[#2F3646] hover:border-amber-500/60 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-[#181C24]/60 hover:bg-[#181C24]">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                          onChange={handleVideoFileSelected}
                          className="hidden"
                        />
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-2.5 border border-amber-500/20">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-white">
                          {selectedVideoFile ? 'Choose a Different Video File' : 'Click to Select Video File from Computer / Phone'}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">
                          MP4, WebM, MOV, Screen Recordings, Recorded Camera Video
                        </p>
                      </label>

                      {/* Selected File Details & Preview */}
                      {selectedVideoFile && (
                        <div className="p-3.5 rounded-2xl bg-[#181C24] border border-[#242A36] space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileVideo className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">{selectedVideoFile.name}</span>
                            </div>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-gray-800 text-emerald-400 font-bold shrink-0">
                              {selectedVideoFile.size}
                            </span>
                          </div>

                          {/* Live Real-Time TUS Upload Progress Indicator */}
                          {(isProcessingVideoFile || uploadProgressPercent > 0) && (
                            <div className="p-3.5 rounded-xl bg-[#0F1218] border border-amber-500/40 space-y-2.5 animate-in fade-in ring-2 ring-amber-500/10">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${uploadProgressPercent === 100 ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                                  <span className="font-bold text-white flex items-center gap-1.5">
                                    <Cloud className="w-3.5 h-3.5 text-amber-400" />
                                    {uploadProgressPercent === 100
                                      ? '✅ Uploaded to Bunny.net (100%)'
                                      : `Uploading to Bunny.net CDN (${uploadProgressPercent}%)`}
                                  </span>
                                </div>
                                <span className="font-mono text-emerald-400 font-bold text-[11px] bg-stone-900 px-2 py-0.5 rounded-md border border-stone-800">
                                  {uploadedBytesStr} {uploadSpeedStr && `• ${uploadSpeedStr}`}
                                </span>
                              </div>

                              {/* Visual Progress Bar Track */}
                              <div className="w-full h-2.5 bg-stone-900 rounded-full overflow-hidden border border-stone-800 p-0.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    uploadProgressPercent === 100
                                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                                      : 'bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                  }`}
                                  style={{ width: `${Math.max(2, uploadProgressPercent)}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-gray-400">
                                <span>
                                  {uploadProgressPercent === 100
                                    ? '🚀 Ready! Click "Upload & Save Lecture" below.'
                                    : 'Direct TUS Upload to Bunny Stream CDN'}
                                </span>
                                {uploadProgressPercent > 0 && uploadProgressPercent < 100 && currentTusUpload && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      currentTusUpload.abort();
                                      setIsProcessingVideoFile(false);
                                      setUploadProgressPercent(0);
                                      showToast('Upload cancelled');
                                    }}
                                    className="text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>
                          )}

                          {selectedVideoFile.previewUrl && (
                            <div className="rounded-xl overflow-hidden bg-black border border-gray-800 max-h-48 flex items-center justify-center">
                              <video
                                src={selectedVideoFile.previewUrl}
                                controls
                                className="w-full max-h-48 object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-gray-300 space-y-1">
                        <div className="font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Recorded Video Advice for Best Streaming:</span>
                        </div>
                        <p className="text-gray-400 leading-relaxed">
                          Agar aapki screen recording badi hai (e.g. 50MB se 1GB), toh video ko apne <strong>YouTube (Unlisted)</strong> ya <strong>Google Drive</strong> par daal kar link paste karna sabse best rehta hai. Isse students ke phone aur laptop par video bina kisi buffering ke super-fast HD chalti hai!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: LINK / STREAM URL */}
                  {videoUploadSource === 'link' && (
                    <div className="space-y-2.5">
                      <input
                        type="url"
                        value={lectureForm.videoUrl.startsWith('data:') || lectureForm.videoUrl.startsWith('blob:') ? '' : lectureForm.videoUrl}
                        onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                        placeholder="Paste YouTube, Google Drive, Vimeo, or MP4 link..."
                        className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                      />

                      {/* Quick 1-Click Test Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-400 font-semibold">⚡ Quick Test URLs:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setLectureForm({
                              ...lectureForm,
                              videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                              title: lectureForm.title || 'Master Atelier Live Stream (YouTube Test)',
                              duration: lectureForm.duration || '35 Mins'
                            });
                          }}
                          className="px-2 py-1 rounded-md bg-[#242A36] hover:bg-[#2F3646] text-amber-300 text-[10px] font-mono transition-colors cursor-pointer border border-[#343D4F] flex items-center gap-1"
                        >
                          ▶ YouTube
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLectureForm({
                              ...lectureForm,
                              videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                              title: lectureForm.title || 'HD Pigment Glazing Technique (Direct MP4 Test)',
                              duration: lectureForm.duration || '10 Mins'
                            });
                          }}
                          className="px-2 py-1 rounded-md bg-[#242A36] hover:bg-[#2F3646] text-emerald-300 text-[10px] font-mono transition-colors cursor-pointer border border-[#343D4F] flex items-center gap-1"
                        >
                          🎬 Cloudflare/Direct MP4
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLectureForm({
                              ...lectureForm,
                              videoUrl: 'https://player.vimeo.com/video/76979871',
                              title: lectureForm.title || 'Impasto Texture Secrets (Vimeo HD Test)',
                              duration: lectureForm.duration || '25 Mins'
                            });
                          }}
                          className="px-2 py-1 rounded-md bg-[#242A36] hover:bg-[#2F3646] text-sky-300 text-[10px] font-mono transition-colors cursor-pointer border border-[#343D4F] flex items-center gap-1"
                        >
                          🎥 Vimeo
                        </button>
                      </div>

                      {/* Video Hosting Guide */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-400 pt-1">
                        <div className="p-2.5 rounded-xl bg-[#181C24] border border-[#242A36] space-y-1">
                          <span className="text-white font-bold block">1. YouTube (Unlisted) ⭐ Best</span>
                          <p>Video upload karte waqt Visibility "Unlisted" rakhein. Video YouTube search me nahi aayegi, sirf aapke student portal me unlock hogi!</p>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#181C24] border border-[#242A36] space-y-1">
                          <span className="text-white font-bold block">2. Google Drive Link</span>
                          <p>Google Drive me video upload karke Share &rarr; "Anyone with link can view" karein aur link yahan paste karein.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Duration & Module */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1.5 font-semibold">Duration</label>
                    <input
                      type="text"
                      value={lectureForm.duration}
                      onChange={(e) => setLectureForm({ ...lectureForm, duration: e.target.value })}
                      placeholder="45 Mins"
                      className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1.5 font-semibold">Target Module</label>
                    <select
                      value={targetModuleIndexForAdd}
                      onChange={(e) => setTargetModuleIndexForAdd(Number(e.target.value))}
                      className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                    >
                      {(uploadTargetCourse?.modules && uploadTargetCourse.modules.length > 0) ? (
                        uploadTargetCourse.modules.map((m, idx) => (
                          <option key={m.id || idx} value={idx}>{m.title}</option>
                        ))
                      ) : (
                        <option value={0}>Module 1: Foundations & Orientation</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* 6. Summary / Description */}
                <div>
                  <label className="block text-gray-300 mb-1.5 font-semibold">Lecture Summary / Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={lectureForm.summary}
                    onChange={(e) => setLectureForm({ ...lectureForm, summary: e.target.value })}
                    placeholder="Key concepts or demonstration takeaways..."
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 border-t border-gray-800 bg-[#14171E] shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsAddLectureModalOpen(false)}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                  >
                    Upload & Save Lecture
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ========================================================= */}
      {/* MODAL 2A: EDIT VIDEO LECTURE (Title, Duration, Access)    */}
      {/* ========================================================= */}
      {isEditLectureModalOpen && lectureToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-white space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Edit Video Lecture</h3>
                  <p className="text-xs text-gray-400">Change lecture title, duration, and permissions</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditLectureModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLecture} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Lecture Title *</label>
                <input
                  type="text"
                  required
                  value={editLectureForm.title}
                  onChange={(e) => setEditLectureForm({ ...editLectureForm, title: e.target.value })}
                  placeholder="e.g. Lesson 1: Foundations of Oil Glazing"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
                <p className="text-[10px] text-gray-500 mt-1">This is the title students will see on the student portal and course curriculum.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Duration</label>
                  <input
                    type="text"
                    value={editLectureForm.duration}
                    onChange={(e) => setEditLectureForm({ ...editLectureForm, duration: e.target.value })}
                    placeholder="45 Mins"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Access Permission</label>
                  <select
                    value={editLectureForm.accessType}
                    onChange={(e) => setEditLectureForm({ ...editLectureForm, accessType: e.target.value as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="enrolled">🔒 Enrolled Students Only</option>
                    <option value="free">🎬 Free Preview / Trailer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Summary & Description</label>
                <textarea
                  rows={2}
                  value={editLectureForm.summary}
                  onChange={(e) => setEditLectureForm({ ...editLectureForm, summary: e.target.value })}
                  placeholder="Summary of what is demonstrated in this class..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Video Embed URL (Bunny / YouTube / MP4)</label>
                <input
                  type="text"
                  value={editLectureForm.videoUrl}
                  onChange={(e) => setEditLectureForm({ ...editLectureForm, videoUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditLectureModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Lecture Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2B: WATCH / PREVIEW VIDEO LECTURE (Admin Player)     */}
      {/* ========================================================= */}
      {previewingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative text-white space-y-4 p-5 sm:p-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-base font-serif">{previewingLecture.title}</h4>
                  <p className="text-xs text-gray-400">
                    {previewingLecture.duration} • {previewingLecture.accessType === 'free' || previewingLecture.isFreePreview ? 'Free Preview Trailer' : 'Enrolled Student Access'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewingLecture(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Display */}
            {(() => {
              const vUrl = previewingLecture.videoUrl || '';
              return (
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl flex items-center justify-center">
                  {vUrl.includes('mediadelivery.net') || vUrl.includes('/embed/') ? (
                    <iframe
                      src={vUrl}
                      title={previewingLecture.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                    />
                  ) : vUrl.includes('youtube.com') || vUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        vUrl.includes('youtu.be/')
                          ? `https://www.youtube-nocookie.com/embed/${vUrl.split('youtu.be/')[1]?.split('?')[0]}`
                          : `https://www.youtube-nocookie.com/embed/${vUrl.split('watch?v=')[1]?.split('&')[0]}`
                      }
                      title={previewingLecture.title}
                      className="w-full h-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={vUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400 pt-1">
              <span className="font-mono text-[11px] truncate max-w-md bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">
                {previewingLecture.videoUrl}
              </span>
              <button
                onClick={() => setPreviewingLecture(null)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors self-end sm:self-auto"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: GRANT FREE STUDENT ACCESS (Side 2)                */}
      {/* ========================================================= */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Grant Free Student Access</h3>
                  <p className="text-xs text-gray-400">Unlock masterclass immediately for student email</p>
                </div>
              </div>
              <button onClick={() => setIsAddStudentModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStudentForm.email.trim()) return;
                const targetCourse = courses.find((c) => c.id === newStudentForm.courseId) || courses[0];
                const newStu: EnrolledStudent = {
                  id: 'stu-' + Date.now(),
                  name: newStudentForm.name.trim() || newStudentForm.email.split('@')[0],
                  email: newStudentForm.email.trim().toLowerCase(),
                  phone: newStudentForm.phone.trim() || '+91 98000 00000',
                  courseId: newStudentForm.courseId,
                  courseTitle: targetCourse.title,
                  batchSchedule: targetCourse.schedule,
                  enrolledDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                  feesPaid: targetCourse.price,
                  paymentStatus: 'Paid',
                  progressPercent: 0,
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop',
                  attendanceStatus: 'Pending'
                };
                addStudent(newStu);
                showToast(`Access granted to ${newStu.email}!`);
                setIsAddStudentModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Student Email *</label>
                <input
                  type="email"
                  required
                  value={newStudentForm.email}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Student Name (Optional)</label>
                <input
                  type="text"
                  value={newStudentForm.name}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Register Mobile Number (Phone)</label>
                <input
                  type="tel"
                  value={newStudentForm.phone || ''}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Select Course to Unlock</label>
                <select
                  value={newStudentForm.courseId}
                  onChange={(e) => setNewStudentForm({ ...newStudentForm, courseId: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} (₹{c.price})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsAddStudentModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  Grant Immediate Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3B: EDIT REGISTERED USER ACCOUNT & PASSWORD         */}
      {/* ========================================================= */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/20 text-[#FF5722] flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Edit Login ID & Password</h3>
                  <p className="text-xs text-gray-400">Update account credentials for @{editingUser.username || editingUser.email.split('@')[0]}</p>
                </div>
              </div>
              <button onClick={() => setIsEditUserModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUser(editingUser.id, {
                  name: editUserForm.name.trim(),
                  username: editUserForm.username.trim(),
                  email: editUserForm.email.trim(),
                  plainPassword: editUserForm.password.trim(),
                  password: editUserForm.password.trim(),
                  role: editUserForm.role
                });
                showToast(`Login credentials for ${editUserForm.name || editUserForm.email} updated!`);
                setIsEditUserModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Student Name *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Username (@)</label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                  placeholder="username_without_spaces"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Login Password * (Visible / Editable)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    placeholder="Enter new password"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono text-sm focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">If the student forgot their password, you can change it here and tell them directly.</p>
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Account Role</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                >
                  <option value="student">Academy Student</option>
                  <option value="collector">Art Collector</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsEditUserModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#FF5722] hover:bg-[#FF7043] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF5722]/30 cursor-pointer">
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3C: EDIT ENROLLED STUDENT & COURSE ACCESS           */}
      {/* ========================================================= */}
      {isEditStudentModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">Edit Enrolled Student</h3>
                  <p className="text-xs text-gray-400">Update course tuition fee, password and details</p>
                </div>
              </div>
              <button onClick={() => setIsEditStudentModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateStudent(editingStudent.id, {
                  name: editStudentForm.name.trim(),
                  email: editStudentForm.email.trim(),
                  plainPassword: editStudentForm.plainPassword.trim(),
                  courseId: editStudentForm.courseId,
                  courseTitle: editStudentForm.courseTitle,
                  feesPaid: Number(editStudentForm.feesPaid) || 349,
                  batchSchedule: editStudentForm.batchSchedule,
                  phone: editStudentForm.phone.trim()
                });
                showToast(`Enrolled student ${editStudentForm.name} updated!`);
                setIsEditStudentModalOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Student Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.name}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, name: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editStudentForm.email}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, email: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Register Mobile Number (Phone)</label>
                <input
                  type="tel"
                  value={editStudentForm.phone || ''}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Student Account Password *</label>
                <input
                  type="text"
                  value={editStudentForm.plainPassword}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, plainPassword: e.target.value })}
                  placeholder="Set or view password"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-emerald-400 font-mono text-sm focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Enrolled Course</label>
                <select
                  value={editStudentForm.courseId}
                  onChange={(e) => {
                    const selCourse = courses.find((c) => c.id === e.target.value);
                    setEditStudentForm({
                      ...editStudentForm,
                      courseId: e.target.value,
                      courseTitle: selCourse ? selCourse.title : editStudentForm.courseTitle,
                      batchSchedule: selCourse ? selCourse.schedule : editStudentForm.batchSchedule
                    });
                  }}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-1.5 font-semibold">Tuition Fee Paid (₹)</label>
                <input
                  type="number"
                  value={editStudentForm.feesPaid}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, feesPaid: Number(e.target.value) || 0 })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsEditStudentModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  Update Enrolled Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* MODAL: ADD / EDIT PROMO CODE */}
      {isAddPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    {promoToEdit ? 'Edit Promo Code' : 'Create New Promo Code'}
                  </h3>
                  <p className="text-xs text-gray-400">Coupon discount & collector incentive</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddPromoModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Promo Code *</label>
                  <input
                    type="text"
                    required
                    value={promoForm.code || ''}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ARTISAN20, FESTIVE50"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Discount Type</label>
                    <select
                      value={promoForm.discountType || 'percentage'}
                      onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value as any })}
                      className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat Amount (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">
                      Discount Value ({promoForm.discountType === 'fixed' ? '₹' : '%'}) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={promoForm.discountValue ?? 15}
                      onChange={(e) => setPromoForm({ ...promoForm, discountValue: Number(e.target.value) })}
                      placeholder="15"
                      className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white font-bold focus:outline-none focus:border-[#FF5722]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Minimum Order Amount (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.minOrderAmount ?? 0}
                    onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: Number(e.target.value) })}
                    placeholder="0 (No minimum)"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Leave 0 if code applies to orders of any size.</p>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Description / Note</label>
                  <input
                    type="text"
                    value={promoForm.description || ''}
                    onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                    placeholder="e.g. 15% discount for collectors"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="promoIsActive"
                    checked={promoForm.isActive !== false}
                    onChange={(e) => setPromoForm({ ...promoForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-[#FF5722] focus:ring-0 bg-[#181C24] border-gray-700 cursor-pointer"
                  />
                  <label htmlFor="promoIsActive" className="text-gray-300 cursor-pointer font-medium">
                    Promo Code is Active & Redeemable
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-gray-800 shrink-0 bg-[#14171E] rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsAddPromoModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  {promoToEdit ? 'Save Changes' : 'Create Promo Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD / EDIT PAINTING (Side 1)                      */}
      {/* ========================================================= */}
      {isAddArtworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-xl shadow-2xl relative text-white flex flex-col max-h-[92vh] overflow-hidden my-auto">
            <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FF5722]/15 text-[#FF5722] flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-white">
                    {artworkToEdit ? 'Edit Masterpiece' : 'Add New Painting to Catalog'}
                  </h3>
                  <p className="text-xs text-gray-400">Artwork details & gallery store pricing</p>
                </div>
              </div>
              <button onClick={() => setIsAddArtworkModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveArtwork} className="flex flex-col flex-1 min-h-0 overflow-hidden text-xs">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Painting Title *</label>
                <input
                  type="text"
                  required
                  value={newArtworkForm.title || ''}
                  onChange={(e) => setNewArtworkForm({ ...newArtworkForm, title: e.target.value })}
                  placeholder="e.g. Symphony of the Solitary Tide"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Medium</label>
                  <select
                    value={newArtworkForm.medium}
                    onChange={(e) => setNewArtworkForm({ ...newArtworkForm, medium: e.target.value as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="Oil on Canvas">Oil on Canvas</option>
                    <option value="Charcoal & Graphite">Charcoal & Graphite</option>
                    <option value="Watercolor & Ink">Watercolor & Ink</option>
                    <option value="Acrylic & Mixed Media">Acrylic & Mixed Media</option>
                    <option value="Limited Edition Print">Limited Edition Print</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Price (INR ₹)</label>
                  <input
                    type="number"
                    value={newArtworkForm.price || ''}
                    onChange={(e) => setNewArtworkForm({ ...newArtworkForm, price: Number(e.target.value) })}
                    placeholder="95000"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Dimensions</label>
                  <input
                    type="text"
                    value={newArtworkForm.dimensions || ''}
                    onChange={(e) => setNewArtworkForm({ ...newArtworkForm, dimensions: e.target.value })}
                    placeholder="36 x 48 in (91 x 122 cm)"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Availability Status</label>
                  <select
                    value={newArtworkForm.status}
                    onChange={(e) => setNewArtworkForm({ ...newArtworkForm, status: e.target.value as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value="available">Available for Acquisition</option>
                    <option value="sold">Sold / In Private Collection</option>
                    <option value="reserved">Reserved / Gallery Hold</option>
                  </select>
                </div>
              </div>

              {/* IMAGE UPLOAD & GALLERY SECTION (Direct Device Upload + Multi-Image Selection) */}
              {(() => {
                const artworkImagesList = [newArtworkForm.image, ...(newArtworkForm.detailImages || [])].filter(
                  (url): url is string => Boolean(url && typeof url === 'string' && !url.includes('images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=12'))
                );

                return (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-gray-200 font-bold text-xs">
                          Painting Photos * <span className="text-[#FF5722] font-semibold">(Direct Gallery Upload)</span>
                        </label>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Upload 1 or multiple photos directly from your phone/computer.
                        </p>
                      </div>
                      {artworkImagesList.length > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {artworkImagesList.length} Photo{artworkImagesList.length > 1 ? 's' : ''} Selected
                        </span>
                      )}
                    </div>

                    {/* Main Tap / Drag to Upload Button */}
                    <label className="cursor-pointer group flex flex-col items-center justify-center p-5 border-2 border-dashed border-[#FF5722]/50 hover:border-[#FF5722] rounded-2xl bg-[#161922] hover:bg-[#1C202B] transition-all text-center relative">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleArtworkImagesUpload}
                        className="hidden"
                        disabled={isProcessingArtworkImages}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-[#FF5722]/15 text-[#FF5722] group-hover:scale-110 flex items-center justify-center transition-transform mb-2">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-white group-hover:text-[#FF5722] transition-colors">
                        {isProcessingArtworkImages ? '⏳ Processing & Compressing Images...' : '📷 Select / Upload Images from Device (Multiple Supported)'}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">
                        Tap to open Gallery / Files • Select one or multiple images at once
                      </span>
                    </label>

                    {/* Uploaded Photos Preview Grid */}
                    {artworkImagesList.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block">
                          Selected Photos (Tap "Make Cover" to change main photo):
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {artworkImagesList.map((imgUrl, idx) => {
                            const isCover = idx === 0;
                            return (
                              <div
                                key={idx}
                                className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 bg-black/50 transition-all ${
                                  isCover
                                    ? 'border-[#FF5722] shadow-lg shadow-[#FF5722]/20 ring-2 ring-[#FF5722]/30'
                                    : 'border-gray-800 hover:border-gray-600'
                                }`}
                              >
                                <img src={imgUrl} alt={`Artwork ${idx + 1}`} className="w-full h-full object-cover" />

                                {/* Badge */}
                                <div className="absolute top-1.5 left-1.5 z-10">
                                  {isCover ? (
                                    <span className="bg-[#FF5722] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                                      ★ Cover
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleSetArtworkCoverImage(idx)}
                                      className="bg-black/80 hover:bg-[#FF5722] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded transition cursor-pointer"
                                      title="Set as primary cover"
                                    >
                                      Make Cover
                                    </button>
                                  )}
                                </div>

                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveArtworkImage(idx)}
                                  className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xs opacity-90 hover:opacity-100 transition cursor-pointer shadow"
                                  title="Remove photo"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}

                          {/* Add more tile */}
                          <label className="cursor-pointer border-2 border-dashed border-gray-700 hover:border-[#FF5722] rounded-xl aspect-[4/3] flex flex-col items-center justify-center text-gray-400 hover:text-white bg-[#14171E] hover:bg-black/30 transition-all text-center p-2">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleArtworkImagesUpload}
                              className="hidden"
                              disabled={isProcessingArtworkImages}
                            />
                            <Plus className="w-5 h-5 mb-0.5 text-[#FF5722]" />
                            <span className="text-[10px] font-bold">+ Add More</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Optional URL Fallback */}
                    <div className="pt-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="url"
                          value={artworkUrlInput}
                          onChange={(e) => setArtworkUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddArtworkImageUrl();
                            }
                          }}
                          placeholder="Or paste image URL (optional)..."
                          className="w-full bg-[#12141A] border border-[#242A36] rounded-xl px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                        />
                        <button
                          type="button"
                          onClick={handleAddArtworkImageUrl}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border border-gray-700"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Artist Description & Curatorial Story</label>
                <textarea
                  rows={2}
                  value={newArtworkForm.description || ''}
                  onChange={(e) => setNewArtworkForm({ ...newArtworkForm, description: e.target.value })}
                  placeholder="Poetic description and pigments used..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              </div>

              <div className="flex items-center justify-end gap-3 p-4 sm:p-5 border-t border-gray-800 shrink-0 bg-[#14171E] rounded-b-3xl">
                <button type="button" onClick={() => setIsAddArtworkModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  Save Artwork
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: RECORD NEW PAINTING SALE (Side 1)                */}
      {/* ========================================================= */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold font-serif text-white">Record Painting Sale</h3>
              <button onClick={() => setIsNewOrderModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewOrder} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Painting Title *</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.paintingTitle}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, paintingTitle: e.target.value })}
                  placeholder="e.g. Echoes of the Florentine Dusk"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Sale Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.totalAmount}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, totalAmount: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Initial Pipeline Step</label>
                  <select
                    value={newOrderForm.currentStep}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, currentStep: Number(e.target.value) as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  >
                    <option value={1}>Step 1: Placed</option>
                    <option value={2}>Step 2: Packing</option>
                    <option value={3}>Step 3: Out for Delivery</option>
                    <option value={4}>Step 4: Delivered ✓</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Collector Full Name *</label>
                <input
                  type="text"
                  required
                  value={newOrderForm.customerName}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                  placeholder="Collector Name"
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Email</label>
                  <input
                    type="email"
                    value={newOrderForm.customerEmail}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                    placeholder="collector@email.com"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">City / Location</label>
                  <input
                    type="text"
                    value={newOrderForm.customerCity}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerCity: e.target.value })}
                    placeholder="e.g. Mumbai, New Delhi"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={() => setIsNewOrderModalOpen(false)} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-[#FF5722] to-[#FF7A45] text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer">
                  Confirm & Save Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: ORDER DETAILS & STEP ADVANCEMENT                 */}
      {/* ========================================================= */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div>
                <h3 className="text-lg font-bold font-serif text-white">Order #{selectedOrderForModal.id}</h3>
                <span className="text-xs text-gray-400">Date: {selectedOrderForModal.date}</span>
              </div>
              <button onClick={() => setSelectedOrderForModal(null)} className="p-1.5 text-gray-400 hover:text-white rounded-xl bg-gray-800/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#0C0E12] p-4 rounded-2xl border border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-400">{isOrderCourse(selectedOrderForModal) ? 'Student Name:' : 'Collector:'}</span>
                <span className="font-bold text-white">{selectedOrderForModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-300 font-mono">{selectedOrderForModal.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">{isOrderCourse(selectedOrderForModal) ? 'Course Title:' : 'Artwork Purchased:'}</span>
                <span className="text-gray-200 font-semibold">{selectedOrderForModal.items[0]?.title || 'Fine Art Original'}</span>
              </div>
              {isOrderCourse(selectedOrderForModal) ? (
                <div className="flex justify-between">
                  <span className="text-gray-400">Access Mode:</span>
                  <span className="text-emerald-400 font-bold">Online Masterclass Access ✓</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-400">Delivery Address:</span>
                  <span className="text-gray-300">{selectedOrderForModal.deliveryAddress || selectedOrderForModal.customerCity || 'Studio Crating'}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400">Total Price:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedOrderForModal.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Step Action or Course Access Action */}
            {isOrderCourse(selectedOrderForModal) ? (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const studentQuery = selectedOrderForModal.customerEmail || selectedOrderForModal.customerName;
                    setSelectedOrderForModal(null);
                    setAdminMode('academy');
                    setAcademyNav('students');
                    setStudentSearchQuery(studentQuery);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Student in Académie (Attendance & Password)</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-gray-400">Pipeline Progression:</span>
                <button
                  onClick={() => {
                    advanceOrderStep(selectedOrderForModal.id);
                    const next = selectedOrderForModal.currentStep < 4 ? selectedOrderForModal.currentStep + 1 : 4;
                    setSelectedOrderForModal({ ...selectedOrderForModal, currentStep: next as any });
                    showToast(`Order #${selectedOrderForModal.id} advanced to Step ${next}!`);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#FF5722] hover:bg-[#e64a19] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <span>Advance to Next Step (Current: Step {selectedOrderForModal.currentStep}/4)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPCOMING COURSE MODAL */}
      {isUpcomingModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14171E] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-xl text-white">
                  {editingUpcomingCourse ? 'Edit Upcoming Course' : 'Create New Upcoming Course'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsUpcomingModalOpen(false);
                  setEditingUpcomingCourse(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpcomingCourse} className="mt-6 space-y-5 text-xs">
              {/* Course Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Course Title *</label>
                  <input
                    type="text"
                    required
                    value={upcomingForm.title || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, title: e.target.value })}
                    placeholder="e.g. Venetian Oil Glazing Masterclass"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Category / Medium</label>
                  <input
                    type="text"
                    value={upcomingForm.category || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, category: e.target.value })}
                    placeholder="e.g. Oil Painting Masterclass"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Announcement Badge & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Announcement Badge</label>
                  <input
                    type="text"
                    value={upcomingForm.badge || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, badge: e.target.value })}
                    placeholder="e.g. Launching Soon • Limited 15 Seats"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Booking Status</label>
                  <select
                    value={upcomingForm.status || 'open_for_booking'}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, status: e.target.value as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="open_for_booking">Open for Booking</option>
                    <option value="upcoming">Upcoming (Announced)</option>
                    <option value="waitlist">Waitlist Only</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              {/* Start Date, Duration & Skill Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Start Date</label>
                  <input
                    type="text"
                    value={upcomingForm.startDate || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, startDate: e.target.value })}
                    placeholder="e.g. November 2026"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Duration / Schedule</label>
                  <input
                    type="text"
                    value={upcomingForm.duration || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, duration: e.target.value })}
                    placeholder="e.g. 6 Weeks • 12 Sessions"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Skill Level</label>
                  <input
                    type="text"
                    value={upcomingForm.level || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, level: e.target.value })}
                    placeholder="e.g. All Levels / Advanced"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Pricing (₹) & Seats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={upcomingForm.price ?? 4999}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, price: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Original Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={upcomingForm.originalPrice || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Optional strikethrough"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Total Seats</label>
                  <input
                    type="number"
                    min={1}
                    value={upcomingForm.seatsTotal ?? 15}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, seatsTotal: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Seats Left</label>
                  <input
                    type="number"
                    min={0}
                    value={upcomingForm.seatsLeft ?? 5}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, seatsLeft: Number(e.target.value) })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Thumbnail URL */}
              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Thumbnail Image URL *</label>
                <input
                  type="url"
                  required
                  value={upcomingForm.thumbnail || ''}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, thumbnail: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Description & Instructor Quote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Course Description</label>
                  <textarea
                    rows={3}
                    value={upcomingForm.description || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, description: e.target.value })}
                    placeholder="Curriculum overview and studio technique focus..."
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Instructor Note / Motto</label>
                  <textarea
                    rows={3}
                    value={upcomingForm.instructorQuote || ''}
                    onChange={(e) => setUpcomingForm({ ...upcomingForm, instructorQuote: e.target.value })}
                    placeholder="e.g. Master the translucent depth of Flemish masters..."
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Testimonial / Scholar Review Sub-Section */}
              <div className="p-4 bg-[#0C0E12] rounded-2xl border border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <Quote className="w-3.5 h-3.5" />
                    <span>Featured Scholar Testimonial / Review</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Displays on course card on homepage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Scholar Name</label>
                    <input
                      type="text"
                      value={upcomingForm.studentTestimonial?.name || ''}
                      onChange={(e) =>
                        setUpcomingForm({
                          ...upcomingForm,
                          studentTestimonial: {
                            ...(upcomingForm.studentTestimonial || { role: 'Scholar', avatar: '', quote: '', rating: 5 }),
                            name: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. Meera Sharma"
                      className="w-full bg-[#14171E] border border-gray-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Role / Batch</label>
                    <input
                      type="text"
                      value={upcomingForm.studentTestimonial?.role || ''}
                      onChange={(e) =>
                        setUpcomingForm({
                          ...upcomingForm,
                          studentTestimonial: {
                            ...(upcomingForm.studentTestimonial || { name: '', avatar: '', quote: '', rating: 5 }),
                            role: e.target.value
                          }
                        })
                      }
                      placeholder="e.g. 2025 Masterclass Alumnus"
                      className="w-full bg-[#14171E] border border-gray-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 text-[11px]">Rating (1-5 Stars)</label>
                    <select
                      value={upcomingForm.studentTestimonial?.rating ?? 5}
                      onChange={(e) =>
                        setUpcomingForm({
                          ...upcomingForm,
                          studentTestimonial: {
                            ...(upcomingForm.studentTestimonial || { name: '', role: 'Scholar', avatar: '', quote: '' }),
                            rating: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-[#14171E] border border-gray-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value={5}>★★★★★ (5 Stars)</option>
                      <option value={4}>★★★★☆ (4 Stars)</option>
                      <option value={3}>★★★☆☆ (3 Stars)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Avatar URL</label>
                  <input
                    type="url"
                    value={upcomingForm.studentTestimonial?.avatar || ''}
                    onChange={(e) =>
                      setUpcomingForm({
                        ...upcomingForm,
                        studentTestimonial: {
                          ...(upcomingForm.studentTestimonial || { name: '', role: 'Scholar', quote: '', rating: 5 }),
                          avatar: e.target.value
                        }
                      })
                    }
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-[#14171E] border border-gray-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-1 text-[11px]">Scholar Testimonial / Review Quote</label>
                  <textarea
                    rows={2}
                    value={upcomingForm.studentTestimonial?.quote || ''}
                    onChange={(e) =>
                      setUpcomingForm({
                        ...upcomingForm,
                        studentTestimonial: {
                          ...(upcomingForm.studentTestimonial || { name: '', role: 'Scholar', avatar: '', rating: 5 }),
                          quote: e.target.value
                        }
                      })
                    }
                    placeholder="What did previous scholars say about Kuldeep Sir's guidance and this upcoming masterclass..."
                    className="w-full bg-[#14171E] border border-gray-800 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="upcomingIsActive"
                  checked={upcomingForm.isActive !== false}
                  onChange={(e) => setUpcomingForm({ ...upcomingForm, isActive: e.target.checked })}
                  className="rounded border-gray-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-gray-900 cursor-pointer"
                />
                <label htmlFor="upcomingIsActive" className="text-gray-300 font-semibold cursor-pointer">
                  Show on Website Homepage (Upcoming Courses section)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsUpcomingModalOpen(false);
                    setEditingUpcomingCourse(null);
                  }}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  {editingUpcomingCourse ? 'Update Upcoming Course' : 'Publish Upcoming Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TESTIMONIAL CREATE / EDIT MODAL */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#14171E] border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-serif font-bold text-xl text-white">
                  {editingTestimonial ? 'Edit Testimonial & Review' : 'Create New Testimonial & Review'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsTestimonialModalOpen(false);
                  setEditingTestimonial(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Author / Scholar Name *</label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.name || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, name: e.target.value })}
                    placeholder="e.g. Eleanor Sterling or Aarav Sharma"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Author Role / Title</label>
                  <input
                    type="text"
                    value={testimonialForm.role || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                    placeholder="e.g. Masterclass Scholar or Art Collector"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">City / Country Location</label>
                  <input
                    type="text"
                    value={testimonialForm.location || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, location: e.target.value })}
                    placeholder="e.g. Delhi, India or London"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Category Type</label>
                  <select
                    value={testimonialForm.category || 'student'}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, category: e.target.value as any })}
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="student">Student / Academy Scholar</option>
                    <option value="upcoming">Upcoming Course Scholar</option>
                    <option value="collector">Art Collector / Patron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Course Name (if scholar)</label>
                  <input
                    type="text"
                    value={testimonialForm.courseTaken || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, courseTaken: e.target.value })}
                    placeholder="e.g. Venetian Oil Glazing Masterclass"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Artwork Acquired (if collector)</label>
                  <input
                    type="text"
                    value={testimonialForm.artworkAcquired || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, artworkAcquired: e.target.value })}
                    placeholder="e.g. Symphony of the Solitary Tide"
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Testimonial Artwork / Slide Image with Direct Upload */}
              <div className="space-y-2 p-4 rounded-2xl bg-[#0F1217] border border-[#242A36]">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-200 font-semibold text-xs">
                    Testimonial Slide / Artwork Image <span className="text-amber-400 text-[10px]">(Large Visual on Live Website)</span>
                  </label>
                  {testimonialForm.artworkImage && (
                    <button
                      type="button"
                      onClick={() => setTestimonialForm({ ...testimonialForm, artworkImage: '' })}
                      className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Image</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <input
                    type="text"
                    value={testimonialForm.artworkImage || ''}
                    onChange={(e) => setTestimonialForm({ ...testimonialForm, artworkImage: e.target.value })}
                    placeholder="Paste Image URL or click Browse button to upload..."
                    className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 font-bold text-xs border border-amber-500/40 cursor-pointer shrink-0 flex items-center gap-1.5 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleTestimonialImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {testimonialForm.artworkImage ? (
                  <div className="relative aspect-[16/9] max-h-48 rounded-xl overflow-hidden bg-black/80 border border-gray-700 mt-2">
                    <img
                      src={testimonialForm.artworkImage}
                      alt="Testimonial visual preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] text-amber-300 font-semibold border border-white/10">
                      ✓ Slide Image Ready
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Select a painting photo or course artwork from your computer or phone. This appears prominently in the live website review carousel.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Review Quote / Testimonial Feedback *</label>
                <textarea
                  rows={4}
                  required
                  value={testimonialForm.comment || ''}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, comment: e.target.value })}
                  placeholder="Write the scholar or collector review quote..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="testimonialIsActive"
                  checked={testimonialForm.isActive !== false}
                  onChange={(e) => setTestimonialForm({ ...testimonialForm, isActive: e.target.checked })}
                  className="rounded border-gray-700 text-amber-500 focus:ring-amber-500 w-4 h-4 bg-gray-900 cursor-pointer"
                />
                <label htmlFor="testimonialIsActive" className="text-gray-300 font-semibold cursor-pointer">
                  Show on Website Homepage (Testimonials section)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsTestimonialModalOpen(false);
                    setEditingTestimonial(null);
                  }}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  {editingTestimonial ? 'Update Testimonial' : 'Publish Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
