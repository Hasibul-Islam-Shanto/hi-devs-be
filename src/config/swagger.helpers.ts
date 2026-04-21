/** Shared OpenAPI fragments for Swagger UI (schemas + examples). */

export const oid = '507f1f77bcf86cd799439011';
export const oid2 = '507f1f77bcf86cd799439012';

const msg = (description: string, example: string) => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      example: { message: example },
    },
  },
});

export const err = {
  400: msg('Bad request', 'Validation failed or invalid input'),
  401: msg('Unauthorized', 'Unauthorized access'),
  403: msg('Forbidden', 'You do not have permission for this action'),
  404: msg('Not found', 'Resource not found'),
  500: msg('Server error', 'Internal server error'),
};

export function jsonBody(
  schema: Record<string, unknown>,
  example: Record<string, unknown>,
  required = true,
) {
  return {
    requestBody: {
      required,
      content: {
        'application/json': {
          schema,
          example,
        },
      },
    },
  };
}

export function jsonOk(schema: Record<string, unknown>, example: unknown) {
  return {
    description: 'Success',
    content: {
      'application/json': {
        schema,
        example,
      },
    },
  };
}

export function queryPagination(extra: Record<string, unknown>[] = []) {
  return [
    {
      name: 'page',
      in: 'query' as const,
      schema: { type: 'integer', minimum: 1, default: 1 },
      example: 1,
      description: 'Page number',
    },
    {
      name: 'limit',
      in: 'query' as const,
      schema: { type: 'integer', minimum: 1, default: 10 },
      example: 10,
      description: 'Items per page',
    },
    ...extra,
  ];
}
