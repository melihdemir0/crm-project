import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ActivityType } from '../entities/activity.entity';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  when?: string;

  @ApiProperty({
    required: false,
    description: 'Lead için aktivite ise doldur',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  leadId?: number;

  @ApiProperty({
    required: false,
    description: 'Customer için aktivite ise doldur',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  customerId?: number;
}
