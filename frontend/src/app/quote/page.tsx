// frontend/src/app/quote/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ArrowLeft } from "lucide-react";
import { CALENDAR_CONFIG } from "@/config/calender";
import { CompanyDetailsForm, BookingCalendar, ConfirmationScreen } from "@/components/quote/QuoteForms";

function getNextWorkingDays() {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilThisSaturday = 6 - today.getDay();
  const maxDaysToLookAhead = daysUntilThisSaturday + 7;
  for (let i = 0; i <= maxDaysToLookAhead; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (CALENDAR_CONFIG.workingDays.includes(d.getDay())) dates.push(d);
  }
  return dates;
}

function generateTimeSlots() {
  const slots = [];
  for (let hour = CALENDAR_CONFIG.startHour; hour < CALENDAR_CONFIG.endHour; hour++) {
    for (let min = 0; min < 60; min += CALENDAR_CONFIG.intervalMins) {
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const formattedMin = min.toString().padStart(2, "0");
      const backendHour = hour.toString().padStart(2, "0");
      slots.push({ display: `${displayHour}:${formattedMin} ${ampm}`, backend: `${backendHour}:${formattedMin}:00` });
    }
  }
  return slots;
}

export default function QuotePage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({ companyName: "", companyAddress: "", fullName: "", phoneNumber: "+971 ", email: "" });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeBackend, setSelectedTimeBackend] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Record<string, string[]>>({});

  const workingDays = getNextWorkingDays();
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    if (step === 2) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/tickets/available-slots`)
        .then(res => res.json())
        .then(data => setAvailableSlots(data))
        .catch(() => {});
    }
  }, [step]);

  const handleNextStep = (e: React.FormEvent) => { e.preventDefault(); setStep(2); };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedTimeBackend) return;
    setIsSubmitting(true); setError("");

    const localDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/tickets/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formData.fullName, company_name: formData.companyName, company_address: formData.companyAddress,
          email: formData.email, phone_number: formData.phoneNumber, consultation_date: localDate, consultation_time: selectedTimeBackend,
        }),
      });

      if (!response.ok) {
         const errData = await response.json();
         setError(errData.detail?.[0]?.msg || errData.detail || "Validation failed.");
         setIsSubmitting(false); return;
      }
      setStep(3);
    } catch (err) { setError("Network error. Please try again."); setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen md:h-screen w-full md:w-screen md:overflow-hidden bg-section-bg flex flex-col font-sans relative">
      
      {/* LOCKED HEADER */}
      <header className="h-[80px] shrink-0 bg-white border-b border-border px-6 md:px-10 flex items-center justify-between z-50">
        <Link href="/" className="flex items-center gap-4">
          <Image src="/SmartFab_FinalLogo.png" alt="SmartFab" width={72} height={72} className="object-contain" />
          <div className="flex flex-col items-center leading-none">
            <span className="font-heading font-bold text-lg tracking-[0.2em] text-primary-900">SMARTFAB</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="block w-4 h-px bg-primary-900/40" />
              <span className="font-heading font-semibold text-[10px] tracking-[0.3em] text-primary-900">LATHE</span>
              <span className="block w-4 h-px bg-primary-900/40" />
            </div>
          </div>
        </Link>
        
        {/* Step Tracker Indicator */}
        <div className="hidden md:flex items-center gap-3 text-[10px] font-bold tracking-widest text-muted uppercase">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary-900" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>1</div> COMPANY DETAILS
          </div>
          <span className="w-8 h-px bg-border"></span>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary-900" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>2</div> BOOKING
          </div>
          <span className="w-8 h-px bg-border"></span>
          <div className={`flex items-center gap-2 ${step === 3 ? "text-primary-900" : ""}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>3</div> CONFIRMATION
          </div>
        </div>
        <div className="w-[100px]"></div>
      </header>

      {/* Mobile Step Indicator */}
      <div className="md:hidden flex items-center justify-center gap-3 py-3 border-b border-border bg-white text-[10px] font-bold tracking-widest text-muted uppercase shrink-0">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary-900" : ""}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 1 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>1</div>
          Details
        </div>
        <span className="w-5 h-px bg-border"></span>
        <div className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary-900" : ""}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${step >= 2 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>2</div>
          Booking
        </div>
        <span className="w-5 h-px bg-border"></span>
        <div className={`flex items-center gap-1.5 ${step === 3 ? "text-primary-900" : ""}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${step === 3 ? "bg-primary-900 text-white" : "bg-border text-white"}`}>3</div>
          Confirm
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 lg:p-12 flex items-start md:items-center justify-center md:overflow-hidden">
        <div className="bg-white w-full max-w-6xl md:h-full md:max-h-212.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl md:rounded-3xl flex flex-col md:flex-row border border-border/80 overflow-hidden relative">
          
          {/* STATIC LEFT SIDEBAR */}
          <div className="hidden md:flex w-[35%] bg-primary-900 p-8 lg:p-12 flex-col justify-between text-white relative shrink-0">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary-600/10 to-transparent pointer-events-none" />
            <div className="relative z-10 w-full h-full flex flex-col">
              
              <div className="h-10">
                <button 
                  onClick={() => step === 2 && setStep(1)} 
                  className={`text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 hover:text-white transition-opacity ${step === 2 ? "opacity-70 hover:opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Details
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center pb-20">
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-3xl lg:text-5xl font-heading font-black leading-[1.1] mb-6">GET<br/>STARTED</h1>
                    <p className="text-primary-100/90 leading-relaxed text-sm mb-6 pr-4">Get the best precision engineering with our state-of-the-art industrial equipment.</p>
                    <p className="text-primary-100/50 leading-relaxed text-sm pr-4">We need your details so that we can contact you once you select the available time to chat.</p>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-3xl lg:text-5xl font-heading font-black leading-[1.1] mb-6">BOOK A<br/>CALL<br/>WITH US</h1>
                    <p className="text-primary-100/90 leading-relaxed text-sm mb-12 pr-4">Connect with our expert engineering team. Select a convenient time for your personalized consultation.</p>
                    <div className="space-y-8">
                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-success" /></div>
                        <div><h4 className="text-[11px] font-bold tracking-widest uppercase mb-1">Expert Advice</h4><p className="text-xs text-primary-100/50">Speak directly with lead engineers.</p></div>
                      </div>
                      <div className="flex gap-4 items-start">
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-success" /></div>
                        <div><h4 className="text-[11px] font-bold tracking-widest uppercase mb-1">30 Min Session</h4><p className="text-xs text-primary-100/50">Focused evaluation of your project requirements.</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="w-14 h-14 rounded-full bg-success flex items-center justify-center mb-10 shadow-[0_0_30px_rgba(22,163,74,0.3)]"><Check className="w-7 h-7 text-white" /></div>
                    <h1 className="text-3xl lg:text-5xl font-heading font-black leading-[1.1] mb-6">QUALITY<br/>ASSURED</h1>
                    <p className="text-primary-100/90 leading-relaxed text-sm pr-4">State-of-the-art equipment paired with precision engineering. You've made the right choice.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SCROLLABLE CONTAINER (THE FORMS) */}
          <div className="w-full md:w-[65%] md:h-full md:overflow-y-auto custom-scrollbar p-6 md:p-12 lg:p-16 relative bg-white">

            {/* Mobile page title */}
            <div className="md:hidden mb-6 pb-6 border-b border-border">
              <h1 className="text-2xl font-heading font-black text-primary-900 uppercase tracking-tight">Get a Quote</h1>
              <p className="text-xs text-muted mt-1">Fill in your details to book a consultation.</p>
            </div>

            {step === 1 && <CompanyDetailsForm formData={formData} setFormData={setFormData} onNext={handleNextStep} />}
            {step === 2 && <BookingCalendar workingDays={workingDays} timeSlots={timeSlots} selectedDate={selectedDate} setSelectedDate={setSelectedDate} selectedTimeBackend={selectedTimeBackend} setSelectedTimeBackend={setSelectedTimeBackend} availableSlots={availableSlots} onConfirm={handleConfirmBooking} isSubmitting={isSubmitting} error={error} />}
            {step === 3 && <ConfirmationScreen />}
          </div>
          
        </div>
      </main>
    </div>
  );
}
