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
  AlertCircle
} from 'lucide-react';
import { useStudioData } from '../context/StudioDataContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { Artwork, MediumType, OrderRecord, Course, CourseLecture, EnrolledStudent } from '../types';

interface AdminDashboardPageProps {
  onBackToSite?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = () => {
  const {
    artworks,
    courses,
    students,
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
    addLectureToModule,
    updateLectureInModule,
    deleteLectureFromModule
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
  const [galleryNav, setGalleryNav] = useState<'orders' | 'artworks' | 'analytics' | 'settings' | 'video'>(() => {
    try {
      const saved = localStorage.getItem('ks_admin_gallery_nav');
      if (saved === 'orders' || saved === 'artworks' || saved === 'analytics' || saved === 'settings' || saved === 'video') return saved as any;
    } catch (e) {
      console.warn(e);
    }
    return 'orders';
  });

  // Sub-Navigation for Mode 2: Live Académie & Masterclasses
  const [academyNav, setAcademyNav] = useState<'batches' | 'curriculum' | 'students'>(() => {
    try {
      const saved = localStorage.getItem('ks_admin_academy_nav');
      if (saved === 'batches' || saved === 'curriculum' || saved === 'students') return saved;
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
  // SIDE A: ARTWORKS & ORDERS STATE & HANDLERS
  // =========================================================
  const [orderFilter, setOrderFilter] = useState<string>('all');
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

  // Artwork Management
  const [artworkCategoryFilter, setArtworkCategoryFilter] = useState<string>('All');
  const [artworkSearchQuery, setArtworkSearchQuery] = useState('');
  const [isAddArtworkModalOpen, setIsAddArtworkModalOpen] = useState(false);
  const [artworkToEdit, setArtworkToEdit] = useState<Artwork | null>(null);
  const [newArtworkForm, setNewArtworkForm] = useState<Partial<Artwork>>({
    title: '',
    subtitle: '',
    year: 2026,
    medium: 'Oil on Canvas',
    dimensions: '36 x 48 in (91 x 122 cm)',
    price: 3800,
    image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    description: '',
    story: '',
    framed: true,
    status: 'available',
    featured: true,
    varnishType: 'Archival Satin Varnish'
  });

  // Atelier Video Showcase State (Video Upload / Update)
  const [videoTitle, setVideoTitle] = useState(
    artistProfile?.studioVideoTitle || 'Artist Kuldeep Singh • Master Oil Painting in Atelier'
  );
  const [videoUrl, setVideoUrl] = useState(
    artistProfile?.studioVideoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  );
  const [videoPoster, setVideoPoster] = useState(
    artistProfile?.studioVideoPoster || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop'
  );
  const [videoFileFeedback, setVideoFileFeedback] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);

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
    showToast(`⏳ Uploading "${file.name}" to Bunny Stream Cloud...`);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', videoTitle || file.name);

      let res: Response;
      try {
        res = await fetch('https://kuldeep-singh-backend.onrender.com/api/upload/video', {
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
      setVideoUrl(finalUrl);
      if (result.thumbnailUrl) {
        setVideoPoster(result.thumbnailUrl);
      }
      setVideoFileFeedback(`✅ Successfully uploaded to Bunny Stream! (GUID: ${result.videoGuid})`);
      showToast('🚀 Video uploaded to Bunny Stream CDN & saved to MongoDB Atlas!');

      // Automatically sync profile to cloud & context
      updateArtistProfile({
        studioVideoUrl: finalUrl,
        studioVideoTitle: videoTitle || file.name,
        studioVideoPoster: result.thumbnailUrl || videoPoster,
      });
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
        showToast('✅ Poster image updated!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVideoShowcase = async () => {
    if (!videoUrl.trim()) {
      showToast('⚠️ Please enter or upload a video');
      return;
    }
    updateArtistProfile({
      studioVideoUrl: videoUrl,
      studioVideoTitle: videoTitle,
      studioVideoPoster: videoPoster,
    });

    try {
      await fetch('https://kuldeep-singh-backend.onrender.com/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioVideoUrl: videoUrl,
          studioVideoTitle: videoTitle,
          studioVideoPoster: videoPoster,
        }),
      });
    } catch {
      await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioVideoUrl: videoUrl,
          studioVideoTitle: videoTitle,
          studioVideoPoster: videoPoster,
        }),
      }).catch(() => {});
    }

    showToast('🚀 Atelier Video published and live on website!');
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
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
  }, [orders, orderSearchQuery, orderFilter]);

  // Filtered Artworks
  const filteredArtworks = useMemo(() => {
    return artworks.filter((art) => {
      const matchesCategory =
        artworkCategoryFilter === 'All' || art.medium === artworkCategoryFilter;
      const matchesSearch =
        art.title.toLowerCase().includes(artworkSearchQuery.toLowerCase()) ||
        art.subtitle.toLowerCase().includes(artworkSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [artworks, artworkCategoryFilter, artworkSearchQuery]);

  const handleSaveArtwork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtworkForm.title?.trim()) {
      showToast('Please enter painting title');
      return;
    }

    if (artworkToEdit) {
      updateArtwork(artworkToEdit.id, newArtworkForm);
      showToast(`Artwork "${newArtworkForm.title}" updated successfully!`);
      setArtworkToEdit(null);
    } else {
      const newId = 'art-' + Date.now();
      const newArt: Artwork = {
        id: newId,
        title: newArtworkForm.title || 'Untitled Painting',
        subtitle: newArtworkForm.subtitle || 'Classical Fine Art',
        year: Number(newArtworkForm.year) || 2026,
        medium: (newArtworkForm.medium as MediumType) || 'Oil on Canvas',
        dimensions: newArtworkForm.dimensions || '36 x 48 in',
        price: Number(newArtworkForm.price) || 2500,
        image: newArtworkForm.image || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
        description: newArtworkForm.description || '',
        story: newArtworkForm.story || '',
        framed: Boolean(newArtworkForm.framed),
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

  const [liveStreamUrl, setLiveStreamUrl] = useState<string>(
    activeCourse?.liveClassUrl || 'https://meet.google.com/ks-studio-atelier'
  );
  const [isLiveBroadcasting, setIsLiveBroadcasting] = useState(
    activeCourse?.liveClassStatus === 'live'
  );

  // Sync initial live broadcast status from cloud backend
  useEffect(() => {
    fetch('https://kuldeep-singh-backend.onrender.com/api/live')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.isLive !== undefined) setIsLiveBroadcasting(Boolean(data.isLive));
          if (data.liveStreamUrl) setLiveStreamUrl(data.liveStreamUrl);
        }
      })
      .catch((err) => console.warn('Could not fetch cloud live status:', err));
  }, []);

  const handleToggleBroadcast = async () => {
    const willBeLive = !isLiveBroadcasting;
    setIsLiveBroadcasting(willBeLive);
    try {
      await fetch('https://kuldeep-singh-backend.onrender.com/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLive: willBeLive,
          liveStreamUrl: liveStreamUrl
        })
      });
    } catch (e) {
      console.error('Failed to sync live broadcast to cloud:', e);
    }
    if (activeCourse) {
      updateCourse(activeCourse.id, {
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

  const handleUpdateLiveUrl = async () => {
    try {
      await fetch('https://kuldeep-singh-backend.onrender.com/api/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLive: isLiveBroadcasting,
          liveStreamUrl: liveStreamUrl
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
  const [newBatchForm, setNewBatchForm] = useState({
    title: '',
    startDate: '22 Oct, 2026',
    schedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    price: 9999,
    durationMonths: '2 Months',
    maxSeats: 25,
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
    liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
    summary: 'Direct atelier mentorship, live easel demonstration and critique with Artist Kuldeep Singh.'
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
    setNewBatchForm({
      title: '',
      startDate: '22 Oct, 2026',
      schedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
      price: 9999,
      durationMonths: '2 Months',
      maxSeats: 25,
      thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
      liveClassUrl: 'https://meet.google.com/ks-studio-atelier',
      summary: 'Direct atelier mentorship, live easel demonstration and critique with Artist Kuldeep Singh.'
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
    setNewBatchForm({
      title: course.title,
      startDate: course.startDate || '22 Oct, 2026',
      schedule: course.schedule || 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
      price: course.price,
      durationMonths: course.durationMonths || '2 Months',
      maxSeats: 25,
      thumbnail: course.thumbnail || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
      liveClassUrl: course.liveClassUrl || 'https://meet.google.com/ks-studio-atelier',
      summary: course.summary || course.description || ''
    });
    setIsNewBatchModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewBatchForm((prev) => ({ ...prev, thumbnail: reader.result as string }));
        showToast('✅ Banner image uploaded successfully!');
      }
    };
    reader.readAsDataURL(file);
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

    if (courseToEdit) {
      updateCourse(courseToEdit.id, {
        title: newBatchForm.title,
        startDate: newBatchForm.startDate,
        schedule: newBatchForm.schedule,
        category: finalCategory,
        price: Number(newBatchForm.price),
        durationMonths: newBatchForm.durationMonths,
        thumbnail: newBatchForm.thumbnail,
        liveClassUrl: newBatchForm.liveClassUrl,
        summary: newBatchForm.summary,
        description: newBatchForm.summary
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
        totalLessons: 12,
        price: Number(newBatchForm.price),
        originalPrice: Number(newBatchForm.price) * 1.5,
        rating: 5.0,
        studentsEnrolled: 0,
        thumbnail: newBatchForm.thumbnail || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop',
        summary: newBatchForm.summary,
        description: newBatchForm.summary,
        whatYouWillLearn: [
          'Live Real-Time Easel Demonstrations',
          'Direct 1-on-1 Critique & Q&A Rooms',
          'Permanent Access to HD Class Recordings & Archives'
        ],
        materialsNeeded: ['Linseed Oil & Turpentine', 'Raw Pigments & Oil Paints', 'Belgian Stretched Linen'],
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

  const handleVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    const sizeStr = sizeMb >= 1024 ? (sizeMb / 1024).toFixed(1) + ' GB' : sizeMb.toFixed(1) + ' MB';
    const preview = URL.createObjectURL(file);

    setSelectedVideoFile({
      name: file.name,
      size: sizeStr,
      sizeBytes: file.size,
      previewUrl: preview
    });

    // Auto-fill lecture title if empty
    if (!lectureForm.title) {
      const cleanTitle = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      setLectureForm((prev) => ({ ...prev, title: cleanTitle }));
    }

    if (sizeMb <= 45) {
      setIsProcessingVideoFile(true);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setLectureForm((prev) => ({ ...prev, videoUrl: reader.result as string }));
          showToast(`✅ Video file "${file.name}" loaded successfully (${sizeStr})!`);
        }
        setIsProcessingVideoFile(false);
      };
      reader.onerror = () => {
        setIsProcessingVideoFile(false);
        showToast('❌ Error reading video file');
      };
      reader.readAsDataURL(file);
    } else {
      setLectureForm((prev) => ({ ...prev, videoUrl: preview }));
      showToast(`⚠️ File size is ${sizeStr}. Large files work best via Google Drive or YouTube Unlisted!`);
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
    if (!lectureForm.title.trim() || !lectureForm.videoUrl.trim()) {
      showToast('Please provide lecture title and video stream URL');
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
      title: lectureForm.title.trim(),
      duration: lectureForm.duration.trim() || '45 Mins',
      videoUrl: lectureForm.videoUrl.trim(),
      summary: lectureForm.summary.trim() || (isFree ? 'Free introductory trailer & demonstration.' : 'Master practical demonstration by Artist Kuldeep Singh.'),
      accessType: lectureForm.accessType,
      isFreePreview: isFree
    };

    await addLectureToModule(finalCourseId, targetModuleIndexForAdd, newLec);
    showToast(`✅ Video Lecture "${newLec.title}" saved as ${isFree ? 'Free Preview / Trailer' : 'Enrolled Access'}!`);
    setIsAddLectureModalOpen(false);
    setLectureForm({ title: '', duration: '45 Mins', videoUrl: '', summary: '', accessType: 'enrolled' });
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
      <header className="bg-[#111318] border-b border-[#1B1F27] px-4 sm:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-40 shadow-xl">
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
            href="http://localhost:5173"
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
                      <span className="text-gray-400 text-xs font-semibold uppercase">Total Painting Orders</span>
                      <div className="text-2xl font-bold font-serif text-white mt-1">{orders.length}</div>
                      <span className="text-[11px] text-emerald-400 mt-1 block">Live pipeline tracking</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Packing & Curing</span>
                      <div className="text-2xl font-bold font-serif text-amber-400 mt-1">
                        {orders.filter((o) => o.currentStep === 2).length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Step 2 in pipeline</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">In Transit / Crating</span>
                      <div className="text-2xl font-bold font-serif text-blue-400 mt-1">
                        {orders.filter((o) => o.currentStep === 3).length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Step 3 out for delivery</span>
                    </div>

                    <div className="bg-[#14171E] border border-[#202530] rounded-2xl p-5 shadow">
                      <span className="text-gray-400 text-xs font-semibold uppercase">Delivered & Collected</span>
                      <div className="text-2xl font-bold font-serif text-emerald-400 mt-1">
                        {orders.filter((o) => o.currentStep === 4).length}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 block">Step 4 completed ✓</span>
                    </div>
                  </div>

                  {/* Actions & Filters */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                          {st === 'all' && 'All Orders'}
                          {st === 'step1' && 'Step 1: Placed'}
                          {st === 'step2' && 'Step 2: Packing'}
                          {st === 'step3' && 'Step 3: Out for Delivery'}
                          {st === 'step4' && 'Step 4: Delivered ✓'}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
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
                          <th className="pb-3 font-semibold">Collector</th>
                          <th className="pb-3 font-semibold">Painting</th>
                          <th className="pb-3 font-semibold">Amount</th>
                          <th className="pb-3 font-semibold">Status / Pipeline</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {filteredOrders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-gray-900/40 transition-colors">
                            <td className="py-3.5 font-mono text-gray-300 font-bold">#{ord.id}</td>
                            <td className="py-3.5">
                              <div className="font-bold text-white">{ord.customerName}</div>
                              <div className="text-[11px] text-gray-400">{ord.customerEmail}</div>
                            </td>
                            <td className="py-3.5 text-gray-300 font-medium">
                              {ord.items[0]?.title || 'Fine Art Original'}
                            </td>
                            <td className="py-3.5 font-bold text-emerald-400">
                              ₹{ord.totalAmount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3.5">
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
                        ))}
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
                        <option value="Oil on Canvas">Oil on Canvas</option>
                        <option value="Charcoal on Archival Paper">Charcoal on Paper</option>
                        <option value="Watercolor">Watercolor</option>
                      </select>

                      <button
                        onClick={() => {
                          setArtworkToEdit(null);
                          setNewArtworkForm({
                            title: '',
                            subtitle: '',
                            year: 2026,
                            medium: 'Oil on Canvas',
                            dimensions: '36 x 48 in (91 x 122 cm)',
                            price: 3800,
                            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
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
                          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            art.status === 'sold'
                              ? 'bg-red-500/80 text-white'
                              : 'bg-emerald-500/80 text-white'
                          }`}>
                            {art.status === 'sold' ? 'Sold' : 'Available'}
                          </div>
                        </div>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-xs text-gray-400 font-mono">{art.dimensions} • {art.year}</div>
                            <h4 className="font-serif font-bold text-white text-lg mt-0.5">{art.title}</h4>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1">{art.description}</p>
                          </div>

                          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                            <span className="font-serif font-bold text-lg text-emerald-400">
                              ₹{(art.price * 83).toLocaleString('en-IN')}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setArtworkToEdit(art);
                                  setNewArtworkForm({ ...art });
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

              {/* ATELIER VIDEO SHOWCASE TAB */}
              {galleryNav === 'video' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-2xl text-white">Atelier Studio Video & Process Reel</h3>
                      <p className="text-xs text-gray-400">
                        Upload or update the 1–2 minute painting video displayed right below the stats strip on the live website.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveVideoShowcase}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-red-500/20 shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Save & Publish to Website</span>
                    </button>
                  </div>

                  {/* Main Grid: Upload Controls (Left) & Live Preview (Right) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: 6 Cols - Controls */}
                    <div className="lg:col-span-6 space-y-5 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl">
                      {/* Step 1: Video File Upload */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          1. Upload Video File from Computer (.mp4, .webm, .mov)
                        </label>
                        <div className="border-2 border-dashed border-gray-700/80 hover:border-[#FF5722]/80 rounded-2xl p-5 text-center transition-all bg-[#0C0E12] group">
                          <FileVideo className="w-8 h-8 text-[#FF5722] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                          <p className="text-xs text-white font-medium">Click to select video from your PC</p>
                          <p className="text-[10px] text-gray-500 mt-1">Recommended duration: 1 to 2 minutes</p>

                          <label className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl ${isUploadingVideo ? 'bg-amber-600/30 text-amber-300 border-amber-500/40 cursor-wait' : 'bg-gray-800 hover:bg-gray-700 text-white cursor-pointer border-gray-700'} font-bold text-xs border transition-colors`}>
                            {isUploadingVideo ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
                                <span>Uploading to Bunny Stream...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-[#FF5722]" />
                                <span>Browse Video File</span>
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

                      {/* Step 2: Or Paste Direct Video / YouTube URL */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          2. Or Paste Video URL (YouTube, Vimeo, Cloudinary, MP4)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://youtu.be/... or https://domain.com/video.mp4"
                            className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722] font-mono"
                          />
                        </div>
                        <p className="text-[10px] text-gray-500">
                          You can paste direct MP4 links, YouTube Shorts / videos, or cloud hosted video streams.
                        </p>
                      </div>

                      {/* Step 3: Video Title */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          3. Video Title / Headline
                        </label>
                        <input
                          type="text"
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="e.g. Artist Kuldeep Singh • Master Oil Painting in Atelier"
                          className="w-full bg-[#0C0E12] border border-gray-700 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#FF5722]"
                        />
                      </div>

                      {/* Step 4: Thumbnail / Poster Image */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
                          4. Cover Thumbnail / Poster
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={videoPoster}
                            onChange={(e) => setVideoPoster(e.target.value)}
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
                            Videos stream on-demand using modern HTML5 byte-streaming. The website loads in milliseconds without freezing 3D animations or slowing down page scroll.
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleSaveVideoShowcase}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Publish Video to Live Website</span>
                      </button>
                    </div>

                    {/* Right: 6 Cols - Live Preview Player */}
                    <div className="lg:col-span-6 space-y-4 bg-[#14171E] border border-[#202530] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Live Website Preview:</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                            Interactive Player
                          </span>
                        </div>

                        {/* Player Frame */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl flex items-center justify-center group">
                          {videoUrl ? (
                            videoUrl.includes('mediadelivery.net') ? (
                              <iframe
                                src={videoUrl}
                                title="Bunny Stream Video Preview"
                                className="w-full h-full border-0"
                                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                allowFullScreen
                              />
                            ) : videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                              <iframe
                                src={
                                  videoUrl.includes('youtu.be/')
                                    ? `https://www.youtube-nocookie.com/embed/${videoUrl.split('youtu.be/')[1]?.split('?')[0]}`
                                    : `https://www.youtube-nocookie.com/embed/${videoUrl.split('watch?v=')[1]?.split('&')[0]}`
                                }
                                title="Video Preview"
                                className="w-full h-full border-0"
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

                        {/* Preview Title */}
                        <div className="p-3 bg-[#0C0E12] rounded-xl border border-gray-800/80">
                          <span className="text-[10px] text-gray-500 uppercase block font-semibold">Video Title Display:</span>
                          <h4 className="font-serif font-bold text-white text-sm sm:text-base mt-0.5">{videoTitle}</h4>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
                        <span>Status: Ready to stream</span>
                        <a
                          href="https://artist-kuldeepsingh.netlify.app"
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
                              <span className="text-[10px] uppercase font-bold text-[#FF5722] bg-[#FF5722]/10 px-2.5 py-0.5 rounded-full border border-[#FF5722]/20">
                                Starts: {c.startDate || '22 Oct, 2026'}
                              </span>
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
                              <div className="text-[10px] text-gray-400">{isLiveBroadcasting ? 'Students see "Join Live Class" button' : 'Awaiting live session'}</div>
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
                          <th className="pb-3 font-semibold text-center">Live Attendance</th>
                          <th className="pb-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {students
                          .filter((s) => {
                            const q = studentSearchQuery.toLowerCase();
                            return s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.courseTitle.toLowerCase().includes(q);
                          })
                          .map((stu) => {
                            const isAttended = stu.attendanceStatus === 'Attended';
                            return (
                              <tr key={stu.id} className="hover:bg-gray-900/40 transition-colors">
                                <td className="py-3.5">
                                  <div className="font-bold text-white">{stu.name}</div>
                                  <div className="text-[11px] text-gray-400 font-mono">{stu.email}</div>
                                </td>
                                <td className="py-3.5 text-gray-300 font-medium">{stu.courseTitle}</td>
                                <td className="py-3.5 font-bold text-emerald-400">
                                  ₹{(stu.feesPaid || 9999).toLocaleString('en-IN')} <span className="text-[10px] text-emerald-500/80">Paid ✓</span>
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
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Remove ${stu.name}?`)) {
                                        deleteStudent(stu.id);
                                        showToast('Student access removed.');
                                      }
                                    }}
                                    className="text-gray-500 hover:text-red-400 p-1.5"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: SCHEDULE NEW LIVE BATCH / MASTERCLASS (Side 2)   */}
      {/* ========================================================= */}
      {isNewBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl my-8 relative text-white">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-6">
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

            <form onSubmit={handleCreateLiveBatch} className="space-y-4 text-xs">
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

              {/* Class Banner Image Upload & Preview */}
              <div className="space-y-2.5 bg-[#181C24]/80 border border-[#242A36] rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <label className="text-gray-300 font-semibold flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#FF5722]" />
                    <span>Class Banner / Thumbnail Image</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Ratio: 16:9 Banner</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Thumbnail Preview Box */}
                  <div className="w-full sm:w-44 h-24 rounded-xl overflow-hidden bg-black/50 border border-gray-700/60 relative shrink-0 flex items-center justify-center group shadow-inner">
                    {newBatchForm.thumbnail ? (
                      <img
                        src={newBatchForm.thumbnail}
                        alt="Class Banner Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1400&auto=format&fit=crop';
                        }}
                      />
                    ) : (
                      <div className="text-center p-2 text-gray-500">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span className="text-[10px]">No Banner</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-bold text-white pointer-events-none">
                      Preview
                    </div>
                  </div>

                  {/* Upload button & Direct URL input */}
                  <div className="w-full space-y-2">
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-[#FF5722] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-red-500/10 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Banner Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 block mb-1">Or paste image URL:</span>
                      <input
                        type="url"
                        value={newBatchForm.thumbnail}
                        onChange={(e) => setNewBatchForm({ ...newBatchForm, thumbnail: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-[#12141A] border border-[#242A36] rounded-xl px-3 py-1.5 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#FF5722]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <label className="block text-gray-300 mb-1.5 font-semibold">Syllabus Overview</label>
                <textarea
                  rows={2}
                  value={newBatchForm.summary}
                  onChange={(e) => setNewBatchForm({ ...newBatchForm, summary: e.target.value })}
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
            <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-white space-y-5 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-gray-800">
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

              <form onSubmit={handleSaveLecture} className="space-y-4 text-xs">
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

                          {isProcessingVideoFile && (
                            <div className="text-[11px] text-amber-400 flex items-center gap-1.5 animate-pulse">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Loading video file into atelier player...</span>
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

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
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
      {/* MODAL 4: ADD / EDIT PAINTING (Side 1)                      */}
      {/* ========================================================= */}
      {isAddArtworkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="bg-[#14171E] border border-[#242A36] rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative text-white space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
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

            <form onSubmit={handleSaveArtwork} className="space-y-4 text-xs">
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
                  <label className="block text-gray-300 mb-1 font-semibold">Price (USD $)</label>
                  <input
                    type="number"
                    value={newArtworkForm.price || ''}
                    onChange={(e) => setNewArtworkForm({ ...newArtworkForm, price: Number(e.target.value) })}
                    placeholder="3800"
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

              <div>
                <label className="block text-gray-300 mb-1 font-semibold">Painting Image URL *</label>
                <input
                  type="url"
                  required
                  value={newArtworkForm.image || ''}
                  onChange={(e) => setNewArtworkForm({ ...newArtworkForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#181C24] border border-[#242A36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#FF5722]"
                />
              </div>

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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
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
                <span className="text-gray-400">Collector:</span>
                <span className="font-bold text-white">{selectedOrderForModal.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-300 font-mono">{selectedOrderForModal.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Delivery Address:</span>
                <span className="text-gray-300">{selectedOrderForModal.deliveryAddress || selectedOrderForModal.customerCity || 'Studio Crating'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span className="text-gray-400">Total Price:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedOrderForModal.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Step Action */}
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
          </div>
        </div>
      )}
    </div>
  );
};
