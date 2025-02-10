import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { S3 } from 'aws-sdk';
import { Logger, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ProductService {
  constructor(@InjectModel(Product.name) private productModel: Model<Product>) { }

  async createProduct(createProductDto: CreateProductDto & { image: string }): Promise<Product> {
    const s3 = this.getS3();
    const newUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: createProductDto.image,
      Expires: 604800,
    });

    const createdProduct = new this.productModel({...createProductDto, imageURL: newUrl});
    return createdProduct.save();
  }

  async upload(file) {
    const { originalname } = file;
    const bucketS3 = 'que-thanh-garden';
    await this.uploadS3(file.buffer, bucketS3, originalname);
  }

  async uploadS3(file, bucket, name) {
    const s3 = this.getS3();
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
    };
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          Logger.error(err);
          reject(err.message);
        }
        resolve(data);
      });
    });
  }

  getS3() {
    return new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }

  async getAllProducts() {
    return this.productModel.find();
  };

  // Kiểm tra xem URL có hợp lệ không bằng cách gửi request HEAD
  async updateImageUrl(productId: string) {
    const imageData = await this.productModel.findOne({ _id: productId });
    if (!imageData) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const s3 = this.getS3();
    const newUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: imageData.image,
      Expires: 604800,
    });

    const result = await this.productModel.findOneAndUpdate(
      { _id: productId },
      { $set: { imageURL: newUrl } }
    );
   
    if (!result) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    return { productId, newUrl };  // Trả về sản phẩm đã được cập nhật (nếu cần)
  };

  async updateProductName(productId: string, name: string) {
    return await this.productModel.updateOne(
      { _id: productId },
      { $set: { name: name } }
    );
  };

  async deleteProduct(productId: string) {
    return await this.productModel.deleteOne({ _id: productId });
  }
}
