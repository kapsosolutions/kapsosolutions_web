import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../admin/admin.config';

export interface PublicCategory {
  _id: string;
  name: string;
  slug: string;
  imageUrl: string;
}

export interface DemoBookingPayload {
  name: string;
  businessName: string;
  businessAddress: string;
  category: string;
  whatsappNumber: string;
  altMobile: string;
  email: string;
}

export interface DemoBookingResponse {
  success: boolean;
  alreadyRequested?: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class DemoService {
  private http = inject(HttpClient);

  getCategories(): Observable<{ success: boolean; data: PublicCategory[] }> {
    return this.http.get<{ success: boolean; data: PublicCategory[] }>(`${API_BASE}/api/categories`);
  }

  bookDemo(payload: DemoBookingPayload): Observable<DemoBookingResponse> {
    return this.http.post<DemoBookingResponse>(`${API_BASE}/api/demo/book`, payload);
  }
}
