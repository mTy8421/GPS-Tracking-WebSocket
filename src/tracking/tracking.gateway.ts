import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type {
  DeviceSubscription,
  LocationUpdate,
  TrackedLocation,
  TrackingAck,
} from './tracking.types';

@WebSocketGateway({
  namespace: '/tracking',
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') ?? '*',
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TrackingGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('tracking:subscribe')
  async subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DeviceSubscription,
  ): Promise<TrackingAck> {
    if (!this.isValidDeviceId(payload?.deviceId)) {
      return { ok: false, error: 'deviceId is required' };
    }

    await client.join(this.deviceRoom(payload.deviceId));
    return { ok: true };
  }

  @SubscribeMessage('tracking:unsubscribe')
  async unsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DeviceSubscription,
  ): Promise<TrackingAck> {
    if (!this.isValidDeviceId(payload?.deviceId)) {
      return { ok: false, error: 'deviceId is required' };
    }

    await client.leave(this.deviceRoom(payload.deviceId));
    return { ok: true };
  }

  @SubscribeMessage('location:update')
  publishLocation(@MessageBody() payload: LocationUpdate): TrackingAck {
    const error = this.validateLocation(payload);
    if (error) {
      return { ok: false, error };
    }

    const location: TrackedLocation = {
      ...payload,
      deviceId: payload.deviceId.trim(),
      timestamp: payload.timestamp ?? new Date().toISOString(),
    };

    this.server
      .to(this.deviceRoom(location.deviceId))
      .emit('location:updated', location);

    return { ok: true };
  }

  private deviceRoom(deviceId: string): string {
    return `device:${deviceId.trim()}`;
  }

  private isValidDeviceId(deviceId: unknown): deviceId is string {
    return typeof deviceId === 'string' && deviceId.trim().length > 0;
  }

  private validateLocation(payload: LocationUpdate): string | undefined {
    if (!this.isValidDeviceId(payload?.deviceId)) {
      return 'deviceId is required';
    }
    if (
      typeof payload.latitude !== 'number' ||
      !Number.isFinite(payload.latitude) ||
      payload.latitude < -90 ||
      payload.latitude > 90
    ) {
      return 'latitude must be a number between -90 and 90';
    }
    if (
      typeof payload.longitude !== 'number' ||
      !Number.isFinite(payload.longitude) ||
      payload.longitude < -180 ||
      payload.longitude > 180
    ) {
      return 'longitude must be a number between -180 and 180';
    }
    if (payload.timestamp && Number.isNaN(Date.parse(payload.timestamp))) {
      return 'timestamp must be a valid date string';
    }

    return undefined;
  }
}
