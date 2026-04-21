import { appsPaths } from './swagger.paths.apps';
import { authPaths } from './swagger.paths.auth';
import { contentPaths } from './swagger.paths.content';
import { userPaths } from './swagger.paths.users';

/**
 * Full OpenAPI paths for Swagger UI. Split across `swagger.paths.*.ts` modules.
 * Each operation includes JSON Schema + example for request/response bodies where applicable.
 */
export const swaggerPaths = {
  ...authPaths,
  ...userPaths,
  ...contentPaths,
  ...appsPaths,
};
