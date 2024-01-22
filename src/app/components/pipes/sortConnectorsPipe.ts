import { Pipe, PipeTransform } from '@angular/core';
import {Connector} from "../../models/connector";

@Pipe({
  name: 'sortConnectors'
})
export class SortConnectorsPipe implements PipeTransform {
  transform(connectors: Connector[]): Connector[] {
    if (!connectors || connectors.length <= 1) {
      return connectors;
    }

    connectors.sort((a, b) => Number(a.connector_id) - Number(b.connector_id));

    return connectors;
  }
}
