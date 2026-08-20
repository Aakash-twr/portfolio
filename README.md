# Akash Tiwary — Portfolio

A personal portfolio for **Akash Tiwary**, Full Stack Developer at Seven Robotics.

Built as a plain React single-page application with Vite — no Next.js, no meta-framework,
no animation library, no charting library. Every architecture diagram is hand-authored SVG
or canvas; the one 3D scene is React Three Fiber, isolated behind a gated lazy boundary so
it never touches the initial load.

**Live:** _add your deployed URL here_

---

## Quick start

```bash
npm install     # install dependencies
npm run dev     # start the dev server (http://localhost:5173)
npm run build   # typecheck + production build into dist/
npm run preview # serve the production build locally
npm run typecheck
```

Requires **Node.js 20.19+ or 22.12+** (Vite 8). Developed on Node 22.

The 3D section needs WebGL. It degrades to its poster-and-button state rather than breaking
if a browser or environment cannot provide it.

---

## Make it yours

Almost everything you need to change lives in **two files**.

### 1. Links, email, identity → [`src/config/site.ts`](src/config/site.ts)

```ts
export const GITHUB_URL   = 'https://github.com/Aakash-twr';  // set
export const LINKEDIN_URL = 'YOUR_LINKEDIN_URL';              // ← replace
export const LEETCODE_URL = 'YOUR_LEETCODE_URL';              // ← replace
export const EMAIL        = 'tiwaryakash0308@gmail.com';      // set
export const RESUME_URL   = '/resume.pdf';                    // ← replace the file
```

Any link still holding its `YOUR_…` placeholder is detected by `isPlaceholder()` and
rendered as a **visibly disabled, non-navigating element** with a tooltip telling you
which file to edit. The site never advertises a destination it cannot reach — so it is
safe to deploy before you have every URL, and nothing silently 404s.

The same file also holds the name, role, company, tenure, years of experience,
copyright year, canonical `domain`, and the section registry that drives the header,
the scroll-spy indicator and the ⌘K menu from one list.

### 2. Résumé → `public/resume.pdf`

`public/resume.pdf` currently contains a **one-page placeholder** that says so in plain
text. Overwrite it with your real résumé, keeping the filename, and every download
button picks it up. To use a different filename or an external link, change
`RESUME_URL` instead.

### Other content

| What | Where |
|---|---|
| Work experience, grouped by discipline | [`src/data/experience.ts`](src/data/experience.ts) |
| 3D viewer fleet + warehouse layout | [`src/data/fleet.ts`](src/data/fleet.ts) |
| Project case studies, repo + demo URLs | [`src/data/projects.ts`](src/data/projects.ts) |
| Engineering metrics | [`src/data/metrics.ts`](src/data/metrics.ts) |
| Technology ecosystem + usage notes | [`src/data/skills.ts`](src/data/skills.ts) |
| Engineering principles + pull quote | [`src/data/principles.ts`](src/data/principles.ts) |
| Colours, type scale, animation tokens | [`src/styles/index.css`](src/styles/index.css) |
| Title, meta description, Open Graph, JSON-LD | [`index.html`](index.html) |

**Project repo links** in `src/data/projects.ts` all point at real repositories
(`ai-researcher`, `prep-ai`, `blogging-app`, `social_backend`). `demoUrl` is `null` on all
four, which hides the "Live demo" button entirely — set a URL on any of them to make it
appear.

**Project screenshots:** there are none, by design. Three projects are represented by
interactive architecture diagrams, which say more about the engineering than a screenshot
of a form would; the fourth is a backend repository and gets a patterns panel instead
(`diagram: null` plus a `patterns` array). If you want to add real screenshots, drop them
in `public/` and render them in the diagram slot of `src/sections/Projects.tsx`.

**Before deploying**, update these to your real domain:
`site.domain` in `src/config/site.ts`, the `canonical`/`og:url`/`og:image` tags and
JSON-LD `url` in `index.html`, `public/sitemap.xml`, and `public/robots.txt`.

To regenerate the social-share image, edit the source SVG referenced in
"Generated assets" below, or replace `public/og-image.png` (1200×630) directly.

---

## Deployment

The build output is a fully static `dist/` — no server runtime, no environment variables.

