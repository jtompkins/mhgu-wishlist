import { Command, flags } from "@oclif/command";
import MHGUHarvester, { MHGU } from "./mhguHarvester";
import { promises as fs } from "fs";
import { Armor } from "./types";

function replacer(key: any, value: any) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  } else {
    return value;
  }
}

class HarvestCli extends Command {
  static description = "describe the command here";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    output: flags.string({
      char: "o",
      description: "JSON output filename",
      default: "data.json",
    }),
  };

  static args = [{ name: "game", required: false, default: MHGU }];

  async run() {
    const { args, flags } = this.parse(HarvestCli);

    if (args["game"] !== MHGU) {
      console.log("Only MHGU is supported.");
      return;
    }

    const harvester = new MHGUHarvester();

    console.log("Fetching resources...");
    const armor = await harvester.harvest();
    console.log("...done!");

    console.log("Writing data to output file...");
    await fs.writeFile(flags.output, JSON.stringify(armor, replacer));
    console.log("...done!");
  }
}

export = HarvestCli;
