import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
  VoteProductDto,
} from '../dto/product.dto';
import { uploadToCloudinary } from '../utils/cloudinary.util';

// 👇 Tipo extendido con los datos del vendedor
type ProductWithUser = ProductDto & {
  userName: string;
  userPhone: string;
};

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) { }

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
  // 🔹 GET ALL PRODUCTS (SIN userId como antes)
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
  // 🔹 GET BY USER ID (SIN currentUserId como antes)
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
  // 🔹 GET PRODUCT BY ID (SIN userId como antes)
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
        likesCount: 0,
        dislikesCount: 0,
        votes: [],
      };

      const savedProduct = await this.productModel.create(productData);

      if (file) {
        // Subir a Cloudinary una sola vez
        const cloudinaryUrl = await uploadToCloudinary(file.path);
        savedProduct.imageUrl = cloudinaryUrl;
        savedProduct.imageLocalPath = ''; // opcional
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
        const cloudinaryUrl = await uploadToCloudinary(file.path);
        product.imageUrl = cloudinaryUrl;
        product.imageLocalPath = '';
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
  // 🔥 VOTAR (CON SISTEMA BOOLEANO: true=like, false=dislike)
  // ============================================================
  async voteProduct(
    productId: string,
    voteProductDto: VoteProductDto,
  ): Promise<ResponseDto<ProductWithUser>> {
    try {
      const product = await this.productModel.findById(productId).exec();
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      const userId = new Types.ObjectId(voteProductDto.userId);
      const isLike = voteProductDto.isLike; // true o false

      // Buscar si el usuario ya votó
      const existingVoteIndex = product.votes.findIndex(
        (vote) => vote.userId.toString() === userId.toString(),
      );

      if (existingVoteIndex !== -1) {
        // El usuario ya votó
        const existingVote = product.votes[existingVoteIndex];

        if (existingVote.isLike === isLike) {
          // Si intenta votar lo mismo, remueve el voto (toggle)
          if (existingVote.isLike) {
            product.likesCount = Math.max(0, product.likesCount - 1);
          } else {
            product.dislikesCount = Math.max(0, product.dislikesCount - 1);
          }
          product.votes.splice(existingVoteIndex, 1);
        } else {
          // Cambiar de voto: quitar el anterior y agregar el nuevo
          if (existingVote.isLike) {
            product.likesCount = Math.max(0, product.likesCount - 1);
            product.dislikesCount += 1;
          } else {
            product.dislikesCount = Math.max(0, product.dislikesCount - 1);
            product.likesCount += 1;
          }
          product.votes[existingVoteIndex] = {
            userId,
            isLike: isLike,
            votedAt: new Date(),
          };
        }
      } else {
        // Usuario nuevo votando
        if (isLike) {
          product.likesCount += 1;
        } else {
          product.dislikesCount += 1;
        }
        product.votes.push({
          userId,
          isLike: isLike,
          votedAt: new Date(),
        });
      }

      const savedProduct = await product.save();
      const dto = this.mapToProductDto(savedProduct);
      const userData = await this.getUserData(dto.userId);

      return new ResponseDto<ProductWithUser>(
        { ...dto, userName: userData.name, userPhone: userData.phone },
        true,
        'Voto registrado correctamente',
      );
    } catch (error) {
      return new ResponseDto<ProductWithUser>(
        undefined,
        false,
        error.message || 'Error al registrar el voto',
      );
    }
  }

  // ============================================================
  // 🔥 OBTENER VOTO DEL USUARIO (retorna boolean o null)
  // ============================================================
  async getUserVote(
    productId: string,
    userId: string,
  ): Promise<ResponseDto<{ isLike: boolean | null }>> {
    try {
      const product = await this.productModel.findById(productId).exec();
      if (!product) {
        throw new NotFoundException('Producto no encontrado');
      }

      const userObjectId = new Types.ObjectId(userId);
      const userVote = product.votes.find(
        (vote) => vote.userId.toString() === userObjectId.toString(),
      );

      return new ResponseDto<{ isLike: boolean | null }>(
        { isLike: userVote ? userVote.isLike : null },
        true,
        '',
      );
    } catch (error) {
      return new ResponseDto<{ isLike: boolean | null }>(
        { isLike: null },
        false,
        error.message,
      );
    }
  }

  // ============================================================
  // 🔹 MAP PRODUCT → DTO (simplificado sin userVote)
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

    // Agregar contadores de likes/dislikes
    dto.likesCount = product.likesCount || 0;
    dto.dislikesCount = product.dislikesCount || 0;

    return dto;
  }

  async deleteAllProductsByUser(userId: string): Promise<ResponseDto> {
    try {
      const query = {
        $or: [
          { userId }, // por si se guarda como string
          { userId: new Types.ObjectId(userId) } // por si se guarda como ObjectId
        ]
      };

      const result = await this.productModel.deleteMany(query).exec();

      const response = new ResponseDto();
      response.isSuccess = true;
      response.message = `Se eliminaron ${result.deletedCount} productos del usuario ${userId}.`;
      return response;
    } catch (error) {
      const response = new ResponseDto();
      response.isSuccess = false;
      response.message = 'Error al eliminar productos: ' + error.message;
      return response;
    }
  }

}