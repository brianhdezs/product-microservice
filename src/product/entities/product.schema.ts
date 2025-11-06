import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

// Subdocumento para almacenar votos (simplificado)
export class Vote {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Boolean })
  isLike: boolean; // true = like, false = dislike

  @Prop({ default: Date.now })
  votedAt: Date;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop()
  description: string;

  @Prop()
  categoryName: string;

  @Prop()
  imageUrl: string;

  @Prop()
  imageLocalPath: string;

  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId; // ID del usuario que creó el producto

  // ========== CAMPOS PARA LIKES/DISLIKES ==========
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ type: [{ userId: Types.ObjectId, isLike: Boolean, votedAt: Date }], default: [] })
  votes: Vote[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices para búsquedas eficientes
ProductSchema.index({ userId: 1 });
ProductSchema.index({ 'votes.userId': 1 });