import ScrollReveal from "./ScrollReveal";

export default function Process() {
  const steps = [
    {
      number: "01",
      title: "Share Your Requirements",
      description: "Tell us what you need manufactured. Share specs, or describe your project.",
    },
    {
      number: "02",
      title: "Consult With Our Team",
      description: "We schedule a consultation to discuss materials, tolerances, timeline, and pricing.",
    },
    {
      number: "03",
      title: "Precision Manufacturing",
      description: "Our team brings your designs to life with state-of-the-art equipment and rigorous quality control.",
    },
    {
      number: "04",
      title: "Quality Delivery",
      description: "Every piece is inspected, packaged, and delivered to your door with real-time tracking.",
    },
  ];

  return (
    <section id="process" className="py-24 bg-section-bg">
      <div className="max-w-7xl mx-auto px-6">

        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-900 mb-4">
              How It Works
            </h2>
            <p className="text-muted max-w-2xl mx-auto leading-relaxed">
             From your first inquiry to final delivery. A streamlined process
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 200} direction="up">
              <div className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-border" />
                )}

                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-600 text-white font-heading font-bold text-sm mb-4">
                    {step.number}
                  </div>

                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
