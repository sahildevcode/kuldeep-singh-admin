import type { UpcomingCourse } from '../types';

export const INITIAL_UPCOMING_COURSES: UpcomingCourse[] = [
  {
    id: 'up-course-02',
    title: 'Hyper-Realistic Charcoal Anatomy & Dramatic Chiaroscuro',
    category: 'Charcoal & Graphite',
    badge: 'Pre-Booking Open • Early Bird',
    startDate: '10 December, 2026',
    duration: '4 Weeks • 8 Intensive Master Sessions',
    level: 'All Levels',
    price: 3499,
    originalPrice: 6000,
    description: 'Master sculptural three-dimensionality on archival paper with willow charcoal, compressed carbon, and kneaded eraser highlights using Caravaggesque lighting.',
    instructorQuote: 'When you understand bone landmarks and value compression, a piece of charcoal becomes as expressive as a symphony orchestra.',
    studentTestimonial: {
      name: 'Elena Rostova',
      role: 'Figurative Artist, London',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      quote: 'His live critique sessions in charcoal anatomy transformed how I see shadows in under 3 weeks.',
      rating: 5
    },
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
    seatsTotal: 20,
    seatsLeft: 7,
    status: 'open_for_booking',
    isActive: true
  }
];
