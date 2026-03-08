// Simple visual separator — shows capability breadth without fake numbers

export default function PositioningStrip() {
  // Capabilities listed as data — easy to add/remove later
  const capabilities = [
    "Precision CNC",
    "Advanced Welding",
    "Laser Cutting",
    "End-to-End Delivery",
  ];

  return (
    // py-8 → 32px vertical padding (compact strip, not a full section)
    // bg-section-bg → light gray #F1F5F9
    // border-y border-border → thin line top AND bottom
    <section className="py-8 bg-section-bg border-y border-border">
      <div className="max-w-7xl mx-auto px-6">
        {/* flex-wrap → wraps to next line on mobile instead of overflowing */}
        <div className="flex items-center justify-center flex-wrap gap-x-8 gap-y-2">
          {capabilities.map((item, index) => (
            <div key={item} className="flex items-center gap-8">
              <span className="text-sm font-medium tracking-widest uppercase text-muted">
                {item}
              </span>
              {/* Show dot separator between items, but not after the last one */}
              {index < capabilities.length - 1 && (
                <span className="hidden sm:block w-1.5 h-1.5 rounded-full bg-primary-600" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
