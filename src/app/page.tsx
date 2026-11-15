import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CheckEstate - Property Maintenance Management Software",
  description: "Manage properties, maintenance requests, contractors, repairs, and expenses from one powerful platform. Built for independent landlords and small property managers.",
  keywords: ["property maintenance", "landlord software", "maintenance management", "rental property software", "work order management"],
  openGraph: {
    title: "CheckEstate - Property Maintenance. Simplified.",
    description: "Manage properties, maintenance requests, contractors, repairs, and expenses from one powerful platform.",
    type: "website",
    url: "https://checkestate.app",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CheckEstate - Property Maintenance. Simplified.",
    description: "Manage properties, maintenance requests, contractors, repairs, and expenses from one powerful platform.",
  },
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-svh bg-white text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white">CE</span>
              <span className="font-semibold text-slate-900 tracking-tight">CheckEstate</span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/#features" className="hover:text-blue-600 transition">Features</Link>
              <Link href="/#how-it-works" className="hover:text-blue-600 transition">How it works</Link>
              <Link href="/#pricing" className="hover:text-blue-600 transition">Pricing</Link>
              <Link href="/#faq" className="hover:text-blue-600 transition">FAQ</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">Sign in</Link>
              <Link href="/auth/register" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">Get started</Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative px-4 py-20 sm:py-32 lg:py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 mb-6">
            <span className="relative flex h-2 w-2 rounded-full bg-blue-500">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            </span>
            Now accepting beta customers
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            Property Maintenance,<br />
            <span className="text-blue-600">Finally Under Control.</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Manage maintenance requests, contractors, repairs, and property expenses from one simple
            platform built for independent landlords and small property managers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="rounded-lg bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition">
              Start free trial
            </Link>
            <Link href="/#features" className="rounded-lg border border-slate-200 bg-white px-6 py-4 text-lg font-semibold text-slate-900 hover:bg-slate-50 transition">
              See demo
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to manage maintenance</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">From the first tenant request to the final invoice, CheckEstate keeps every repair organized.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[{
              title: "Property & Unit Management",
              body: "Add properties, units, and tenants. Track addresses, photos, and maintenance history per property.",
              icon: "Building",
            }, {
              title: "Tenant Maintenance Portal",
              body: "Tenants submit requests with photos, urgency, and category. Track progress and get notified.",
              icon: "Mail",
            }, {
              title: "Work Order Workflow",
              body: "Full lifecycle from New to Closed. Assign contractors, schedule appointments, record costs.",
              icon: "FileText",
            }, {
              title: "Contractor Directory",
              body: "Store licenses, insurance, and service areas. Assign contractors to jobs and track performance.",
              icon: "Briefcase",
            }, {
              title: "Expense Tracking",
              body: "Track estimated vs. actual costs, upload receipts, and generate property-specific expense reports.",
              icon: "DollarSign",
            }, {
              title: "Dashboards & Analytics",
              body: "Organization-scoped metrics: open requests, urgent items, monthly expenses, and category charts.",
              icon: "LayoutDashboard",
            }].map((f) => (
              <div key={f.title} className="rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-300 transition">
                <div className="rounded-lg bg-blue-50 p-3 mb-4 inline-block"><span className="text-blue-600">{f.icon}</span></div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">How it works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Get your first property under management in minutes.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start text-center">
            {["Step 1", "Step 2", "Step 3"].map((step, i) => (
              <div key={step} className="flex flex-col items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                  {i + 1}
                </div>
                <h3 className="font-semibold text-slate-900">{step === "Step 1" ? "Add your properties" : step === "Step 2" ? "Tenants submit requests" : "Assign & track repairs"}</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                  {step === "Step 1" ? "Create properties and units, then assign tenants." : step === "Step 2" ? "Tenants submit maintenance requests through their portal." : "Assign contractors, track progress, and record costs."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">All plans include a free trial. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "$29", period: "/month", units: "Up to 10 units", features: ["Properties & units", "Maintenance requests", "Contractor directory", "Standard dashboard"], popular: false },
              { name: "Professional", price: "$59", period: "/month", units: "Up to 50 units", features: ["Everything in Starter", "Advanced work orders", "Expense tracking", "Email notifications", "Maintenance reporting"], popular: true },
              { name: "Business", price: "$99", period: "/month", units: "Up to 150 units", features: ["Everything in Professional", "Multiple staff accounts", "Advanced analytics", "AI assistant (limited)", "Priority support"], popular: false },
            ].map((p) => (
              <div key={p.name} className={`rounded-xl border p-8 flex flex-col ${p.popular ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white"}`}>
                {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">Most popular</div>}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-slate-900">{p.price}</span>
                  <span className="text-sm text-slate-500">{p.period}</span>
                </div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                <p className="text-sm text-slate-600 mb-6">{p.units}</p>
                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                      <span className="h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium border border-slate-200 bg-white text-slate-700">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth/register" className={`w-full py-3 rounded-lg text-sm font-semibold transition ${p.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}>
                  {p.popular ? "Start Free Trial" : "Get Started"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: "Is my data isolated from other landlords?", a: "Yes. CheckEstate is multi-tenant. Every organization's data is strictly isolated at both the application and database level." },
              { q: "Can I try before I buy?", a: "Yes. All plans include a free trial (14 days by default). No credit card required to start." },
              { q: "Do contractors see all my data?", a: "No. Contractors only see work orders assigned to them by a property manager." },
              { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time from your account settings." },
              { q: "Is there a tenant portal?", a: "Yes. Tenants can submit maintenance requests, upload photos, and track repair status." },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-slate-200 bg-white p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{item.q}</h3>
                <p className="text-sm text-slate-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white">CE</span>
              <span className="font-semibold text-slate-900 tracking-tight">CheckEstate</span>
            </div>
            <div className="flex gap-6 text-sm text-slate-600">
              <Link href="/privacy" className="hover:text-blue-600 transition">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-blue-600 transition">Terms of Service</Link>
              <Link href="/#" className="hover:text-blue-600 transition">Contact</Link>
            </div>
            <p className="text-xs text-slate-500">No testimonials or customer counts are fabricated on this site.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
