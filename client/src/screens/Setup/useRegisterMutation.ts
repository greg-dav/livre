import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Credentials {
  username: string;
  password: string;
}

export const useRegisterMutation = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ username, password }: Credentials) => api.auth.register(username, password),
    onSuccess: ({ token, user }) => {
      login(token, user);
      navigate('/', { replace: true });
    },
  });
};
