import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (
    req.url.startsWith('http://') ||
    req.url.startsWith('https://') ||
    req.url.startsWith('assets/')
  ) {
    return next(req);
  }

  const baseApiUrl = environment.apiUrl || '/api';
  
  // If the request URL already starts with baseApiUrl (e.g. '/api/auth/login' or 'http://localhost:5049/api/auth/login')
  if (req.url.startsWith(baseApiUrl)) {
    return next(req);
  }

  // Avoid duplicating /api if req.url starts with /api/
  if (req.url.startsWith('/api/') || req.url === '/api') {
    return next(req);
  }

  const normalizedBase = baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl;
  const normalizedPath = req.url.startsWith('/') ? req.url : `/${req.url}`;

  const apiReq = req.clone({
    url: `${normalizedBase}${normalizedPath}`
  });

  return next(apiReq);
};
