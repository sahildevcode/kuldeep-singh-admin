import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Artwork, Course, CourseModule, CourseLecture, ArtistProfile, AchievementTimelineItem, Award, EnrolledStudent } from '../types';
import { ARTWORKS } from '../data/artworks';
import { COURSES } from '../data/courses';
import { TIMELINE, AWARDS } from '../data/achievements';

const DEFAULT_PROFILE: ArtistProfile = {
  name: 'Artist Kuldeep Singh',
  title: 'Master Painter & Atelier Founder',
  tagline: '12 Years of Fine Art Mastery, Original Paintings & Masterclasses',
  yearsExperience: '12+',
  artworksCount: '450+',
  exhibitionsCount: '18',
  studentsCount: '5.2K+',
  portraitImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
  studioImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1200&auto=format&fit=crop',
  bioHeadline: 'A Life Dedicated to the Alchemy of Light, Oil & Form.',
  bioStory: [
    'Artist Kuldeep Singh has spent over a decade perfecting the discipline of classical European oil painting, anatomical draftsmanship, and pigment chemistry, bringing historical reverence into modern gallery spaces.',
    'In an era dominated by instantaneous digital algorithms, the act of grinding raw mineral earth into cold-pressed oil and applying it layer-by-layer to hand-stretched linen is an act of spiritual defiance.',
    'A painting should possess physical gravity. It should change as the sun moves across your room, revealing hidden glazes at twilight that were invisible at noon.'
  ],
  philosophyQuote: 'Every stroke of oil on linen is a conversation between human patience and natural light.',
  sanctuaryTitle: 'The Sanctuary in Chelsea, New York',
  sanctuaryLocation: 'Where centuries-old techniques meet boundless contemporary scale',
  contactEmail: 'atelier@kuldeepsingh.art',
  studioAddress: 'West 24th Street, Gallery District, Manhattan, NY 10011'
};

const INITIAL_STUDENTS: EnrolledStudent[] = [
  {
    id: 'stu-101',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@gmail.com',
    phone: '+91 98201 45892',
    courseId: 'course-oil-mastery',
    courseTitle: 'The Master Oil Painting Diploma',
    batchSchedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: 'Sep 1, 2026',
    feesPaid: 349,
    paymentStatus: 'Paid',
    progressPercent: 68,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-102',
    name: 'Elena Rostova',
    email: 'elena.rostova@artacademy.eu',
    phone: '+44 7700 900077',
    courseId: 'course-realistic-sketching',
    courseTitle: 'Foundations of Realistic Sketching & Human Anatomy',
    batchSchedule: 'Tuesday & Thursday • 7:00 PM – 9:00 PM IST',
    enrolledDate: 'Sep 3, 2026',
    feesPaid: 249,
    paymentStatus: 'Paid',
    progressPercent: 42,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-103',
    name: 'Dev Patel',
    email: 'dev.patel.design@outlook.com',
    phone: '+91 98112 33455',
    courseId: 'course-watercolor-alchemy',
    courseTitle: 'Expressive Watercolor & Fluid Pigment Painting',
    batchSchedule: 'Wednesday & Friday • 6:30 PM – 8:30 PM IST',
    enrolledDate: 'Aug 28, 2026',
    feesPaid: 219,
    paymentStatus: 'Paid',
    progressPercent: 85,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'stu-104',
    name: 'Sophia Laurent',
    email: 'sophia.l@parisart.fr',
    phone: '+33 6 12 34 56 78',
    courseId: 'course-oil-mastery',
    courseTitle: 'The Master Oil Painting Diploma',
    batchSchedule: 'Saturday & Sunday • 6:00 PM – 8:00 PM IST',
    enrolledDate: 'Sep 5, 2026',
    feesPaid: 349,
    paymentStatus: 'Paid',
    progressPercent: 20,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
  }
];

