import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Braces,
  Database,
  Github,
  Layers3,
  Linkedin,
  Mail,
  Terminal
} from 'lucide-react';

const skillGroups = [
  {
    label: 'Languages',
    values: ['Python', 'JavaScript', 'TypeScript', 'SQL']
  },
  {
    label: 'Backend & APIs',
    values: ['Django', 'Django REST Framework', 'FastAPI', 'Node.js', 'REST', 'Webhooks']
  },
  {
    label: 'Frontend',
    values: ['React', 'Angular', 'Redux Toolkit', 'Tailwind CSS']
  },
  {
    label: 'Data & cloud',
    values: ['PostgreSQL', 'MySQL', 'Redis', 'DynamoDB', 'AWS', 'Docker']
  },
  {
    label: 'Integrations & AI',
    values: ['Stripe', 'Authorize.Net', 'Square', 'Twilio', 'LLM workflows', 'AI agents']
  }
];

const projects = [
  {
    number: '01',
    type: 'PUBLIC-SECTOR ANALYTICS',
    title: 'Statewide education analytics',
    description: 'Analytics and operational workflows for education platforms serving schools and student records across Tamil Nadu.',
    stack: ['React', 'Django', 'PostgreSQL', 'Redis', 'RTK Query'],
    metric: '10K+ schools · 500K+ records',
    icon: Layers3
  },
  {
    number: '02',
    type: 'PAYMENTS & COMMUNICATIONS',
    title: 'Multi-gateway transaction workflows',
    description: 'Payment and notification integrations designed around reliable webhooks, idempotency, retries, and clear failure handling.',
    stack: ['Python', 'Django', 'Stripe', 'Square', 'Twilio'],
    metric: '$500K+ monthly transactions supported',
    icon: Database
  },
  {
    number: '03',
    type: 'AI & PRODUCTIVITY',
    title: 'Personal AI productivity agent',
    description: 'A personal assistant concept combining task workflows, technical document search, and context-aware LLM interactions.',
    stack: ['FastAPI', 'Python', 'LLMs', 'Embeddings', 'React'],
    metric: 'Search · summarize · take action',
    icon: Terminal
  }
];

