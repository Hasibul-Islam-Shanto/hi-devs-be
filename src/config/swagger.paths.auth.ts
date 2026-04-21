import { err, jsonBody, jsonOk, oid } from './swagger.helpers';

const userPublic = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    username: { type: 'string' },
    email: { type: 'string' },
    _id: { type: 'string' },
    bio: { type: 'string' },
    profileImage: { type: 'string' },
    location: { type: 'string' },
    website: { type: 'string' },
    socialLinks: { type: 'object' },
    skills: { type: 'array', items: { type: 'string' } },
    isVerified: { type: 'boolean' },
  },
};

export const authPaths = {
  '/api/auth/signup': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new user',
      ...jsonBody(
        {
          type: 'object',
          required: ['username', 'email', 'password', 'name'],
          properties: {
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            name: { type: 'string', minLength: 1 },
          },
        },
        {
          username: 'johndoe',
          email: 'john@example.com',
          password: 'secret12',
          name: 'John Doe',
        },
      ),
      responses: {
        '201': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'User created successfully.' },
        ),
        '400': err['400'],
      },
    },
  },
  '/api/auth/signin': {
    post: {
      tags: ['Auth'],
      summary: 'Sign in',
      ...jsonBody(
        {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        { email: 'john@example.com', password: 'secret12' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              user: userPublic,
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
          {
            success: true,
            message: 'Login successful.',
            user: {
              name: 'John Doe',
              username: 'johndoe',
              email: 'john@example.com',
              _id: oid,
              bio: '',
              profileImage: 'https://example.com/avatar.png',
              location: '',
              website: '',
              socialLinks: { twitter: '', linkedin: '', github: '' },
              skills: [],
              isVerified: false,
            },
            tokens: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        ),
        '400': err['400'],
      },
    },
  },
  '/api/auth/refresh-token': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh access token',
      ...jsonBody(
        {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
          {
            success: true,
            tokens: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
              refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        ),
        '401': err['401'],
      },
    },
  },
  '/api/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Logout (invalidate refresh token)',
      ...jsonBody(
        {
          type: 'object',
          required: ['refreshToken'],
          properties: { refreshToken: { type: 'string' } },
        },
        { refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      ),
      responses: {
        '200': jsonOk(
          {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          { success: true, message: 'Logout successful' },
        ),
        '400': err['400'],
      },
    },
  },
};
