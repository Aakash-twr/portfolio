/**
 * Technology ecosystem. Each entry carries where it was actually used, so the
 * section answers "can you use this?" instead of listing logos.
 */

export type Skill = {
  name: string;
  /** One line: where and why it was used. Shown on hover/focus/tap. */
  note: string;
  /** Highlighted as a core, daily-driver technology. */
  core?: boolean;
};

export type SkillCategory = {
  id: string;
  label: string;
  /** Sets the accent used for the category marker. */
  tone: 'a' | 'b' | 'c';
  blurb: string;
  skills: readonly Skill[];
};

export const skillCategories: readonly SkillCategory[] = [
  {
    id: 'languages',
    label: 'Languages',
    tone: 'a',
    blurb: 'Typed by default on anything that will outlive the sprint.',
    skills: [
      { name: 'TypeScript', note: 'Primary language for the fleet SPA and its shared API types.', core: true },
      { name: 'JavaScript', note: 'Node services, tooling and everything that predates the TypeScript migration.', core: true },
      { name: 'Python', note: 'The multi-agent research pipeline — LangChain, LangGraph and the RAG layer.' },
      { name: 'SQL', note: 'Schema and query work against MySQL in the backend services.' },
    ],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    tone: 'a',
    blurb: 'Production single-page applications that update continuously — including in 3D.',
    skills: [
      { name: 'React.js', note: 'React 18 SPA operating robot fleets; the interface operators use all day.', core: true },
      { name: 'Redux Toolkit', note: 'Normalised entity state for robots, tasks and map data.', core: true },
      { name: 'RTK Query', note: 'Server-state caching with optimistic updates so operator actions feel instant.', core: true },
      { name: 'Three.js', note: 'Interactive 3D warehouse map visualisations for the fleet console.', core: true },
      { name: 'React Three Fiber', note: 'Declarative three.js in React — the fleet viewer in the 3D section above is built with it.', core: true },
      { name: 'Tailwind CSS', note: 'Token-driven styling — including this site.' },
      { name: 'Next.js', note: 'App Router, route groups and middleware — Prep AI runs on Next.js 15.' },
      { name: 'Radix UI', note: 'Unstyled accessible primitives underneath the Prep AI component layer.' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    tone: 'b',
    blurb: 'REST services with explicit layering and testable business rules.',
    skills: [
      { name: 'Node.js', note: 'Production API server for the fleet platform, deployed on EC2.', core: true },
      { name: 'Express.js', note: 'REST APIs layered as Controller → Service → Repository.', core: true },
      { name: 'GraphQL', note: 'Schema-first APIs where clients need to shape their own queries.' },
      { name: 'REST', note: 'The primary API style across the fleet platform and both social backends.' },
      { name: 'JWT', note: 'Bearer-token verification middleware applied per route in the social platform API.' },
    ],
  },
  {
    id: 'realtime',
    label: 'Real-Time',
    tone: 'c',
    blurb: 'Continuous data with no request/response to hide behind.',
    skills: [
      { name: 'Socket.IO', note: 'Robot task updates and event streams pushed to the operator console.', core: true },
      { name: 'WebSockets', note: 'Raw socket transport for high-frequency telemetry.', core: true },
      { name: 'WebRTC', note: 'Live robot camera feeds streamed to the browser.', core: true },
      { name: 'RabbitMQ', note: 'Event processing and asynchronous background jobs, off the request path.', core: true },
    ],
  },
  {
    id: 'data',
    label: 'Databases & Storage',
    tone: 'b',
    blurb: 'Chosen per access pattern, not per preference.',
    skills: [
      { name: 'MongoDB', note: 'Primary document store, running on a dedicated EC2 instance.', core: true },
      { name: 'MySQL', note: 'Relational persistence where the data is genuinely relational.' },
      { name: 'Redis', note: 'Caching high-frequency search reads — roughly 70% faster retrieval.', core: true },
      { name: 'AWS S3', note: 'Object storage for user-uploaded media, keeping blobs out of the database.' },
      { name: 'Firebase', note: 'Auth and media storage on the blogging platform.' },
      { name: 'Drizzle ORM', note: 'Typed schema and queries against Postgres, with drizzle-kit migrations.', core: true },
      { name: 'Neon Postgres', note: 'Serverless Postgres over HTTP — scales to zero between Prep AI sessions.' },
      { name: 'Cloudinary', note: 'Image transformation and delivery pipeline.' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud & Infrastructure',
    tone: 'c',
    blurb: 'Including the networking underneath, not only the app on top.',
    skills: [
      { name: 'AWS EC2', note: 'Production Node.js server and a separate MongoDB host.', core: true },
      { name: 'AWS VPC', note: 'Configured a VPC with two subnets, an Internet Gateway and route tables.' },
      { name: 'Docker', note: 'Containerised services so local and deployed environments match.', core: true },
      { name: 'docker-compose', note: 'Multi-service local orchestration for the full stack.' },
      { name: 'Git', note: 'Trunk-based workflow with reviewed pull requests.' },
    ],
  },
  {
    id: 'ai',
    label: 'AI Engineering',
    tone: 'b',
    blurb: 'Agent orchestration and retrieval, treated as systems work.',
    skills: [
      { name: 'LangGraph', note: 'Fan-out/fan-in orchestration for parallel research agents.', core: true },
      { name: 'LangChain', note: 'Agent and tool composition in the research pipeline.', core: true },
      { name: 'RAG', note: 'Hybrid retrieval combining live web search with a persistent vector store.', core: true },
      { name: 'ChromaDB', note: 'Vector store for ingested PDFs, URLs and text.' },
      { name: 'OpenAI Embeddings', note: 'Embedding model behind the knowledge-base index.' },
      { name: 'Gemini', note: 'Question generation and answer grading in Prep AI; synthesis in the research pipeline.', core: true },
      { name: 'Structured output', note: 'Prompting for JSON and parsing defensively, so model output is safe to persist.' },
    ],
  },
];
