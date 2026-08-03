import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, tap } from 'rxjs';

const cache = new Map<string, { response: HttpResponse<unknown>; expiresAt: number }>();
const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only cache specific GET requests for static master data
  if (req.method !== 'GET' || !req.url.includes('/master-data/')) {
    return next(req);
  }

  const cached = cache.get(req.urlWithParams);
  if (cached && cached.expiresAt > Date.now()) {
    return of(cached.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        cache.set(req.urlWithParams, {
          response: event.clone(),
          expiresAt: Date.now() + DEFAULT_TTL_MS
        });
      }
    })
  );
};
