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
  studioAddress: 'West 24th Street, Gallery District, Manhattan, NY 10011',
  studioVideoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
  studioVideoTitle: 'Artist Kuldeep Singh • Master Oil Painting in Atelier',
  studioVideoPoster: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop'
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
  updateStudent: (id: string, updates: Partial<EnrolledStudent>) => void;
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
      modules: (c.modules || []).map((m, mIdx) => {
        // If lectures is already an initialized array (even if empty []), NEVER auto-generate fake lectures
        if (Array.isArray(m.lectures)) {
          return {
            ...m,
            lectures: m.lectures,
            lessonsCount: m.lectures.length
          };
        }
        // Only if m.lectures is undefined (legacy unmigrated data)
        const initialLecs: CourseLecture[] = (m.topics || []).map((top, tIdx) => ({
          id: `lec-${c.id}-${m.id || mIdx}-${tIdx + 1}`,
          title: top,
          duration: '45 Mins',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          summary: `Master practical demonstration by Artist Kuldeep Singh covering ${top}.`,
          accessType: 'enrolled',
          isFreePreview: false
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

  // Sync with Remote 24/7 Cloud Backend (Artworks, Courses & Lectures, Students)
  useEffect(() => {
    let isMounted = true;

    const syncAllWithCloud = async () => {
      try {
        // 1. Artworks
        const artRes = await fetch('https://kuldeep-singh-backend.onrender.com/api/artworks');
        if (artRes.ok) {
          const cloudArtworks: Artwork[] = await artRes.json();
          if (Array.isArray(cloudArtworks) && cloudArtworks.length > 0) {
            let savedLocal: Artwork[] = [];
            try {
              const localStr = localStorage.getItem('kuldeep_studio_artworks');
              if (localStr) savedLocal = JSON.parse(localStr);
            } catch (e) {
              // ignore
            }

            const pendingUploads = savedLocal.filter(
              (localArt) => !cloudArtworks.some((c) => c.id === localArt.id || c.title.trim().toLowerCase() === localArt.title.trim().toLowerCase())
            );

            if (pendingUploads.length > 0) {
              for (const pending of pendingUploads) {
                try {
                  await fetch('https://kuldeep-singh-backend.onrender.com/api/artworks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pending)
                  });
                } catch (upErr) {
                  console.warn('Pending artwork upload error:', upErr);
                }
              }
              const refreshedRes = await fetch('https://kuldeep-singh-backend.onrender.com/api/artworks');
              if (refreshedRes.ok) {
                const refreshed = await refreshedRes.json();
                if (isMounted) setArtworks(refreshed);
              }
            } else if (isMounted) {
              setArtworks(cloudArtworks);
            }
          }
        }

        // 2. Courses & Lectures
        const courseRes = await fetch('https://kuldeep-singh-backend.onrender.com/api/courses').catch(() => null);
        if (courseRes && courseRes.ok) {
          const cloudCourses: Course[] = await courseRes.json();
          if (Array.isArray(cloudCourses) && isMounted) {
            let savedLocal: Course[] = [];
            try {
              const localStr = localStorage.getItem('kuldeep_studio_courses');
              if (localStr) savedLocal = JSON.parse(localStr);
            } catch (e) {
              // ignore
            }

            // SMART MERGE: Never allow cloud to wipe out local lectures!
            let hasLocalLecturesToSync = false;
            let deletedLecIds: string[] = [];
            try {
              deletedLecIds = JSON.parse(localStorage.getItem('kuldeep_studio_deleted_lectures') || '[]');
            } catch {
              deletedLecIds = [];
            }

            const mergedCourses = cloudCourses.map((cloudC) => {
              const localC = savedLocal.find((l) => l.id === cloudC.id);
              if (!localC) {
                const cleanedModules = (cloudC.modules || []).map((cloudM) => {
                  const cleanedLecs = (cloudM.lectures || []).filter((cLec) => !deletedLecIds.includes(cLec.id));
                  return {
                    ...cloudM,
                    lectures: cleanedLecs,
                    lessonsCount: cleanedLecs.length,
                    topics: cleanedLecs.map((l) => l.title)
                  };
                });
                return {
                  ...cloudC,
                  modules: cleanedModules,
                  totalLessons: cleanedModules.reduce((acc, m) => acc + (m.lectures?.length || m.lessonsCount || 0), 0)
                };
              }

              const mergedModules = (cloudC.modules || []).map((cloudM, mIdx) => {
                const localM = localC.modules?.[mIdx];
                const rawCloudLecs = cloudM.lectures || [];
                const cloudLecs = rawCloudLecs.filter((cLec) => !deletedLecIds.includes(cLec.id));
                if (!localM) {
                  return {
                    ...cloudM,
                    lectures: cloudLecs,
                    lessonsCount: cloudLecs.length,
                    topics: cloudLecs.map((l) => l.title)
                  };
                }

                const rawLocalLecs = localM.lectures || [];
                const localLecs = rawLocalLecs.filter((lLec) => !deletedLecIds.includes(lLec.id));

                // Keep local lectures that might not have reached the cloud yet
                const missingInCloud = localLecs.filter(
                  (lLec) => !cloudLecs.some((cLec) => cLec.id === lLec.id || (cLec.videoUrl && cLec.videoUrl === lLec.videoUrl))
                );

                if (missingInCloud.length > 0) {
                  hasLocalLecturesToSync = true;
                  const allLecs = [...cloudLecs, ...missingInCloud];
                  return {
                    ...cloudM,
                    lectures: allLecs,
                    lessonsCount: allLecs.length,
                    topics: allLecs.map((l) => l.title)
                  };
                }
                return {
                  ...cloudM,
                  lectures: cloudLecs,
                  lessonsCount: cloudLecs.length,
                  topics: cloudLecs.map((l) => l.title)
                };
              });

              return {
                ...cloudC,
                modules: mergedModules,
                totalLessons: mergedModules.reduce((acc, m) => acc + (m.lectures?.length || m.lessonsCount || 0), 0)
              };
            });

            // Also keep courses that exist locally but not yet on cloud
            const pendingNewCourses = savedLocal.filter(
              (localCourse) => !cloudCourses.some((c) => c.id === localCourse.id)
            );

            const finalCourses = [...mergedCourses, ...pendingNewCourses];

            if (isMounted) {
              setCourses(normalizeCourses(finalCourses));
            }

            // Push pending local courses and lectures back to cloud to keep cloud 100% in sync
            if (hasLocalLecturesToSync || pendingNewCourses.length > 0) {
              for (const courseToSync of finalCourses) {
                try {
                  await fetch(`https://kuldeep-singh-backend.onrender.com/api/courses/${courseToSync.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseToSync)
                  });
                } catch {
                  // ignore
                }
              }
            }
          }
        }

        // 3. Students
        const stuRes = await fetch('https://kuldeep-singh-backend.onrender.com/api/students');
        if (stuRes.ok) {
          const cloudStudents: EnrolledStudent[] = await stuRes.json();
          if (Array.isArray(cloudStudents) && isMounted) {
            setStudents(cloudStudents);
          }
        }
      } catch (err) {
        console.warn('Cloud sync skipped, using local cache:', err);
      }
    };

    syncAllWithCloud();
    const interval = setInterval(syncAllWithCloud, 2500);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('https://kuldeep-singh-backend.onrender.com/api/events');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'STUDENT_ENROLLED' && payload.data) {
            setStudents((prev) => {
              if (prev.some((s) => s.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
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
      clearInterval(interval);
      if (eventSource) eventSource.close();
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
      await fetch('https://kuldeep-singh-backend.onrender.com/api/artworks', {
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
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (err) {
      console.error('Error updating artwork in cloud database:', err);
    }
  };

  const deleteArtwork = async (id: string) => {
    setArtworks((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/artworks/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting artwork from cloud database:', err);
    }
  };

  // Course Handlers
  const addCourse = async (course: Course) => {
    setCourses((prev) => [course, ...prev]);
    try {
      await fetch('https://kuldeep-singh-backend.onrender.com/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course)
      });
    } catch (e) {
      console.error('Failed to sync new course to backend:', e);
    }
  };

  const updateCourse = async (id: string, updates: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    try {
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (updates.liveClassStatus !== undefined) {
        await fetch('https://kuldeep-singh-backend.onrender.com/api/live', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isLive: updates.liveClassStatus === 'live',
            liveStreamUrl: updates.liveClassUrl
          })
        });
      }
    } catch (e) {
      console.error('Failed to sync course update to backend:', e);
    }
  };

  const deleteCourse = async (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    try {
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/courses/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete course from backend:', e);
    }
  };

  // Lecture Handlers (Optimistic Local + Instant LocalStorage + 24/7 Cloud Sync)
  const addLectureToModule = async (courseId: string, moduleIndex: number, lecture: CourseLecture) => {
    let updatedCourse: Course | null = null;
    setCourses((prev) => {
      const updated = prev.map((course) => {
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
        updatedCourse = resCourse;
        return resCourse;
      });

      // Synchronously write to localStorage immediately so page refresh NEVER loses it!
      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(updated));
      } catch (err) {
        console.error('LocalStorage write error:', err);
      }

      return updated;
    });

    const backendEndpoints = [
      'https://kuldeep-singh-backend.onrender.com',
      'http://localhost:5000'
    ];

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

    if (updatedCourse) {
      for (const baseUrl of backendEndpoints) {
        try {
          await fetch(`${baseUrl}/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCourse)
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
    let updatedCourse: Course | null = null;
    setCourses((prev) => {
      const updated = prev.map((course) => {
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
        'https://kuldeep-singh-backend.onrender.com',
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

  const deleteLectureFromModule = async (courseId: string, moduleIndex: number, lectureIndex: number) => {
    let updatedCourse: Course | null = null;
    let targetLectureId: string | null = null;

    setCourses((prev) => {
      const updated = prev.map((course) => {
        if (course.id !== courseId) return course;
        const newModules = [...course.modules];
        if (!newModules[moduleIndex]) return course;
        const currentLectures = newModules[moduleIndex].lectures || [];
        if (currentLectures[lectureIndex]) {
          targetLectureId = currentLectures[lectureIndex].id;
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
        updatedCourse = resCourse;
        return resCourse;
      });

      // Synchronously write to localStorage and record deleted lecture ID
      try {
        localStorage.setItem('kuldeep_studio_courses', JSON.stringify(updated));
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

    const backendEndpoints = [
      'https://kuldeep-singh-backend.onrender.com',
      'http://localhost:5000'
    ];

    for (const baseUrl of backendEndpoints) {
      try {
        await fetch(`${baseUrl}/api/courses/${courseId}/modules/${moduleIndex}/lectures/${lectureIndex}`, {
          method: 'DELETE'
        });
      } catch {
        // ignore
      }
    }

    if (courseToPut) {
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
        'https://kuldeep-singh-backend.onrender.com',
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
        'https://kuldeep-singh-backend.onrender.com',
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

  // Student Handlers (Optimistic Local + 24/7 Cloud Sync)
  const addStudent = async (student: EnrolledStudent) => {
    setStudents((prev) => [student, ...prev]);
    try {
      await fetch('https://kuldeep-singh-backend.onrender.com/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });
    } catch (e) {
      console.error('Failed to sync new student to cloud backend:', e);
    }
  };

  const updateStudent = async (id: string, updates: Partial<EnrolledStudent>) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    try {
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/students/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (e) {
      console.error('Failed to update student on cloud backend:', e);
    }
  };

  const deleteStudent = async (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`https://kuldeep-singh-backend.onrender.com/api/students/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error('Failed to delete student from cloud backend:', e);
    }
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
        updateStudent,
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
