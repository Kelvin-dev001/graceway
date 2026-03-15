import LoginForm from '@/features/auth/LoginForm';

export const metadata = { title: 'Sign In — Graceway' };

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-500 to-teal-500 flex items-center justify-center p-4 pt-20">
      <LoginForm />
    </div>
  );
}
