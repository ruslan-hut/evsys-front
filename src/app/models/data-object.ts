export interface DataObject {
  field: string;
  value: string | number | SimpleDataObject[];
}

export interface SimpleDataObject {
  field: string;
  value: string | number;
}
