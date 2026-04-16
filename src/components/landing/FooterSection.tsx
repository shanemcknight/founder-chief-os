import { Link } from "react-router-dom";

const columns = [
  { title: "Product", links: [
    { label: "Features", href: "#" },
    { label: "Pricing", href: "#pricing" },
    { label: "Integrations", href: "#" },
    { label: "Changelog", href: "#" },
  ]},
  { title: "Company", links: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ]},
  { title: "Resources", links: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Community", href: "#" },
    { label: "Status", href: "#" },
  ]},
  { title: "Legal", links: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Data Deletion", href: "/data-deletion" },
    { label: "DPA", href: "#" },
  ]},
];

export default function FooterSection() {
  return (
    <footer className="border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Ready to run your business differently?</h2>
          <p className="text-muted-foreground mb-6">Join 10,000+ users who replaced their tool stack.</p>
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm font-medium bg-primary text-primary-foreground px-6 py-3 rounded-md hover:opacity-90 transition-opacity duration-150">
            Start Free →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div>
            <p className="text-sm font-bold text-foreground mb-3">MYTHOS <span className="text-primary">HQ</span></p>
            <p className="text-xs text-muted-foreground leading-relaxed">The user operating system.</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-foreground mb-3 uppercase tracking-wider">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("/") ? (
                      <Link to={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">{l.label}</Link>
                    ) : (
                      <a href={l.href} className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">{l.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground text-center">
          © 2025 Mythos HQ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
