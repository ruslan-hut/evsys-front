import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    standalone: true,
    imports: [MatToolbar]
})
export class FooterComponent {

}
