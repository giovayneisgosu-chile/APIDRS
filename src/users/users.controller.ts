import { Controller, Get, Put, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateSignatureDto } from './dto/update-signature.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateUserDto>) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/signature')
  updateSignature(@Param('id') id: string, @Body() dto: UpdateSignatureDto) {
    return this.usersService.updateSignature(id, dto.signature);
  }

  @Roles('admin')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
