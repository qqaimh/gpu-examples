import { ElementRef, inject, Injector } from "@angular/core";

interface HostShowComponentInterface {
  injector: Injector;
  repaint:  Function;
  ngOnInit?: Function;
  ngOnDestroy?: Function;
}

export function methodTest(): MethodDecorator {
  return function (target: HostShowComponentInterface, key: string, descriptor: any) {
    console.log(4444, descriptor)

    const ngOnInitUnpatched = target?.ngOnInit;
    let elementRef: ElementRef;
    let intersectionObserver: IntersectionObserver;

    target.ngOnInit = function (this: HostShowComponentInterface) {
      elementRef = this.injector.get(ElementRef)
      intersectionObserver = new IntersectionObserver((entries) => {
        console.log(999990000)
        // If intersectionRatio is 0, the target is out of view
        // and we do not need to do anything.
        if (entries[0].intersectionRatio <= 0) return;
        console.log(999991111)
        this.repaint();
      });
      
      // start observing
      intersectionObserver.observe(elementRef.nativeElement);
      console.log(4444, elementRef)
      console.log(5555, ngOnInitUnpatched)
      if (ngOnInitUnpatched) {
        ngOnInitUnpatched.call(this);
      }

     
    };
     // patch classProto.ngOnDestroy if it exists to remove a listener
     const ngOnDestroyUnpatched = target?.ngOnDestroy;
     target.ngOnDestroy = () => {
       console.log(8888999)
       if (ngOnDestroyUnpatched) {
         ngOnDestroyUnpatched.call(this);
       }
       intersectionObserver.unobserve(elementRef.nativeElement);
     }
  }

}
