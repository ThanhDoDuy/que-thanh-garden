import { Controller, Post, UploadedFile, Body, UseInterceptors, Get, Patch, Delete, Param } from '@nestjs/common';
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
    return this.productService.createProduct({
      ...createProductDto,
      image: fileName,
    });
  }

  @Get('all')
  async getAllProducts() {
    return this.productService.getAllProducts();
  }

  @Patch('generate-presigned-url')
  async generatePresignedUrl(
    @Body('productId') productId: string,
  ) {
    return await this.productService.updateImageUrl(productId);
  };

  @Patch(':id')
  async updateProductName(@Param('id') id: string, @Body('name') name: string) {
    return await this.productService.updateProductName(id, name);
  }

  @Delete(':id')
  async deleteProduct(@Param('id') id: string) {
    return await this.productService.deleteProduct(id);
  }
}
