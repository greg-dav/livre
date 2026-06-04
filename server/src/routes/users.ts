import { Router } from 'express';
import {
  createUserBodySchema,
  managedUserSchema,
  okResponseSchema,
  updateUserBodySchema,
  usersListResponseSchema,
} from '@livre/types';
import { type RequestHandler } from 'express';
import { SchemaRouter } from '../lib/SchemaRouter';
import { requireUser, idParam } from '../lib/request';
import { type UsersService } from '../services/UsersService';

export function createUsersRouter(service: UsersService, requireAdmin: RequestHandler): Router {
  const admin = new SchemaRouter().use(requireAdmin);

  /** List every account on the instance. */
  admin.get('/', usersListResponseSchema, (respond) => {
    respond({ users: service.list() });
  });

  /** Create a new account. */
  admin.post('/', createUserBodySchema, managedUserSchema, async (body, respond) => {
    respond(await service.create(body), 201);
  });

  /** Edit an existing account (username, password, and/or admin flag). */
  admin.patch('/:id', updateUserBodySchema, managedUserSchema, async (body, respond, req) => {
    respond(await service.update(idParam(req, 'id'), body));
  });

  /** Remove an account. */
  admin.delete('/:id', okResponseSchema, (respond, req) => {
    service.remove(requireUser(req).id, idParam(req, 'id'));
    respond({ ok: true });
  });

  return admin.router;
}
