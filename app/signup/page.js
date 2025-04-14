import SignupForm from '@/app/components/SignupForm';

export default function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
              Sign in
            </a>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}