import { afterEach, describe, expect, it, vi } from 'vitest';

const written: unknown[][] = [];

vi.mock('../src/server/db', () => ({
  getSql: () => {
    const sql = async (_strings: TemplateStringsArray, ...values: unknown[]): Promise<never[]> => {
      written.push(values);
      return Promise.resolve([]);
    };

    return Object.assign(sql, { json: (value: unknown) => value });
  },
  jsonOf: (_sql: unknown, value: unknown) => value,
}));

const { StaffAction, recordStaffAction } = await import('../src/server/staff-log');

describe('the staff log', () => {
  afterEach(() => {
    written.length = 0;
    vi.unstubAllEnvs();
  });

  it('writes nothing while STAFF_LOG is off', async () => {
    vi.stubEnv('STAFF_LOG', '');
    await recordStaffAction('admin', StaffAction.Ban, 'player', { banned: true });

    expect(written).toEqual([]);
  });

  it('writes one row per action while it is on', async () => {
    vi.stubEnv('STAFF_LOG', 'true');
    await recordStaffAction('admin', StaffAction.Ban, 'player', { banned: true });

    expect(written).toHaveLength(1);
    expect(written[0].slice(0, 4)).toEqual(['admin', StaffAction.Ban, 'player', { banned: true }]);
  });

  it('takes only exactly 1 or true as on', async () => {
    vi.stubEnv('STAFF_LOG', 'yes');
    await recordStaffAction('admin', StaffAction.Role, 'player', {});

    expect(written).toEqual([]);
  });
});
