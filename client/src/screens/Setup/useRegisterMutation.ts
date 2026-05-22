import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface Credentials {
  username: string;
  password: string;
  googleBooksApiKey: string;
}

export const useRegisterMutation = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ username, password, googleBooksApiKey }: Credentials) =>
      api.auth.register(username, password, googleBooksApiKey),
    onSuccess: ({ token, user }) => {
      login(token, user);
      navigate('/', { replace: true });
    },
  });
};
