import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { toggleTheme } from "@/lib/theme";
import { useIsMobile } from "@/hooks/use-mobile";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Features", "Social", "Sales", "Pricing", "Beta", "Docs"];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-150 ${scrolled ? "glass-nav" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-xl tracking-tight text-foreground">
            <span className="font-bold">MYTHOS</span> <span className="font-normal text-lg text-primary">HQ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) =>
              l === "Beta" ? (
                <Link key={l} to="/beta" className="text-sm font-medium transition-colors duration-150" style={{ color: "#5D9992" }}>
                  {l}
                </Link>
              ) : (
                <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
                  {l}
                </a>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => { toggleTheme(); setDark(!dark); }}
              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150"
              aria-label="Toggle theme"
            >
              {dark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <Link to="/login" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground transition-colors duration-150">
              Log in
            </Link>
            <Link to="/onboarding" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors duration-150">
              Get Started
            </Link>
            {isMobile && (
              <button onClick={() => setMobileMenu(!mobileMenu)} className="text-muted-foreground hover:text-foreground md:hidden">
                {mobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile nav menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 pt-16 bg-background/95 backdrop-blur-sm md:hidden">
          <div className="flex flex-col items-center gap-6 pt-8">
            {links.map((l) =>
              l === "Beta" ? (
                <Link key={l} to="/beta" onClick={() => setMobileMenu(false)} className="text-lg font-medium" style={{ color: "#5D9992" }}>
                  {l}
                </Link>
              ) : (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMobileMenu(false)} className="text-lg text-foreground font-medium">
                  {l}
                </a>
              )
            )}
            <Link to="/login" onClick={() => setMobileMenu(false)} className="text-lg text-muted-foreground">Log in</Link>
          </div>
        </div>
      )}
    </>
  );
}
