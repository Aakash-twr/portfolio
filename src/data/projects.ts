/**
 * Case-study content for the projects section.
 *
 * Replace the `YOUR_*` repo/demo placeholders with real URLs. A `null` demo URL
 * simply hides the "Live demo" action — nothing is faked.
 */

export type CaseStudyChapter = {
  id: 'problem' | 'architecture' | 'decisions' | 'results';
  label: string;
  /** Paragraphs for prose chapters. */
  body?: readonly string[];
  /** Bullets for decision/result chapters. */
  points?: readonly { title: string; detail: string }[];
};

export type Project = {
  id: 'research-pipeline' | 'prep-ai' | 'blogging-app' | 'social-api';
  index: string;
  title: string;
  kind: string;
  year: string;
  /** One-line hook, shown before anything is expanded. */
  summary: string;
  /** Two-sentence framing under the title. */
  lede: string;
  stack: readonly string[];
  /**
   * Which visualisation renders in the diagram slot. `null` means the project is
   * presented compactly with a patterns panel instead — not every repository
   * earns a full diagram, and pretending otherwise pads the section.
   */
  diagram: 'agent-pipeline' | 'interview-loop' | 'blog-system' | null;
  /** Shown in place of a diagram when `diagram` is null. */
  patterns?: readonly { label: string; detail: string }[];
  repoUrl: string;
  demoUrl: string | null;
  chapters: readonly CaseStudyChapter[];
};

