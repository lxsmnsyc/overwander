/**
 * How a battle ended. It sits in its own module because the
 * privileged server stamps outcomes and the client reads them, so
 * both sides compare against the same enum without importing each
 * other
 */
const enum BattleOutcome {
  /**
   * Still being fought, or abandoned before it settled
   */
  Unfinished = 0,
  Won = 1,
  Lost = 2,
}

export default BattleOutcome;
