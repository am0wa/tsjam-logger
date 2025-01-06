import { jamLogger } from 'logging';

describe('logger', () => {
  it('should use cache if same child logger exists', () => {
    const first = jamLogger.tagged('A');
    const second = jamLogger.tagged('B');
    const third = jamLogger.tagged('A');

    expect(first === second).toBe(false);
    expect(first === third).toBe(true);
  });
});
