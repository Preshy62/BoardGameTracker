declare module 'simple-peer' {
  import { EventEmitter } from 'events';

  export interface SimplePeerOptions {
    initiator: boolean;
    stream?: MediaStream;
    trickle?: boolean;
    reconnectTimer?: number;
    sdpTransform?: Function;
    config?: RTCConfiguration;
    channelConfig?: RTCDataChannelInit;
    wrtc?: any;
    objectMode?: boolean;
  }

  export interface Instance extends EventEmitter {
    signal: (data: any) => void;
    send: (data: any) => void;
    destroy: (err?: Error) => void;
    on(event: 'signal', listener: (data: any) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (data: any) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'track', listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }

  export default function SimplePeer(opts?: SimplePeerOptions): Instance;
}