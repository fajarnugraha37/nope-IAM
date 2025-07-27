/**
 * Example: NestJS integration with IAM
 */
import { Module, Controller, UseGuards, Get } from '@nestjs/common';
import { IamGuard, IAM, InMemoryAdapter } from '..';

@Controller('resource')
@UseGuards(IamGuard)
export class ResourceController {
  @Get()
  getResource(): string {
    return 'Resource accessed';
  }
}

@Module({
  controllers: [ResourceController],
  providers: [
    { provide: IAM, useValue: new IAM() },
    { provide: InMemoryAdapter, useValue: new InMemoryAdapter() },
    IamGuard,
  ],
})
export class AppModule {}
