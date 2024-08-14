import { CustomDirective } from './directive';
import { reactive, effect } from './reactive';
import { Router } from './router';

type StateValue = string | number | boolean | any[] | Record<string, any>;

interface ComponentOptions<S extends Record<string, StateValue>> {
  template: string;
  data: () => S;
  methods?: Record<string, (this: S, event?: Event) => void>;
  components?: Record<string, Component<any>>;
  beforeCreate?: () => void;
  created?: () => void;
  beforeMount?: () => void;
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
  beforeDestroy?: () => void;
  destroyed?: () => void;
  directives?: Record<string, CustomDirective>;
  router?: Router;
}

export class Component<S extends Record<string, StateValue>> {

  private state: S;
  private template: string;
  private element: HTMLElement;
  private methods: Record<string, (this: S, event?: Event) => void>;
  private directives: Record<string, CustomDirective>;
  private components: Record<string, Component<any>>;
  public router?: Router;

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

     // Call Components
     this.components = options.components || {};

    // Call Template
    this.element = document.createElement('div');

     // Initialize the router if defined
     if (options.router) {
      this.router = options.router;
      this.router.setRootElement(this.element);
    }

    // Call the created hook
    if (this.hooks.created) this.hooks.created();

    // Automatically re-render the DOM when the state changes
    effect(() => {
      this.updateDom();
      this.addEventListeners();
      this.bindEvents();
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


    // Dynamic Binding
    parsedTemplate = this.renderTemplate(parsedTemplate);

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

  // Render the template with dynamic data and child components
  private renderTemplate(template: string): string {    
    // Replace data bindings
    for (const key in this.state) {
      const value = this.state[key];
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      template = template.replace(regex, value.toString());
    }

    // Replace component placeholders with their respective HTML
    for (const componentName in this.components) {
      const regex = new RegExp(`<${componentName}></${componentName}>`, 'g');
      template = template.replace(regex, `<div id="${componentName}"></div>`);
    }

    return template;
  }

  // Bind events to the dynamic elements
  private bindEvents(): void {
    const eventAttribute = 'v-on:';
    const elements = this.element.querySelectorAll(`[${eventAttribute}]`);

    elements.forEach((element) => {
      const attributeName = Array.from(element.attributes).find(attr => attr.name.startsWith(eventAttribute));
      if (!attributeName) return;

      const event = attributeName.name.replace(eventAttribute, '');
      const methodName = attributeName.value;
      const handler = this.methods[methodName];

      if (handler) {
        element.addEventListener(event, handler.bind(this.state));
      }
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
    this.bindEvents();
    this.mountChildComponents();
  }

  mount(parentElement: HTMLElement): void {
    // Call the beforeMount hook
    if (this.hooks.beforeMount) this.hooks.beforeMount();

    parentElement.appendChild(this.element);

    // Call the mounted hook
    if (this.hooks.mounted) this.hooks.mounted();
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

  // Mount child components inside their respective placeholders
  private mountChildComponents(): void {
    for (const componentName in this.components) {
      const placeholder = this.element.querySelector(`#${componentName}`);
      const component = this.components[componentName];

      if (placeholder && component) {
        component.mount(placeholder as HTMLElement);
      }
    }
  }
}