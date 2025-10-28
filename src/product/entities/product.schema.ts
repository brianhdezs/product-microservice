import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

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
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índice para búsquedas eficientes por usuario
ProductSchema.index({ userId: 1 });