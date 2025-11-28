import { Document, FilterQuery, Model } from 'mongoose';

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  select?: string;
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginate<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: PaginationOptions,
): Promise<PaginationResult<T>> {
  const {
    page,
    limit,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    select = '',
  } = options;

  const skip = (page - 1) * limit;

  const sortObject: Record<string, 1 | -1> = {};
  sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [data, totalItems] = await Promise.all([
    model.find(filter).select(select).sort(sortObject).skip(skip).limit(limit),
    model.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
