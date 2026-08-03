import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ProblemDetails } from '../models/api-response.model';
import { NotificationService } from '../services/notification.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let errorTitle = 'Operation Failed';

      if (error.error && typeof error.error === 'object') {
        const pd = error.error as ProblemDetails;
        errorTitle = pd.title || errorTitle;
        errorMessage = pd.detail || errorMessage;

        if (pd.errors) {
          const firstValidation = Object.values(pd.errors)[0];
          if (firstValidation && firstValidation.length > 0) {
            errorMessage = firstValidation[0];
          }
        }
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      } else if (error.status === 401) {
        errorTitle = 'Session Expired';
        errorMessage = 'Please sign in again to continue.';
      } else if (error.status === 403) {
        errorTitle = 'Access Denied';
        errorMessage = 'You do not have permission to perform this action.';
      }

      notificationService.error(errorTitle, errorMessage);
      return throwError(() => error);
    })
  );
};