interface StudioDataContextType {
  artworks: Artwork[];
  courses: Course[];
  students: EnrolledStudent[];
  artistProfile: ArtistProfile;
  timeline: AchievementTimelineItem[];
  awards: Award[];
  // Paintings CRUD
  addArtwork: (artwork: Artwork) => void;
  updateArtwork: (id: string, updates: Partial<Artwork>) => void;
  deleteArtwork: (id: string) => void;
  // Courses CRUD
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  // Students CRUD
  addStudent: (student: EnrolledStudent) => void;
  deleteStudent: (id: string) => void;
  // Lecture & Module Management
  addLectureToModule: (courseId: string, moduleIndex: number, lecture: CourseLecture) => void;
  updateLectureInModule: (courseId: string, moduleIndex: number, lectureIndex: number, updates: Partial<CourseLecture>) => void;
  deleteLectureFromModule: (courseId: string, moduleIndex: number, lectureIndex: number) => void;
  addModuleToCourse: (courseId: string, title?: string, duration?: string) => void;
  deleteModuleFromCourse: (courseId: string, moduleIndex: number) => void;
  // Profile & Legacy CRUD
  updateArtistProfile: (updates: Partial<ArtistProfile>) => void;
  addTimelineItem: (item: AchievementTimelineItem) => void;
  updateTimelineItem: (index: number, updates: Partial<AchievementTimelineItem>) => void;
  deleteTimelineItem: (index: number) => void;
  // Factory Reset
  resetToDefaults: () => void;
}

const StudioDataContext = createContext<StudioDataContextType | undefined>(undefined);

