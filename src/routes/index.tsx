import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Brain,
  Layout,
  Sparkles,
  Target,
  BarChart3,
  Mail,
  Workflow,
  CheckCircle2,
  Star,
  Zap,
  Shield,
  Clock,
  TrendingUp,
  ChevronDown,
  X,
  Twitter,
  Github,
  Linkedin,
  Heart,
} from "lucide-react";
import { LoopMark, BrandLockup } from "@/components/ui/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Loopr — A focused CRM that thinks with you" },
      {
        name: "description",
        content:
          "Loopr by The MVP Guy. A lightweight, AI-assisted pipeline tracker. Sheet, Kanban, and daily briefings — built for high-touch outbound, not mass spam.",
      },
      { property: "og:title", content: "Loopr — Focused CRM by The MVP Guy" },
      {
        property: "og:description",
        content:
          "Personal pipeline tracker with spreadsheet, Kanban, and an AI that thinks alongside you.",
      },
    ],
  }),
  component: Landing,
});

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.15 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Landing() {
  return (
    <main className="min-h-screen overflow-hidden bg-background">
      <Header />
      <Hero />
      <LogoStrip />
      <Stats />
      <Features />
      <ChartShowcase />
      <Workflow_ />
      <Comparison />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

/* ============================== HEADER ============================== */

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-[var(--brand-yellow)] border-b-[3px] border-black">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <BrandLockup size={42} />
        <nav className="hidden md:flex items-center gap-7 text-sm font-bold uppercase tracking-wide">
          <a href="#features" className="hover:underline underline-offset-4 decoration-[3px]">
            Features
          </a>
          <a href="#workflow" className="hover:underline underline-offset-4 decoration-[3px]">
            Workflow
          </a>
          <a href="#pricing" className="hover:underline underline-offset-4 decoration-[3px]">
            Pricing
          </a>
          <a href="#faq" className="hover:underline underline-offset-4 decoration-[3px]">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="brutal-btn px-4 py-2 text-xs hidden sm:inline-flex items-center gap-2"
          >
            Sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============================== HERO ============================== */

function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center relative">
      {/* Floating sticker decorations */}
      <div
        aria-hidden
        className="hidden md:block absolute top-20 left-8 brutal-card-pink px-3 py-2 text-xs font-extrabold uppercase rotate-[-8deg] animate-float"
      >
        ⚡ AI-powered
      </div>
      <div
        aria-hidden
        className="hidden md:block absolute top-32 right-8 brutal-card-yellow px-3 py-2 text-xs font-extrabold uppercase rotate-[6deg] animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        🎯 Built for solo
      </div>

      <div className="brutal-badge mb-8 animate-fade-up">
        <span className="w-2 h-2 rounded-full bg-white" /> v1.0 NOW LIVE
      </div>
      <h1
        className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.02] animate-fade-up"
        style={{ animationDelay: "0.1s" }}
      >
        A really good notebook
        <br />
        <span
          className="inline-block bg-[var(--brand-orange)] text-white px-4 -rotate-1 border-[3px] border-black mt-2"
          style={{ boxShadow: "0 6px 0 #0A0A0A" }}
        >
          that also thinks.
        </span>
      </h1>
      <p
        className="mt-8 text-lg md:text-xl font-bold text-foreground/80 max-w-2xl mx-auto animate-fade-up"
        style={{ animationDelay: "0.2s" }}
      >
        Track every deal in a calm, focused interface. Spreadsheet, Kanban, and a daily AI briefing
        — no bloat, no mass spam.
      </p>
      <div
        className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-up"
        style={{ animationDelay: "0.3s" }}
      >
        <Link to="/auth" className="brutal-btn px-7 py-3.5 text-sm inline-flex items-center gap-2">
          Start tracking free <ArrowRight className="h-4 w-4" />
        </Link>
        <a
          href="#features"
          className="brutal-btn-secondary px-7 py-3.5 text-sm inline-flex items-center gap-2"
        >
          See how it works
        </a>
      </div>

      <HeroPreview />
    </section>
  );
}

