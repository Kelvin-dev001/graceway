'use client';

import { getYouTubeVideoId } from '@/lib/utils';
import { useState } from 'react';

export default function VideoPlayer({ url, title }) {
  const [loaded, setLoaded] = useState(false);
  const videoId = getYouTubeVideoId(url);

  if (!url || !videoId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-gray-400">No video available</p>
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black relative">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-pulse text-white">Loading video...</div>
        </div>
      )}
      <iframe
        src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`}
        title={title || 'Lesson Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
