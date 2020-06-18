import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core'; // showcase

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { BaseViewComponent } from 'app/site/base/base-view';
import { HttpService } from 'app/core/core-services/http.service';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval } from 'rxjs';

/**
 * Interface describes the keys for the fields at start-component.
 */
interface IStartContent {
    general_event_welcome_title: string;
    general_event_welcome_text: string;
}

/**
 * The start component. Greeting page for OpenSlides
 */
@Component({
    selector: 'os-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.scss']
})
export class StartComponent extends BaseViewComponent implements OnInit {
    /**
     * Whether the user is editing the content.
     */
    public isEditing = false;

    public isLocked = false;
    public isAntragSend = false;

    public stimmungApiData: any = [{anz:0},{anz:0},{anz:0}];
    private counter: any = null;
    private subscription: any = null;
    private apiUrl: string = 'https://stmg.digiv.de/datasource';

    /**
     * Formular for the content.
     */
    public startForm: FormGroup;

    /**
     * Holding the values for the content.
     */
    public startContent: IStartContent = {
        general_event_welcome_title: '',
        general_event_welcome_text: ''
    };

    /**
     * Constructor of the StartComponent
     *
     * @param titleService the title serve
     * @param translate to translation module
     * @param configService read out config values
     */
    public constructor(
        titleService: Title,
        translate: TranslateService,
        matSnackbar: MatSnackBar,
        private configService: ConfigService,
        private configRepo: ConfigRepositoryService,
        private fb: FormBuilder,
        private operator: OperatorService,
        private http: HttpService,
        private httpCli: HttpClient,
        private projectorMessageRepositoryService: ProjectorMessageRepositoryService,
    ) {
        super(titleService, translate, matSnackbar);
        this.startForm = this.fb.group({
            general_event_welcome_title: ['', Validators.required],
            general_event_welcome_text: ''
        });
    }

    /**
     * Init the component.
     *
     * Sets the welcomeTitle and welcomeText.
     */
    public ngOnInit(): void {
        super.setTitle('Home');

        // set the welcome title
        this.configService
            .get<string>('general_event_welcome_title')
            .subscribe(welcomeTitle => (this.startContent.general_event_welcome_title = welcomeTitle));

        // set the welcome text
        this.configService.get<string>('general_event_welcome_text').subscribe(welcomeText => {
            this.startContent.general_event_welcome_text = this.translate.instant(welcomeText);
        });

        // Api Daten initial aufrufen
        fetch(this.apiUrl)
           .then(response => response.json())
        .then(resp => {
            this.stimmungApiData = resp;
        });

        // Api Aufrufen alle 4 sekunden
        this.counter = interval(4000);
        
        this.subscription = this.counter.subscribe(x => {
            fetch(this.apiUrl)
                .then(response => response.json())
                .then(resp => {
                    this.stimmungApiData = resp;
                });
        });
    }

    public ngOnDestroy(): void {
        console.log('____________');
        this.subscription.unsubscribe();
        //window.clearInterval(this.counter);
    }
    /**
     * Changes to editing mode.
     */
    public editStartPage(): void {
        Object.keys(this.startForm.controls).forEach(control => {
            this.startForm.patchValue({ [control]: this.startContent[control] });
        });
        this.isEditing = true;
    }

    /**
     * Saves changes and updates the content.
     */
    public saveChanges(): void {
        this.configRepo
            .bulkUpdate(
                Object.keys(this.startForm.controls).map(control => ({
                    key: control,
                    value: this.startForm.value[control]
                }))
            )
            .then(() => (this.isEditing = !this.isEditing), this.raiseError);
    }

    /**
     * Returns, if the current user has the necessary permissions.
     */
    public canManage(): boolean {
        return this.operator.hasPerms(Permission.coreCanManageConfig);
    }

    /**
     * Stellen eines GO-Antrags: Anzeige auf Projektor 1.
     * Wird als "Projektor Message" gespeichert und angezeigt
     */
    public async goAntrag() {
        // Neue Message erstellen
        const theId:any = await this.projectorMessageRepositoryService.create(new ProjectorMessage({
            message: `<p style="font-size: 45px;">GO-Antrag</p>\n<p style="font-size: 35px;">von ${this.operator.user.first_name} ${this.operator.user.last_name} gestellt`
        }));
        // console.log('erzeugt wurde: '+theId.id);
        
        // 1. Projektor holen
        //var proj: Projector = new Projector({id: 1});
        //console.log('---- proj ----');
        //console.log(proj);
        
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
        requestData.user = this.operator.user.first_name;
        
        //console.log(requestData);
        //console.log('-------------');

        this.isLocked = true;
        setTimeout(() => {
            this.isLocked = false;
        }, 30000);

        const url ='https://srv02.loebling-it.de:8080/api/raise';
        //const url = 'https://stimmung-test.bv.dpsg.de/raise';

        this.httpCli.post(url,requestData,
            {headers: new HttpHeaders({
                'Authorization': 'Bearer 348eogdihvklnq2w0p93pqtoejgvfcub'
            })}).subscribe();
    }
}
