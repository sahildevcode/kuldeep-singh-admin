import type { CollectorReview } from '../types';

export const REVIEWS: CollectorReview[] = [
  {
    id: 'rev-01',
    name: 'Eleanor Sterling',
    role: 'Contemporary Art Collector & Trustee',
    location: 'Upper East Side, New York',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    artworkAcquired: 'Symphony of the Solitary Tide',
    comment: 'Acquiring an original Kuldeep Singh oil canvas was one of the most rewarding additions to our family collection. The physical presence and luminosity when evening sunlight strikes the canvas is extraordinary.',
    rating: 5,
    verifiedPurchase: true
  },
  {
    id: 'rev-02',
    name: 'Marcus Davenport',
    role: 'Interior Architect & Designer',
    location: 'London & Zurich',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
    artworkAcquired: 'Echoes of the Florentine Dusk',
    comment: 'The depth of craftsmanship is on par with European museum masters. The framing, documentation, and archival provenance arrived impeccably packed in bespoke wooden crates.',
    rating: 5,
    verifiedPurchase: true
  },
  {
    id: 'rev-03',
    name: 'Sophia Chen',
    role: 'Concept Artist & Masterclass Alumna',
    location: 'San Francisco, CA',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop',
    courseTaken: 'The Master Oil Painting Diploma',
    comment: 'I had been terrified of oils for years due to drying times and muddy colors. Kuldeep’s breakdown of glazing and split-primary mixing completely revolutionized my workflow. Worth 10x the tuition.',
    rating: 5,
    verifiedPurchase: true
  },
  {
    id: 'rev-04',
    name: 'Dr. Liam Thorne',
    role: 'Surgeon & Figurative Sketcher',
    location: 'Boston, MA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
    courseTaken: 'Foundations of Realistic Sketching & Human Anatomy',
    comment: 'Kuldeep explains anatomical drawing with the precision of a surgeon and the soul of a poet. In just 4 weeks my charcoal portraits went from flat sketches to three-dimensional sculptural forms.',
    rating: 5,
    verifiedPurchase: true
  }
];

export const PRESS_LOGOS = [
  { name: 'VOGUE ART', quote: 'A modern titan bridging Renaissance discipline with fearless contemporary soul.' },
  { name: 'ART BASEL REVIEW', quote: 'Monumental presence. Kuldeep Singh canvases breathe with an inner golden resonance.' },
  { name: 'THE ART NEWSPAPER', quote: 'One of the most compelling figurative oil masters of his generation.' },
  { name: 'ARCHITECTURAL DIGEST', quote: 'The centerpiece of the world’s most discerning modern living spaces.' }
];
