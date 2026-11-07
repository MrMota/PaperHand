import { useEffect } from 'react';
import { Check, Hand, Lock, ShieldCheck, Wand2, LayoutTemplate, Download, MousePointerClick, Type } from 'lucide-react';
import { Logo } from './ui';
import { TEMPLATES } from '../content/templates';
import { LegalFooter } from './Legal';

const FAQ: [string, string][] = [
  ['Is it really free?', 'Yes. Every template, element, font and export is free, with no watermark and no trial. If Paperhand is useful to you, you can chip in once as a supporter. Supporters get a thank-you, not extra features.'],
  ['Where are my designs kept?', 'In this browser, on this device, in its built-in storage. There is no account and no server holding your work. Clearing your browser’s site data deletes your designs too, so download anything you want to keep as PNG or PDF.'],
  ['Do you use generative AI?', 'No. Templates, illustrations and photos are made by people or drawn in code, and Paperhand never generates content for you. The one machine-learning tool is the background remover: you choose when to run it, it only edits your photo, and it runs on your device.'],
  ['Is my photo uploaded when I remove a background?', 'No. The first time you use an AI cut-out, your browser downloads the model (25–110 MB) from Hugging Face and keeps it. The photo itself never leaves your device. For plain backgrounds there is an instant method that needs no download at all.'],
  ['Can I use what I make commercially?', 'Yes. The templates, illustrations and generated photos are original to Paperhand, and the fonts are open-licensed (SIL Open Font License).'],
  ['Can I import designs from other tools?', 'Not yet. You can drop in images, SVGs and PNGs from anywhere, and download PNG, JPG, PDF or SVG.'],
  ['Does it work on a phone?', 'Yes, in any modern mobile browser. It is easiest on a tablet or computer.'],
  ['Does it work offline?', 'Not yet as an installed app. It is on the list.'],
];

export function About() {
  useEffect(() => { document.title = 'Paperhand — make something by hand'; window.scrollTo(0, 0); }, []);
  return (
    <div className="about">
      <header className="home-top">
        <a href="#/" className="home-brand" aria-label="Paperhand home"><Logo /></a>
        <nav className="home-nav" aria-label="Main">
          <a href="#/">Home</a>
          <a href="#/templates">Templates</a>
          <a href="#/about" aria-current="page">About</a>
        </nav>
        <a className="btn btn-primary btn-md" href="#/">Start a design</a>
      </header>

      <main>
        <section className="ab-hero" aria-labelledby="ab-h">
          <h1 id="ab-h">A design studio that leaves the making to you.</h1>
          <p className="ab-lede">Posters, posts, slides and cards from your own photos and type. No generative AI, no account, nothing locked behind a paywall.</p>
          <a className="btn btn-primary btn-lg" href="#/">Start a design</a>
          <p className="ab-note">Runs in your browser. Nothing to install.</p>
          <img className="ab-shot" src="./screens/editor.jpg" width="1440" height="900" alt="The Paperhand editor with a quote template open, the template panel on the left and the page in the middle." />
        </section>

        <section className="ab-sec" aria-labelledby="prob-h">
          <h2 id="prob-h">Design tools stopped feeling like yours</h2>
          <div className="ab-two">
            <div className="ab-card">
              <h3>Machine-made filler everywhere</h3>
              <p>Search for a graphic and wade through generated images. Open a design and an assistant sits on top of it. Many people just want to make the thing themselves.</p>
            </div>
            <div className="ab-card">
              <h3>A lock on everything, and a bill you forgot</h3>
              <p>The template you liked needs an upgrade. The trial quietly turns into a renewal. You end up paying to stay where you were.</p>
            </div>
          </div>
        </section>

        <section className="ab-sec" aria-labelledby="how-h">
          <h2 id="how-h">How it works</h2>
          <ol className="ab-steps">
            <li><LayoutTemplate size={22} aria-hidden /><h3>Pick a size or a template</h3><p>{TEMPLATES.length} templates for posts, stories, slides, posters, cards and more, or a blank page at any size.</p></li>
            <li><MousePointerClick size={22} aria-hidden /><h3>Make it yours</h3><p>Click anything to change it. Drop in your photos, set your type, add shapes and drawings.</p></li>
            <li><Download size={22} aria-hidden /><h3>Download</h3><p>PNG, JPG, multi-page PDF or SVG, with a transparent background if you want one.</p></li>
          </ol>
        </section>

        <section className="ab-sec" aria-labelledby="feat-h">
          <h2 id="feat-h">What makes it different</h2>
          <ul className="ab-feats">
            <li><Hand size={22} aria-hidden /><div><h3>No generative AI</h3><p>Every template and illustration is made by hand. Paperhand never fills your page with machine-made content.</p></div></li>
            <li><Lock size={22} aria-hidden /><div><h3>Nothing locked</h3><p>No crowns, no watermarks, no trials, no renewals. Everything you see, you can use.</p></div></li>
            <li><ShieldCheck size={22} aria-hidden /><div><h3>No account, no tracking</h3><p>Open it and start. Your designs and uploads stay in your browser on your device.</p></div></li>
            <li><Wand2 size={22} aria-hidden /><div><h3>Background removal on your device</h3><p>Cut a subject out of your photo with one click. It runs on your device and only when you ask.</p></div></li>
          </ul>
          <p className="ab-also"><strong>And the basics:</strong> multi-page designs, 100+ elements, 18 fonts, text effects, photo filters and crop, frames, drawing, layers, snapping, undo, keyboard shortcuts, autosave.</p>
        </section>

        <section className="ab-sec" aria-labelledby="price-h">
          <h2 id="price-h">Pricing</h2>
          <div className="ab-two">
            <div className="ab-card ab-price">
              <h3>Everyone</h3>
              <p className="ab-amount">$0</p>
              <ul>
                {['Every template, element and font', 'Every export format, no watermark', 'Background removal', 'No account, no time limit'].map((t) => <li key={t}><Check size={16} aria-hidden /> {t}</li>)}
              </ul>
              <a className="btn btn-primary btn-md btn-block" href="#/">Start a design</a>
            </div>
            <div className="ab-card ab-price">
              <h3>Supporter</h3>
              <p className="ab-amount">$15 <span>once, or pay what you like</span></p>
              <ul>
                {['Everything in Everyone: the same app', 'Pays for new templates and illustrations', 'One payment, nothing renews', 'Refund within 30 days, no questions'].map((t) => <li key={t}><Check size={16} aria-hidden /> {t}</li>)}
              </ul>
              <p className="ab-small">Coming soon. Supporting never unlocks features, because nothing is locked.</p>
            </div>
          </div>
        </section>

        <section className="ab-sec" aria-labelledby="faq-h">
          <h2 id="faq-h">Questions</h2>
          <div className="ab-faq">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>

        <section className="ab-final" aria-labelledby="final-h">
          <Type size={28} aria-hidden />
          <h2 id="final-h">Make something by hand.</h2>
          <a className="btn btn-primary btn-lg" href="#/">Start a design</a>
        </section>
      </main>

      <LegalFooter />
    </div>
  );
}
