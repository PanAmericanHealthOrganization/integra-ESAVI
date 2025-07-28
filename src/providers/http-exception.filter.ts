/* eslint-disable prettier/prettier */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { EntityNotFoundException } from '../integrator/exception/enntity-not-found.exception';

@Catch(HttpException, EntityNotFoundException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(
    exception: HttpException | EntityNotFoundException,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status = 500;
    if (exception instanceof EntityNotFoundException) {
      status = 404;
    } else {
      status = exception.getStatus();
    }
    response.status(status).json({
      id: request.body.ent_id,
      usuario: request.body.usr_usuario,
      success: false,
      message: exception.message,
    });
  }
}
