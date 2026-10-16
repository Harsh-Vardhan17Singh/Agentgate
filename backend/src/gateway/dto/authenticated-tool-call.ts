import { ToolCallDto } from "./tool-call.dto.js";

export type AuthenticatedToolCall = ToolCallDto & {
    agentId : string;
}