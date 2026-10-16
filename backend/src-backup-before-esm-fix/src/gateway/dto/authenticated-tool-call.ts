import { ToolCallDto } from "./tool-call.dto";

export type AuthenticatedToolCall = ToolCallDto & {
    agentId : string;
}