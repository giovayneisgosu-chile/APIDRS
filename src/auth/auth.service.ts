import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    const token = this.signToken(user.id, user.email, user.rol);
    return {
      token,
      user: { id: user.id, name: user.name, lastName: user.lastName, email: user.email, rol: user.rol },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.signToken(user.id, user.email, user.rol);
    return {
      token,
      user: { id: user.id, name: user.name, lastName: user.lastName, email: user.email, rol: user.rol },
    };
  }

  private signToken(userId: string, email: string, rol: string) {
    return this.jwtService.sign({ sub: userId, email, rol });
  }
}
