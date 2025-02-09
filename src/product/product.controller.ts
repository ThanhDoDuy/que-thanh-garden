import { Controller, Post, UploadedFile, Body, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import * as AWS from 'aws-sdk';
import * as multerS3 from 'multer-s3';

// AWS S3 configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {
  }

  @Post('upload')  // Ensure the route matches '/product/upload'
  @UseInterceptors(FileInterceptor('image'))
  async uploadProduct(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto,
  ) {
    await this.productService.upload(file);
    const fileName = file.originalname;
    // Tạo Pre-signed URL lâu dài (7 ngày hoặc tùy bạn chọn)
    const preSignedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: fileName,
      Expires: 86400 * 7,  // 7 ngày
    });

    return this.productService.createProduct({
      ...createProductDto,
      image: fileName, 
      imageURL: preSignedUrl,
    });
  }
}
