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
      name: 'ktx2',
      url: './ktx2',
    },
    {
      name: 'shadow',
      url: './shadow',
    },
    {
      name: 'metaballs',
      url: './metaballs',
    },
    {
      name: 'clusteredball',
      url: './clusteredball',
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
