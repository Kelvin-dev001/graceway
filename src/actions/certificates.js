'use server';

import { createClient } from '@/lib/supabase/server';
import { generateCertificateNumber } from '@/lib/utils';
import { sendCertificateEmail } from '@/lib/resend';

export async function issueCertificate(courseId, moduleId, certificateType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const certificateNumber = generateCertificateNumber();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', user.id)
    .single();

  const insertData = {
    user_id: user.id,
    certificate_type: certificateType,
    certificate_number: certificateNumber,
  };

  if (courseId) insertData.course_id = courseId;
  if (moduleId) insertData.module_id = moduleId;

  const { data: cert, error } = await supabase
    .from('certificates')
    .insert(insertData)
    .select()
    .single();

  if (error) return { error: error.message };

  const certUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${cert.id}`;
  
  let resourceName = 'Course';
  if (courseId) {
    const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
    if (course) resourceName = course.title;
  }

  try {
    await sendCertificateEmail(profile.email, profile.name, resourceName, certUrl);
  } catch (e) {
    console.error('Certificate email failed:', e);
  }

  return { data: cert };
}

export async function getCertificates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [] };

  const { data, error } = await supabase
    .from('certificates')
    .select('*, courses(*), modules(*)')
    .eq('user_id', user.id)
    .order('issued_at', { ascending: false });

  if (error) return { error: error.message };
  return { data };
}

export async function getCertificate(certId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('*, profiles(*), courses(*), modules(*)')
    .eq('id', certId)
    .single();

  if (error) return { error: error.message };
  return { data };
}
