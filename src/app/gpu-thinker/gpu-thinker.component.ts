import { Component, OnInit } from '@angular/core';
import { GpuNavigationModel } from '../shared/models';

@Component({
  selector: 'app-gpu-thinker',
  templateUrl: './gpu-thinker.component.html',
  styleUrls: ['./gpu-thinker.component.scss']
})
export class GpuThinkerComponent implements OnInit {
  gpuNavigations: GpuNavigationModel[] = [
    {
      name: 'method-decorator',
      url: './method-decorator',
    },
  ]

  constructor() { }

  ngOnInit(): void {
  }

}
