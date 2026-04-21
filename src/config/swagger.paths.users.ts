import { err, jsonBody, jsonOk, oid, queryPagination } from './swagger.helpers';

const pagination = {
  type: 'object',
  properties: {
    currentPage: { type: 'integer' },
    totalPages: { type: 'integer' },
    totalItems: { type: 'integer' },
    limit: { type: 'integer' },
    hasNextPage: { type: 'boolean' },
    hasPrevPage: { type: 'boolean' },
  },
};

export const userPaths = {
  '/api/users': {
    get: {
      tags: ['Users'],
      summary: 'List users (paginated, searchable)',
      security: [{ bearerAuth: [] }],
      parameters: queryPagination([
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          example: 'john',
          description: 'Search name, username, or email',
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', enum: ['name', 'username', 'createdAt'] },
          example: 'createdAt',
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'] },
          example: 'desc',
        },
      ]),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              users: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            users: [
              {
                _id: oid,
                name: 'Jane',
                username: 'jane',
                email: 'jane@example.com',
                profileImage: 'https://example.com/a.png',
              },
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              limit: 10,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/users/profile': {
    get: {
      tags: ['Users'],
      summary: 'Current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: { type: 'object' },
            },
          },
          {
            success: true,
            user: {
              id: oid,
              name: 'John Doe',
              email: 'john@example.com',
              username: 'johndoe',
              profileImage: 'https://example.com/avatar.png',
              bio: 'Backend dev',
              skills: ['TypeScript', 'Node.js'],
              location: 'Remote',
              website: 'https://johndoe.dev',
              socialLinks: {
                twitter: '',
                linkedin: '',
                github: 'https://github.com/johndoe',
              },
              isVerified: false,
              createdAt: '2025-01-01T00:00:00.000Z',
              updatedAt: '2025-01-15T00:00:00.000Z',
            },
          },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
  '/api/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Get public user by id',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: { type: 'object' },
            },
          },
          {
            success: true,
            user: {
              _id: oid,
              name: 'Jane',
              username: 'jane',
              email: 'jane@example.com',
            },
          },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
  '/api/users/profile/{id}': {
    patch: {
      tags: ['Users'],
      summary: 'Update user profile (own profile only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      ...jsonBody(
        {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            username: { type: 'string', minLength: 2, maxLength: 50 },
            bio: { type: 'string', maxLength: 500 },
            skills: { type: 'array', items: { type: 'string' } },
            location: { type: 'string', maxLength: 100 },
            website: { type: 'string' },
            profileImage: { type: 'string' },
            socialLinks: {
              type: 'object',
              properties: {
                twitter: { type: 'string' },
                linkedin: { type: 'string' },
                github: { type: 'string' },
                facebook: { type: 'string' },
              },
            },
          },
        },
        {
          name: 'John Updated',
          bio: 'Full-stack engineer',
          skills: ['Node.js', 'React'],
          socialLinks: { github: 'https://github.com/johndoe' },
        },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: { type: 'object' },
            },
          },
          {
            success: true,
            user: {
              _id: oid,
              name: 'John Updated',
              username: 'johndoe',
              bio: 'Full-stack engineer',
            },
          },
        ),
        '401': err['401'],
        '403': err['403'],
        '404': err['404'],
      },
    },
  },
};
