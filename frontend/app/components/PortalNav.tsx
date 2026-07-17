"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "../lib/api";

const links=[
  ["/dashboard","⌂","Overview"],["/roadmap","🗺","My Roadmap"],["/courses","◫","Courses"],
  ["/presentations","▣","PPT Creator"],["/tutor","✦","Ask Lumi"],
  ["/certificates","◇","Certificates"],["/achievements","☆","Achievements"],["/profile","◎","Profile"],
];

export default function PortalNav(){
  const pathname=usePathname(),router=useRouter();
  const[dark,setDark]=useState(false);
  useEffect(()=>{
    const enabled=localStorage.getItem("lumio_theme")==="dark";
    setDark(enabled);document.documentElement.dataset.theme=enabled?"dark":"light";
  },[]);
  function goBack(){if(window.history.length>1)router.back();else router.push("/dashboard")}
  function toggleTheme(){
    const next=!dark;setDark(next);
    document.documentElement.dataset.theme=next?"dark":"light";
    localStorage.setItem("lumio_theme",next?"dark":"light");
  }
  return <aside className="portal-nav">
    <Link className="portal-brand" href="/"><span>L</span><b>Lumio</b></Link>
    <button className="portal-back" onClick={goBack} aria-label="Go back">← <span>Back</span></button>
    <nav>{links.map(([href,icon,label])=><Link key={href} className={pathname===href?"active":""} href={href}><i>{icon}</i>{label}</Link>)}</nav>
    <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${dark?"light":"dark"} mode`}><span>{dark?"☀":"☾"}</span>{dark?"Light mode":"Dark mode"}</button>
    <div className="nav-coach"><img src="/lumi-guide.png" alt="Lumi"/><b>Need a boost?</b><small>Lumi is always nearby.</small></div>
    <button className="portal-signout" onClick={()=>{clearSession();router.push("/auth")}}>↙ Sign out</button>
  </aside>;
}
