export { userSchema } from './schemas/user';
export type { User } from './schemas/user';
export {
  registerBodySchema,
  loginBodySchema,
  instanceStatusSchema,
  authResponseSchema,
} from './schemas/auth';
export type { RegisterBody, LoginBody, InstanceStatus, AuthResponse } from './schemas/auth';
export { apiErrorSchema } from './schemas/api';
export type { ApiError } from './schemas/api';
