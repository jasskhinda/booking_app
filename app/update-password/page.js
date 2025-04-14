import UpdatePasswordForm from '@/app/components/UpdatePasswordForm';

export default function UpdatePassword() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-black rounded-xl shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Update your password</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter a new password below.
          </p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}