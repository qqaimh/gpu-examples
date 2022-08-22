import { Component, OnInit } from '@angular/core';
import { GpuNavigationModel } from '../shared/models';

@Component({
  selector: 'app-gpu-gltf',
  templateUrl: './gpu-gltf.component.html',
  styleUrls: ['./gpu-gltf.component.scss']
})
export class GpuGltfComponent implements OnInit {
  gpuNavigations: GpuNavigationModel[] = [
    {
      name: 'camera',
      url: './camera',
    },
    {
      name: 'shadow',
      url: './shadow',
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
