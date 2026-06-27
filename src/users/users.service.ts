import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { CreateUserDto } from './dto/create-user.dto';

export enum UserRole {
  ADMIN = 'admin',
  USUARIO = 'usuario',
  SSO = 'sso',
  CONSTRUCCION = 'construccion',
  LOGISTICA = 'logistica',
}

export interface UserEntity {
  id: string;
  name: string;
  lastName: string;
  rut: string;
  email: string;
  password: string;
  phone: string;
  rol: string;
  empresa: string;
  signature: string;
  isActive: boolean;
  createdAt: string;
}

const SHEET = 'Usuarios';
const HEADERS = [
  'id', 'name', 'lastName', 'rut', 'email', 'password',
  'phone', 'rol', 'empresa', 'signature', 'isActive', 'createdAt',
];

@Injectable()
export class UsersService {
  constructor(private sheets: GoogleSheetsService) {}

  private parse(row: Record<string, string>): UserEntity {
    return { ...row, isActive: row.isActive !== 'false' } as unknown as UserEntity;
  }

  private serialize(u: UserEntity): Record<string, any> {
    return { ...u, isActive: String(u.isActive) };
  }

  private strip(u: UserEntity): Omit<UserEntity, 'password'> {
    const { password: _p, ...rest } = u;
    return rest;
  }

  private async getAll(): Promise<UserEntity[]> {
    return (await this.sheets.dbGetAll(SHEET)).map(r => this.parse(r));
  }

  async create(dto: CreateUserDto): Promise<UserEntity> {
    const all = await this.getAll();
    if (all.some(u => u.email === dto.email.toLowerCase())) {
      throw new ConflictException('El email ya está registrado');
    }
    if (all.some(u => u.rut === dto.rut)) {
      throw new ConflictException('El RUT ya está registrado');
    }
    const user: UserEntity = {
      id: this.sheets.generateId(),
      name: dto.name,
      lastName: dto.lastName,
      rut: dto.rut,
      email: dto.email.toLowerCase(),
      password: await bcrypt.hash(dto.password, 10),
      phone: dto.phone,
      rol: dto.rol ?? UserRole.USUARIO,
      empresa: dto.empresa ?? 'drs',
      signature: dto.signature ?? '',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await this.sheets.dbAppend(SHEET, HEADERS, this.serialize(user));
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const all = await this.getAll();
    return all.find(u => u.email === email.toLowerCase()) ?? null;
  }

  async findAll(): Promise<Omit<UserEntity, 'password'>[]> {
    return (await this.getAll()).map(u => this.strip(u));
  }

  async findOne(id: string): Promise<UserEntity> {
    const all = await this.getAll();
    const user = all.find(u => u.id === id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: Partial<CreateUserDto>): Promise<Omit<UserEntity, 'password'>> {
    const all = await this.getAll();
    const current = all.find(u => u.id === id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    const updated: UserEntity = {
      ...current,
      ...(dto as any),
      id,
      email: dto.email ? dto.email.toLowerCase() : current.email,
      password: dto.password ? await bcrypt.hash(dto.password, 10) : current.password,
    };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, this.serialize(updated));
    return this.strip(updated);
  }

  async updateSignature(id: string, signature: string): Promise<Omit<UserEntity, 'password'>> {
    const all = await this.getAll();
    const current = all.find(u => u.id === id);
    if (!current) throw new NotFoundException('Usuario no encontrado');
    const updated: UserEntity = { ...current, signature };
    await this.sheets.dbUpdate(SHEET, id, HEADERS, this.serialize(updated));
    return this.strip(updated);
  }

  async remove(id: string): Promise<{ message: string }> {
    const all = await this.getAll();
    if (!all.find(u => u.id === id)) throw new NotFoundException('Usuario no encontrado');
    await this.sheets.dbDelete(SHEET, id);
    return { message: 'Usuario eliminado' };
  }
}
