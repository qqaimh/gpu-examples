import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { methodTest } from './my-decorator';

@Component({
  selector: 'app-gpu-thinker-method-decorator',
  templateUrl: './gpu-thinker-method-decorator.component.html',
  styleUrls: ['./gpu-thinker-method-decorator.component.scss']
})
export class GpuThinkerMethodDecoratorComponent implements OnInit, OnDestroy {

  constructor(public injector: Injector,) { }

  ngOnInit(): void {
    console.log(1111)
  }

  ngOnDestroy(): void {
    console.log(99999)
  }

  @methodTest()
  repaint() {
    console.log(2222)
  }

}
