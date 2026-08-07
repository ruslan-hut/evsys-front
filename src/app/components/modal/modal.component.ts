import {Component, input, ChangeDetectionStrategy, inject} from '@angular/core';
import {ModalService} from "../../service/modal.service";

@Component({
    selector: 'app-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalComponent {
  readonly modalService = inject(ModalService);

  readonly title = input<string>();
}
