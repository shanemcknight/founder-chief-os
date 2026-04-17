// Deterministic UUIDs for the demo agents so they can be used as agent_id in conversations
// without needing a separate agents table.
export const AGENTS = [
  { id: "11111111-1111-1111-1111-111111111111", name: "CHIEF", status: "online" as const, preview: "Ready to help", isSpecial: false },
  { id: "22222222-2222-2222-2222-222222222222", name: "ORACLE", status: "online" as const, preview: "Inbox specialist", isSpecial: false },
  { id: "33333333-3333-3333-3333-333333333333", name: "FORGE", status: "offline" as const, preview: "Operations agent", isSpecial: false },
  { id: "44444444-4444-4444-4444-444444444444", name: "CLAUDE", status: "online" as const, preview: "Direct AI · No agent layer", isSpecial: true },
] as const;

export const RESEARCH_AGENT_ID = "55555555-5555-5555-5555-555555555555";

export type AgentName = (typeof AGENTS)[number]["name"];

export function agentByName(name: string) {
  return AGENTS.find((a) => a.name.toUpperCase() === name.toUpperCase());
}
export function agentById(id: string) {
  return AGENTS.find((a) => a.id === id);
}
