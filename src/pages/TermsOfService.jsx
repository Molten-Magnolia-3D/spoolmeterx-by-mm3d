import { Link } from "react-router-dom";
import useSafeBack from "@/hooks/useSafeBack";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  const goBack = useSafeBack("/");
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={goBack} className="p-2 -ml-2 rounded-full active:bg-muted">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="font-semibold text-foreground">Terms of Service</span>
      </div>

      <div className="px-4 py-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground font-heading mb-1">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mb-8">Last updated: July 13, 2026</p>

        <div className="space-y-6 text-sm text-foreground/90 leading-relaxed">

          <section>
            <h2 className="font-semibold text-base mb-2">1. Acceptance of Terms</h2>
            <p>By using SpoolmeterX ("the App"), you agree to these Terms of Service. If you do not agree, please do not use the App. SpoolmeterX is operated by MM3D.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">2. Use of the App</h2>
            <p>SpoolmeterX is a filament inventory tracking tool for personal and business 3D printing use. You agree to use the App only for lawful purposes and in accordance with these Terms.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">3. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use through the in-app feedback form.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">4. Subscriptions & Billing</h2>
            <p>Certain features require a paid subscription. Subscriptions are billed on a recurring basis (monthly or as specified at checkout) and may be canceled at any time. You will retain access until the end of the current billing period. We reserve the right to change pricing with reasonable notice.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">5. Refund & Cancellation Policy</h2>
            <p className="mb-2">We want you to be satisfied with SpoolmeterX. Our refund policy is as follows:</p>
            <ul className="list-disc list-inside space-y-1 text-foreground/80">
              <li><strong>Cancellations:</strong> You may cancel your subscription at any time from within the app or by contacting us. Your access continues through the end of the paid period.</li>
              <li><strong>Refunds:</strong> Subscription fees are generally non-refundable for partial billing periods. However, if you experience a significant technical issue that prevents you from using the service, please contact us within 7 days of the charge and we will review your case.</li>
              <li><strong>Lifetime plans:</strong> All sales of lifetime access plans are final and non-refundable.</li>
              <li><strong>Promo / trial codes:</strong> No charges are associated with trial or promo codes. There is nothing to refund.</li>
            </ul>
            <p className="mt-2">To request a refund review, please use the in-app feedback form and include your account email and the reason for the request.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">6. Promo Codes</h2>
            <p>Promo and trial codes are for one-time use per account unless otherwise stated. Codes may not be transferred, sold, or combined with other offers. We reserve the right to revoke codes used fraudulently.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">7. User Data</h2>
            <p>You retain ownership of the data you enter into SpoolmeterX. By using the App, you grant us a limited license to store and process that data solely to provide the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">8. Prohibited Conduct</h2>
            <p>You may not: reverse engineer the App, attempt to gain unauthorized access, use the App to distribute malware, or violate any applicable law or regulation.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">9. Accessibility</h2>
            <p>We are committed to making SpoolmeterX accessible. If you encounter accessibility barriers, please report them through the in-app feedback form and we will make reasonable efforts to address them.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">10. Disclaimer of Warranties</h2>
            <p>SpoolmeterX is provided "as is" without warranty of any kind. We do not guarantee uninterrupted or error-free operation and are not liable for any loss of data.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">11. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, MM3D shall not be liable for any indirect, incidental, or consequential damages arising from your use of SpoolmeterX.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">12. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will update the "Last updated" date above. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">13. Contact</h2>
            <p>For questions about these Terms, cancellation requests, or refund reviews, please use the feedback form within the App.</p>
          </section>

        </div>

        <p className="text-xs text-muted-foreground mt-10 pb-8">© 2026 MM3D / SpoolmeterX. All rights reserved.</p>
      </div>
    </div>
  );
}