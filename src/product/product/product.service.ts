import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Product, ProductDocument } from '../entities/product.schema';
import { CreateProductDto, UpdateProductDto, ProductDto, ResponseDto } from '../dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  async getAllProducts(): Promise<ResponseDto<ProductDto[]>> {
    try {
      const products = await this.productModel.find().exec();
      const productDtos = products.map(product => this.mapToProductDto(product));
      
      return new ResponseDto(productDtos, true, '');
    } catch (error) {
      return new ResponseDto([], false, error.message);
    }
  }

  async getProductsByUserId(userId: string): Promise<ResponseDto<ProductDto[]>> {
    try {
      const products = await this.productModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 }) // Ordenar por más recientes primero
        .exec();
      
      const productDtos = products.map(product => this.mapToProductDto(product));
      
      return new ResponseDto(productDtos, true, '');
    } catch (error) {
      return new ResponseDto([], false, error.message);
    }
  }

  async getProductById(id: string): Promise<ResponseDto<ProductDto>> {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        const emptyProduct = new ProductDto();
        emptyProduct.productId = '';
        emptyProduct.name = '';
        emptyProduct.price = 0;
        emptyProduct.description = '';
        emptyProduct.categoryName = '';
        emptyProduct.imageUrl = '';
        emptyProduct.imageLocalPath = '';
        emptyProduct.userId = '';
        
        return new ResponseDto(emptyProduct, false, 'Producto no encontrado');
      }

      const productDto = this.mapToProductDto(product);
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = '';
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      emptyProduct.userId = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async createProduct(createProductDto: CreateProductDto, file?: Express.Multer.File): Promise<ResponseDto<ProductDto>> {
    try {
      // Crear el producto sin la imagen primero
      const productData = {
        name: createProductDto.name,
        price: createProductDto.price,
        description: createProductDto.description || '',
        categoryName: createProductDto.categoryName || '',
        imageUrl: 'https://placehold.co/600x400',
        imageLocalPath: '',
        userId: new Types.ObjectId(createProductDto.userId),
      };
      
      // Guardar el producto para obtener el ID
      const savedProduct = await this.productModel.create(productData);

      // Manejar la imagen si existe
      if (file) {
        const fileName = `${savedProduct._id}${path.extname(file.originalname)}`;
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
        
        await savedProduct.save();
      }

      const productDto = this.mapToProductDto(savedProduct);
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = '';
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      emptyProduct.userId = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto, file?: Express.Multer.File): Promise<ResponseDto<ProductDto>> {
    try {
      const product = await this.productModel.findById(id).exec();

      if (!product) {
        const emptyProduct = new ProductDto();
        emptyProduct.productId = '';
        emptyProduct.name = '';
        emptyProduct.price = 0;
        emptyProduct.description = '';
        emptyProduct.categoryName = '';
        emptyProduct.imageUrl = '';
        emptyProduct.imageLocalPath = '';
        emptyProduct.userId = '';
        
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

        const fileName = `${product._id}${path.extname(file.originalname)}`;
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

      const savedProduct = await product.save();
      const productDto = this.mapToProductDto(savedProduct);
      
      return new ResponseDto(productDto, true, '');
    } catch (error) {
      const emptyProduct = new ProductDto();
      emptyProduct.productId = '';
      emptyProduct.name = '';
      emptyProduct.price = 0;
      emptyProduct.description = '';
      emptyProduct.categoryName = '';
      emptyProduct.imageUrl = '';
      emptyProduct.imageLocalPath = '';
      emptyProduct.userId = '';
      
      return new ResponseDto(emptyProduct, false, error.message);
    }
  }

  async deleteProduct(id: string): Promise<ResponseDto<string>> {
    try {
      const product = await this.productModel.findById(id).exec();

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

      await this.productModel.findByIdAndDelete(id).exec();
      
      return new ResponseDto('Producto eliminado correctamente', true, '');
    } catch (error) {
      return new ResponseDto('', false, error.message);
    }
  }

  private mapToProductDto(product: ProductDocument): ProductDto {
    const dto = new ProductDto();
    const id = (product._id as Types.ObjectId | string);
    dto.productId = id.toString();
    dto.name = product.name;
    dto.price = Number(product.price);
    dto.description = product.description || '';
    dto.categoryName = product.categoryName || '';
    dto.imageUrl = product.imageUrl || '';
    dto.imageLocalPath = product.imageLocalPath || '';
    const userId = (product.userId as Types.ObjectId | string);
    dto.userId = userId.toString();
    return dto;
  }
}