export const projects: readonly Project[] = [
  {
    id: 'research-pipeline',
    index: '01',
    title: 'Multi-Agent Research Pipeline',
    kind: 'Autonomous AI research agent',
    year: '2025',
    summary:
      'An autonomous research agent that decomposes a question, researches every sub-question in parallel, and returns a cited report.',
    lede: 'A LangGraph orchestration that splits one research question into sub-questions, then runs live web search and vector retrieval concurrently before fusing everything into a structured, cited report.',
    stack: [
      'Python',
      'LangChain',
      'LangGraph',
      'RAG',
      'Tavily',
      'ChromaDB',
      'OpenAI Embeddings',
      'Gemini 2.5 Flash',
      'Streamlit',
    ],
    diagram: 'agent-pipeline',
    repoUrl: 'https://github.com/Aakash-twr/ai-researcher',
    demoUrl: null,
    chapters: [
      {
        id: 'problem',
        label: 'Problem',
        body: [
          'A single LLM call answering a broad research question does two things badly at once: it has to decide what to look up, and it has to synthesise an answer. The result is shallow coverage and citations that cannot be traced.',
          'Retrieval alone does not fix it either. A private vector store knows nothing about this week, and live web search has no memory of the documents you already trust. Answering well needs both, and needs them without paying for two sequential round trips per sub-question.',
        ],
      },
      {
        id: 'architecture',
        label: 'Architecture',
        body: [
          'The graph decomposes the incoming query into independent sub-questions, then fans out: a Tavily-backed web-search agent and a ChromaDB retrieval agent run against every sub-question concurrently. LangGraph fan-out/fan-in handles the concurrency and the join, so the fusion step only runs once every branch has reported.',
          'Fusion deduplicates overlapping evidence, keeps provenance attached to each claim, and produces a structured report rather than free text — which is what makes the citations survive to the output.',
        ],
      },
      {
        id: 'decisions',
        label: 'Key decisions',
        points: [
          {
            title: 'Hybrid retrieval instead of choosing one',
            detail:
              'Live web search covers recency; a persistent Chroma vector store covers the corpus the user has curated. Running both and fusing beats picking a side.',
          },
          {
            title: 'Fan-out/fan-in over sequential agents',
            detail:
              'Sub-questions are independent, so LangGraph runs them in parallel. Wall-clock tracks the slowest branch instead of the sum of all branches.',
          },
          {
            title: 'Ingestion is part of the product',
            detail:
              'PDFs, URLs and raw text are chunked and embedded with OpenAI embeddings into a managed knowledge base, so the retrieval side improves with use.',
          },
          {
            title: 'Progress is streamed, not hidden',
            detail:
              'The Streamlit client renders live pipeline state per node. A multi-second agent run that shows no progress feels broken even when it is working.',
          },
        ],
      },
      {
        id: 'results',
        label: 'Results',
        points: [
          {
            title: 'Cited, structured reports',
            detail:
              'Output is a sectioned research report with sources attached, exportable as Markdown.',
          },
          {
            title: 'Concurrent research branches',
            detail:
              'Search and RAG agents execute in parallel per sub-question rather than one after another.',
          },
          {
            title: 'Managed knowledge base',
            detail:
              'Documents can be ingested, inspected and removed between runs without rebuilding the store.',
          },
        ],
      },
    ],
  },
  {
    id: 'prep-ai',
    index: '02',
    title: 'Prep AI',
    kind: 'AI mock-interview platform',
    year: '2025',
    summary:
      'Generates a role-specific interview, listens to your spoken answer in the browser, and grades it against a reference answer.',
    lede: 'A Next.js 15 application that turns a job description into an interview, transcribes the candidate\u2019s spoken answers on-device, then scores each one against the reference answer the model produced up front.',
    stack: [
      'Next.js 15',
      'React 19',
      'Clerk',
      'Gemini 2.0 Flash',
      'Neon Postgres',
      'Drizzle ORM',
      'Radix UI',
      'Tailwind CSS',
      'Web Speech API',
    ],
    diagram: 'interview-loop',
    repoUrl: 'https://github.com/Aakash-twr/prep-ai',
    demoUrl: null,
    chapters: [
      {
        id: 'problem',
        label: 'Problem',
        body: [
          'You can rehearse for an interview alone, but you cannot grade yourself. The two things that actually make practice work \u2014 questions matched to the specific role, and honest feedback on the answer you just gave \u2014 are exactly the two things a question bank cannot provide.',
          'The interesting constraint is that the answer is spoken, not typed. Handling that badly means uploading audio, storing it, paying to transcribe it, and adding seconds of latency to every attempt.',
        ],
      },
      {
        id: 'architecture',
        label: 'Architecture',
        body: [
          'The candidate describes the role, and one model call returns the question set as JSON with a reference answer attached to every question. That pairing is the design decision the rest of the system rests on: grading later is a comparison against something concrete rather than an open-ended judgement.',
          'The set is persisted to Neon Postgres through Drizzle against a generated mock id, so a session is a durable record rather than component state. Per question, the browser previews the webcam and transcribes speech locally; only the resulting text is sent back, together with the stored reference, for a rating and a few lines of specific improvement notes. Each evaluation is written as its own row, which is what lets the report be revisited later.',
        ],
      },
      {
        id: 'decisions',
        label: 'Key decisions',
        points: [
          {
            title: 'Reference answers generated up front',
            detail:
              'Asking for question and answer together in the first call means the grading step compares against a fixed target instead of re-deriving what "good" means every time.',
          },
          {
            title: 'Transcription on the device, not the server',
            detail:
              'Speech-to-text runs in the browser, so no audio is uploaded, stored or paid for. It removes a storage bill, a privacy problem and a round trip at once.',
          },
          {
            title: 'Serverless Postgres over a managed instance',
            detail:
              'Usage is spiky and bursty. Neon over HTTP scales to zero and needs no connection pool, so there is no idle database sitting between sessions.',
          },
          {
            title: 'Auth bought, not built',
            detail:
              'Clerk middleware guards every dashboard route through one matcher. Session handling never leaks into page code, and I did not write another password reset flow.',
          },
          {
            title: 'Structured output, parsed defensively',
            detail:
              'The model is asked for JSON and the response is stripped of fences before parsing. Prose output would have made both the question set and the rating unusable downstream.',
          },
        ],
      },
      {
        id: 'results',
        label: 'Results',
        points: [
          {
            title: 'Complete practice loop',
            detail:
              'Role brief to generated interview to spoken answer to scored feedback, with no step requiring a human on the other side.',
          },
          {
            title: 'Sessions are durable',
            detail:
              'Interviews and evaluations persist per user, so the dashboard accumulates a history instead of resetting.',
          },
          {
            title: 'No audio ever leaves the browser',
            detail: 'Only transcribed text is transmitted \u2014 a privacy property, and a cost one.',
          },
          {
            title: 'Next: model calls behind route handlers',
            detail:
              'The clearest thing I would change. Moving the Gemini calls server-side keeps the key off the client and puts rate limiting somewhere I control.',
          },
        ],
      },
    ],
  },
  {
    id: 'blogging-app',
    index: '03',
    title: 'Blogging Platform',
    kind: 'Full-stack social publishing product',
    year: '2024',
    summary:
      'A social publishing platform with a cached read path and queue-backed notifications — built as a product, not a CRUD demo.',
    lede: 'Authentication, image uploads, a following graph, likes and comments across 1000+ user interactions. The interesting part is the read path: Redis in front of the hottest queries and RabbitMQ behind the write path.',
    stack: [
      'React.js',
      'Node.js',
      'Express.js',
      'Redis',
      'RabbitMQ',
      'Firebase',
      'AWS S3',
      'Multer',
      'bcrypt',
    ],
    diagram: 'blog-system',
    repoUrl: 'https://github.com/Aakash-twr/blogging-app',
    demoUrl: null,
    chapters: [
      {
        id: 'problem',
        label: 'Problem',
        body: [
          'Search and feed reads concentrate hard: a small set of posts absorbs most of the traffic, and every one of those reads was hitting the database with the same query. Meanwhile notification fan-out was happening inline, so the user who pressed "like" paid for everyone else being notified.',
          'Both problems are about the same thing — work sitting on the request path that does not belong there.',
        ],
      },
      {
        id: 'architecture',
        label: 'Architecture',
        body: [
          'A Redis layer sits in front of the top 100 searched posts. A cache hit answers from memory; a miss falls through to the database, populates the cache and returns. Repeat retrieval got roughly 70% faster.',
          'Writes publish to RabbitMQ and return immediately. A separate consumer handles push notifications, so fan-out latency never lands on the user who triggered it. Media is handled by Multer on upload and stored in AWS S3 and Firebase, keeping binaries out of the application database.',
        ],
      },
      {
        id: 'decisions',
        label: 'Key decisions',
        points: [
          {
            title: 'Cache the hot set, not everything',
            detail:
              'Bounding the cache to the top 100 searched posts captures most of the benefit while keeping memory predictable and invalidation tractable.',
          },
          {
            title: 'Notifications belong off the request path',
            detail:
              'RabbitMQ decouples the interaction from its side effects. A slow notification consumer degrades notifications, not the API.',
          },
          {
            title: 'Blobs in object storage, references in the database',
            detail:
              'Multer handles multipart intake; AWS S3 and Firebase hold the media. The database stores URLs, so row size and backups stay small.',
          },
          {
            title: 'Password hashing, not password storage',
            detail: 'bcrypt with per-user salts for authentication credentials.',
          },
        ],
      },
      {
        id: 'results',
        label: 'Results',
        points: [
          {
            title: '~70% faster retrieval',
            detail: 'On cached search reads, versus going to the database every time.',
          },
          {
            title: '1000+ user interactions',
            detail: 'Follows, likes and comments handled across the live platform.',
          },
          {
            title: 'Asynchronous notifications',
            detail: 'Push notification fan-out fully removed from the synchronous write path.',
          },
        ],
      },
    ],
  },
  {
    id: 'social-api',
    index: '04',
    title: 'Social Platform API',
    kind: 'Containerised REST service',
    year: '2025',
    summary:
      'A social backend built to get work off the request path: presigned uploads, an invalidated cache, and a queue with its own consumer.',
    lede: 'Express service behind a routes \u2192 controllers \u2192 services split, with Mongo for state, Redis in front of reads, and RabbitMQ carrying notifications to a separate worker process. Containerised with compose so the whole topology comes up together.',
    stack: [
      'Node.js',
      'Express',
      'MongoDB',
      'Mongoose',
      'Redis',
      'RabbitMQ',
      'AWS S3',
      'JWT',
      'bcrypt',
      'Docker',
    ],
    diagram: null,
    patterns: [
      {
        label: 'Presigned direct-to-S3 uploads',
        detail:
          'The API signs a time-limited PUT URL and the client uploads straight to the bucket. Image bytes never transit the Node process, so upload size stops being an API concern entirely.',
      },
      {
        label: 'Cache-aside with explicit invalidation',
        detail:
          'Reads check Redis first and populate it on a miss with a short TTL. Every mutation deletes the key rather than waiting the TTL out, so a new post is never hidden behind a stale cache.',
      },
      {
        label: 'Durable queue, separate consumer',
        detail:
          'Likes and follows publish persistent messages to a durable queue and return immediately. A standalone worker consumes and acknowledges them, so notification work cannot slow an interaction or be lost on restart.',
      },
      {
        label: 'Layered, per-concern modules',
        detail:
          'routes, controllers, services, schemas and config are separate directories, with connection setup isolated from business logic — the same structure I use in production.',
      },
      {
        label: 'Compose-defined topology',
        detail:
          'Docker Compose brings up the API, MongoDB and Redis on a shared bridge network with named volumes, so the environment is described in the repository rather than in someone\u2019s notes.',
      },
    ],
    repoUrl: 'https://github.com/Aakash-twr/social_backend',
    demoUrl: null,
    chapters: [
      {
        id: 'problem',
        label: 'Problem',
        body: [
          'This is the backend I wrote after the blogging platform, to fix the three things that had bothered me about it. Image uploads went through the application process. Cached reads could serve stale data after a write. And notification fan-out, though queued, had no consumer of its own.',
          'All three are the same class of problem: work sitting on the request path, or state that can drift from the truth.',
        ],
      },
      {
        id: 'architecture',
        label: 'Architecture',
        body: [
          'Express routes delegate to controllers, which delegate to services; Mongoose schemas and connection config live apart from both. JWT bearer verification is one middleware, applied per route rather than globally, so public reads stay public.',
          'Reads hit Redis first and fall through to Mongo on a miss, populating the key with a short expiry. Writes delete the key outright. Uploads never touch the API: it returns a signed S3 PUT URL and the browser sends the bytes directly. Likes and follows publish persistent messages onto a durable queue, and a separate worker process consumes and acknowledges them.',
        ],
      },
      {
        id: 'decisions',
        label: 'Key decisions',
        points: [
          {
            title: 'Sign the upload, do not proxy it',
            detail:
              'A presigned PUT means the API never buffers a file. Throughput stops depending on image size and the process holds no large buffers.',
          },
          {
            title: 'Invalidate on write, not on expiry',
            detail:
              'A TTL alone means a window where the cache lies. Deleting the key in the same handler as the mutation closes it, at the cost of one extra Redis call.',
          },
          {
            title: 'Durable queue and persistent messages',
            detail:
              'Notifications survive a broker restart, and the consumer acknowledges explicitly so a crash mid-processing redelivers instead of dropping.',
          },
          {
            title: 'A worker process, not a background function',
            detail:
              'The consumer runs on its own so it can be restarted, scaled or fail without affecting the API serving requests.',
          },
        ],
      },
      {
        id: 'results',
        label: 'Results',
        points: [
          {
            title: 'Uploads decoupled from the API',
            detail: 'File size and upload duration no longer occupy a Node process.',
          },
          {
            title: 'No stale-read window',
            detail: 'Cached collections are correct immediately after a write, not merely eventually.',
          },
          {
            title: 'Reproducible environment',
            detail: 'One compose command brings up the API, database and cache together.',
          },
        ],
      },
    ],
  },
];
