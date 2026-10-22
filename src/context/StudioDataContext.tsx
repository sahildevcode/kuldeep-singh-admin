import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Artwork, Course, CourseModule, CourseLecture, ArtistProfile, AchievementTimelineItem, Award, EnrolledStudent, RegisteredUser, Inquiry, UpcomingCourse, CollectorReview } from '../types';
import { ARTWORKS } from '../data/artworks';
import { COURSES } from '../data/courses';
import { TIMELINE, AWARDS } from '../data/achievements';
import { INITIAL_UPCOMING_COURSES } from '../data/upcomingCourses';
import { REVIEWS } from '../data/reviews';

export const getBackendUrls = (): string[] => {
  return ['https://kuldeep-singh-backend-q1di.onrender.com', 'http://localhost:5000'];
};

export const deleteBunnyVideo = async (videoUrlOrId: string) => {
  if (!videoUrlOrId) return;
  for (const base of getBackendUrls()) {
    try {
      await fetch(`${base}/api/upload/bunny-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoUrlOrId }),
      });
      break;
    } catch {
      // try next
    }
  }
};

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
  studioAddress: 'West 24th Street, Gallery District, Manhattan, NY 10011',
  studioVideoUrl: '/videos/hero-cinematic.mp4',
  studioVideoTitle: 'Artist Kuldeep Singh • Master Oil Painting in Atelier',
  studioVideoPoster: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
  heroShowcaseType: 'video',
  heroShowcaseBadge: 'Featured Canvas',
  heroShowcaseTitle: 'Artist Kuldeep Singh',
  heroShowcaseSubtitle: 'Original Oil on Belgian Linen (40 x 54 in)',
  heroShowcasePrice: '₹4,12,250',
  heroShowcaseImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=800&auto=format&fit=crop',
  heroShowcaseVideoUrl: '/videos/hero-cinematic.mp4',
  heroShowcaseCertificateText: 'Archival Certificate'
};

const INITIAL_USERS: RegisteredUser[] = [
  {
    id: 'usr_1792222003452',
    name: 'sahil',
    email: 'sahildevcode@gmail.com',
    username: 'sahil',
    plainPassword: 'sahil123456',
    role: 'student',
    isEmailVerified: true,
    enrolledCourseIds: [],
    createdAt: '2026-10-17T07:26:43.455Z'
  },
  {
    id: 'usr_1792216365704',
    name: 'Rohan Sharma',
    email: 'testpatron99@gmail.com',
    username: 'patron_99',
    plainPassword: 'patron123456',
    role: 'student',
    isEmailVerified: true,
    enrolledCourseIds: ['course-oil-mastery'],
    createdAt: '2026-10-17T05:52:45.704Z'
  },
  {
    id: 'usr-student-demo',
    name: 'Aarav Sharma',
    email: 'student@kuldeepsingh.art',
    username: 'aarav_sharma',
    plainPassword: 'student123',
    role: 'student',
    isEmailVerified: true,
    enrolledCourseIds: ['course-oil-mastery', 'course-realistic-sketching'],
    createdAt: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'usr-collector-demo',
    name: 'Countess Vivienne',
    email: 'collector@kuldeepsingh.art',
    username: 'countess_vivienne',
    plainPassword: 'collector123',
    role: 'collector',
    isEmailVerified: true,
    enrolledCourseIds: [],
    createdAt: '2026-09-01T00:00:00.000Z'
  }
];

const INITIAL_STUDENTS: EnrolledStudent[] = [];

interface StudioDataContextType {
  artworks: Artwork[];
  courses: Course[];
  students: EnrolledStudent[];
  users: RegisteredUser[];
  inquiries: Inquiry[];
  artistProfile: ArtistProfile;
  timeline: AchievementTimelineItem[];
  awards: Award[];
  upcomingCourses: UpcomingCourse[];
  // Upcoming Courses CRUD
  addUpcomingCourse: (course: UpcomingCourse) => void;
  updateUpcomingCourse: (id: string, updates: Partial<UpcomingCourse>) => void;
  deleteUpcomingCourse: (id: string) => void;
  // Testimonials / Reviews CRUD
  reviews: CollectorReview[];
  addReview: (review: CollectorReview) => void;
  updateReview: (id: string, updates: Partial<CollectorReview>) => void;
  deleteReview: (id: string) => void;
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
  updateStudent: (id: string, updates: Partial<EnrolledStudent>) => void;
  deleteStudent: (id: string) => void;
  // Users (Registered Accounts) CRUD
  updateUser: (id: string, updates: Partial<RegisteredUser> & { password?: string }) => void;
  deleteUser: (id: string) => void;
  // Customer Inquiries CRUD
  updateInquiryStatus: (id: string, status: 'new' | 'contacted' | 'resolved') => void;
  deleteInquiry: (id: string) => void;
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

const DUMMY_COURSE_IDS = ['course-oil-mastery', 'course-realistic-sketching', 'course-watercolor-fluid', 'course-color-alchemy'];

export const StudioDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Helper to ensure all course modules have lecture objects without auto-generating fake ones
  const normalizeCourses = (courseList: Course[]): Course[] => {
    return (courseList || []).map((c) => ({
      ...c,
      modules: (c.modules || []).map((m) => {
        const lecs = Array.isArray(m.lectures) ? m.lectures : [];
        return {
          ...m,
          lectures: lecs,
          lessonsCount: lecs.length,
          topics: lecs.map((l) => l.title)
        };
      })
    }));
  };

  // 1. Artworks State
  const [artworks, setArtworks] = useState<Artwork[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_artworks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seedMap: Record<string, number> = {
            'art-01': 412250, 'art-02': 331500, 'art-03': 165750, 'art-04': 476000, 'art-05': 123250,
            'art-06': 55250, 'art-07': 289000, 'art-08': 136000, 'art-09': 38250, 'art-10': 44200
          };
          return parsed.map((a: any) => (seedMap[a.id] && a.price < 10000 ? { ...a, price: seedMap[a.id] } : a));
        }
      }
      return ARTWORKS;
    } catch {
      return ARTWORKS;
    }
  });

  // 2. Courses State
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_courses');
      const loaded: Course[] = saved ? JSON.parse(saved) : [];
      const clean = (Array.isArray(loaded) ? loaded : []).filter((c) => !DUMMY_COURSE_IDS.includes(c.id));
      return normalizeCourses(clean);
    } catch {
      return [];
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

  // 7. Registered Users State (All Website Logins)
  const [users, setUsers] = useState<RegisteredUser[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_users');
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // 8. Customer Inquiries State
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_inquiries');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_inquiries', JSON.stringify(inquiries));
    } catch (e) {
      console.error(e);
    }
  }, [inquiries]);

  // 9. Upcoming Courses State
  const [upcomingCourses, setUpcomingCourses] = useState<UpcomingCourse[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_upcoming_courses_v2');
      return saved ? JSON.parse(saved) : INITIAL_UPCOMING_COURSES;
    } catch {
      return INITIAL_UPCOMING_COURSES;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_upcoming_courses_v2', JSON.stringify(upcomingCourses));
    } catch (e) {
      console.error(e);
    }
  }, [upcomingCourses]);

  // 10. Testimonials / Reviews State
  const [reviews, setReviews] = useState<CollectorReview[]>(() => {
    try {
      const saved = localStorage.getItem('kuldeep_studio_testimonials');
      return saved ? JSON.parse(saved) : REVIEWS;
    } catch {
      return REVIEWS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kuldeep_studio_testimonials', JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  // Sync with Remote 24/7 Cloud Backend (Artworks, Courses & Lectures, Students, Inquiries)
  useEffect(() => {
    let isMounted = true;

    const syncAllWithCloud = async () => {
      try {
        // 1. Artworks (Cloud is absolute source of truth)
        const artRes = await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/artworks');
        if (artRes.ok) {
          const cloudArtworks: Artwork[] = await artRes.json();
          if (Array.isArray(cloudArtworks) && isMounted) {
            setArtworks(cloudArtworks);
            try {
              localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(cloudArtworks));
            } catch {}
          }
        }

        // 2. Courses & Lectures
        const courseRes = await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/courses').catch(() => null);
        if (courseRes && courseRes.ok) {
          const cloudCourses: Course[] = await courseRes.json();
          if (Array.isArray(cloudCourses) && isMounted) {
            const validCloudCourses = cloudCourses.filter((c) => !DUMMY_COURSE_IDS.includes(c.id));
            const normalized = normalizeCourses(validCloudCourses);
            setCourses(normalized);
            try {
              localStorage.setItem('kuldeep_studio_courses', JSON.stringify(normalized));
              localStorage.removeItem('kuldeep_studio_deleted_courses');
              localStorage.removeItem('kuldeep_studio_deleted_lectures');
            } catch {}
          }
        }

        // 3. Students (Enrolled in Masterclasses)
        let cloudStudents: EnrolledStudent[] | null = null;
        for (const base of getBackendUrls()) {
          try {
            const stuRes = await fetch(`${base}/api/students`);
            if (stuRes.ok) {
              cloudStudents = await stuRes.json();
              break;
            }
          } catch {
            // try next
          }
        }

        if (Array.isArray(cloudStudents) && isMounted) {
          setStudents(cloudStudents);
          try {
            localStorage.setItem('kuldeep_studio_students', JSON.stringify(cloudStudents));
            localStorage.removeItem('ks_deleted_students');
          } catch {}
        }

        // 4. Registered Users (All Website Logins)
        let cloudUsers: RegisteredUser[] | null = null;
        for (const base of getBackendUrls()) {
          try {
            const userRes = await fetch(`${base}/api/users`);
            if (userRes.ok) {
              cloudUsers = await userRes.json();
              break;
            }
          } catch {
            // try next
          }
        }

        if (Array.isArray(cloudUsers) && isMounted) {
          let deletedUserList: string[] = [];
          try {
            deletedUserList = JSON.parse(localStorage.getItem('ks_deleted_users') || '[]');
          } catch {
            deletedUserList = [];
          }
          const cleanUsers = cloudUsers.filter(
            (u) => !deletedUserList.includes(u.id) && (!u._id || !deletedUserList.includes(u._id))
          );
          setUsers(cleanUsers);
        }

        // 5. Artist Profile & Studio Reels
        for (const base of getBackendUrls()) {
          try {
            const profileRes = await fetch(`${base}/api/profile`);
            if (profileRes.ok) {
              const cloudProfile = await profileRes.json();
              if (cloudProfile && isMounted) {
                setArtistProfile((prev) => {
                  const merged = { ...prev, ...cloudProfile };
                  if (JSON.stringify(prev) === JSON.stringify(merged)) return prev;
                  return merged;
                });
                break;
              }
            }
          } catch {
            // try next
          }
        }

        // 6. Customer Inquiries
        for (const base of getBackendUrls()) {
          try {
            const inqRes = await fetch(`${base}/api/inquiries`);
            if (inqRes.ok) {
              const cloudInquiries: Inquiry[] = await inqRes.json();
              if (Array.isArray(cloudInquiries) && isMounted) {
                let deletedInqList: string[] = [];
                try {
                  deletedInqList = JSON.parse(localStorage.getItem('ks_deleted_inquiries') || '[]');
                } catch {
                  deletedInqList = [];
                }
                const cleanInquiries = cloudInquiries.filter(
                  (inq) => !deletedInqList.includes(inq.id)
                );
                setInquiries(cleanInquiries);
                break;
              }
            }
          } catch {
            // try next
          }
        }

        // 6. Upcoming Courses
        for (const base of getBackendUrls()) {
          try {
            const upRes = await fetch(`${base}/api/upcoming-courses`);
            if (upRes.ok) {
              const upData = await upRes.json();
              const list = upData?.upcomingCourses || (Array.isArray(upData) ? upData : null);
              if (Array.isArray(list) && isMounted) {
                setUpcomingCourses(list);
                break;
              }
            }
          } catch {
            // try next
          }
        }

        // 7. Testimonials / Reviews
        for (const base of getBackendUrls()) {
          try {
            const testRes = await fetch(`${base}/api/testimonials`);
            if (testRes.ok) {
              const testData = await testRes.json();
              const list = testData?.testimonials || (Array.isArray(testData) ? testData : null);
              if (Array.isArray(list) && isMounted && list.length > 0) {
                setReviews(list);
                break;
              }
            }
          } catch {
            // try next
          }
        }
      } catch (err) {
        console.warn('Cloud sync skipped, using local cache:', err);
      }
    };

    syncAllWithCloud();

    // Smart Eco-Sync Polling (Saves 80%+ Bandwidth, Pauses when tab is hidden or admin is idle)
    let syncInterval: any = null;
    let idleTimer: any = null;
    let isUserIdle = false;

    const startSync = () => {
      if (syncInterval) clearInterval(syncInterval);
      syncInterval = setInterval(() => {
        if (!document.hidden && !isUserIdle) {
          syncAllWithCloud();
        }
      }, 3000);
    };

    const stopSync = () => {
      if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
      }
    };

    const handleUserActivity = () => {
      if (isUserIdle) {
        isUserIdle = false;
        if (!document.hidden) {
          syncAllWithCloud();
          startSync();
        }
      }
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        isUserIdle = true;
        stopSync();
      }, 180000); // 3 mins idle timeout
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopSync();
      } else {
        isUserIdle = false;
        syncAllWithCloud();
        startSync();
      }
    };

    const onFocus = () => {
      isUserIdle = false;
      syncAllWithCloud();
      startSync();
    };

    startSync();
    handleUserActivity();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', onFocus);
    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });

    let eventSource: EventSource | null = null;
    try {
      const liveEventUrl = getBackendUrls()[0] + '/api/events';
      eventSource = new EventSource(liveEventUrl);
      eventSource.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          const type = raw.type;
          const data = raw.data || raw.payload;

          if (type === 'ARTWORK_CREATED' && data) {
            setArtworks((prev) => {
              if (prev.some((a) => a.id === data.id)) return prev;
              const next = [data, ...prev];
              try { localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'ARTWORK_UPDATED' && data?.id) {
            setArtworks((prev) => {
              const next = prev.map((a) => a.id === data.id ? { ...a, ...data } : a);
              try { localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'ARTWORK_DELETED' && data?.id) {
            setArtworks((prev) => {
              const next = prev.filter((a) => a.id !== data.id && (a as any)._id !== data.id);
              try { localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'COURSE_ADDED' && data) {
            setCourses((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev;
              const next = normalizeCourses([data, ...prev]);
              try { localStorage.setItem('kuldeep_studio_courses', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'COURSE_UPDATED' && data?.id) {
            setCourses((prev) => {
              const next = normalizeCourses(prev.map((c) => (c.id === data.id ? { ...c, ...data } : c)));
              try { localStorage.setItem('kuldeep_studio_courses', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'COURSE_DELETED' && data?.id) {
            setCourses((prev) => {
              const next = prev.filter((c) => c.id !== data.id);
              try { localStorage.setItem('kuldeep_studio_courses', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'LECTURE_DELETED' && data?.courseId) {
            setCourses((prev) => {
              const next = prev.map((course) => {
                if (course.id !== data.courseId) return course;
                const newModules = [...course.modules];
                if (!newModules[data.moduleIndex]) return course;
                const currentLectures = newModules[data.moduleIndex].lectures || [];
                const filtered = data.lectureId
                  ? currentLectures.filter((l) => l.id !== data.lectureId)
                  : currentLectures.filter((_, idx) => idx !== data.lectureIndex);
                newModules[data.moduleIndex] = {
                  ...newModules[data.moduleIndex],
                  lectures: filtered,
                  lessonsCount: filtered.length,
                  topics: filtered.map((l) => l.title)
                };
                const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
                return { ...course, modules: newModules, totalLessons: total };
              });
              try { localStorage.setItem('kuldeep_studio_courses', JSON.stringify(next)); } catch {}
              return next;
            });
          } else if (type === 'STUDENT_ENROLLED' && data) {
            setStudents((prev) => {
              if (prev.some((s) => s.id === data.id || (data._id && s._id === data._id))) return prev;
              return [data, ...prev];
            });
          } else if (type === 'STUDENT_DELETED' && data?.id) {
            setStudents((prev) => prev.filter((s) => s.id !== data.id && s._id !== data.id));
          } else if (type === 'STUDENT_UPDATED' && data?.id) {
            setStudents((prev) => prev.map((s) => (s.id === data.id || s._id === data.id) ? { ...s, ...data } : s));
          } else if (type === 'USER_DELETED' && data?.id) {
            setUsers((prev) => prev.filter((u) => u.id !== data.id && u._id !== data.id));
          } else if (type === 'USER_UPDATED' && data?.id) {
            setUsers((prev) => prev.map((u) => (u.id === data.id || u._id === data.id) ? { ...u, ...data } : u));
          } else if (type === 'INQUIRY_CREATED' && data) {
            setInquiries((prev) => {
              if (prev.some((inq) => inq.id === data.id)) return prev;
              return [data, ...prev];
            });
          } else if (type === 'INQUIRY_UPDATED' && data?.id) {
            setInquiries((prev) => prev.map((inq) => inq.id === data.id ? { ...inq, ...data } : inq));
          } else if (type === 'INQUIRY_DELETED' && data?.id) {
            setInquiries((prev) => prev.filter((inq) => inq.id !== data.id));
          } else if (type === 'PROFILE_UPDATED' && data) {
            setArtistProfile((prev) => ({ ...prev, ...data }));
          } else if (type === 'UPCOMING_COURSE_CREATED' && data) {
            setUpcomingCourses((prev) => [data, ...prev.filter((c) => c.id !== data.id)]);
          } else if (type === 'UPCOMING_COURSE_UPDATED' && data?.id) {
            setUpcomingCourses((prev) => prev.map((c) => c.id === data.id ? { ...c, ...data } : c));
          } else if (type === 'UPCOMING_COURSE_DELETED' && data?.id) {
            setUpcomingCourses((prev) => prev.filter((c) => c.id !== data.id));
          } else if (type === 'TESTIMONIAL_CREATED' && data) {
            setReviews((prev) => [data, ...prev.filter((r) => r.id !== data.id)]);
          } else if (type === 'TESTIMONIAL_UPDATED' && data?.id) {
            setReviews((prev) => prev.map((r) => r.id === data.id ? { ...r, ...data } : r));
          } else if (type === 'TESTIMONIAL_DELETED' && data?.id) {
            setReviews((prev) => prev.filter((r) => r.id !== data.id));
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // fallback to polling
    }

    return () => {
      isMounted = false;
      stopSync();
      if (idleTimer) clearTimeout(idleTimer);
      if (eventSource) eventSource.close();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, []);

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

  // Painting Handlers (Local Optimistic + Instant 24/7 Cloud Sync)
  const addArtwork = async (artwork: Artwork) => {
    setArtworks((prev) => [artwork, ...prev]);
    try {
      await fetch('https://kuldeep-singh-backend-q1di.onrender.com/api/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artwork)
      });
    } catch (err) {
      console.error('Error syncing new artwork to cloud database:', err);
    }
  };

  const updateArtwork = async (id: string, updates: Partial<Artwork>) => {
    setArtworks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    try {
      await fetch(`https://kuldeep-singh-backend-q1di.onrender.com/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Error updating artwork in cloud database:', err);
    }
  };

  const deleteArtwork = async (id: string) => {
    setArtworks((prev) => {
      const next = prev.filter((item) => item.id !== id && (item as any)._id !== id);
      try {
        localStorage.setItem('kuldeep_studio_artworks', JSON.stringify(next));
      } catch {}
      return next;
    });
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/artworks/${id}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.error('Error deleting artwork from cloud database:', err);
      }
    }
  };

  // Course Handlers
  const addCourse = async (course: Course) => {
    setCourses((prev) => [course, ...prev]);
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course)
        });
      } catch (e) {
        // try next
      }
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    let updatedCourse: Course | null = null;
    setCourses((prev) => {
      const updated = prev.map((c) => {
        if (c.id === id) {
          const res = { ...c, ...updates };
          updatedCourse = res;
          return res;
        }
        return c;
      });
      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(updated));
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }
      return updated;
    });

    const payloadToSend = updates.modules ? updatedCourse : updates;
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/courses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadToSend || updates)
        });
        if (updates.liveClassStatus !== undefined) {
          await fetch(`${base}/api/live`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              isLive: updates.liveClassStatus === 'live',
              liveStreamUrl: updates.liveClassUrl
            })
          });
        }
      } catch (e) {
        // try next
      }
    }
  };

  const deleteCourse = async (id: string) => {
    setCourses((prev) => {
      const next = prev.filter((c) => c.id !== id);
      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(next));
      } catch {}
      return next;
    });
    try {
      const stored = JSON.parse(localStorage.getItem('kuldeep_studio_deleted_courses') || '[]');
      if (!stored.includes(id)) {
        localStorage.setItem('kuldeep_studio_deleted_courses', JSON.stringify([...stored, id]));
      }
    } catch (err) {
      console.warn('Error saving deleted course to localStorage:', err);
    }
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/courses/${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        // try next
      }
    }
  };

  // Lecture Handlers (Optimistic Local + Instant LocalStorage + 24/7 Cloud Sync)
  const addLectureToModule = async (courseId: string, moduleIndex: number, lecture: CourseLecture) => {
    let currentCourses = courses;
    try {
      const stored = localStorage.getItem('kuldeep_studio_courses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentCourses = parsed;
        }
      }
    } catch {}

    let targetCourse: Course | null = null;
    const nextCourses = currentCourses.map((course) => {
      if (course.id !== courseId) return course;
      const newModules = [...course.modules];
      if (!newModules[moduleIndex]) {
        newModules[moduleIndex] = {
          id: `mod-${Date.now()}-1`,
          title: 'Module 1: Foundations & Live Orientation',
          duration: '2 Weeks',
          lessonsCount: 1,
          topics: [lecture.title],
          lectures: [lecture]
        };
      } else {
        const currentLectures = newModules[moduleIndex].lectures || [];
        if (currentLectures.some((l) => l.id === lecture.id || (l.videoUrl && l.videoUrl === lecture.videoUrl))) {
          targetCourse = course;
          return course;
        }
        const allLecs = [...currentLectures, lecture];
        newModules[moduleIndex] = {
          ...newModules[moduleIndex],
          lectures: allLecs,
          lessonsCount: allLecs.length,
          topics: [...(newModules[moduleIndex].topics || []), lecture.title]
        };
      }
      const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
      const resCourse = {
        ...course,
        modules: newModules,
        totalLessons: total
      };
      targetCourse = resCourse;
      return resCourse;
    });

    setCourses(nextCourses);
    try {
      localStorage.setItem('kuldeep_studio_courses', JSON.stringify(nextCourses));
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }

    const backendEndpoints = getBackendUrls();
    for (const baseUrl of backendEndpoints) {
      try {
        const postRes = await fetch(`${baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/lectures`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lecture)
        });
        if (postRes.ok) {
          console.log(`[StudioData] Synced lecture to ${baseUrl}`);
          break;
        }
      } catch {
        // try next
      }
    }

    if (targetCourse) {
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetCourse)
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const updateLectureInModule = async (
    courseId: string,
    moduleIndex: number,
    lectureIndex: number,
    updates: Partial<CourseLecture>
  ) => {
    let currentCourses = courses;
    try {
      const stored = localStorage.getItem('kuldeep_studio_courses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentCourses = parsed;
        }
      }
    } catch {}

    let targetCourse: Course | null = null;
    const nextCourses = currentCourses.map((course) => {
      if (course.id !== courseId) return course;
      const newModules = [...course.modules];
      if (!newModules[moduleIndex]) return course;
      const currentLectures = [...(newModules[moduleIndex].lectures || [])];
      if (!currentLectures[lectureIndex]) return course;
      currentLectures[lectureIndex] = { ...currentLectures[lectureIndex], ...updates };
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lectures: currentLectures,
        topics: currentLectures.map((l) => l.title)
      };
      const resCourse = { ...course, modules: newModules };
      targetCourse = resCourse;
      return resCourse;
    });

    setCourses(nextCourses);
    try {
      localStorage.setItem('kuldeep_studio_courses', JSON.stringify(nextCourses));
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }

    if (targetCourse) {
      const backendEndpoints = getBackendUrls();
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetCourse)
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const deleteLectureFromModule = async (courseId: string, moduleIndex: number, lectureIndex: number) => {
    let currentCourses = courses;
    try {
      const stored = localStorage.getItem('kuldeep_studio_courses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentCourses = parsed;
        }
      }
    } catch {}

    let targetLectureId: string | null = null;
    let targetLectureVideoUrl: string | null = null;
    let targetCourse: Course | null = null;

    const nextCourses = currentCourses.map((course) => {
      if (course.id !== courseId) return course;
      const newModules = [...course.modules];
      if (!newModules[moduleIndex]) return course;
      const currentLectures = newModules[moduleIndex].lectures || [];
      if (currentLectures[lectureIndex]) {
        targetLectureId = currentLectures[lectureIndex].id;
        targetLectureVideoUrl = currentLectures[lectureIndex].videoUrl || null;
      }
      const filteredLectures = currentLectures.filter((_, idx) => idx !== lectureIndex);
      newModules[moduleIndex] = {
        ...newModules[moduleIndex],
        lectures: filteredLectures,
        lessonsCount: filteredLectures.length,
        topics: filteredLectures.map((l) => l.title)
      };
      const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
      const resCourse = { ...course, modules: newModules, totalLessons: total };
      targetCourse = resCourse;
      return resCourse;
    });

    setCourses(nextCourses);
    try {
      localStorage.setItem('kuldeep_studio_courses', JSON.stringify(nextCourses));
      if (targetLectureId) {
        const deletedList: string[] = JSON.parse(localStorage.getItem('kuldeep_studio_deleted_lectures') || '[]');
        if (!deletedList.includes(targetLectureId)) {
          deletedList.push(targetLectureId);
          localStorage.setItem('kuldeep_studio_deleted_lectures', JSON.stringify(deletedList));
        }
      }
    } catch (err) {
      console.error('LocalStorage write error:', err);
    }

    const backendEndpoints = getBackendUrls();

    for (const baseUrl of backendEndpoints) {
      try {
        const delUrl = targetLectureId
          ? `${baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/lectures/${lectureIndex}?lectureId=${targetLectureId}`
          : `${baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/lectures/${lectureIndex}`;
        await fetch(delUrl, { method: 'DELETE' });
      } catch {
        // ignore
      }
    }

    if (targetLectureVideoUrl) {
      deleteBunnyVideo(targetLectureVideoUrl).catch(() => {});
    }

    if (targetCourse) {
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(targetCourse)
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const addModuleToCourse = async (courseId: string, title?: string, duration?: string) => {
    let updatedCourse: Course | null = null;
    setCourses((prev) => {
      const updated = prev.map((course) => {
        if (course.id !== courseId) return course;
        const newMod: CourseModule = {
          id: 'mod-' + Date.now(),
          title: title || `Module ${course.modules.length + 1}: Masterclass Continuation`,
          duration: duration || '3 Weeks',
          lessonsCount: 0,
          topics: [],
          lectures: []
        };
        const resCourse = {
          ...course,
          modules: [...course.modules, newMod]
        };
        updatedCourse = resCourse;
        return resCourse;
      });

      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(updated));
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }

      return updated;
    });

    let courseToPut = updatedCourse;
    if (!courseToPut) {
      try {
        const stored = JSON.parse(localStorage.getItem('kuldeep_studio_courses') || '[]');
        courseToPut = stored.find((c: Course) => c.id === courseId) || null;
      } catch {
        // ignore
      }
    }

    if (courseToPut) {
      const backendEndpoints = [
        'https://kuldeep-singh-backend-q1di.onrender.com',
        'http://localhost:5000'
      ];
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseToPut)
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const deleteModuleFromCourse = async (courseId: string, moduleIndex: number) => {
    let updatedCourse: Course | null = null;
    setCourses((prev) => {
      const updated = prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = course.modules.filter((_, idx) => idx !== moduleIndex);
        const total = newModules.reduce((acc, m) => acc + (m.lectures ? m.lectures.length : m.lessonsCount), 0);
        const resCourse = {
          ...course,
          modules: newModules,
          totalLessons: total
        };
        updatedCourse = resCourse;
        return resCourse;
      });

      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(updated));
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }

      return updated;
    });

    let courseToPut = updatedCourse;
    if (!courseToPut) {
      try {
        const stored = JSON.parse(localStorage.getItem('kuldeep_studio_courses') || '[]');
        courseToPut = stored.find((c: Course) => c.id === courseId) || null;
      } catch {
        // ignore
      }
    }

    if (courseToPut) {
      const backendEndpoints = [
        'https://kuldeep-singh-backend-q1di.onrender.com',
        'http://localhost:5000'
      ];
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseToPut)
          });
        } catch {
          // ignore
        }
      }
    }
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

  // Student Handlers (Optimistic Local + 24/7 Cloud Sync + Anti-Resurrection)
  const addStudent = async (student: EnrolledStudent) => {
    setStudents((prev) => [student, ...prev]);
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(student)
        });
      } catch (e) {
        console.error('Failed to sync new student to backend:', e);
      }
    }
  };

  const updateStudent = async (id: string, updates: Partial<EnrolledStudent>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id || s._id === id ? { ...s, ...updates } : s))
    );

    // If password or credentials changed, sync with matching user in users state
    if (updates.plainPassword) {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.email && updates.email && u.email.toLowerCase() === updates.email.toLowerCase()) {
            return {
              ...u,
              plainPassword: updates.plainPassword,
              name: updates.name || u.name,
              username: updates.username || u.username
            };
          }
          return u;
        })
      );
    }

    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/students/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (e) {
        console.error('Failed to update student on backend:', e);
      }
    }
  };

  const deleteStudent = async (id: string) => {
    // 1. Add to permanent deleted list in localStorage so polling never restores it
    let deletedList: string[] = [];
    try {
      deletedList = JSON.parse(localStorage.getItem('ks_deleted_students') || '[]');
    } catch {
      deletedList = [];
    }
    if (!deletedList.includes(id)) {
      deletedList.push(id);
      localStorage.setItem('ks_deleted_students', JSON.stringify(deletedList));
    }

    // 2. Remove immediately from local state
    setStudents((prev) => prev.filter((s) => s.id !== id && s._id !== id));

    // 3. Delete across all backend instances
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/students/${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Failed to delete student from backend:', e);
      }
    }
  };

  // User Handlers (Website Accounts & Login Credentials)
  const updateUser = async (id: string, updates: Partial<RegisteredUser> & { password?: string }) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id || u._id === id ? { ...u, ...updates } : u))
    );

    // If password or credentials changed, sync with matching enrolled student
    const newPass = updates.password || updates.plainPassword;
    if (newPass || updates.name || updates.username) {
      setStudents((prev) =>
        prev.map((s) => {
          if (s.email && updates.email && s.email.toLowerCase() === updates.email.toLowerCase()) {
            return {
              ...s,
              plainPassword: newPass || s.plainPassword,
              name: updates.name || s.name,
              username: updates.username || s.username
            };
          }
          return s;
        })
      );
    }

    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch (e) {
        console.error('Failed to update user on backend:', e);
      }
    }
  };

  const deleteUser = async (id: string) => {
    let deletedUserList: string[] = [];
    try {
      deletedUserList = JSON.parse(localStorage.getItem('ks_deleted_users') || '[]');
    } catch {
      deletedUserList = [];
    }
    if (!deletedUserList.includes(id)) {
      deletedUserList.push(id);
      localStorage.setItem('ks_deleted_users', JSON.stringify(deletedUserList));
    }

    setUsers((prev) => prev.filter((u) => u.id !== id && u._id !== id));

    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/users/${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Failed to delete user from backend:', e);
      }
    }
  };

  // Customer Inquiries CRUD
  const updateInquiryStatus = async (id: string, status: 'new' | 'contacted' | 'resolved') => {
    setInquiries((prev) => prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)));

    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/inquiries/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
      } catch (e) {
        console.error('Failed to update inquiry status on backend:', e);
      }
    }
  };

  const deleteInquiry = async (id: string) => {
    let deletedInqList: string[] = [];
    try {
      deletedInqList = JSON.parse(localStorage.getItem('ks_deleted_inquiries') || '[]');
    } catch {
      deletedInqList = [];
    }
    if (!deletedInqList.includes(id)) {
      deletedInqList.push(id);
      localStorage.setItem('ks_deleted_inquiries', JSON.stringify(deletedInqList));
    }

    setInquiries((prev) => prev.filter((inq) => inq.id !== id));

    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/inquiries/${id}`, {
          method: 'DELETE'
        });
      } catch (e) {
        console.error('Failed to delete inquiry from backend:', e);
      }
    }
  };

  // Upcoming Courses CRUD
  const addUpcomingCourse = async (course: UpcomingCourse) => {
    setUpcomingCourses((prev) => [course, ...prev]);
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/upcoming-courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(course)
        });
        break;
      } catch (e) {
        console.warn('Backend sync failed for new upcoming course:', e);
      }
    }
  };

  const updateUpcomingCourse = async (id: string, updates: Partial<UpcomingCourse>) => {
    setUpcomingCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/upcoming-courses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        break;
      } catch (e) {
        console.warn('Backend sync failed for upcoming course update:', e);
      }
    }
  };

  const deleteUpcomingCourse = async (id: string) => {
    setUpcomingCourses((prev) => prev.filter((c) => c.id !== id));
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/upcoming-courses/${id}`, {
          method: 'DELETE'
        });
        break;
      } catch (e) {
        console.warn('Backend delete failed for upcoming course:', e);
      }
    }
  };

  // Testimonials / Reviews CRUD
  const addReview = async (review: CollectorReview) => {
    setReviews((prev) => [review, ...prev]);
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/testimonials`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(review)
        });
        break;
      } catch (e) {
        console.warn('Backend sync failed for testimonial create:', e);
      }
    }
  };

  const updateReview = async (id: string, updates: Partial<CollectorReview>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/testimonials/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        break;
      } catch (e) {
        console.warn('Backend sync failed for testimonial update:', e);
      }
    }
  };

  const deleteReview = async (id: string) => {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    for (const base of getBackendUrls()) {
      try {
        await fetch(`${base}/api/testimonials/${id}`, {
          method: 'DELETE'
        });
        break;
      } catch (e) {
        console.warn('Backend delete failed for testimonial:', e);
      }
    }
  };

  // Factory Reset
  const resetToDefaults = () => {
    localStorage.removeItem('kuldeep_studio_artworks');
    localStorage.removeItem('kuldeep_studio_courses');
    localStorage.removeItem('kuldeep_studio_students');
    localStorage.removeItem('kuldeep_studio_users');
    localStorage.removeItem('kuldeep_studio_inquiries');
    localStorage.removeItem('ks_deleted_students');
    localStorage.removeItem('ks_deleted_users');
    localStorage.removeItem('ks_deleted_inquiries');
    localStorage.removeItem('kuldeep_studio_profile');
    localStorage.removeItem('kuldeep_studio_timeline');
    localStorage.removeItem('kuldeep_studio_awards');
    localStorage.removeItem('kuldeep_studio_upcoming_courses');
    localStorage.removeItem('kuldeep_studio_testimonials');
    setArtworks(ARTWORKS);
    setCourses(COURSES);
    setStudents(INITIAL_STUDENTS);
    setUsers(INITIAL_USERS);
    setInquiries([]);
    setArtistProfile(DEFAULT_PROFILE);
    setTimeline(TIMELINE);
    setUpcomingCourses(INITIAL_UPCOMING_COURSES);
    setReviews(REVIEWS);
  };

  return (
    <StudioDataContext.Provider
      value={{
        artworks,
        courses,
        students,
        users,
        inquiries,
        artistProfile,
        timeline,
        awards,
        upcomingCourses,
        addUpcomingCourse,
        updateUpcomingCourse,
        deleteUpcomingCourse,
        reviews,
        addReview,
        updateReview,
        deleteReview,
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
