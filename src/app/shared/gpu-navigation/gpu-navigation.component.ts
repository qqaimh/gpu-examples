import { Component, Input, OnInit } from '@angular/core';
import { GpuNavigationModel } from '../models/common.model';

@Component({
  selector: 'app-gpu-navigation',
  templateUrl: './gpu-navigation.component.html',
  styleUrls: ['./gpu-navigation.component.scss']
})
export class GpuNavigationComponent implements OnInit {
  @Input() gpuNavigations: GpuNavigationModel[] = [];

  constructor() { }

  ngOnInit(): void {
  }

}
