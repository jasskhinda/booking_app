import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-white dark:bg-black shadow">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">Compassionate Rides</h1>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link href="/login" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Sign up
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-16 px-4 bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Caring Transportation for Everyone</h2>
            <p className="text-xl mb-10 max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
              Book rides with compassionate drivers who understand your unique needs and challenges.  
              We specialize in transportation for medical appointments, accessibility needs, and more.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                Book Your First Ride
              </Link>
              <Link href="#how-it-works" className="border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 font-medium">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-10">
              {/* Step 1 */}
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Create an Account</h3>
                <p className="text-gray-600 dark:text-gray-400">Sign up and tell us about your transportation needs and preferences.</p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Book Your Ride</h3>
                <p className="text-gray-600 dark:text-gray-400">Schedule a ride in advance or request one immediately based on your schedule.</p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 dark:text-blue-300 text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Enjoy Your Journey</h3>
                <p className="text-gray-600 dark:text-gray-400">Meet your compassionate driver and enjoy a safe, comfortable ride to your destination.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-100 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">&copy; 2025 Compassionate Rides. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Terms
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Privacy
              </Link>
              <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
