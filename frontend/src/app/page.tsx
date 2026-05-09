import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsStrip from "@/components/StatsStrip";
import Services from "@/components/Services";
import Process from "@/components/Process";
import TrackOrder from "@/components/TrackOrder";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsStrip />
      <Services />
      {/* Thin separator between dark Services and dark Process */}
      <div className="h-px bg-white/8" />
      <Process />
      <TrackOrder />
      <div className="h-px bg-white/8" />
      <Footer />
    </>
  );
}
