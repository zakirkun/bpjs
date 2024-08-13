# BP.JS

BP.JS Framework is a lightweight and flexible frontend framework for building dynamic user interfaces. It features a component-based architecture with support for custom directives, conditional rendering, and looping.

## Features

- Component-based architecture
- Custom directives
- Conditional rendering
- Looping through arrays
- TypeScript support

## Installation

To use this framework, you can either install it via npm or include it directly in your project.

### Using npm

1. **Install the package**:

   ```bash
   npm install bpjs
   ```

2. **Import the package**:

   ```typescript
   import { Component } from 'bpjs';
   ```

### Direct Include

Download the compiled JavaScript file and include it in your HTML:

```html
<script src="path/to/your/compiled/javascript/index.js"></script>
```

## Usage

### Creating a Component

Define a component using the `Component` class. Provide a template, data function, and optional methods and directives.

```typescript
import { Component } from 'bpjs';

// Define a custom directive
const myDirective = {
  bind(el: HTMLElement, binding: any) {
    el.style.color = binding;
  }
};

// Create a component
const MyComponent = new Component({
  template: `
    <div>
      <p v-my-directive="red">This text is red.</p>
      <button @click="changeMessage">Change Message</button>
      <p>{{ message }}</p>
      <ul>
        <li v-for="item in items">{{ item }}</li>
      </ul>
    </div>
  `,
  data: () => ({
    message: 'Hello BP.JS',
    items: ['Item 1', 'Item 2', 'Item 3']
  }),
  methods: {
    changeMessage() {
      this.setState({ message: 'Message changed!' });
    }
  },
  directives: {
    'my-directive': myDirective
  }
});

// Mount the component
MyComponent.mount('#app');
```

### HTML Structure

Ensure you have an element with the id `app` in your HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BP.JS</title>
</head>
<body>
  <div id="app"></div>
  <script src="path/to/your/compiled/javascript/index.js"></script>
</body>
</html>
```

## API

### `Component`

The `Component` class provides methods for managing components.

#### Constructor

```typescript
new Component<S>(options: ComponentOptions<S>)
```

- `options`: Configuration options for the component.

#### Methods

- **`mount(selector: string): void`**

  Mounts the component to the DOM element specified by `selector`.

- **`destroy(): void`**

  Removes the component from the DOM and performs cleanup.

- **`setState(newState: Partial<S>): void`**

  Updates the component's state and re-renders the DOM.

## Custom Directives

Custom directives can be defined and used in your components. A directive is an object with optional `bind`, `update`, and `unbind` methods.

```typescript
const myDirective = {
  bind(el: HTMLElement, binding: any) {
    // Initialize directive
  },
  update(el: HTMLElement, binding: any) {
    // Update directive
  },
  unbind(el: HTMLElement, binding: any) {
    // Clean up directive
  }
};
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Feel free to submit issues, suggestions, or pull requests on GitHub. Contributions are welcome!

---

Replace `"bpjs"` with your actual package name and update the paths as necessary. This README provides a comprehensive guide to get started with your framework and includes essential documentation for users.