import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  //const authService = inject(AuthService);
  //const token = authService.getToken();

  const token = localStorage.getItem('auth_token');

  console.log('INTERCEPTOR TOKEN:', token);
  console.log('INTERCEPTOR URL:', req.url);

  if (!token) {
    return next(req);
  }

  const reqConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('AUTH HEADER ENVIADO:', reqConToken.headers.get('Authorization'));

  return next(reqConToken);
};