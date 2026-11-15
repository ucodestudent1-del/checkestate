export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Terms of Service</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        These Terms of Service govern your use of CheckEstate, a property maintenance management platform
        ("Service"). By accessing or using the Service, you agree to these terms.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">1. Eligibility</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        You must be at least 18 years old to create an account. Accounts are created per organization.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">2. Subscriptions</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        The Service is offered by subscription. Plans, pricing, and unit limits are described on our pricing page.
        We may change pricing with notice. Payments are processed by Stripe.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">3. Acceptable Use</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        You may not use the Service for unlawful purposes, attempt to access another organization's data,
        or reverse-engineer the platform.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">4. Data Responsibility</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        You are responsible for the accuracy of property, tenant, contractor, and maintenance data you enter.
        We are not a substitute for professional legal, accounting, or emergency services.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">5. Termination</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        We may suspend or terminate accounts that violate these terms. You may cancel your subscription at any time.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">6. Disclaimer</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        The Service is provided "as is" without warranties. For emergencies, contact qualified professionals or
        emergency services directly.
      </p>
    </div>
  );
}
