import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getYouTubeVideoId } from '../../src/lib/utils.js';

test('getYouTubeVideoId extracts the id from a standard watch URL', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId extracts the id from a youtu.be short link', () => {
  assert.equal(getYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId extracts the id from an embed URL', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId extracts the id from a shorts URL', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId extracts the id from a shorts URL with a query string', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId extracts the id when v= is not the first query param', () => {
  assert.equal(getYouTubeVideoId('https://www.youtube.com/watch?list=PLxxx&v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('getYouTubeVideoId returns null for a falsy input', () => {
  assert.equal(getYouTubeVideoId(''), null);
  assert.equal(getYouTubeVideoId(null), null);
});

test('getYouTubeVideoId returns null for a non-YouTube URL', () => {
  assert.equal(getYouTubeVideoId('https://example.com/video/123'), null);
});