**Vercel / Netlify / Cloudflare Pages**

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm install` |

`public/_redirects` already contains the SPA fallback rule for Netlify and Cloudflare
Pages. Vercel needs no configuration for a single-route app.

**GitHub Pages**

```bash
npm run build
# then publish dist/ (e.g. via gh-pages, or an Actions workflow)
```

If you serve from a sub-path such as `user.github.io/portfolio/`, set
`base: '/portfolio/'` in `vite.config.ts` first.

**Any static host:** upload the contents of `dist/`. Serve `index.html` for unknown
paths, and let hashed assets in `dist/assets/` be cached immutably.

---

## Architecture

```
portfolio/
├── index.html                    # shell: SEO, Open Graph, JSON-LD, fonts, theme bootstrap
├── public/                       # copied verbatim: resume, favicon, OG image, robots, sitemap
└── src/
    ├── main.tsx                  # entry
    ├── App.tsx                   # composition root — landmarks + section order, no state
    ├── config/site.ts            # single source of truth for links & section registry
    ├── data/                     # content, typed and separated from presentation
    │   ├── experience.ts  projects.ts  metrics.ts  skills.ts
    │   ├── principles.ts  fleet.ts
    ├── sections/                 # one file per page section
    │   ├── Hero  About  Experience  Spatial  Impact
    │   └── Projects  Stack  Approach  Contact
    ├── components/
    │   ├── layout/               # Header, Footer, CommandMenu, ScrollProgress, SkipLink
    │   ├── ui/                   # Button, Section, SectionHeading, Reveal,
    │   │                         # AnimatedCounter, TechBadge, ThemeToggle,
    │   │                         # SocialLinks, BrandIcons
    │   └── viz/                  # FleetField (canvas), FleetViewer3D (R3F),
    │                             # AgentPipelineDiagram, InterviewLoopDiagram,
    │                             # BlogSystemDiagram, SystemTopology, DiagramFrame
    ├── hooks/                    # useActiveSection, useInViewOnce, useMediaQuery,
    │                             # useScrollLock, useTheme, useVisibility
    ├── styles/index.css          # design tokens, base layer, composite utilities
    └── utils/cn.ts
