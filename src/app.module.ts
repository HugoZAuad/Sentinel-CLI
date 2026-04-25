import { Module } from '@nestjs/common';
import { CliModule } from './cli/cli.module';
import { BrowserModule } from './core/browser/browser.module';
import { FormatterModule } from './core/formatter/formatter.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { BlueModule } from './modules/blue/blue.module';
import { RedModule } from './modules/red/red.module';

@Module({
  imports: [
    InfrastructureModule, 
    FormatterModule,      
    BrowserModule,        
    RedModule,            
    BlueModule,           
    CliModule,            
  ],
})
export class AppModule {}