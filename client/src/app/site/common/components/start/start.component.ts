import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core'; // showcase

import { OperatorService, Permission } from 'app/core/core-services/operator.service';
import { ConfigRepositoryService } from 'app/core/repositories/config/config-repository.service';
import { ConfigService } from 'app/core/ui-services/config.service';
import { BaseViewComponentDirective } from 'app/site/base/base-view';
import { ProjectorMessage } from 'app/shared/models/core/projector-message';
import { ProjectorMessageRepositoryService } from 'app/core/repositories/projector/projector-message-repository.service';
import { HttpService } from 'app/core/core-services/http.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';


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
export class StartComponent extends BaseViewComponentDirective implements OnInit {
    /**
     * Whether the user is editing the content.
     */
    public isEditing = false;

    public isLocked = false;
    public isAntragSend = false;

    public stimmungApiData: any = [{ anz: 0 }, { anz: 0 }, { anz: 0 }];
    private counter: any = null;
    private subscription: any = null;
    public apiUrl: string = '';

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

        this.configService.get<string>('general_stimmung_url').subscribe(val => {
            this.apiUrl = val;
        });

        // Api Aufrufen alle 4 sekunden
        if (this.apiUrl != '') {
            // Api Daten initial aufrufen
            fetch(this.apiUrl)
                .then(response => response.json())
                .then(resp => {
                    this.stimmungApiData = resp;
                });
            if (this.counter == null) {
                this.counter = setInterval(async () => {
                    fetch(this.apiUrl)
                        .then(response => response.json())
                        .then(resp => {
                            this.stimmungApiData = resp;
                        });
                }, 4000);
            }
        } else {
            clearInterval(this.counter);
            this.counter = null;
        }
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            clearInterval(this.counter);
            this.counter = null;
        }
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
}
