import { type Router, type RequestHandler } from 'express';
import { usersContract } from '@livre/types';
import { server, mountContract, userOf, ok, created } from '../lib/tsRest';
import { type UsersService } from '../services/UsersService';

export function createUsersRouter(service: UsersService, requireAdmin: RequestHandler): Router {
  const router = server.router(usersContract, {
    list: async () => ok({ users: service.list() }),

    create: async ({ body }) => created(await service.create(body)),

    update: async ({ params, body }) => ok(await service.update(params.id, body)),

    remove: async ({ params, req }) => {
      service.remove(userOf(req).id, params.id);
      return ok({ ok: true });
    },
  });

  return mountContract(usersContract, router, requireAdmin);
}
