import { Component } from '@angular/core';
import { GpuNavigationModel } from '../shared/models';

@Component({
  selector: 'gpu-examples-gpu-orillusion',
  templateUrl: './gpu-orillusion.component.html',
  styleUrls: ['./gpu-orillusion.component.scss']
})
export class GpuOrillusionComponent {
  gpuNavigations: GpuNavigationModel[] = [
    {
      name: 'clusteredball',
      url: './clusteredball',
    },
  ];
}
