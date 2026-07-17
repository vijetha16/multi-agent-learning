"use client";

import { useState } from "react";
import Link from "next/link";
import "./dashboard.css";

const initialLevels = [
  { n: 1, title: "Foundations of AI", time: "18 min", credits: 25, status: "done", stars: 3, progress: 100 },
  { n: 2, title: "How Machines Learn", time: "24 min", credits: 35, status: "done", stars: 3, progress: 100 },
  { n: 3, title: "Training Your First Model", time: "32 min", credits: 45, status: "active", stars: 1, progress: 68 },
  { n: 4, title: "Neural Network Basics", time: "28 min", credits: 50, status: "locked", stars: 0, progress: 0 },
  { n: 5, title: "Build a Smart Classifier", time: "40 min", credits: 75, status: "locked", stars: 0, progress: 0 },
  { n: 6, title: "AI Ethics & Responsible Design", time: "22 min", credits: 100, status: "locked", stars: 0, progress: 0 },
];

const activity = [
  ["✓", "Completed “How Machines Learn”", "+35 credits", "2h ago"],
  ["★", "Unlocked Fast Learner badge", "Achievement", "Yesterday"],
  ["⚡", "Maintained a 7-day streak", "+15 credits", "Yesterday"],
];

export default function Dashboard() {
  const [levels, setLevels] = useState(initialLevels);
  const [credits, setCredits] = useState(480);
  const [celebrate, setCelebrate] = useState(false);

  function completeCurrent() {
    const activeIndex = levels.findIndex((level) => level.status === "active");
    if (activeIndex < 0) return;
    const reward = levels[activeIndex].credits;
    setLevels((current) => current.map((level, index) => {
      if (index === activeIndex) return { ...level, status: "done", stars: 3, progress: 100 };
      if (index === activeIndex + 1) return { ...level, status: "active", progress: 0 };
      return level;
    }));
    setCredits((value) => value + reward);
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2200);
  }

  const completed = levels.filter((level) => level.status === "done").length;
  const overall = Math.round((completed / levels.length) * 100);

  return (
    <main className="dash-shell">
      {celebrate && <div className="confetti" aria-live="polite">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ "--i": i } as React.CSSProperties} />)}<b>Level complete! +45 credits</b></div>}
      <aside className="sidebar">
        <Link className="dash-brand" href="/"><span>L</span><b>Lumio</b></Link>
        <nav>
          <a className="selected" href="#overview"><i>⌂</i> Overview</a>
          <a href="#roadmap"><i>⌁</i> My Roadmap</a>
          <a href="#courses"><i>◫</i> Explore Courses</a>
          <a href="#certificates"><i>◇</i> Certificates</a>
          <a href="#achievements"><i>☆</i> Achievements</a>
        </nav>
        <div className="sidebar-bottom">
          <a href="#settings"><i>⚙</i> Settings</a>
          <Link href="/">← Back to home</Link>
          <div className="user-chip"><span>V</span><div><b>Vijetha</b><small>Level 8 Learner</small></div><button aria-label="Account menu">•••</button></div>
        </div>
      </aside>

      <section className="dash-main" id="overview">
        <header className="dash-top">
          <div><small>FRIDAY, JULY 17</small><h1>Welcome back, Vijetha <span>👋</span></h1><p>Keep the momentum going. Your next milestone is closer than you think.</p></div>
          <div className="top-actions"><button aria-label="Notifications">♧<b /></button><div className="credit-pill">✦ <span>{credits}</span> credits</div></div>
        </header>

        <div className="stats-grid">
          <article><span className="stat-icon violet">⌁</span><div><small>CURRENT LEVEL</small><b>Level {completed + 1}</b><em>AI Foundations</em></div></article>
          <article><span className="stat-icon amber">⚡</span><div><small>LEARNING STREAK</small><b>7 days</b><em className="up">Best: 12 days</em></div></article>
          <article><span className="stat-icon green">✓</span><div><small>LESSONS DONE</small><b>{completed * 4 + 6}</b><em>this month</em></div></article>
          <article><span className="stat-icon blue">♛</span><div><small>LEADERBOARD</small><b>#24</b><em className="up">↑ 8 this week</em></div></article>
        </div>

        <div className="dashboard-grid">
          <div className="roadmap-card" id="roadmap">
            <div className="card-head">
              <div><small>YOUR CURRENT PATH</small><h2>AI & Machine Learning</h2></div>
              <div className="overall"><span>{overall}% complete</span><div><i style={{ width: `${overall}%` }} /></div></div>
            </div>
            <div className="roadmap">
              <div className="path-line" />
              {levels.map((level, index) => (
                <article className={`road-level ${level.status} ${index % 2 ? "right" : "left"}`} key={level.n}>
                  <div className="level-info">
                    <small>LEVEL {level.n}</small><h3>{level.title}</h3>
                    <p>◷ {level.time} <span>✦ {level.credits} credits</span></p>
                    {level.status === "active" && <div className="mini-progress"><i style={{ width: `${level.progress}%` }} /><b>{level.progress}%</b></div>}
                  </div>
                  <button className="level-node" onClick={level.status === "active" ? completeCurrent : undefined} aria-label={`${level.title}: ${level.status}`}>
                    {level.status === "done" ? "✓" : level.status === "locked" ? "♙" : level.n}
                    {level.status === "active" && <span>CONTINUE</span>}
                  </button>
                  <div className="stars">{[1,2,3].map((star) => <i className={star <= level.stars ? "filled" : ""} key={star}>★</i>)}</div>
                </article>
              ))}
              <div className="certificate-goal"><span>◇</span><div><small>FINAL REWARD</small><b>Industry Certificate</b><p>Complete all 6 levels to become eligible</p></div></div>
            </div>
          </div>

          <aside className="right-rail">
            <article className="continue-card">
              <small>UP NEXT</small><span className="lesson-art">AI</span><h3>Training Your First Model</h3><p>Level 3 • Lesson 3 of 4</p>
              <div className="rail-progress"><i style={{width:"68%"}} /></div>
              <button onClick={completeCurrent}>Continue lesson <span>→</span></button>
            </article>
            <article className="activity-card">
              <div className="rail-title"><h3>Recent activity</h3><button>View all</button></div>
              {activity.map(([icon, title, detail, time]) => <div className="activity-row" key={title}><span>{icon}</span><div><b>{title}</b><small>{detail} • {time}</small></div></div>)}
            </article>
            <article className="unlock-card">
              <span>✦</span><div><small>NEW PATH AVAILABLE</small><b>Machine Learning Specialization</b><p>You have enough credits to unlock it.</p></div><button>Explore</button>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
}
