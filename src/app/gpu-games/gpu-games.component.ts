import { Component, OnInit } from '@angular/core';
import { GpuNavigationModel } from '../shared/models';

@Component({
  selector: 'app-gpu-games',
  templateUrl: './gpu-games.component.html',
  styleUrls: ['./gpu-games.component.scss']
})
export class GpuGamesComponent implements OnInit {
  gpuNavigations: GpuNavigationModel[] = [
    {
      name: 'spookyball',
      url: './spookyball',
    },
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
