"use client";

import { useState, useEffect } from "react";
import { CALENDAR_CONFIG } from "@/config/calender"; 

function formatDate(date: Date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

function formatTime12h(time: string) {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function AvailabilityPage() {
  const [selectedWeek, setSelectedWeek] = useState<"this_week" | "next_week">("this_week");
  const [selectedSlots, setSelectedSlots] = useState<{ date: string; start_time: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const getDaysForWeek = (offsetWeeks: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    const currentDay = today.getDay(); 
    const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday + (offsetWeeks * 7));

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        if (CALENDAR_CONFIG.workingDays.includes(d.getDay())) {
            if (offsetWeeks === 0 && d < today) continue;
            weekDays.push(d);
        }
    }
    return weekDays;
  };

  const displayedDays = selectedWeek === "this_week" ? getDaysForWeek(0) : getDaysForWeek(1);
  
  const timeSlots: string[] = [];
  for (let hour = CALENDAR_CONFIG.startHour; hour < CALENDAR_CONFIG.endHour; hour++) {
    for (let min = 0; min < 60; min += CALENDAR_CONFIG.intervalMins) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMin = min.toString().padStart(2, "0");
      timeSlots.push(`${formattedHour}:${formattedMin}:00`);
    }
  }

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/availability/`, {credentials: "include"});
        if (response.ok) {
          const data = await response.json();
          setSelectedSlots(data);
        }
      } catch (error) {
        console.error("Backend error:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  const toggleSlot = (dateStr: string, timeStr: string) => {
    setSaveMessage(""); 
    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.date === dateStr && s.start_time === timeStr);
      if (exists) {
        return prev.filter((s) => !(s.date === dateStr && s.start_time === timeStr));
      } else {
        return [...prev, { date: dateStr, start_time: timeStr }];
      }
    });
  };

  const handleSelectAll = () => {
    setSaveMessage("");
    setSelectedSlots((prev) => {
      const newSlots = [...prev];
      displayedDays.forEach((day) => {
        const dateStr = formatDate(day);
        timeSlots.forEach((time) => {
          if (!newSlots.some((s) => s.date === dateStr && s.start_time === time)) {
            newSlots.push({ date: dateStr, start_time: time });
          }
        });
      });
      return newSlots;
    });
  };

  const handleClearAll = () => {
    setSaveMessage("");
    setSelectedSlots((prev) => {
      const displayedDates = displayedDays.map(formatDate);
      return prev.filter((s) => !displayedDates.includes(s.date));
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/availability/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ slots: selectedSlots }),
      });
      if (response.ok) {
        setSaveMessage("Saved perfectly!");
        setTimeout(() => setSaveMessage(""), 3000); 
      } else {
        setSaveMessage("Error saving to database.");
      }
    } catch (error) {
      setSaveMessage("Offline: Could not reach backend.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl p-4 mx-auto md:p-8">
      
      {/* Header with Save Button docked at the top */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-6 border-b border-slate-200 gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            My Availability
          </h1>
          <p className="max-w-xl mt-2 text-slate-500">
            Select the times you are available to take consultation calls.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {saveMessage && (
            <span className={`text-sm font-medium ${saveMessage.includes("Error") || saveMessage.includes("Offline") ? "text-red-600" : "text-green-600"}`}>
              {saveMessage}
            </span>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-2.5 font-semibold text-white transition-all bg-blue-600 rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSaving ? "Saving..." : "Save Availability"}
          </button>
        </div>
      </div>

      {/* Constraints Bar: Week Toggle + Mass Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="flex p-1 bg-slate-100 rounded-lg shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setSelectedWeek("this_week")}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-all ${
              selectedWeek === "this_week" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedWeek("next_week")}
            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-all ${
              selectedWeek === "next_week" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Next Week
          </button>
        </div>

        {displayedDays.length > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button onClick={handleClearAll} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors">
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
        <div className="overflow-x-auto">
          {displayedDays.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50/50">
              No working days left in this week! Try checking Next Week.
            </div>
          ) : (
            <div className="min-w-[500px]">
              {/* Table Header: Dates */}
              <div className="flex border-b bg-slate-50/50 border-slate-200">
                <div className="w-24 p-4 font-medium text-slate-400">Time</div>
                {displayedDays.map((day, idx) => (
                  <div key={idx} className="flex-1 p-4 text-center border-l border-slate-100">
                    <div className="text-sm font-semibold text-slate-900">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Body: Time Slots */}
              {timeSlots.map((time, timeIdx) => (
                <div key={timeIdx} className="flex border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <div className="w-24 p-4 text-sm font-medium text-slate-500 flex items-center">
                    {formatTime12h(time)}
                  </div>
                  
                  {displayedDays.map((day, dayIdx) => {
                    const dateStr = formatDate(day);
                    const isSelected = selectedSlots.some(
                      (s) => s.date === dateStr && s.start_time === time
                    );

                    return (
                      <div key={dayIdx} className="flex-1 p-2 border-l border-slate-100 flex items-center justify-center">
                        <button
                          onClick={() => toggleSlot(dateStr, time)}
                          className={`w-[85%] py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            isSelected
                              ? "bg-blue-600 outline outline-2 outline-offset-2 outline-blue-600/30 text-white shadow-sm hover:bg-blue-700 focus:scale-95"
                              : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 focus:scale-95"
                          }`}
                        >
                          {isSelected ? "Available" : "Add"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
