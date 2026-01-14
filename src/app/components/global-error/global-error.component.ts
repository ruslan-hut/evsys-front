import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {ErrorService} from "../../service/error.service";
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-global-error',
    templateUrl: './global-error.component.html',
    styleUrls: ['./global-error.component.css'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [AsyncPipe]
})
export class GlobalErrorComponent {
  readonly errorService = inject(ErrorService);
}
