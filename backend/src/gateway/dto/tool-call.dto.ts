import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ToolCallDto {
  @IsString()
  @IsNotEmpty()
  agentId: string;

  @IsString()
  @IsNotEmpty()
  tool: string;

  @IsString()
  @IsNotEmpty()
  operation: string;

  @IsString()
  @IsNotEmpty()
  target: string;

  @IsObject()
  @IsOptional()
  arguments?: Record<string, unknown>;
}