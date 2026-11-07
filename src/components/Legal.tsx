import { useEffect, type ReactNode } from 'react';
import { Logo } from './ui';

// Fill these in before going live (see replica/deploy.md).
export const CONTACT_EMAIL = '[your contact email]';
export const OPERATOR = '[your name or company]';
export const UPDATED = '2026-11-07';

function Page({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => { document.title = `${title} — Paperhand`; window.scrollTo(0, 0); }, [title]);
  return (
    <div className="about">
      <header className="home-top">
        <a href="#/" className="home-brand" aria-label="Paperhand home"><Logo /></a>
        <nav className="home-nav" aria-label="Main"><a href="#/">Home</a><a href="#/about">About</a></nav>
        <a className="btn btn-primary btn-md" href="#/">Start a design</a>
      </header>
      <main className="legal">
        <h1>{title}</h1>
        <p className="legal-meta">Last updated {UPDATED}</p>
        {children}
      </main>
      <LegalFooter />
    </div>
  );
}

export function LegalFooter() {
  return (
    <footer className="home-foot">
      <span>Paperhand runs entirely in your browser. No account, no tracking, no generative AI.</span>
      <nav aria-label="Legal" className="foot-links"><a href="#/about">About</a><a href="#/privacy">Privacy</a><a href="#/terms">Terms</a></nav>
    </footer>
  );
}

export function Privacy() {
  return (
    <Page title="Privacy">
      <p className="legal-lede">Short version: Paperhand has no accounts, no analytics and no ads. Your designs and photos stay in your browser on your device. We can’t see them.</p>
      <h2>What stays on your device</h2>
      <p>Your designs, the photos you upload and your settings are stored in your browser’s own storage (IndexedDB) on the device you use. They are not sent to us or anyone else. If you clear this site’s data in your browser, or uninstall the browser, they are deleted. Use <em>Back up everything</em> on the home screen to keep a copy.</p>
      <h2>What we don’t collect</h2>
      <p>No account, name or email. No analytics or tracking scripts. No advertising. No cookies.</p>
      <h2>Who else is involved</h2>
      <ul>
        <li><strong>Our web host</strong> serves the app’s files. Like every web server it receives your IP address and browser details with each request and keeps routine request logs for a limited time for security and to count visits. We don’t add anything to those logs.</li>
        <li><strong>Hugging Face</strong>, only if you use an AI method of the background remover. Your browser downloads the cut-out model from Hugging Face’s public hub the first time (your IP address and browser details are visible to them, as with any download). Your photo is not sent: the model runs on your device. The “plain backgrounds” method downloads nothing.</li>
        <li><strong>Stripe</strong>, only if you choose to pay as a supporter. Stripe processes the payment and receives the details you enter on its checkout page, including the email for your receipt. We receive a record of the payment, not your card details.</li>
        <li><strong>GitHub</strong>, only if you report a problem through our GitHub issues page, under GitHub’s own terms.</li>
      </ul>
      <h2>Your rights</h2>
      <p>Since we don’t hold your designs or an account for you, there is nothing for us to export or delete: you control it all from the home screen (<em>Back up everything</em>, <em>Delete everything</em>). For supporter payments, contact us to see or delete the payment record, subject to tax-record rules.</p>
      <h2>Children</h2>
      <p>Paperhand doesn’t collect personal information from anyone, including children.</p>
      <h2>Changes and contact</h2>
      <p>If this policy changes, we’ll update the date above. Questions: {CONTACT_EMAIL}. Paperhand is operated by {OPERATOR}.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms">
      <p className="legal-lede">Paperhand is free to use. What you make is yours. Here are the few rules that come with that.</p>
      <h2>Your work</h2>
      <p>You own what you create in Paperhand, including the photos you upload. We don’t claim any rights to it, and we never see it.</p>
      <h2>Templates, illustrations and fonts</h2>
      <p>You may use Paperhand’s templates, illustrations, shapes and generated images in your designs, including for commercial work. You may not resell or redistribute them on their own, as a template pack or asset library. Fonts are licensed under the SIL Open Font License; icons in the app are from Lucide (ISC licence).</p>
      <h2>Your responsibility</h2>
      <p>Only upload photos you have the right to use, and don’t use Paperhand to make anything unlawful. Your designs are stored only in your browser, so keep backups of anything that matters.</p>
      <h2>Supporter payments</h2>
      <p>Supporting Paperhand is voluntary and one-time. It doesn’t unlock features and never renews. Ask within 30 days for a full refund, no questions asked.</p>
      <h2>No warranty</h2>
      <p>Paperhand is provided as is, without warranties of any kind. To the extent the law allows, we aren’t liable for lost designs or other losses from using it. Nothing here limits rights you have under consumer law where you live.</p>
      <h2>Changes and contact</h2>
      <p>We may update these terms; the date above will change when we do. Questions: {CONTACT_EMAIL}. Paperhand is operated by {OPERATOR}.</p>
    </Page>
  );
}
