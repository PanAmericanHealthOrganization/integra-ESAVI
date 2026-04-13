/* eslint-disable prettier/prettier */
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundException } from '../integrator/exception/enntity-not-found.exception';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = 500;
    let message = 'Internal server error';

    try {
      if (exception instanceof EntityNotFoundException) {
        status = 404;
        message = exception.message || 'Entity not found';
      } else if (exception instanceof HttpException) {
        status = exception.getStatus();
        message = exception.message || 'HTTP Exception';
      } else {
        // Para errores no HTTP
        status = 500;
        message = exception?.message || 'Unknown error';
      }
    } catch (error) {
      // Si hay error obteniendo el status, usar valores por defecto
      console.error('Error in HttpExceptionFilter:', error);
      status = 500;
      message = 'Internal server error';
    }

    // Log del error para debugging
    console.error(`HTTP Exception Filter - ${request.method} ${request.url}:`, {
      status,
      message,
      stack: exception?.stack,
      body: request.body,
    });

    // Información adicional para debugging
    const errorResponse = {
      id: request.body?.ent_id || null,
      usuario: request.body?.usr_usuario || null,
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Solo incluir stack trace en desarrollo
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'des') {
      errorResponse['stack'] = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
