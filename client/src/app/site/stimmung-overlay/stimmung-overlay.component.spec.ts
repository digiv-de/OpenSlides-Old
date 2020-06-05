import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { E2EImportsModule } from 'e2e-imports.module';

import { StimmungOverlayComponent } from './stimmung-overlay.component';

describe('StimmungDialogComponent', () => {
    let component: StimmungOverlayComponent;
    let fixture: ComponentFixture<StimmungOverlayComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            imports: [E2EImportsModule],
            declarations: [StimmungOverlayComponent],
            providers: [
                { provide: MatDialogRef },
                {
                    provide: MAT_DIALOG_DATA
                }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(StimmungOverlayComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
