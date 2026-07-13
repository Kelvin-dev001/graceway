// Seeds a richer demo dataset for the LMS: one leader with a real referral downline
// (so the discipleship tree/leader dashboard has something to show), several students,
// and two full published courses (modules -> sections -> lessons -> a course exam quiz
// with questions/answers) so there's real content to browse, enroll in, and complete.
//
// Purely additive: never touches existing profiles or courses. Safe to rerun (idempotent
// by email/slug).
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local.');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

function createAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

const supabase = createAdminClient();
const PASSWORD = 'DemoPass123!';

const LEADER = { email: 'leader-demo@test.graceway.com', name: 'Grace Mwangi' };
const STUDENTS = [
  { email: 'student-demo-1@test.graceway.com', name: 'Peter Otieno' },
  { email: 'student-demo-2@test.graceway.com', name: 'Mary Wambui' },
  { email: 'student-demo-3@test.graceway.com', name: 'John Kiptoo' },
  { email: 'student-demo-4@test.graceway.com', name: 'Faith Njeri' },
  { email: 'student-demo-5@test.graceway.com', name: 'David Mutua' },
];

// ---------------------------------------------------------------------------
// User helpers (same idempotent create-or-reset pattern as scripts/seed-test-users.js)
// ---------------------------------------------------------------------------

async function findUserByEmail(email) {
  const perPage = 200;
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < perPage) return null;
  }
  return null;
}

async function ensureUser({ email, name, referredByCode }) {
  const metadata = { name };
  if (referredByCode) metadata.referred_by = referredByCode;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (!createError && created?.user) {
    return { user: created.user, status: 'created' };
  }

  const alreadyExists = createError && (createError.status === 422 || /already registered|already exists/i.test(createError.message || ''));
  if (!alreadyExists) throw createError;

  const existing = await findUserByEmail(email);
  if (!existing) throw new Error(`User ${email} reported "already exists" but was not found via listUsers().`);

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password: PASSWORD,
    email_confirm: true,
  });
  if (updateError) throw updateError;
  return { user: updated.user, status: 'existed' };
}

async function ensureProfileRole(userId, role) {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
  if (error) throw error;
}

// For an already-existing user (rerun case), the handle_new_user trigger won't
// re-fire, so referred_by/leader_id/referral_path/generation_level may be stale
// or missing. Fix it up directly to match what the trigger would have done.
async function ensureReferral(studentId, leaderProfile) {
  const { data: student, error } = await supabase
    .from('profiles')
    .select('referred_by')
    .eq('id', studentId)
    .single();
  if (error) throw error;
  if (student.referred_by === leaderProfile.id) return; // already correct

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      referred_by: leaderProfile.id,
      leader_id: leaderProfile.id,
      referral_path: `${leaderProfile.referral_path}${studentId}/`,
      generation_level: (leaderProfile.generation_level ?? 0) + 1,
    })
    .eq('id', studentId);
  if (updateError) throw updateError;
}

// ---------------------------------------------------------------------------
// Course content helpers
// ---------------------------------------------------------------------------

