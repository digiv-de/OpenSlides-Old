import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from 'app/shared/shared.module';
import { SiteRoutingModule } from './site-routing.module';
import { SiteComponent } from './site.component';
import { StimmungOverlayComponent } from './stimmung-overlay/stimmung-overlay.component';

@NgModule({
    imports: [CommonModule, SharedModule, SiteRoutingModule],
    declarations: [SiteComponent,StimmungOverlayComponent]
})
export class SiteModule {}