function HeroPreview() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`mt-16 mx-auto max-w-4xl transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="brutal-card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b-2 border-black">
          <div className="w-3.5 h-3.5 rounded-full bg-[var(--destructive)] border-2 border-black" />
          <div className="w-3.5 h-3.5 rounded-full bg-[var(--brand-yellow)] border-2 border-black" />
          <div className="w-3.5 h-3.5 rounded-full bg-[var(--success)] border-2 border-black" />
          <div className="ml-3 text-xs font-bold text-foreground/60">loopr.io/dashboard</div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Pipeline value", value: "$184k", trend: "+12%", bg: "brutal-card-orange" },
            { label: "Hot leads", value: "23", trend: "+5", bg: "brutal-card-yellow" },
            { label: "Replies today", value: "8", trend: "+2", bg: "brutal-card-pink" },
          ].map((k, i) => (
            <div
              key={k.label}
              className={`${k.bg} p-4 animate-fade-up`}
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className="text-xs font-bold uppercase opacity-90">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-3xl font-extrabold">{k.value}</div>
                <div className="text-[11px] font-extrabold bg-black/20 px-2 py-0.5 rounded-full">
                  {k.trend}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 brutal-card-yellow p-5">
          <MiniBars />
        </div>
      </div>
    </div>
  );
}

function MiniBars() {
  const data = [40, 65, 50, 80, 70, 95, 85, 100, 75, 90, 110, 120];
  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {data.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full border-2 border-black bg-[var(--brand-orange)] animate-bar-grow"
            style={{ height: `${h}%`, animationDelay: `${i * 0.05}s`, borderRadius: "6px 6px 0 0" }}
          />
          <div className="text-[10px] font-extrabold text-black">
            {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================== LOGO STRIP ============================== */

function LogoStrip() {
  const items = [
    "INDIE HACKERS",
    "MAKERS LEAGUE",
    "SOLO FOUNDERS",
    "SHIP DAILY",
    "BOOTSTRAPPED.FM",
    "MVP GUILD",
  ];
  return (
    <section className="py-10 border-y-[3px] border-black bg-[var(--brand-yellow)]">
      <div className="max-w-6xl mx-auto px-6">
        <p className="text-center text-xs font-extrabold uppercase tracking-widest text-foreground/70 mb-5">
          Trusted by solo operators worldwide
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {items.map((l) => (
            <div
              key={l}
              className="text-sm md:text-base font-extrabold tracking-wider text-foreground"
            >
              {l}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================== STATS ============================== */

function Stats() {
  const stats = [
    { value: "10k+", label: "Leads tracked weekly", icon: TrendingUp, bg: "brutal-card-yellow" },
    { value: "3.2x", label: "Faster follow-ups", icon: Zap, bg: "brutal-card-orange" },
    { value: "92%", label: "User satisfaction", icon: Star, bg: "brutal-card-pink" },
    { value: "24/7", label: "AI assistance", icon: Brain, bg: "brutal-card" },
  ];
  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`${s.bg} p-6 text-center animate-fade-up hover:translate-y-[3px] transition-transform`}
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div
              className="w-12 h-12 mx-auto mb-3 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center"
              style={{ boxShadow: "0 3px 0 #0A0A0A" }}
            >
              <s.icon className="h-5 w-5 text-foreground" strokeWidth={2.5} />
            </div>
            <div className="text-3xl md:text-4xl font-extrabold">{s.value}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-wide opacity-80">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================== FEATURES ============================== */

function Features() {
  const items = [
    {
      icon: Layout,
      title: "Sheet & Kanban",
      desc: "Two views of one pipeline. Edit in place. Drag to advance.",
      color: "var(--brand-orange)",
    },
    {
      icon: Brain,
      title: "AI that earns its place",
      desc: "Daily briefing, ICP scoring, reply analysis. Only when it saves real time.",
      color: "var(--brand-pink)",
    },
    {
      icon: Target,
      title: "Signal Score",
      desc: "Every lead gets a 0–100 score. See who's hot, who's cold, who's at risk.",
      color: "var(--brand-yellow)",
    },
    {
      icon: Mail,
      title: "Reply analyzer",
      desc: "Paste any reply — get sentiment, intent, and a suggested next move.",
      color: "var(--brand-orange)",
    },
    {
      icon: Shield,
      title: "Yours alone",
      desc: "Single-tenant data. Your leads stay yours. Export anytime as CSV.",
      color: "var(--brand-pink)",
    },
    {
      icon: Clock,
      title: "Calm by design",
      desc: "No notifications, no streaks. Open it when you choose to.",
      color: "var(--brand-yellow)",
    },
  ];
  return (
    <section id="features" className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Features"
        title="Built for focus, not for everything"
        sub="Six tools that respect your time and earn their place on the screen."
      />
      <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.06}>
            <div className="brutal-card p-6 h-full hover:translate-y-[3px] transition-transform">
              <div
                className="w-12 h-12 mb-4 border-[2.5px] border-black rounded-xl flex items-center justify-center"
                style={{ background: f.color, boxShadow: "0 3px 0 #0A0A0A" }}
              >
                <f.icon className="h-5 w-5 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-foreground text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-foreground/70 font-medium">{f.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================== CHART SHOWCASE ============================== */

function ChartShowcase() {
  const stages = [
    { name: "New", count: 42, color: "var(--brand-yellow)" },
    { name: "Contacted", count: 31, color: "var(--brand-orange)" },
    { name: "Replied", count: 18, color: "var(--brand-pink)" },
    { name: "Meeting", count: 9, color: "var(--success)" },
    { name: "Won", count: 5, color: "var(--brand-orange)" },
  ];
  const max = Math.max(...stages.map((s) => s.count));
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <SectionHeader
            align="left"
            eyebrow="Visual pipeline"
            title="Watch your pipeline breathe"
            sub="Live charts, signal trends, and stage velocity — at a glance, every morning."
          />
          <ul className="mt-8 space-y-3">
            {[
              "Stage-by-stage conversion",
              "Daily reply & touch heatmap",
              "Signal Score distribution",
              "Stale lead alerts before they go cold",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3 text-foreground font-semibold">
                <div
                  className="w-6 h-6 mt-0.5 shrink-0 bg-[var(--success)] border-2 border-black rounded-full flex items-center justify-center"
                  style={{ boxShadow: "0 2px 0 #0A0A0A" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-black" strokeWidth={3} />
                </div>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          ref={ref}
          className={`brutal-card p-7 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-foreground/60">
                Pipeline by stage
              </div>
              <div className="text-xl font-extrabold text-foreground">This week</div>
            </div>
            <div
              className="w-10 h-10 bg-[var(--brand-orange)] border-[2.5px] border-black rounded-xl flex items-center justify-center"
              style={{ boxShadow: "0 3px 0 #0A0A0A" }}
            >
              <BarChart3 className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex items-end justify-between gap-3 h-56">
            {stages.map((s, i) => (
              <div key={s.name} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-sm font-extrabold text-foreground">{s.count}</div>
                <div
                  className="w-full border-[2.5px] border-black animate-bar-grow"
                  style={{
                    height: `${(s.count / max) * 100}%`,
                    background: s.color,
                    animationDelay: `${i * 0.12}s`,
                    borderRadius: "8px 8px 0 0",
                    boxShadow: "0 3px 0 #0A0A0A",
                  }}
                />
                <div className="text-[11px] font-extrabold text-foreground text-center uppercase">
                  {s.name}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Donut label="Convert" value={28} />
            <Donut label="Reply" value={42} />
            <Donut label="Win" value={18} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Donut({ label, value }: { label: string; value: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="brutal-card-yellow p-3 flex items-center gap-3">
      <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 shrink-0">
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="#0A0A0A"
          strokeOpacity="0.15"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          stroke="#0A0A0A"
          className="transition-all duration-1000"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="text-left">
        <div className="text-lg font-extrabold text-black leading-none">{value}%</div>
        <div className="text-[10px] font-bold uppercase text-black/70 mt-1">{label}</div>
      </div>
    </div>
  );
}

/* ============================== WORKFLOW ============================== */

function Workflow_() {
  const steps = [
    { icon: Workflow, title: "Add a lead", desc: "Paste a name, company, niche. We do the rest." },
    {
      icon: Sparkles,
      title: "Track touches",
      desc: "Log emails, calls, meetings. Sentiment captured automatically.",
    },
    {
      icon: Brain,
      title: "Get the brief",
      desc: "Each morning, AI surfaces who to follow up with and why.",
    },
    {
      icon: TrendingUp,
      title: "Close calmly",
      desc: "Move deals through stages with a drag. No friction.",
    },
  ];
  const colors = ["brutal-card-yellow", "brutal-card-orange", "brutal-card-pink", "brutal-card"];
  return (
    <section id="workflow" className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Workflow"
        title="From cold lead to closed deal"
        sub="Four steps. No setup wizards, no certification programs."
      />
      <div className="mt-14 grid md:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08}>
            <div
              className={`${colors[i]} p-6 h-full relative hover:translate-y-[3px] transition-transform`}
            >
              <div
                className="absolute -top-4 -right-4 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-extrabold text-base border-[2.5px] border-black"
                style={{ boxShadow: "0 3px 0 #FF6B35" }}
              >
                {i + 1}
              </div>
              <div
                className="w-12 h-12 mb-4 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center"
                style={{ boxShadow: "0 3px 0 #0A0A0A" }}
              >
                <s.icon className="h-5 w-5 text-black" strokeWidth={2.5} />
              </div>
              <h3 className="font-extrabold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm font-medium opacity-80">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================== COMPARISON TABLE ============================== */

function Comparison() {
  const rows: {
    label: string;
    loopr: boolean | string;
    hubspot: boolean | string;
    sheets: boolean | string;
  }[] = [
    { label: "Setup time", loopr: "< 1 min", hubspot: "Hours", sheets: "Manual" },
    { label: "AI daily briefing", loopr: true, hubspot: false, sheets: false },
    { label: "Signal Score (0–100)", loopr: true, hubspot: "Add-on", sheets: false },
    { label: "Reply analyzer", loopr: true, hubspot: "Enterprise", sheets: false },
    { label: "Sheet + Kanban views", loopr: true, hubspot: true, sheets: false },
    { label: "Per-seat pricing", loopr: false, hubspot: true, sheets: false },
    { label: "Bloat & nags", loopr: false, hubspot: true, sheets: false },
    { label: "Own your data (CSV export)", loopr: true, hubspot: "Limited", sheets: true },
    { label: "Built for solo operators", loopr: true, hubspot: false, sheets: false },
  ];

  const Cell = ({ v, accent }: { v: boolean | string; accent?: boolean }) => {
    if (typeof v === "boolean") {
      return v ? (
        <div
          className={`mx-auto w-8 h-8 ${accent ? "bg-[var(--success)]" : "bg-white"} border-[2.5px] border-black rounded-lg flex items-center justify-center`}
          style={{ boxShadow: "0 3px 0 #0A0A0A" }}
        >
          <CheckCircle2 className="h-4 w-4 text-black" strokeWidth={3} />
        </div>
      ) : (
        <div
          className="mx-auto w-8 h-8 bg-white border-[2.5px] border-black rounded-lg flex items-center justify-center"
          style={{ boxShadow: "0 3px 0 #0A0A0A" }}
        >
          <X className="h-4 w-4 text-black" strokeWidth={3} />
        </div>
      );
    }
    return (
      <div className={`text-sm font-extrabold ${accent ? "text-black" : "text-foreground/80"}`}>
        {v}
      </div>
    );
  };

  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Compare"
        title="Loopr vs the usual suspects"
        sub="Same job — different philosophy."
      />
      <Reveal>
        <div className="mt-12 brutal-card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-center">
              <thead>
                <tr className="border-b-[3px] border-black">
                  <th className="text-left px-6 py-5 text-xs font-extrabold uppercase tracking-wider text-foreground/70">
                    Feature
                  </th>
                  <th className="px-4 py-5 bg-[var(--brand-orange)] border-l-[3px] border-r-[3px] border-black">
                    <div className="text-white font-extrabold text-base">Loopr</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-1">
                      by The MVP Guy
                    </div>
                  </th>
                  <th className="px-4 py-5">
                    <div className="font-extrabold text-base text-foreground">HubSpot</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mt-1">
                      Big CRM
                    </div>
                  </th>
                  <th className="px-4 py-5 border-l-[3px] border-black">
                    <div className="font-extrabold text-base text-foreground">Spreadsheets</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-foreground/60 mt-1">
                      DIY
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.label}
                    className={`${i !== rows.length - 1 ? "border-b-2 border-black/15" : ""}`}
                  >
                    <td className="text-left px-6 py-4 text-sm font-bold text-foreground">
                      {r.label}
                    </td>
                    <td className="px-4 py-4 bg-[var(--brand-yellow)]/40 border-l-[3px] border-r-[3px] border-black">
                      <Cell v={r.loopr} accent />
                    </td>
                    <td className="px-4 py-4">
                      <Cell v={r.hubspot} />
                    </td>
                    <td className="px-4 py-4 border-l-[3px] border-black">
                      <Cell v={r.sheets} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ============================== PRICING ============================== */

function Pricing() {
  const tiers = [
    {
      name: "Solo",
      price: "$0",
      period: "free forever",
      features: ["Up to 50 leads", "Sheet + Kanban", "Daily AI brief"],
      cta: "Start free",
      highlight: false,
      bg: "brutal-card",
      comingSoon: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      features: ["Unlimited leads", "Reply analyzer", "Signal Score", "CSV export"],
      cta: "Start 14-day trial",
      highlight: true,
      bg: "brutal-card-orange",
      comingSoon: true,
    },
    {
      name: "Studio",
      price: "$49",
      period: "/month",
      features: ["Everything in Pro", "AI weekly recap", "Priority support"],
      cta: "Talk to us",
      highlight: false,
      bg: "brutal-card-yellow",
      comingSoon: true,
    },
  ];
  return (
    <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Pricing"
        title="Pay for what you use"
        sub="No seats, no per-contact fees, no surprise bills."
      />
      <div className="mt-14 grid md:grid-cols-3 gap-6 items-stretch">
        {tiers.map((t, i) => (
          <Reveal key={t.name} delay={i * 0.08}>
            <div
              className={`${t.bg} p-7 h-full flex flex-col relative ${t.highlight ? "md:scale-105" : ""}`}
            >
              {t.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 brutal-badge bg-black">
                  ⭐ MOST POPULAR
                </div>
              )}
              <div className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                {t.name}
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold">{t.price}</span>
                <span className="text-sm font-bold opacity-80">{t.period}</span>
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              {t.comingSoon ? (
                <div className="mt-7 block text-center px-5 py-3 text-sm brutal-btn-secondary opacity-60 cursor-not-allowed">
                  Coming Soon
                </div>
              ) : (
                <Link to="/auth" className="mt-7 block text-center px-5 py-3 text-sm brutal-btn">
                  {t.cta}
                </Link>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ============================== FAQ ============================== */

function FAQ() {
  const items = [
    {
      q: "Is my data really mine?",
      a: "Yes. Your leads live in your account only. Export to CSV at any time. We never share or train on your data.",
    },
    {
      q: "What does the AI actually do?",
      a: "Three things: a daily morning brief, a reply analyzer (sentiment + intent), and ICP-based lead scoring. No spam generators.",
    },
    {
      q: "Can I import from another CRM?",
      a: "Yes. CSV import on day one. Mappings for HubSpot, Pipedrive, and Streak are coming.",
    },
    {
      q: "Why no team plan?",
      a: "Loopr is built for one person who runs their own outbound. We may add small-team features later — never enterprise.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-6 py-24">
      <SectionHeader eyebrow="FAQ" title="Questions, answered honestly" />
      <div className="mt-14 flex flex-col gap-4">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className="brutal-card overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-extrabold text-foreground text-base">{it.q}</span>
                <div
                  className={`w-8 h-8 bg-[var(--brand-yellow)] border-2 border-black rounded-lg flex items-center justify-center transition-transform ${isOpen ? "rotate-180" : ""}`}
                  style={{ boxShadow: "0 2px 0 #0A0A0A" }}
                >
                  <ChevronDown className="h-4 w-4 text-black" strokeWidth={3} />
                </div>
              </button>
              <div
                className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm text-foreground/80 font-medium leading-relaxed border-t-2 border-black/10 pt-4">
                    {it.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============================== CTA ============================== */

function CTA() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="brutal-card-orange p-12 md:p-16 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute top-6 left-6 brutal-card-yellow px-3 py-1.5 text-xs font-extrabold uppercase rotate-[-6deg]"
        >
          🔥 Free forever tier
        </div>
        <div
          aria-hidden
          className="absolute bottom-6 right-6 brutal-card-pink px-3 py-1.5 text-xs font-extrabold uppercase rotate-[5deg]"
        >
          ⚡ No credit card
        </div>
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Ready to track calmly?
        </h2>
        <p className="mt-4 text-lg font-bold opacity-90 max-w-xl mx-auto">
          Free forever for your first 50 leads. No credit card. No nags.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-flex items-center gap-2 brutal-btn-secondary px-8 py-4 text-base"
        >
          Start tracking free <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}

/* ============================== FOOTER ============================== */

function Footer() {
  const cols = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Workflow", href: "#workflow" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Changelog", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
      ],
    },
  ];
  return (
    <footer className="bg-[var(--brand-yellow)] border-t-[3px] border-black mt-10">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-5 gap-10">
          {/* Brand col */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <LoopMark size={48} />
              <div className="leading-none">
                <div className="font-extrabold text-2xl text-foreground">Loopr</div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-foreground/70 mt-1">
                  by The MVP Guy
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold text-foreground/80 max-w-xs">
              A focused CRM for solo founders running high-touch outbound. No bloat. No nags. Just
              deals.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center hover:translate-y-[2px] transition-transform"
                  style={{ boxShadow: "0 4px 0 #0A0A0A" }}
                >
                  <Icon className="h-4 w-4 text-black" strokeWidth={2.5} />
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-extrabold uppercase tracking-wider text-foreground mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm font-semibold text-foreground/80 hover:text-foreground hover:underline underline-offset-4 decoration-[2px]"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="brutal-divider my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs font-bold text-foreground/80">
            © {new Date().getFullYear()} Loopr. All rights reserved.
          </div>
          <div className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
            Crafted with{" "}
            <Heart className="h-3.5 w-3.5 text-[var(--brand-orange)] fill-[var(--brand-orange)]" />{" "}
            by
            <span className="font-extrabold text-foreground">The MVP Guy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================== HELPERS ============================== */

function SectionHeader({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "text-center max-w-2xl mx-auto" : ""}>
      <div className="brutal-badge bg-black">{eyebrow}</div>
      <h2 className="mt-5 text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
        {title}
      </h2>
      {sub && <p className="mt-3 text-base font-semibold text-foreground/70">{sub}</p>}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}
