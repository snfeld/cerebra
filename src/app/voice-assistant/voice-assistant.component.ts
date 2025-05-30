import {Component, OnInit, TemplateRef, ViewChild} from "@angular/core";
import {SidebarElement} from "../shared/interfaces/sidebar-element.interface";
import {Observable} from "rxjs";
import {VoiceAssistantService} from "../shared/services/voice-assistant.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import {VoiceAssistant} from "../shared/types/voice-assistant";
import {AssistantModel} from "../shared/types/assistantModel";

@Component({
    selector: "app-voice-assistant",
    templateUrl: "./voice-assistant.component.html",
    styleUrls: ["./voice-assistant.component.scss"],
})
export class VoiceAssistantComponent implements OnInit {
    personalityForm!: FormGroup;
    uuid: string | undefined;
    thresholdString: string | undefined;
    messageHistory: number | undefined;
    @ViewChild("modalContent") modalContent: TemplateRef<any> | undefined;
    ngbModalRef?: NgbModalRef;
    imgSrc: string = "../../assets/toggle-switch-left.png";
    subject!: Observable<SidebarElement[]>;
    models!: AssistantModel[];
    button: {enabled: boolean; func: () => void} = {
        enabled: true,
        func: () => {
            return;
        },
    };

    constructor(
        private voiceAssistantService: VoiceAssistantService,
        private modalService: NgbModal,
    ) {}

    voiceAssistantActivationToggle = new FormControl(false);
    voiceAssistantActiveStatus = false;

    ngOnInit() {
        this.voiceAssistantService.assistantModelsSubject.subscribe(
            (models) => {
                this.models = models;
            },
        );
        this.button.enabled = true;
        this.button.func = this.openAddModal;
        this.subject = this.voiceAssistantService.getSubject();
        this.personalityForm = new FormGroup({
            "name-input": new FormControl("", {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.minLength(2),
                    Validators.maxLength(255),
                ],
            }),
            gender: new FormControl("Female", {
                nonNullable: true,
                validators: [Validators.required],
            }),
            pausethreshold: new FormControl(0.8, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.min(0.1),
                    Validators.max(3),
                ],
            }),
            messageHistory: new FormControl(10, {
                nonNullable: true,
                validators: [
                    Validators.required,
                    Validators.min(0),
                    Validators.max(20),
                ],
            }),
            assistantModel: new FormControl(1, {
                nonNullable: true,
                validators: [Validators.required],
            }),
        });

        this.voiceAssistantService.uuidSubject.subscribe((uuid: string) => {
            this.openEditModal(uuid);
        });
    }

    showModal = () => {
        this.ngbModalRef = this.modalService.open(this.modalContent, {
            ariaLabelledBy: "modal-basic-title",
            size: "sm",
            windowClass: "cerebra-modal",
            backdropClass: "cerebra-modal-backdrop",
        });
        return this.ngbModalRef;
    };

    savePersonality = () => {
        if (this.personalityForm.valid) {
            if (this.uuid) {
                this.editPersonality(this.uuid);
            } else {
                this.addPersonality();
            }
        }
        this.ngbModalRef?.close("saved");
    };

    closeModal = () => {
        this.ngbModalRef?.close("cancelled");
    };

    adjustThreshold(step: string) {
        const newValue =
            (Number(this.personalityForm.controls["pausethreshold"].value) *
                10 +
                Number(step) * 10) /
            10;
        this.personalityForm.patchValue({
            pausethreshold: newValue,
        });
        if (this.personalityForm.controls["pausethreshold"].hasError("min")) {
            this.personalityForm.patchValue({
                pausethreshold: 0.1,
            });
        }
        if (this.personalityForm.controls["pausethreshold"].hasError("max")) {
            this.personalityForm.patchValue({
                pausethreshold: 3,
            });
        }
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value.toFixed(1) +
            "s";
    }

    adjustHistory(step: string) {
        const newValue =
            this.personalityForm.controls["messageHistory"].value +
            Number(step);
        this.personalityForm.patchValue({
            messageHistory: newValue,
        });
        if (this.personalityForm.controls["messageHistory"].hasError("min")) {
            this.personalityForm.patchValue({
                messageHistory: 0,
            });
        }
        if (this.personalityForm.controls["messageHistory"].hasError("max")) {
            this.personalityForm.patchValue({
                messageHistory: 20,
            });
        }
        this.messageHistory =
            this.personalityForm.controls["messageHistory"].value;
    }

    openAddModal = () => {
        this.personalityForm.reset();
        this.thresholdString =
            this.personalityForm.controls["pausethreshold"].value + "s";
        this.messageHistory =
            this.personalityForm.controls["messageHistory"].value;
        this.showModal();
    };

    openEditModal = (uuid: string) => {
        this.uuid = uuid;
        if (this.uuid && this.voiceAssistantService.personalities.length > 0) {
            const updatePersonality = this.voiceAssistantService.getPersonality(
                this.uuid,
            );
            this.personalityForm.patchValue({
                "name-input": updatePersonality?.name,
                gender: updatePersonality?.gender,
                pausethreshold: updatePersonality?.pauseThreshold,
            });
            this.thresholdString =
                this.personalityForm.controls["pausethreshold"].value + "s";
            this.messageHistory =
                this.personalityForm.controls["messageHistory"].value;
            this.showModal();
        }
    };

    addPersonality() {
        if (this.personalityForm.valid) {
            this.voiceAssistantService.createPersonality(
                new VoiceAssistant(
                    "",
                    this.personalityForm.controls["name-input"].value,
                    this.personalityForm.controls["gender"].value,
                    this.personalityForm.controls["pausethreshold"].value,
                    "",
                    this.personalityForm.controls["assistantModel"].value,
                    this.personalityForm.controls["messageHistory"].value,
                ),
            );
        }
    }

    editPersonality = (uuid: string) => {
        const updatePersonality = this.voiceAssistantService
            .getPersonality(uuid)
            ?.clone();
        if (updatePersonality) {
            updatePersonality.name =
                this.personalityForm.controls["name-input"].value;
            updatePersonality.gender =
                this.personalityForm.controls["gender"].value;
            updatePersonality.pauseThreshold =
                this.personalityForm.controls["pausethreshold"].value;
            this.voiceAssistantService.updatePersonalityById(updatePersonality);
            updatePersonality.messageHistory =
                this.personalityForm.controls["messageHistory"].value;
        }
        this.uuid = undefined;
    };
}
