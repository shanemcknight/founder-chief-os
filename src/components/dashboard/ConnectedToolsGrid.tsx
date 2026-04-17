import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

type Tool = {
  name: string;
  url: string;
  connected: boolean;
  icon: JSX.Element;
};

const ShopifyIcon = (
  <svg viewBox="0 0 109 124" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#95BF47"
      d="M74.7 14.8c-.1 0-1.7.5-4.3 1.3-2.6-7.5-7.2-14.4-15.3-14.4h-.7C52.1.6 49.2 0 46.6 0c-19.6 0-29 24.5-31.9 37C7 39.4 1.6 41.1 1 41.3c-4.3 1.3-4.4 1.5-5 5.5L0 124l68.5-12.9 36.5-7.9c0 .1-30.2-88.5-30.3-88.4zm-13.3 4l-7 2.2c0-1.6 0-3.2-.1-4.7 0-3.7-.5-6.8-1.4-9.2 4.2.5 7 5.3 8.5 11.7zm-12.7-7.9c1 2.4 1.6 5.9 1.6 10.5v.7l-14.5 4.5c2.8-10.7 8-15.9 12.9-15.7zm-5.1-4.4c.9 0 1.8.3 2.7.9-6.4 3-13.3 10.6-16.2 25.8l-11.5 3.6C22.1 24.7 30.1 6.5 43.6 6.5z"
    />
    <path
      fill="#5E8E3E"
      d="M107.7 39.4c-.5 0-23-1.7-23-1.7s-15.3-15.2-17-16.8c-.6-.6-1.4-.9-2.2-1L60 124l45-9.7s-7-87.7-7.3-91.6v16.7z"
    />
    <path
      fill="#FFF"
      d="M55 43.7l-5.5 16.5s-4.9-2.6-10.8-2.6c-8.7 0-9.1 5.5-9.1 6.8 0 7.5 19.6 10.4 19.6 28-.1 13.9-8.9 22.8-20.6 22.8-14.1 0-21.3-8.8-21.3-8.8l3.8-12.5s7.4 6.4 13.7 6.4c4.1 0 5.8-3.2 5.8-5.6 0-9.8-16.1-10.2-16.1-26.3 0-13.6 9.8-26.8 29.4-26.8 7.5 0 11.1 2.1 11.1 2.1z"
    />
  </svg>
);

const QuickBooksIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2CA01C" />
    <path
      fill="#FFF"
      d="M9 11.5h7.5v2H11v5h2.5v2H9v-9zm14 9h-7.5v-2H21v-5h-2.5v-2H23v9z"
    />
  </svg>
);

const GmailIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22 6.5v11a1.5 1.5 0 01-1.5 1.5H18V8.5L12 13 6 8.5V19H3.5A1.5 1.5 0 012 17.5v-11l1.4-1L12 12l8.6-6.5L22 6.5z"/>
    <path fill="#34A853" d="M2 6.5L12 14 22 6.5v11a1.5 1.5 0 01-1.5 1.5H18V8.5L12 13 6 8.5V19H3.5A1.5 1.5 0 012 17.5v-11z" opacity=".1"/>
    <path fill="#EA4335" d="M2 6.5L12 14l10-7.5V5a2 2 0 00-2-2 2 2 0 00-1.2.4L12 8.5 5.2 3.4A2 2 0 004 3a2 2 0 00-2 2v1.5z"/>
    <path fill="#FBBC04" d="M22 5v1.5L12 14 2 6.5V5a2 2 0 012-2 2 2 0 011.2.4L12 8.5l6.8-5.1A2 2 0 0120 3a2 2 0 012 2z" opacity=".3"/>
  </svg>
);

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#0A66C2"
      d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 013.37-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 11.01-4.13 2.06 2.06 0 01-.01 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z"
    />
  </svg>
);

const KlaviyoIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#000"
      d="M16 4L2 12.5l3.5 2.2C8.4 11.4 12 9.5 16 9.5s7.6 1.9 10.5 5.2L30 12.5 16 4zm0 9c-3 0-5.7 1.4-7.5 3.6L16 21l7.5-4.4C21.7 14.4 19 13 16 13zm-5 8.5l5 3 5-3-5 6.5-5-6.5z"
    />
  </svg>
);

const ShipStationIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#0072CE" />
    <path
      fill="#FFF"
      d="M8 11h12l-2 4h-8v2h7l-1 2H9v3h11l-1 2H7l3-13h-2zm14 4l3-2 1 6-3 2-1-6z"
    />
  </svg>
);

const ApolloIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#1B2DFF" />
    <path
      fill="#FFF"
      d="M16 6l8 18h-3.5l-1.5-3.5h-6L11.5 24H8L16 6zm0 6.5L13.7 18h4.6L16 12.5z"
    />
  </svg>
);

const AmazonIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#FF9900"
      d="M19.5 18c-2 1.5-5 2.3-7.5 2.3-3.5 0-6.7-1.3-9.1-3.5-.2-.2 0-.4.2-.3 2.6 1.5 5.8 2.4 9.1 2.4 2.2 0 4.7-.5 7-1.4.3-.1.6.2.3.5z"
    />
    <path
      fill="#FF9900"
      d="M20.5 16.8c-.3-.3-1.7-.2-2.4-.1-.2 0-.2-.2 0-.3 1.1-.8 3-.6 3.2-.3.2.3-.1 2.2-1.1 3.1-.2.2-.3.1-.3-.1.3-.7.9-2 .6-2.3z"
    />
    <path
      fill="#000"
      d="M18.2 7.7V6.8c0-.1.1-.2.2-.2h4.2c.1 0 .2.1.2.2v.8c0 .1-.1.2-.2.4l-2.2 3.1c.8 0 1.7.1 2.4.5.2.1.2.2.3.4v.9c0 .1-.1.3-.3.2-1.4-.7-3.2-.8-4.7 0-.1.1-.3 0-.3-.2v-.9c0-.1 0-.4.2-.6l2.5-3.6h-2.2c-.2 0-.3-.1-.3-.1zM7.4 13.8H6.1c-.1 0-.2-.1-.2-.2V6.8c0-.1.1-.2.2-.2h1.2c.1 0 .2.1.2.2v.9c.3-.8.9-1.2 1.7-1.2.8 0 1.4.4 1.7 1.2.3-.8 1-1.2 1.8-1.2.6 0 1.2.2 1.6.7.4.6.3 1.4.3 2.1v4.3c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V9.9c0-.3 0-.9 0-1.2-.1-.4-.4-.5-.7-.5s-.7.2-.8.5c-.1.3-.1.9-.1 1.2v3.7c0 .1-.1.2-.2.2h-1.2c-.1 0-.2-.1-.2-.2V9.9c0-.7.1-1.7-.7-1.7s-.8 1-.8 1.7v3.7c0 .1-.1.2-.2.2zM26.4 6.4c1.8 0 2.8 1.6 2.8 3.6 0 2-1.1 3.5-2.8 3.5-1.8 0-2.8-1.6-2.8-3.6 0-2 1-3.5 2.8-3.5zm0 1.3c-.9 0-1 1.2-1 2 0 .8 0 2.5 1 2.5s1.1-1.3 1.1-2.1c0-.6-.1-1.2-.2-1.7-.2-.4-.5-.7-.9-.7z"
    />
  </svg>
);

const HubSpotIcon = (
  <svg viewBox="0 0 32 32" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path
      fill="#FF7A59"
      d="M22.5 13.5V10a2.5 2.5 0 10-1.5 0v3.5a7 7 0 00-3.4 1.2l-9-7 .5-1.7a2 2 0 10-1.4-.4L16.7 13a7 7 0 109 5.5L22.5 13.5zm-2.5 9a4 4 0 110-8 4 4 0 010 8z"
    />
  </svg>
);

const tools: Tool[] = [
  { name: "Shopify", url: "https://admin.shopify.com", connected: true, icon: ShopifyIcon },
  { name: "QuickBooks", url: "https://app.qbo.intuit.com", connected: true, icon: QuickBooksIcon },
  { name: "Gmail", url: "https://mail.google.com", connected: true, icon: GmailIcon },
  { name: "LinkedIn", url: "https://www.linkedin.com", connected: true, icon: LinkedInIcon },
  { name: "Klaviyo", url: "https://www.klaviyo.com/dashboard", connected: true, icon: KlaviyoIcon },
  { name: "ShipStation", url: "https://ship12.shipstation.com", connected: true, icon: ShipStationIcon },
  { name: "Apollo", url: "https://app.apollo.io", connected: true, icon: ApolloIcon },
  { name: "Amazon", url: "https://sellercentral.amazon.com", connected: false, icon: AmazonIcon },
  { name: "HubSpot", url: "https://app.hubspot.com", connected: false, icon: HubSpotIcon },
];

export default function ConnectedToolsGrid() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Connected Tools
        </span>
        <button
          onClick={() => navigate("/settings")}
          className="text-[10px] text-primary hover:underline cursor-pointer"
        >
          Manage
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => {
          const handleClick = () =>
            tool.connected ? window.open(tool.url, "_blank") : navigate("/settings");
          return (
            <div
              key={tool.name}
              onClick={handleClick}
              className="flex flex-col items-center gap-1.5 cursor-pointer group w-14"
              title={tool.connected ? `Open ${tool.name}` : `Connect ${tool.name}`}
            >
              <div
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  tool.connected
                    ? "bg-card border border-border group-hover:border-primary/40 group-hover:shadow-[0_0_0_1px_hsl(170_22%_48%/0.3),0_0_16px_hsl(170_22%_48%/0.12)]"
                    : "bg-card border border-dashed border-border/50 group-hover:border-primary/40"
                }`}
              >
                <div className={tool.connected ? "" : "opacity-40"}>{tool.icon}</div>
                {tool.connected && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success border border-background" />
                )}
              </div>
              <span className="text-[9px] text-muted-foreground group-hover:text-foreground text-center leading-tight transition-colors">
                {tool.name}
              </span>
            </div>
          );
        })}

        <div
          onClick={() => navigate("/settings")}
          className="flex flex-col items-center gap-1.5 cursor-pointer group w-14"
          title="Add a new integration"
        >
          <div className="w-10 h-10 rounded-xl border border-dashed border-primary/40 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
            <Plus size={16} className="text-primary" />
          </div>
          <span className="text-[9px] text-primary text-center leading-tight">Add</span>
        </div>
      </div>
    </div>
  );
}
