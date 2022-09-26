import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-gpu-gltf-ktx',
  templateUrl: './gpu-gltf-ktx.component.html',
  styleUrls: ['./gpu-gltf-ktx.component.scss']
})
export class GpuGltfKtxComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.fetchKtx()
  }

  async fetchKtx() {
    const response = await fetch('../../../assets/shadow/textures/skybox/cube-basis-mipmap.ktx2');
    console.log(11112222, response);
    if (!response.ok) {
      return console.log(`Fetch failed: ${response.status}, ${response.statusText}`);
    }
    let buffer = await response.arrayBuffer();
  }

}
