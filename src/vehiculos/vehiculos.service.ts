import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehiculo, VehiculoDocument } from './schemas/vehiculo.schema';
import { UpdateKilometrajeDto, UpdateMantencionDto } from './dto/update-vehiculo.dto';

@Injectable()
export class VehiculosService {
  constructor(
    @InjectModel(Vehiculo.name) private vehiculoModel: Model<VehiculoDocument>,
  ) {}

  findAll() {
    return this.vehiculoModel.find().sort({ patente: 1 }).exec();
  }

  async updateKilometraje(patente: string, dto: UpdateKilometrajeDto) {
    const upper = patente.toUpperCase();
    return this.vehiculoModel.findOneAndUpdate(
      { patente: upper },
      {
        $set: {
          kilometrajeActual: dto.kilometraje,
          ultimaActualizacion: dto.fecha ?? new Date().toLocaleDateString('es-CL'),
        },
      },
      { upsert: true, new: true },
    );
  }

  async updateMantencion(patente: string, dto: UpdateMantencionDto) {
    const upper = patente.toUpperCase();
    return this.vehiculoModel.findOneAndUpdate(
      { patente: upper },
      { $set: { proximaMantencion: dto.proximaMantencion } },
      { upsert: true, new: true },
    );
  }
}
