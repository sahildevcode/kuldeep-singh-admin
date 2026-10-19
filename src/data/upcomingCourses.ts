import type { UpcomingCourse } from '../types';

export const INITIAL_UPCOMING_COURSES: UpcomingCourse[] = [
  {
    id: 'up-course-01',
    title: 'Classical Venetian Oil Glazing & Renaissance Skin Tones',
    category: 'Oil Painting Masterclass',
    badge: 'Launching Nov 2026 • Limited 15 Seats',
    startDate: '28 November, 2026',
    duration: '6 Weeks • 12 Live Atelier Mentorship Sessions',
    level: 'Intermediate to Master',
    price: 4999,
    originalPrice: 8500,
    description: 'Learn the secrets of Venetian masters—from dead-color underpainting (verdaccio) to luminous multiple transparent glazes and anatomical facial bone structure.',
    instructorQuote: 'True skin translucency cannot be mixed directly on the palette; it is born from the optical vibration of light passing through transparent glaze layers.',
    studentTestimonial: {
      name: 'Aarav Sharma',
      role: 'Fine Arts Scholar & Alumnus',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      quote: 'Learning Kuldeep sir’s glazing technique was a turning point. Waiting eagerly for this deep-dive batch!',
      rating: 5
    },
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    seatsTotal: 15,
    seatsLeft: 4,
    status: 'open_for_booking',
    isActive: true
  },
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
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    seatsTotal: 20,
    seatsLeft: 7,
    status: 'open_for_booking',
    isActive: true
  },
  {
    id: 'up-course-03',
    title: 'Atmospheric Plein Air Landscape in Oils: Light & Weather',
    category: 'Landscape & Nature',
    badge: 'Coming Soon • Winter Batch',
    startDate: '15 January, 2027',
    duration: '5 Weeks • 10 Weekend Live Sessions',
    level: 'All Levels',
    price: 3999,
    originalPrice: 7000,
    description: 'Capture shifting clouds, twilight reflections, and atmospheric depth with alla prima brushwork and limited color palettes.',
    instructorQuote: 'Nature does not pose for you. Plein air trains your eye to capture the emotional essence of a fleeting sunset in 45 decisive strokes.',
    studentTestimonial: {
      name: 'Sophia Chen',
      role: 'Concept Designer & Artist',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
      quote: 'The way Kuldeep explains color temperature in outdoor lighting will completely upgrade your palette.',
      rating: 5
    },
    thumbnail: 'https://images.unsplash.com/photo-1579783928621-7a13d66a62d1?q=80&w=1200&auto=format&fit=crop',
    seatsTotal: 25,
    seatsLeft: 18,
    status: 'upcoming',
    isActive: true
  }
];
