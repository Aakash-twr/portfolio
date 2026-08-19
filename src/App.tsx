import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SkipLink } from '@/components/layout/SkipLink';
import { Hero } from '@/sections/Hero';
import { About } from '@/sections/About';
import { Experience } from '@/sections/Experience';
import { Spatial } from '@/sections/Spatial';
import { Impact } from '@/sections/Impact';
import { Projects } from '@/sections/Projects';
import { Stack } from '@/sections/Stack';
import { Approach } from '@/sections/Approach';
import { Contact } from '@/sections/Contact';

/**
 * Composition root.
 *
 * Deliberately thin: it wires the landmarks and the section order, and holds no
 * state. Every section owns its own — there is no global store here, because
 * nothing on this page is shared across more than one subtree. Adding Redux to a
 * static portfolio would be a worse signal than leaving it out.
 *
 * There is no animation library either. Every transition on this site is a CSS
 * transition or keyframe triggered by an IntersectionObserver, which measured
 * ~30kB gzipped lighter than the equivalent Motion setup with no visible
 * difference. On a site whose subject is bundle discipline, that was not a close
 * call. See README → "Design and engineering decisions".
 */
export default function App() {
  return (
    <>
      <SkipLink />
      <Header />
      <main id="main">
        <Hero />
        <About />
        <Experience />
        <Spatial />
        <Impact />
        <Projects />
        <Stack />
        <Approach />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
