import SignupForm from '@/app/components/SignupForm';

export default function Signup() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center bg-center bg-cover"
      style={{
        backgroundImage: "url('/signup.webp')",
        backgroundPosition: "center center",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        marginTop: "-123px",
        padding: "167px 2px"
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{background: "#00000052"}} />
      {/* Content */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-xl shadow-md" style={{ background: '#69c8cd' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold" style={{ color: '#fff' }}>Create your account</h1>
          <p className="mt-2 text-sm" style={{ color: '#fff', fontWeight: 700 }}>
            Already have an account?{' '}
            <a href="/login" className="font-extrabold uppercase" style={{ color: '#000', transition: 'color 0.2s' }}>
              Sign in
            </a>
          </p>
        </div>
        <SignupForm />
      </div>
    </section>
  );
}