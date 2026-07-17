"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "../lib/api";

const links=[["/dashboard","⌂","Dashboard"],["/courses","◫","Courses"],["/tutor","✦","Ask Lumi"],["/certificates","◇","Certificates"],["/achievements","☆","Achievements"],["/profile","◎","Profile"]];

export default function PortalNav(){
  const pathname=usePathname();const router=useRouter();
  return <aside className="portal-nav">
    <Link className="portal-brand" href="/"><span>L</span><b>Lumio</b></Link>
    <nav>{links.map(([href,icon,label])=><Link key={href} className={pathname===href?"active":""} href={href}><i>{icon}</i>{label}</Link>)}</nav>
    <div className="nav-coach"><img src="/lumi-guide.png" alt="Lumi"/><b>Need a boost?</b><small>Lumi is always nearby.</small></div>
    <button onClick={()=>{clearSession();router.push("/auth")}}>↙ Sign out</button>
  </aside>
}
