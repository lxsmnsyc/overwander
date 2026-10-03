import { TRAINER_CLASSES, TRAINER_TRADE, type TrainerClass } from './classes';

/**
 * Every trade there is, each named by the class that stands for it.
 * This is what carries a line and a title; the classes are what
 * carry the coats
 */
export const TRAINER_TRADES: TrainerClass[] = (() => {
  const trades: TrainerClass[] = [];

  for (const trainer of TRAINER_CLASSES) {
    if (TRAINER_TRADE[trainer] === trainer) {
      trades.push(trainer);
    }
  }
  return trades;
})();

/** The classes that are one trade, in class order */
export function getTradeClasses(trade: TrainerClass): TrainerClass[] {
  const classes: TrainerClass[] = [];

  for (const trainer of TRAINER_CLASSES) {
    if (TRAINER_TRADE[trainer] === trade) {
      classes.push(trainer);
    }
  }
  return classes;
}
