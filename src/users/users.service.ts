import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const emailExists = await this.userModel.findOne({ email: dto.email });
    if (emailExists) throw new ConflictException('El email ya está registrado');

    const rutExists = await this.userModel.findOne({ rut: dto.rut });
    if (rutExists) throw new ConflictException('El RUT ya está registrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.userModel.create({ ...dto, password: hashed });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: Partial<CreateUserDto>): Promise<UserDocument | null> {
    if (dto.password) {
      dto = { ...dto, password: await bcrypt.hash(dto.password, 10) };
    }
    return this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
  }

  async updateSignature(id: string, signature: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userModel
      .findByIdAndUpdate(id, { signature }, { new: true })
      .select('-password')
      .exec();
  }

  async remove(id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.userModel.findByIdAndDelete(id).exec();
  }
}
