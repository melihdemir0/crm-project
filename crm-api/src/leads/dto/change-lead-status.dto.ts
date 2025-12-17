import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadStatus } from '../entities/lead.entity';

export class ChangeLeadStatusDto {
  @IsEnum(LeadStatus)
  status: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string; // opsiyonel açıklama
}
