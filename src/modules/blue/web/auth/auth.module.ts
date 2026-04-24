import { Module } from '@nestjs/common';
import { HttpModule } from '../../../../core/http/http.module';
import { AuthService } from './auth.service';

@Module({
  imports: [HttpModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}