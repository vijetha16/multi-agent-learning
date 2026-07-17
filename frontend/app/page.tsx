"use client";

import { useState } from "react";

const agents = [
  { icon: "⌁", name: "Curriculum Architect", role: "Builds the learning path", color: "violet" },
  { icon: "◎", name: "Research Agent", role: "Finds trusted knowledge", color: "blue" },
  { icon: "✦", name: "Storyteller", role: "Makes concepts memorable", color: "orange" },
  { icon: "◇", name: "Assessment Designer", role: "Checks real understanding", color: "green" },
];

const steps = [
  { n: "01", title: "Describe the goal", text: "Share a topic, learner profile, or challenge in plain language." },
  { n: "02", title: "Meet your agent team", text: "The orchestrator selects specialists and gives each one a clear mission." },
  { n: "03", title: "Get a complete experience", text: "Receive an adaptive lesson, activities, visuals, and assessment—ready to teach." },
];

export default function Home() {
  const [prompt, setPrompt] = useState("Teach photosynthesis to a curious 12-year-old using stories and a quick quiz.");
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  function generate() {
    if (!prompt.trim()) return;
    setRunning(true);
    setDone(false);
    window.setTimeout(() => {
      setRunning(false);
      setDone(true);
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 1700);
  }

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#" aria-label="Lumio home">
          <span className="brand-mark">L</span>
          <span>Lumio</span>
        </a>
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#agents">Agents</a>
          <a href="#demo">Demo</a>
        </div>
        <a className="nav-cta" href="/auth">Start learning <span>↗</span></a>
      </nav>

      <section className="hero">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <div className="eyebrow"><span>✦</span> MULTI-AGENT LEARNING STUDIO</div>
        <h1>One learning goal.<br /><em>A whole team of minds.</em></h1>
        <p className="hero-copy">
          Lumio assembles the right AI specialists to research, design, explain,
          and assess—creating a learning journey as unique as every learner.
        </p>

        <div className="prompt-card" id="create">
          <div className="prompt-label"><span>✦</span> What should we teach?</div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="Describe your learning goal"
            maxLength={280}
          />
          <div className="prompt-actions">
            <div className="chips">
              <button onClick={() => setPrompt("Explain quantum physics to a visual learner with simple analogies.")}>Visual learner</button>
              <button onClick={() => setPrompt("Create a 20-minute lesson on climate change for grade 8.")}>Grade 8 lesson</button>
            </div>
            <button className="generate" onClick={generate} disabled={running || !prompt.trim()}>
              {running ? "Assembling team…" : "Build my lesson"} <span>{running ? "◌" : "→"}</span>
            </button>
          </div>
        </div>

        <div className="trust-line">
          <span>Adaptive by design</span><i />
          <span>Expert agents</span><i />
          <span>Ready in minutes</span>
        </div>
      </section>

      <section className="agent-strip" id="agents">
        <div className="section-kicker">YOUR AI TEACHING TEAM</div>
        <div className="agent-grid">
          {agents.map((agent, index) => (
            <article className="agent-card" key={agent.name} style={{ animationDelay: `${index * 90}ms` }}>
              <div className={`agent-icon ${agent.color}`}>{agent.icon}</div>
              <div>
                <h3>{agent.name}</h3>
                <p>{agent.role}</p>
              </div>
              <span className="status"><b /> Ready</span>
            </article>
          ))}
        </div>
        <div className="connector"><span /><b>ORCHESTRATED IN REAL TIME</b><span /></div>
      </section>

      <section className="how" id="how">
        <div className="how-heading">
          <div>
            <div className="section-kicker">HOW LUMIO WORKS</div>
            <h2>From idea to impact,<br />in one intelligent flow.</h2>
          </div>
          <p>No rigid templates. No juggling tools. Lumio understands the goal and dynamically creates the team needed to deliver it.</p>
        </div>
        <div className="steps">
          {steps.map((step) => (
            <article className="step" key={step.n}>
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`demo ${done ? "is-done" : ""}`} id="demo">
        <div className="demo-copy">
          <div className="section-kicker light">LIVE LEARNING BLUEPRINT</div>
          <h2>{done ? "Your lesson team delivered." : "See collaboration become curriculum."}</h2>
          <p>{done
            ? "A personalized photosynthesis experience is ready—with a story-led lesson, visual activity, and knowledge check."
            : "Every agent contributes its expertise, while the orchestrator keeps the experience aligned to one learning goal."}</p>
          <button onClick={generate}>{done ? "Regenerate experience" : "Run sample prompt"} <span>→</span></button>
        </div>
        <div className="blueprint">
          <div className="blueprint-head">
            <span className="pulse-dot" />
            <div><b>{done ? "Experience ready" : "Agents collaborating"}</b><small>{done ? "4 agents • 6 learning blocks" : "Personalizing for learner profile"}</small></div>
            <span className="percent">{done ? "100%" : "68%"}</span>
          </div>
          <div className="progress"><span style={{ width: done ? "100%" : "68%" }} /></div>
          <div className="lesson-row">
            <span className="lesson-icon">☀</span>
            <div><small>STORY-LED INTRODUCTION</small><b>The Tiny Kitchen Inside Every Leaf</b></div>
            <span className="check">✓</span>
          </div>
          <div className="lesson-row">
            <span className="lesson-icon blue">◫</span>
            <div><small>INTERACTIVE VISUAL</small><b>Build the Photosynthesis Recipe</b></div>
            <span className="check">✓</span>
          </div>
          <div className="lesson-row">
            <span className="lesson-icon purple">?</span>
            <div><small>ADAPTIVE CHECK</small><b>5 questions • adjusts to answers</b></div>
            <span className="check muted">{done ? "✓" : "…"}</span>
          </div>
        </div>
      </section>

      <footer>
        <a className="brand" href="#"><span className="brand-mark">L</span><span>Lumio</span></a>
        <p>Many minds. One remarkable learning experience.</p>
        <span>Built for the future of education.</span>
      </footer>
    </main>
  );
}
