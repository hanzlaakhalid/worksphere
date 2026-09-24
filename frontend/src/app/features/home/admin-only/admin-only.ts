import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

/** Temporary route used only to manually verify roleGuard(['ADMIN']) blocks other roles. */
@Component({
  imports: [RouterLink, MatButtonModule, MatCardModule],
  selector: 'app-admin-only',
  styleUrl: './admin-only.scss',
  templateUrl: './admin-only.html',
})
export class AdminOnly {}
