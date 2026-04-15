const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_GATEWAY = "https://connector-gateway.lovable.dev/google_calendar";
const OUTLOOK_GATEWAY = "https://connector-gateway.lovable.dev/microsoft_outlook";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { provider, timeMin, timeMax } = await req.json();

    if (!provider || !timeMin || !timeMax) {
      return new Response(
        JSON.stringify({ error: "Missing provider, timeMin, or timeMax" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let events: any[] = [];

    if (provider === "google") {
      const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CALENDAR_API_KEY");
      if (!GOOGLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Google Calendar connector not configured. Please connect Google Calendar." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "250",
      });

      const res = await fetch(
        `${GOOGLE_GATEWAY}/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": GOOGLE_API_KEY,
          },
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Google Calendar API failed [${res.status}]: ${body}`);
      }

      const data = await res.json();
      events = (data.items || []).map((item: any) => ({
        id: item.id,
        title: item.summary || "(No title)",
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        allDay: !item.start?.dateTime,
      }));
    } else if (provider === "outlook") {
      const OUTLOOK_API_KEY = Deno.env.get("MICROSOFT_OUTLOOK_API_KEY");
      if (!OUTLOOK_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Outlook connector not configured. Please connect Outlook." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        startDateTime: timeMin,
        endDateTime: timeMax,
        $top: "250",
        $orderby: "start/dateTime",
      });

      const res = await fetch(
        `${OUTLOOK_GATEWAY}/v1.0/me/calendarview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": OUTLOOK_API_KEY,
            Prefer: 'outlook.timezone="UTC"',
          },
        }
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Outlook Calendar API failed [${res.status}]: ${body}`);
      }

      const data = await res.json();
      events = (data.value || []).map((item: any) => ({
        id: item.id,
        title: item.subject || "(No title)",
        start: item.start?.dateTime,
        end: item.end?.dateTime,
        allDay: item.isAllDay ?? false,
      }));
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid provider. Use 'google' or 'outlook'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ events }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("fetch-calendar-events error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
