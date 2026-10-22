/**
 * The sky over a chunk.
 *
 * Weather is derived from the world seed the way the biomes are, out
 * of two noise channels read against the ground underneath. It is not
 * stored anywhere: everybody standing in the same place in the same
 * hour sees the same sky without asking the server, which is the rule
 * every other feature of a chunk follows.
 *
 * It reaches the game in two ways. A pokemon of a type the sky
 * favours comes with a floor under every one of its values, so a wet
 * afternoon is worth going out in for the things rain is about. A trainer met out on the road is fought under
 * the sky that was over the road, which is the only kind of fight the
 * weather reaches: a raid, a duel and a league seat are all fought
 * under a clear sky whatever the world was doing. That one fight
 * keeps its sky on its own record, because the sky moves on and the
 * fight has to replay as it was fought.
 */

/** Every sky there is, what each is called and what it favours */
const enum Weather {
  Clear = 0,
  Cloudy = 1,
  Overcast = 2,
  Breezy = 3,
  Drizzle = 4,
  Rain = 5,
  Downpour = 6,
  Thunderstorm = 7,
  Mist = 8,
  Fog = 9,
  Haze = 10,
  Frost = 11,
  Snow = 12,
  Blizzard = 13,
  Hail = 14,
  Sandstorm = 15,
  DustHaze = 16,
  Heatwave = 17,
  FallingAsh = 18,
  Aurora = 19,
  Rainbow = 20,
  PollenDrift = 21,
  MeteorShower = 22,
  FataMorgana = 23,
  DarkDay = 24,
  Fogbow = 25,
}

export default Weather;
