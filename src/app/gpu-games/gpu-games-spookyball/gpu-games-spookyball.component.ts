import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-gpu-games-spookyball',
  templateUrl: './gpu-games-spookyball.component.html',
  styleUrls: ['./gpu-games-spookyball.component.scss']
})
export class GpuGamesSpookyballComponent implements OnInit,AfterViewInit {
  @ViewChild('theCanvas', { static: true }) theCanvas!: ElementRef;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.draw();
  }

  draw() {
    
  }

}
