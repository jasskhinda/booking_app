import ResetPasswordForm from '@/app/components/ResetPasswordForm';

export default function ResetPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}