import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { GeneralService } from '../services/general.service';

@Controller({ path: 'dataquality', version: '1' })
export class DataqualityController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('/general')
  @ApiResponse({
    status: 200,
    description: 'The record has been successfully retrieved.',
  })
  findAll() {
    return this.generalService.generalQuality();
  }
}
