import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseViewComponent } from 'app/site/base/base-view';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { HttpService } from 'app/core/core-services/http.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

/**
 * Dialog component for countdowns
 */
@Component({
    selector: 'os-stimmung-overlay',
    templateUrl: './stimmung-overlay.component.html',
    styleUrls: ['./stimmung-overlay.component.scss']
})
export class StimmungOverlayComponent extends BaseViewComponent implements OnInit {
    /**
     * The form data
     */
    //public stimmungForm: FormGroup;

    public isLocked = false;
    public isAntragSend = false;

    /**
     * Constructor
     *
     * @param title Title service. Required by parent
     * @param matSnackBar Required by parent
     * @param configService Read out config variables
     * @param translate Required by parent
     * @param formBuilder To build the form
     * @param durationService Converts duration numbers to string
     * @param data The mat dialog data, contains the values to display (if any)
     */
    public constructor(
        title: Title,
        private operator: OperatorService,
        private projectorMessageRepositoryService: ProjectorMessageRepositoryService,
        private http: HttpService,
        private httpCli: HttpClient,
        matSnackBar: MatSnackBar,
        translate: TranslateService
    ) {
        super(title, translate, matSnackBar);
    }


    /**
     * Init. Creates the form
     */
    public ngOnInit(): void {
    }

    /**
     * Stellen eines GO-Antrags: Anzeige auf Projektor 1.
     * Wird als "Projektor Message" gespeichert und angezeigt
     */
    public async goAntrag() {
        // Neue Message erstellen
        const theId: any = await this.projectorMessageRepositoryService.create(new ProjectorMessage({
            message: `<p style="font-size: 45px;">GO-Antrag</p>\n<p style="font-size: 35px;">von ${this.operator.user.first_name} ${this.operator.user.last_name} gestellt`
        }));
       
        // Anzeigen
        //this.projectorService.projectOn(proj,this.projectorMessageRepositoryService.getViewModel(theId.id))
        const requestData: any = {};
        requestData.elements = [{"stable": false, "name": "core/projector-message", "id":theId.id}];
        
        await this.http.post('/rest/core/projector/1/project/', requestData);

        this.isAntragSend = true;
        setTimeout(() => {
            this.isAntragSend = false;
        }, 3000);
    }

    /**
     * Handeln der Stimmungskarten.
     * @param typ 1: Grün, 2: Gelb, 3: Rot
     */
    public async hebeKarte(typ: number) {
        const requestData: any = {};
        
        requestData.typ = typ;
        requestData.ts = Math.round(+new Date()/1000);
        requestData.user = this.operator.user.username;

        this.isLocked = true;
        setTimeout(() => {
            this.isLocked = false;
        }, 30000);

        //const url ='https://srv02.loebling-it.de:8080/api/raise';
        const url = 'https://stmg.digiv.de/raise';

        this.httpCli.post(url,requestData,
            {headers: new HttpHeaders({
                'Authorization': 'Bearer 348eogdihvklnq2w0p93pqtoejgvfcub'
            })}).subscribe();
    }
}
