import { TrackingGateway } from './tracking.gateway';

describe('TrackingGateway', () => {
  let gateway: TrackingGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    gateway = new TrackingGateway();
    gateway.server = {
      to,
    } as never;
  });

  it('subscribes a client to its device room', async () => {
    const client = { join: jest.fn() } as never;

    await expect(
      gateway.subscribe(client, { deviceId: 'truck-01' }),
    ).resolves.toEqual({ ok: true });
    expect(client['join']).toHaveBeenCalledWith('device:truck-01');
  });

  it('broadcasts valid locations to subscribers', () => {
    const result = gateway.publishLocation({
      deviceId: 'truck-01',
      latitude: 13.7563,
      longitude: 100.5018,
    });

    expect(result).toEqual({ ok: true });
    expect(to).toHaveBeenCalledWith('device:truck-01');
    expect(emit).toHaveBeenCalledTimes(1);
    const [event, location] = emit.mock.calls[0] as [
      string,
      {
        deviceId: string;
        latitude: number;
        longitude: number;
        timestamp: string;
      },
    ];
    expect(event).toBe('location:updated');
    expect(location).toMatchObject({
      deviceId: 'truck-01',
      latitude: 13.7563,
      longitude: 100.5018,
    });
    expect(Date.parse(location.timestamp)).not.toBeNaN();
  });

  it('rejects coordinates outside the valid range', () => {
    expect(
      gateway.publishLocation({
        deviceId: 'truck-01',
        latitude: 91,
        longitude: 100.5018,
      }),
    ).toEqual({
      ok: false,
      error: 'latitude must be a number between -90 and 90',
    });
    expect(emit).not.toHaveBeenCalled();
  });
});
