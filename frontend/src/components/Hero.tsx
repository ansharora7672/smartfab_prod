// Hero is purely visual — no interactivity needed, so NO "use client"
// This makes it a SERVER COMPONENT = renders on server = better SEO
// (Google sees the actual HTML content, not a blank page waiting for JS)
import Image from "next/image";

export default function Hero() {
  return (
    // SECTION: full viewport height, relative positioning for the background image overlay
    // "relative" → lets us position the dark overlay absolutely on top of the image
    // "min-h-screen" → at least full viewport height
    // "flex items-center justify-center" → center content both ways
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">


      {/* BACKGROUND IMAGE — fills the entire section */}
      {/* "fill" makes next/image cover the entire parent (like background-image: cover) */}
      {/* "priority" tells Next.js to load this image FIRST (it's above the fold) */}
      <Image
        src="/images/hero-bg.png"
        alt="CNC machining in action"
        fill
        priority
        className="object-cover"
        quality={90}
      />

      {/* DARK OVERLAY — sits on top of image to make text readable */}
      {/* absolute inset-0 → covers the entire parent */}
      {/* bg-primary-900/80 → our dark navy (#1E3A8A) at 80% opacity */}
      {/* This creates the "cinematic" moody dark look */}
      <div className="absolute inset-0 bg-primary-900/80" />

      {/* GRADIENT FADE at bottom — smooth transition to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />

      {/* CONTENT — sits on top of the overlay (z-10 pushes it above) */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-24 text-center">


        {/* HEADLINE */}
        {/* text-5xl md:text-7xl → 48px on mobile, 72px on desktop */}
        {/* leading-[1.1] → very tight line height for dramatic headlines */}
        <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1] mb-6">

          Engineering Accuracy.
          <br />
          {/* text-primary-100 → light blue accent on second line for visual hierarchy */}
          <span className="text-primary-100">Crafted in Metal.</span>
        </h1>

        {/* SUBTITLE */}
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
          Precision manufacturing services for industries across the UAE.
          <br />From concept to delivery, we bring your designs to life.

        </p>

        {/* CTA BUTTONS */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* PRIMARY CTA */}
          <a
            href="#quote"
            className="w-full sm:w-auto text-center bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-medium text-base transition-all duration-500 ease-out hover:bg-white hover:text-primary-900 hover:shadow-xl"
          >
            Get a Quote
          </a>

          {/* SECONDARY CTA — glass outline style */}
          <a
            href="#track"
            className="w-full sm:w-auto text-center border border-white/30 text-white px-8 py-3.5 rounded-2xl font-medium text-base transition-all duration-500 ease-out hover:bg-white/10 hover:border-white/60"
          >
            Track Your Order
          </a>
        </div>
      </div>

      {/* SCROLL INDICATOR — animated bouncing chevron */}
      {/* absolute bottom-8 → positioned near bottom of hero */}
<a href="#services" className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce cursor-pointer">
  <svg
    className="w-6 h-6 text-white/50"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
</a>

    </section>
  );
}
