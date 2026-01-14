import {Component, Input, ChangeDetectionStrategy, inject} from '@angular/core';
import {ModalService} from "../../service/modal.service";

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  readonly modalService = inject(ModalService);

  @Input() title: string;
}
