// Action Builder — bot can call external HTTP APIs as "tools".
// Stored in chatbots.actions JSONB column.

export type ParamType = "string" | "number" | "boolean";

export interface ActionParam {
  name: string;
  type: ParamType;
  description: string;
  required?: boolean;
}

export interface BotAction {
  /** Unique id within the bot */
  id: string;
  /** Name the LLM sees — short, snake_case (e.g. "track_order") */
  name: string;
  /** Description LLM uses to decide when to call it */
  description: string;
  /** HTTP method */
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Endpoint URL; can include {paramName} placeholders */
  url: string;
  /** Header k/v (Authorization, etc.) — values may include {paramName} */
  headers?: Record<string, string>;
  /** Static body template (for POST/PUT) — values may include {paramName} */
  bodyTemplate?: string;
  /** Parameters the LLM must collect from the user before calling */
  params: ActionParam[];
  /** Optional auth — JWT or API key (stored encrypted in org settings) */
  auth?: { kind: "bearer" | "apiKey"; valueRef: string };
}

/** Convert our action schema → OpenAI function-calling tool definition */
export function actionToOpenAITool(action: BotAction) {
  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];
  for (const p of action.params) {
    properties[p.name] = { type: p.type, description: p.description };
    if (p.required !== false) required.push(p.name);
  }
  return {
    type: "function" as const,
    function: {
      name: action.name,
      description: action.description,
      parameters: {
        type: "object",
        properties,
        required,
      },
    },
  };
}
