import axios from "axios";
import { JSDOM } from "jsdom";
import { ArmorRarities, ArmorTypes, Armor } from "./types";

export const MHGU = "mghu";

export default class MHGUHarvester {
  async fetchArmorLinks(): Promise<Array<string>> {
    const content = await axios.get("https://mhgu.kiranico.com/armor");
    const dom = new JSDOM(content.data);
    const armorSetLinks = new Set<string>();

    for (const rarity of Object.values(ArmorRarities)) {
      for (const type of Object.values(ArmorTypes)) {
        dom.window.document
          .querySelector(`div#${type}-${rarity}`)!
          .querySelectorAll('a[href^="https://mhgu.kiranico.com/armor/"]')
          .forEach((el) => {
            armorSetLinks.add(el.attributes.getNamedItem("href")!.value);
          });
      }
    }

    return Array.from(armorSetLinks);
  }

  async fetchArmorSet(armorUrl: string): Promise<Array<Armor>> {
    const content = await axios.get(armorUrl);
    const dom = new JSDOM(content.data);

    const responsiveTables = dom.window.document.querySelectorAll(
      "div.table-responsive"
    );

    if (responsiveTables.length === 0) {
      return [];
    }

    const armorSet = new Map<string, Armor>();

    // first, we need to parse the set block to get the names, defenses, and skills of the armor
    const armorTable = responsiveTables.item(0);

    armorTable.querySelectorAll("tr").forEach((row) => {
      if (
        row.classList.contains("table-active") ||
        row.classList.contains("table-warning")
      ) {
        return;
      }

      const cells = row.querySelectorAll("td");

      const armor = {} as Armor;

      armor.type =
        cells.item(0).textContent === "○"
          ? ArmorTypes.Blademaster
          : ArmorTypes.Gunner;

      armor.name = cells.item(4).textContent!.trim();

      armor.defense = cells.item(5).textContent!.trim();

      armor.fireResist = parseInt(cells.item(6).textContent!.trim()) || 0;
      armor.waterResist = parseInt(cells.item(7).textContent!.trim()) || 0;
      armor.thunderResist = parseInt(cells.item(8).textContent!.trim()) || 0;
      armor.iceResist = parseInt(cells.item(9).textContent!.trim()) || 0;
      armor.dragonResist = parseInt(cells.item(10).textContent!.trim()) || 0;

      armor.skills = new Map<string, number>();

      cells
        .item(12)
        .textContent!.trim()
        .split("\n")
        .map((s: string) => s.trim())
        .forEach((s: string) => {
          const [skill, value] = s.split(":");

          armor.skills.set(skill, parseInt(value));
        });

      armorSet.set(armor.name, armor);
    });

    // next, we need to parse the materials block to get the cost of the armor
    const materialsTable = responsiveTables.item(1);
    const materialsRows = materialsTable.querySelectorAll("tr");

    const headerRow = materialsRows.item(0);
    const buildRow = materialsRows.item(2);

    headerRow.querySelectorAll("th").forEach((col, i) => {
      if (i < 1) {
        return;
      }

      const armorPiece = armorSet.get(col.textContent!.trim());

      if (!armorPiece) {
        return;
      }

      armorPiece.materials = new Map<string, number>();

      const materials = buildRow.cells
        .item(i)!
        .textContent!.trim()
        .split("\n")
        .map((s) => s.trim());

      materials
        .slice(0, materials.findIndex((s) => s === "-") - 1)
        .forEach((m) => {
          if (m === "" || m === "Key") {
            return;
          }

          const [material, count] = m.split(/ x(\d)/);

          armorPiece.materials.set(material.trim(), parseInt(count));
        });
    });

    return Array.from(armorSet.values());
  }

  async harvest(): Promise<Array<Armor>> {
    console.log("\tFetching armor set links...");
    const links = await this.fetchArmorLinks();
    console.log("\t...done!");

    const armor: Armor[][] = [];

    console.log(`\tFetching ${links.length} armor sets...`);
    for (const url of links) {
      armor.push(await this.fetchArmorSet(url));
    }

    console.log("\t...done!");

    return armor.flat();
  }
}
