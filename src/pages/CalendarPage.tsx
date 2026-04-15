import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addYears,
  subYears,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  set as setDate,
  parseISO,
} from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Unplug,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  source: "google" | "outlook";
}

type ViewMode = "today" | "month" | "year";
type CalendarProvider = "google" | "outlook" | null;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const HOUR_HEIGHT = 56;
const START_HOUR = 6;
const END_HOUR = 22;

function timeToTop(date: Date): number {
  const hours = date.getHours() + date.getMinutes() / 60;
  return (hours - START_HOUR) * HOUR_HEIGHT;
}

function formatHourLabel(h: number) {
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

const EVENT_COLORS = [
  "bg-primary/25 border-primary/50 text-primary",
  "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  "bg-amber-500/20 border-amber-500/40 text-amber-300",
  "bg-violet-500/20 border-violet-500/40 text-violet-300",
  "bg-rose-500/20 border-rose-500/40 text-rose-300",
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CalendarPage() {
  const [provider, setProvider] = useState<CalendarProvider>(() => {
    return (localStorage.getItem("cal-provider") as CalendarProvider) || null;
  });
  const [view, setView] = useState<ViewMode>("today");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  /* ---------- persist provider ---------- */
  useEffect(() => {
    if (provider) localStorage.setItem("cal-provider", provider);
    else localStorage.removeItem("cal-provider");
  }, [provider]);

  /* ---------- fetch events ---------- */
  const fetchEvents = useCallback(async () => {
    if (!provider) return;
    setLoading(true);
    try {
      let timeMin: string, timeMax: string;
      if (view === "today") {
        const d = startOfDay(currentDate);
        timeMin = d.toISOString();
        timeMax = new Date(d.getTime() + 86400000).toISOString();
      } else if (view === "month") {
        timeMin = startOfWeek(startOfMonth(currentDate)).toISOString();
        timeMax = endOfWeek(endOfMonth(currentDate)).toISOString();
      } else {
        timeMin = new Date(currentDate.getFullYear(), 0, 1).toISOString();
        timeMax = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      }

      const { data, error } = await supabase.functions.invoke("fetch-calendar-events", {
        body: { provider, timeMin, timeMax },
      });

      if (error) throw error;

      const parsed: CalendarEvent[] = (data?.events ?? []).map((e: any, i: number) => ({
        id: e.id || String(i),
        title: e.title || e.subject || "(No title)",
        start: new Date(e.start),
        end: new Date(e.end),
        allDay: e.allDay ?? false,
        color: EVENT_COLORS[i % EVENT_COLORS.length],
        source: provider,
      }));
      setEvents(parsed);
    } catch (err: any) {
      console.error("Calendar fetch error:", err);
      // If no connector is linked, show a helpful message
      if (err?.message?.includes("not configured") || err?.message?.includes("API_KEY")) {
        toast.error("Calendar not connected yet. Please connect via the connector.");
      } else {
        toast.error("Failed to load calendar events");
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [provider, view, currentDate]);

  useEffect(() => {
    if (provider) fetchEvents();
  }, [fetchEvents, provider]);

  // Auto-refresh every 5 min
  useEffect(() => {
    if (!provider) return;
    const id = setInterval(fetchEvents, 300_000);
    return () => clearInterval(id);
  }, [fetchEvents, provider]);

  /* ---------- connect / disconnect ---------- */
  const handleConnect = (p: "google" | "outlook") => {
    setProvider(p);
    toast.info(`${p === "google" ? "Google Calendar" : "Outlook Calendar"} selected. Fetching events…`);
  };

  const handleDisconnect = () => {
    setProvider(null);
    setEvents([]);
    toast.success("Calendar disconnected");
  };

  /* ---------- navigation ---------- */
  const goNext = () => {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (view === "year") setCurrentDate((d) => addYears(d, 1));
    else setCurrentDate((d) => addDays(d, 1));
  };
  const goPrev = () => {
    if (view === "month") setCurrentDate((d) => subMonths(d, 1));
    else if (view === "year") setCurrentDate((d) => subYears(d, 1));
    else setCurrentDate((d) => addDays(d, -1));
  };
  const goToday = () => setCurrentDate(new Date());

  /* ---------- month grid ---------- */
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days: Date[] = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [currentDate]);

  const eventsForDay = useCallback(
    (day: Date) => events.filter((e) => isSameDay(e.start, day)),
    [events]
  );

  /* ---------- year grid ---------- */
  const yearMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
  }, [currentDate]);

  /* ---------- day detail panel ---------- */
  const openDayDetail = (day: Date) => {
    setSelectedDay(day);
    setSelectedDayEvents(eventsForDay(day));
  };
  const closeDayDetail = () => {
    setSelectedDay(null);
    setSelectedDayEvents(null);
  };

  /* ================================================================ */
  /*  RENDER: Not connected                                            */
  /* ================================================================ */

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <CalendarIcon size={48} className="text-muted-foreground" />
        <h2 className="text-xl font-bold text-foreground">Connect Your Calendar</h2>
        <p className="text-sm text-muted-foreground max-w-sm text-center">
          Choose one to sync your events and tasks
        </p>
        <div className="flex gap-4">
          <Button
            onClick={() => handleConnect("google")}
            className="gap-2 bg-[#4285F4] hover:bg-[#3367d6] text-white"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Connect Google Calendar
          </Button>
          <Button
            onClick={() => handleConnect("outlook")}
            className="gap-2 bg-[#0078D4] hover:bg-[#106EBE] text-white"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.352.23-.578.23h-8.26v-6.08l1.1.913c.14.108.3.163.484.163s.345-.055.485-.163l6.247-5.203v-.004c.03-.02.06-.03.078-.043a.15.15 0 01.07-.023.21.21 0 01.15.062.19.19 0 01.062.15l-.001-.056zM23.48 5.84a.48.48 0 01-.102.07l-7.3 6.073-1.154.962V5.329h8.026c.236 0 .384.085.452.254a.45.45 0 01.08.257h-.002zM13.424 5.33v13.342H1.276C.91 18.67.604 18.54.362 18.3.12 18.058 0 17.755 0 17.394V6.606c0-.362.12-.665.362-.906.242-.24.548-.362.914-.362h12.148v-.009zm-3.08 3.31c-.728-.4-1.558-.6-2.49-.6-.95 0-1.79.204-2.52.61-.73.408-1.3.973-1.71 1.696-.408.723-.613 1.54-.613 2.452 0 .87.195 1.657.585 2.36.39.705.94 1.257 1.65 1.655.71.4 1.52.598 2.43.598.983 0 1.84-.2 2.57-.602.73-.4 1.296-.96 1.696-1.68.4-.72.6-1.535.6-2.448 0-.917-.2-1.74-.6-2.468-.4-.728-.97-1.296-1.7-1.697l.103.124zm-.86 6.45c-.48.53-1.1.794-1.87.794-.533 0-1.003-.13-1.41-.39-.41-.26-.723-.627-.944-1.1-.22-.473-.33-1.016-.33-1.63 0-.6.11-1.14.332-1.618.22-.478.537-.85.947-1.117.41-.267.885-.4 1.424-.4.533 0 1 .13 1.4.393.4.263.71.635.93 1.117.22.482.33 1.035.33 1.66 0 .84-.26 1.518-.79 2.052v.238h-.02z" />
            </svg>
            Connect Outlook Calendar
          </Button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER: Connected                                                */
  /* ================================================================ */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Calendar</h1>
          <span className="text-[10px] px-2 py-0.5 rounded bg-primary/15 text-primary font-medium uppercase">
            {provider === "google" ? "Google" : "Outlook"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-muted/50 rounded-lg p-0.5">
            {(["today", "month", "year"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-colors uppercase tracking-wide",
                  view === v
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}>
              <ChevronLeft size={14} />
            </Button>
            <button
              onClick={goToday}
              className="text-xs font-medium text-muted-foreground hover:text-foreground px-2"
            >
              Today
            </button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext}>
              <ChevronRight size={14} />
            </Button>
          </div>

          {/* Disconnect */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1"
            onClick={handleDisconnect}
          >
            <Unplug size={12} /> Disconnect
          </Button>
        </div>
      </div>

      {/* Date label */}
      <p className="text-sm text-muted-foreground -mt-2">
        {view === "today" && format(currentDate, "EEEE, MMMM d, yyyy")}
        {view === "month" && format(currentDate, "MMMM yyyy")}
        {view === "year" && format(currentDate, "yyyy")}
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Loading events…
        </div>
      )}

      {/* -------- TODAY VIEW -------- */}
      {view === "today" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-y-auto max-h-[600px]">
            <div className="relative" style={{ height: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
              {/* Hour lines */}
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR).map(
                (h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/30 flex"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  >
                    <span className="text-[10px] text-muted-foreground w-14 pl-2 -translate-y-2 shrink-0">
                      {formatHourLabel(h)}
                    </span>
                  </div>
                )
              )}

              {/* Now line */}
              {isToday(currentDate) && (() => {
                const top = timeToTop(new Date());
                if (top < 0 || top > (END_HOUR - START_HOUR) * HOUR_HEIGHT) return null;
                return (
                  <div className="absolute left-14 right-0 z-20" style={{ top }}>
                    <div className="h-px bg-destructive/70" />
                    <div className="w-2 h-2 rounded-full bg-destructive -translate-y-1 -translate-x-1" />
                  </div>
                );
              })()}

              {/* Events */}
              {events.map((event, idx) => {
                if (event.allDay) return null;
                const top = Math.max(timeToTop(event.start), 0);
                const bottom = timeToTop(event.end);
                const height = Math.max(bottom - top, 24);
                const colorClass = event.color || EVENT_COLORS[idx % EVENT_COLORS.length];

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-16 right-4 rounded-md border px-2 py-1 cursor-pointer hover:shadow-md transition-shadow",
                      colorClass
                    )}
                    style={{ top, height }}
                    title={`${event.title}\n${format(event.start, "h:mm a")} – ${format(event.end, "h:mm a")}`}
                  >
                    <p className="text-[11px] font-medium truncate">{event.title}</p>
                    <p className="text-[9px] opacity-70">
                      {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                    </p>
                  </div>
                );
              })}

              {/* All-day events */}
              {events.filter((e) => e.allDay).length > 0 && (
                <div className="absolute top-0 left-16 right-4 flex flex-wrap gap-1 p-1 bg-muted/30 rounded-b-md">
                  {events
                    .filter((e) => e.allDay)
                    .map((e) => (
                      <span
                        key={e.id}
                        className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-medium"
                      >
                        {e.title}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>

          {!loading && events.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No events today
            </div>
          )}
        </div>
      )}

      {/* -------- MONTH VIEW -------- */}
      {view === "month" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-[10px] font-semibold text-muted-foreground text-center py-2">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const dayEvents = eventsForDay(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => openDayDetail(day)}
                  className={cn(
                    "relative h-20 border-b border-r border-border/30 p-1 text-left transition-colors hover:bg-muted/30",
                    !inMonth && "opacity-30"
                  )}
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                      today && "bg-primary text-primary-foreground font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <div
                        key={e.id}
                        className="w-full truncate text-[9px] px-1 py-px rounded bg-primary/15 text-primary"
                      >
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* -------- YEAR VIEW -------- */}
      {view === "year" && (
        <div className="grid grid-cols-3 gap-4">
          {yearMonths.map((month) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const weekStart = startOfWeek(monthStart);
            const weekEnd = endOfWeek(monthEnd);
            const days: Date[] = [];
            let d = weekStart;
            while (d <= weekEnd) {
              days.push(d);
              d = addDays(d, 1);
            }
            const monthEvents = events.filter(
              (e) => e.start >= monthStart && e.start <= monthEnd
            );
            const isCurrent = isSameMonth(month, new Date());

            return (
              <button
                key={month.toISOString()}
                onClick={() => {
                  setCurrentDate(month);
                  setView("month");
                }}
                className={cn(
                  "bg-card border rounded-xl p-3 text-left transition-colors hover:border-primary/50",
                  isCurrent ? "border-primary/60" : "border-border"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-foreground">
                    {format(month, "MMMM")}
                  </span>
                  {monthEvents.length > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                      {monthEvents.length}
                    </span>
                  )}
                </div>

                {/* Mini calendar */}
                <div className="grid grid-cols-7 gap-px">
                  {["S", "M", "T", "W", "T", "F", "S"].map((wd, i) => (
                    <span key={i} className="text-[7px] text-muted-foreground text-center">
                      {wd}
                    </span>
                  ))}
                  {days.map((day) => {
                    const inMonth = isSameMonth(day, month);
                    const today = isToday(day);
                    const hasEvent = monthEvents.some((e) => isSameDay(e.start, day));
                    return (
                      <span
                        key={day.toISOString()}
                        className={cn(
                          "text-[8px] text-center leading-4 rounded-sm",
                          !inMonth && "opacity-0",
                          today && "bg-primary text-primary-foreground font-bold",
                          hasEvent && !today && "bg-primary/20 text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* -------- DAY DETAIL PANEL (Month view click) -------- */}
      {selectedDay && selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl w-full max-w-md mx-4 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {format(selectedDay, "EEEE, MMMM d")}
              </h3>
              <button
                onClick={closeDayDetail}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events this day</p>
              ) : (
                selectedDayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start gap-3 p-2 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="w-1 h-8 rounded-full bg-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{e.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {e.allDay
                          ? "All day"
                          : `${format(e.start, "h:mm a")} – ${format(e.end, "h:mm a")}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
