import LoginForm from '@/app/components/LoginForm';

export default function Login() {
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              create an account
            </a>
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}