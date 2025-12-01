import { Document, FilterQuery, Model } from 'mongoose';

interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  select?: string;
  populate?: { path: string; select?: string };
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
    populate,
    select = '',
  } = options;

  const skip = (page - 1) * limit;

  const sortObject: Record<string, 1 | -1> = {};
  sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = model.find(filter).sort(sortObject).skip(skip).limit(limit);

  if (select) {
    query = query.select(select);
  }

  if (populate) {
    if (Array.isArray(populate)) {
      populate.forEach((pop) => {
        query = query.populate(pop);
      });
    } else {
      query = query.populate(populate);
    }
  }

  const [data, totalItems] = await Promise.all([
    query.exec(),
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
