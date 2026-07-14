import { Link } from "react-router-dom";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <Link to="/" className="text-primary text-sm">← Back to SpoolmeterX</Link>
      </div>

      <h1 className="text-2xl font-bold font-heading mb-2">Account Deletion Request</h1>
      <p className="text-muted-foreground text-sm mb-8">SpoolmeterX by MM3D</p>

      <section className="space-y-6 text-sm text-foreground leading-relaxed">
        <div>
          <h2 className="font-semibold text-base mb-2">How to Delete Your Account</h2>
          <p className="text-muted-foreground mb-3">
            You can delete your account directly within the SpoolmeterX app at any time:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Open the SpoolmeterX app and sign in.</li>
            <li>Tap the <strong className="text-foreground">Settings</strong> tab (bottom navigation).</li>
            <li>Scroll to the <strong className="text-foreground">Account Actions</strong> section.</li>
            <li>Tap <strong className="text-foreground">Delete Account</strong>.</li>
            <li>Confirm the deletion in the dialog that appears.</li>
          </ol>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">What Gets Deleted</h2>
          <p className="text-muted-foreground mb-2">When you delete your account, the following data is permanently removed:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Your account credentials and profile (email, name)</li>
            <li>All filament spool records and inventory data</li>
            <li>All usage logs and print job history</li>
            <li>Your saved barcode library</li>
            <li>Any Quick Job macros you created</li>
            <li>Your subscription record</li>
            <li>Any feedback you submitted</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Data Retention</h2>
          <p className="text-muted-foreground">
            All data is deleted immediately upon account deletion. No personal data is retained after deletion. 
            Anonymized, non-identifiable aggregate usage statistics (if any) may be retained for platform improvement purposes.
          </p>
        </div>

        <div>
          <h2 className="font-semibold text-base mb-2">Need Help?</h2>
          <p className="text-muted-foreground">
            If you are unable to access the app to delete your account, you can contact us to request manual deletion.
            Please email us with your registered email address and we will process the deletion within 30 days.
          </p>
        </div>
      </section>

      <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground">
        <p>SpoolmeterX · MM3D · <Link to="/privacy" className="text-primary">Privacy Policy</Link></p>
      </div>
    </div>
  );
}