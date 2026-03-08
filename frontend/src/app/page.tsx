// This is a React component. In Next.js, every page.tsx exports a function
// that returns JSX (HTML-like syntax inside JavaScript/TypeScript)
export default function HomePage() {
  return (
    // "main" is a semantic HTML tag meaning "main content of the page"
    // Tailwind classes:
    //   min-h-screen = take up at least the full screen height
    //   flex flex-col = stack children vertically
    //   items-center = center horizontally
    //   justify-center = center vertically
    //   px-6 = 24px padding on left and right
    <main className="min-h-screen flex flex-col items-center justify-center px-6">

      {/* Main heading — uses Plus Jakarta Sans automatically (from globals.css) */}
      {/* text-5xl = 48px, font-bold = weight 700, text-primary-900 = dark navy */}
      <h1 className="font-heading text-5xl font-bold tracking-tight text-primary-900 mb-4">
        SmartFab Lathe
      </h1>

      {/* Description paragraph */}
      {/* text-lg = 18px, text-muted = gray (#64748B), max-w-xl = max width so text doesn't stretch too wide */}
      <p className="text-lg text-muted max-w-xl text-center leading-relaxed">
        Precision manufacturing services in Dubai. CNC milling, turning,
        laser cutting, and more — from quote to delivery.
      </p>

      {/* Button container — flex = horizontal row, gap-4 = 16px space between buttons */}
      <div className="mt-10 flex gap-4">

        {/* PRIMARY BUTTON (blue, filled) */}
        {/* bg-primary-600 = blue background */}
        {/* rounded-2xl = very rounded corners (16px) */}
        {/* transition-all duration-500 ease-out = smooth 500ms animation on hover */}
        {/* hover:bg-primary-900 = darken on hover */}
        <button className="bg-primary-600 text-white px-8 py-3 rounded-2xl font-medium transition-all duration-500 ease-out hover:bg-primary-900 hover:shadow-lg">
          Get a Quote
        </button>

        {/* SECONDARY BUTTON (outlined, no fill) */}
        {/* border border-border = 1px gray border */}
        {/* hover:bg-section-bg = light gray background on hover */}
        <button className="border border-border text-text-primary px-8 py-3 rounded-2xl font-medium transition-all duration-500 ease-out hover:bg-section-bg hover:shadow-lg">
          Track Your Order
        </button>
      </div>
    </main>
  );
}
