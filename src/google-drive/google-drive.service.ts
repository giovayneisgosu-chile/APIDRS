import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { Readable } from 'stream';

@Injectable()
export class GoogleDriveService {
  private drive: any;
  private rootFolderId: string;
  private folderCache = new Map<string, string>();

  private static normalizePem(pem: string): string {
    const match = pem.match(/-----BEGIN ([A-Z ]+)-----\s*([\s\S]+?)\s*-----END ([A-Z ]+)-----/);
    if (!match) return pem;
    const body = match[2].replace(/\s+/g, '');
    const wrapped = body.match(/.{1,64}/g)!.join('\n');
    return `-----BEGIN ${match[1]}-----\n${wrapped}\n-----END ${match[3]}-----\n`;
  }

  constructor(private config: ConfigService) {
    const clientEmail = config.get<string>('GOOGLE_CLIENT_EMAIL');
    const rawKey = config.get<string>('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n') ?? '';
    const privateKey = rawKey ? GoogleDriveService.normalizePem(rawKey) : undefined;
    this.rootFolderId = config.get<string>('GOOGLE_DRIVE_FOLDER_ID') ?? '';

    if (!clientEmail || !privateKey) return;

    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: clientEmail, private_key: privateKey },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
    this.drive = google.drive({ version: 'v3', auth });
  }

  private async getOrCreateFolder(name: string): Promise<string> {
    if (this.folderCache.has(name)) return this.folderCache.get(name)!;

    const res = await this.drive.files.list({
      q: `'${this.rootFolderId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
    });

    if (res.data.files?.length) {
      const id = res.data.files[0].id;
      this.folderCache.set(name, id);
      return id;
    }

    const folder = await this.drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [this.rootFolderId],
      },
      fields: 'id',
    });
    const id = folder.data.id;
    this.folderCache.set(name, id);
    return id;
  }

  async subirArchivo(buffer: Buffer, carpeta: string, nombreArchivo: string, mimeType: string): Promise<string> {
    const folderId = await this.getOrCreateFolder(carpeta);

    const stream = Readable.from(buffer);
    const res = await this.drive.files.create({
      requestBody: { name: nombreArchivo, mimeType, parents: [folderId] },
      media: { mimeType, body: stream },
      fields: 'id',
    });

    const fileId = res.data.id;
    await this.drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  async subirPdf(buffer: Buffer, carpeta: string, nombreArchivo: string): Promise<string> {
    return this.subirArchivo(buffer, carpeta, nombreArchivo, 'application/pdf');
  }
}
