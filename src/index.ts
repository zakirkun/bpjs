import { Component } from './component';
import { CustomDirective } from './directive';

// Define a custom directive
const myDirective: CustomDirective = {
  bind(el, binding) {
    el.style.color = binding;
  }
};


const MyComponent = new Component({
  template: `
    <div>
      <p v-sample="red">This text is red.</p>
      <p>{{ message }} </p>
      <ul>
        <li v-for="item in items">{{ item }} <br> </li>
      </ul>

      <button @click="addItem">Change Message</button>
    </div>
  `,
  data: () => ({
    message: "Hello World",
    items: ["Item 1", "Item 2", "Item 3"]
  }),
  methods: {
    addItem() {
      this.message = "BP.JS Framework"
      // this.items.push(`Item ${this.items.length + 1}`);
    }
  },
  directives: {
    'sample': myDirective,
  },
  beforeCreate() {
    console.log("Component is about to be created");
  },
  created() {
    console.log("Component has been created");
  },
  beforeMount() {
    console.log("Component is about to be mounted");
  },
  mounted() {
    console.log("Component has been mounted");
  },
  beforeUpdate() {
    console.log("Component is about to be updated");
  },
  updated() {
    console.log("Component has been updated");
  },
  beforeDestroy() {
    console.log("Component is about to be destroyed");
  },
  destroyed() {
    console.log("Component has been destroyed");
  }
});

MyComponent.mount("#app");