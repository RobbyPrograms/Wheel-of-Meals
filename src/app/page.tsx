import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center">
      <div className="w-full bg-primary py-6">
        <div className="container flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Wheel of Meals</h1>
          <div className="flex gap-4">
            <Link href="/login" className="btn bg-white text-primary hover:bg-white/90">
              Login
            </Link>
            <Link href="/signup" className="btn bg-accent text-dark hover:bg-accent/90">
              Sign Up
            </Link>
          </div>
        </div>
      </div>

      <section className="container py-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Discover Your Next Favorite Meal</h2>
        <p className="text-xl max-w-2xl mb-10">
          Wheel of Meals helps you find exciting new meal ideas based on your favorite foods.
          Spin the wheel, get personalized suggestions, and never wonder "what's for dinner?" again.
        </p>
        <Link href="/signup" className="btn btn-primary text-lg px-8 py-3">
          Get Started
        </Link>
      </section>

      <section className="w-full bg-secondary/10 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p>Sign up and save your favorite foods and meal preferences.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Spin the Wheel</h3>
              <p>Use our interactive meal wheel to randomly select your next meal.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Get Meal Plans</h3>
              <p>Generate weekly meal plans with complete ingredient lists.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">User Authentication</h3>
              <p>Create your account and securely store your preferences.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Interactive Meal Wheel</h3>
              <p>A fun, visual way to randomly select your next meal.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Meal Planning</h3>
              <p>Generate one or two-week meal plans with complete ingredient lists.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Suggestions</h3>
              <p>Get creative recipe ideas based on your favorite foods.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full bg-dark text-white py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Wheel of Meals</h2>
              <p className="text-white/70">Never wonder what's for dinner again.</p>
            </div>
            <div className="flex gap-6">
              <Link href="/about" className="text-white/70 hover:text-white">About</Link>
              <Link href="/contact" className="text-white/70 hover:text-white">Contact</Link>
              <Link href="/privacy" className="text-white/70 hover:text-white">Privacy</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/20 text-center text-white/50">
            <p>© {new Date().getFullYear()} Wheel of Meals. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
} 