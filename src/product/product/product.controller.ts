import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto, ProductDto, ResponseDto } from '../dto/product.dto';

@ApiTags('Product')
@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get('GetAll')
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos obtenida exitosamente'
  })
  async getAll(): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getAllProducts();
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los productos (ruta alternativa)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos obtenida exitosamente'
  })
  async get(): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto encontrado'
  })
  async getById(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<ProductDto>> {
    return await this.productService.getProductById(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file) {
        callback(null, true);
        return;
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Tipo de archivo no permitido. Use: JPEG, PNG, GIF, WebP'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 201, 
    description: 'Producto creado exitosamente'
  })
  @HttpCode(HttpStatus.CREATED)
  async post(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductDto>> {
    // Limpiar el campo image del DTO antes de procesar
    const cleanDto = { ...createProductDto };
    delete cleanDto.image;
    
    return await this.productService.createProduct(cleanDto, file);
  }

  @Put()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/temp',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        callback(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file) {
        callback(null, true);
        return;
      }
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Tipo de archivo no permitido. Use: JPEG, PNG, GIF, WebP'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Producto actualizado exitosamente'
  })
  async put(
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductDto>> {
    // Limpiar el campo image del DTO antes de procesar
    const cleanDto = { ...updateProductDto };
    delete cleanDto.image;
    
    return await this.productService.updateProduct(cleanDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto eliminado exitosamente'
  })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ResponseDto<string>> {
    return await this.productService.deleteProduct(id);
  }
}