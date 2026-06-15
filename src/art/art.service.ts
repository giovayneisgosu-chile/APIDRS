import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Art, ArtDocument } from './schemas/art.schema';
import { CreateArtDto } from './dto/create-art.dto';
import { ArtPdfPlantillaService } from '../pdf/art-pdf-plantilla.service';
import { UsersService } from '../users/users.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class ArtService {
  constructor(
    @InjectModel(Art.name) private artModel: Model<ArtDocument>,
    private pdfService: ArtPdfPlantillaService,
    private usersService: UsersService,
    private sheetsService: GoogleSheetsService,
  ) {}

  async create(dto: CreateArtDto, userId: string): Promise<ArtDocument> {
    const numeroDia = await this.contarArtsDia(userId, dto.fecha);

    const otrosRiesgos = (dto.otrosRiesgos ?? []).map(({ riesgo, medidaControl }) => ({ riesgo, medidaControl }));
    const participantes = (dto.participantes ?? []).map(({ nombre, cargo, enCondiciones, firma }) => ({ nombre, cargo, enCondiciones, firma }));

    const art = await this.artModel.create({
      ...dto,
      otrosRiesgos,
      participantes,
      creadoPor: new Types.ObjectId(userId),
      numeroDia,
    });

    // Generar PDF en segundo plano sin bloquear la respuesta
    this.generarYGuardarPdf(art, userId).catch(() => null);

    return art;
  }

  private async generarYGuardarPdf(art: ArtDocument, userId: string): Promise<void> {
    const usuario = await this.usersService.findOne(userId);
    if (!usuario) return;
    const userName = `${usuario.name} ${usuario.lastName}`;
    const urlPdf = await this.pdfService.generateArtPdf(art.toObject(), userName);
    await this.artModel.findByIdAndUpdate(art._id, { urlPdf });
    const a = art.toObject() as any;
    this.sheetsService.agregarArt({
      fecha: a.fecha ?? '', supervisor: a.supervisorAsignador ?? '',
      empresa: a.empresa ?? '', trabajo: a.trabajoARealizar ?? '',
      lugar: a.lugarEspecifico ?? '', lider: a.liderNombre ?? '',
      urlPdf,
    }).catch(() => null);
  }

  async regenerarPdf(id: string, userId: string): Promise<{ urlPdf: string }> {
    const art = await this.findOne(id);
    const usuario = await this.usersService.findOne(userId);
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    const userName = `${usuario.name} ${usuario.lastName}`;
    const urlPdf = await this.pdfService.generateArtPdf(art.toObject(), userName);
    await this.artModel.findByIdAndUpdate(id, { urlPdf });
    return { urlPdf };
  }

  async findAll(filters: {
    userId?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    empresa?: string;
    superintendencia?: string;
  }): Promise<ArtDocument[]> {
    const query: any = {};
    if (filters.userId) query.creadoPor = new Types.ObjectId(filters.userId);
    if (filters.empresa) query.empresa = new RegExp(filters.empresa, 'i');
    if (filters.superintendencia) query.superintendencia = new RegExp(filters.superintendencia, 'i');
    if (filters.fechaDesde || filters.fechaHasta) {
      query.fecha = {};
      if (filters.fechaDesde) query.fecha.$gte = filters.fechaDesde;
      if (filters.fechaHasta) query.fecha.$lte = filters.fechaHasta;
    }
    return this.artModel.find(query).populate('creadoPor', 'name lastName email').sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ArtDocument> {
    const art = await this.artModel.findById(id).populate('creadoPor', 'name lastName email').exec();
    if (!art) throw new NotFoundException('ART no encontrada');
    return art;
  }

  async getStats(filters: { fechaDesde?: string; fechaHasta?: string }) {
    const match: any = {};
    if (filters.fechaDesde) match.fecha = { ...match.fecha, $gte: filters.fechaDesde };
    if (filters.fechaHasta) match.fecha = { ...match.fecha, $lte: filters.fechaHasta };

    const [porUsuario, porEmpresa, total] = await Promise.all([
      this.artModel.aggregate([
        { $match: match },
        { $group: { _id: '$creadoPor', total: { $sum: 1 }, ultima: { $max: '$fecha' } } },
        { $lookup: { from: 'usuarios', localField: '_id', foreignField: '_id', as: 'usuario' } },
        { $unwind: '$usuario' },
        { $project: { nombre: { $concat: ['$usuario.name', ' ', '$usuario.lastName'] }, email: '$usuario.email', total: 1, ultima: 1 } },
        { $sort: { total: -1 } },
      ]),
      this.artModel.aggregate([
        { $match: match },
        { $group: { _id: '$empresa', total: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      this.artModel.countDocuments(match),
    ]);

    return { total, porUsuario, porEmpresa };
  }

  async remove(id: string): Promise<ArtDocument | null> {
    const art = await this.artModel.findById(id);
    if (!art) throw new NotFoundException('ART no encontrada');
    return this.artModel.findByIdAndDelete(id).exec();
  }

  private async contarArtsDia(userId: string, fecha: string): Promise<number> {
    const count = await this.artModel.countDocuments({ creadoPor: new Types.ObjectId(userId), fecha });
    return count + 1;
  }
}
