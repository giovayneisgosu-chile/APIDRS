import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Checklist, ChecklistDocument } from './schemas/checklist.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
    private cloudinary: CloudinaryService,
    private sheetsService: GoogleSheetsService,
  ) {}

  async create(data: any, pdfBuffer?: Buffer, userId?: string): Promise<ChecklistDocument> {
    const checklist = await this.checklistModel.create({
      ...data,
      creadoPor: userId ? new Types.ObjectId(userId) : null,
    });

    if (pdfBuffer) {
      const fecha = data.fecha ?? new Date().toLocaleDateString('es-CL');
      const nombre = (data.nombre ?? 'conductor').replace(/\s+/g, '_');
      const fileName = `CheckList_${nombre}_${fecha}.pdf`;
      const urlPdf = await this.cloudinary.subirPdf(pdfBuffer, 'checklists', fileName);
      checklist.urlPdf = urlPdf;
      await checklist.save();

      this.sheetsService.agregarChecklist({
        fecha, conductor: data.nombre ?? '', run: data.run ?? '',
        patente: data.patente ?? '', empresa: data.empresa ?? '', urlPdf,
      }).catch(() => null);
    }

    return checklist;
  }

  async findAll(): Promise<ChecklistDocument[]> {
    return this.checklistModel.find().populate('creadoPor', 'name lastName email').sort({ createdAt: -1 }).exec();
  }

  async findByPatente(patente: string): Promise<ChecklistDocument[]> {
    return this.checklistModel.find({ patente: patente.toUpperCase() }).sort({ createdAt: -1 }).exec();
  }

  async findByUsuario(userId: string): Promise<ChecklistDocument[]> {
    return this.checklistModel.find({ creadoPor: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
  }

  async contarPorUsuario(userId: string): Promise<{ total: number }> {
    const total = await this.checklistModel.countDocuments({ creadoPor: new Types.ObjectId(userId) });
    return { total };
  }
}