export default function PortfolioPage({ onGoToTracker, isSignedIn }) {
  const trackerCtaLabel = isSignedIn ? 'Open my tracker' : 'Try Study Companion';

  return (
    <div className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-[#f7f8fa]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <a href="#home" className="flex items-center gap-2.5 font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm text-white">NK.</span>
            <span>Narender Katta<span className="text-blue-600">.</span></span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 sm:flex">
            <a className="transition hover:text-blue-700" href="#work">Work</a>
            <a className="transition hover:text-blue-700" href="#skills">Skills</a>
            <a className="transition hover:text-blue-700" href="#about">About</a>
            <a className="transition hover:text-blue-700" href="#contact">Contact</a>
          </div>
          <button
            type="button"
            onClick={onGoToTracker}
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:text-sm"
          >
            {trackerCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </nav>
      </header>

      <main id="home">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-36 -top-32 h-[520px] w-[520px] rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute left-[-10rem] top-72 h-80 w-80 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 sm:px-8 sm:pb-32 sm:pt-28 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Full-stack engineer · Open to job opportunities
              </div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-700">Hello, I’m Narender</p>
              <h1 className="max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">
                I build software
                <span className="block text-blue-700">that moves work</span>
                forward.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Full-stack software engineer crafting dependable web products, backend systems, and AI-powered workflows—from thoughtful interfaces to production-ready APIs.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onGoToTracker}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
                >
                  {trackerCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#work"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                >
                  Explore my work
                  <ArrowDown className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-500">
                <a className="inline-flex items-center gap-2 transition hover:text-blue-700" href="https://github.com/narender1278" target="_blank" rel="noreferrer">
                  <Github className="h-4 w-4" /> GitHub <ArrowUpRight className="h-3 w-3" />
                </a>
                <a className="inline-flex items-center gap-2 transition hover:text-blue-700" href="https://linkedin.com/in/katta-narender-naidu-b3a335260" target="_blank" rel="noreferrer">
                  <Linkedin className="h-4 w-4" /> LinkedIn <ArrowUpRight className="h-3 w-3" />
                </a>
                <a className="inline-flex items-center gap-2 transition hover:text-blue-700" href="mailto:kattanarender167@gmail.com">
                  <Mail className="h-4 w-4" /> Get in touch
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[470px]">
              <div className="absolute -inset-4 rotate-[-5deg] rounded-[2rem] bg-gradient-to-br from-blue-200 via-indigo-100 to-slate-100" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-slate-700 bg-[#101827] shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">narender.py</span>
                  <Braces className="h-4 w-4 text-slate-500" />
                </div>
                <div className="space-y-5 px-5 py-7 font-mono text-[12px] leading-6 sm:px-7 sm:py-9 sm:text-[13px]">
                  <div><span className="text-violet-300">class</span> <span className="text-amber-200">Engineer</span>:</div>
                  <div className="pl-5 text-slate-400"># Turning complex problems into</div>
                  <div className="pl-5 text-slate-400"># useful, reliable products.</div>
                  <div className="pl-5"><span className="text-violet-300">def</span> <span className="text-sky-300">build</span>(<span className="text-orange-200">self</span>, problem):</div>
                  <div className="pl-10"><span className="text-orange-200">plan</span> = design(problem)</div>
                  <div className="pl-10"><span className="text-orange-200">ship</span> = engineer(plan)</div>
                  <div className="pl-10"><span className="text-violet-300">return</span> ship.with_care()</div>
                  <div className="flex items-center gap-2 border-t border-white/10 pt-5 text-emerald-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    Available for thoughtful projects
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-7 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:block">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Building at scale</p>
                <p className="mt-1 text-xl font-black text-slate-900">500K<span className="text-blue-700">+</span></p>
                <p className="text-xs text-slate-500">records supported</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:grid-cols-4 sm:px-8 sm:py-10">
            {[
              ['4+', 'years building software'],
              ['10K+', 'schools supported'],
              ['60%', 'faster report generation'],
              ['5K+', 'daily tasks automated']
            ].map(([value, label]) => (
              <div key={label} className="border-l-2 border-blue-600 pl-4">
                <p className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{value}</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pt-20 sm:px-8 sm:pt-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#14233b] to-blue-950 px-6 py-9 text-white sm:px-10 sm:py-11">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Featured personal project</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Study Companion</h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
                  A full-stack personal dashboard I built to bring learning and everyday planning into one place. It combines study roadmaps and progress tracking with habits, to-dos, and an editable expense tracker, with account data synchronized through Supabase.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {['React', 'Vite', 'Supabase Auth', 'PostgreSQL', 'Row Level Security'].map((item) => (
                    <span key={item} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200">{item}</span>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-5 text-slate-400">
                  Visitors can create their own account to try it. Each account sees only its own tracker data; my personal data is not shared.
                </p>
              </div>
              <button
                type="button"
                onClick={onGoToTracker}
                className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-500"
              >
                {trackerCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="work" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Selected work</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Solving problems at scale.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">A few areas where engineering rigor, product thinking, and reliable delivery meet.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {projects.map((project) => {
              const Icon = project.icon;
              return (
                <article key={project.number} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-400">{project.number} / 03</span>
                    <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white"><Icon className="h-5 w-5" /></span>
                  </div>
                  <p className="mt-8 text-[10px] font-bold tracking-[0.16em] text-blue-700">{project.type}</p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">{project.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{project.description}</p>
                  <p className="mt-5 border-l-2 border-emerald-500 pl-3 text-xs font-bold text-slate-700">{project.metric}</p>
                  <div className="mt-5 flex flex-wrap gap-1.5">
                    {project.stack.map((item) => (
                      <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{item}</span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="skills" className="scroll-mt-24 border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">My toolkit</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">The right tool for the job.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">I work across the stack, choosing pragmatic tools to make products fast, maintainable, and dependable.</p>
            </div>
            <div className="space-y-5">
              {skillGroups.map((group) => (
                <div key={group.label} className="grid gap-3 border-b border-slate-100 pb-5 sm:grid-cols-[150px_1fr]">
                  <h3 className="pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">{group.label}</h3>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((skill) => (
                      <span key={skill} className="rounded-lg border border-slate-200 bg-[#f7f8fa] px-3 py-1.5 text-xs font-semibold text-slate-700">{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto grid max-w-7xl scroll-mt-24 gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">A bit about me</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Engineer with a product mindset.</h2>
          </div>
          <div className="space-y-4 text-sm leading-7 text-slate-600">
            <p>I’m a full-stack software engineer based in India. I enjoy taking a problem from its first sketch through APIs, data models, interfaces, and production support.</p>
            <p>My experience spans education technology, analytics, payments, customer communication, and AI workflows. I care about clear code, useful details, and software that keeps working after launch.</p>
            <p>Outside of shipping products, I’m deepening my skills in distributed systems, system design, and AI agent orchestration.</p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 px-5 pb-20 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-12 text-white sm:px-12 sm:py-16">
            <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Open to new opportunities</p>
                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">Let’s talk about your next role.</h2>
                <p className="mt-4 text-sm text-slate-400">I’m open to job opportunities in full-stack and software engineering. Reach out by email or connect with me on LinkedIn.</p>
                <div className="mt-6 flex flex-col gap-3 text-sm sm:flex-row sm:gap-6">
                  <a href="mailto:kattanarender167@gmail.com" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white">
                    <Mail className="h-4 w-4 text-blue-300" />
                    kattanarender167@gmail.com
                  </a>
                  <a href="tel:+918374945814" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-white">
                    <span className="font-semibold text-blue-300">Tel</span>
                    +91 83749 45814
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href="mailto:kattanarender167@gmail.com?subject=Job%20opportunity" className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500">
                  Discuss an opportunity <Mail className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com/in/katta-narender-naidu-b3a335260" target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-bold text-white transition hover:border-slate-500 hover:bg-white/5">
                  LinkedIn <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Narender Naidu Katta. Built with care.</p>
          <button type="button" onClick={onGoToTracker} className="inline-flex w-fit items-center gap-1.5 font-semibold text-slate-700 hover:text-blue-700">
            {trackerCtaLabel} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