```

**Content is separated from presentation.** Sections import typed data from `src/data/`
and render it; no copy is hard-coded inside a component. That is what makes the "make it
yours" table above a two-file job rather than a find-and-replace across the tree.

**There is no `pages/` directory and no router.** This is one route. Adding
`react-router` to serve a single page would be dead weight — `sections/` fills the role
that `pages/` would in a multi-route app. Navigation is native fragment anchors, which
means it works before JS loads and is shareable.

**There is no global state.** No Redux, no Zustand, no Context. Nothing on this page is
shared across more than one subtree: the theme lives on `<html data-theme>` (so a single
attribute retints every colour utility with no React render below the hook), tab
selection is local to its section, and the ⌘K menu owns its own open state. Redux is on
the résumé because it runs the fleet console at work — adding it *here* would signal the
opposite of judgement.

### Rendering and performance work

- **Route-level lazy loading.** Every heavy component is a `React.lazy` boundary: the
  hero canvas, all three project diagrams, and the 3D fleet viewer. The diagrams sit far
  below the fold; the hero canvas is additionally gated behind `min-width: 768px`, so
  phones never download it at all.
- **The 3D viewer is gated twice.** three.js + React Three Fiber is ~240kB gzipped — more
  than the entire rest of the site. It loads automatically only on desktop, once the
  section is actually reached, and only when the browser has not asked for reduced data;
  otherwise it waits for a tap on an explicit "Launch 3D viewer" button. Verified: on a
  390px viewport the chunk is not requested until that button is pressed.
- **The 3D render loop is released, not hidden.** Scrolling past the section sets
  `frameloop="never"`, so the GPU stops rather than drawing frames nobody can see. DPR is
  capped at 1.5 and then dropped to 1 automatically on sustained frame decline — shedding
  resolution is far less noticeable than shedding frames.
- **No React renders per animation frame.** The hero canvas drives one `rAF` loop that
  mutates the canvas directly. The scroll-progress bar coalesces scroll events into a
  single `rAF` and writes a `transform: scaleX()` — a 1px bar is not worth a render pass
  on the critical path of scrolling.
- **Frame throttling.** The canvas targets ~30fps through a time accumulator, caps DPR at
  2, and clamps its delta so a backgrounded tab does not fast-forward the simulation on
  return.
- **Loops are torn down, not just paused.** `useVisibility` combines an
  `IntersectionObserver` with `visibilitychange`, so the canvas loop stops entirely when
  the hero scrolls away or the tab is hidden. An idle background `rAF` loop is the most
  common way a "lightweight" portfolio quietly drains a battery.
- **Observers disconnect after firing.** `useInViewOnce` unsubscribes on the first
  crossing; reveals and counters can never change again, so keeping the observer alive
  would be paying for a result that cannot change.
- **Scroll-spy uses one observer, not a scroll listener** — no layout reads during scroll.
- **Diagrams pan instead of shrinking.** A fixed-viewBox SVG scaled into a 350px column
  renders its labels at 4–6px. `DiagramFrame` sets a min-width floor and scrolls
  horizontally below it, so no diagram label drops under ~8px at any breakpoint. The
  frame's `min-w-0` is load-bearing: without it that min-width propagates up as a
  min-content floor and gives the whole page a horizontal scrollbar.

### Accessibility

- Semantic landmarks: `<header>`, `<main>`, `<footer>`, and `<section aria-labelledby>`
  per block, so the screen-reader rotor can jump between chapters.
- Skip link as the first tab stop.
- Both tablists (experience domains, case-study chapters) implement the real ARIA
  pattern: roving `tabindex`, arrow keys, `Home`/`End`, `aria-selected`, `aria-controls`.
- The ⌘K menu is a proper modal dialog: focus moves in on open and is restored to the
  trigger on close, `Tab` is trapped, `Escape` dismisses, options are a `listbox` driven
  by `aria-activedescendant`, and body scroll is locked with scrollbar-width compensation
  so the page behind never shifts.
- The tech ecosystem responds to **hover, focus and tap** — a hover-only tooltip would be
  unreachable by keyboard and unusable on touch.
- `AnimatedCounter` hides the animating digits from assistive tech and exposes the settled
  value once, so a screen reader announces "40%" rather than every intermediate number.
- Every diagram carries a prose `aria-label` describing the architecture it draws.
- `prefers-reduced-motion` is honoured globally in CSS *and* per-component: the canvas
  renders a single static frame and starts no loop, reveals render as plain markup with
  no observer, the hero entrance is not applied, and the pipeline diagram renders
  complete instead of animating.
- All text colour pairs clear WCAG AA (4.5:1) against **every** surface they are used on,
  in both themes — verified numerically, not by eye.
- The 3D viewer is not the only way to read the fleet: the telemetry rail beside it is
  rendered from plain data and works whether or not the scene ever loads, with selection
  synchronised in both directions.
- Scrollable diagram frames are focusable and labelled as regions **only while actually
  overflowing**, so they never add an empty tab stop on wide screens.
- Interaction hints are phrased for the pointer in use — "pinch to zoom" on touch, "scroll
  to zoom" with a mouse.

### SEO

Descriptive `<title>` and meta description, Open Graph and Twitter card metadata with a
1200×630 image, canonical URL, `Person` JSON-LD, `robots.txt`, `sitemap.xml`, one `<h1>`,
and a `<noscript>` block carrying the core facts and contact route for crawlers that do
not execute JS.

---

## Dependencies, and why each one is here

Five runtime dependencies. Each had to justify its bytes.

| Package | Why |
|---|---|
| `react`, `react-dom` | The application. React 19. |
| `lucide-react` | Icons as tree-shaken React components — only the ~25 imported icons ship, and each is a small inline SVG. No icon font, no sprite sheet, no network request. |
| `clsx` | ~500 bytes for conditional class joining. Deliberately **not** `tailwind-merge`: nothing here overrides utilities across component boundaries, so the extra ~4kB would buy nothing. |
| `three` + `@react-three/fiber` | The 3D fleet viewer. Easily the heaviest thing here (~246kB gzipped), which is why it is behind a doubly-gated lazy boundary and never touches the initial load. It earns its place because 3D warehouse visualisation is real production work, and a live scene demonstrates that in a way a bullet point cannot. Everything else the scene needs — orbit controls, the postprocessing chain — ships inside `three` itself. |

Build-time only: `vite`, `@vitejs/plugin-react`, `typescript`, `tailwindcss` +
`@tailwindcss/vite`, and the `@types/*` packages.

### What was deliberately left out

- **Next.js.** The brief asked for plain React, and the requirement agrees with it: one
  route, no SSR, no server runtime, no data fetching. Vite produces a static `dist/` that
  any CDN serves.
- **`@react-three/drei`.** Installed, used for `OrbitControls` and `PerformanceMonitor`,
  then removed after measuring: it tree-shakes so well that dropping it changed the 3D
  chunk by **under 1kB gzipped**. So this was *not* a size decision — the bundle was
  indifferent. It went because those two helpers are short to write directly (three ships
  `OrbitControls` in its own examples, and adaptive DPR is ~20 lines against `useFrame`),
  and a dependency that earns nothing measurable is a dependency to remove. Being honest
  about which way the measurement actually went matters more than the tidier story.
- **An animation library** (`motion` / `framer-motion`). This one was *built and then
  removed*. The first version used `LazyMotion` with the `domAnimation` feature set; it
  measured **~28kB gzipped** of the shipped JS. Everything it was doing — scroll reveals,
  a staggered hero entrance, tab-panel crossfades, a sheet transition — is a CSS
  transition or keyframe triggered by an `IntersectionObserver`. On a site whose subject
  is bundle discipline, paying 28kB for fades was not a close call. What was genuinely
  lost: exit animations on tab switches, which added latency between the click and the
  new content, and a shared-layout nav indicator, replaced by one absolutely-positioned
  element whose `left`/`width` are measured from the active link and transitioned in CSS.
- **Three.js in the hero.** three.js *is* used, but in one gated section — not as hero
  decoration. Shipping a 3D runtime in the initial bundle to animate a background would
  contradict the performance claims the page makes three sections later. The hero is a
  hand-written 2D canvas, which is cheaper and a closer reference to the actual telemetry
  work; the 3D viewer sits in its own section where a visitor opts into the cost.
- **A charting library.** The metric bars and cost meters are `<div>`s and SVG paths.
- **A command-palette library** (`cmdk`). The whole value of the ⌘K menu here is the focus
  trap, focus restoration and `aria-activedescendant` wiring — which is the part worth
  writing, not importing.
- **A carousel, a cursor-follower, a scroll-hijacking library, a particle field.**

### Bundle size

```
initial (non-lazy)        338 KB raw  / 100 KB gzip
  ├─ index.js             293 KB      /  92 KB   React 19 + app + icons
  └─ index.css             45 KB      /   9 KB
lazy, below the fold       24 KB raw  /  10 KB gzip
  ├─ AgentPipelineDiagram, InterviewLoopDiagram, BlogSystemDiagram
  └─ FleetField (canvas; desktop only — never downloaded on mobile)
lazy, gated              932 KB raw  / 246 KB gzip
  └─ FleetViewer3D (three.js + R3F; desktop-on-view, or an explicit tap)
```

The 3D chunk is three times the size of everything else combined, which is exactly why it
is isolated. `chunkSizeWarningLimit` is raised past it in `vite.config.ts` with a comment
explaining why — the initial bundle is what is actually being guarded, and the default
500kB warning would flag the 3D chunk on every build as though it were an accident.

three.js cannot be meaningfully tree-shaken here: React Three Fiber imports the library
wholesale to build its JSX element catalogue. That is a known and accepted cost of R3F, and
the reason gating matters more than trimming.

---

## Design and engineering decisions

### Visual identity

**Dark-first, near-black, one accent.** The base is `#07080a` with three lifted surface
steps, and a single electric cyan (`#00d3f2`) reserved for state, focus and emphasis. A
light theme exists as a real second palette — not an inversion — because some people need
it, and shipping an inaccessible theme is worse than shipping none.

Colour is handled as **semantic tokens** (`--raw-bg`, `--raw-fg-muted`, `--raw-line`, …)
mapped into Tailwind with `@theme inline`, so utilities emit `var(--raw-token)` directly
and one attribute swap on `<html>` retints the entire page. There are no `dark:` variants
anywhere in the markup — that duplication is what makes most two-theme sites drift.

Three colours (`--raw-viz-a/b/c`) exist **only inside diagrams**, where distinguishing
concurrent flows is a semantic requirement rather than decoration. Cyan is the only
accent in the UI itself.

**Typography.** Inter Tight for everything structural — a tighter grotesk than default
Inter, which reads as designed rather than as defaulted. JetBrains Mono for labels,
metrics and diagram text, which suits an engineering subject and separates data from
prose. Instrument Serif italic appears **exactly once**, on the pull quote in *Approach* —
the one editorial moment, and the thing that stops the page reading like every other
dark-mode dev portfolio. The display scale is a single `clamp()` ramp, so headlines are
fluid from 375px to 1440px with no per-breakpoint overrides.

### Structure

The section order follows the progression a reviewer actually moves through:
**who → where they've done it → proof they can build the hard thing → what it measured →
what they built → what they know → how they work → how to reach them.**

Two placements are deliberate. The 3D viewer sits immediately after *Experience*, because
Experience claims "3D map visualisations with Three.js" and the next thing a sceptical
reader wants is evidence — so it is a live artefact of the section above it, not a
standalone toy. And metrics sit *before* the projects, so the numbers are already in the
reader's head as context when they reach the case studies.

The hero answers the 20-second question in one screen: name, role, company, a specific
one-line positioning, a four-item facts row (focus / experience / current role / stack),
and both primary CTAs above the fold.

### The visualisations

These are the parts that do work a screenshot could not. Each uses a deliberately
different visual language, so they read as separate ideas rather than one template reused
four times.

1. **Hero — fleet telemetry field** (canvas). Agents traversing a warehouse lattice,
   emitting packets that route back to a hub. It is a deliberate reference to the work it
   sits above, and it is built under the constraints that work imposed: throttled frames,
   capped DPR, a loop that tears down when off-screen. The visual is the claim.
2. **Experience — system topology** (SVG). The production system drawn *once*, with
   selecting an engineering domain dimming everything that domain does not touch. Five
   disciplines become one system with five views, rather than five disconnected lists —
   which is the actual point about full-stack work.
3. **3D fleet viewer** (React Three Fiber). A rebuilt, simplified warehouse with four
   autonomous units on live routes; selecting one — in the scene or the rail — surfaces its
   telemetry. A shader-patched procedural floor, instanced racks and pallets, HDR bloom on
   the status beacons, and hand-projected DOM labels: see **Inside the 3D viewer** below.
   Clearly labelled as a demonstration with synthetic data, because the production system
   and its data belong to Seven Robotics.
4. **Projects — architecture walkthroughs** (SVG). The LangGraph pipeline *plays*, stepping
   through its stages so the reader sees the fan-out/fan-in rather than reading the word
   "parallel". Prep AI is drawn as vertical **swimlanes**, because the interesting property
   there is not the order of the steps but which tier each one runs on — what stays on the
   device, what the framework guards, what reaches the model. The blogging platform
   **toggles** between the cache-hit and cache-miss read path with a relative cost bar,
   which is the only honest way to show what "~70% faster" means: the same request, two
   different amounts of work.

Note the three distinct interaction idioms — *play* (pipeline), *filter* (topology, Prep AI
lanes), *compare* (cache hit/miss). Each matches what its diagram is actually about.

The fourth project, a backend repository, deliberately gets **no diagram** — its substance
is in its patterns, and three boxes in a row would have been padding.

All of them are keyboard-operable, carry prose `aria-label`s describing the architecture,
and render complete-and-static under reduced motion.

### Inside the 3D viewer

The scene is the one place on this site where the interesting work is graphics work,
so it is worth saying what it does rather than leaving it as "a Three.js demo".

- **The floor grid is GLSL injected into `MeshStandardMaterial`** through
  `onBeforeCompile`, not a `gridHelper` and not a standalone `ShaderMaterial`. Screen-space
  derivatives (`fwidth`) hold every line at ~1px whether its cell fills the viewport or is
  vanishing toward the horizon — which line geometry cannot do; it aliases into moiré at
  grazing angles.

  This was built the wrong way first, and the wrong way is instructive: the initial version
  *was* a standalone `ShaderMaterial`, which meant reimplementing lighting, shadow sampling
  and fog by hand. It didn't, so the floor rendered flat and the robots appeared to hover
  with no contact shadows. Patching the standard material keeps three's entire lighting
  pipeline and replaces only the albedo. `customProgramCacheKey` is set so three does not
  hand back an unpatched program for another material with the same feature set.
- **Racks and pallets are two `InstancedMesh` draw calls**, with per-instance matrices and
  per-instance colours, rather than ~50 separate meshes. The pallet layout is derived from
  the rack layout through a deterministic hash — never `Math.random()`, so the warehouse is
  identical on every load and across both themes.
- **Bloom is real HDR postprocessing.** An `EffectComposer` renders into a **half-float**
  target so emissive values above 1.0 survive into the bloom pass instead of being clipped,
  with `samples: 4` for MSAA (which the canvas `antialias` option cannot provide once
  drawing goes through a render target) and an `OutputPass` applying tone mapping at the very
  end of the chain — the only correct place for it. The beacons are `toneMapped={false}` at
  `emissiveIntensity: 5` specifically so they are what the bloom threshold catches.

  Bloom is **off in the light theme**. On a light ground there is nothing dark for a glow to
  read against, so it only lifts the black point and washes the image out. The correct amount
  of bloom there is none.
- **Taking over the render loop.** A `useFrame` at priority 1 disables R3F's automatic
  render, so the composer becomes the only thing putting pixels on screen — including in the
  no-bloom branch, which falls through to a plain `gl.render`.
- **The telemetry labels are DOM, projected by hand.** World positions are projected to
  screen space every frame and written straight to `style.transform`. Text stays crisp at any
  zoom (no texture atlas), and no React state is touched while they track. The projection runs
  at priority 1 so it happens *after* every unit has moved that frame.
- **Motion is damped, not snapped.** Headings ease toward the next waypoint and the chassis
  banks into the turn, frame-rate independently via `MathUtils.damp`. The difference between
  a box teleporting round a corner and a vehicle taking it.
- **Every timestep is clamped, and the scene keeps its own clock.** Both are fixes for real
  defects rather than precautions:

  React Three Fiber computes the frame delta as `timestamp - clock.elapsedTime` while
  `frameloop` is `"never"`, but `timestamp` is a requestAnimationFrame value in
  *milliseconds* and `elapsedTime` is in *seconds*. Any `invalidate()` landing while the
  section is scrolled away — a re-render from selection or quality state is enough — hands
  the loop a delta of tens of thousands of seconds. OrbitControls scales its auto-rotation
  by that value, so scrolling quickly past the section made the camera fling round. Clamping
  every delta to 1/30s fixed it: measured as a **865px → 4px** reduction in the largest
  single-frame movement of the projected labels across six scroll-away-and-return cycles.

  Separately, R3F calls `clock.stop()`/`clock.start()` on every frameloop change, and
  `Clock.start()` resets `elapsedTime` to zero — so units driven from absolute clock time
  teleported back to their starting offsets each time the section left the viewport. The
  scene now advances its own monotonic clock from clamped deltas instead.
- **Input never waits on an animation.** The opening camera move is abandoned the moment the
  viewer grabs the scene, via OrbitControls' `start` event. It used to hold
  `controls.enabled = false` until it finished — and since clamping makes "finished" a matter
  of frames rather than wall time, a device rendering at 3fps left the scene completely
  uninteractive for about seventeen seconds.
- **Wheel zoom is armed by a click, not always on.** OrbitControls calls `preventDefault()`
  on wheel events it handles, so leaving zoom permanently enabled stops the *page* from
  scrolling whenever the cursor happens to be over the viewer — a scroll trap in the middle
  of a page someone is trying to read. Zoom now arms on pointer-down inside the scene and
  disarms when the pointer leaves. Touch is exempt: a pinch needs two fingers, so it can
  never be mistaken for a one-finger page scroll, and gating it would break the first pinch.
- **Quality degrades in stages**: bloom first, then resolution, with a cooldown so it cannot
  oscillate. Frames are the last thing to give up, because dropped frames are far more
  noticeable than either. The sampling window is bounded by **time, not frame count** — a
  50-frame window sounds equivalent, but on a device already rendering at 3fps it would take
  seventeen seconds to decide anything, which is precisely when relief is most urgent.
- **There is a live renderer readout** beside the scene: frames/s, draw calls, triangles,
  pixel ratio, quality tier and whether effects are active. It is the only way to *show*
  rather than assert that the scene is cheap, and it makes the staged degradation visible
  as it happens. Two details make the numbers real rather than decorative: `info.autoReset`
  is disabled (three resets its counters on every `render()`, and the composer issues several
  per frame — left on, the panel would only ever report the last bloom pass), and the sampler
  runs at priority 2 so it reads *after* the composer has drawn. Counters are snapshotted and
  reset every frame; only the display is throttled to 4Hz. Values are written straight into
  DOM nodes, so a per-frame readout costs no React renders.

  Building it caught two bugs worth naming. The pixel-ratio row originally read R3F's
  `viewport.dpr`, which disagreed with the renderer's actual pixel ratio — a readout that
  contradicts reality is worse than none, so it now samples `gl.getPixelRatio()` directly.
  And the panel is what exposed the frame-count sampling window above: under software
  rendering it sat at 3fps with the quality tier still reading `high`, which is how the
  window turned out to need ~17s to fire. With both fixed, the same environment degrades to
  `low` within a second and recovers from 3fps to ~38.
- **The opening move** eases from a wide establishing shot to the working camera and then
  hands over to the controls entirely — skipped under reduced motion, which also parks the
  units and disables auto-orbit.

The scene reads its entire palette from the same CSS custom properties as the rest of the
page (via a dedicated `--raw-scene-*` group, because a lit 3D scene needs a wider value range
than a flat interface), so it retints with the theme rather than hard-coding hexes.

### Truthfulness

Every number, technology and claim traces to real work. There are no invented metrics, no
fabricated testimonials, no fake client logos, no "10+ years" inflation, and no
technologies listed that were not actually used.

The 3D viewer is labelled, in the section itself and not only here, as a rebuilt
demonstration with synthetic layout and telemetry. It refers to the class of interface
built at Seven Robotics; it is not that product, and none of its data is real. Every
project write-up was checked against the actual repository — dependencies, schema and
control flow — rather than written from memory, which is why the Prep AI case study can
name `clerkMiddleware`, the two-call model flow and the on-device transcription
specifically. One entry in that project's Results is a *known limitation with the fix named*
(moving model calls behind route handlers), because a case study that admits nothing reads
as marketing. Where a URL is unknown it stays a
labelled placeholder rather than a plausible-looking guess. Three years of experience is
presented as three years of experience — the positioning comes from the *substance* of the
work (real-time systems, production infrastructure), not from padding its duration.

---

## Design research

Patterns surveyed before building — current product and engineering sites (Linear, Vercel,
Stripe, Raycast), award galleries, and recent developer portfolios — plus primary docs for
every technical decision (Tailwind v4 `@theme`, Motion for React, WCAG 2.2 contrast,
MDN on `IntersectionObserver`, `content-visibility` and `prefers-reduced-motion`).

**Adopted, because it earns its place for this profile:**

- **Restrained palette, one accent, tokenised.** The current product-site consensus, and
  it is right: colour used for meaning reads as engineering, colour used for decoration
  reads as a template.
- **Monospace as an information type.** Labels, metrics and diagram text in mono creates a
  second typographic voice at zero cost, and the technical register is honest here.
- **Case studies over project cards.** Problem → architecture → decisions → results is how
  engineers actually evaluate engineers. A grid of rectangles with a tech-stack row tells
  a reviewer nothing they could not guess.
- **Interactive diagrams over screenshots.** Verified against a real constraint: neither
  project has a screenshot that would communicate its architecture.
- **⌘K command palette.** Signature Linear/Raycast interaction, and genuinely useful — a
  recruiter can reach the résumé in two keystrokes. Justified mainly because building it
  properly *demonstrates* accessibility work rather than claiming it.
- **Scroll reveals — once, subtle, short.** 14px and 600ms, never re-triggered on
  scroll-back.
- **Mobile designed, not shrunk.** The nav becomes a full-height sheet with large tap
  targets and the primary action at thumb height; the hero canvas is not rendered at all;
  the 3D viewer waits for a tap; diagram lanes stack and diagrams pan rather than shrink
  into illegibility.
- **Opt-in cost for the expensive thing.** The pattern of gating a heavy embed behind a
  poster and a click is borrowed from how video embeds are handled well, and applied to a
  3D scene. It lets the site show ambitious work without charging every visitor for it.

**Rejected, deliberately:**

- **Scroll-hijacking and pinned horizontal sections.** Impressive in a gallery, hostile to
  someone scanning for a résumé link in 30 seconds.
- **Custom cursors and magnetic buttons.** Cost real bytes and per-frame work to make a
  professional site feel like a demo reel. The brief listed them as options; they did not
  survive the "does this help a recruiter?" test.
- **Glassmorphism and floating gradient blobs.** Dated, and they fight text contrast. The
  only backdrop-blur on the page is the header at scroll, where it serves legibility.
- **Full-viewport 3D hero.** A spinning abstract mesh behind the headline is the single
  most common way a developer portfolio spends a megabyte saying nothing. The 3D here is a
  *subject*, in its own section, tied to real work — not a backdrop.
- **A preloader.** Nothing here is heavy enough to justify making someone wait, and a
  loading screen in front of a static page is theatre.
- **Fake social proof** — testimonials, client logos, "trusted by" rows, invented metrics.
  Non-negotiable, and a recruiter spots it instantly.
- **Animated counters everywhere.** Kept for the five real metrics, where the count-up
  draws the eye to numbers worth reading; used nowhere else.
- **Light-mode-first.** Dark suits the subject matter and the diagrams, which read better
  as luminous marks on a dark ground.

---

## Verification

Driven against the production build in headless Chrome (software WebGL via SwiftShader for
the 3D scene), at 1440 / 1280 / 1024 / 768 / 390 / 375 px in both themes:

- `npm run build` succeeds with no warnings; `tsc` is clean under `strict`,
  `noUnusedLocals`, `noUnusedParameters` and `noUncheckedSideEffectImports`.
- **Zero console errors and zero failed requests** at every breakpoint, in both themes,
  with every lazy chunk mounted and the 3D scene running through a full
  scroll-away-and-back cycle.
- Two console **warnings** exist once the 3D section initialises, and neither originates in
  this codebase:
  - `THREE.Clock: This module has been deprecated` — emitted by
    **`@react-three/fiber`'s own internals** (its event module constructs a `Clock`) against
    three r185. Not reachable from application code; it will go away when R3F updates.
  - `GPU stall due to ReadPixels` — a **SwiftShader** driver performance hint, seen only in
    the software-rendered test environment and only while bloom is active. It is a hint, not
    an error, and self-silences after two occurrences.

  Worth noting how these were found: an earlier version of the audit script bucketed console
  messages into hardcoded `error`/`warning` keys, but Puppeteer emits the type as `warn`.
  Every warning fell through into an unprinted bucket and the run reported a clean sweep.
  Bucketing by the raw type string surfaced them. A test that cannot fail is not a test.
- No horizontal overflow at any breakpoint.
- 24/24 automated interaction checks: ⌘K open/filter/arrow/Enter/Escape, focus movement
  and restoration, scroll lock and release, mobile sheet open/dismiss/Escape, skip link as
  first tab stop, tablist roving tabindex and arrow keys, and the reduced-motion render
  path.
- All eight anchor targets rest at exactly 96px, clearing the 64px header.
- Every text/surface colour pair clears WCAG AA in both themes.
- No SVG diagram label renders below ~8px effective size at any breakpoint — measured as
  declared font size × rendered/viewBox scale, per diagram, per width.
- The 3D scene mounts and draws (canvas has a live WebGL context, verified in both themes),
  the custom shader patch compiles with no GLSL errors, the four projected DOM labels track
  and reduce to one on narrow viewports, selection stays synchronised between scene and
  telemetry rail, and the 932kB chunk is confirmed **not requested** on a 390px viewport
  until the Launch button is pressed.
- 3D interaction is verified behaviourally, not by inspection: dragging orbits the camera
  (337px of view movement against 4px of idle auto-rotate drift over the same wall time),
  the wheel scrolls the page normally before the scene is clicked (800px, no trap), and
  zooms without scrolling the page after it is (191px of view movement, 0px of page scroll).
- No single frame moves the view more than ~4px across repeated fast scroll-away-and-return
  cycles — the regression test for the delta-clamp fix, which measured 865px before it.

The scripts behind these checks were throwaway, run outside the project so they add no
dependencies to it. They are described here because the claims should be reproducible, not
because the harness ships.

### Generated assets

`public/og-image.png`, `public/apple-touch-icon.png` and `public/favicon.svg` were
generated for this build; `public/resume.pdf` is a labelled placeholder. Replace the
résumé with the real one, and regenerate or replace the OG image if you change the
headline copy.

---

## Licence

Code is free to reuse. The content — copy, experience, project write-ups — belongs to
Akash Tiwary.
