import {
  err,
  jsonBody,
  jsonOk,
  oid,
  oid2,
  queryPagination,
} from './swagger.helpers';

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

export const contentPaths = {
  '/api/questions': {
    get: {
      tags: ['Questions'],
      summary: 'List questions',
      parameters: queryPagination([
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          example: 'nodejs',
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['title', 'description', 'tags', 'createdAt'],
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'] },
        },
      ]),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              questions: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            questions: [
              {
                _id: oid,
                title: 'How to test Node.js?',
                description: 'Looking for best practices...',
                tags: ['nodejs', 'testing'],
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
      },
    },
    post: {
      tags: ['Questions'],
      summary: 'Create question',
      security: [{ bearerAuth: [] }],
      ...jsonBody(
        {
          type: 'object',
          required: ['title', 'description', 'tags'],
          properties: {
            title: { type: 'string', minLength: 10, maxLength: 150 },
            description: { type: 'string', minLength: 20, maxLength: 5000 },
            tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          },
        },
        {
          title: 'How do I structure a large Express codebase?',
          description:
            'I am building a REST API and want to know folder structure and patterns.',
          tags: ['express', 'architecture'],
        },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              question: { type: 'object' },
            },
          },
          {
            success: true,
            question: {
              _id: oid,
              title: '...',
              description: '...',
              tags: ['express'],
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/questions/users/questions': {
    get: {
      tags: ['Questions'],
      summary: 'Current user questions',
      security: [{ bearerAuth: [] }],
      parameters: queryPagination(),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              questions: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            questions: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
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
  '/api/questions/{id}': {
    get: {
      tags: ['Questions'],
      summary: 'Get question by id',
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              question: { type: 'object' },
            },
          },
          {
            success: true,
            question: {
              _id: oid,
              title: 'Sample',
              description: '...',
              tags: ['a'],
            },
          },
        ),
        '404': err['404'],
      },
    },
    patch: {
      tags: ['Questions'],
      summary: 'Update question (author only)',
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
            title: { type: 'string', minLength: 10, maxLength: 150 },
            description: { type: 'string', minLength: 20, maxLength: 5000 },
            tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          },
        },
        {
          title: 'Updated title for my question',
          description: 'Updated body with at least twenty chars.',
        },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              question: { type: 'object' },
            },
          },
          {
            success: true,
            question: { _id: oid, title: 'Updated title for my question' },
          },
        ),
        '401': err['401'],
        '403': err['403'],
        '404': err['404'],
      },
    },
    delete: {
      tags: ['Questions'],
      summary: 'Delete question',
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
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Question deleted' },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
  '/api/questions/likes/{id}': {
    post: {
      tags: ['Questions'],
      summary: 'Toggle like on question',
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
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Like updated' },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/comments': {
    post: {
      tags: ['Comments'],
      summary: 'Create comment on blog, question, or job',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commentableType',
          in: 'query',
          required: true,
          schema: { type: 'string', enum: ['QUESTION', 'BLOG', 'JOB'] },
          example: 'BLOG',
        },
        {
          name: 'commentableId',
          in: 'query',
          required: true,
          schema: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
          example: oid2,
        },
      ],
      ...jsonBody(
        {
          type: 'object',
          required: ['comment'],
          properties: {
            comment: { type: 'string', minLength: 1, maxLength: 1000 },
          },
        },
        { comment: 'Great point! Thanks for sharing.' },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              comment: { type: 'object' },
            },
          },
          {
            success: true,
            message: 'Comment added successfully',
            comment: {
              _id: oid,
              comment: 'Great point!',
              commentableType: 'BLOG',
              commentableId: oid2,
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/comments/{type}/{id}': {
    get: {
      tags: ['Comments'],
      summary: 'List comments for a resource',
      parameters: [
        {
          name: 'type',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['QUESTION', 'BLOG', 'JOB'] },
          example: 'BLOG',
        },
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid2,
        },
        ...queryPagination(),
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            data: [
              {
                _id: oid,
                comment: 'Nice post!',
                commentor: { _id: oid, name: 'Jane' },
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
      },
    },
  },
  '/api/comments/{commentId}': {
    patch: {
      tags: ['Comments'],
      summary: 'Update comment',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commentId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      ...jsonBody(
        {
          type: 'object',
          required: ['comment'],
          properties: {
            comment: { type: 'string', minLength: 1, maxLength: 1000 },
          },
        },
        { comment: 'Edited: thanks for the feedback!' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              comment: { type: 'object' },
            },
          },
          {
            success: true,
            comment: { _id: oid, comment: 'Edited: thanks...' },
          },
        ),
        '401': err['401'],
      },
    },
    delete: {
      tags: ['Comments'],
      summary: 'Delete comment',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commentId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Comment deleted' },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/comments/{commentId}/like': {
    post: {
      tags: ['Comments'],
      summary: 'Toggle like on comment',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'commentId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              likesCount: { type: 'integer' },
            },
          },
          {
            success: true,
            message: 'Comment like status updated',
            likesCount: 4,
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/blogs': {
    get: {
      tags: ['Blogs'],
      summary: 'List blog posts',
      parameters: queryPagination([
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          example: 'typescript',
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', enum: ['title', 'createdAt', 'tags'] },
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'] },
        },
      ]),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              blogs: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            blogs: [
              {
                _id: oid,
                title: 'Intro to TypeScript',
                description: 'A long enough description...',
                tags: ['typescript'],
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
      },
    },
    post: {
      tags: ['Blogs'],
      summary: 'Create blog post',
      security: [{ bearerAuth: [] }],
      ...jsonBody(
        {
          type: 'object',
          required: ['title', 'description', 'tags'],
          properties: {
            title: { type: 'string', minLength: 5 },
            description: { type: 'string', minLength: 20 },
            cover: { type: 'string', format: 'uri' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 5,
            },
          },
        },
        {
          title: 'Building APIs with Express 5',
          description:
            'This post explains how we structure REST APIs with Express version five and TypeScript.',
          cover: 'https://example.com/cover.jpg',
          tags: ['express', 'api'],
        },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              blog: { type: 'object' },
            },
          },
          {
            success: true,
            message: 'Blog post created successfully',
            blog: {
              _id: oid,
              title: 'Building APIs with Express 5',
              tags: ['express'],
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/blogs/users/blogs': {
    get: {
      tags: ['Blogs'],
      summary: "Current user's blogs",
      security: [{ bearerAuth: [] }],
      parameters: queryPagination(),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              blogs: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            blogs: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
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
  '/api/blogs/{blogId}': {
    get: {
      tags: ['Blogs'],
      summary: 'Get blog by id',
      parameters: [
        {
          name: 'blogId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              blog: { type: 'object' },
            },
          },
          {
            success: true,
            blog: {
              _id: oid,
              title: 'My post',
              description: '...',
              postedBy: {},
            },
          },
        ),
        '404': err['404'],
      },
    },
    patch: {
      tags: ['Blogs'],
      summary: 'Update blog (author only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'blogId',
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
            title: { type: 'string', minLength: 5 },
            content: { type: 'string', minLength: 20 },
            cover: { type: 'string', format: 'uri' },
            tags: { type: 'array', items: { type: 'string' }, maxItems: 5 },
          },
        },
        {
          title: 'Updated title',
          content: 'Updated body with at least twenty characters.',
        },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              blog: { type: 'object' },
            },
          },
          { success: true, blog: { _id: oid, title: 'Updated title' } },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
    delete: {
      tags: ['Blogs'],
      summary: 'Delete blog',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'blogId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Blog deleted' },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/blogs/likes/{blogId}': {
    post: {
      tags: ['Blogs'],
      summary: 'Toggle like on blog',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'blogId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Like updated' },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/jobs': {
    get: {
      tags: ['Jobs'],
      summary: 'List jobs',
      parameters: queryPagination([
        { name: 'search', in: 'query', schema: { type: 'string' } },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['title', 'location', 'salaryRange', 'createdAt'],
          },
        },
        {
          name: 'sortOrder',
          in: 'query',
          schema: { type: 'string', enum: ['asc', 'desc'] },
        },
      ]),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobs: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            jobs: [
              {
                _id: oid,
                title: 'Backend Engineer',
                company: 'Acme',
                location: 'Remote',
                employmentType: 'Full-time',
                status: 'Open',
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
      },
    },
    post: {
      tags: ['Jobs'],
      summary: 'Create job posting',
      security: [{ bearerAuth: [] }],
      ...jsonBody(
        {
          type: 'object',
          required: [
            'title',
            'description',
            'company',
            'location',
            'salaryRange',
            'employmentType',
            'requiredSkills',
          ],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string', enum: ['Remote', 'On-site', 'Hybrid'] },
            salaryRange: { type: 'string', example: '$100k - $130k' },
            employmentType: {
              type: 'string',
              enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
            },
            requiredSkills: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'ISO 8601, optional',
            },
          },
        },
        {
          title: 'Senior Backend Developer',
          description: 'We are hiring for Node.js and TypeScript.',
          company: 'Tech Corp',
          location: 'Remote',
          salaryRange: '$120k - $150k',
          employmentType: 'Full-time',
          requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL'],
          expiresAt: '2026-12-31T23:59:59.000Z',
        },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              job: { type: 'object' },
            },
          },
          {
            success: true,
            message: 'Job posted successfully',
            job: {
              _id: oid,
              title: 'Senior Backend Developer',
              status: 'Open',
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/jobs/users/jobs': {
    get: {
      tags: ['Jobs'],
      summary: "Current user's job postings",
      security: [{ bearerAuth: [] }],
      parameters: queryPagination(),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              jobs: { type: 'array', items: { type: 'object' } },
              pagination,
            },
          },
          {
            success: true,
            jobs: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalItems: 0,
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
  '/api/jobs/{jobId}': {
    get: {
      tags: ['Jobs'],
      summary: 'Get job by id',
      parameters: [
        {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              job: { type: 'object' },
            },
          },
          {
            success: true,
            job: {
              _id: oid,
              title: 'Backend Engineer',
              company: 'Acme',
              status: 'Open',
            },
          },
        ),
        '404': err['404'],
      },
    },
    patch: {
      tags: ['Jobs'],
      summary: 'Update job (owner only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'jobId',
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
            title: { type: 'string' },
            description: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string', enum: ['Remote', 'On-site', 'Hybrid'] },
            salaryRange: { type: 'string' },
            employmentType: {
              type: 'string',
              enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
            },
            requiredSkills: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['Open', 'Closed'] },
          },
        },
        { status: 'Closed' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              job: { type: 'object' },
            },
          },
          { success: true, job: { _id: oid, status: 'Closed' } },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
};
