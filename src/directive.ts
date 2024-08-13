export interface CustomDirective {
    bind?: (el: HTMLElement, binding: any, vnode: any) => void;
    update?: (el: HTMLElement, binding: any, vnode: any) => void;
    unbind?: (el: HTMLElement, binding: any, vnode: any) => void;
}

