import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { Product, ProductDocument } from '../entities/product.schema';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductDto,
  ResponseDto,
} from '../dto/product.dto';

// 👇 Tipo extendido con los datos del vendedor
type ProductWithUser = ProductDto & {
  userName: string;
  userPhone: string;
};

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  // ============================================================
  // Obtener datos de usuario desde el Auth Microservice
  // ============================================================
private async getUserData(userId: string): Promise<{ name: string; phone: string }> {
  const AUTH_URL = process.env.AUTH_SERVICE_URL || 'https://auth-microservice-tfql.onrender.com';
  try {
    const response = await axios.get(`${AUTH_URL}/api/auth/public/${userId}`);
    const user = response.data.result;

    return {
      name: user.username,
      phone: user.phoneNumber || 'No disponible',
    };
  } catch (error) {
    console.warn(`⚠️ No se pudo obtener usuario ${userId}:`, error.message);
    return { name: 'Desconocido', phone: 'No disponible' };
  }
}



  // ============================================================
  // 🔹 GET ALL PRODUCTS
  // ============================================================
  async getAllProducts(): Promise<ResponseDto<ProductWithUser[]>> {
    try {
      const products = await this.productModel.find().exec();
      const result: ProductWithUser[] = [];

      for (const product of products) {
        const dto = this.mapToProductDto(product);
        const userData = await this.getUserData(dto.userId);
        result.push({ ...dto, userName: userData.name, userPhone: userData.phone });
      }

      return new ResponseDto<ProductWithUser[]>(result, true, '');
    } catch (error) {
      return new ResponseDto<ProductWithUser[]>([], false, error.message);
    }
  }

  // ============================================================
  // 🔹 GET BY USER ID
  // ============================================================
  async getProductsByUserId(userId: string): Promise<ResponseDto<ProductWithUser[]>> {
    try {
      const products = await this.productModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .exec();

      const result: ProductWithUser[] = [];

      for (const product of products) {
        const dto = this.mapToProductDto(product);
        const userData = await this.getUserData(dto.userId);
        result.push({ ...dto, userName: userData.name, userPhone: userData.phone });
      }

      return new ResponseDto<ProductWithUser[]>(result, true, '');
    } catch (error) {
      return new ResponseDto<ProductWithUser[]>([], false, error.message);
    }
  }

  // ============================================================
  // 🔹 GET PRODUCT BY ID
  // ============================================================
  async getProductById(id: string): Promise<ResponseDto<ProductWithUser>> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product)
        return new ResponseDto<ProductWithUser>(
          undefined,
          false,
          'Producto no encontrado',
        );

      const dto = this.mapToProductDto(product);
      const userData = await this.getUserData(dto.userId);

      return new ResponseDto<ProductWithUser>(
        { ...dto, userName: userData.name, userPhone: userData.phone },
        true,
        '',
      );
    } catch (error) {
      return new ResponseDto<ProductWithUser>(undefined, false, error.message);
    }
  }

  // ============================================================
  // 🔹 CREATE PRODUCT
  // ============================================================
  async createProduct(
    createProductDto: CreateProductDto,
    file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductWithUser>> {
    try {
      const productData = {
        name: createProductDto.name,
        price: createProductDto.price,
        description: createProductDto.description || '',
        categoryName: createProductDto.categoryName || '',
        imageUrl: 'https://placehold.co/600x400',
        imageLocalPath: '',
        userId: new Types.ObjectId(createProductDto.userId),
      };

      const savedProduct = await this.productModel.create(productData);

      if (file) {
        const fileName = `${savedProduct._id}${path.extname(file.originalname)}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'ProductImages');
        const filePath = path.join(uploadDir, fileName);

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.renameSync(file.path, filePath);

        savedProduct.imageUrl = `/ProductImages/${fileName}`;
        savedProduct.imageLocalPath = `uploads/ProductImages/${fileName}`;
        await savedProduct.save();
      }

      const dto = this.mapToProductDto(savedProduct);
      const userData = await this.getUserData(dto.userId);

      return new ResponseDto<ProductWithUser>(
        { ...dto, userName: userData.name, userPhone: userData.phone },
        true,
        '',
      );
    } catch (error) {
      return new ResponseDto<ProductWithUser>(undefined, false, error.message);
    }
  }

  // ============================================================
  // 🔹 UPDATE PRODUCT
  // ============================================================
  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
    file?: Express.Multer.File,
  ): Promise<ResponseDto<ProductWithUser>> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product)
        return new ResponseDto<ProductWithUser>(
          undefined,
          false,
          'Producto no encontrado',
        );

      product.name = updateProductDto.name;
      product.price = updateProductDto.price;
      product.description = updateProductDto.description || '';
      product.categoryName = updateProductDto.categoryName || '';

      if (file) {
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

        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.renameSync(file.path, filePath);

        product.imageUrl = `/ProductImages/${fileName}`;
        product.imageLocalPath = `uploads/ProductImages/${fileName}`;
      }

      const savedProduct = await product.save();
      const dto = this.mapToProductDto(savedProduct);
      const userData = await this.getUserData(dto.userId);

      return new ResponseDto<ProductWithUser>(
        { ...dto, userName: userData.name, userPhone: userData.phone },
        true,
        '',
      );
    } catch (error) {
      return new ResponseDto<ProductWithUser>(undefined, false, error.message);
    }
  }

  // ============================================================
  // 🔹 DELETE PRODUCT
  // ============================================================
  async deleteProduct(id: string): Promise<ResponseDto<string>> {
    try {
      const product = await this.productModel.findById(id).exec();
      if (!product)
        return new ResponseDto<string>('', false, 'Producto no encontrado');

      if (product.imageLocalPath && fs.existsSync(product.imageLocalPath)) {
        try {
          fs.unlinkSync(product.imageLocalPath);
        } catch (err) {
          console.warn('No se pudo eliminar la imagen:', err.message);
        }
      }

      await this.productModel.findByIdAndDelete(id).exec();
      return new ResponseDto<string>('Producto eliminado correctamente', true, '');
    } catch (error) {
      return new ResponseDto<string>('', false, error.message);
    }
  }

  // ============================================================
  // 🔹 MAP PRODUCT → DTO
  // ============================================================
  private mapToProductDto(product: ProductDocument): ProductDto {
    const dto = new ProductDto();
    dto.productId = (product._id as Types.ObjectId).toString();
    dto.name = product.name;
    dto.price = Number(product.price);
    dto.description = product.description || '';
    dto.categoryName = product.categoryName || '';
    dto.imageUrl = product.imageUrl || '';
    dto.imageLocalPath = product.imageLocalPath || '';
    dto.userId = (product.userId as Types.ObjectId).toString();
    return dto;
  }
}
