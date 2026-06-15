import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Epp, EppDocument } from './schemas/epp.schema';
import { CreateEppDto } from './dto/create-epp.dto';
import { EppPdfService } from '../pdf/epp-pdf.service';
import { UsersService } from '../users/users.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';

@Injectable()
export class EppService {
  constructor(
    @InjectModel(Epp.name) private eppModel: Model<EppDocument>,
    private pdfService: EppPdfService,
    private usersService: UsersService,
    private sheetsService: GoogleSheetsService,
  ) {}

  async create(dto: CreateEppDto, usuarioId: string): Promise<Epp> {
    const user = await this.usersService.findOne(usuarioId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const numero = (await this.eppModel.countDocuments()) + 1;

    const entregadoPor = {
      nombre: `${user.name} ${user.lastName}`,
      rut: user.rut,
      rol: user.rol,
    };

    const epp = new this.eppModel({ ...dto, numero, empresa: user.empresa, entregadoPor });
    const saved = await epp.save();

    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(saved.toObject()),
      entregadoPor.nombre,
      this.buildFileName(saved.toObject()),
    );
    saved.urlPdf = url;
    await saved.save();
    const obj = saved.toObject() as any;
    this.sheetsService.agregarEpp({
      fecha: String(obj.fecha ?? ''), numero: String(obj.numero ?? ''),
      trabajador: obj.trabajador?.nombre ?? '', rut: obj.trabajador?.rut ?? '',
      cargo: obj.trabajador?.cargo ?? '', empresa: obj.empresa ?? '',
      estado: obj.estado ?? 'pendiente', urlPdf: url,
    }).catch(() => null);
    return saved;
  }

  async findAll(): Promise<Epp[]> {
    return this.eppModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Epp> {
    const epp = await this.eppModel.findById(id).exec();
    if (!epp) throw new NotFoundException('EPP no encontrado');
    return epp;
  }

  async findMisPendientes(usuarioId: string): Promise<Epp[]> {
    return this.eppModel
      .find({ 'trabajador.usuarioId': usuarioId, estado: 'pendiente' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async firmar(id: string, usuarioId: string): Promise<Epp> {
    const epp = await this.eppModel.findById(id).exec();
    if (!epp) throw new NotFoundException('EPP no encontrado');
    if (epp.estado === 'firmado') throw new ForbiddenException('Este EPP ya fue firmado');

    const user = await this.usersService.findOne(usuarioId);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.signature) throw new ForbiddenException('El usuario no tiene firma guardada');

    epp.firma = user.signature;
    epp.estado = 'firmado';
    epp.fechaFirma = new Date();

    const eppObj = epp.toObject() as any;
    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(eppObj),
      eppObj.entregadoPor?.nombre ?? 'USUARIO',
      this.buildFileName(eppObj),
    );
    epp.urlPdf = url;
    return epp.save();
  }

  async regenerarPdf(id: string): Promise<Epp> {
    const epp = await this.eppModel.findById(id).exec();
    if (!epp) throw new NotFoundException('EPP no encontrado');
    const eppObj = epp.toObject() as any;
    const url = await this.pdfService.generateEppPdf(
      this.buildDatos(eppObj),
      eppObj.entregadoPor?.nombre ?? 'USUARIO',
      this.buildFileName(eppObj),
    );
    epp.urlPdf = url;
    return epp.save();
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.eppModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('EPP no encontrado');
    return { message: 'EPP eliminado correctamente' };
  }

  // ── Helpers ──────────────────────────────────────────────────

  private buildDatos(epp: any): any {
    return {
      empresa:        epp.empresa,
      nombre:         epp.trabajador?.nombre ?? '',
      numero:         String(epp.numero ?? ''),
      cargo:          epp.trabajador?.cargo ?? '',
      rut:            epp.trabajador?.rut ?? '',
      fecha:          epp.fecha ?? '',
      firma:          epp.firma ?? null,
      elementos:      (epp.items ?? []).map((item: any) => ({
        epp:      item.epp ?? '',
        marca:    item.marca ?? '',
        cant:     String(item.cant ?? ''),
        talla:    item.talla ?? '',
        fecha:    item.fecha ?? '',
        recambio: '',
      })),
      entregadoPor:   epp.entregadoPor?.nombre ?? '',
      entregadoRut:   epp.entregadoPor?.rut ?? '',
      entregadoCargo: epp.entregadoPor?.rol ?? '',
    };
  }

  private buildFileName(epp: any): string {
    const nombre = (epp.trabajador?.nombre ?? 'Trabajador')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')
      .substring(0, 40);
    const fecha = String(epp.fecha ?? '').replace(/\//g, '-');
    const empresa = (epp.empresa ?? 'drs').toUpperCase();
    return `EPP_${nombre}_${fecha}_${empresa}.pdf`;
  }
}
