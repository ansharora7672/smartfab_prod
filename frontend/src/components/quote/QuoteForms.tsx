// frontend/src/components/quote/QuoteForms.tsx
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

// ----------------------------------------
// STEP 1: COMPANY DETAILS FORM
// ----------------------------------------
export function CompanyDetailsForm({ formData, setFormData, onNext }: any) {
  return (
    <form onSubmit={onNext} className="w-full max-w-md mx-auto space-y-7 animate-in fade-in slide-in-from-right-8 duration-700 h-full flex flex-col justify-center">
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Name</label>
        <input required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})}
          type="text" placeholder="Enter your business name"
          className="w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Address</label>
        <input required value={formData.companyAddress} onChange={e => setFormData({...formData, companyAddress: e.target.value})}
          type="text" placeholder="HQ or Factory location"
          className="w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Full Name</label>
          <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})}
            type="text" placeholder="Your full name"
            className="w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number</label>
          <input required value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
            type="text" placeholder="+971 XX XXX XXXX"
            className="w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email Address</label>
        <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
          type="email" placeholder="you@company.com"
          className="w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all"
        />
      </div>

      <div className="pt-8">
          <button type="submit" className="group w-full md:w-auto bg-primary-600 hover:bg-primary-900 text-white px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 float-right shadow-[0_4px_20px_rgba(37,99,235,0.25)]">
            Proceed to Booking <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
      </div>
    </form>
  );
}

// ----------------------------------------
// STEP 2: BOOKING CALENDAR
// ----------------------------------------
export function BookingCalendar({ 
  workingDays, timeSlots, selectedDate, setSelectedDate, 
  selectedTimeBackend, setSelectedTimeBackend, availableSlots, onConfirm, isSubmitting, error 
}: any) {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-10 animate-in fade-in slide-in-from-right-8 duration-700 h-full py-4">
      {/* Dates Column */}
      <div className="flex-1 flex flex-col h-[500px]">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Select a Date</h3>
          <div className="flex-1 overflow-y-auto pr-3 space-y-3 custom-scrollbar">
            {workingDays.map((date: Date, idx: number) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              return (
                <button key={idx} onClick={() => { setSelectedDate(date); setSelectedTimeBackend(""); }}
                  className={`w-full px-5 py-4 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 ${isSelected ? "bg-primary-900 border-primary-900 text-white shadow-xl shadow-primary-900/10 scale-[1.02]" : "bg-white border-border text-text-primary hover:border-primary-600/50 hover:bg-section-bg/30"}`}
                >
                  <span className="font-semibold text-sm">
                    {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  {isSelected && <Check className="w-5 h-5 text-primary-100" />}
                </button>
              )
            })}
          </div>
      </div>

      {/* Timeslots Column */}
      <div className="flex-1 flex flex-col h-[500px]">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Select a Time</h3>
        
        {!selectedDate ? (
          <div className="flex-1 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted/60 text-sm px-6 text-center bg-section-bg/20">
            Select a date to reveal time availability.
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-3 grid grid-cols-2 gap-3 custom-scrollbar content-start">
                {timeSlots.map((slot: any, idx: number) => {
                  const isSelected = selectedTimeBackend === slot.backend;
                  const localDateStr = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                  const isAvailable = availableSlots[localDateStr]?.includes(slot.backend);

                  if (!isAvailable) {
                    return (
                      <button key={idx} disabled className="px-3 py-3 rounded-xl border bg-section-bg/40 border-border/60 text-muted/30 cursor-not-allowed flex flex-col items-center justify-center h-[70px]">
                        <span className="font-semibold text-sm tracking-wide line-through decoration-muted/40">{slot.display}</span>
                        <span className="text-[9px] uppercase font-bold tracking-widest mt-1 opacity-50">Full</span>
                      </button>
                    );
                  }

                  return (
                    <button key={idx} onClick={() => setSelectedTimeBackend(slot.backend)}
                      className={`px-3 py-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center h-[70px] ${isSelected ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105" : "bg-white border-border text-text-secondary hover:border-primary-600/50 hover:text-text-primary"}`}
                    >
                      <span className="font-semibold text-sm tracking-wide">{slot.display}</span>
                    </button>
                  )
                })}
            </div>

            {/* Sticky Bottom Confirm Area */}
            <div className="pt-6 mt-4 border-t border-border/60 shrink-0">
              {error && <p className="text-[11px] text-danger font-semibold mb-3 bg-danger-bg px-3 py-2 rounded-lg text-center tracking-widest uppercase">{error}</p>}
              <button onClick={onConfirm} disabled={isSubmitting || !selectedDate || !selectedTimeBackend}
                className="w-full bg-success hover:bg-[#15803d] disabled:bg-section-bg disabled:border border-border disabled:text-muted disabled:cursor-not-allowed disabled:shadow-none text-white px-8 py-4 rounded-xl text-sm font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(22,163,74,0.3)]"
              >
                {isSubmitting ? "Processing..." : "Confirm Booking"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------
// STEP 3: SUCCESS SCREEN
// ----------------------------------------
export function ConfirmationScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center pb-20">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-right-8 duration-700 text-center">
        <h2 className="text-5xl md:text-6xl font-heading font-black text-primary-900 mb-3 uppercase tracking-tight">THANKYOU</h2>
        <h3 className="text-[11px] font-bold text-text-secondary uppercase tracking-[0.3em] mb-10">WE'VE GOT YOUR REQUEST</h3>
        
        <p className="text-sm text-text-secondary leading-relaxed mb-12 p-8 bg-section-bg/40 rounded-3xl border border-border shadow-inner">
          You'll get a call from our expert team at your selected time slot. Please ensure you're available to discuss your project requirements in detail.
        </p>

        <Link href="/">
          <button className="bg-primary-600 hover:bg-primary-900 text-white px-12 py-4 rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_4px_20px_rgba(37,99,235,0.3)] uppercase tracking-widest">
            Return Home
          </button>
        </Link>
      </div>
    </div>
  );
}
