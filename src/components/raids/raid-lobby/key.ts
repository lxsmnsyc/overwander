/** The uids packed into a resource key, without the empty one an empty lobby leaves */
export default function splitKey(key: string): string[] {
  const uids: string[] = [];

  for (const uid of key.split(',')) {
    if (uid !== '') {
      uids.push(uid);
    }
  }
  return uids;
}
