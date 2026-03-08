import ScrollReveal from "./ScrollReveal";

export default function Services() {
  // Services grouped by category for clean visual separation
  const categories = [
    {
      title: "CNC & Machining",
      services: [
        { number: "01", name: "CNC Milling", description: "Multi-axis machining for complex geometries" },
        { number: "02", name: "CNC Turning", description: "Precision rotational parts to exact specifications" },
        { number: "03", name: "Laser Cutting", description: "High-accuracy cuts for sheet metal and profiles" },
        { number: "04", name: "EDM Wire Cutting", description: "Intricate shapes via electrical discharge" },
        { number: "05", name: "EDM Sparking", description: "Deep cavity machining with micron-level precision" },
      ],
    },
    {
      title: "Welding",
      services: [
        { number: "06", name: "MIG Welding", description: "High-speed structural metal joining" },
        { number: "07", name: "TIG Welding", description: "Clean, precise welds for critical applications" },
        { number: "08", name: "Arc Welding", description: "Heavy-duty joining for industrial structures" },
      ],
    },
    {
      title: "Fabrication & Production",
      services: [
        { number: "09", name: "Gear Cutting", description: "Custom gears manufactured to specification" },
        { number: "10", name: "Bending", description: "Sheet metal forming and precision shaping" },
        { number: "11", name: "Tool & Part Manufacturing", description: "Custom tooling and component production" },
        { number: "12", name: "High Production Manufacturing", description: "Scaled output for large-volume orders" },
      ],
    },
  ];

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              What We Do
            </h2>
            <p className="text-muted max-w-2xl mx-auto leading-relaxed">
              From precision CNC machining to industrial welding, we deliver
              manufacturing excellence across every discipline.
            </p>
          </div>
        </ScrollReveal>

        {/* Categories grid: 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {categories.map((category, catIndex) => (
            <ScrollReveal key={category.title} delay={catIndex * 200} direction="up">
              <div>
                {/* Category heading with underline */}
                <h3 className="text-sm font-semibold uppercase tracking-widest text-primary-600 mb-6 pb-3 border-b border-border">
                  {category.title}
                </h3>

                {/* Service list */}
                <ul className="space-y-5">
                  {category.services.map((service) => (
                    <li
                      key={service.number}
                      className="group cursor-default"
                    >
                      {/* Number + Name row */}
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs font-mono text-muted/50 tabular-nums">
                          {service.number}
                        </span>
                        <span className="text-base font-medium text-text-primary group-hover:text-primary-600 transition-colors duration-300">
                          {service.name}
                        </span>
                      </div>
                      {/* Description */}
                      <p className="text-sm text-muted leading-relaxed mt-1 pl-8">
                        {service.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
