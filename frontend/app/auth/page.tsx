"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, saveSession } from "../lib/api";
import "./auth.css";

const interests = [
  [1,"Artificial Intelligence"],[2,"Machine Learning"],[3,"Cyber Security"],
  [4,"Web Development"],[5,"Cloud"],[6,"Data Science"],[7,"UI/UX"],
];

export default function AuthPage() {
  const router = useRouter();
  const [mode,setMode]=useState<"login"|"register">("login");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [selected,setSelected]=useState<number[]>([1,2]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data=new FormData(event.currentTarget);
    try {
      const body=mode==="login"
        ? {email:data.get("email"),password:data.get("password")}
        : {fullName:data.get("fullName"),username:data.get("username"),email:data.get("email"),password:data.get("password"),experienceLevel:data.get("experienceLevel"),interests:selected};
      const result=await api<{token:string;user:unknown}>(`/auth/${mode==="login"?"login":"register"}`,{method:"POST",body:JSON.stringify(body)});
      saveSession(result.token,result.user);
      router.push("/dashboard");
    } catch (reason) { setError(reason instanceof Error?reason.message:"Unable to continue"); }
    finally { setLoading(false); }
  }
  async function continueAsGuest(){
    setLoading(true);setError("");
    try{const result=await api<{token:string;user:unknown}>("/auth/guest",{method:"POST"});saveSession(result.token,result.user);router.push("/dashboard");}
    catch(reason){setError(reason instanceof Error?reason.message:"Unable to start guest mode");}
    finally{setLoading(false);}
  }

  return <main className="auth-shell">
    <section className="auth-story">
      <Link href="/" className="auth-brand"><span>L</span>Lumio</Link>
      <div className="story-copy"><small>YOUR PERSONAL LEARNING UNIVERSE</small><h1>Every path begins with curiosity.</h1><p>Lumi and a team of specialist AI agents adapt every lesson, challenge, and milestone to you.</p></div>
      <img src="/lumi-guide.png" alt="Lumi, your AI learning guide" />
      <div className="story-orb one"/><div className="story-orb two"/>
    </section>
    <section className="auth-panel">
      <div className="auth-box">
        <div className="auth-tabs"><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}>Sign in</button><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}>Create account</button></div>
        <h2>{mode==="login"?"Welcome back":"Start your learning path"}</h2>
        <p>{mode==="login"?"Continue exactly where you stopped.":"Tell us a little about you so Lumi can personalize the journey."}</p>
        <form onSubmit={submit}>
          {mode==="register"&&<><label>Full name<input name="fullName" required minLength={2} placeholder="Your name"/></label><label>Username<input name="username" required minLength={3} maxLength={32} pattern="[A-Za-z0-9_]+" placeholder="e.g. vijetha_codes"/><small>Friends can find you using this.</small></label></>}
          <label>Email address<input name="email" type="email" required placeholder="you@example.com"/></label>
          <label>Password<input name="password" type="password" required minLength={8} placeholder="At least 8 characters"/></label>
          {mode==="register"&&<>
            <label>Experience level<select name="experienceLevel" defaultValue="beginner"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
            <fieldset><legend>What do you want to learn?</legend><div className="interest-grid">{interests.map(([id,name])=><button type="button" key={id} className={selected.includes(id as number)?"chosen":""} onClick={()=>setSelected(current=>current.includes(id as number)?current.filter(item=>item!==id):[...current,id as number])}>{name}</button>)}</div></fieldset>
          </>}
          {error&&<div className="auth-error">{error}</div>}
          <button className="auth-submit" disabled={loading}>{loading?"Please wait…":mode==="login"?"Sign in and continue":"Create my learning path"} <span>→</span></button>
        </form>
        <div className="guest-divider"><span>or</span></div>
        <button className="guest-button" type="button" onClick={continueAsGuest} disabled={loading}>Explore as a guest <span>→</span></button>
        <small className="guest-note">Try courses, quizzes, Lumi, and roadmap puzzles now. Create an account later to keep everything permanently.</small>
        <small className="auth-note">Your progress, rewards, and certificates are securely saved to your account.</small>
      </div>
    </section>
  </main>;
}
