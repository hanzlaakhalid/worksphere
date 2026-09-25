import { Request, Response } from 'express';
import { documentService } from '../services/document.service';
import { requireParam } from '../lib/params';
import { ApiError } from '../lib/apiError';
import type { CreateDocumentInput, ListDocumentsQuery } from '../validation/document.validation';

function requireUser(req: Request) {
  if (!req.user) {
    throw ApiError.unauthorized();
  }
  return req.user;
}

export const documentController = {
  async list(req: Request, res: Response) {
    const user = requireUser(req);
    const query = (req.validated?.query ?? {}) as ListDocumentsQuery;
    const result = await documentService.list(query, { userId: user.sub, role: user.role });
    res.status(200).json(result);
  },

  async create(req: Request, res: Response) {
    const user = requireUser(req);
    const document = await documentService.create(req.body as CreateDocumentInput, { userId: user.sub, role: user.role });
    res.status(201).json({ data: document });
  },

  async remove(req: Request, res: Response) {
    const user = requireUser(req);
    await documentService.delete(requireParam(req, 'id'), { userId: user.sub, role: user.role });
    res.status(204).send();
  },
};
