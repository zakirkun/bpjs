// Type for state values, can be string, number, boolean, object, or array
export type StateValue = string | number | boolean | object | Array<any>;

// Interface for custom directive
export interface CustomDirective {
  bind?: (el: HTMLElement, binding: any, vnode: any) => void;
  update?: (el: HTMLElement, binding: any, vnode: any) => void;
  unbind?: (el: HTMLElement, binding: any, vnode: any) => void;
}

// Interface for component options
interface ComponentOptions<S extends Record<string, StateValue>> {
  template: string;
  data: () => S;
  methods?: Record<string, (this: S, event?: Event) => void>;
  beforeCreate?: () => void;
  created?: () => void;
  beforeMount?: () => void;
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
  beforeDestroy?: () => void;
  destroyed?: () => void;
  directives?: Record<string, CustomDirective>;
}

// Main Component class
export class Component<S extends Record<string, StateValue>> {
    constructor(options: ComponentOptions<S>);
  
    public mount(selector: string): void;
    public destroy(): void;
    public setState(newState: Partial<S>): void;
}