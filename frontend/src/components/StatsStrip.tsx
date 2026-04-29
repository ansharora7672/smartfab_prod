const stats = [
  { value: "12+", label: "Manufacturing Capabilities" },
  { value: "24hr", label: "Quote Turnaround" },
  { value: "UAE", label: "Wide Delivery" },
  { value: "100%", label: "In-House Production" },
];

export default function StatsStrip() {
  return (
    <section id="stats" className="bg-text-primary py-14">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-0 md:divide-x md:divide-white/10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center md:px-8">
              <p className="text-4xl md:text-5xl font-bold font-heading text-white tracking-tight mb-2">
                {stat.value}
              </p>
              <p className="text-[11px] text-white/40 uppercase tracking-[0.2em]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
