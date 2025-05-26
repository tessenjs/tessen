This is a module which is in development. It is not yet ready for production use.

# Instructions for Copilot
You are an AI assistant that helps developers write code. You should always try to write code that is correct, efficient, and easy to understand.
You will use typescript, and code everything like a professional developer. You can use functions, classes as you want, you don't have to stick to a single method of coding.

# Module Details
Module name: Tessen
Module description: Tessen is a Discord.js based library for creating bots, with a syntax similar to Express.js. It allows for easy creation of packs, inspectors, and locales, and supports chat commands, slash commands, and interaction handling.
Module features:
- **Packs**: Create and manage packs of commands and interactions.
- **Inspectors**: Handle chat inputs and interactions with a simple API.
- **Locales**: Manage localization files and interaction locales.

# Final Product Example
```ts
// tessen is a discord.js based library for creating bots
// tessen syntax is similar to express.js
import { Tessen, Pack, Inspector, Locales } from 'tessen';
// tessen pack'in extendidir
const tessen = new Tessen();

const pack = new Pack({ id: 'ExamplePack' });
const inspector = new Inspector({ id: 'ExampleInspector', domain: "CurrentPack|AllSubPacks" });
const locales = new Locales({ id: 'ExampleLocales', domain: "CurrentPack|AllSubPacks" });

pack.onUnload(
  locales.loadFile({
    id: 'Example',
    filePath: 'example.json',
    path: '$',
    type: "Content"
  }),
  locales.addLocale({
    id: "Example2",
    locale: "",
    data: {}
  }),
  locales.addInteractionLocale({
    id: "Example3",
    locale: "",
    name: "system set settings",
    data: {}
  })
)


const pattern = 'system (set|unset) settings';
pack.event({

})

// Updated to use object-based parameter pattern only (no more string+function overload)
inspector.chatInput({
  pattern: 'system (set|unset) settings',
  handle: (ctx) => {
    // Handler code
  }
});  // () => { } // unloader

// Example of triggering a handler matching one of the generated combinations:
inspector.emit({
  type: 'chatInput',
  id: 'system set settings', // This would be one of the combinations generated
  ctx: contextObject
});

inspector.button({
  id: "",
  handle() {

  }
})

pack.use(inspector);  // () => { } // unloader
pack.use(locales);  // () => { } // unloader

tessen.use(pack);  // () => { } // unloader
tessen.use(chatCommandExtension({
  prefix: "!"
}))
tessen.slashCommand({
  id: 'example',
  name: 'example (command)?', // []
  description: 'an example command',
  onExecute: (ctx) => {
    ctx.interaction.reply({
      content: 'Hello world',
      ephemeral: true
    })
  }
}); // () => { } // unloader

tessen.start();
```