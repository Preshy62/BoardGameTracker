import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  IMicrophoneAudioTrack,
  ILocalAudioTrack
} from "agora-rtc-sdk-ng";

// Define the Agora App ID - from environment variables
// For Vite, use VITE_ prefix for client-side environment variables
const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

// Define voice states
export type VoiceConnectionState = 
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting" 
  | "disconnecting"
  | "error";

// Define voice chat options
interface VoiceChatOptions {
  channelName: string;
  uid?: string;
  microphoneId?: string;
}

// Define event handler types
export type VoiceEventHandler = (event: any) => void;

// Main Agora voice manager class
class AgoraVoiceManager {
  private client: IAgoraRTCClient | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;
  private uid: string = "";
  private channelName: string = "";
  private connectionState: VoiceConnectionState = "disconnected";
  private eventHandlers: Map<string, Set<VoiceEventHandler>> = new Map();
  
  // Constructor
  constructor() {
    // Initialize event handler map
    this.eventHandlers.set("user-joined", new Set());
    this.eventHandlers.set("user-left", new Set());
    this.eventHandlers.set("connection-state-change", new Set());
    this.eventHandlers.set("error", new Set());
  }
  
  // Initialize client
  public init(): boolean {
    if (!AGORA_APP_ID) {
      this.emitEvent("error", new Error("Missing Agora App ID"));
      return false;
    }
    
    try {
      this.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
      this.setupEventHandlers();
      return true;
    } catch (error) {
      this.emitEvent("error", error);
      return false;
    }
  }
  
  // Set up client event handlers
  private setupEventHandlers(): void {
    if (!this.client) return;
    
    // Handle remote user publishing audio
    this.client.on("user-published", async (user, mediaType) => {
      try {
        // Subscribe to remote user
        await this.client?.subscribe(user, mediaType);
        
        if (mediaType === "audio") {
          // Play remote user's audio
          user.audioTrack?.play();
          
          // Emit user-joined event
          this.emitEvent("user-joined", user);
        }
      } catch (error) {
        this.emitEvent("error", error);
      }
    });
    
    // Handle remote user leaving
    this.client.on("user-unpublished", (user, mediaType) => {
      if (mediaType === "audio") {
        // Emit user-left event
        this.emitEvent("user-left", user);
      }
    });
    
    // Handle connection state changes
    this.client.on("connection-state-change", (curState, prevState) => {
      this.connectionState = curState as VoiceConnectionState;
      this.emitEvent("connection-state-change", { current: curState, previous: prevState });
    });
  }
  
  // Join a voice channel
  public async join(options: VoiceChatOptions): Promise<boolean> {
    try {
      // More detailed App ID validation
      if (!AGORA_APP_ID) {
        throw new Error("Missing Agora App ID in environment variables");
      }
      
      console.log('Trying to join with App ID of length:', AGORA_APP_ID.length);
      // Check for whitespace or special characters that could cause issues
      if (AGORA_APP_ID.trim() !== AGORA_APP_ID || !/^[a-zA-Z0-9]+$/.test(AGORA_APP_ID)) {
        throw new Error("Invalid Agora App ID format: Contains whitespace or special characters");
      }
      
      if (!this.client) {
        throw new Error("Agora client not initialized");
      }
      
      if (this.connectionState === "connected") {
        // Already connected, leave current channel first
        await this.leave();
      }
      
      this.channelName = options.channelName;
      this.uid = options.uid || Math.random().toString(36).substring(2, 15);
      
      console.log('Connecting to Agora with:');
      console.log('- App ID length:', AGORA_APP_ID.length);
      console.log('- Channel:', this.channelName);
      console.log('- UID:', this.uid);
      
      // Join the channel
      await this.client.join(AGORA_APP_ID, this.channelName, null, this.uid);
      
      // Create microphone track
      this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
        microphoneId: options.microphoneId,
        encoderConfig: {
          sampleRate: 48000,
          stereo: false,
          bitrate: 128
        }
      });
      
      // Publish local audio track
      await this.client.publish([this.localAudioTrack]);
      
      return true;
    } catch (error) {
      console.error('Agora join error:', error);
      this.emitEvent("error", error);
      return false;
    }
  }
  
  // Leave the voice channel
  public async leave(): Promise<boolean> {
    if (!this.client || this.connectionState !== "connected") {
      return false;
    }
    
    try {
      // Stop and close local audio track
      this.localAudioTrack?.stop();
      this.localAudioTrack?.close();
      this.localAudioTrack = null;
      
      // Leave the channel
      await this.client.leave();
      
      // Reset state
      this.channelName = "";
      
      return true;
    } catch (error) {
      this.emitEvent("error", error);
      return false;
    }
  }
  
  // Mute/unmute microphone
  public async setMuted(muted: boolean): Promise<boolean> {
    if (!this.localAudioTrack) {
      return false;
    }
    
    try {
      await this.localAudioTrack.setEnabled(!muted);
      return true;
    } catch (error) {
      this.emitEvent("error", error);
      return false;
    }
  }
  
  // Get microphone audio level (0.0 to 1.0)
  public getAudioLevel(): number {
    if (!this.localAudioTrack) {
      return 0;
    }
    
    return this.localAudioTrack.getVolumeLevel();
  }
  
  // Get a remote user's audio level
  public getRemoteAudioLevel(user: IAgoraRTCRemoteUser): number {
    if (!user.audioTrack) {
      return 0;
    }
    
    return user.audioTrack.getVolumeLevel();
  }
  
  // Get current connection state
  public getConnectionState(): VoiceConnectionState {
    return this.connectionState;
  }
  
  // Get current channel name
  public getChannelName(): string {
    return this.channelName;
  }
  
  // Get current UID
  public getUid(): string {
    return this.uid;
  }
  
  // Add event listener
  public on(event: string, handler: VoiceEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)?.add(handler);
  }
  
  // Remove event listener
  public off(event: string, handler: VoiceEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    this.eventHandlers.get(event)?.delete(handler);
  }
  
  // Emit event to all registered handlers
  private emitEvent(event: string, data: any): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      // Convert Set to Array before iterating to avoid TypeScript issues
      Array.from(handlers).forEach(handler => {
        handler(data);
      });
    }
  }
  
  // Check if the browser supports Agora voice features
  public static isSupported(): boolean {
    return AgoraRTC.checkSystemRequirements();
  }
  
  // Get list of available audio input devices (microphones)
  public static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === "audioinput");
    } catch (error) {
      console.error("Error getting audio devices:", error);
      return [];
    }
  }
}

// Export a singleton instance
export const agoraVoice = new AgoraVoiceManager();

// Export types and the class itself for advanced usage
export type { IAgoraRTCClient, IAgoraRTCRemoteUser, IMicrophoneAudioTrack, ILocalAudioTrack };
export { AgoraRTC, AgoraVoiceManager };