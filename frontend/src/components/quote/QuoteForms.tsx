"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ----------------------------------------
// STEP 1: COMPANY DETAILS FORM
// ----------------------------------------
export function CompanyDetailsForm({ formData, setFormData, onNext }: any) {
  const [countryCode, setCountryCode] = useState("+971");
  const [localNumber, setLocalNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(data: typeof formData, local: string) {
    const errs: Record<string, string> = {};
    if (data.companyName.trim().length < 2) errs.companyName = "Please enter your company name.";
    if (data.companyAddress.trim().length < 3) errs.companyAddress = "Please enter a valid address.";
    if (data.fullName.trim().length < 2) errs.fullName = "Please enter your full name.";
    const digits = local.replace(/\s/g, "");
    if (!digits || digits.length < 7 || !/^\d+$/.test(digits)) errs.phoneNumber = "Enter a valid phone number (digits only).";
    if (!validateEmail(data.email)) errs.email = "Enter a valid email address.";
    return errs;
  }

  function handleBlur(field: string) {
    setTouched(p => ({ ...p, [field]: true }));
    const errs = validate({ ...formData, phoneNumber: `${countryCode} ${localNumber}` }, localNumber);
    setErrors(errs);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const combined = `${countryCode} ${localNumber}`.trim();
    const newData = { ...formData, phoneNumber: combined };
    const errs = validate(newData, localNumber);
    setErrors(errs);
    setTouched({ companyName: true, companyAddress: true, fullName: true, phoneNumber: true, email: true });
    if (Object.keys(errs).length === 0) {
      setFormData(newData);
      onNext(e);
    }
  }

  const inputBase = "w-full px-5 py-3.5 bg-section-bg/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/20 focus:bg-white text-text-primary transition-all";
  const inputErr = "border-red-400 focus:ring-red-400/20";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-7 animate-in fade-in slide-in-from-right-8 duration-700 py-8 md:py-0 md:h-full md:flex md:flex-col md:justify-center">

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Name</label>
        <input
          value={formData.companyName}
          onChange={e => setFormData({ ...formData, companyName: e.target.value })}
          onBlur={() => handleBlur("companyName")}
          type="text"
          placeholder="Acme Industries"
          className={`${inputBase} ${touched.companyName && errors.companyName ? inputErr : ""}`}
        />
        {touched.companyName && errors.companyName && (
          <p className="text-[11px] text-red-500 font-medium">{errors.companyName}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Company Address</label>
        <input
          value={formData.companyAddress}
          onChange={e => setFormData({ ...formData, companyAddress: e.target.value })}
          onBlur={() => handleBlur("companyAddress")}
          type="text"
          placeholder="Dubai, UAE"
          className={`${inputBase} ${touched.companyAddress && errors.companyAddress ? inputErr : ""}`}
        />
        {touched.companyAddress && errors.companyAddress && (
          <p className="text-[11px] text-red-500 font-medium">{errors.companyAddress}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Full Name</label>
          <input
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            onBlur={() => handleBlur("fullName")}
            type="text"
            placeholder="John Smith"
            className={`${inputBase} ${touched.fullName && errors.fullName ? inputErr : ""}`}
          />
          {touched.fullName && errors.fullName && (
            <p className="text-[11px] text-red-500 font-medium">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Phone Number</label>
          <div className={`flex items-center bg-section-bg/30 border rounded-xl overflow-hidden transition-all focus-within:ring-2 focus-within:bg-white ${touched.phoneNumber && errors.phoneNumber ? "border-red-400 focus-within:ring-red-400/20" : "border-border focus-within:ring-primary-600/20"}`}>
            <input
              value={countryCode}
              onChange={e => {
                setCountryCode(e.target.value);
                setFormData({ ...formData, phoneNumber: `${e.target.value} ${localNumber}` });
              }}
              onBlur={() => handleBlur("phoneNumber")}
              aria-label="Country code"
              className="w-14 px-3 py-3.5 bg-transparent text-sm font-mono text-text-primary focus:outline-none text-center shrink-0"
              placeholder="+971"
            />
            <span className="h-5 w-px bg-border shrink-0" />
            <input
              value={localNumber}
              onChange={e => {
                const val = e.target.value.replace(/[^\d\s]/g, "");
                setLocalNumber(val);
                setFormData({ ...formData, phoneNumber: `${countryCode} ${val}` });
              }}
              onBlur={() => handleBlur("phoneNumber")}
              type="tel"
              aria-label="Phone number"
              placeholder="50 123 4567"
              className="flex-1 px-3 py-3.5 bg-transparent text-sm font-mono text-text-primary focus:outline-none"
            />
          </div>
          {touched.phoneNumber && errors.phoneNumber && (
            <p className="text-[11px] text-red-500 font-medium">{errors.phoneNumber}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-bold text-muted uppercase tracking-widest">Email Address</label>
        <input
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          onBlur={() => handleBlur("email")}
          type="email"
          placeholder="you@company.com"
          className={`${inputBase} ${touched.email && errors.email ? inputErr : ""}`}
        />
        {touched.email && errors.email && (
          <p className="text-[11px] text-red-500 font-medium">{errors.email}</p>
        )}
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
    <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10 animate-in fade-in slide-in-from-right-8 duration-700 md:h-full py-4 pb-8 md:pb-4">
      {/* Dates Column */}
      <div className="flex flex-col md:flex-1 md:h-125">
          <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Select a Date</h3>
          <div className="pr-3 space-y-3 custom-scrollbar md:flex-1 md:overflow-y-auto">
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
      <div className="flex flex-col md:flex-1 md:h-125">
        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-4">Select a Time</h3>

        {!selectedDate ? (
          <div className="flex-1 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted/60 text-sm px-6 text-center bg-section-bg/20">
            Select a date to reveal time availability.
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="pr-3 grid grid-cols-2 gap-3 custom-scrollbar content-start md:flex-1 md:overflow-y-auto">
                {timeSlots.map((slot: any, idx: number) => {
                  const isSelected = selectedTimeBackend === slot.backend;
                  // Build date string from LOCAL date parts to avoid UTC midnight shift
                  // (subtracting timezoneOffset on a midnight-local Date shifts it to yesterday in UTC+)
                  const y = selectedDate.getFullYear();
                  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const d = String(selectedDate.getDate()).padStart(2, '0');
                  const localDateStr = `${y}-${m}-${d}`;
                  const isAvailable = availableSlots[localDateStr]?.includes(slot.backend);

                  const isToday = selectedDate.toDateString() === new Date().toDateString();
                  if (isToday) {
                    const now = new Date();
                    const [slotHour, slotMin] = slot.backend.split(':').map(Number);
                    if (slotHour < now.getHours() || (slotHour === now.getHours() && slotMin <= now.getMinutes())) {
                      return null;
                    }
                  }

                  if (!isAvailable) {
                    return (
                      <button key={idx} disabled className="px-3 py-3 rounded-xl border bg-section-bg/40 border-border/60 text-muted/30 cursor-not-allowed flex flex-col items-center justify-center h-17.5">
                        <span className="font-semibold text-sm tracking-wide line-through decoration-muted/40">{slot.display}</span>
                        <span className="text-[9px] uppercase font-bold tracking-widest mt-1 opacity-50">Full</span>
                      </button>
                    );
                  }

                  return (
                    <button key={idx} onClick={() => setSelectedTimeBackend(slot.backend)}
                      className={`px-3 py-3 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center h-17.5 ${isSelected ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105" : "bg-white border-border text-text-secondary hover:border-primary-600/50 hover:text-text-primary"}`}
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
    <div className="w-full min-h-[60vh] md:h-full flex items-center justify-center py-16 md:pb-20 md:pt-0">
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
