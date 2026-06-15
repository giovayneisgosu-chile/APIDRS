import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Checklist, ChecklistSchema } from './schemas/checklist.schema';
import { ChecklistService } from './checklist.service';
import { ChecklistController } from './checklist.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Checklist.name, schema: ChecklistSchema }])],
  controllers: [ChecklistController],
  providers: [ChecklistService],
})
export class ChecklistModule {}
