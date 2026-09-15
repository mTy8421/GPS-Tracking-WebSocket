# GPS Tracking WebSocket

NestJS + Socket.IO service สำหรับรับและกระจายตำแหน่ง GPS แบบ real-time โดยแยกผู้ติดตามเป็นห้องตาม `deviceId`

## เริ่มใช้งาน

```bash
npm install
npm run start:dev
```

WebSocket ใช้ Socket.IO namespace ต่อไปนี้:

```text
http://localhost:3000/tracking
```

กำหนด origin ที่อนุญาตได้ด้วย environment variable (คั่นหลาย origin ด้วย comma):

```bash
WEBSOCKET_CORS_ORIGIN=https://dashboard.example.com npm run start:dev
```

หากไม่กำหนด ระบบจะอนุญาตทุก origin เหมาะสำหรับการพัฒนาเท่านั้น

## Events

### ติดตามอุปกรณ์

Client ที่แสดงแผนที่ subscribe ด้วย `deviceId` ก่อน:

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/tracking');

socket.emit(
  'tracking:subscribe',
  { deviceId: 'truck-01' },
  (ack: { ok: boolean; error?: string }) => console.log(ack),
);

socket.on('location:updated', (location) => {
  console.log(location);
});
```

หยุดติดตามด้วย event `tracking:unsubscribe` และ payload รูปแบบเดียวกัน

### ส่งตำแหน่ง

อุปกรณ์หรือ backend producer ส่ง `location:update`:

```ts
socket.emit(
  'location:update',
  {
    deviceId: 'truck-01',
    latitude: 13.7563,
    longitude: 100.5018,
    timestamp: new Date().toISOString(), // optional
    accuracy: 5, // optional (เมตร)
    speed: 12.5, // optional
    heading: 180, // optional
    altitude: 8, // optional
  },
  (ack: { ok: boolean; error?: string }) => console.log(ack),
);
```

Server ตรวจสอบ `deviceId`, latitude, longitude และ timestamp จากนั้นส่ง `location:updated` ให้ client ทุกตัวที่ subscribe อุปกรณ์นั้น หากไม่ส่ง timestamp server จะสร้างเวลา UTC ให้เอง

> ก่อนนำขึ้น production ควรเพิ่ม authentication/authorization เพื่อยืนยันว่า client มีสิทธิ์ส่งหรือติดตาม `deviceId` นั้น

## ตรวจสอบโปรเจกต์

```bash
npm run build
npm test
npm run lint
```
