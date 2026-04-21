import {
  err,
  jsonBody,
  jsonOk,
  oid,
  oid2,
  queryPagination,
} from './swagger.helpers';

const paginationWithUnread = {
  type: 'object',
  properties: {
    currentPage: { type: 'integer' },
    totalPages: { type: 'integer' },
    totalItems: { type: 'integer' },
    limit: { type: 'integer' },
    unreadCount: { type: 'integer' },
  },
};

const appPagination = {
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

export const appsPaths = {
  '/api/applications': {
    post: {
      tags: ['Applications'],
      summary: 'Apply to a job',
      security: [{ bearerAuth: [] }],
      ...jsonBody(
        {
          type: 'object',
          required: ['jobId', 'coverLetter', 'resumeUrl'],
          properties: {
            jobId: { type: 'string', pattern: '^[0-9a-fA-F]{24}$' },
            coverLetter: { type: 'string', minLength: 1 },
            portfolioUrl: { type: 'string', format: 'uri' },
            resumeUrl: { type: 'string', format: 'uri' },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
              default: 'pending',
            },
          },
        },
        {
          jobId: oid2,
          coverLetter:
            'I have 5 years of experience with Node.js and would love to contribute.',
          portfolioUrl: 'https://johndoe.dev',
          resumeUrl: 'https://example.com/resume.pdf',
        },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              message: { type: 'string' },
              application: { type: 'object' },
            },
          },
          {
            message: 'Application submitted successfully',
            application: {
              _id: oid,
              jobId: oid2,
              status: 'pending',
              coverLetter: '...',
              resumeUrl: 'https://example.com/resume.pdf',
            },
          },
        ),
        '400': err['400'],
        '401': err['401'],
        '403': err['403'],
        '404': err['404'],
      },
    },
  },
  '/api/applications/{applicationId}': {
    get: {
      tags: ['Applications'],
      summary: 'Get application (applicant or job owner)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'applicationId',
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
              message: { type: 'string' },
              applicationWithRoles: {
                type: 'object',
                properties: {
                  application: { type: 'object' },
                  isJobOwner: { type: 'boolean' },
                  isApplicant: { type: 'boolean' },
                },
              },
            },
          },
          {
            message: 'Application retrieved successfully',
            applicationWithRoles: {
              application: { _id: oid, status: 'pending' },
              isJobOwner: true,
              isApplicant: false,
            },
          },
        ),
        '400': err['400'],
        '403': err['403'],
      },
    },
    patch: {
      tags: ['Applications'],
      summary: 'Update application status (job owner only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'applicationId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid,
        },
      ],
      ...jsonBody(
        {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'rejected'],
            },
          },
        },
        { status: 'accepted' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              message: { type: 'string' },
              application: { type: 'object' },
            },
          },
          {
            message: 'Application updated successfully',
            application: { _id: oid, status: 'accepted' },
          },
        ),
        '403': err['403'],
        '404': err['404'],
      },
    },
  },
  '/api/applications/job/{jobId}': {
    get: {
      tags: ['Applications'],
      summary: 'List applications for a job (job owner only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'jobId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: oid2,
        },
        ...queryPagination([
          {
            name: 'search',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by status text',
          },
          {
            name: 'sortBy',
            in: 'query',
            schema: { type: 'string', enum: ['createdAt'] },
          },
          {
            name: 'sortOrder',
            in: 'query',
            schema: { type: 'string', enum: ['asc', 'desc'] },
          },
        ]),
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              message: { type: 'string' },
              applications: { type: 'array', items: { type: 'object' } },
              pagination: appPagination,
            },
          },
          {
            message: 'Applications retrieved successfully',
            applications: [],
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
        '403': err['403'],
        '404': err['404'],
      },
    },
  },
  '/api/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', default: 1 },
          example: 1,
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
          example: 20,
        },
      ],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              notifications: { type: 'array', items: { type: 'object' } },
              pagination: paginationWithUnread,
            },
          },
          {
            success: true,
            notifications: [
              {
                _id: oid,
                type: 'LIKE',
                message: 'Someone liked your blog post.',
                isRead: false,
              },
            ],
            pagination: {
              currentPage: 1,
              totalPages: 1,
              totalItems: 1,
              limit: 20,
              unreadCount: 3,
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Unread notification count',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              unreadCount: { type: 'integer' },
            },
          },
          { success: true, unreadCount: 5 },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/notifications/read-all': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'All notifications marked as read' },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/notifications/{notificationId}/read': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark one notification as read',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'notificationId',
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
          { success: true, message: 'Notification marked as read' },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
  '/api/notifications/{notificationId}': {
    delete: {
      tags: ['Notifications'],
      summary: 'Delete notification',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'notificationId',
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
          { success: true, message: 'Notification deleted' },
        ),
        '401': err['401'],
        '404': err['404'],
      },
    },
  },
};
