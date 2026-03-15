export const APP_NAME = 'Graceway Generation';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://graceway-platform.vercel.app';

export const COLORS = {
  navy: '#0A2463',
  green: '#4CAF50',
  greenLight: '#8BC34A',
  orange: '#FF6D00',
  teal: '#0F9B8E',
  white: '#FFFFFF',
  lightGray: '#F8FAFC',
};

export const ROLES = {
  STUDENT: 'student',
  LEADER: 'leader',
  ADMIN: 'admin',
};

export const QUIZ_TYPES = {
  LESSON_QUIZ: 'lesson_quiz',
  MODULE_EXAM: 'module_exam',
  COURSE_EXAM: 'course_exam',
};

export const CERTIFICATE_TYPES = {
  MODULE: 'module',
  COURSE: 'course',
};

export const PASSING_SCORE = 60;
export const MAX_ATTEMPTS = 3;

export const DISCIPLESHIP_STEPS = [
  { step: 1, label: 'Recruit', icon: '🤝', description: 'Join and invite others' },
  { step: 2, label: 'Root', icon: '🌱', description: 'Learn foundational teachings' },
  { step: 3, label: 'Certify', icon: '📜', description: 'Complete courses and earn certificates' },
  { step: 4, label: 'Multiply', icon: '✖️', description: 'Share your referral link' },
  { step: 5, label: 'Lead', icon: '👑', description: 'Lead your generation group' },
  { step: 6, label: 'Repeat', icon: '🔄', description: 'Keep growing and multiplying' },
];

export const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/courses', label: 'Courses' },
  { href: '/certificates', label: 'Certificates' },
  { href: '/profile', label: 'Profile' },
];

export const LEADER_NAV_LINKS = [
  { href: '/leader', label: 'Overview' },
  { href: '/leader/students', label: 'Students' },
  { href: '/leader/tree', label: 'Tree' },
];

export const ADMIN_NAV_LINKS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/courses', label: 'Courses' },
  { href: '/admin/modules', label: 'Modules' },
  { href: '/admin/lessons', label: 'Lessons' },
  { href: '/admin/quizzes', label: 'Quizzes' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/certificates', label: 'Certificates' },
  { href: '/admin/analytics', label: 'Analytics' },
];
