import { Component } from "./component";

interface Route {
    path: string;
    component: Component<any>;
}

export class Router {
    private routes: Route[] = [];
    private currentRoute: Route | null = null;
    private rootElement: HTMLElement;
  
    constructor(rootElement: HTMLElement) {
      this.rootElement = rootElement;
      window.addEventListener('popstate', () => this.handleRouteChange());
    }
  
    public addRoute(path: string, component: Component<any>): void {
      this.routes.push({ path, component });
    }
  
    private findRoute(path: string): Route | undefined {
      return this.routes.find(route => route.path === path);
    }
  
    public navigate(path: string): void {
      const route = this.findRoute(path);
      if (route) {
        history.pushState(null, '', path);
        this.render(route);
      }
    }
  
    private handleRouteChange(): void {
      const path = window.location.pathname;
      const route = this.findRoute(path);
      if (route) {
        this.render(route);
      }
    }
  
    private render(route: Route): void {
      if (this.currentRoute && this.currentRoute.component) {
        this.currentRoute.component.destroy();
      }
      this.currentRoute = route;
      this.rootElement.innerHTML = ''; // Clear the root element
      route.component.mount(this.rootElement);
    }

    // Set the root element where the components will be mounted
    public setRootElement(rootElement: HTMLElement): void {
      this.rootElement = rootElement;
    }
}