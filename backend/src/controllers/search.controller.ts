import { Request, Response } from 'express';
import { searchService } from '../services/search.service';
import { ApiError } from '../lib/apiError';
import type { SearchQuery } from '../validation/search.validation';

export const searchController = {
  async search(req: Request, res: Response) {
    if (!req.user) {
      throw ApiError.unauthorized();
    }
    const { q } = (req.validated?.query ?? {}) as SearchQuery;
    const results = await searchService.search(q, { userId: req.user.sub, role: req.user.role });
    res.status(200).json({ data: results });
  },
};
