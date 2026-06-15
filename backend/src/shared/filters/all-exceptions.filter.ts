import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

// Filtro global: padroniza o formato de erro retornado pela API,
// cobrindo tanto HttpException (lançadas pelos Services) quanto erros inesperados.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = this.resolveStatusCode(exception);
    const message = this.resolveMessage(exception);
    const error = this.resolveError(exception, statusCode);

    if (statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ErrorResponseBody = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveMessage(exception: unknown): string | string[] {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = response.message;
        if (typeof message === 'string' || Array.isArray(message)) {
          return message;
        }
      }
      return exception.message;
    }
    return 'Erro interno do servidor';
  }

  private resolveError(exception: unknown, statusCode: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (
        typeof response === 'object' &&
        response !== null &&
        'error' in response
      ) {
        const error = response.error;
        if (typeof error === 'string') {
          return error;
        }
      }
      return exception.name;
    }
    return HttpStatus[statusCode] ?? 'Internal Server Error';
  }
}
