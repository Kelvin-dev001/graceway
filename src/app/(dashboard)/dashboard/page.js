export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import ReferralLink from '@/features/referrals/ReferralLink';
import { calculateProgress, getCourseProgressMap } from '@/lib/progress';

export const metadata = { title: 'Dashboard — Graceway' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: enrollments },
    { data: certificates },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('enrollments').select('*, courses(*)').eq('user_id', user.id),
    supabase.from('certificates').select('*').eq('user_id', user.id),
  ]);

  const enrolledCourseIds = (enrollments || []).map((enrollment) => enrollment.course_id);
  const progressByCourse = await getCourseProgressMap({
    supabase,
    userId: user.id,
    courseIds: enrolledCourseIds,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold text-navy-500 mb-1">
          Welcome back, {profile?.name?.split(' ')[0] || 'Friend'} 👋
        </h1>
        <p className="text-gray-500">Continue your discipleship journey</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-navy-500">{enrollments?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Enrolled Courses</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-green-500">{certificates?.length || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Certificates</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-extrabold text-orange-500">{profile?.generation_level || 0}</div>
          <div className="text-sm text-gray-500 mt-1">Generation Level</div>
        </Card>
      </div>

      {enrollments && enrollments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-navy-500">My Courses</h2>
            <Link href="/courses" className="text-sm text-navy-500 hover:underline">View All</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {enrollments.slice(0, 4).map((enrollment) => {
              const courseProgress = progressByCourse[enrollment.course_id] || { completedLessons: 0, totalLessons: 0 };
              const progressPercent = calculateProgress(courseProgress.completedLessons, courseProgress.totalLessons);
              return (
                <Card key={enrollment.id}>
                <h3 className="font-bold text-navy-500 mb-3">{enrollment.courses?.title}</h3>
                <ProgressBar value={progressPercent} max={100} label="Progress" />
                <Link
                  href={`/courses/${enrollment.course_id}`}
                  className="block mt-4 text-center bg-navy-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-navy-600 transition-colors"
                >
                  Continue Learning
                </Link>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {!enrollments?.length && (
        <Card className="text-center py-12">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-navy-500 mb-2">Start Your Journey</h3>
          <p className="text-gray-500 mb-6">Enroll in your first course to begin your discipleship training.</p>
          <Link href="/courses" className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
            Browse Courses
          </Link>
        </Card>
      )}

      {profile?.referral_code && (
        <div>
          <h2 className="text-xl font-bold text-navy-500 mb-4">Invite Others</h2>
          <ReferralLink code={profile.referral_code} />
        </div>
      )}
    </div>
  );
}
