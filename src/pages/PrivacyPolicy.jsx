import { Link } from "react-router-dom";
import useSafeBack from "@/hooks/useSafeBack";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const goBack = useSafeBack("/");
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="font-semibold text-foreground">Privacy Policy</span>
      </div>

      <div className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground font-heading mb-1">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: July 13, 2026</p>

        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">

          <section>
            <h2 className="font-semibold text-base mb-2">1. Operator Identity & Contact</h2>
            <p>SpoolmeterX is operated by MM3D. For any privacy-related questions or requests, please use the in-app feedback form or contact us through the app. We will respond to verifiable privacy requests within 30 days.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">2. Information We Collect</h2>
            <p className="mb-2">We collect the following personal information:</p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li><strong>Account data:</strong> Email address and name upon registration or Google Sign-In.</li>
              <li><strong>Inventory data:</strong> Filament spool records, barcode mappings, usage logs, and Quick Job presets you create.</li>
              <li><strong>Preference data:</strong> Settings stored locally in your browser (thresholds, notification preferences).</li>
              <li><strong>Payment data:</strong> Subscription plan and status (payment details are handled by our payment processor and never stored by us).</li>
              <li><strong>Feedback:</strong> Messages you voluntarily submit through the feedback form.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">3. How We Use Your Information</h2>
            <p>Your information is used solely to:</p>
            <ul className="list-disc list-inside space-y-1 mt-1 text-foreground/80">
              <li>Create and manage your account and authenticate you.</li>
              <li>Provide the SpoolmeterX inventory tracking service.</li>
              <li>Process subscription payments and manage access levels.</li>
              <li>Send optional low-stock alert emails you configure.</li>
              <li>Improve the app based on feedback you submit.</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">4. Google Sign-In</h2>
            <p>SpoolmeterX offers Google Sign-In as an authentication option. When you use Google Sign-In, we request access only to your basic profile information (name and email address) for the sole purpose of creating and identifying your account. We do not access your Google Drive, Gmail, Google Calendar, or any other Google services. Your Google account information is never shared with third parties or used for advertising. You may revoke access at any time via your <a href="https://myaccount.google.com/permissions" className="underline underline-offset-2 text-primary" target="_blank" rel="noopener noreferrer">Google Account settings</a>.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">5. Cookies & Local Storage</h2>
            <p className="mb-2">SpoolmeterX uses the following storage technologies:</p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li><strong>Essential cookies:</strong> Required for authentication and session management. These cannot be disabled without breaking the app.</li>
              <li><strong>Local storage:</strong> Used to save your in-app preferences (thresholds, notification settings). No personal data is stored here.</li>
              <li><strong>Google AdSense:</strong> If you are on the free plan, Google AdSense may place advertising cookies on your device. These are non-essential cookies used for ad personalization. See Google's <a href="https://policies.google.com/privacy" className="underline underline-offset-2 text-primary" target="_blank" rel="noopener noreferrer">Privacy Policy</a> for details.</li>
            </ul>
            <p className="mt-2">By using the app, you consent to essential cookies. For non-essential advertising cookies (free plan only), you may opt out by upgrading to a paid plan (which removes ads) or by using your browser's cookie controls.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">6. Third-Party Services</h2>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li><strong>Base44 Platform:</strong> Hosts and stores app data securely.</li>
              <li><strong>Base44 Payments:</strong> Processes subscription payments. We do not store your payment card details.</li>
              <li><strong>Google AdSense:</strong> Displays ads for free-tier users. Google may use cookies for ad personalization.</li>
              <li><strong>Google OAuth:</strong> Provides optional Sign-In with Google functionality.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">7. Data Retention</h2>
            <p>We retain your account and inventory data for as long as your account is active. If you delete your account, all associated data is permanently removed within 30 days. Usage logs and feedback may be retained in anonymized form for service improvement.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">8. Do Not Sell or Share My Personal Information</h2>
            <p>We do not sell or share your personal information with third parties for cross-context behavioral advertising. California residents and others with applicable rights may submit a request through the in-app feedback form and we will acknowledge and fulfill it within the legally required timeframe.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">9. Your Privacy Rights</h2>
            <p>Depending on your location, you may have the right to access, correct, delete, or port your personal data, or to object to or restrict certain processing. To exercise any of these rights, please submit a request through the in-app feedback form. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">10. Children's Privacy</h2>
            <p>SpoolmeterX is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us through the feedback form and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">11. Accessibility</h2>
            <p>We are committed to making SpoolmeterX accessible. The app supports system font size scaling and is designed for use on mobile and desktop devices. If you experience accessibility barriers, please let us know through the in-app feedback form.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will update the "Last updated" date at the top. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
          </section>

        </div>

        <p className="text-xs text-muted-foreground mt-10 pb-8">© 2026 MM3D / SpoolmeterX. All rights reserved.</p>
      </div>
    </div>
  );
}