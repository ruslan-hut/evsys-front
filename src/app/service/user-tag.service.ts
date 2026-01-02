import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {UserTag} from '../models/user-tag';

@Injectable({
  providedIn: 'root'
})
export class UserTagService {

  constructor(private http: HttpClient) {}

  getAll(): Observable<UserTag[]> {
    return this.http.get<UserTag[]>(`${environment.apiUrl}/user-tags/list`);
  }

  getByIdTag(idTag: string): Observable<UserTag> {
    return this.http.get<UserTag>(`${environment.apiUrl}/user-tags/info/${idTag}`);
  }

  create(tag: Partial<UserTag>): Observable<UserTag> {
    return this.http.post<UserTag>(`${environment.apiUrl}/user-tags/create`, tag);
  }

  update(idTag: string, tag: Partial<UserTag>): Observable<UserTag> {
    return this.http.put<UserTag>(`${environment.apiUrl}/user-tags/update/${idTag}`, tag);
  }

  delete(idTag: string): Observable<{success: boolean; message: string}> {
    return this.http.delete<{success: boolean; message: string}>(`${environment.apiUrl}/user-tags/delete/${idTag}`);
  }
}
