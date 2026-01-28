// src/pages/LandingPage.jsx
// This is just your old App.jsx, copied and pasted.
import { Header } from '../components/Landing/Header';
import { Hero } from '../components/Landing/Hero';
import { LogoTicker } from '../components/Landing/LogoTicker';
import { Features } from '../components/Landing/Features';
import { Stats } from '../components/Landing/Stats';
import { Testimonials } from '../components/Landing/Testimonials';
import { CTA } from '../components/Landing/CTA';
import { Footer } from '../components/Landing/Footer';

function LandingPage() {
  return (
    <div className="dark antialiased bg-color-bg-dark text-color-text-primary" style={{ backgroundColor: 'var(--color-bg-dark)', color: 'var(--color-text-primary)' }}>
      <Header />

      <main className="w-full max-w-full overflow-x-hidden">
        <Hero />
        <LogoTicker />
        <Features />
        <Stats />
        <Testimonials />
        {/* <FAQ /> */}
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;