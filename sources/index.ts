import {Plugin} from '@yarnpkg/core';
import {BaseCommand} from '@yarnpkg/cli';
import {Option} from 'clipanion';

class HelloWorldCommand extends BaseCommand {
  static paths = [
    [`hello`, `world`],
  ];

  name = Option.String(`--name`, `John Doe`, {
    description: `Your name`,
  });

  async execute() {
    console.log(`Hello ${this.name}!`);
  }
}

const plugin: Plugin = {
  hooks: {
    afterAllInstalled: () => {
      console.log(`What a great install, am I right?`);
    },
  },
  commands: [
    HelloWorldCommand,
  ],
};

export default plugin;
