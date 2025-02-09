import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Product extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true })
  image: string;  // Lưu tên file gốc, ví dụ: "a.jpg"

  @Prop({ required: true })
  imageURL: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
