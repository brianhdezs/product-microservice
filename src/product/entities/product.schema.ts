import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
}

export const ProductSchema = SchemaFactory.createForClass(Product);