async function ensureCourse(course) {
  const { data: existing } = await supabase.from('courses').select('id').eq('slug', course.slug).maybeSingle();
  if (existing) {
    console.log(`  course "${course.title}" already exists, reusing (id=${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase.from('courses').insert(course).select('id').single();
  if (error) throw error;
  console.log(`  course "${course.title}" created (id=${data.id})`);
  return data.id;
}

async function ensureModule(courseId, mod) {
  const { data: existing } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId)
    .eq('title', mod.title)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('modules')
    .insert({ ...mod, course_id: courseId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureSection(moduleId, section) {
  const { data: existing } = await supabase
    .from('sections')
    .select('id')
    .eq('module_id', moduleId)
    .eq('title', section.title)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('sections')
    .insert({ ...section, module_id: moduleId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureLesson(moduleId, sectionId, lesson) {
  const { data: existing } = await supabase
    .from('lessons')
    .select('id')
    .eq('section_id', sectionId)
    .eq('slug', lesson.slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from('lessons')
    .insert({ ...lesson, module_id: moduleId, section_id: sectionId })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

async function ensureCourseExam(courseId, quiz) {
  const { data: existing } = await supabase
    .from('quizzes')
    .select('id')
    .eq('course_id', courseId)
    .eq('quiz_type', 'course_exam')
    .maybeSingle();
  if (existing) return existing.id;

  const { data: createdQuiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({
      title: quiz.title,
      description: quiz.description,
      quiz_type: 'course_exam',
      course_id: courseId,
      passing_score: quiz.passing_score,
      max_attempts: quiz.max_attempts,
      is_published: true,
    })
    .select('id')
    .single();
  if (quizError) throw quizError;

  for (const [qIndex, q] of quiz.questions.entries()) {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert({
        quiz_id: createdQuiz.id,
        question_text: q.text,
        question_type: 'multiple_choice',
        points: 1,
        order_index: qIndex,
      })
      .select('id')
      .single();
    if (questionError) throw questionError;

    const answersPayload = q.answers.map((a, aIndex) => ({
      question_id: question.id,
      answer_text: a.text,
      is_correct: a.correct === true,
      order_index: aIndex,
    }));
    const { error: answersError } = await supabase.from('answers').insert(answersPayload);
    if (answersError) throw answersError;
  }

  return createdQuiz.id;
}

// ---------------------------------------------------------------------------
// Content data
// ---------------------------------------------------------------------------

const COURSES = [
  {
    course: {
      title: 'Root: Foundations of Faith',
      slug: 'root-foundations-of-faith',
      description: 'A three-module journey through the core convictions of the Christian faith — who God is, what grace means, and how to walk daily with Him.',
      is_published: true,
      order_index: 100,
    },
    modules: [
      {
        module: { title: 'Who Is God?', description: 'Understanding the nature and character of God.', order_index: 0, is_published: true },
        sections: [
          {
            section: { title: 'The God Who Speaks', description: 'Scripture as God revealing Himself.', order_index: 0 },
            lessons: [
              {
                title: 'God Reveals Himself Through Creation',
                slug: 'god-reveals-himself-through-creation',
                content:
                  'From the very first page of Scripture, God shows us something of who He is through the world He made. Psalm 19:1 says "The heavens declare the glory of God; the skies proclaim the work of his hands." Creation is not random — it points to a Creator who is powerful, orderly, and intentional.\n\nAs you look at the world around you this week, ask: what does this teach me about God\'s character? His creativity, His attention to detail, His provision for every living thing — all of it is a window into who He is.',
                order_index: 0,
                is_published: true,
                duration_minutes: 8,
              },
              {
                title: 'God Reveals Himself Through Scripture',
                slug: 'god-reveals-himself-through-scripture',
                content:
                  'Creation shows us that God exists and that He is powerful — but it takes His Word to show us who He is in relationship to us. The Bible is not a collection of good ideas; it is God speaking directly, across generations, so that we can know Him personally.\n\n2 Timothy 3:16-17 reminds us that "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness." Make reading Scripture a daily habit, even five minutes, and ask God to speak to you through it.',
                order_index: 1,
                is_published: true,
                duration_minutes: 10,
              },
            ],
          },
        ],
      },
      {
        module: { title: 'What Is Grace?', description: 'Understanding salvation as an unearned gift.', order_index: 1, is_published: true },
        sections: [
          {
            section: { title: 'Grace, Not Works', description: 'Why salvation cannot be earned.', order_index: 0 },
            lessons: [
              {
                title: 'Saved by Grace Through Faith',
                slug: 'saved-by-grace-through-faith',
                content:
                  'Ephesians 2:8-9 is one of the clearest statements in Scripture about how salvation works: "For it is by grace you have been saved, through faith — and this is not from yourselves, it is the gift of God — not by works, so that no one can boast."\n\nGrace means unmerited favor — receiving something good that we didn\'t earn and don\'t deserve. This is the heart of the gospel: we can\'t work our way to God, but God has made a way to us through Jesus.',
                order_index: 0,
                is_published: true,
                duration_minutes: 9,
              },
            ],
          },
        ],
      },
      {
        module: { title: 'Walking Daily With God', description: 'Practical rhythms of a growing faith.', order_index: 2, is_published: true },
        sections: [
          {
            section: { title: 'Prayer and Community', description: 'The two pillars of a sustained walk with God.', order_index: 0 },
            lessons: [
              {
                title: 'The Practice of Prayer',
                slug: 'the-practice-of-prayer',
                content:
                  'Prayer is simply talking with God — bringing Him your thanks, your requests, your questions, and your worship. It doesn\'t require special words or a formal setting. Philippians 4:6 encourages us: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God."\n\nStart small: five minutes each morning, naming one thing you\'re thankful for and one thing you\'re bringing to God. Consistency matters more than length.',
                order_index: 0,
                is_published: true,
                duration_minutes: 7,
              },
              {
                title: 'Why Community Matters',
                slug: 'why-community-matters',
                content:
                  'Faith was never meant to be lived alone. Hebrews 10:24-25 urges believers not to give up meeting together, "but encouraging one another." A small group, a mentor, or even one committed friend in the faith can be the difference between drifting and growing.\n\nThis week, identify one person you can be intentional with — someone you can pray with, ask questions to, or simply do life alongside.',
                order_index: 1,
                is_published: true,
                duration_minutes: 8,
              },
            ],
          },
        ],
      },
    ],
    exam: {
      title: 'Foundations of Faith — Course Exam',
      description: 'A short exam covering the three modules of this course.',
      passing_score: 70,
      max_attempts: 3,
      questions: [
        {
          text: 'According to Ephesians 2:8-9, salvation is received by:',
          answers: [
            { text: 'Grace through faith', correct: true },
            { text: 'Good works alone', correct: false },
            { text: 'Church attendance', correct: false },
          ],
        },
        {
          text: 'What does creation reveal about God, according to Psalm 19:1?',
          answers: [
            { text: 'Nothing — creation is unrelated to God', correct: false },
            { text: 'His glory and the work of His hands', correct: true },
            { text: 'Only His power, not His character', correct: false },
          ],
        },
        {
          text: 'Why does the lesson recommend building consistent community?',
          answers: [
            { text: 'Because faith was never meant to be lived alone', correct: true },
            { text: 'Because it is required to be saved', correct: false },
            { text: 'It is optional and has no scriptural basis', correct: false },
          ],
        },
      ],
    },
  },
  {
    course: {
      title: 'Multiply: Leading Others to Christ',
      slug: 'multiply-leading-others-to-christ',
      description: 'A two-module course equipping believers to disciple and lead others, continuing the Recruit → Root → Certify → Multiply → Lead → Repeat cycle.',
      is_published: true,
      order_index: 101,
    },
    modules: [
      {
        module: { title: 'The Heart of a Disciple-Maker', description: 'Why multiplication, not just addition, matters.', order_index: 0, is_published: true },
        sections: [
          {
            section: { title: 'The Great Commission', description: 'Our mandate to make disciples.', order_index: 0 },
            lessons: [
              {
                title: 'Go and Make Disciples',
                slug: 'go-and-make-disciples',
                content:
                  'Matthew 28:19-20 records Jesus\' final instruction to His followers: "Therefore go and make disciples of all nations, baptizing them... and teaching them to obey everything I have commanded you." This is not a suggestion for a select few — it\'s the calling of every believer.\n\nMultiplication happens when a disciple doesn\'t just grow personally but intentionally invests in someone else\'s growth too. Who is one person you could begin investing in this month?',
                order_index: 0,
                is_published: true,
                duration_minutes: 9,
              },
            ],
          },
        ],
      },
      {
        module: { title: 'Practical Leadership', description: 'How to actually lead a small group or a new believer.', order_index: 1, is_published: true },
        sections: [
          {
            section: { title: 'Leading Well', description: 'Practical habits for effective, humble leadership.', order_index: 0 },
            lessons: [
              {
                title: 'Servant Leadership',
                slug: 'servant-leadership',
                content:
                  'Jesus modeled a radically different kind of leadership. In John 13, He washes His disciples\' feet — a task reserved for the lowest servant — and then says, "I have set you an example that you should do as I have done for you."\n\nLeading others in faith isn\'t about having all the answers. It\'s about walking alongside people with humility, consistency, and genuine care. Ask more questions than you answer, and be willing to say "I don\'t know, let\'s find out together."',
                order_index: 0,
                is_published: true,
                duration_minutes: 10,
              },
              {
                title: 'Following Up Consistently',
                slug: 'following-up-consistently',
                content:
                  'New believers and growing disciples need consistency more than intensity. A short, regular check-in — even a five-minute message once a week — communicates that someone cares about their walk with God.\n\nBuild a simple rhythm: pick one day a week to reach out to the people you\'re discipling. Ask how they\'re doing, what they\'re learning, and how you can pray for them.',
                order_index: 1,
                is_published: true,
                duration_minutes: 8,
              },
            ],
          },
        ],
      },
    ],
    exam: {
      title: 'Leading Others to Christ — Course Exam',
      description: 'A short exam covering disciple-making and leadership.',
      passing_score: 70,
      max_attempts: 3,
      questions: [
        {
          text: 'According to Matthew 28:19-20, who is called to make disciples?',
          answers: [
            { text: 'Only pastors and church leaders', correct: false },
            { text: 'Every believer', correct: true },
            { text: 'Only the original 12 apostles', correct: false },
          ],
        },
        {
          text: 'What leadership example does Jesus set in John 13?',
          answers: [
            { text: 'Commanding others without explanation', correct: false },
            { text: 'Servant leadership, washing His disciples\' feet', correct: true },
            { text: 'Avoiding close relationships with followers', correct: false },
          ],
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Seeding demo LMS content into the Supabase project...');
  console.log(`Target project: ${SUPABASE_URL}`);
  console.log('(purely additive — existing profiles and courses are never modified)\n');

  console.log('--- Users ---');
  const { user: leaderUser, status: leaderStatus } = await ensureUser({ email: LEADER.email, name: LEADER.name });
  await ensureProfileRole(leaderUser.id, 'leader');
  console.log(`Leader: ${LEADER.email} (${leaderStatus}, id=${leaderUser.id})`);

  const { data: leaderProfile } = await supabase
    .from('profiles')
    .select('id, referral_code, referral_path, generation_level')
    .eq('id', leaderUser.id)
    .single();

  const studentResults = [];
  for (const s of STUDENTS) {
    // eslint-disable-next-line no-await-in-loop
    const { user, status } = await ensureUser({ email: s.email, name: s.name, referredByCode: leaderProfile.referral_code });
    // eslint-disable-next-line no-await-in-loop
    await ensureReferral(user.id, leaderProfile);
    console.log(`Student: ${s.email} (${status}, id=${user.id}) -> referred by ${LEADER.email}`);
    studentResults.push({ email: s.email, id: user.id, status });
  }

  console.log('\n--- Courses ---');
  for (const entry of COURSES) {
    console.log(`\n"${entry.course.title}"`);
    const courseId = await ensureCourse(entry.course);

    for (const modEntry of entry.modules) {
      const moduleId = await ensureModule(courseId, modEntry.module);
      console.log(`  module "${modEntry.module.title}"`);

      for (const secEntry of modEntry.sections) {
        const sectionId = await ensureSection(moduleId, secEntry.section);
        console.log(`    section "${secEntry.section.title}"`);

        for (const lesson of secEntry.lessons) {
          // eslint-disable-next-line no-await-in-loop
          await ensureLesson(moduleId, sectionId, lesson);
          console.log(`      lesson "${lesson.title}"`);
        }
      }
    }

    const examId = await ensureCourseExam(courseId, entry.exam);
    console.log(`  course exam "${entry.exam.title}" (id=${examId}, ${entry.exam.questions.length} questions)`);
  }

  console.log('\n=== Summary ===');
  console.log(`Leader:   ${LEADER.email} / ${PASSWORD}`);
  console.log('Students:');
  studentResults.forEach((s) => console.log(`  ${s.email} / ${PASSWORD}`));
  console.log('Courses:');
  COURSES.forEach((c) => console.log(`  ${c.course.title} (/courses/... slug: ${c.course.slug})`));
  console.log('\nDone. All demo users and content are ready — existing data was not touched.');
}

main().catch((err) => {
  console.error('\nFailed to seed demo content:');
  console.error(err?.message || err);
  process.exit(1);
});
