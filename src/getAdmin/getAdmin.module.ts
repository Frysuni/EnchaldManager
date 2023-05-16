import { DiscordModule } from "@discord-nestjs/core";
import { Module } from "@nestjs/common";
import { GetAdminService } from "./getAdmin.service";
import { StorageProvider } from "./storage.provider";

@Module({
  imports: [
    DiscordModule.forFeature(),
  ],
  providers: [
    GetAdminService,
    StorageProvider,
  ],
})
export class GetAdminModule {}