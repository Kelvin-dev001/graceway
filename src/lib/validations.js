export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  return password && password.length >= 8;
}

export function validateName(name) {
  return name && name.trim().length >= 2;
}

export function validateSignupForm({ name, email, password }) {
  const errors = {};
  if (!validateName(name)) errors.name = 'Name must be at least 2 characters';
  if (!validateEmail(email)) errors.email = 'Please enter a valid email';
  if (!validatePassword(password)) errors.password = 'Password must be at least 8 characters';
  return errors;
}

export function validateLoginForm({ email, password }) {
  const errors = {};
  if (!validateEmail(email)) errors.email = 'Please enter a valid email';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateCourseForm({ title, description, slug }) {
  const errors = {};
  if (!title || title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (!slug || slug.trim().length < 2) errors.slug = 'Slug is required';
  if (description && description.length > 2000) errors.description = 'Description too long';
  return errors;
}

export function validateLessonForm({ title, slug }) {
  const errors = {};
  if (!title || title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (!slug || slug.trim().length < 2) errors.slug = 'Slug is required';
  return errors;
}

export function validateQuizForm({ title, passing_score, max_attempts }) {
  const errors = {};
  if (!title || title.trim().length < 3) errors.title = 'Title must be at least 3 characters';
  if (passing_score < 1 || passing_score > 100) errors.passing_score = 'Passing score must be between 1 and 100';
  if (max_attempts < 1 || max_attempts > 10) errors.max_attempts = 'Max attempts must be between 1 and 10';
  return errors;
}
