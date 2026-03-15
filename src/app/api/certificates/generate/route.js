import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateCertificateNumber } from '@/lib/utils';

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courseId, moduleId, certificateType } = await request.json();

    const certNumber = generateCertificateNumber();
    const insertData = {
      user_id: user.id,
      certificate_type: certificateType || 'course',
      certificate_number: certNumber,
    };

    if (courseId) insertData.course_id = courseId;
    if (moduleId) insertData.module_id = moduleId;

    const { data: cert, error } = await supabase
      .from('certificates')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ certificate: cert });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
