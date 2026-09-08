import type { AchievementTimelineItem, Award } from '../types';

export const STATS = [
  { label: 'Years of Devoted Mastery', value: '12+', subtext: 'Continuous studio practice since 2014' },
  { label: 'Original Works Collected', value: '450+', subtext: 'In 32 countries across the globe' },
  { label: 'International Exhibitions', value: '18', subtext: 'Solo & curated group showcases' },
  { label: 'Global Academy Students', value: '5.2K+', subtext: 'Trained in oils, sketch & color theory' },
];

export const TIMELINE: AchievementTimelineItem[] = [
  {
    year: '2026 - Present',
    title: 'Global Retrospective: "The Living Canvas"',
    roleOrLocation: 'Metropolitan Art Pavilion, New York & Zurich',
    description: 'A landmark multi-city retrospective celebrating 12 years of fine art innovation, presenting 40 monumental oil canvases and live interactive demonstrations.',
    milestoneType: 'Exhibition',
    highlightMetric: 'Over 45,000 visitors in inaugural month'
  },
  {
    year: '2025',
    title: 'Gold Medal for Contemporary Oil Masterwork',
    roleOrLocation: 'International Fine Art Guild, London',
    description: 'Awarded first prize in classical portraiture for "Echoes of the Florentine Dusk", recognized by the jury for revolutionary glazing depth.',
    milestoneType: 'Award',
    highlightMetric: 'Jury vote 98.4%'
  },
  {
    year: '2024',
    title: 'Chelsea Solo Showcase: "Elemental Light"',
    roleOrLocation: 'Agora Gallery, Manhattan, New York',
    description: 'Sold-out solo exhibition of 18 large-format mixed media and oil paintings exploring raw coastal weather and natural geometry.',
    milestoneType: 'Exhibition',
    highlightMetric: '100% artworks acquired by private collectors'
  },
  {
    year: '2023',
    title: 'Launch of the Online Fine Art Masterclass Académie',
    roleOrLocation: 'Global Digital Studio',
    description: 'Synthesized 9 years of teaching into comprehensive, high-definition digital masterclasses, quickly growing to 3,000+ enthusiastic student artists.',
    milestoneType: 'Studio Milestone',
    highlightMetric: 'Ranked #1 Masterclass in Color Theory'
  },
  {
    year: '2022',
    title: 'Biennale di Venezia Special Mention',
    roleOrLocation: 'Venice, Italy',
    description: 'Invited cultural installation showcasing the connection between historic Venetian water techniques and contemporary fluid pigment dynamics.',
    milestoneType: 'Exhibition',
    highlightMetric: 'Featured in European Art Review'
  },
  {
    year: '2020 - 2021',
    title: 'The Solitude Series & Archival Paper Researches',
    roleOrLocation: 'Hudson Valley Studio, New York',
    description: 'A deep introspective period dedicated to formulating custom dammar varnishes, cold-pressed walnut mediums, and raw charcoal stick crafting.',
    milestoneType: 'Studio Milestone'
  },
  {
    year: '2019',
    title: 'Excellence in Draftsmanship & Drawing Award',
    roleOrLocation: 'Society of Figurative Draftsmen, Chicago',
    description: 'Honored for pioneering anatomical drawing techniques that marry academic realism with emotive contemporary mark-making.',
    milestoneType: 'Award'
  },
  {
    year: '2017 - 2018',
    title: 'First Solo Museum Exhibition: "Whispering Shadows"',
    roleOrLocation: 'Modern Arts Centre, San Francisco',
    description: 'Groundbreaking exhibition bringing large-scale charcoal works on raw cotton rag into conversation with classical chiaroscuro oils.',
    milestoneType: 'Exhibition'
  },
  {
    year: '2015 - 2016',
    title: 'European Master Atelier Residency',
    roleOrLocation: 'Florence & Paris',
    description: 'Two years of rigorous immersion in historic European ateliers, studying Renaissance pigment grinds, anatomy dissections, and museum copying.',
    milestoneType: 'Studio Milestone'
  },
  {
    year: '2014',
    title: 'Inception of Artist Kuldeep Singh Studio',
    roleOrLocation: 'New York City & New Delhi',
    description: 'Founded independent studio practice after graduating with First Class Honors in Fine Arts. Started exhibiting on raw brick gallery walls in Brooklyn.',
    milestoneType: 'Studio Milestone',
    highlightMetric: 'The start of a 12-year legacy'
  }
];

export const AWARDS: Award[] = [
  {
    year: '2025',
    award: 'International Fine Art Gold Medal',
    institution: 'Royal Society of Contemporary Painters',
    location: 'London, UK',
    badgeText: 'Highest Honor'
  },
  {
    year: '2024',
    award: 'Distinguished Figurative Artist Prize',
    institution: 'American Fine Art Salon',
    location: 'New York, USA',
    badgeText: '1st Place'
  },
  {
    year: '2022',
    award: 'Venice Cultural Biennale Citation',
    institution: 'Venice Contemporary Art Foundation',
    location: 'Venice, Italy',
    badgeText: 'Jury Special Mention'
  },
  {
    year: '2019',
    award: 'Master Draftsman Laureate',
    institution: 'Society of Figurative Artists',
    location: 'Chicago, USA',
    badgeText: 'Gold Award'
  }
];
