-- Conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_conversations_user_agent ON public.conversations(user_id, agent_id, updated_at DESC);

CREATE POLICY "Users view own conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user','agent','system')),
  type text NOT NULL DEFAULT 'text' CHECK (type IN ('text','proposal','system','thinking')),
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at ASC);

CREATE POLICY "Users view messages in own conversations" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users insert messages in own conversations" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users update messages in own conversations" ON public.messages FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Users delete messages in own conversations" ON public.messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

-- Proposed actions
CREATE TABLE public.proposed_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('send_email','post_social','update_crm','create_order','other')),
  draft_content jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','executed')),
  approval_timestamp timestamptz,
  executed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.proposed_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_proposed_actions_status ON public.proposed_actions(status, created_at DESC);
CREATE INDEX idx_proposed_actions_message ON public.proposed_actions(message_id);

CREATE POLICY "Users view own proposed actions" ON public.proposed_actions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users insert own proposed actions" ON public.proposed_actions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users update own proposed actions" ON public.proposed_actions FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users delete own proposed actions" ON public.proposed_actions FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.messages m JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_id AND c.user_id = auth.uid()
  ));

-- Approvals log
CREATE TABLE public.approvals_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id uuid NOT NULL REFERENCES public.proposed_actions(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved','rejected','edited_and_approved')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  edited_content jsonb,
  notes text,
  timestamp timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.approvals_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_approvals_log_user ON public.approvals_log(user_id, timestamp DESC);

CREATE POLICY "Users view own approvals log" ON public.approvals_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own approvals log" ON public.approvals_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Agent context
CREATE TABLE public.agent_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL,
  context_type text NOT NULL CHECK (context_type IN ('business_data','customer_rules','integration_status')),
  content jsonb NOT NULL,
  last_updated timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_context ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_agent_context_user_agent ON public.agent_context(user_id, agent_id);

CREATE POLICY "Users view own agent context" ON public.agent_context FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own agent context" ON public.agent_context FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own agent context" ON public.agent_context FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own agent context" ON public.agent_context FOR DELETE TO authenticated USING (auth.uid() = user_id);