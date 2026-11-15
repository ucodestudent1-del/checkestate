export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        CheckEstate ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains
        how we collect, use, and share your information when you use our property maintenance management platform.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">1. Information We Collect</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        We collect account information (name, email, phone), property and unit details, maintenance requests,
        work orders, contractor information, and payment data necessary to provide the service.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">2. How We Use Your Information</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        We use your information to operate and improve the platform, process maintenance requests, manage
        payments, and send notifications related to your account.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">3. Data Isolation</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Each organization's data is isolated. We do not share your organization's data with other organizations
        or unrelated third parties, except as needed to process payments (Stripe) or deliver email (our email provider).
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">4. Your Rights</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        You may access, update, or delete your personal data by contacting us or through your account settings.
      </p>
      <h2 className="text-lg font-semibold text-slate-900 mb-3 mt-6">5. Contact</h2>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Questions about this policy? Contact us at privacy@checkestate.app.
      </p>
    </div>
  );
}
