import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Difusion, DifusionDocument, EstadoDifusion } from './schemas/difusion.schema';
import { CreateDifusionDto } from './dto/create-difusion.dto';
import { DifusionPdfService } from '../pdf/difusion-pdf.service';
import { UsersService } from '../users/users.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class DifusionService {
  constructor(
    @InjectModel(Difusion.name) private difusionModel: Model<DifusionDocument>,
    private pdfService: DifusionPdfService,
    private usersService: UsersService,
    private sheetsService: GoogleSheetsService,
  ) {}

  async create(dto: CreateDifusionDto, userId: string): Promise<DifusionDocument> {
    const difusion = await this.difusionModel.create({
      ...dto,
      creadoPor: new Types.ObjectId(userId),
      estado: EstadoDifusion.PENDIENTE,
    });
    this.generarYGuardarPdfs(difusion).catch(() => null);
    return difusion;
  }

  private async generarYGuardarPdfs(difusion: DifusionDocument): Promise<void> {
    const urls = await this.pdfService.generarPdfs(difusion.toObject());
    await this.difusionModel.findByIdAndUpdate(difusion._id, {
      urlPdfDrs: urls.urlDrs,
      urlPdfFda: urls.urlFda,
    });
    const d = difusion.toObject() as any;
    this.sheetsService.agregarDifusion({
      fecha: d.fecha ?? '', tema: d.temaPrincipal ?? '',
      relator: d.relator ?? '', empresa: d.empresa ?? '',
      participantes: (d.participantes ?? []).length,
      estado: d.estado ?? '', urlDrs: urls.urlDrs ?? '', urlFda: urls.urlFda ?? '',
    }).catch(() => null);
  }

  async firmar(id: string, userId: string): Promise<DifusionDocument> {
    const difusion = await this.findOne(id);
    const usuario = await this.usersService.findOne(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const participantes = difusion.toObject().participantes.map((p: any) => {
      if (p.usuarioId === userId) {
        return { ...p, firmado: true, firma: usuario.signature, fechaFirma: new Date().toISOString() };
      }
      return p;
    });

    const todosFirmaron = participantes.every((p: any) => p.firmado);
    const algunoFirmo   = participantes.some((p: any) => p.firmado);
    const estado = todosFirmaron
      ? EstadoDifusion.COMPLETADO
      : algunoFirmo ? EstadoDifusion.EN_PROCESO : EstadoDifusion.PENDIENTE;

    const updated = await this.difusionModel.findByIdAndUpdate(
      id, { participantes, estado }, { new: true },
    );

    if (todosFirmaron) {
      this.generarYGuardarPdfs(updated!).catch(() => null);
    }
    return updated!;
  }

  async regenerarPdfs(id: string): Promise<{ urlPdfDrs?: string; urlPdfFda?: string }> {
    const difusion = await this.findOne(id);
    const urls = await this.pdfService.generarPdfs(difusion.toObject());
    await this.difusionModel.findByIdAndUpdate(id, {
      urlPdfDrs: urls.urlDrs,
      urlPdfFda: urls.urlFda,
    });
    return { urlPdfDrs: urls.urlDrs, urlPdfFda: urls.urlFda };
  }

  async findAll(filters: { userId?: string; estado?: string; empresa?: string }): Promise<DifusionDocument[]> {
    const query: any = {};
    if (filters.userId)  query.creadoPor = new Types.ObjectId(filters.userId);
    if (filters.estado)  query.estado = filters.estado;
    if (filters.empresa) query['participantes.empresa'] = new RegExp(filters.empresa, 'i');
    return this.difusionModel.find(query).populate('creadoPor', 'name lastName email').sort({ createdAt: -1 });
  }

  async findMisPendientes(userId: string): Promise<DifusionDocument[]> {
    return this.difusionModel.find({
      'participantes.usuarioId': userId,
      'participantes.firmado': false,
      estado: { $ne: EstadoDifusion.COMPLETADO },
    }).sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<DifusionDocument> {
    const d = await this.difusionModel.findById(id).populate('creadoPor', 'name lastName email');
    if (!d) throw new NotFoundException('Difusión no encontrada');
    return d;
  }

  async remove(id: string): Promise<void> {
    const d = await this.difusionModel.findById(id);
    if (!d) throw new NotFoundException('Difusión no encontrada');
    await this.difusionModel.findByIdAndDelete(id);
  }
}
