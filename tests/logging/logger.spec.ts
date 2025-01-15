import { JamLogger, jamLogger } from 'logging';

describe('logger', () => {
  xit('should use cache if same child logger exists', () => {
    const first = jamLogger.tagged('A');
    const second = jamLogger.tagged('B');
    const third = jamLogger.tagged('A');

    expect(first === second).toBe(false);
    expect(first === third).toBe(true);
  });
  it('check weack instance per config', () => {
    const config = { appId: 'test-app' };
    const first = JamLogger.create(config);
    const second = JamLogger.create(config);
    expect(first === second).toBe(true);
  });
  it('should reuse tags of parent', () => {
    const first = JamLogger.create({ tags: ['root'] });
    // first.debug('First Hi');

    const second = first.tagged('child');
    expect(second.tags).toEqual(['root', 'child'].sort());
    //second.debug('Second Hi');

    const third = second.tagged('grandchild');
    expect(third.tags).toEqual(['root', 'child', 'grandchild'].sort());
    // third.debug('Third Hi');
  });
});