export const StudioDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to ensure all course modules have lecture objects
  const normalizeCourses = (courseList: Course[]): Course[] => {
    return courseList.map((c) => ({
      ...c,
      modules: c.modules.map((m, mIdx) => {
        if (m.lectures && m.lectures.length > 0) return m;
        const initialLecs: CourseLecture[] = (m.topics || []).map((top, tIdx) => ({
          id: `lec-${c.id}-${m.id || mIdx}-${tIdx + 1}`,
          title: top,
          duration: '45 Mins',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          summary: `Master practical demonstration by Artist Kuldeep Singh covering ${top}.`
        }));
        return {
          ...m,
          lectures: initialLecs,
          lessonsCount: initialLecs.length
        };
      })
    }));
  };

  // 1. Artworks State
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_artworks');
      return saved ? JSON.parse(saved) : ARTWORKS;
    } catch {
      return ARTWORKS;
    }
  });

  // 2. Courses State
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_courses');
      const loaded: Course[] = saved ? JSON.parse(saved) : COURSES;
      return normalizeCourses(loaded);
    } catch {
      return normalizeCourses(COURSES);
    }
  });

  // 3. Artist Profile State
  const [artistProfile, setArtistProfile] = useState<ArtistProfile>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // 4. Timeline State
  const [timeline, setTimeline] = useState<AchievementTimelineItem[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_timeline');
      return saved ? JSON.parse(saved) : TIMELINE;
    } catch {
      return TIMELINE;
    }
  });

  // 5. Awards State
  const [awards] = useState<Award[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_awards');
      return saved ? JSON.parse(saved) : AWARDS;
    } catch {
      return AWARDS;
    }
  });

  // 6. Enrolled Students State
  const [students, setStudents] = useState<EnrolledStudent[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_students');
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_students', JSON.stringify(students));
    } catch (e) {
      console.error(e);
    }
  }, [students]);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(artworks));
    } catch (e) {
      console.error(e);
    }
  }, [artworks]);

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_courses', JSON.stringify(courses));
    } catch (e) {
      console.error(e);
    }
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_profile', JSON.stringify(artistProfile));
    } catch (e) {
      console.error(e);
    }
  }, [artistProfile]);

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_timeline', JSON.stringify(timeline));
    } catch (e) {
      console.error(e);
    }
  }, [timeline]);

  // Painting Handlers
  const addArtwork = (artwork: Artwork) => {
    setArtworks((prev) => [artwork, ...prev]);
  };

  const updateArtwork = (id: string, updates: Partial<Artwork>) => {
    setArtworks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteArtwork = (id: string) => {
    setArtworks((prev) => prev.filter((item) => item.id !== id));
  };

  // Course Handlers
  const addCourse = (course: Course) => {
    setCourses((prev) => [course, ...prev]);
  };

  const updateCourse = (id: string, updates: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const deleteCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
  };

  // Lecture Handlers
  const addLectureToModule = (courseId: string, moduleIndex: number, lecture: CourseLecture) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = [...course.modules];
        if (!newModules[moduleIndex]) return course;
        const currentLectures = newModules[moduleIndex].lectures || [];
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          lectures: [...currentLectures, lecture],
          lessonsCount: currentLectures.length + 1,
          topics: [...newModules[moduleIndex].topics, lecture.title]
        };
        const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
        return {
          ...course,
          modules: newModules,
          totalLessons: total
        };
      })
    );
  };

  const updateLectureInModule = (
    courseId: string,
    moduleIndex: number,
    lectureIndex: number,
    updates: Partial<CourseLecture>
  ) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = [...course.modules];
        if (!newModules[moduleIndex]) return course;
        const currentLectures = [...(newModules[moduleIndex].lectures || [])];
        if (!currentLectures[lectureIndex]) return course;
        currentLectures[lectureIndex] = { ...currentLectures[lectureIndex], ...updates };
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          lectures: currentLectures
        };
        return { ...course, modules: newModules };
      })
    );
  };

  const deleteLectureFromModule = (courseId: string, moduleIndex: number, lectureIndex: number) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = [...course.modules];
        if (!newModules[moduleIndex]) return course;
        const currentLectures = (newModules[moduleIndex].lectures || []).filter((_, idx) => idx !== lectureIndex);
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          lectures: currentLectures,
          lessonsCount: currentLectures.length
        };
        const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
        return { ...course, modules: newModules, totalLessons: total };
      })
    );
  };

  const addModuleToCourse = (courseId: string, title?: string, duration?: string) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const newMod: CourseModule = {
          id: 'mod-' + Date.now(),
          title: title || `Module ${course.modules.length + 1}: Masterclass Continuation`,
          duration: duration || '3 Weeks',
          lessonsCount: 0,
          topics: ['Live Studio Demo', 'Technique Practice'],
          lectures: []
        };
        return {
          ...course,
          modules: [...course.modules, newMod]
        };
      })
    );
  };

  const deleteModuleFromCourse = (courseId: string, moduleIndex: number) => {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = course.modules.filter((_, idx) => idx !== moduleIndex);
        const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
        return {
          ...course,
          modules: newModules,
          totalLessons: total
        };
      })
    );
  };

  // Profile Handlers
  const updateArtistProfile = (updates: Partial<ArtistProfile>) => {
    setArtistProfile((prev) => ({ ...prev, ...updates }));
  };

  const addTimelineItem = (item: AchievementTimelineItem) => {
    setTimeline((prev) => [item, ...prev]);
  };

  const updateTimelineItem = (index: number, updates: Partial<AchievementTimelineItem>) => {
    setTimeline((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...updates } : item))
    );
  };

  const deleteTimelineItem = (index: number) => {
    setTimeline((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Student Handlers
  const addStudent = (student: EnrolledStudent) => {
    setStudents((prev) => [student, ...prev]);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Factory Reset
  const resetToDefaults = () => {
    localStorage.removeItem('kuldeep_studio_artworks');
    localStorage.removeItem('kuldeep_studio_courses');
    localStorage.removeItem('kuldeep_studio_students');
    localStorage.removeItem('kuldeep_studio_profile');
    localStorage.removeItem('kuldeep_studio_timeline');
    localStorage.removeItem('kuldeep_studio_awards');
    setArtworks(ARTWORKS);
    setCourses(COURSES);
    setStudents(INITIAL_STUDENTS);
    setArtistProfile(DEFAULT_PROFILE);
    setTimeline(TIMELINE);
  };

  return (
    <StudioDataContext.Provider
      value={{
        artworks,
        courses,
        students,
        artistProfile,
        timeline,
        awards,
        addArtwork,
        updateArtwork,
        deleteArtwork,
        addCourse,
        updateCourse,
        deleteCourse,
        addStudent,
        deleteStudent,
        addLectureToModule,
        updateLectureInModule,
        deleteLectureFromModule,
        addModuleToCourse,
        deleteModuleFromCourse,
        updateArtistProfile,
        addTimelineItem,
        updateTimelineItem,
        deleteTimelineItem,
        resetToDefaults
      }}
    >
      {children}
    </StudioDataContext.Provider>
  );
};

export const useStudioData = () => {
  const context = useContext(StudioDataContext);
  if (!context) {
    throw new Error('useStudioData must be used within a StudioDataProvider');
  }
  return context;
};
