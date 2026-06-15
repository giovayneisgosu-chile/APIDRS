import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checklist, ChecklistDocument } from './schemas/checklist.schema';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
    private sheetsService: GoogleSheetsService,
  ) {}

  async create(data: Partial<Checklist>): Promise<ChecklistDocument> {
    const checklist = await this.checklistModel.create(data);
    const fecha = new Date().toLocaleDateString('es-CL');
    this.sheetsService.agregarChecklist({
      fecha,
      nombre: data.nombre ?? '',
      run: data.run ?? '',
      patente: data.patente ?? '',
      kilometraje: data.kilometraje ?? '',
      nivelCombustible: data.nivelCombustible ?? '',
      equipoCritico: data.equipoCritico ?? '',
      dispositivosFatiga: data.dispositivosFatiga ?? '',
      tieneDocumentacion: data.tieneDocumentacion ?? '',
      tieneLicencia: data.tieneLicencia ?? '',
      verificacionPernos: data.verificacionPernos ?? '',
    }).catch(() => null);
    return checklist;
  }

  async findAll(): Promise<ChecklistDocument[]> {
    return this.checklistModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByPatente(patente: string): Promise<ChecklistDocument[]> {
    return this.checklistModel
      .find({ patente: patente.toUpperCase() })
      .sort({ createdAt: -1 })
      .exec();
  }
}
