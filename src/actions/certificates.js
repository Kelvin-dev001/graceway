'use server';

import { createClient } from '@/lib/supabase/server';
import { generateCertificateNumber } from '@/lib/utils';
import { sendCertificateEmail } from '@/lib/resend';

export async function issueCertificate(userId, courseId, moduleId, certificateType) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (user.id !== userId) {
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (callerProfile?.role !== 'admin') return { error: 'Unauthorized' };
  }

  const certificateNumber = generateCertificateNumber();

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .single();

  const { data: cert, error } = await supabase.rpc('issue_certificate', {
    p_user_id: userId,
    p_course_id: courseId,
    p_module_id: moduleId,
    p_certificate_type: certificateType,
    p_certificate_number: certificateNumber,
  });

  if (error) return { error: error.message };

  const wasNewlyIssued = cert.certificate_number === certificateNumber;

  if (wasNewlyIssued) {
    const certUrl = `${process.env.NEXT_PUBLIC_APP_URL}/certificates/${cert.id}`;

    let resourceName = courseId ? 'Course' : 'Module';
    if (courseId) {
      const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
      if (course) resourceName = course.title;
    } else if (moduleId) {
      const { data: module } = await supabase.from('modules').select('title').eq('id', moduleId).single();
      if (module) resourceName = module.title;
    }

    try {
      await sendCertificateEmail(profile.email, profile.name, resourceName, certUrl);
    } catch (e) {
      console.error('Certificate email failed:', e);
    }
  }

  return { data: cert, newlyIssued: wasNewlyIssued };
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
  const { data: cert, error } = await supabase
    .rpc('get_public_certificate', { p_certificate_id: certId })
    .maybeSingle();

  if (error) return { error: error.message };
  if (!cert) return { data: null };

  return {
    data: {
      id: cert.id,
      certificate_number: cert.certificate_number,
      issued_at: cert.issued_at,
      pdf_url: cert.pdf_url,
      profiles: { name: cert.recipient_name },
      courses: cert.course_title ? { title: cert.course_title } : null,
      modules: cert.module_title ? { title: cert.module_title } : null,
    },
  };
}
