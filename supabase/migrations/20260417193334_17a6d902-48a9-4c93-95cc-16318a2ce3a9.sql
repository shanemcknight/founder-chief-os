-- Create support_knowledge table
CREATE TABLE public.support_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_knowledge ENABLE ROW LEVEL SECURITY;

-- Public read access for active rows (support agent must work for anonymous visitors)
CREATE POLICY "Anyone can read active knowledge"
ON public.support_knowledge
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Admins manage the knowledge base
CREATE POLICY "Admins insert knowledge"
ON public.support_knowledge
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins update knowledge"
ON public.support_knowledge
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins delete knowledge"
ON public.support_knowledge
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Service role bypass for edge functions
CREATE POLICY "Service role full access knowledge"
ON public.support_knowledge
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_support_knowledge_updated_at
BEFORE UPDATE ON public.support_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_knowledge_active_category
ON public.support_knowledge(active, category);

-- Seed initial knowledge
INSERT INTO public.support_knowledge (category, title, content) VALUES
('pricing', 'SCOUT plan', 'Free tier. Includes 1 agent, 500K tokens/month, 1 seat. Best for trying MythosHQ.'),
('pricing', 'TITAN plan', '$49/month. Includes 3 agents, 10M tokens/month, 1 seat. BYOK unlocks unlimited tokens.'),
('pricing', 'ATLAS plan', '$79/month. Includes 10 agents, 20M tokens/month, 2 seats.'),
('pricing', 'OLYMPUS plan', '$149/month. Unlimited agents, 50M tokens/month, 5 seats.'),
('pricing', 'How to upgrade', 'Go to Settings → Billing → click Upgrade. Or visit mythoshq.io/pricing.'),

('features', 'COMMAND pillar', 'The dashboard home. Surfaces today''s priorities, tasks, revenue, calendar, and what needs attention right now.'),
('features', 'INBOX pillar', 'AI reads, categorizes, and drafts email replies. Connects Gmail and Outlook. Nothing sends without your approval.'),
('features', 'SOCIAL pillar', 'Full social calendar. Schedule posts across LinkedIn, Instagram, Facebook, Twitter, and Pinterest. Month/week/day views. Auto-publish or manual.'),
('features', 'SALES pillar', 'Full CRM with pipeline kanban (New Lead → Won/Lost), contacts, companies, tasks, and Apollo prospect search.'),
('features', 'AGENTS pillar', 'Deploy specialized AI agents. Chat with them, review approvals in AGENTIC HQ, run Deep Research, or use Claude Direct for raw access.'),
('features', 'PUBLISH pillar', 'White-label your MythosHQ instance. Customize branding for your team or clients.'),
('features', 'BUILD pillar', 'Build custom workflows and connect new tools. Tie agents to triggers and actions.'),
('features', 'REPORTS pillar', 'Upload Excel/CSV/PDF for instant AI analysis. Build custom Excel tools by describing them. Save reports and formulas to an organized library.'),
('features', 'AGENTIC HQ panel', 'The right-side panel in your dashboard. Shows every pending agent action that needs your approval, in real time. The badge count shows urgency.'),
('features', 'My HQ Agent', 'Every user gets a primary agent. It coordinates the others, reads your inbox, surfaces priorities, and routes tasks.'),

('integrations', 'BYOK (Bring Your Own Key)', 'Connect your own Anthropic, OpenAI, or Google API key in Settings → Agent Settings. You pay the AI provider directly — no markup, no token caps. Available on TITAN and above.'),
('integrations', 'Email setup (Gmail / Outlook)', 'Settings → Integrations → click Connect next to Gmail or Outlook. The OAuth flow takes about 30 seconds. Both can be connected at the same time.'),
('integrations', 'Social platforms', 'LinkedIn, Instagram, Facebook, and Twitter/X are ready. Pinterest needs a fresh app. TikTok approval is pending.'),
('integrations', 'Business tools', 'Shopify, QuickBooks, ShipStation, Klaviyo, and Amazon SP-API are coming soon.'),

('faq', 'Why isn''t my agent doing anything?', 'Make sure you''ve deployed an agent in AGENTS → Deployed. Your My HQ Agent comes pre-configured. Open AGENTS → Chat to start a conversation.'),
('faq', 'Can I use MythosHQ for multiple businesses?', 'Each business gets its own MythosHQ account. We intentionally keep businesses separate — no cross-business dashboards.'),
('faq', 'Does anything send without my approval?', 'No. Every outbound action — email, social post, CRM update — appears in AGENTIC HQ for you to approve, edit, or reject.'),
('faq', 'Where do I see token usage?', 'Settings → Billing shows your current month''s tokens used vs your plan budget.'),

('changelog', 'Recent updates', 'Deep Research agent, Claude Direct, full SALES CRM with kanban + Apollo prospect search, multi-account email integration via Nango.'),

('contact', 'Escalation contact', 'For anything urgent, billing questions, or to reach a human, email hello@mythoshq.io. The team typically responds within a few hours during business days.');