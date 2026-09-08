export type MediumType = 'Oil on Canvas' | 'Charcoal & Graphite' | 'Watercolor & Ink' | 'Acrylic & Mixed Media' | 'Limited Edition Print';

export interface Artwork {
  id: string;
  title: string;
  subtitle: string;
  year: number;
  medium: MediumType;
  dimensions: string; // e.g., "36 x 48 in (91 x 122 cm)"
  price: number;
  image: string;
  detailImages?: string[];
  description: string;
  story: string;
  framed: boolean;
  status: 'available' | 'sold' | 'reserved';
  featured?: boolean;
  paletteColors: string[]; // hex codes of primary pigments used
  weight?: string;
  varnishType?: string;
  fileType?: 'image' | 'pdf';
  fileName?: string;
  fileSize?: string;
  pdfUrl?: string;
}

export interface CourseLecture {
  id: string;
  title: string;
  duration: string;
  videoUrl?: string;
  summary?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessonsCount: number;
  topics: string[];
  lectures?: CourseLecture[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  level: 'Beginner' | 'Intermediate' | 'Master / Advanced' | 'All Levels';
  category: 'Oil Painting' | 'Realistic Sketching' | 'Color Theory' | 'Watercolor & Fluid';
  durationHours: number;
  durationMonths: string;
  schedule: string;
  startDate: string;
  mode: string;
  certification: string;
  prerequisites?: string;
  totalLessons: number;
  price: number;
  originalPrice?: number;
  rating: number;
  studentsEnrolled: number;
  thumbnail: string;
  previewVideoUrl?: string;
  summary: string;
  description: string;
  whatYouWillLearn: string[];
  materialsNeeded: string[];
  modules: CourseModule[];
  featured?: boolean;
  liveClassUrl?: string;
  liveClassStatus?: 'offline' | 'live' | 'scheduled';
}

export interface AchievementTimelineItem {
  year: string;
  title: string;
  roleOrLocation: string;
  description: string;
  milestoneType: 'Exhibition' | 'Award' | 'Studio Milestone' | 'Publication';
  highlightMetric?: string;
}

export interface Award {
  year: string;
  award: string;
  institution: string;
  location: string;
  badgeText: string;
}

export interface CollectorReview {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  artworkAcquired?: string;
  courseTaken?: string;
  comment: string;
  rating: number;
  verifiedPurchase: boolean;
}

export interface CartItem {
  id: string;
  type: 'artwork' | 'course';
  title: string;
  subtitle: string;
  price: number;
  image: string;
  quantity: number;
  mediumOrCategory?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'collector' | 'student';
  avatar?: string;
  memberSince: string;
  collectedCount?: number;
  enrolledCoursesCount?: number;
  enrolledCourseIds?: string[];
}

export type OrderPipelineStep = 1 | 2 | 3 | 4;
export type OrderPipelineStatus = 'placed' | 'accepted' | 'dispatched' | 'delivered';

export interface OrderRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCity?: string;
  customerState?: string;
  date: string;
  orderTime?: string;
  orderMonth?: string; // e.g. "2026-09" or "2026-08"
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending Payment' | 'Processing' | 'Failed' | 'Refunded';
  orderStatus: 'Order Placed' | 'Payment Verified' | 'Fine Art Packing' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Course Active & Unlocked';
  deliveryAddress?: string;
  trackingNumber?: string;
  carrierName?: string;
  notes?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  currentStep: OrderPipelineStep;
  stepStatus: OrderPipelineStatus;
  stepTimestamps?: {
    placed?: string;
    accepted?: string;
    dispatched?: string;
    delivered?: string;
  };
}

export interface ArtistProfile {
  name: string;
  title: string;
  tagline: string;
  yearsExperience: string;
  artworksCount: string;
  exhibitionsCount: string;
  studentsCount: string;
  portraitImage: string;
  studioImage: string;
  bioHeadline: string;
  bioStory: string[];
  philosophyQuote: string;
  sanctuaryTitle: string;
  sanctuaryLocation: string;
  contactEmail: string;
  studioAddress: string;
}

export interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  courseId: string;
  courseTitle: string;
  batchSchedule: string;
  enrolledDate: string;
  feesPaid: number;
  paymentStatus: 'Paid' | 'Processing';
  progressPercent: number;
  avatar?: string;
}

