export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground font-heading mb-2">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">
        <section>
          <h2 className="font-semibold text-base mb-2">1. Information We Collect</h2>
          <p>SpoolmeterX collects information you provide directly, including your email address upon registration, filament spool data you enter, barcode mappings, and usage logs. We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">2. How We Use Your Information</h2>
          <p>Your information is used solely to provide and improve the SpoolmeterX service — including inventory tracking, authentication, subscription management, and optional email alerts you configure.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">3. Data Storage</h2>
          <p>Your data is stored securely on the Base44 platform. We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time from within the app.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">4. Payments</h2>
          <p>Payment processing is handled by Base44 Payments. We do not store your credit card or payment details. Subscription billing is managed through our payment provider.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">5. Cookies & Local Storage</h2>
          <p>SpoolmeterX uses browser local storage to save your preferences (such as threshold settings). No third-party tracking cookies are used.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">6. Google Sign-In</h2>
          <p>SpoolmeterX offers Google Sign-In as an authentication option. When you use Google Sign-In, we request access only to your basic profile information (your name and email address) for the sole purpose of creating and identifying your account. We do not access your Google Drive, Gmail, Google Calendar, or any other Google services or data. Your Google account information is never shared with third parties or used for advertising purposes. You may revoke SpoolmeterX's access to your Google account at any time via your <a href="https://myaccount.google.com/permissions" className="underline underline-offset-2 text-primary" target="_blank" rel="noopener noreferrer">Google Account settings</a>.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">7. Third-Party Services</h2>
          <p>We may use third-party analytics or infrastructure services. These services are bound by their own privacy policies and are only used to maintain and improve app reliability.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">8. Children's Privacy</h2>
          <p>SpoolmeterX is not directed at children under 13. We do not knowingly collect personal information from children.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2 className="font-semibold text-base mb-2">10. Contact</h2>
          <p>For privacy-related questions, please contact MM3D through the feedback form within the app.</p>
        </section>
      </div>

      <p className="text-xs text-muted-foreground mt-10 pb-8">© 2026 MM3D / SpoolmeterX. All rights reserved.</p>
    </div>
  );
}