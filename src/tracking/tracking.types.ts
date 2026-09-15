export interface DeviceSubscription {
  deviceId: string;
}

export interface LocationUpdate extends DeviceSubscription {
  latitude: number;
  longitude: number;
  timestamp?: string;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface TrackedLocation extends LocationUpdate {
  timestamp: string;
}

export interface TrackingAck {
  ok: boolean;
  error?: string;
}
