import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Precio del producto', minimum: 1, maximum: 100000 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Nombre de la categoría' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ 
    type: 'string', 
    format: 'binary', 
    description: 'Imagen del producto' 
  })
  @IsOptional()
  image?: any;

  // Agregar userId (se obtendrá del token JWT)
  @ApiProperty({ description: 'ID del usuario que crea el producto' })
  @IsString()
  userId: string;
}

export class UpdateProductDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Precio del producto', minimum: 1, maximum: 100000 })
  @IsNumber()
  @Min(1)
  @Max(100000)
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Nombre de la categoría' })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({ 
    type: 'string', 
    format: 'binary', 
    description: 'Imagen del producto' 
  })
  @IsOptional()
  image?: any;

  @ApiPropertyOptional({ description: 'URL de la imagen actual' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Ruta local de la imagen actual' })
  @IsOptional()
  @IsString()
  imageLocalPath?: string;
}

export class ProductDto {
  @ApiProperty({ description: 'ID del producto' })
  productId: string;

  @ApiProperty({ description: 'Nombre del producto' })
  name: string;

  @ApiProperty({ description: 'Precio del producto' })
  price: number;

  @ApiProperty({ description: 'Descripción del producto' })
  description: string;

  @ApiProperty({ description: 'Nombre de la categoría' })
  categoryName: string;

  @ApiProperty({ description: 'URL de la imagen' })
  imageUrl: string;

  @ApiProperty({ description: 'Ruta local de la imagen' })
  imageLocalPath: string;

  @ApiProperty({ description: 'ID del usuario propietario' })
  userId: string;
}

export class ResponseDto<T = any> {
  @ApiProperty({ description: 'Resultado de la operación' })
  result?: T;

  @ApiProperty({ description: 'Indica si la operación fue exitosa', default: true })
  isSuccess: boolean = true;

  @ApiProperty({ description: 'Mensaje de respuesta', default: '' })
  message: string = '';

  constructor(result?: T, isSuccess: boolean = true, message: string = '') {
    this.result = result;
    this.isSuccess = isSuccess;
    this.message = message;
  }
}

export class PagerDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1, minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Registros por página', 
    default: 10, 
    minimum: 1, 
    maximum: 50 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Transform(({ value }) => Math.min(parseInt(value) || 10, 50))
  recordsPerPage?: number = 10;
}