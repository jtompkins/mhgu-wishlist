export enum ArmorRarities {
  Rarity1 = "1",
  Rarity2 = "2",
  Rarity3 = "3",
  Rarity4 = "4",
  Rarity5 = "5",
  Rarity6 = "6",
  Rarity7 = "7",
  Rarity8 = "8",
  Rarity9 = "8",
  Rarity10 = "10",
  RarityX = "X",
}

export enum ArmorTypes {
  Blademaster = "blade",
  Gunner = "gun",
}

export interface Armor {
  type: ArmorTypes;

  name: string;
  defense: string;

  fireResist: number;
  waterResist: number;
  thunderResist: number;
  iceResist: number;
  dragonResist: number;

  skills: Map<string, number>;
  materials: Map<string, number>;
}
