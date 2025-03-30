"use client"
import React, { useEffect, useState } from 'react';
import { Activity, Bell, Clock, Server, ArrowRight, Check} from 'lucide-react';
import { useRouter } from 'next/navigation';

function App() {
  const [darkMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 dark:text-white transition-colors duration-200">
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
              Monitor Your Services with Confidence
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">
              Get instant alerts when your services go down. Monitor uptime, performance, and ensure your business never misses a beat.
            </p>
            <div className="mt-8 flex space-x-4">
              <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition flex items-center">
                Start Monitoring
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition dark:text-white">
                View Demo
              </button>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80"
              alt="Dashboard"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 dark:bg-gray-800/50 py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Everything you need for reliable monitoring
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Bell className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
              title="Instant Alerts"
              description="Get notified immediately when your services experience downtime through multiple channels."
            />
            <FeatureCard
              icon={<Clock className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
              title="24/7 Monitoring"
              description="Round-the-clock monitoring from multiple locations worldwide."
            />
            <FeatureCard
              icon={<Server className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />}
              title="Detailed Reports"
              description="Comprehensive reports and analytics to track your service performance."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
            Simple, transparent pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              title="Starter"
              price="29"
              features={[
                "10 monitors",
                "1-minute checks",
                "Email notifications",
                "5 team members",
                "24h data retention"
              ]}
              featured={false}
            />
            <PricingCard
              title="Professional"
              price="79"
              featured={true}
              features={[
                "50 monitors",
                "30-second checks",
                "All notification channels",
                "Unlimited team members",
                "30-day data retention",
                "API access"
              ]}
            />
            <PricingCard
              title="Enterprise"
              price="199"
              features={[
                "Unlimited monitors",
                "15-second checks",
                "Priority support",
                "Custom solutions",
                "90-day data retention",
                "SLA guarantee"
              ]}
              featured={true}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-indigo-400" />
                <span className="text-xl font-bold">UptimeGuard</span>
              </div>
              <p className="mt-4 text-gray-400">
                Keeping your services online, always.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2025 UptimeGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: {icon: React.ReactNode, title: string, description: string}) {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}

function PricingCard({ title, price, features, featured = false }: { title: string, price: string, features: string[] , featured: boolean}) {
  return (
    <div className={`p-8 rounded-lg ${
      featured
        ? 'bg-indigo-600 text-white ring-4 ring-indigo-300 dark:ring-indigo-500'
        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
    }`}>
      <h3 className="text-xl font-semibold mb-4">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-sm">/month</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        className={`w-full py-3 rounded-lg transition ${
          featured
            ? 'bg-white text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-200'
            : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
        }`}
      >
        Get Started
      </button>
    </div>
  );
}

export default App;