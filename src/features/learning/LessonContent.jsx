'use client';

import { motion } from 'framer-motion';
import VideoPlayer from '@/components/shared/VideoPlayer';
import PdfViewer from '@/components/shared/PdfViewer';

export default function LessonContent({ lesson }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-navy-500 mb-2">{lesson.title}</h1>
        {lesson.duration_minutes > 0 && (
          <p className="text-sm text-gray-400">{lesson.duration_minutes} min read</p>
        )}
      </div>

      {lesson.video_url && (
        <VideoPlayer url={lesson.video_url} title={lesson.title} />
      )}

      {lesson.content && (
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {lesson.content}
        </div>
      )}

      {lesson.pdf_url && (
        <PdfViewer url={lesson.pdf_url} title={`${lesson.title} - Course Material`} />
      )}
    </motion.div>
  );
}
