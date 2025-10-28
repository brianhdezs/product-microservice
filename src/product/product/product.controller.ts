import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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

  @Get('user/:userId')  // ⬅️ DEBE IR ANTES DE @Get(':id')
  @ApiOperation({ summary: 'Obtener productos por ID de usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos del usuario obtenida exitosamente'
  })
  async getByUserId(@Param('userId') userId: string): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getProductsByUserId(userId);
  }

  @Get(':id')  // ⬅️ ESTE DEBE IR DESPUÉS
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto encontrado'
  })
  async getById(@Param('id') id: string): Promise<ResponseDto<ProductDto>> {
    return await this.productService.getProductById(id);
  }

  @Get()  // ⬅️ O mueve este al final
  @ApiOperation({ summary: 'Obtener todos los productos (ruta alternativa)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de productos obtenida exitosamente'
  })
  async get(): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getAllProducts();
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
    const cleanDto = { ...createProductDto };
    delete cleanDto.image;
    
    return await this.productService.createProduct(cleanDto, file);
  }

  @Put(':id')
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
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ 
    status: 200, 
    description: 'Producto actualizado exitosamente'
  })
  async put(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductDto>> {
    const cleanDto = { ...updateProductDto };
    delete cleanDto.image;
    
    return await this.productService.updateProduct(id, cleanDto, file);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Producto eliminado exitosamente'
  })
  async delete(@Param('id') id: string): Promise<ResponseDto<string>> {
    return await this.productService.deleteProduct(id);
  }
}