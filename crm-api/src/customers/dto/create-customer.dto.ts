import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Acme Ltd.',
    description: 'Müşterinin adı veya şirket ismi',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'info@acme.com',
    description: 'Müşterinin e-mail adresi',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+90 532 123 45 67',
    description: 'Telefon numarası',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'İstanbul',
    description: 'Müşterinin şirketi, bölgeleri veya bulunduğu yer',
    required: false,
  })
  @IsString()
  @IsOptional()
  company?: string;
}
