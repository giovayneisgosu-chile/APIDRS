import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Checklist, ChecklistDocument } from './schemas/checklist.schema';

@Injectable()
export class ChecklistService {
  constructor(
    @InjectModel(Checklist.name) private checklistModel: Model<ChecklistDocument>,
  ) {}

  async create(data: Partial<Checklist>): Promise<ChecklistDocument> {
    return this.checklistModel.create(data);
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
