import { HOME_STATS } from "@/lib/home";

export function StatsBand() {
  return (
    <section className="home-stats reveal">
      <div className="stats-inner">
        {HOME_STATS.map((st, i) => (
          <div key={st.n} className="stat-block" style={{ transitionDelay: i * 90 + "ms" }}>
            <div className="stat-n neon-yellow">{st.n}</div>
            <div className="stat-u pixel">{st.unit}</div>
            <div className="stat-s">{st.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
