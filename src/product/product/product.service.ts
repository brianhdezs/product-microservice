import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductDto, ResponseDto } from '../dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getAllProducts(): Promise<ResponseDto<ProductDto[]>> {
    try {
      const products = await this.productRepository.find();
      const productDtos = products.map(product => this.mapToProductDto(product));
      
      return new ResponseDto(productDtos, true, '');
    } catch (error) {
      return new ResponseDto([], false, error.message);
    }
  }

  async getProductById(id: number): Promise<ResponseDto<ProductDto>> {
    try {
      const product = await this.productRepository.findOne({
        where: { productId: id }
      });

      if (!product) {
        // Retornamos un ProductDto vacío cuando no se encuentra
        const emptyProduct = new ProductDto();
        emptyProduct.productId = 0;
        emptyProduct.name = '';
        emptyProduct.price = 0;
        emptyProduct.description = '';
        emptyProduct.categoryName = '';
        emptyProduct.imageUrl = '';
        emptyProduct.imageLocalPath = '';
        
        return new ResponseDto(emptyProduct, false, 'Producto no encontrado');
      }

      const productDto = this.mapToProductDto(product);
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = 0;
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async createProduct(createProductDto: CreateProductDto, file?: Express.Multer.File): Promise<ResponseDto<ProductDto>> {
    try {
      // Crear el producto sin la imagen primero
      const product = new Product();
      product.name = createProductDto.name;
      product.price = createProductDto.price;
      product.description = createProductDto.description || '';
      product.categoryName = createProductDto.categoryName || '';
      
      // Guardar el producto para obtener el ID
      const savedProduct = await this.productRepository.save(product);

      // Manejar la imagen si existe
      if (file) {
        const fileName = `${savedProduct.productId}${path.extname(file.originalname)}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'ProductImages');
        const filePath = path.join(uploadDir, fileName);

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Mover el archivo temporal al destino final
        fs.renameSync(file.path, filePath);

        // Actualizar el producto con la información de la imagen
        savedProduct.imageUrl = `/ProductImages/${fileName}`;
        savedProduct.imageLocalPath = `uploads/ProductImages/${fileName}`;
        
        await this.productRepository.save(savedProduct);
      } else {
        savedProduct.imageUrl = 'https://placehold.co/600x400';
        await this.productRepository.save(savedProduct);
      }

      const productDto = this.mapToProductDto(savedProduct);
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = 0;
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async updateProduct(updateProductDto: UpdateProductDto, file?: Express.Multer.File): Promise<ResponseDto<ProductDto>> {
    try {
      const product = await this.productRepository.findOne({
        where: { productId: updateProductDto.productId }
      });

      if (!product) {
        const emptyProduct = new ProductDto();
        emptyProduct.productId = 0;
        emptyProduct.name = '';
        emptyProduct.price = 0;
        emptyProduct.description = '';
        emptyProduct.categoryName = '';
        emptyProduct.imageUrl = '';
        emptyProduct.imageLocalPath = '';
        
        return new ResponseDto(emptyProduct, false, 'Producto no encontrado');
      }

      // Actualizar campos básicos
      product.name = updateProductDto.name;
      product.price = updateProductDto.price;
      product.description = updateProductDto.description || '';
      product.categoryName = updateProductDto.categoryName || '';

      // Manejar la imagen si se proporciona una nueva
      if (file) {
        // Eliminar imagen anterior si existe
        if (product.imageLocalPath && fs.existsSync(product.imageLocalPath)) {
          try {
            fs.unlinkSync(product.imageLocalPath);
          } catch (err) {
            console.warn('No se pudo eliminar la imagen anterior:', err.message);
          }
        }

        const fileName = `${product.productId}${path.extname(file.originalname)}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'ProductImages');
        const filePath = path.join(uploadDir, fileName);

        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Mover el archivo temporal al destino final
        fs.renameSync(file.path, filePath);

        product.imageUrl = `/ProductImages/${fileName}`;
        product.imageLocalPath = `uploads/ProductImages/${fileName}`;
      }

      const savedProduct = await this.productRepository.save(product);
      const productDto = this.mapToProductDto(savedProduct);
      
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = 0;
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async deleteProduct(id: number): Promise<ResponseDto<string>> {
    try {
      const product = await this.productRepository.findOne({
        where: { productId: id }
      });

      if (!product) {
        return new ResponseDto('', false, 'Producto no encontrado');
      }

      // Eliminar imagen si existe
      if (product.imageLocalPath && fs.existsSync(product.imageLocalPath)) {
        try {
          fs.unlinkSync(product.imageLocalPath);
        } catch (err) {
          console.warn('No se pudo eliminar la imagen:', err.message);
        }
      }

      await this.productRepository.remove(product);
      
      return new ResponseDto('Producto eliminado correctamente', true, '');
    } catch (error) {
      return new ResponseDto('', false, error.message);
    }
  }

  private mapToProductDto(product: Product): ProductDto {
    const dto = new ProductDto();
    dto.productId = product.productId;
    dto.name = product.name;
    dto.price = Number(product.price);
    dto.description = product.description || '';
    dto.categoryName = product.categoryName || '';
    dto.imageUrl = product.imageUrl || '';
    dto.imageLocalPath = product.imageLocalPath || '';
    return dto;
  }
}