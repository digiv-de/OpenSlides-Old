import { Component, Inject, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { OperatorService } from 'app/core/core-services/operator.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { HttpService } from 'app/core/core-services/http.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ConfigService } from 'app/core/ui-services/config.service';

/**
 * Dialog component for countdowns
 */
@Component({
    selector: 'os-stimmung-overlay',
    templateUrl: './stimmung-overlay.component.html',
    styleUrls: ['./stimmung-overlay.component.scss']
})
export class StimmungOverlayComponent extends BaseViewComponentDirective implements OnInit {
    /**
     * The form data
     */
    //public stimmungForm: FormGroup;

    public isLocked = false;
    public isAntragSend = false;
    public apiUrl: string = '';
    private apiToken: string = '';
    public goAntraege: [] = [];
    public selGoAntrag: string = '';

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
        private configService: ConfigService,
        matSnackBar: MatSnackBar,
        translate: TranslateService
    ) {
        super(title, translate, matSnackBar);
    }


    /**
     * Init. Creates the form
     */
    public ngOnInit(): void {
        this.configService.get<string>('general_stimmung_url').subscribe(val => {
            if(val != '') {
                this.apiUrl = val ? val + '/raise' : '';
            }
        });
        this.configService.get<string>('general_stimmung_token').subscribe(val => {
            this.apiToken = val;
        });
        this.configService.get<string>('go_antraege').subscribe(val => {
            this.goAntraege = JSON.parse(val);
        });
    }

    /**
     * Stellen eines GO-Antrags: Anzeige auf Projektor 1.
     * Wird als "Projektor Message" gespeichert und angezeigt
     */
    public async goAntrag() {
        // Neue Message erstellen
        const theId: any = await this.projectorMessageRepositoryService.create(new ProjectorMessage({
            message: `<p style="font-size: 45px;">GO-Antrag</p>\n<p style="font-size: 35px;">auf ${this.goAntraege[this.selGoAntrag]}<br>von ${this.operator.user.first_name} ${this.operator.user.last_name} gestellt`
        }));
       
        // Anzeigen
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

        this.httpCli.post(this.apiUrl,requestData,
            {headers: new HttpHeaders({
                'Authorization': this.apiToken
            })}).subscribe();
    }
}
