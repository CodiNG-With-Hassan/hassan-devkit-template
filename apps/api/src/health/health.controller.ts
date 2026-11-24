import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './health-response.dto';

// Liveness probe for uptime checks and container healthchecks. It answers as
// soon as the app is up, which already implies the database connection was
// made: TypeORM initializes before the HTTP server starts listening.
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Report that the API is up' })
  @ApiOkResponse({ type: HealthResponse })
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
