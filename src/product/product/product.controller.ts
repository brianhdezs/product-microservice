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
  BadRequestException,
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
import {
  CreateProductDto,
  UpdateProductDto,
  ProductDto,
  ResponseDto,
  VoteProductDto,
} from '../dto/product.dto';

// === utilidades ===
import { uploadToCloudinary } from '../utils/cloudinary.util';
import { validateImageContent } from '../utils/sightengine.util';
const BadWords = require('bad-words');

@ApiTags('Product')
@Controller('api/product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // =================== GET ===================
  @Get('GetAll')
  @ApiOperation({ summary: 'Obtener todos los productos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos obtenida exitosamente',
  })
  async getAll(): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getAllProducts();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtener productos por ID de usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Lista de productos del usuario obtenida exitosamente',
  })
  async getByUserId(
    @Param('userId') userId: string,
  ): Promise<ResponseDto<ProductDto[]>> {
    return await this.productService.getProductsByUserId(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado',
  })
  async getById(
    @Param('id') id: string,
  ): Promise<ResponseDto<ProductDto>> {
    return await this.productService.getProductById(id);
  }

  // =================== POST ===================
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error('Tipo de archivo no permitido. Use: JPEG, PNG, GIF o WebP'),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Crear un nuevo producto' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Producto creado exitosamente',
  })
  @HttpCode(HttpStatus.CREATED)
  async post(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductDto>> {
    const filter = new BadWords();

    // Agregar palabras ofensivas en español
    filter.addWords(
      'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'cabron', 'cabrón',
      'verga', 'chingar', 'chingada', 'idiota', 'imbecil', 'marica',
      'culero', 'culera', 'estupido', 'estúpido', 'estupida', 'estúpida'
    );

    // Normalizar a minúsculas antes de evaluar (por si viene en mayúsculas)
    const name = (createProductDto.name || '').toLowerCase();
    const desc = (createProductDto.description || '').toLowerCase();
    const cat = (createProductDto.categoryName || '').toLowerCase();

    if (filter.isProfane(name) || filter.isProfane(desc) || filter.isProfane(cat)) {
      throw new BadRequestException(
        'El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.',
      );
    }

    // Validar imagen con Sightengine
    let imageUrl = '';
    if (file) {
      const isSafe = await validateImageContent(file.path);
      if (!isSafe) {
        throw new BadRequestException('IMAGEN RECHAZADA: contiene contenido sensible o violento.');
      }

      imageUrl = await uploadToCloudinary(file.path);
    }

    const cleanDto = { ...createProductDto };
    if (imageUrl) cleanDto['imageUrl'] = imageUrl;
    delete cleanDto.image;

    return await this.productService.createProduct(cleanDto, file);
  }

  // =================== PUT ===================
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
      fileFilter: (req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error('Tipo de archivo no permitido. Use: JPEG, PNG, GIF o WebP'),
            false,
          );
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Actualizar un producto existente' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente',
  })
  async put(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductDto>> {
    // 🧼 Validar lenguaje inapropiado
    const filter = new BadWords();
    filter.addWords(
      'mierda', 'puta', 'puto', 'pendejo', 'pendeja', 'cabron', 'cabrón',
      'verga', 'chingar', 'chingada', 'idiota', 'imbecil', 'marica',
      'culero', 'culera', 'estupido', 'estúpido', 'estupida', 'estúpida'
    );

    const name = (updateProductDto.name || '').toLowerCase();
    const desc = (updateProductDto.description || '').toLowerCase();
    const cat = (updateProductDto.categoryName || '').toLowerCase();

    if (filter.isProfane(name) || filter.isProfane(desc) || filter.isProfane(cat)) {
      throw new BadRequestException(
        'El texto contiene lenguaje inapropiado en el nombre, descripción o categoría.',
      );
    }

    // 🖼️ Validar imagen con Sightengine si se sube una nueva
    let imageUrl = '';
    if (file) {
      const isSafe = await validateImageContent(file.path);
      if (!isSafe) {
        throw new BadRequestException('Imagen rechazada: contiene contenido sensible.');
      }

      imageUrl = await uploadToCloudinary(file.path);
    }

    // 💾 Limpiar DTO y actualizar producto
    const cleanDto = { ...updateProductDto };
    if (imageUrl) cleanDto['imageUrl'] = imageUrl;
    delete cleanDto.image;

    return await this.productService.updateProduct(id, cleanDto, file);
  }

  // =================== DELETE ===================
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un producto' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Producto eliminado exitosamente',
  })
  async delete(@Param('id') id: string): Promise<ResponseDto<string>> {
    return await this.productService.deleteProduct(id);
  }

  // =================== 🔥 ENDPOINTS: LIKES/DISLIKES ===================

  @Post(':id/vote')
  @ApiOperation({ summary: 'Votar en un producto (true=like, false=dislike)' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Voto registrado exitosamente',
  })
  @HttpCode(HttpStatus.OK)
  async voteProduct(
    @Param('id') productId: string,
    @Body() voteProductDto: VoteProductDto,
  ): Promise<ResponseDto<ProductDto>> {
    return await this.productService.voteProduct(productId, voteProductDto);
  }

  @Get(':id/vote/:userId')
  @ApiOperation({ summary: 'Obtener el voto de un usuario en un producto específico' })
  @ApiParam({ name: 'id', description: 'ID del producto', type: 'string' })
  @ApiParam({ name: 'userId', description: 'ID del usuario', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Voto del usuario obtenido exitosamente (true=like, false=dislike, null=sin voto)',
  })
  async getUserVote(
    @Param('id') productId: string,
    @Param('userId') userId: string,
  ): Promise<ResponseDto<{ isLike: boolean | null }>> {
    return await this.productService.getUserVote(productId, userId);
  }
}