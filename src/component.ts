import { CustomDirective } from './directive';
import { reactive, effect } from './reactive';

type StateValue = string | number | boolean | any[] | Record<string, any>;

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

export class Component<S extends Record<string, StateValue>> {

  private state: S;
  private template: string;
  private element: HTMLElement;
  private methods: Record<string, (this: S, event?: Event) => void>;
  private directives: Record<string, CustomDirective>;

  private hooks: {
    beforeCreate?: () => void;
    created?: () => void;
    beforeMount?: () => void;
    mounted?: () => void;
    beforeUpdate?: () => void;
    updated?: () => void;
    beforeDestroy?: () => void;
    destroyed?: () => void;
  };
  

  constructor(options: ComponentOptions<S>) {
    this.state = reactive(options.data());
    this.template = options.template;
    this.methods = options.methods || {};
    this.directives = options.directives || {};

    this.hooks = {
      beforeCreate: options.beforeCreate,
      created: options.created,
      beforeMount: options.beforeMount,
      mounted: options.mounted,
      beforeUpdate: options.beforeUpdate,
      updated: options.updated,
      beforeDestroy: options.beforeDestroy,
      destroyed: options.destroyed,
    };

    this.bindMethods();

     // Call the beforeCreate hook
     if (this.hooks.beforeCreate) this.hooks.beforeCreate();

    // Call Template
    this.element = document.createElement('div');

    // Call the created hook
    if (this.hooks.created) this.hooks.created();

    // Automatically re-render the DOM when the state changes
    effect(() => {
      this.updateDom();
      this.addEventListeners();
    });

     // Call the beforeMount hook
     if (this.hooks.beforeMount) this.hooks.beforeMount();
  }

  private applyDirectives() {
    for (const [directiveName, directive] of Object.entries(this.directives)) {
      const elements = this.element.querySelectorAll(`[v-${directiveName}]`);
      elements.forEach(el => {
        const htmlElement = el as HTMLElement; // Type assertion here
        const binding = htmlElement.getAttribute(`v-${directiveName}`);
        if (directive.bind) {
          directive.bind(htmlElement, binding, { state: this.state });
        }
        htmlElement.removeAttribute(`v-${directiveName}`);
      });
    }
  }

  private bindMethods() {
    Object.keys(this.methods).forEach((key) => {
      this.methods[key] = this.methods[key].bind(this.state);
    });
  }

  private parseTemplate(template: string): string {

    let parsedTemplate = template.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (match, p1) => {
      const keys = p1.split('.');
      let value: any = this.state;
      for (const key of keys) {
        if (value && key in value) {
          value = value[key];
        } else {
          return match; // Return original if path is invalid
        }
      }
      return value;
    });

     // Handle v-if, v-else-if, v-else
     parsedTemplate = this.handleConditionalRendering(parsedTemplate);

     // Handle v-for
     parsedTemplate = this.handleLooping(parsedTemplate);
 
     return parsedTemplate;
  }

  private handleConditionalRendering(template: string): string {
    return template.replace(/<(\w+)\s*v-if="([\s\S]*?)">(.*?)<\/\1>/g, (match, tag, condition, content) => {
      return this.evaluateCondition(condition) ? `<${tag}>${this.parseTemplate(content)}</${tag}>` : '';
    }).replace(/<(\w+)\s*v-else-if="([\s\S]*?)">(.*?)<\/\1>/g, (match, tag, condition, content) => {
      return this.evaluateCondition(condition) ? `<${tag}>${this.parseTemplate(content)}</${tag}>` : '';
    }).replace(/<(\w+)\s*v-else>(.*?)<\/\1>/g, (match, tag, content) => {
      return !this.hasIfCondition() ? `<${tag}>${this.parseTemplate(content)}</${tag}>` : '';
    });
  }

  private evaluateCondition(condition: string): boolean {
    try {
      return new Function('state', `return ${condition};`)(this.state);
    } catch {
      return false;
    }
  }

  private hasIfCondition(): boolean {
    const templateWithConditions = this.template.match(/v-if="[\s\S]*?"/g) || [];
    return templateWithConditions.length > 0;
  }

  private handleLooping(template: string): string {
    return template.replace(/<(\w+)\s*v-for="(.+?)">(.*?)<\/\1>/g, (match, tag, expression, content) => {
      const [item, array] = expression.split(' in ');
      const itemsArray = this.state[array.trim()] as Array<any>;
      if (!Array.isArray(itemsArray)) return '';

      return itemsArray.map(itemValue => {
        const itemState = { [item.trim()]: itemValue };
        return this.parseTemplate(content).replace(/\{\{\s*(\w+)\s*\}\}/g, (match, p1) => {
          return itemState[p1] || match;
        });
      }).join('');
    });
  }

  private addEventListeners() {
    const eventPattern = /@(\w+)="(.*?)"/g;
    let match;
    while ((match = eventPattern.exec(this.template))) {
      const [, event, handler] = match;
      if (this.methods[handler]) {
        this.element.addEventListener(event, this.methods[handler] as EventListener);
      }
    }
  }

  private updateDom() {
    // Call the beforeUpdate hook
    if (this.hooks.beforeUpdate) this.hooks.beforeUpdate();

    this.element.innerHTML = this.parseTemplate(this.template);

    // Call the updated hook
    if (this.hooks.updated) this.hooks.updated();

    this.addEventListeners();
    this.applyDirectives();
  }

  mount(selector: string) {
    const mountPoint = document.querySelector(selector);
    if (mountPoint) {
      // Call the beforeMount hook
      if (this.hooks.beforeMount) this.hooks.beforeMount();

      mountPoint.appendChild(this.element);

       // Call the mounted hook
       if (this.hooks.mounted) this.hooks.mounted();
    } else {
      throw Error(`Mount point "${selector}" not found.`);
    }
  }

  public destroy() {
    // Call the beforeDestroy hook
    if (this.hooks.beforeDestroy) this.hooks.beforeDestroy();

    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Call the destroyed hook
    if (this.hooks.destroyed) this.hooks.destroyed();
  }

  public setState(newState: Partial<S>) {
    // Merge the new state with the existing state
    Object.assign(this.state, newState);

    // Update the DOM to reflect the new state
    this.updateDom();
  }
}