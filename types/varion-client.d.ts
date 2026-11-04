// GENERATED FILE -- do not edit by hand.
// Varion client API, reflected out of the running runtime by tools/extract-varion-client-api.cjs.
// Regenerate with: node tools/generate-varion-types.cjs
//
// Reflection recovers names, ownership and kind, not signatures: parameters and
// return types are permissive, except the documented API (DEVELOPER-KIT.md section 5),
// typed from tools/sdk-signatures.cjs and checked against the runtime on every run.
// `readonly` marks what the runtime does not let a script assign (a getter without
// a setter, a non-writable property) and the constants of classes and namespaces.

/** Anything with numeric x, y, z: a Vector3 or a plain object. */
export interface Vector3Like { x: number; y: number; z: number; }
/** Anything with numeric x, y: a Vector2 or a plain object. */
export interface Vector2Like { x: number; y: number; }
/** A view of the native entity catalog. GTA-specific operations use scriptID through the native API. */
export interface NativeEntity {
    readonly isNative: true;
    readonly id: number; readonly remoteId: number; readonly type: number;
    readonly netId: number; readonly model: number; readonly scriptID: number;
    readonly valid: boolean; readonly isStreamedIn: boolean; readonly isSpawned: boolean;
    readonly dimension: number; readonly pos: Vector3Like; readonly rot: Vector3Like;
    getMeta(key: string): unknown; setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void;
    hasMeta(key: string): boolean; getMetaKeys(): string[];
    getSyncedMeta(key: string): unknown; getStreamSyncedMeta(key: string): unknown;
    hasSyncedMeta(key: string): boolean; hasStreamSyncedMeta(key: string): boolean;
    getSyncedMetaKeys(): string[]; getStreamSyncedMetaKeys(): string[];
}
export interface NativeVehicle extends NativeEntity { readonly type: 1; indicatorLights: number; }
export interface NativePed extends NativeEntity { readonly type: 2; }
/** What on/once/onServer and WebView#on/once return: destroy() removes the handler. */
export interface VarionEventHandle { destroy(): void; }
export interface AudioEventHandlers {
    inited: () => void; streamStarted: () => void; streamPaused: () => void;
    streamEnded: () => void; streamReset: () => void; streamSeek: (seconds: number) => void;
    error: (code: number, message: string) => void; volumeChange: (volume: number) => void;
}
export interface WebSocketEventHandlers {
    open: () => void; message: (message: string) => void;
    error: (message: string) => void; close: (code: number, reason: string) => void;
}
/** Options of WebView.create. */
export interface WebViewOptions {
    url: string;
    /** false: an ordinary window above the game; default true (overlay). */
    overlay?: boolean;
    pos?: Vector2Like; size?: Vector2Like; visible?: boolean;
    headers?: { [name: string]: string };
    [option: string]: any;
}
/** Handler of event E: typed for the documented events, any arguments for the rest. */
export type VarionEventHandler<E extends string> =
    E extends keyof VarionEvents ? VarionEvents[E] : (...args: any[]) => void;
export interface DiscordUser { id: string; name: string; discriminator: string; avatar: string; }
export interface DiscordActivityOptions {
    details?: string; name?: string; state?: string;
    largeImageKey?: string; largeImage?: string; smallImageKey?: string; smallImage?: string;
    partyId?: string; partyID?: string; partySize?: number; partyCurrent?: number; partyMax?: number;
    startTimestamp?: number; endTimestamp?: number; instance?: boolean | string;
    buttons?: Array<{ label: string; url: string }>; updatedUtcMs?: number;
}

export class AreaBlip {
    /** Creates an area blip of `width` × `height` metres around x, y, z, only for this client, in dimension 0; non-numeric values and negative sizes count as 0. GTA's blip appears asynchronously (`waitForSpawn()`). */
    constructor(x: number, y: number, z: number, width: number, height: number);
    /** The area blips: the server's ones (as plain objects with fewer members) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<AreaBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many area blips AreaBlip.all holds. */
    static readonly count: number;
    /** As Blip.get, but null for a blip of another kind. */
    static get(id: number): AreaBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as AreaBlip.get. */
    static getByID(id: number): AreaBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's area blip with that id, as a plain object; null for none and for a blip of another kind. */
    static getByRemoteID(id: number): { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** As Blip.getByScriptID, for area blips only: null for 0, for none and for a blip of another kind. */
    static getByScriptID(scriptID: number): AreaBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Opacity 0..255 (clamped, truncated), 255 by default; sent as SET_BLIP_ALPHA. */
    alpha: number;
    /** Sent as SET_BLIP_AS_MISSION_CREATOR_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    asMissionCreator: boolean;
    /** Area (11) for an area blip, as BlipType. Assigning Destination (4) or Radius (7) makes it that kind where it is: GTA cannot change a blip's kind, so the blip is made again (a new scriptID) and given what was set on it, and the class follows; a radius blip gets 100 m, and any other type throws a RangeError. */
    blipType: number;
    /** Sent as SET_BLIP_BRIGHT once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    bright: boolean;
    /** GTA's blip category (SET_BLIP_CATEGORY), truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    category: number;
    /** Colour index (BlipColor), 0 by default; clamped to 0..255 and truncated (SET_BLIP_COLOUR). */
    color: number;
    /** Sent as SHOW_CREW_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    crewIndicatorVisible: boolean;
    /** Removes the key from the blip's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the blip from GTA (REMOVE_BLIP): valid turns false and baseObjectRemove fires; later calls do nothing. A resource's blips are destroyed when it stops. */
    destroy(): void;
    /** The dimension it shows in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated, and checked again with each update of the local player. */
    dimension: number;
    /** GTA's display mode (SET_BLIP_DISPLAY), 2 by default, an integer of at least 0; 0 is sent instead while the blip is hidden (visible false or another dimension). */
    display: number;
    /** Fades the blip to opacity 0..255 (clamped) over duration ms, at least 0 (SET_BLIP_FADE); does nothing before GTA has the blip or after destroy(). */
    fade(opacity: number, duration: number): void;
    /** Sent as SET_BLIP_FLASHES once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashes: boolean;
    /** Sent as SET_BLIP_FLASHES_ALTERNATE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashesAlternate: boolean;
    /** Flash interval in ms (SET_BLIP_FLASH_INTERVAL), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashInterval: number;
    /** How long the blip flashes, in ms (SET_BLIP_FLASH_TIMER), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashTimer: number;
    /** Sent as SHOW_FRIEND_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key, undefined for none: the blip's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the blip's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always undefined: a local blip has no synced metadata. */
    getSyncedMeta(key: string): unknown;
    /** Always []: a local blip has no synced metadata. */
    getSyncedMetaKeys(): string[];
    /** A GTA text label to name the blip with (SET_BLIP_NAME_FROM_TEXT_FILE), empty by default; while set it wins over name, and assigning name clears it. */
    gxtName: string;
    /** Whether the blip's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always false: a local blip has no synced metadata. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees (SET_BLIP_ROTATION_WITH_FLOAT); sent again when a blipType change makes the blip anew. 0 until assigned. */
    heading: number;
    /** Sent as SHOW_HEADING_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    headingIndicatorVisible: boolean;
    /** Sent as SET_BLIP_HIGH_DETAIL once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    highDetail: boolean;
    /** Negative (-1, -2 ...), unique among this client's local blips. */
    readonly id: number;
    /** Always false: only a point blip can be put on an entity. */
    readonly isAttached: false;
    /** Whether GTA shows the blip as friendly (SET_BLIP_AS_FRIENDLY), false until assigned. That native recolours the blip whatever its toggle (false leaves colour 49), so a local blip gets it only while friendly, after its colour (and again when a blipType change makes it anew); turning it off sends it with false and then the blip's colour again. */
    isFriendly: boolean;
    /** True while the dimension is -2147483648, which shows the blip in every dimension. */
    readonly isGlobal: boolean;
    /** Sent as SET_BLIP_HIDDEN_ON_LEGEND once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isHiddenOnLegend: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native shrinked uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    isMinimalOnEdge: boolean;
    /** True for a blip of the server, false for one this client made. */
    readonly isRemote: boolean;
    /** Sent as SET_BLIP_SHORT_HEIGHT_THRESHOLD once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isShortHeightThreshold: boolean;
    /** True while GTA has the blip, it is visible and its dimension matches the local player's. */
    readonly isStreamedIn: boolean;
    /** The name in the map legend, empty by default; assigning clears gxtName and names the blip with BEGIN_TEXT_COMMAND_SET_BLIP_NAME. */
    name: string;
    /** Number shown on the blip (SHOW_NUMBER_ON_BLIP), truncated; a negative one hides it (HIDE_NUMBER_ON_BLIP). -1 until assigned. */
    number: number;
    /** Sent as SHOW_OUTLINE_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    outlineIndicatorVisible: boolean;
    /** Its position, a copy; assigning moves it (SET_BLIP_COORDS), a missing or non-numeric component becoming 0. */
    pos: Vector3Like;
    /** SET_BLIP_PRIORITY, truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    priority: number;
    /** Assigning true pulses the blip once (PULSE_BLIP); false sends nothing, and the value read is only what was assigned. */
    pulse: boolean;
    /** Always 1: the runtime keeps no reference count of its objects. */
    readonly refCount: 1;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteID: number;
    /** Whether GTA draws a GPS route to the blip (SET_BLIP_ROUTE), false by default. */
    route: boolean;
    /** Colour index of the GPS route (SET_BLIP_ROUTE_COLOUR), clamped to 0..255 and truncated; 0 by default. */
    routeColor: number;
    /** Icon size (SET_BLIP_SCALE), 1 by default, at least 0. */
    scale: number;
    /** GTA's handle of the blip: 0 until GTA has made it and after destroy(); a blipType change makes the blip again with a new handle. */
    readonly scriptID: number;
    /** Secondary colour (SET_BLIP_SECONDARY_COLOUR): an {r, g, b} object, each clamped to 0..255, or a number 0xRRGGBBAA; read back as assigned, {r: 0, g: 0, b: 0, a: 255} by default. */
    secondaryColor: number | { r?: number; g?: number; b?: number; a?: number };
    /** Stores the value under the key in the blip's own metadata on this client and fires metaChange (blip, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Shown on the minimap only nearby (SET_BLIP_AS_SHORT_RANGE), false by default. */
    shortRange: boolean;
    /** Draws the blip's sight cone (SET_BLIP_SHOW_CONE, hue 0); sent again when a blipType change makes the blip anew, false until assigned. */
    showCone: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native isMinimalOnEdge uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    shrinked: boolean;
    /** The area's width (x) and height (y) in metres as given to the constructor, a negative one becoming 0; assigning resizes it (SET_BLIP_SCALE_2D). */
    size: Vector2Like;
    /** Icon (BlipSprite), 1 by default; truncated, at least 0 (SET_BLIP_SPRITE). */
    sprite: number;
    /** Sent as SHOW_TICK_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4). */
    readonly type: 4;
    /** Sent as SET_BLIP_USE_HEIGHT_INDICATOR_ON_EDGE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    useHeightIndicatorOnEdge: boolean;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
    /** Shows or hides the blip (display 0 while hidden), true by default. */
    visible: boolean;
    /** Resolves once GTA has made the blip (after a blipType change, the new one); rejects with the error when making it failed. */
    waitForSpawn(): Promise<void>;
}

export class Audio {
    constructor(url?: string, volume?: number);
    /** Every Audio not yet destroyed, of every resource. */
    static readonly all: Audio[];
    /** The number of Audio.all. */
    static readonly count: number;
    /** The same as new Audio(url, volume): volume 0..1 (clamped), default 1; nothing loads before play(). A path is taken relative to the server's HTTP address, and the URL must be on the server's own hosts (checked when it first loads). */
    static create(url: string, volume?: number): Audio;
    /** The Audio with this id; null when there is none or it was destroyed. */
    static getByID(id: number): Audio | null;
    /** The number 0. Nothing in the runtime reads it: where an Audio is heard is set with addOutput (an AudioOutputFrontend, AudioOutputWorld or AudioOutputAttached). */
    static readonly OutputFrontend: number;
    /** The number 1. Nothing in the runtime reads it: where an Audio is heard is set with addOutput (an AudioOutputFrontend, AudioOutputWorld or AudioOutputAttached). */
    static readonly OutputWorld: number;
    /** Creates an Audio and starts it at once; it is heard whatever its outputs. A failed start fires its error listeners (code 1) instead of throwing, and the audio is not destroyed when it ends. */
    static playFrontend(url: string, volume?: number): Audio;
    /** Plays the audio through this output; from then on an Audio not made by playFrontend is heard only through its outputs. null, a destroyed output or one already added is ignored. */
    addOutput(output: AudioOutput): void;
    /** An AudioCategory name or hash, "" for none: that category's volume multiplies the audio's. */
    category: string | number;
    /** Playback position in seconds, as the player last reported it (a few times a second while playing); 0 before the first play() or seek(). Assigning moves playback there (negative counts as 0) without firing streamSeek, and is ignored before the first play() or seek(). */
    currentTime: number;
    /** Removes the key from this Audio's own metadata (setMeta); the metadata lives in this object only. */
    deleteMeta(key: string): void;
    /** Stops the audio and frees its player, listeners and outputs; valid turns false and later calls do nothing. A resource's audio is destroyed when the resource stops. */
    destroy(): void;
    /** The same as maxTime: the length in seconds once the player knows it, else 0 (also for a stream without an end). */
    readonly duration: number;
    /** The listeners of that event, or of every event when no name is given. */
    getEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** The value setMeta stored under the key; undefined when there is none. */
    getMeta(key: string): any;
    /** A copy of the outputs addOutput added; a destroyed output leaves the list. */
    getOutputs(): AudioOutput[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Its id for Audio.getByID, unique on this client. */
    readonly id: number;
    /** True for an Audio made by Audio.playFrontend: it is heard whatever its outputs. */
    readonly isFrontend: boolean;
    /** Whether playback starts over at the end; default false. Assigning applies to the loaded audio at once, and a value set before it loads (or before a new source) reaches the player when it does. */
    loop: boolean;
    /** Reads loop. Assigning sets loop and applies it to the loaded audio at once. */
    looped: boolean;
    /** The length in seconds once the player knows it; 0 before the audio loads and for a stream without an end. */
    readonly maxTime: number;
    /** Removes the listener from that event: every registration of it this resource made with on or once. */
    off(eventName: string, callback: (...args: any[]) => void): void;
    /** Adds a listener: inited (it can play), streamStarted, streamPaused, streamEnded, streamReset, streamSeek (seconds), error (code, message) or volumeChange (volume). Adding the same function again does nothing; the handle's destroy() removes it. */
    on<E extends string>(eventName: E, callback: E extends keyof AudioEventHandlers ? AudioEventHandlers[E] : (...args: any[]) => void): VarionEventHandle;
    /** Like on, for the next such event only. */
    once<E extends string>(eventName: E, callback: E extends keyof AudioEventHandlers ? AudioEventHandlers[E] : (...args: any[]) => void): VarionEventHandle;
    /** Pauses playback (streamPaused follows); play() resumes it. Does nothing before the first play() or after destroy(). */
    pause(): void;
    /** Starts or resumes playback, loading the URL the first time, and resolves once it plays. Rejects when playback fails, the URL is not allowed or the audio is destroyed; with no URL it resolves at once and plays nothing. */
    play(): Promise<void>;
    /** Playback speed, 1 by default, kept within 0.1..4 (0 or a non-number counts as 1). A rate set before the audio loads, or before a new source, applies when it loads. */
    playbackRate: number;
    /** True while the audio plays, as the player reports it; false before the first play() and once it is paused, stopped or ended. */
    readonly playing: boolean;
    /** Stops playing the audio through this output; an Audio left without outputs is silent unless playFrontend made it. */
    removeOutput(output: AudioOutput): void;
    /** stop(), then fires streamReset. */
    reset(): void;
    /** Moves playback to that time in seconds (negative counts as 0) and fires streamSeek with it. Throws on a destroyed audio; does nothing without a URL. */
    seek(seconds: number): void;
    /** Stores a value under the key in this Audio's own metadata, or each entry of an object. Only this object holds it; destroy() clears it. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Sets volume (clamped to 0..1) and fires volumeChange with it. */
    setVolume(volume: number): void;
    /** The URL or path given, "" for none. Assigning another pauses the audio and drops what was loaded; the next play() loads the new source and checks its host then. */
    source: string;
    /** Pauses and rewinds to the start. Does nothing before the first play() or after destroy(). */
    stop(): void;
    /** The same as source. */
    url: string;
    /** True until destroy(); a resource's audio is destroyed when the resource stops. */
    readonly valid: boolean;
    /** Its own volume, 0..1 (clamped), multiplied by its category's volume and its outputs'. Assigning does not fire volumeChange; setVolume does. */
    volume: number;
}

export const AudioCategories: {
    readonly Ambience: any;
    readonly AmbienceBirds: any;
    readonly AmbienceCollectables: any;
    readonly AmbienceGeneral: any;
    readonly AmbienceIndustrial: any;
    readonly AmbienceInsects: any;
    readonly AmbienceMusic: any;
    readonly AmbienceSpeech: any;
    readonly AmbienceWeather: any;
    readonly AnimalsFootsteps: any;
    readonly Collisions: any;
    readonly CollisionsCloth: any;
    readonly CollisionsGlass: any;
    readonly CollisionsLouder: any;
    readonly CollisionsScripted: any;
    readonly CollisionsVehiclesGlass: any;
    readonly Cutscenes: any;
    readonly Doors: any;
    readonly DoorsLoud: any;
    readonly Fire: any;
    readonly FireLouder: any;
    readonly FrontendGameLoud: any;
    readonly FrontendMenu: any;
    readonly FrontendMenuLoud: any;
    readonly FrontendRadio: any;
    readonly GameWorld: any;
    readonly HUD: any;
    readonly InteractiveMusic: any;
    readonly Melee: any;
    readonly Music: any;
    readonly MusicLoading: any;
    readonly Peds: any;
    readonly PedsClothing: any;
    readonly PedsCollisions: any;
    readonly PedsCollisionsLoud: any;
    readonly PedsWind: any;
    readonly Radio: any;
    readonly Score: any;
    readonly Scripted: any;
    readonly ScriptedAlarms: any;
    readonly ScriptedLouder: any;
    readonly ScriptedTV: any;
    readonly Speech: any;
    readonly SpeechAmbient: any;
    readonly SpeechBreathing: any;
    readonly SpeechPain: any;
    readonly SpeechScripted: any;
    readonly Underwater: any;
    readonly UnderwaterLoud: any;
    readonly UnderwaterMuted: any;
    readonly UnderwaterSwimming: any;
    readonly Vehicles: any;
    readonly VehiclesBicycles: any;
    readonly VehiclesBicyclesMechanical: any;
    readonly VehiclesBoatsEngines: any;
    readonly VehiclesBoatsWater: any;
    readonly VehiclesBrakes: any;
    readonly VehiclesCarBy: any;
    readonly VehiclesChassisRattle: any;
    readonly VehiclesDoors: any;
    readonly VehiclesEnginesCooling: any;
    readonly VehiclesEnginesDamage: any;
    readonly VehiclesEnginesIgnition: any;
    readonly VehiclesEnginesIntake: any;
    readonly VehiclesEnginesLoud: any;
    readonly VehiclesEnginesReflections: any;
    readonly VehiclesEnginesStartup: any;
    readonly VehiclesExtrasLoud: any;
    readonly VehiclesHelis: any;
    readonly VehiclesHelisDistant: any;
    readonly VehiclesHorns: any;
    readonly VehiclesHornsLoud: any;
    readonly VehiclesPlanes: any;
    readonly VehiclesPlanesClose: any;
    readonly VehiclesPlanesDistant: any;
    readonly VehiclesPlanesExtras: any;
    readonly VehiclesPlanesJet: any;
    readonly VehiclesPlanesProp: any;
    readonly VehiclesSirens: any;
    readonly VehiclesSuspension: any;
    readonly VehiclesTrain: any;
    readonly VehiclesTrainBrakes: any;
    readonly VehiclesTrainCarriage: any;
    readonly VehiclesTrainClack: any;
    readonly VehiclesWheels: any;
    readonly VehiclesWheelsLoud: any;
    readonly VehiclesWheelsSkids: any;
    readonly Water: any;
    readonly WaterLoud: any;
    readonly WaterOcean: any;
    readonly WaterRiver: any;
    readonly WaterSwimming: any;
    readonly Weapons: any;
    readonly WeaponsExplosions: any;
    readonly WeaponsExplosionsLoud: any;
    readonly WeaponsGuns: any;
    readonly Weather: any;
    readonly WeatherRain: any;
    readonly WeatherRainHeavy: any;
    readonly WeatherRainProps: any;
    readonly WeatherThunder: any;
    readonly WeatherWind: any;
    readonly WeatherWindFoliage: any;
    readonly x011F1827: any;
    readonly x01E27C7E: any;
    readonly x02C7B342: any;
    readonly x03D39751: any;
    readonly x044986F4: any;
    readonly x05403EE1: any;
    readonly x05D22F30: any;
    readonly x0607FDB8: any;
    readonly x0BE5A8C0: any;
    readonly x0D3C9D38: any;
    readonly x0E212957: any;
    readonly x0E4CF672: any;
    readonly x11034592: any;
    readonly x11D52176: any;
    readonly x1C507071: any;
    readonly x1E51E02F: any;
    readonly x1F418253: any;
    readonly x1FF21B89: any;
    readonly x20230050: any;
    readonly x25E385A7: any;
    readonly x266E012E: any;
    readonly x291E7FD7: any;
    readonly x2BA33BE9: any;
    readonly x2EED1D0A: any;
    readonly x2F34D6FC: any;
    readonly x31A9A815: any;
    readonly x32157574: any;
    readonly x368CC071: any;
    readonly x3874EB6C: any;
    readonly x39736A51: any;
    readonly x3A52AFA3: any;
    readonly x3AA35DEF: any;
    readonly x3C496EED: any;
    readonly x3EB27392: any;
    readonly x3F6594E4: any;
    readonly x414231B5: any;
    readonly x41ACDDFF: any;
    readonly x44E21C90: any;
    readonly x45EB536F: any;
    readonly x4E8BCAED: any;
    readonly x4FFD9CA5: any;
    readonly x52BA33D4: any;
    readonly x53B27328: any;
    readonly x585863F0: any;
    readonly x5A6165D9: any;
    readonly x6244F855: any;
    readonly x63614939: any;
    readonly x639A44A4: any;
    readonly x6805AAC2: any;
    readonly x6A3DD9A1: any;
    readonly x6C742462: any;
    readonly x6D867E97: any;
    readonly x6F56A5DC: any;
    readonly x75FB2B65: any;
    readonly x781669E6: any;
    readonly x7A6F1418: any;
    readonly x80722AAA: any;
    readonly x85B8BFD4: any;
    readonly x85DBC375: any;
    readonly x864AAAB9: any;
    readonly x88EEAE72: any;
    readonly x8A91FE75: any;
    readonly x9205C7A1: any;
    readonly x933E72C3: any;
    readonly x94821026: any;
    readonly x9748F077: any;
    readonly x992F6CB7: any;
    readonly x9B60B77E: any;
    readonly x9C6A4771: any;
    readonly xA4D158B0: any;
    readonly xA6A84701: any;
    readonly xA6DA13DC: any;
    readonly xA95BF404: any;
    readonly xAA0678B2: any;
    readonly xAC3F546D: any;
    readonly xACA58232: any;
    readonly xB2681B31: any;
    readonly xB421C2DC: any;
    readonly xB4C14B9C: any;
    readonly xB607457F: any;
    readonly xB9CB44C7: any;
    readonly xBAD598C7: any;
    readonly xBC11E471: any;
    readonly xBC72B5EB: any;
    readonly xBCE6F3E0: any;
    readonly xBF162C33: any;
    readonly xC4872161: any;
    readonly xC701057A: any;
    readonly xC7D71D61: any;
    readonly xC8B2D787: any;
    readonly xCB2382B4: any;
    readonly xCD3365DE: any;
    readonly xCFF0C1C2: any;
    readonly xD2626419: any;
    readonly xD3594A47: any;
    readonly xD4AE89CA: any;
    readonly xD59675EA: any;
    readonly xDA38F55D: any;
    readonly xDCA3CC61: any;
    readonly xDF9CFFD4: any;
    readonly xE3FAF7D3: any;
    readonly xE86DF43F: any;
    readonly xE8C16DEA: any;
    readonly xEA1277B9: any;
    readonly xEA185B02: any;
    readonly xEB0390D7: any;
    readonly xEB0865AB: any;
    readonly xED39E59D: any;
    readonly xF05AAEDD: any;
    readonly xF0E66096: any;
    readonly xF1754C85: any;
    readonly xF2C3426E: any;
    readonly xF3196F77: any;
    readonly xF48DE3B3: any;
    readonly xF4908CAD: any;
    readonly xF4FABC2A: any;
    readonly xF7954E76: any;
    readonly xF7C35252: any;
    readonly xF841C9F9: any;
    readonly xF846B110: any;
    readonly xFB40B82B: any;
    readonly xFDB42EDF: any;
    readonly xFF7A0598: any;
};

export class AudioCategory {
    constructor(name: string | number);
    /** An AudioCategory for a name or hash, a new object on each call; objects of the same category share its volume. */
    static get(name: string | number): AudioCategory;
    /** The category's name; a number assigned reads back as text. Assigning points this object at that category and its volume. */
    get name(): string;
    set name(value: string | number);
    /** 0..1 (clamped), default 1: multiplies the volume of every Audio and AudioOutput of this category, for every resource. GTA's own sounds are not affected. */
    volume: number;
}

export class AudioFilter {
    /** Wraps a filter in an AudioFilter: a number is kept as an unsigned 32-bit hash (0 for a non-number), a name ("phone") is hashed. AudioFilter.create(nameOrHash) returns the same object for the same hash. */
    constructor(hash: number | string);
    /** The AudioFilter of a name (hashed) or hash, the same object for the same hash. An output's filter accepts only walkietalkie, phone and underwater. */
    static create(nameOrHash: string | number): AudioFilter;
    /** The filter's hash, an unsigned 32-bit number. */
    readonly hash: number;
    /** Text of the form "AudioFilter{ hash: N }", the hash in decimal. */
    toString(): string;
}

export class AudioOutput {
    /** No instances of its own: create an AudioOutputFrontend, AudioOutputWorld or AudioOutputAttached. */
    private constructor();
    /** Every audio output not yet destroyed, of every kind and resource. */
    static readonly all: AudioOutput[];
    /** The number of AudioOutput.all. */
    static readonly count: number;
    /** The output with this id, of any kind; null when there is none or it was destroyed. */
    static getByID(id: number): AudioOutput | null;
    /** A category hash, 0 for none: that AudioCategory's volume multiplies the output's volume. */
    category: number;
    /** Takes the output off every Audio and WebView that uses it; valid turns false and later calls do nothing. A resource's outputs are destroyed when the resource stops. */
    destroy(): void;
    /** walkietalkie, phone or underwater; null removes the filter. Unsupported presets throw RangeError. */
    filter: AudioFilter | null;
    /** Its id for getByID; all kinds of output share one numbering. */
    readonly id: number;
    /** While true the output passes no sound; default false. */
    muted: boolean;
    /** True until destroy(). */
    readonly valid: boolean;
    /** The output's volume, 0..1 (default 1; clamped when applied). */
    volume: number;
}

export class AudioOutputAttached {
    constructor(entity: { readonly pos: Vector3Like; readonly valid?: boolean; readonly isStreamedIn?: boolean } | null, categoryHash?: number);
    /** Every output of this kind not yet destroyed. */
    static readonly all: AudioOutputAttached[];
    /** The number of AudioOutputAttached.all. */
    static readonly count: number;
    /** The output of this kind with this id; null when there is none, it is of another kind or it was destroyed. */
    static getByID(id: number): AudioOutputAttached | null;
    /** A category hash, 0 for none: that AudioCategory's volume multiplies the output's volume. */
    category: number;
    /** Takes the output off every Audio and WebView that uses it; valid turns false and later calls do nothing. A resource's outputs are destroyed when the resource stops. */
    destroy(): void;
    /** The entity the sound follows (anything with pos), null for none. The output is silent while it is null or the entity's valid or isStreamedIn is false; assignable. */
    entity: { readonly pos: Vector3Like; readonly valid?: boolean; readonly isStreamedIn?: boolean } | null;
    /** walkietalkie, phone or underwater; null removes the filter. Unsupported presets throw RangeError. */
    filter: AudioFilter | null;
    /** Its id for getByID; all kinds of output share one numbering. */
    readonly id: number;
    /** Distance from the camera in metres at which the sound fades out completely, 50 by default; volume falls with the square of (1 - distance / maxDistance). 0 or a non-number counts as 50. */
    maxDistance: number;
    /** While true the output passes no sound; default false. */
    muted: boolean;
    /** The entity's pos, or (0, 0, 0) without an entity. */
    readonly pos: Vector3Like;
    /** True until destroy(). */
    readonly valid: boolean;
    /** The output's volume, 0..1 (default 1; clamped when applied), faded by the camera's distance to the entity: silent beyond maxDistance (50 m by default) and while the entity is not streamed in. */
    volume: number;
}

export class AudioOutputFrontend {
    constructor(categoryHash?: number);
    /** Every output of this kind not yet destroyed. */
    static readonly all: AudioOutputFrontend[];
    /** The number of AudioOutputFrontend.all. */
    static readonly count: number;
    /** The output of this kind with this id; null when there is none, it is of another kind or it was destroyed. */
    static getByID(id: number): AudioOutputFrontend | null;
    /** A category hash, 0 for none: that AudioCategory's volume multiplies the output's volume. */
    category: number;
    /** Takes the output off every Audio and WebView that uses it; valid turns false and later calls do nothing. A resource's outputs are destroyed when the resource stops. */
    destroy(): void;
    /** walkietalkie, phone or underwater; null removes the filter. Unsupported presets throw RangeError. */
    filter: AudioFilter | null;
    /** Its id for getByID; all kinds of output share one numbering. */
    readonly id: number;
    /** While true the output passes no sound; default false. */
    muted: boolean;
    /** True until destroy(). */
    readonly valid: boolean;
    /** The output's volume, 0..1 (default 1; clamped when applied); a frontend output plays at it wherever the camera is. */
    volume: number;
}

export class AudioOutputWorld {
    constructor(pos: Vector3Like, categoryHash?: number);
    /** Every output of this kind not yet destroyed. */
    static readonly all: AudioOutputWorld[];
    /** The number of AudioOutputWorld.all. */
    static readonly count: number;
    /** The output of this kind with this id; null when there is none, it is of another kind or it was destroyed. */
    static getByID(id: number): AudioOutputWorld | null;
    /** A category hash, 0 for none: that AudioCategory's volume multiplies the output's volume. */
    category: number;
    /** Takes the output off every Audio and WebView that uses it; valid turns false and later calls do nothing. A resource's outputs are destroyed when the resource stops. */
    destroy(): void;
    /** walkietalkie, phone or underwater; null removes the filter. Unsupported presets throw RangeError. */
    filter: AudioFilter | null;
    /** Its id for getByID; all kinds of output share one numbering. */
    readonly id: number;
    /** Distance from the camera in metres at which the sound fades out completely, 50 by default; volume falls with the square of (1 - distance / maxDistance). 0 or a non-number counts as 50. */
    maxDistance: number;
    /** While true the output passes no sound; default false. */
    muted: boolean;
    /** Where the sound comes from: the object given to the constructor, kept by reference (changing its x, y, z moves the sound), or (0, 0, 0) when none was given; assignable. */
    pos: Vector3Like;
    /** True until destroy(). */
    readonly valid: boolean;
    /** The output's volume, 0..1 (default 1; clamped when applied), faded by the camera's distance to pos: silent beyond maxDistance (50 m by default). */
    volume: number;
}

export class BaseObject {
    /** Only a base class for `instanceof`: the client's world objects, entities and WebSocketClient extend it. The objects come from their own classes (`all`, `get`, `getByID`, constructors) and from events. */
    private constructor();
    /** The object of that BaseObjectType with that id: a player, vehicle, ped, object or virtual entity as Entity.getByID finds it, a blip, checkpoint, colshape, marker or text label as its class's getByID does (this client's own first, then the server's); null for none. */
    static getByID(type: number, id: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | Blip | Checkpoint | ColShape | Marker | TextLabel | null;
    /** The server's object of that BaseObjectType with that id: a player, vehicle, ped, object or virtual entity as Entity.getByID finds it, the server's blip, checkpoint, colshape, marker or text label (its class's getByRemoteID); null for none. On a class with a lookup of its own (LocalVehicle, WebSocketClient ...) it takes the id alone and looks in that class. */
    static getByRemoteID(type: number, remoteId: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | Blip | Checkpoint | ColShape | Marker | TextLabel | null;
    /** Removes what this client made itself (a local entity, blip, marker, checkpoint, colshape, socket ...). What the server made is the server's to remove: see the class of the object for what its destroy does. */
    destroy(): void | Promise<boolean>;
    /** Its id: a player's or server entity's server id (a native vehicle's or NPC's is the id server scripts know it by, 65536 and up), the local player's own (0 before its first state), a local entity's negative id. A blip, marker, checkpoint or colshape this client made has a negative id of its own kind. A WebSocketClient has its own number. */
    readonly id: number;
    /** Whether this client still has it. A player or server entity: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone, so a kept object turns false once it leaves; the local player: it has an id; a native vehicle or NPC: the server still binds it to this client; a local entity: until destroy(). */
    readonly valid: boolean;
}

export const BaseObjectType: {
    readonly Blip: any;
    readonly Checkpoint: any;
    readonly ColShape: any;
    readonly Marker: any;
    readonly Object: any;
    readonly Ped: any;
    readonly Player: any;
    readonly TextLabel: any;
    readonly Vehicle: any;
    readonly VirtualEntity: any;
    readonly WebView: any;
};

export class Blip {
    /** Base class of the blips this client creates (PointBlip, RadiusBlip, AreaBlip): `new Blip()` throws a TypeError. `Blip.all`, `Blip.get(id)` and `Blip.getByRemoteID(id)` also give the server's blips, which answer `instanceof` with Blip and the class of their kind. */
    private constructor();
    /** The server's blips this client has shown, as plain objects with fewer members (assigning their members changes them for this client only; while one is hidden here by the dimension rule it reads scriptID 0, and one the server removes leaves the list), then the local blips of every resource. A new array on each read. */
    static readonly all: Array<Blip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many blips Blip.all holds. */
    static readonly count: number;
    /** A local blip by its id (negative), else the server's blip by its id; null for none. */
    static get(id: number): Blip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as Blip.get. */
    static getByID(id: number): Blip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's blip with that id, as a plain object; null for none (local blips are not searched). */
    static getByRemoteID(id: number): { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The blip with this GTA handle, local ones searched first, then the server's that GTA shows now; null for 0 and for none. */
    static getByScriptID(scriptID: number): Blip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Opacity 0..255 (clamped, truncated), 255 by default; sent as SET_BLIP_ALPHA. On the server's blip, assigning changes it for this client only. */
    alpha: number;
    /** Sent as SET_BLIP_AS_MISSION_CREATOR_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    asMissionCreator: boolean;
    /** A local blip's GTA type, as BlipType: Destination (4), Radius (7) or Area (11). Assigning one of them makes the blip that kind where it is: GTA cannot change a blip's kind, so the blip is made again (a new scriptID) and given what was set on it; the class follows. A radius without a radius gets 100 m, an area made from another kind 100 x 100 m. Any other type throws a RangeError. */
    blipType: number;
    /** Sent as SET_BLIP_BRIGHT once GTA has the blip, and again when a blipType change makes it anew; false until assigned. On the server's blip, assigning changes it for this client only. */
    bright: boolean;
    /** GTA's blip category (SET_BLIP_CATEGORY), truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. Only local blips have it. */
    category: number;
    /** Colour index (BlipColor), 0 by default; clamped to 0..255 and truncated (SET_BLIP_COLOUR). On the server's blip, assigning recolours it for this client only, unclamped. */
    color: number;
    /** Sent as SHOW_CREW_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    crewIndicatorVisible: boolean;
    /** Removes the key from the blip's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. Only local blips have it. */
    deleteMeta(key: string): void;
    /** Removes the blip from GTA (REMOVE_BLIP): valid turns false and baseObjectRemove fires; later calls do nothing. A resource's blips are destroyed when it stops, and the server's blips have no destroy. */
    destroy(): void;
    /** The dimension it shows in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated, and checked again with each update of the local player. On the server's blip, assigning moves it for this client only. */
    dimension: number;
    /** GTA's display mode (SET_BLIP_DISPLAY), 2 by default, an integer of at least 0; 0 is sent instead while the blip is hidden (visible false or another dimension). On the server's blip, assigning changes it for this client only. */
    display: number;
    /** Fades the blip to opacity 0..255 (clamped) over duration ms, at least 0 (SET_BLIP_FADE); does nothing before GTA has the blip or after destroy(). Only local blips have it. */
    fade(opacity: number, duration: number): void;
    /** Sent as SET_BLIP_FLASHES once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    flashes: boolean;
    /** Sent as SET_BLIP_FLASHES_ALTERNATE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    flashesAlternate: boolean;
    /** Flash interval in ms (SET_BLIP_FLASH_INTERVAL), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. Only local blips have it. */
    flashInterval: number;
    /** How long the blip flashes, in ms (SET_BLIP_FLASH_TIMER), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. Only local blips have it. */
    flashTimer: number;
    /** Sent as SHOW_FRIEND_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key, undefined for none: the blip's own metadata on this client. Only local blips have it. */
    getMeta(key: string): unknown;
    /** The keys of the blip's own metadata (setMeta); getMetaKeys returns the same. Only local blips have it. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. Only local blips have it. */
    getMetaKeys(): string[];
    /** Always undefined on a local blip, which has no synced metadata; the server's blip returns the value the server set for the key, undefined for none. */
    getSyncedMeta(key: string): unknown;
    /** [] on a local blip; the server's blip lists the keys the server set. */
    getSyncedMetaKeys(): string[];
    /** A GTA text label to name the blip with (SET_BLIP_NAME_FROM_TEXT_FILE), empty by default; while set it wins over name, and assigning name clears it. Only local blips have it. */
    gxtName: string;
    /** Whether the blip's own metadata (setMeta) holds the key. Only local blips have it. */
    hasMeta(key: string): boolean;
    /** Always false on a local blip; the server's blip answers whether the server set the key. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees (SET_BLIP_ROTATION_WITH_FLOAT); sent again when a blipType change makes the blip anew. 0 until assigned. On the server's blip, assigning changes it for this client only. */
    heading: number;
    /** Sent as SHOW_HEADING_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    headingIndicatorVisible: boolean;
    /** Sent as SET_BLIP_HIGH_DETAIL once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    highDetail: boolean;
    /** A local blip's id is negative (-1, -2 ...) and unique on this client; the server's blips have the server's id. */
    readonly id: number;
    /** Whether the blip is on an entity: a PointBlip made on an entity GTA has here, until a blipType change; false for other local blips. The server's blips read whether the server put them on an entity. */
    readonly isAttached: boolean;
    /** Whether GTA shows the blip as friendly (SET_BLIP_AS_FRIENDLY), false until assigned. That native recolours the blip whatever its toggle (false leaves colour 49), so a local blip gets it only while friendly, after its colour (and again when a blipType change makes it anew); turning it off sends it with false and then the blip's colour again. On the server's blip, assigning changes it for this client only. */
    isFriendly: boolean;
    /** True while the dimension is -2147483648, which shows the blip in every dimension. Only local blips have it. */
    readonly isGlobal: boolean;
    /** Sent as SET_BLIP_HIDDEN_ON_LEGEND once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    isHiddenOnLegend: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native shrinked uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. Only local blips have it. */
    isMinimalOnEdge: boolean;
    /** False for a local blip; the server's blips read true. */
    readonly isRemote: boolean;
    /** Sent as SET_BLIP_SHORT_HEIGHT_THRESHOLD once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    isShortHeightThreshold: boolean;
    /** True while GTA has the blip, it is visible and its dimension matches the local player's. The server's blip reads the same: GTA has it only in the local player's dimension. */
    readonly isStreamedIn: boolean;
    /** The name in the map legend, empty by default; assigning clears gxtName and names the blip with BEGIN_TEXT_COMMAND_SET_BLIP_NAME. On the server's blip, assigning renames it for this client only. */
    name: string;
    /** Number shown on the blip (SHOW_NUMBER_ON_BLIP), truncated; a negative one hides it (HIDE_NUMBER_ON_BLIP). -1 until assigned. On the server's blip, assigning changes it for this client only. */
    number: number;
    /** Sent as SHOW_OUTLINE_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    outlineIndicatorVisible: boolean;
    /** Its position, a copy; assigning moves it (SET_BLIP_COORDS), a missing or non-numeric component becoming 0. On the server's blip, assigning moves it for this client only. */
    pos: Vector3Like;
    /** SET_BLIP_PRIORITY, truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. Only local blips have it. */
    priority: number;
    /** Assigning true pulses the blip once (PULSE_BLIP); false sends nothing, and the value read is only what was assigned. Only local blips have it. */
    pulse: boolean;
    /** Always 1: the runtime keeps no reference count of its objects. */
    readonly refCount: 1;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** 0 for a local blip; the server's blips read their id, as remoteId. */
    readonly remoteID: number;
    /** Whether GTA draws a GPS route to the blip (SET_BLIP_ROUTE), false by default. On the server's blip, assigning sets it for this client only, and the client's copy keeps it when it applies the blip again. */
    route: boolean;
    /** Colour index of the GPS route (SET_BLIP_ROUTE_COLOUR), clamped to 0..255 and truncated; 0 by default. Only local blips have it. */
    routeColor: number;
    /** Icon size (SET_BLIP_SCALE), 1 by default, at least 0. On the server's blip, assigning resizes it for this client only, and 0 becomes 1 there. */
    scale: number;
    /** GTA's handle of the blip: 0 until GTA has made it and after destroy(); a blipType change makes the blip again with a new handle. The server's blip reads 0 while it is in another dimension than the local player's, where the client keeps no GTA blip for it. */
    readonly scriptID: number;
    /** Secondary colour (SET_BLIP_SECONDARY_COLOUR): an {r, g, b} object, each clamped to 0..255, or a number 0xRRGGBBAA; read back as assigned, {r: 0, g: 0, b: 0, a: 255} by default. Only local blips have it. */
    secondaryColor: number | { r?: number; g?: number; b?: number; a?: number };
    /** Stores the value under the key in the blip's own metadata on this client and fires metaChange (blip, key, value, old value); an object sets each of its entries. Only local blips have it. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Shown on the minimap only nearby (SET_BLIP_AS_SHORT_RANGE): false by default for a local blip, true for the server's ones. On the server's blip, assigning changes it for this client only. */
    shortRange: boolean;
    /** Draws the blip's sight cone (SET_BLIP_SHOW_CONE, hue 0); sent again when a blipType change makes the blip anew, false until assigned. Only local blips have it. */
    showCone: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native isMinimalOnEdge uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. Only local blips have it. */
    shrinked: boolean;
    /** An area blip's width (x) and height (y) in metres, {1, 1} on other blips by default; assigning sends SET_BLIP_SCALE_2D (each at least 0), which only an area blip gets again when a blipType change makes it anew. On the server's blip, assigning changes it for this client only. */
    size: Vector2Like;
    /** Icon (BlipSprite), 1 by default; truncated, at least 0 (SET_BLIP_SPRITE). On the server's blip, assigning changes it for this client only. */
    sprite: number;
    /** Sent as SHOW_TICK_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4). */
    readonly type: 4;
    /** Sent as SET_BLIP_USE_HEIGHT_INDICATOR_ON_EDGE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. Only local blips have it. */
    useHeightIndicatorOnEdge: boolean;
    /** True until destroy() or the stop of its resource. The server's blips are valid while this client keeps them. */
    readonly valid: boolean;
    /** Shows or hides the blip (display 0 while hidden), true by default. On the server's blip, assigning shows or hides it for this client only. */
    visible: boolean;
    /** Resolves once GTA has made the blip (after a blipType change, the new one); rejects with the error when making it failed. Only local blips have it. */
    waitForSpawn(): Promise<void>;
}

export const BlipColor: {
    readonly "0": any;
    readonly "1": any;
    readonly "10": any;
    readonly "11": any;
    readonly "12": any;
    readonly "13": any;
    readonly "14": any;
    readonly "15": any;
    readonly "16": any;
    readonly "17": any;
    readonly "19": any;
    readonly "2": any;
    readonly "20": any;
    readonly "21": any;
    readonly "22": any;
    readonly "23": any;
    readonly "24": any;
    readonly "25": any;
    readonly "26": any;
    readonly "27": any;
    readonly "28": any;
    readonly "3": any;
    readonly "30": any;
    readonly "36": any;
    readonly "40": any;
    readonly "41": any;
    readonly "46": any;
    readonly "47": any;
    readonly "48": any;
    readonly "5": any;
    readonly "50": any;
    readonly "51": any;
    readonly "52": any;
    readonly "53": any;
    readonly "54": any;
    readonly "55": any;
    readonly "58": any;
    readonly "6": any;
    readonly "60": any;
    readonly "61": any;
    readonly "62": any;
    readonly "63": any;
    readonly "64": any;
    readonly "65": any;
    readonly "7": any;
    readonly "72": any;
    readonly "76": any;
    readonly "79": any;
    readonly "8": any;
    readonly "80": any;
    readonly "83": any;
    readonly "9": any;
    readonly AltoGray: any;
    readonly Beige: any;
    readonly BlizzardBlue: any;
    readonly Blue: any;
    readonly BrightPurple: any;
    readonly BrilliantRose: any;
    readonly Cyan: any;
    readonly DarkBrown: any;
    readonly DarkCyan: any;
    readonly DarkGray: any;
    readonly DarkGreen: any;
    readonly DarkOrange: any;
    readonly DarkPink: any;
    readonly DarkPurple: any;
    readonly DarkYellow: any;
    readonly DeepRed: any;
    readonly EastBay: any;
    readonly ElectricBlue: any;
    readonly ForestGreen: any;
    readonly Gold: any;
    readonly GraniteGreen: any;
    readonly Green: any;
    readonly JellyBeanBlue: any;
    readonly LemonGreen: any;
    readonly LightBlue: any;
    readonly LightBrown: any;
    readonly LightGray: any;
    readonly LightGreen: any;
    readonly LightOrange: any;
    readonly LightPink: any;
    readonly LightPurple: any;
    readonly LightRed: any;
    readonly LightYellow: any;
    readonly Mamba: any;
    readonly MediumPurple: any;
    readonly MulberryPink: any;
    readonly OracleBlue: any;
    readonly Orange: any;
    readonly Organe: any;
    readonly Pink: any;
    readonly PinkRed: any;
    readonly Purple: any;
    readonly Red: any;
    readonly Salmon: any;
    readonly Silver: any;
    readonly TransparentBlack: any;
    readonly TransparentBlue: any;
    readonly TransparentRed: any;
    readonly Violet: any;
    readonly White: any;
    readonly Yellow: any;
    readonly YellowOrange: any;
};

export const BlipSprite: {
    readonly "0": any;
    readonly "1": any;
    readonly "10": any;
    readonly "100": any;
    readonly "102": any;
    readonly "103": any;
    readonly "104": any;
    readonly "105": any;
    readonly "106": any;
    readonly "107": any;
    readonly "108": any;
    readonly "109": any;
    readonly "11": any;
    readonly "110": any;
    readonly "111": any;
    readonly "112": any;
    readonly "113": any;
    readonly "114": any;
    readonly "115": any;
    readonly "118": any;
    readonly "119": any;
    readonly "12": any;
    readonly "120": any;
    readonly "121": any;
    readonly "122": any;
    readonly "123": any;
    readonly "124": any;
    readonly "126": any;
    readonly "127": any;
    readonly "128": any;
    readonly "129": any;
    readonly "13": any;
    readonly "130": any;
    readonly "133": any;
    readonly "134": any;
    readonly "135": any;
    readonly "136": any;
    readonly "137": any;
    readonly "138": any;
    readonly "139": any;
    readonly "14": any;
    readonly "140": any;
    readonly "141": any;
    readonly "142": any;
    readonly "143": any;
    readonly "144": any;
    readonly "145": any;
    readonly "146": any;
    readonly "147": any;
    readonly "148": any;
    readonly "149": any;
    readonly "15": any;
    readonly "150": any;
    readonly "151": any;
    readonly "152": any;
    readonly "153": any;
    readonly "154": any;
    readonly "155": any;
    readonly "156": any;
    readonly "157": any;
    readonly "158": any;
    readonly "159": any;
    readonly "160": any;
    readonly "161": any;
    readonly "162": any;
    readonly "163": any;
    readonly "164": any;
    readonly "171": any;
    readonly "173": any;
    readonly "175": any;
    readonly "176": any;
    readonly "177": any;
    readonly "178": any;
    readonly "179": any;
    readonly "180": any;
    readonly "181": any;
    readonly "182": any;
    readonly "183": any;
    readonly "184": any;
    readonly "185": any;
    readonly "186": any;
    readonly "187": any;
    readonly "188": any;
    readonly "189": any;
    readonly "192": any;
    readonly "193": any;
    readonly "194": any;
    readonly "197": any;
    readonly "198": any;
    readonly "2": any;
    readonly "205": any;
    readonly "206": any;
    readonly "207": any;
    readonly "208": any;
    readonly "209": any;
    readonly "210": any;
    readonly "211": any;
    readonly "212": any;
    readonly "213": any;
    readonly "214": any;
    readonly "225": any;
    readonly "226": any;
    readonly "227": any;
    readonly "228": any;
    readonly "229": any;
    readonly "230": any;
    readonly "231": any;
    readonly "232": any;
    readonly "233": any;
    readonly "234": any;
    readonly "235": any;
    readonly "236": any;
    readonly "237": any;
    readonly "238": any;
    readonly "251": any;
    readonly "252": any;
    readonly "253": any;
    readonly "254": any;
    readonly "255": any;
    readonly "256": any;
    readonly "262": any;
    readonly "263": any;
    readonly "264": any;
    readonly "265": any;
    readonly "266": any;
    readonly "267": any;
    readonly "268": any;
    readonly "269": any;
    readonly "27": any;
    readonly "270": any;
    readonly "271": any;
    readonly "272": any;
    readonly "273": any;
    readonly "274": any;
    readonly "275": any;
    readonly "276": any;
    readonly "277": any;
    readonly "278": any;
    readonly "279": any;
    readonly "28": any;
    readonly "280": any;
    readonly "281": any;
    readonly "282": any;
    readonly "283": any;
    readonly "284": any;
    readonly "285": any;
    readonly "286": any;
    readonly "287": any;
    readonly "288": any;
    readonly "289": any;
    readonly "290": any;
    readonly "291": any;
    readonly "292": any;
    readonly "293": any;
    readonly "294": any;
    readonly "295": any;
    readonly "296": any;
    readonly "297": any;
    readonly "298": any;
    readonly "299": any;
    readonly "3": any;
    readonly "300": any;
    readonly "301": any;
    readonly "302": any;
    readonly "303": any;
    readonly "304": any;
    readonly "305": any;
    readonly "306": any;
    readonly "307": any;
    readonly "308": any;
    readonly "309": any;
    readonly "310": any;
    readonly "311": any;
    readonly "312": any;
    readonly "313": any;
    readonly "314": any;
    readonly "315": any;
    readonly "316": any;
    readonly "317": any;
    readonly "318": any;
    readonly "319": any;
    readonly "320": any;
    readonly "321": any;
    readonly "322": any;
    readonly "323": any;
    readonly "324": any;
    readonly "325": any;
    readonly "326": any;
    readonly "327": any;
    readonly "328": any;
    readonly "329": any;
    readonly "330": any;
    readonly "331": any;
    readonly "332": any;
    readonly "333": any;
    readonly "334": any;
    readonly "335": any;
    readonly "336": any;
    readonly "337": any;
    readonly "338": any;
    readonly "339": any;
    readonly "340": any;
    readonly "341": any;
    readonly "342": any;
    readonly "343": any;
    readonly "344": any;
    readonly "345": any;
    readonly "346": any;
    readonly "347": any;
    readonly "348": any;
    readonly "349": any;
    readonly "350": any;
    readonly "351": any;
    readonly "352": any;
    readonly "353": any;
    readonly "354": any;
    readonly "355": any;
    readonly "356": any;
    readonly "357": any;
    readonly "358": any;
    readonly "359": any;
    readonly "36": any;
    readonly "360": any;
    readonly "361": any;
    readonly "362": any;
    readonly "363": any;
    readonly "364": any;
    readonly "365": any;
    readonly "366": any;
    readonly "367": any;
    readonly "368": any;
    readonly "369": any;
    readonly "37": any;
    readonly "370": any;
    readonly "371": any;
    readonly "372": any;
    readonly "373": any;
    readonly "374": any;
    readonly "375": any;
    readonly "376": any;
    readonly "377": any;
    readonly "378": any;
    readonly "379": any;
    readonly "38": any;
    readonly "380": any;
    readonly "381": any;
    readonly "382": any;
    readonly "383": any;
    readonly "384": any;
    readonly "385": any;
    readonly "386": any;
    readonly "387": any;
    readonly "388": any;
    readonly "389": any;
    readonly "390": any;
    readonly "391": any;
    readonly "392": any;
    readonly "393": any;
    readonly "394": any;
    readonly "395": any;
    readonly "396": any;
    readonly "397": any;
    readonly "398": any;
    readonly "399": any;
    readonly "4": any;
    readonly "40": any;
    readonly "400": any;
    readonly "401": any;
    readonly "402": any;
    readonly "403": any;
    readonly "404": any;
    readonly "405": any;
    readonly "407": any;
    readonly "408": any;
    readonly "409": any;
    readonly "41": any;
    readonly "410": any;
    readonly "411": any;
    readonly "413": any;
    readonly "414": any;
    readonly "415": any;
    readonly "416": any;
    readonly "417": any;
    readonly "418": any;
    readonly "419": any;
    readonly "42": any;
    readonly "420": any;
    readonly "421": any;
    readonly "422": any;
    readonly "423": any;
    readonly "424": any;
    readonly "425": any;
    readonly "426": any;
    readonly "427": any;
    readonly "428": any;
    readonly "429": any;
    readonly "43": any;
    readonly "430": any;
    readonly "431": any;
    readonly "432": any;
    readonly "433": any;
    readonly "434": any;
    readonly "435": any;
    readonly "436": any;
    readonly "437": any;
    readonly "438": any;
    readonly "439": any;
    readonly "44": any;
    readonly "440": any;
    readonly "441": any;
    readonly "442": any;
    readonly "443": any;
    readonly "444": any;
    readonly "445": any;
    readonly "446": any;
    readonly "447": any;
    readonly "448": any;
    readonly "449": any;
    readonly "450": any;
    readonly "451": any;
    readonly "452": any;
    readonly "453": any;
    readonly "454": any;
    readonly "455": any;
    readonly "456": any;
    readonly "457": any;
    readonly "458": any;
    readonly "459": any;
    readonly "460": any;
    readonly "461": any;
    readonly "462": any;
    readonly "463": any;
    readonly "464": any;
    readonly "465": any;
    readonly "466": any;
    readonly "467": any;
    readonly "468": any;
    readonly "469": any;
    readonly "47": any;
    readonly "470": any;
    readonly "471": any;
    readonly "472": any;
    readonly "473": any;
    readonly "474": any;
    readonly "475": any;
    readonly "476": any;
    readonly "477": any;
    readonly "478": any;
    readonly "479": any;
    readonly "48": any;
    readonly "480": any;
    readonly "481": any;
    readonly "482": any;
    readonly "483": any;
    readonly "484": any;
    readonly "485": any;
    readonly "486": any;
    readonly "487": any;
    readonly "488": any;
    readonly "489": any;
    readonly "490": any;
    readonly "491": any;
    readonly "492": any;
    readonly "493": any;
    readonly "494": any;
    readonly "495": any;
    readonly "496": any;
    readonly "497": any;
    readonly "498": any;
    readonly "499": any;
    readonly "5": any;
    readonly "50": any;
    readonly "500": any;
    readonly "501": any;
    readonly "502": any;
    readonly "503": any;
    readonly "504": any;
    readonly "505": any;
    readonly "506": any;
    readonly "507": any;
    readonly "508": any;
    readonly "509": any;
    readonly "51": any;
    readonly "510": any;
    readonly "511": any;
    readonly "512": any;
    readonly "513": any;
    readonly "514": any;
    readonly "515": any;
    readonly "516": any;
    readonly "517": any;
    readonly "518": any;
    readonly "519": any;
    readonly "52": any;
    readonly "520": any;
    readonly "521": any;
    readonly "522": any;
    readonly "523": any;
    readonly "524": any;
    readonly "525": any;
    readonly "526": any;
    readonly "527": any;
    readonly "528": any;
    readonly "529": any;
    readonly "530": any;
    readonly "531": any;
    readonly "532": any;
    readonly "533": any;
    readonly "534": any;
    readonly "535": any;
    readonly "536": any;
    readonly "537": any;
    readonly "538": any;
    readonly "539": any;
    readonly "54": any;
    readonly "540": any;
    readonly "541": any;
    readonly "542": any;
    readonly "543": any;
    readonly "544": any;
    readonly "545": any;
    readonly "546": any;
    readonly "547": any;
    readonly "548": any;
    readonly "549": any;
    readonly "550": any;
    readonly "551": any;
    readonly "552": any;
    readonly "553": any;
    readonly "554": any;
    readonly "555": any;
    readonly "556": any;
    readonly "557": any;
    readonly "558": any;
    readonly "559": any;
    readonly "56": any;
    readonly "560": any;
    readonly "561": any;
    readonly "562": any;
    readonly "563": any;
    readonly "564": any;
    readonly "565": any;
    readonly "566": any;
    readonly "567": any;
    readonly "568": any;
    readonly "569": any;
    readonly "57": any;
    readonly "570": any;
    readonly "571": any;
    readonly "572": any;
    readonly "573": any;
    readonly "574": any;
    readonly "575": any;
    readonly "576": any;
    readonly "577": any;
    readonly "578": any;
    readonly "579": any;
    readonly "58": any;
    readonly "580": any;
    readonly "581": any;
    readonly "582": any;
    readonly "583": any;
    readonly "584": any;
    readonly "585": any;
    readonly "586": any;
    readonly "587": any;
    readonly "588": any;
    readonly "589": any;
    readonly "59": any;
    readonly "590": any;
    readonly "591": any;
    readonly "592": any;
    readonly "593": any;
    readonly "594": any;
    readonly "595": any;
    readonly "596": any;
    readonly "597": any;
    readonly "598": any;
    readonly "599": any;
    readonly "6": any;
    readonly "60": any;
    readonly "600": any;
    readonly "601": any;
    readonly "602": any;
    readonly "603": any;
    readonly "604": any;
    readonly "605": any;
    readonly "606": any;
    readonly "607": any;
    readonly "608": any;
    readonly "609": any;
    readonly "61": any;
    readonly "610": any;
    readonly "611": any;
    readonly "612": any;
    readonly "613": any;
    readonly "614": any;
    readonly "615": any;
    readonly "616": any;
    readonly "617": any;
    readonly "618": any;
    readonly "619": any;
    readonly "62": any;
    readonly "620": any;
    readonly "621": any;
    readonly "622": any;
    readonly "623": any;
    readonly "624": any;
    readonly "625": any;
    readonly "626": any;
    readonly "627": any;
    readonly "628": any;
    readonly "629": any;
    readonly "63": any;
    readonly "630": any;
    readonly "631": any;
    readonly "632": any;
    readonly "633": any;
    readonly "634": any;
    readonly "635": any;
    readonly "636": any;
    readonly "637": any;
    readonly "638": any;
    readonly "639": any;
    readonly "64": any;
    readonly "640": any;
    readonly "641": any;
    readonly "642": any;
    readonly "643": any;
    readonly "644": any;
    readonly "645": any;
    readonly "646": any;
    readonly "647": any;
    readonly "648": any;
    readonly "649": any;
    readonly "650": any;
    readonly "651": any;
    readonly "652": any;
    readonly "653": any;
    readonly "654": any;
    readonly "655": any;
    readonly "656": any;
    readonly "657": any;
    readonly "658": any;
    readonly "659": any;
    readonly "66": any;
    readonly "660": any;
    readonly "661": any;
    readonly "662": any;
    readonly "663": any;
    readonly "664": any;
    readonly "665": any;
    readonly "666": any;
    readonly "667": any;
    readonly "668": any;
    readonly "669": any;
    readonly "67": any;
    readonly "670": any;
    readonly "671": any;
    readonly "672": any;
    readonly "673": any;
    readonly "674": any;
    readonly "675": any;
    readonly "676": any;
    readonly "677": any;
    readonly "678": any;
    readonly "679": any;
    readonly "68": any;
    readonly "680": any;
    readonly "681": any;
    readonly "682": any;
    readonly "683": any;
    readonly "684": any;
    readonly "685": any;
    readonly "686": any;
    readonly "687": any;
    readonly "688": any;
    readonly "689": any;
    readonly "690": any;
    readonly "691": any;
    readonly "692": any;
    readonly "693": any;
    readonly "694": any;
    readonly "695": any;
    readonly "696": any;
    readonly "697": any;
    readonly "698": any;
    readonly "699": any;
    readonly "7": any;
    readonly "70": any;
    readonly "700": any;
    readonly "701": any;
    readonly "702": any;
    readonly "703": any;
    readonly "704": any;
    readonly "705": any;
    readonly "706": any;
    readonly "707": any;
    readonly "708": any;
    readonly "709": any;
    readonly "71": any;
    readonly "710": any;
    readonly "711": any;
    readonly "712": any;
    readonly "713": any;
    readonly "714": any;
    readonly "715": any;
    readonly "716": any;
    readonly "717": any;
    readonly "718": any;
    readonly "719": any;
    readonly "72": any;
    readonly "720": any;
    readonly "721": any;
    readonly "722": any;
    readonly "723": any;
    readonly "724": any;
    readonly "725": any;
    readonly "726": any;
    readonly "727": any;
    readonly "728": any;
    readonly "729": any;
    readonly "73": any;
    readonly "730": any;
    readonly "731": any;
    readonly "732": any;
    readonly "733": any;
    readonly "734": any;
    readonly "735": any;
    readonly "736": any;
    readonly "737": any;
    readonly "738": any;
    readonly "739": any;
    readonly "740": any;
    readonly "741": any;
    readonly "742": any;
    readonly "743": any;
    readonly "744": any;
    readonly "745": any;
    readonly "746": any;
    readonly "747": any;
    readonly "748": any;
    readonly "749": any;
    readonly "75": any;
    readonly "750": any;
    readonly "751": any;
    readonly "752": any;
    readonly "753": any;
    readonly "754": any;
    readonly "755": any;
    readonly "756": any;
    readonly "757": any;
    readonly "758": any;
    readonly "759": any;
    readonly "76": any;
    readonly "760": any;
    readonly "761": any;
    readonly "762": any;
    readonly "763": any;
    readonly "764": any;
    readonly "765": any;
    readonly "766": any;
    readonly "767": any;
    readonly "768": any;
    readonly "769": any;
    readonly "77": any;
    readonly "770": any;
    readonly "771": any;
    readonly "772": any;
    readonly "773": any;
    readonly "774": any;
    readonly "775": any;
    readonly "776": any;
    readonly "777": any;
    readonly "778": any;
    readonly "779": any;
    readonly "78": any;
    readonly "780": any;
    readonly "781": any;
    readonly "782": any;
    readonly "783": any;
    readonly "784": any;
    readonly "785": any;
    readonly "786": any;
    readonly "787": any;
    readonly "788": any;
    readonly "789": any;
    readonly "79": any;
    readonly "790": any;
    readonly "791": any;
    readonly "792": any;
    readonly "793": any;
    readonly "794": any;
    readonly "795": any;
    readonly "796": any;
    readonly "797": any;
    readonly "798": any;
    readonly "799": any;
    readonly "8": any;
    readonly "80": any;
    readonly "800": any;
    readonly "801": any;
    readonly "802": any;
    readonly "803": any;
    readonly "804": any;
    readonly "805": any;
    readonly "806": any;
    readonly "807": any;
    readonly "808": any;
    readonly "809": any;
    readonly "810": any;
    readonly "811": any;
    readonly "812": any;
    readonly "813": any;
    readonly "814": any;
    readonly "815": any;
    readonly "816": any;
    readonly "817": any;
    readonly "818": any;
    readonly "819": any;
    readonly "82": any;
    readonly "820": any;
    readonly "821": any;
    readonly "822": any;
    readonly "823": any;
    readonly "824": any;
    readonly "825": any;
    readonly "826": any;
    readonly "84": any;
    readonly "85": any;
    readonly "86": any;
    readonly "88": any;
    readonly "89": any;
    readonly "9": any;
    readonly "90": any;
    readonly "91": any;
    readonly "92": any;
    readonly "93": any;
    readonly "94": any;
    readonly "95": any;
    readonly "96": any;
    readonly "99": any;
    readonly Abigail: any;
    readonly AcsrRaceHotring: any;
    readonly AcsrRaceTarget: any;
    readonly AcsrWp1: any;
    readonly AcsrWp2: any;
    readonly Activities: any;
    readonly Adversary: any;
    readonly Adversary10: any;
    readonly Adversary12: any;
    readonly Adversary16: any;
    readonly Adversary4: any;
    readonly Adversary8: any;
    readonly AdversaryBunker: any;
    readonly AdversaryFeatured: any;
    readonly Agatha: any;
    readonly Agency: any;
    readonly AI: any;
    readonly Aim: any;
    readonly AirHockey: any;
    readonly Airport: any;
    readonly Altruist: any;
    readonly AP: any;
    readonly Arcade: any;
    readonly Area: any;
    readonly AreaOutline: any;
    readonly ArenaBruiser: any;
    readonly ArenaBrutus: any;
    readonly ArenaCerberus: any;
    readonly ArenaDeathbike: any;
    readonly ArenaDominator: any;
    readonly ArenaImpaler: any;
    readonly ArenaImperator: any;
    readonly ArenaIssi: any;
    readonly ArenaPremium: any;
    readonly ArenaRCCar: any;
    readonly ArenaRCWorkshop: any;
    readonly ArenaSasquatch: any;
    readonly ArenaScarab: any;
    readonly ArenaSeries: any;
    readonly ArenaSlamvan: any;
    readonly ArenaTrapBomb: any;
    readonly ArenaTrapBrd: any;
    readonly ArenaTrapFire: any;
    readonly ArenaTrapFlip: any;
    readonly ArenaTrapMine: any;
    readonly ArenaTrapPit: any;
    readonly ArenaTrapSbrd: any;
    readonly ArenaTrapSea: any;
    readonly ArenaTrapTurn: any;
    readonly ArenaTrapWall: any;
    readonly ArenaTurret: any;
    readonly ArenaWorkshop: any;
    readonly ArenaZr: any;
    readonly ArmenianFamily: any;
    readonly ArmsDealing: any;
    readonly ArmsDealingAir: any;
    readonly ArmWrestling: any;
    readonly AssassinsMark: any;
    readonly AssaultPackage: any;
    readonly AutoShopProperty: any;
    readonly BandStrand: any;
    readonly Bar: any;
    readonly Barber: any;
    readonly Barry: any;
    readonly BaseJump: any;
    readonly Basketball: any;
    readonly BatAssassinate: any;
    readonly BatCargo: any;
    readonly BatCashReg: any;
    readonly BatClubProperty: any;
    readonly BatDrone: any;
    readonly BatHackGold: any;
    readonly BatHackJewel: any;
    readonly BatHackTarget: any;
    readonly BatKeypad: any;
    readonly BatPbus: any;
    readonly BatRivalClub: any;
    readonly BatTruck: any;
    readonly BatWp1: any;
    readonly BatWp2: any;
    readonly BatWp3: any;
    readonly BatWp4: any;
    readonly BatWp5: any;
    readonly BatWp6: any;
    readonly BatWp7: any;
    readonly Beast: any;
    readonly BellyOfTheBeast: any;
    readonly Bennys: any;
    readonly BikerCagedIn: any;
    readonly BikerClubhouse: any;
    readonly BikerJoust: any;
    readonly BikerTurfWar: any;
    readonly BiolabHeist: any;
    readonly Blimp: any;
    readonly Blimp2: any;
    readonly Boat: any;
    readonly Boilersuit: any;
    readonly BoltCutters: any;
    readonly BombA: any;
    readonly Boost: any;
    readonly BountyCollectibles: any;
    readonly BountyHit: any;
    readonly BountyHitInside: any;
    readonly Buffalo4: any;
    readonly Buggy1: any;
    readonly Buggy2: any;
    readonly Bugstar: any;
    readonly Bus: any;
    readonly Business: any;
    readonly BusinessForSale: any;
    readonly CabaretClub: any;
    readonly CableCar: any;
    readonly Camera: any;
    readonly Camera2: any;
    readonly CameraBadger: any;
    readonly CameraFacade: any;
    readonly CameraIfruit: any;
    readonly Capture1: any;
    readonly Capture10: any;
    readonly Capture2: any;
    readonly Capture3: any;
    readonly Capture4: any;
    readonly Capture5: any;
    readonly Capture6: any;
    readonly Capture7: any;
    readonly Capture8: any;
    readonly Capture9: any;
    readonly CaptureTheFlag: any;
    readonly CaptureTheFlagBase: any;
    readonly CaptureTheFlagBaseNoBag: any;
    readonly CaptureTheFlagOutline: any;
    readonly CaptureTheUSAFlag: any;
    readonly CaptureTheUSAFlagOutline: any;
    readonly Cargobob: any;
    readonly CarMeet: any;
    readonly CarMeetOrganiser: any;
    readonly CarModShop: any;
    readonly CarRobberyBoard: any;
    readonly CarRobberyPrep: any;
    readonly CarTestArea: any;
    readonly CarWash: any;
    readonly CashCops: any;
    readonly CashLost: any;
    readonly CashPickup: any;
    readonly CashVagos: any;
    readonly Casino: any;
    readonly CasinoChips: any;
    readonly CasinoConcierge: any;
    readonly CasinoHorseRacing: any;
    readonly CasinoTableGames: any;
    readonly CasinoWheel: any;
    readonly CCTV: any;
    readonly CelebrityTheft: any;
    readonly Centre: any;
    readonly CentreRed: any;
    readonly CentreStroke: any;
    readonly ChalkboardList: any;
    readonly ChineseStrand: any;
    readonly Chinook: any;
    readonly Chop: any;
    readonly Cinema: any;
    readonly Cletus: any;
    readonly ClothesStore: any;
    readonly ComedyClub: any;
    readonly ComicStore: any;
    readonly Completed: any;
    readonly CompoundGate: any;
    readonly ConstructionOutfit: any;
    readonly Contraband: any;
    readonly ControlTower: any;
    readonly CopCar: any;
    readonly CopPatrol: any;
    readonly CopPlayer: any;
    readonly CornerNumber1: any;
    readonly CornerNumber2: any;
    readonly CornerNumber3: any;
    readonly CornerNumber4: any;
    readonly CornerNumber5: any;
    readonly CornerNumber6: any;
    readonly CornerNumber7: any;
    readonly CornerNumber8: any;
    readonly Cpanel1: any;
    readonly Cpanel2: any;
    readonly Cpanel3: any;
    readonly Cpanel4: any;
    readonly CrateDrop: any;
    readonly CrateDropBackground: any;
    readonly Creator: any;
    readonly CreatorDirection: any;
    readonly CriminalCarsteal: any;
    readonly CriminalCarStealBikers: any;
    readonly CriminalCarStealCops: any;
    readonly CriminalCarStealVagos: any;
    readonly CriminalCuffKeys: any;
    readonly CriminalDrugs: any;
    readonly CriminalHoldups: any;
    readonly CriminalPlayer: any;
    readonly CriminalSavedVehicle: any;
    readonly CriminalWanted: any;
    readonly Crusader: any;
    readonly CustodyBikers: any;
    readonly CustodyDropOff: any;
    readonly CustodyVagos: any;
    readonly Darts: any;
    readonly DChampion: any;
    readonly Dead: any;
    readonly DeadDrop: any;
    readonly Deathmatch: any;
    readonly Deity: any;
    readonly Devin: any;
    readonly Dinghy: any;
    readonly Dinghy2: any;
    readonly Dock: any;
    readonly DockForSale: any;
    readonly DocksExport: any;
    readonly DocksHeist: any;
    readonly Dom: any;
    readonly DragRaceFinish: any;
    readonly Drill: any;
    readonly DrivingBikers: any;
    readonly DrivingCops: any;
    readonly DrivingVagos: any;
    readonly DroneControls: any;
    readonly DrugsPackage: any;
    readonly EdgeCrossTheLine: any;
    readonly EdgePointer: any;
    readonly Elevator: any;
    readonly EnemyHeliSpin: any;
    readonly Epsilon: any;
    readonly ExplosiveCharge: any;
    readonly ExportVehicle: any;
    readonly ExVech1: any;
    readonly ExVech2: any;
    readonly ExVech3: any;
    readonly ExVech4: any;
    readonly ExVech5: any;
    readonly ExVech6: any;
    readonly ExVech7: any;
    readonly EyeSky: any;
    readonly Fairground: any;
    readonly Fanatic: any;
    readonly FbiHeist: any;
    readonly FbiOfficersStrand: any;
    readonly FeaturedSeries: any;
    readonly FinaleBankHeist: any;
    readonly FinancierStrand: any;
    readonly FinancierStrandGrey: any;
    readonly FindersKeepers: any;
    readonly Firetruck: any;
    readonly FlightSchool: any;
    readonly FoldingWingJet: any;
    readonly FranklinA: any;
    readonly FranklinB: any;
    readonly FranklinC: any;
    readonly FranklinFamily: any;
    readonly FranklinFamilyBlue: any;
    readonly FranklinFamilyGrey: any;
    readonly Friend: any;
    readonly FriendCinema: any;
    readonly FriendComedyClub: any;
    readonly FriendDarts: any;
    readonly FriendGolf: any;
    readonly FriendLiveMusic: any;
    readonly FriendStripClub: any;
    readonly FriendTennis: any;
    readonly GangAttackPackage: any;
    readonly GangBike: any;
    readonly GangBikers: any;
    readonly GangBikersHighlight: any;
    readonly GangCops: any;
    readonly GangCopsHighlight: any;
    readonly GangCopsPartner: any;
    readonly GangHighlight: any;
    readonly GangMexicans: any;
    readonly GangMexicansHighlight: any;
    readonly GangVehicle: any;
    readonly GangVehicleBikers: any;
    readonly GangVehicleCops: any;
    readonly GangVehicleVagos: any;
    readonly Garage: any;
    readonly GarageForSale: any;
    readonly Garbage: any;
    readonly GasGrenade: any;
    readonly Gerald: any;
    readonly GetawayCar: any;
    readonly Golf: any;
    readonly GolfFlag: any;
    readonly Granger2: any;
    readonly GrCovertOps: any;
    readonly GreenAndFriendly: any;
    readonly GreenAndNetPlayer1: any;
    readonly GreenAndNetPlayer2: any;
    readonly GreenAndNetPlayer3: any;
    readonly GrMocUpgrade: any;
    readonly GrWUpgrade: any;
    readonly GrWvm1: any;
    readonly GrWvm2: any;
    readonly GrWvm3: any;
    readonly GrWvm4: any;
    readonly GrWvm5: any;
    readonly GrWvm6: any;
    readonly Guncar: any;
    readonly GunShop: any;
    readonly HandcuffKeysBikers: any;
    readonly HandcuffKeysVagos: any;
    readonly HandcuffsClosedBikers: any;
    readonly HandcuffsClosedVagos: any;
    readonly Hangar: any;
    readonly HangarForSale: any;
    readonly Heist: any;
    readonly HeistDiamond: any;
    readonly HeistDiamondUnavailable: any;
    readonly HeistDoomsday: any;
    readonly HeistDoomsdayUnavailable: any;
    readonly HeistIsland: any;
    readonly HeistIslandUnavailable: any;
    readonly HeistPrep: any;
    readonly Helicopter: any;
    readonly Helipad: any;
    readonly HelipadForSale: any;
    readonly Higher: any;
    readonly HigherAI: any;
    readonly Hooker: any;
    readonly Horde: any;
    readonly Hospital: any;
    readonly HotProperty: any;
    readonly Hunting: any;
    readonly HuntTheBoss: any;
    readonly IllegalParking: any;
    readonly Incapacitated: any;
    readonly InfoIcon: any;
    readonly InternetCafe: any;
    readonly IslandHeistPrep: any;
    readonly IslandParty: any;
    readonly JerryCan: any;
    readonly JewelryHeist: any;
    readonly Josh: any;
    readonly Jubilee: any;
    readonly Juggernaut: any;
    readonly Junkyard: any;
    readonly KartModern: any;
    readonly KartRetro: any;
    readonly KeyCard: any;
    readonly KeyPad: any;
    readonly KingOfTheCastle: any;
    readonly KingOfTheHill: any;
    readonly KingOfTheHillTeams: any;
    readonly LamarFamily: any;
    readonly Laptop: any;
    readonly LastTeamStanding: any;
    readonly LesterFamily: any;
    readonly LevelInside: any;
    readonly Limo: any;
    readonly Lower: any;
    readonly LowerAI: any;
    readonly MartinMadrazzo: any;
    readonly Maryann: any;
    readonly Mask: any;
    readonly MichaelFamily: any;
    readonly MichaelFamilyExile: any;
    readonly MichaelTrevorFamily: any;
    readonly MilitaryQuad: any;
    readonly MilitaryTruck: any;
    readonly Minigun2: any;
    readonly MiniSub: any;
    readonly Minute: any;
    readonly Mission1: any;
    readonly Mission1to2: any;
    readonly Mission2: any;
    readonly Mission2to12: any;
    readonly Mission2to16: any;
    readonly Mission2to4: any;
    readonly Mission2to8: any;
    readonly MissionBikers1: any;
    readonly MissionBikers1to2: any;
    readonly MissionBikers2: any;
    readonly MissionBikers2to12: any;
    readonly MissionBikers2to16: any;
    readonly MissionBikers2to4: any;
    readonly MissionBikers2to8: any;
    readonly MissionCops1: any;
    readonly MissionCops1to2: any;
    readonly MissionCops2: any;
    readonly MissionCops2to12: any;
    readonly MissionCops2to16: any;
    readonly MissionCops2to4: any;
    readonly MissionCops2to8: any;
    readonly MissionVagos1: any;
    readonly MissionVagos1to2: any;
    readonly MissionVagos2: any;
    readonly MissionVagos2to12: any;
    readonly MissionVagos2to16: any;
    readonly MissionVagos2to4: any;
    readonly MissionVagos2to8: any;
    readonly Monroe: any;
    readonly MovieCollectibles: any;
    readonly MPCrew: any;
    readonly MPFriend: any;
    readonly MPFriendlies: any;
    readonly MPHeist: any;
    readonly MPLamar: any;
    readonly MPNoise: any;
    readonly MusicStudio: any;
    readonly MusicVenue: any;
    readonly NetPlayer1AndNetPlayer2: any;
    readonly NetPlayer1AndNetPlayer3: any;
    readonly NhpBag: any;
    readonly NhpBase: any;
    readonly NhpCCTV: any;
    readonly NhpChest: any;
    readonly NhpMgFirewall: any;
    readonly NhpMgMirRotate: any;
    readonly NhpMgMirStatic: any;
    readonly NhpMgNode: any;
    readonly NhpMgProxy: any;
    readonly NhpOrbit: any;
    readonly NhpOverlay: any;
    readonly NhpStarterpack: any;
    readonly NhpTurret: any;
    readonly NhpTurretConsole: any;
    readonly NhpVeh1: any;
    readonly NhpWp1: any;
    readonly NhpWp2: any;
    readonly NhpWp3: any;
    readonly NhpWp4: any;
    readonly NhpWp5: any;
    readonly NhpWp6: any;
    readonly NhpWp7: any;
    readonly NhpWp8: any;
    readonly NhpWp9: any;
    readonly NiceHouseHeist: any;
    readonly North: any;
    readonly ObjectiveBlue: any;
    readonly ObjectiveGreen: any;
    readonly ObjectiveRed: any;
    readonly ObjectiveYellow: any;
    readonly Office: any;
    readonly OfficeForSale: any;
    readonly OffRoadRacing: any;
    readonly Omega: any;
    readonly OnMission: any;
    readonly OnMissionCops: any;
    readonly OnMissionLost: any;
    readonly OnMissionVagos: any;
    readonly Oppressor2: any;
    readonly OverlayJammed: any;
    readonly Package: any;
    readonly Packer: any;
    readonly Painting: any;
    readonly Paparazzo: any;
    readonly Parachute: any;
    readonly Passive: any;
    readonly Password: any;
    readonly Patriot3: any;
    readonly PatrolBoat: any;
    readonly Payphone: any;
    readonly PedE: any;
    readonly PedR: any;
    readonly PennedIn: any;
    readonly PickupAccelerator: any;
    readonly PickupArmoured: any;
    readonly PickupBeast: any;
    readonly PickupBomb: any;
    readonly PickupDeadline: any;
    readonly PickupDetonator: any;
    readonly PickupDtbBlastDecrease: any;
    readonly PickupDtbBlastIncrease: any;
    readonly PickupDtbBombDecrease: any;
    readonly PickupDtbBombIncrease: any;
    readonly PickupDtbHealth: any;
    readonly PickupGhost: any;
    readonly PickupHidden: any;
    readonly PickupHomingRocket: any;
    readonly PickupJump: any;
    readonly PickupMachinegun: any;
    readonly PickupParachute: any;
    readonly PickupRandom: any;
    readonly PickupRepair: any;
    readonly PickupRocketBoost: any;
    readonly PickupSlowTime: any;
    readonly PickupSwap: any;
    readonly PickupThermal: any;
    readonly PickupTime10: any;
    readonly PickupTime15: any;
    readonly PickupTime20: any;
    readonly PickupTime30: any;
    readonly PickupTime5: any;
    readonly PickupWeed: any;
    readonly PickupZoned: any;
    readonly Placeholder6: any;
    readonly Placeholder7: any;
    readonly Placeholder8: any;
    readonly Placeholder9: any;
    readonly PlaneDrop: any;
    readonly PlanningLocations: any;
    readonly PlayerBoat: any;
    readonly PlayerGunCar: any;
    readonly PlayerHeli: any;
    readonly PlayerJet: any;
    readonly PlayerKing: any;
    readonly PlayerPlane: any;
    readonly PlayerStateArrested: any;
    readonly PlayerStateCustody: any;
    readonly PlayerStateDriving: any;
    readonly PlayerStateKeyholder: any;
    readonly PlayerStatePartner: any;
    readonly PointOfInterest: any;
    readonly Police: any;
    readonly PoliceChase: any;
    readonly PoliceHeli: any;
    readonly PoliceHeliSpin: any;
    readonly PolicePed: any;
    readonly PolicePlaneMove: any;
    readonly PoliceStation: any;
    readonly PoliceStationBlue: any;
    readonly PoliceStationDropoff: any;
    readonly Pool: any;
    readonly PowerSwitch: any;
    readonly PrizeCar: any;
    readonly ProductionCrack: any;
    readonly ProductionFakeId: any;
    readonly ProductionMeth: any;
    readonly ProductionMoney: any;
    readonly ProductionWeed: any;
    readonly Property: any;
    readonly PropertyBunker: any;
    readonly PropertyForSale: any;
    readonly PropertyTakeover: any;
    readonly PropertyTakeoverBikers: any;
    readonly PropertyTakeoverCops: any;
    readonly PropertyTakeoverVagos: any;
    readonly PursuitSeries: any;
    readonly Quad: any;
    readonly Race: any;
    readonly RaceAir: any;
    readonly RaceBike: any;
    readonly Raceflag: any;
    readonly RaceFoot: any;
    readonly RaceLand: any;
    readonly RaceOpenWheel: any;
    readonly RaceOrganiser: any;
    readonly RaceSea: any;
    readonly RaceStunt: any;
    readonly RaceTf: any;
    readonly RaceWars: any;
    readonly Radius: any;
    readonly RadiusOutline: any;
    readonly Rampage: any;
    readonly RandomCharacter: any;
    readonly RandomFemale: any;
    readonly RandomMale: any;
    readonly Rappel: any;
    readonly RappelGear: any;
    readonly RappelPoint: any;
    readonly RCTank: any;
    readonly RCTimeTrials: any;
    readonly RegPapers: any;
    readonly Repair: any;
    readonly RetroSportsCar: any;
    readonly Rockets: any;
    readonly Ron: any;
    readonly Roulette0: any;
    readonly Roulette00: any;
    readonly Roulette1: any;
    readonly Roulette10: any;
    readonly Roulette11: any;
    readonly Roulette12: any;
    readonly Roulette13: any;
    readonly Roulette14: any;
    readonly Roulette15: any;
    readonly Roulette16: any;
    readonly Roulette17: any;
    readonly Roulette18: any;
    readonly Roulette19: any;
    readonly Roulette2: any;
    readonly Roulette20: any;
    readonly Roulette21: any;
    readonly Roulette22: any;
    readonly Roulette23: any;
    readonly Roulette24: any;
    readonly Roulette25: any;
    readonly Roulette26: any;
    readonly Roulette27: any;
    readonly Roulette28: any;
    readonly Roulette29: any;
    readonly Roulette3: any;
    readonly Roulette30: any;
    readonly Roulette31: any;
    readonly Roulette32: any;
    readonly Roulette33: any;
    readonly Roulette34: any;
    readonly Roulette35: any;
    readonly Roulette36: any;
    readonly Roulette4: any;
    readonly Roulette5: any;
    readonly Roulette6: any;
    readonly Roulette7: any;
    readonly Roulette8: any;
    readonly Roulette9: any;
    readonly Rp: any;
    readonly Rucksack: any;
    readonly RuralBankHeist: any;
    readonly Safe: any;
    readonly Safehouse: any;
    readonly ScubaGear: any;
    readonly Seashark: any;
    readonly Seasparrow2: any;
    readonly SecurityContract: any;
    readonly SecurityVan: any;
    readonly SecuroServ: any;
    readonly ShieldBikers: any;
    readonly ShieldCops: any;
    readonly ShieldVagos: any;
    readonly ShippingContainer: any;
    readonly ShipWheel: any;
    readonly ShootingRange: any;
    readonly ShootingRangeGunShop: any;
    readonly Shrink: any;
    readonly Sightseer: any;
    readonly SimeonFamily: any;
    readonly Slamvan2: any;
    readonly SmCargo: any;
    readonly SmHangar: any;
    readonly SmWp1: any;
    readonly SmWp10: any;
    readonly SmWp11: any;
    readonly SmWp12: any;
    readonly SmWp13: any;
    readonly SmWp14: any;
    readonly SmWp2: any;
    readonly SmWp3: any;
    readonly SmWp4: any;
    readonly SmWp5: any;
    readonly SmWp6: any;
    readonly SmWp7: any;
    readonly SmWp8: any;
    readonly SmWp9: any;
    readonly Snitch: any;
    readonly SnitchRed: any;
    readonly SnowTruck: any;
    readonly SolomonStrand: any;
    readonly SpawnPointPickup: any;
    readonly Spikes: any;
    readonly SportsCar: any;
    readonly Squadee: any;
    readonly Stairs: any;
    readonly SteeringWheel: any;
    readonly Stinger: any;
    readonly StreetRaceSeries: any;
    readonly StripClub: any;
    readonly Stunt: any;
    readonly StuntPremium: any;
    readonly Sub: any;
    readonly Sub2: any;
    readonly SubControls: any;
    readonly Submarine: any;
    readonly SubMissile: any;
    readonly SubPeriscope: any;
    readonly Supplies: any;
    readonly SuvService: any;
    readonly SwapCar: any;
    readonly Tank: any;
    readonly TargetA: any;
    readonly TargetB: any;
    readonly TargetC: any;
    readonly TargetD: any;
    readonly TargetE: any;
    readonly TargetF: any;
    readonly TargetG: any;
    readonly TargetH: any;
    readonly Tattoo: any;
    readonly Taxi: any;
    readonly TeamDeathmatch: any;
    readonly Temp1: any;
    readonly Temp2: any;
    readonly Temp3: any;
    readonly Temp4: any;
    readonly Temp5: any;
    readonly Temp6: any;
    readonly Tennis: any;
    readonly TerritoryLocked: any;
    readonly TestCar: any;
    readonly Testosterone: any;
    readonly TfCheckpoint: any;
    readonly Tonya: any;
    readonly Tow: any;
    readonly TowTruck: any;
    readonly Trailer: any;
    readonly TrailerRamp: any;
    readonly Train: any;
    readonly TrevorFamily: any;
    readonly TrevorFamilyExile: any;
    readonly TrevorFamilyGrey: any;
    readonly TrevorFamilyRed: any;
    readonly Triathlon: any;
    readonly TriathlonCycling: any;
    readonly TriathlonSwimming: any;
    readonly Trophy: any;
    readonly Truck: any;
    readonly TurretedLimo: any;
    readonly UFO: any;
    readonly UgcMission: any;
    readonly UnderwaterGate: any;
    readonly UrbanWarfareVersus: any;
    readonly UsingMenu: any;
    readonly Valkyrie2: any;
    readonly VanKeys: any;
    readonly VehicleDeathmatch: any;
    readonly VehicleForSale: any;
    readonly VinewoodTours: any;
    readonly VIP: any;
    readonly WantedRadius: any;
    readonly Warehouse: any;
    readonly WarehouseForSale: any;
    readonly WarehouseVehicle: any;
    readonly Waypoint: any;
    readonly WeaponAlien: any;
    readonly WeaponArmour: any;
    readonly WeaponAssaultRifle: any;
    readonly WeaponBat: any;
    readonly WeaponGrenade: any;
    readonly WeaponHealth: any;
    readonly WeaponHigher: any;
    readonly WeaponJerrycan: any;
    readonly WeaponKnife: any;
    readonly WeaponLives: any;
    readonly WeaponLower: any;
    readonly WeaponMinigun: any;
    readonly WeaponMolotov: any;
    readonly WeaponPistol: any;
    readonly WeaponRailgun: any;
    readonly WeaponRocket: any;
    readonly WeaponShotgun: any;
    readonly WeaponSmg: any;
    readonly WeaponSniper: any;
    readonly WeedStash: any;
    readonly Winky: any;
    readonly Yacht: any;
    readonly YachtLocation: any;
    readonly Yoga: any;
    readonly Zhaba: any;
    readonly Ztype: any;
};

export const BlipType: {
    readonly Area: any;
    readonly Cont: any;
    readonly Cop: any;
    readonly Destination: any;
    readonly Gallery: any;
    readonly Object: any;
    readonly Ped: any;
    readonly Pickup: any;
    readonly PickupObject: any;
    readonly PickupUnk: any;
    readonly Radius: any;
    readonly Vehicle: any;
};

export const BodyPart: {
    readonly Chest: any;
    readonly Head: any;
    readonly LeftElbow: any;
    readonly LeftFoot: any;
    readonly LeftHip: any;
    readonly LeftLeg: any;
    readonly LeftShoulder: any;
    readonly LeftUpperArm: any;
    readonly LeftWrist: any;
    readonly LowerTorso: any;
    readonly Neck: any;
    readonly Pelvis: any;
    readonly RightElbow: any;
    readonly RightFoot: any;
    readonly RightHip: any;
    readonly RightLeg: any;
    readonly RightShoulder: any;
    readonly RightUpperArm: any;
    readonly RightWrist: any;
    readonly UnderNeck: any;
    readonly Unknown: any;
    readonly UpperTorso: any;
};

export class Checkpoint {
    /** Creates a GTA checkpoint only for this client, in dimension 0; it exists while the local player is within `streamingDistance` metres (300 by default). Defaults: `nextPos` = `pos`, radius 0, height 0, colour 255, 255, 255, 255, icon colour = colour; channels are clamped to 0–255. */
    constructor(type: number, pos: Vector3Like, nextPos?: Vector3Like, radius?: number, height?: number, color?: { r: number; g: number; b: number; a?: number }, iconColor?: { r: number; g: number; b: number; a?: number }, streamingDistance?: number);
    /** The server's checkpoints this client has, as plain objects with fewer members (drawn as cylinder markers, so without nextPos and iconColor, and only the server destroys them; assigning their pos, dimension, radius, height, color, visible or checkpointType changes them for this client only), then the local checkpoints of every resource. A new array on each read. */
    static readonly all: Array<Checkpoint | { type: 8; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; checkpointType: number; radius: number; height: number; color: { r: number; g: number; b: number; a: number }; streamingDistance: number; visible: boolean; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean; getMeta(key: string): unknown; hasMeta(key: string): boolean; getMetaDataKeys(): string[]; setMeta(key: string, value: unknown): void; setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[]; getStreamSyncedMeta(key: string): unknown; hasStreamSyncedMeta(key: string): boolean; getStreamSyncedMetaKeys(): string[] }>;
    /** How many checkpoints Checkpoint.all holds. */
    static readonly count: number;
    /** A local checkpoint by its id (negative), else the server's by its id; null for none. */
    static get(id: number): Checkpoint | { type: 8; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; checkpointType: number; radius: number; height: number; color: { r: number; g: number; b: number; a: number }; streamingDistance: number; visible: boolean; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean; getMeta(key: string): unknown; hasMeta(key: string): boolean; getMetaDataKeys(): string[]; setMeta(key: string, value: unknown): void; setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[]; getStreamSyncedMeta(key: string): unknown; hasStreamSyncedMeta(key: string): boolean; getStreamSyncedMetaKeys(): string[] } | null;
    /** The same as Checkpoint.get. */
    static getByID(id: number): Checkpoint | { type: 8; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; checkpointType: number; radius: number; height: number; color: { r: number; g: number; b: number; a: number }; streamingDistance: number; visible: boolean; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean; getMeta(key: string): unknown; hasMeta(key: string): boolean; getMetaDataKeys(): string[]; setMeta(key: string, value: unknown): void; setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[]; getStreamSyncedMeta(key: string): unknown; hasStreamSyncedMeta(key: string): boolean; getStreamSyncedMetaKeys(): string[] } | null;
    /** The server's checkpoint with that id, as a plain object; null for none (local checkpoints are not searched). */
    static getByRemoteID(id: number): { type: 8; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; checkpointType: number; radius: number; height: number; color: { r: number; g: number; b: number; a: number }; streamingDistance: number; visible: boolean; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean; getMeta(key: string): unknown; hasMeta(key: string): boolean; getMetaDataKeys(): string[]; setMeta(key: string, value: unknown): void; setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[]; getStreamSyncedMeta(key: string): unknown; hasStreamSyncedMeta(key: string): boolean; getStreamSyncedMetaKeys(): string[] } | null;
    /** The local checkpoint with this GTA handle; null for 0 and for none. The server's checkpoints have no GTA checkpoint (their scriptID is 0). */
    static getByScriptID(scriptID: number): Checkpoint | { type: 8; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; checkpointType: number; radius: number; height: number; color: { r: number; g: number; b: number; a: number }; streamingDistance: number; visible: boolean; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean; getMeta(key: string): unknown; hasMeta(key: string): boolean; getMetaDataKeys(): string[]; setMeta(key: string, value: unknown): void; setMeta(values: Record<string, unknown>): void; deleteMeta(key: string): void; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[]; getStreamSyncedMeta(key: string): unknown; hasStreamSyncedMeta(key: string): boolean; getStreamSyncedMetaKeys(): string[] } | null;
    /** GTA's checkpoint type (CheckpointType), truncated, 0 by default; assigning makes the GTA checkpoint again. On the server's checkpoint, assigning changes the type in this client's copy (sent as checkpointType), which draws it as a cylinder marker whatever its type. */
    checkpointType: number;
    /** Colour (SET_CHECKPOINT_RGBA), white by default; each component is clamped to 0..255, and a missing one keeps its value on assigning. On the server's checkpoint, assigning recolours it for this client only, unclamped. */
    get color(): { r: number; g: number; b: number; a: number };
    set color(value: { r?: number; g?: number; b?: number; a?: number });
    /** Removes the key from the checkpoint's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Deletes the GTA checkpoint (DELETE_CHECKPOINT): valid turns false and baseObjectRemove fires; later calls do nothing. A resource's checkpoints are destroyed when it stops, and the server's ones have no destroy. */
    destroy(): void;
    /** The dimension it exists in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. On the server's checkpoint, assigning moves it for this client only. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the checkpoint's own metadata on this client (on the server's checkpoint, until the server removes it). */
    getMeta(key: string): unknown;
    /** The keys of the checkpoint's own metadata (setMeta). */
    getMetaDataKeys(): string[];
    /** Whether the checkpoint's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Height of the cylinder in metres, at least 0 (SET_CHECKPOINT_CYLINDER_HEIGHT); isPointIn counts from pos.z up to pos.z + height. On the server's checkpoint, assigning changes it for this client only. */
    height: number;
    /** Colour of the icon (SET_CHECKPOINT_RGBA2), the colour by default; each component is clamped to 0..255, and a missing one keeps its value on assigning. Only local checkpoints have it. */
    get iconColor(): { r: number; g: number; b: number; a: number };
    set iconColor(value: { r?: number; g?: number; b?: number; a?: number });
    /** A local checkpoint's id is negative and unique on this client; the server's checkpoints have the server's id. */
    readonly id: number;
    /** Whether a valid entity stands inside it (isPointIn of its pos) in a matching dimension: the checkpoint's must equal the entity's unless it is -2147483648. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number }): boolean;
    /** Whether the point is within radius of pos horizontally and between pos.z and pos.z + height; false for a destroyed local checkpoint. */
    isPointIn(point: Vector3Like): boolean;
    /** False for a local checkpoint; the server's checkpoints read true. */
    readonly isRemote: boolean;
    /** True while GTA has the checkpoint: visible, in the local player's dimension and within streamingDistance of the local player. The server's checkpoint: while the client draws it, visible, in the local player's dimension and within streamingDistance (0: at any distance). */
    readonly isStreamedIn: boolean;
    /** The point its arrow faces (SET_CHECKPOINT_DIRECTION), a copy, pos by default; on assigning a missing or non-numeric component keeps its value. Only local checkpoints have it. */
    get nextPos(): Vector3Like;
    set nextPos(value: Partial<Vector3Like>);
    /** Its position, a copy; assigning makes the GTA checkpoint again there, a missing or non-numeric component keeping its value. On the server's checkpoint, assigning moves it for this client only. */
    get pos(): Vector3Like;
    set pos(value: Partial<Vector3Like>);
    /** Radius in metres, at least 0 (SET_CHECKPOINT_CYLINDER_HEIGHT); isPointIn uses it. On the server's checkpoint, assigning changes it for this client only. */
    radius: number;
    /** The server's id of a checkpoint of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** 0 for a local checkpoint; the server's checkpoints read their id, as remoteId. */
    readonly remoteID: number;
    /** GTA's handle of the checkpoint; 0 while GTA does not have it (hidden, another dimension, out of range, destroyed). Always 0 on the server's checkpoints, which are drawn as markers. */
    readonly scriptID: number;
    /** Stores the value under the key in the checkpoint's own metadata on this client and fires metaChange (checkpoint, key, value, old value); an object sets each of its entries. On the server's checkpoint the metadata goes when the server removes it. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Distance in metres from the local player within which GTA has the checkpoint: as given to the constructor, at least 1, 300 by default. On the server's checkpoint 0 draws it at any distance. */
    readonly streamingDistance: number;
    /** BaseObjectType.Checkpoint (8). */
    readonly type: 8;
    /** True until destroy() or the stop of its resource. The server's checkpoints are valid while this client keeps them. */
    readonly valid: boolean;
    /** Whether it is shown, true by default; a hidden local checkpoint has no GTA checkpoint. On the server's checkpoint, assigning hides it for this client only. */
    visible: boolean;
    /** Resolves once GTA has the checkpoint; rejects with the error of CREATE_CHECKPOINT, or with "checkpoint is outside its streaming range" when it is not made (hidden, another dimension, out of range). Only local checkpoints have it. */
    waitForSpawn(): Promise<void>;
}

export const CheckpointType: {
    readonly Checkerboard: any;
    readonly CycleArrow: any;
    readonly Cylinder: any;
    readonly Cylinder1: any;
    readonly Cylinder2: any;
    readonly Cylinder3: any;
    readonly Cylinder4: any;
    readonly Cylinder5: any;
    readonly CylinderCheckerboard: any;
    readonly CylinderCheckerboard2: any;
    readonly CylinderCheckerboard3: any;
    readonly CylinderCheckerboard4: any;
    readonly CylinderCheckerboard5: any;
    readonly CylinderCycleArrow: any;
    readonly CylinderCycleArrow2: any;
    readonly CylinderCycleArrow3: any;
    readonly CylinderCycleArrow4: any;
    readonly CylinderCycleArrow5: any;
    readonly CylinderDoubleArrow: any;
    readonly CylinderDoubleArrow2: any;
    readonly CylinderDoubleArrow3: any;
    readonly CylinderDoubleArrow4: any;
    readonly CylinderDoubleArrow5: any;
    readonly CylinderSingleArrow: any;
    readonly CylinderSingleArrow2: any;
    readonly CylinderSingleArrow3: any;
    readonly CylinderSingleArrow4: any;
    readonly CylinderSingleArrow5: any;
    readonly CylinderTripleArrow: any;
    readonly CylinderTripleArrow2: any;
    readonly CylinderTripleArrow3: any;
    readonly CylinderTripleArrow4: any;
    readonly CylinderTripleArrow5: any;
    readonly CylinderWrench: any;
    readonly CylinderWrench2: any;
    readonly DoubleArrow: any;
    readonly Empty: any;
    readonly Empty2: any;
    readonly Empty3: any;
    readonly Empty4: any;
    readonly Empty5: any;
    readonly Empty6: any;
    readonly Ring: any;
    readonly RingBicycle: any;
    readonly RingBike: any;
    readonly RingBoat: any;
    readonly RingCar: any;
    readonly RingCheckerboard: any;
    readonly RingChopper: any;
    readonly RingCycleArrow: any;
    readonly RingDollar: any;
    readonly RingDoubleArrow: any;
    readonly RingJetpack: any;
    readonly RingParachute: any;
    readonly RingPlane: any;
    readonly RingPlaneDown: any;
    readonly RingPlaneLeft: any;
    readonly RingPlaneRight: any;
    readonly RingPlaneUp: any;
    readonly RingQuestionMark: any;
    readonly RingSingleArrow: any;
    readonly RingTripleArrow: any;
    readonly RingTruck: any;
    readonly RingWhirl: any;
    readonly RingWolf: any;
    readonly SingleArrow: any;
    readonly TripleArrow: any;
};

export class ColShape {
    /** Base class of the colshapes this client creates (ColshapeSphere, ColshapeCylinder, ColshapeCircle, ColshapeCuboid, ColshapeRectangle, ColshapePolygon); `Colshape` is the same class, and `new ColShape()` throws a TypeError. `ColShape.all`, `ColShape.get(id)` and `ColShape.getByRemoteID(id)` also give the server's colshapes, which answer `instanceof` with ColShape and the class of their kind. */
    private constructor();
    /** The server's colshapes this client has, as read-only plain objects, then the local colshapes of every resource and kind. A new array on each read; ColShape and Colshape are one class. */
    static readonly all: Array<ColShape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many colshapes ColShape.all holds. */
    static readonly count: number;
    /** A local colshape by its id (negative), else the server's by its id; null for none. */
    static get(id: number): ColShape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColShape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's colshape with that id, as a read-only plain object; null for none (local colshapes are not searched). */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Its shape as ColShapeType: Sphere 0, Cylinder 1, Circle 2, Cuboid 3, Rectangle 4, Polygon 6. */
    readonly colshapeType: number;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. Only local colshapes have it. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops, and the server's ones have no destroy. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. Read-only on the server's colshapes. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. Only local colshapes have it. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. Only local colshapes have it. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. Only local colshapes have it. */
    getMetaKeys(): string[];
    /** Half the size on each axis of a cuboid or rectangle (z 0), a copy; {0, 0, 0} for other kinds. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. Only local colshapes have it. */
    hasMeta(key: string): boolean;
    /** A cylinder's height in metres from pos.z up; 0 for other kinds. */
    readonly height: number;
    /** A local colshape's id is negative and unique on this client; the server's colshapes have the server's id. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point is inside: a sphere in 3D, a cylinder from pos.z up to pos.z + height, a circle or rectangle at any height, a cuboid by halfExtents, a polygon between minZ and maxZ. False for a destroyed local colshape. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false for a local colshape; the server's ones read true. */
    readonly isRemote: false;
    /** Its shape as text: "sphere", "cylinder", "circle", "box" (a cuboid), "rectangle" or "polygon". */
    readonly kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon";
    /** The corner of its bounding box with the largest coordinates, a copy: for a sphere, pos plus the radius on each axis; for a cylinder, x and y plus the radius and z pos.z + height; for a circle, x and y plus the radius and z 0; the corner of a cuboid or a rectangle (z 0); for a polygon, the largest x and y of its corners and z maxZ. */
    readonly max: Vector3Like;
    /** The top of a polygon's height range; 0 for other kinds. */
    readonly maxZ: number;
    /** The corner of its bounding box with the smallest coordinates, a copy: for a sphere, pos minus the radius on each axis; for a cylinder, x and y minus the radius and z pos.z; for a circle, x and y minus the radius and z 0; the corner of a cuboid or a rectangle (z 0); for a polygon, the smallest x and y of its corners and z minZ. */
    readonly min: Vector3Like;
    /** The bottom of a polygon's height range; 0 for other kinds. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default; a server's colshape reads the flag the server gave it. The runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** A polygon's corners as {x, y}; [] for other kinds. */
    readonly points: Vector2Like[];
    /** Its centre, a copy: of a sphere or circle (z 0), the base of a cylinder, the middle of a cuboid or rectangle (z 0) or of a polygon's bounding box. Read-only. */
    readonly pos: Vector3Like;
    /** Radius in metres of a sphere, cylinder or circle (a negative one becomes 0); 0 for other kinds. */
    readonly radius: number;
    /** Always 0 for a local colshape; the server's ones have their id here. */
    readonly remoteId: 0;
    /** Always 0 for a local colshape; the server's ones have their id here. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. Only local colshapes have it. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. The server's colshapes are valid while this client keeps them. */
    readonly valid: boolean;
}

export const ColShapeType: {
    readonly CheckpointCylinder: any;
    readonly Circle: any;
    readonly Cuboid: any;
    readonly Cylinder: any;
    readonly Polygon: any;
    readonly Rectangle: any;
    readonly Sphere: any;
};

export class Colshape {
    /** Base class of the colshapes this client creates (ColshapeSphere, ColshapeCylinder, ColshapeCircle, ColshapeCuboid, ColshapeRectangle, ColshapePolygon); `ColShape` is the same class, and `new Colshape()` throws a TypeError. `Colshape.all`, `Colshape.get(id)` and `Colshape.getByRemoteID(id)` also give the server's colshapes, which answer `instanceof` with Colshape and the class of their kind. */
    private constructor();
    /** The server's colshapes this client has, as read-only plain objects, then the local colshapes of every resource and kind. A new array on each read; ColShape and Colshape are one class. */
    static readonly all: Array<Colshape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many colshapes ColShape.all holds. */
    static readonly count: number;
    /** A local colshape by its id (negative), else the server's by its id; null for none. */
    static get(id: number): Colshape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): Colshape | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's colshape with that id, as a read-only plain object; null for none (local colshapes are not searched). */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Its shape as ColShapeType: Sphere 0, Cylinder 1, Circle 2, Cuboid 3, Rectangle 4, Polygon 6. */
    readonly colshapeType: number;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. Only local colshapes have it. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops, and the server's ones have no destroy. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. Read-only on the server's colshapes. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. Only local colshapes have it. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. Only local colshapes have it. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. Only local colshapes have it. */
    getMetaKeys(): string[];
    /** Half the size on each axis of a cuboid or rectangle (z 0), a copy; {0, 0, 0} for other kinds. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. Only local colshapes have it. */
    hasMeta(key: string): boolean;
    /** A cylinder's height in metres from pos.z up; 0 for other kinds. */
    readonly height: number;
    /** A local colshape's id is negative and unique on this client; the server's colshapes have the server's id. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point is inside: a sphere in 3D, a cylinder from pos.z up to pos.z + height, a circle or rectangle at any height, a cuboid by halfExtents, a polygon between minZ and maxZ. False for a destroyed local colshape. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false for a local colshape; the server's ones read true. */
    readonly isRemote: false;
    /** Its shape as text: "sphere", "cylinder", "circle", "box" (a cuboid), "rectangle" or "polygon". */
    readonly kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon";
    /** The corner of its bounding box with the largest coordinates, a copy: for a sphere, pos plus the radius on each axis; for a cylinder, x and y plus the radius and z pos.z + height; for a circle, x and y plus the radius and z 0; the corner of a cuboid or a rectangle (z 0); for a polygon, the largest x and y of its corners and z maxZ. */
    readonly max: Vector3Like;
    /** The top of a polygon's height range; 0 for other kinds. */
    readonly maxZ: number;
    /** The corner of its bounding box with the smallest coordinates, a copy: for a sphere, pos minus the radius on each axis; for a cylinder, x and y minus the radius and z pos.z; for a circle, x and y minus the radius and z 0; the corner of a cuboid or a rectangle (z 0); for a polygon, the smallest x and y of its corners and z minZ. */
    readonly min: Vector3Like;
    /** The bottom of a polygon's height range; 0 for other kinds. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default; a server's colshape reads the flag the server gave it. The runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** A polygon's corners as {x, y}; [] for other kinds. */
    readonly points: Vector2Like[];
    /** Its centre, a copy: of a sphere or circle (z 0), the base of a cylinder, the middle of a cuboid or rectangle (z 0) or of a polygon's bounding box. Read-only. */
    readonly pos: Vector3Like;
    /** Radius in metres of a sphere, cylinder or circle (a negative one becomes 0); 0 for other kinds. */
    readonly radius: number;
    /** Always 0 for a local colshape; the server's ones have their id here. */
    readonly remoteId: 0;
    /** Always 0 for a local colshape; the server's ones have their id here. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. Only local colshapes have it. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. The server's colshapes are valid while this client keeps them. */
    readonly valid: boolean;
}

export class ColshapeCircle {
    /** Creates a circle colshape of `radius` metres around x, y at any height, only for this client, in dimension 0; the client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. There are no defaults: a missing or negative radius is 0 and a missing coordinate leaves the shape empty. */
    constructor(x: number, y: number, radius: number);
    /** The circles: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapeCircle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many circles ColshapeCircle.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapeCircle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapeCircle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's circle with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Circle (2). */
    readonly colshapeType: 2;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always {0, 0, 0}: only a cuboid or rectangle has half extents. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always 0: only a cylinder has a height. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies within radius of pos horizontally, at any height; false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "circle". */
    readonly kind: "circle";
    /** The largest corner of the circle's bounding box, a copy: x and y plus the radius, z 0. */
    readonly max: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly maxZ: number;
    /** The smallest corner of the circle's bounding box, a copy: x and y minus the radius, z 0. */
    readonly min: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Always []: only a polygon has points. */
    readonly points: Vector2Like[];
    /** The circle's centre, a copy; z is always 0. */
    readonly pos: Vector3Like;
    /** The circle's radius in metres, as given; a negative one becomes 0. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export class ColshapeCuboid {
    /** Creates a box colshape between two opposite corners given in any order, only for this client, in dimension 0; the client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. There are no defaults: a missing coordinate leaves the shape empty. */
    constructor(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number);
    /** The cuboids: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapeCuboid | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many cuboids ColshapeCuboid.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapeCuboid | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapeCuboid | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's cuboid with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Cuboid (3). */
    readonly colshapeType: 3;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Half the box's size on each axis, a copy. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always 0: only a cylinder has a height. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies within halfExtents of pos on every axis; false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "box". */
    readonly kind: "box";
    /** The box's corner with the largest coordinates, a copy. */
    readonly max: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly maxZ: number;
    /** The box's corner with the smallest coordinates, a copy. */
    readonly min: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Always []: only a polygon has points. */
    readonly points: Vector2Like[];
    /** The middle of the box, a copy. */
    readonly pos: Vector3Like;
    /** Always 0: a cuboid has no radius. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export class ColshapeCylinder {
    /** Creates a cylinder colshape of `radius` metres around x, y, from z up to z + `height`, only for this client, in dimension 0; the client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. There are no defaults: a missing or negative size is 0 and a missing coordinate leaves the shape empty. */
    constructor(x: number, y: number, z: number, radius: number, height: number);
    /** The cylinders: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapeCylinder | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many cylinders ColshapeCylinder.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapeCylinder | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapeCylinder | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's cylinder with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Cylinder (1). */
    readonly colshapeType: 1;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always {0, 0, 0}: only a cuboid or rectangle has half extents. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Height in metres from pos.z up, as given; a negative one becomes 0. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies within radius of pos horizontally and between pos.z and pos.z + height; false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "cylinder". */
    readonly kind: "cylinder";
    /** The largest corner of the cylinder's bounding box, a copy: x and y plus the radius, z pos.z + height. */
    readonly max: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly maxZ: number;
    /** The smallest corner of the cylinder's bounding box, a copy: x and y minus the radius, z pos.z. */
    readonly min: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Always []: only a polygon has points. */
    readonly points: Vector2Like[];
    /** The centre of the cylinder's base, a copy; it reaches up from there by height. */
    readonly pos: Vector3Like;
    /** The cylinder's radius in metres, as given; a negative one becomes 0. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export class ColshapePolygon {
    /** Creates a polygon colshape from its corners (objects with x, y, or a flat list x1, y1, x2, y2, … as the server takes them) between `minZ` and `maxZ` given in any order, only for this client, in dimension 0; non-numeric values count as 0, an odd last number is dropped, and fewer than 3 corners contain nothing. The client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(minZ: number, maxZ: number, points: Vector2Like[]);
    constructor(minZ: number, maxZ: number, points: number[]);
    /** The polygons: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapePolygon | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many polygons ColshapePolygon.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapePolygon | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapePolygon | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's polygon with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Polygon (6). */
    readonly colshapeType: 6;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always {0, 0, 0}: only a cuboid or rectangle has half extents. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always 0: only a cylinder has a height. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies between minZ and maxZ and inside the polygon (even-odd rule; fewer than 3 points contain nothing); false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "polygon". */
    readonly kind: "polygon";
    /** The largest x and y of its points, with maxZ; a copy. */
    readonly max: Vector3Like;
    /** The top of the height range: the larger of the two heights given. */
    readonly maxZ: number;
    /** The smallest x and y of its points, with minZ; a copy. */
    readonly min: Vector3Like;
    /** The bottom of the height range: the smaller of the two heights given. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Its corners as {x, y} copies; a non-numeric value became 0. */
    readonly points: Vector2Like[];
    /** The middle of the polygon's bounding box, z halfway between minZ and maxZ; a copy. */
    readonly pos: Vector3Like;
    /** Always 0: a polygon has no radius. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export class ColshapeRectangle {
    /** Creates a rectangle colshape between two opposite corners given in any order, at any height, only for this client, in dimension 0; the client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. There are no defaults: a missing coordinate leaves the shape empty. */
    constructor(x1: number, y1: number, x2: number, y2: number);
    /** The rectangles: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapeRectangle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many rectangles ColshapeRectangle.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapeRectangle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapeRectangle | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's rectangle with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Rectangle (4). */
    readonly colshapeType: 4;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Half the rectangle's size on x and y, a copy; z is 0. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always 0: only a cylinder has a height. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies within halfExtents of pos on x and y, at any height; false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "rectangle". */
    readonly kind: "rectangle";
    /** The rectangle's corner with the largest x and y, a copy; z is 0. */
    readonly max: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly maxZ: number;
    /** The rectangle's corner with the smallest x and y, a copy; z is 0. */
    readonly min: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Always []: only a polygon has points. */
    readonly points: Vector2Like[];
    /** The middle of the rectangle, a copy; z is always 0. */
    readonly pos: Vector3Like;
    /** Always 0: a rectangle has no radius. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export class ColshapeSphere {
    /** Creates a sphere colshape of `radius` metres around x, y, z, only for this client, in dimension 0; the client checks the local player alone and raises `entityEnterColshape`/`entityLeaveColshape`. There are no defaults: a missing or negative radius is 0 and a missing coordinate leaves the shape empty. */
    constructor(x: number, y: number, z: number, radius: number);
    /** The spheres: the server's ones (as read-only plain objects) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<ColshapeSphere | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many spheres ColshapeSphere.all holds. */
    static readonly count: number;
    /** As ColShape.get, but null for a colshape of another kind. */
    static get(id: number): ColshapeSphere | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as get. */
    static getByID(id: number): ColshapeSphere | { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's sphere with that id, as a read-only plain object; null for none and for a colshape of another kind. */
    static getByRemoteID(id: number): { type: 7; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; pos: Vector3Like; dimension: number; kind: "sphere" | "cylinder" | "circle" | "box" | "rectangle" | "polygon"; colshapeType: number; playersOnly: boolean; radius: number; height: number; halfExtents: Vector3Like; min: Vector3Like; max: Vector3Like; points: Vector2Like[]; minZ: number; maxZ: number; isPointIn(point: Vector3Like): boolean; isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Always ColShapeType.Sphere (0). */
    readonly colshapeType: 0;
    /** Removes the key from the colshape's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the colshape: valid turns false, baseObjectRemove fires and enter and leave events stop (a player inside gets no leave); later calls do nothing. A resource's colshapes are destroyed when it stops. */
    destroy(): void;
    /** The dimension it works in: an entity's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. The local player's enter and leave events follow it. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: the colshape's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the colshape's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always {0, 0, 0}: only a cuboid or rectangle has half extents. */
    readonly halfExtents: Vector3Like;
    /** Whether the colshape's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always 0: only a cylinder has a height. */
    readonly height: number;
    /** Negative (-1, -2 ...), unique among this client's local colshapes. */
    readonly id: number;
    /** Whether a valid entity in a matching dimension is inside (isPointIn of its pos): the colshape's dimension must equal the entity's unless it is -2147483648, and with playersOnly only players count. A number is taken as an entity id: the server's player, vehicle, ped, object or virtual entity with that id, or a local entity by its negative id. The server's colshapes answer the same way. */
    isEntityIn(entity: { valid: boolean; pos: Vector3Like; dimension?: number; type?: number } | number): boolean;
    /** Whether the point lies within radius of pos in 3D; false once destroyed. */
    isPointIn(point: Vector3Like): boolean;
    /** Always false: the colshape is local. */
    readonly isRemote: false;
    /** Always "sphere". */
    readonly kind: "sphere";
    /** The largest corner of the sphere's bounding box, a copy: pos plus the radius on each axis. */
    readonly max: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly maxZ: number;
    /** The smallest corner of the sphere's bounding box, a copy: pos minus the radius on each axis. */
    readonly min: Vector3Like;
    /** Always 0: only a polygon has a height range. */
    readonly minZ: number;
    /** Whether isEntityIn counts players only, false by default for a local colshape; the runtime's own enter and leave events check the local player anyway. */
    playersOnly: boolean;
    /** Always []: only a polygon has points. */
    readonly points: Vector2Like[];
    /** The sphere's centre, a copy. */
    readonly pos: Vector3Like;
    /** The sphere's radius in metres, as given; a negative one becomes 0. */
    readonly radius: number;
    /** Always 0: a local colshape has no server id. */
    readonly remoteId: 0;
    /** Always 0: a local colshape has no server id. */
    readonly remoteID: 0;
    /** Stores the value under the key in the colshape's own metadata on this client and fires metaChange (colshape, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** BaseObjectType.ColShape (7). */
    readonly type: 7;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
}

export const ConfigFlag: {
    readonly DisableAutoWeaponSwap: any;
    readonly DisableEmissiveLightsRendering: any;
    readonly DisableIdleCamera: any;
    readonly DisablePedPropKnockOff: any;
    readonly DisableSPEnterVehicleClipset: any;
    readonly DisableVehicleEngineShutdownOnLeave: any;
    readonly ForceHideNightProps: any;
    readonly ForceRenderSnow: any;
    readonly ForceShowNightProps: any;
    readonly ForceVehicleTyreBurst: any;
    readonly SwapAllowHeadPropInVehicleFlag: any;
};

export const CookiePriority: {
    readonly High: any;
    readonly Low: any;
    readonly Medium: any;
};

export const CookieSameSite: {
    readonly LaxMode: any;
    readonly NoRestriction: any;
    readonly StrictMode: any;
};

export const Discord: {
    /** The Discord user's avatar hash as Discord reports it, not a URL; empty while Discord is not connected. */
    readonly avatar: string;
    /** Clears this player's Discord activity, in the Discord app too: getActivity() then reads null and discord:activityCleared fires. */
    clearActivity(): void;
    /** A copy of the user of the Discord app on this PC, the id as a string; null while Discord is not connected. */
    readonly currentUser: DiscordUser | null;
    /** The Discord user's discriminator; empty while Discord is not connected. */
    readonly discriminator: string;
    /** A copy of the activity last set, every field filled in (one saved by an earlier run counts); null after clearActivity or when none was set. */
    getActivity(): DiscordActivityOptions | null;
    /** The same as ready: true while the client is connected to the Discord app with a user. */
    readonly isReady: boolean;
    /** True while the client is connected to the Discord app on this PC with a user (currentUser is set). The launcher does not pass the Discord application id, so on a player's PC it stays false. */
    readonly ready: boolean;
    /** Sets this player's activity, sent to the Discord app when connected, and fires discord:activityUpdate with it; missing fields become empty or 0 and name stands in for details. Timestamps may be in seconds or milliseconds. */
    updateActivity(options: DiscordActivityOptions): void;
    /** Discord snowflake as a string. Empty when disconnected; never convert it to a JavaScript number. */
    readonly userID: string;
    /** The Discord user's name; empty while Discord is not connected. */
    readonly userName: string;
};

export class Entity {
    /** Only a base class for `instanceof`: players (`varion.Player.local` among them), vehicles, peds, objects and local entities extend it. Entities come from `Entity.getByID`, `Player.all`, `Vehicle.all` and the like, from events, and from the LocalObject, LocalPed and LocalVehicle constructors. */
    private constructor();
    /** Every entity this client knows, as new objects on each read: the local player once it has an id, the other players, the old-path vehicles, peds and objects (streamed in or not), the native vehicles and NPCs its GTA has now, and the local entities not destroyed. Virtual entities are not included. */
    static readonly all: Array<PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | LocalVehicle | LocalPed | LocalObject>;
    /** The entity of that BaseObjectType by its server id, through that class's get: Player (0), Vehicle (1), Ped (2), Object (3) or VirtualEntity (9); null for any other type or an id this client does not know. Local entities are not found. */
    static getByID(type: number, id: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | null;
    /** The same as Entity.getByID: on the client the remote id is the server id. On a class with a lookup of its own (LocalVehicle, LocalPed, LocalObject, WebSocketClient) it takes the id alone and finds that class's object whose remoteId it is. */
    static getByRemoteID(type: number, remoteId: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | null;
    /** The entity whose GTA handle this is: the local player; a player, old-path vehicle, object or ped the server streams to this client; a local entity not destroyed; or a native vehicle or NPC. null for 0 or below and for any other handle. */
    static getByScriptID(scriptID: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | LocalVehicle | LocalPed | LocalObject | null;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Whether collision is on: for a player or a server entity, the server's setting as this client last got it (true when none was sent); a local entity's own setting (true at creation), which assigning applies in this client's GTA. */
    readonly collision: boolean;
    /** Deletes its GTA entity on this client (DELETE_ENTITY) and resolves true once that ran; false when it has no GTA entity here, when it is a player's ped, the local one included (a warning is logged), or when GTA refused. The server is not told. A local entity has its own synchronous destroy(). */
    destroy(): Promise<boolean>;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** The dimension it is in: a player's or server entity's by the newest snapshot (0 when not known), a native vehicle's or NPC's the local player's (the server sends only those), the local player's own; a local entity's own setting, which assigning changes (-2147483648: every dimension). */
    readonly dimension: number;
    /** Whether its GTA entity exists on this client: false while it has none (not streamed in, not created yet) and once it is gone; for a player or server entity also what the newest snapshot found (DOES_ENTITY_EXIST). A local entity: until destroy(); a virtual entity, which never has one: the same as valid. */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Freezes (true) or releases its GTA entity on this client (FREEZE_ENTITY_POSITION); resolves false when it has no GTA entity here or GTA refused. A server entity's frozen property (the server's flag) does not change; a local entity's does, as when it is assigned. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Whether it is frozen: for a player or server entity, the server's setting as this client last got it (false when none was sent); a local entity's own setting (true at creation), which assigning applies in this client's GTA. */
    readonly frozen: boolean;
    /** Its speed in m/s: at once from speed when the object has one; otherwise GTA is asked (GET_ENTITY_SPEED), null when it has no GTA entity here or the game did not answer within 150 ms. */
    getSpeedAsync(): Promise<number | null>;
    /** The same as getSyncedMeta; a local entity has no synced data and reads undefined. */
    getVariable(key: string): any;
    /** The same as hasSyncedMeta; a local entity has no synced data and reads false. */
    hasVariable(key: string): boolean;
    /** Its id: a player's or server entity's server id (a native vehicle's or NPC's is the id server scripts know it by, 65536 and up), the local player's own (0 before its first state), a local entity's negative id. */
    readonly id: number;
    /** isDead at once when the object has it; otherwise (a local entity) GTA is asked (IS_ENTITY_DEAD), null when it has no GTA entity here or the game did not answer within 150 ms. */
    isDeadAsync(): Promise<boolean | null>;
    /** True for what the server made: other players, server vehicles, peds, objects and virtual entities, native vehicles and NPCs; false for the local player and for what this client made. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isSpawned: boolean;
    /** For a player or server entity: whether the server streams it to this client and the newest snapshot did not find its GTA entity gone, false once the snapshots stop listing it (it may still wait for its GTA entity: see isSpawned). The local player: valid; a native vehicle or NPC and a local entity: whether it has a GTA entity here. */
    readonly isStreamedIn: boolean;
    /** Its position: a player's or server entity's by the newest snapshot (read from GTA while it is streamed in, else the last synced one); the local player's from its own state (the world origin before the first one, with a warning logged once); a native vehicle's or NPC's read from GTA on each read ({0,0,0} while it has none); a local entity's own, which assigning moves. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of its GTA entity on this client (RESET_ENTITY_ALPHA); resolves false when it has no GTA entity here or GTA refused. A local entity also keeps 255 for its re-creation. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees (z is the heading): a player's or server entity's by the newest snapshot, the local player's from its own state, a native vehicle's or NPC's read from GTA on each read; a local entity's own, which assigning turns. */
    readonly rot: Vector3Like;
    /** Its GTA handle on this client; 0 while it has no GTA entity here. A virtual entity always reads 0. */
    readonly scriptID: number;
    /** Sets the alpha of its GTA entity on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false when it has no GTA entity here or GTA refused. A local entity keeps it, and its re-creation applies it. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of its GTA entity on or off on this client (SET_ENTITY_COLLISION); keepPhysics defaults to true. Resolves false when it has no GTA entity here or GTA refused. A server entity's collision property (the server's flag) does not change; a local entity's does, as when it is assigned. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Moves its GTA entity on this client (SET_ENTITY_COORDS, clearing the area) and resolves true once that ran; false when it has no GTA entity here, for another player (a warning is logged) or when GTA refused. The server is not told. A local entity's pos changes too, as when it is assigned. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Turns its GTA entity on this client (SET_ENTITY_ROTATION, degrees, rotation order 2) and resolves true once that ran; false when it has no GTA entity here, for another player (a warning is logged) or when GTA refused. The server is not told. A local entity's rot changes too, as when it is assigned. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Shows or hides its GTA entity on this client with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false when it has no GTA entity here or GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Whether the server streams it to this client, by the newest snapshot; the local player: valid; a native vehicle or NPC and a local entity: whether it has a GTA entity here. */
    readonly streamed: boolean;
    /** Its BaseObjectType: Player 0, Vehicle 1, Ped 2, Object 3, VirtualEntity 9; a local entity has its kind's (1, 2 or 3). */
    readonly type: number;
    /** Whether this client still has it. A player or server entity: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone, so a kept object turns false once it leaves; the local player: it has an id; a native vehicle or NPC: the server still binds it to this client; a local entity: until destroy(). */
    readonly valid: boolean;
    /** Whether it is visible: a player's or server entity's IS_ENTITY_VISIBLE by the newest snapshot while it is streamed in, else the server's setting (true when none was sent); the local player's: GTA's IS_ENTITY_VISIBLE of its ped in the game, else the server's setting; a native vehicle or NPC always reads true; a local entity's own setting, which assigning applies in this client's GTA. */
    readonly visible: boolean;
}

export const File: {
    /** Deletes a file of the scripts folder of this server and resolves true. Rejects with "not_found" when there was none, "read_only" for a resource: path, "invalid_path" or "empty_path" for a bad path, and "File I/O timeout" after 8 s. */
    delete(path: string): Promise<boolean>;
    /** Resolves whether the path names an existing file (a folder reads false). Rejects for a path that names nothing allowed ("invalid_path", "unknown_resource" and the like) and with "File I/O timeout" after 8 s. */
    exists(path: string): Promise<boolean>;
    /** Resolves the whole file: as text, or with encoding "binary" as an ArrayBuffer of its bytes. "cache:<path>" or a plain path is a file of the scripts folder of this server (kept between its versions, shared by its resources); "resource:<name>/<path>" is a file of a loaded client resource. Rejects with "not_found", "invalid_path", "unknown_resource" or, after 8 s, "File I/O timeout". Other encodings read the file as UTF-8 text. */
    read(path: string, encoding?: string): Promise<string | ArrayBuffer>;
    /** The local path a File path names: "resource:<name>/<path>" as Resource.getPath gives it ("" for an unknown resource), anything else inside the scripts folder of this server. It only builds the text and checks nothing. */
    resolvePath(path: string): string;
    /** Writes data to a file of the scripts folder of this server, creating folders, and resolves true: text as UTF-8, an ArrayBuffer or a typed array as its bytes. Rejects with "read_only" for a resource: path, "invalid_path" or "empty_path", "write_failed" when the disk does not take it, and "File I/O timeout" after 8 s. encoding is not used. */
    write(path: string, data: string | ArrayBuffer | ArrayBufferView, encoding?: string): Promise<boolean>;
};

export const FileEncoding: {
    readonly Binary: any;
    readonly Utf16: any;
    readonly Utf8: any;
};

export const FocusData: {
    /** Gives the streaming focus back to the player (CLEAR_FOCUS) and resets the override state. The override a resource set is also cleared when that resource stops. */
    clearFocus(): void;
    /** The entity the last overrideFocus was given; null when it was given a position or nothing is overridden. */
    readonly focusOverrideEntity: { scriptID: number } | null;
    /** A copy of the offset the last overrideFocus was given, (0, 0, 0) by default; a plain object, not a Vector3. */
    readonly focusOverrideOffset: Vector3Like;
    /** A copy of the focus position: the position given, or the entity's pos at the time of overrideFocus (not updated as it moves); (0, 0, 0) without an override. */
    readonly focusOverridePos: Vector3Like;
    /** True from overrideFocus until clearFocus or the stop of the resource that set it. The runtime keeps this flag; it does not read GTA's focus. */
    readonly isFocusOverridden: boolean;
    /** The same as isFocusOverridden. */
    readonly isFocusOverriden: boolean;
    /** Moves the streaming focus (where the map and world load) to an entity by its scriptID (SET_FOCUS_ENTITY; offset is only stored), to where an entity without a GTA entity here is (its pos), or to a position (SET_FOCUS_POS_AND_VEL with offset as its last three arguments); throws when the native fails. */
    overrideFocus(target: Vector3Like | { scriptID: number; pos?: Vector3Like }, offset?: Vector3Like): void;
};

export const GameFont: {
    readonly ChaletComprimeCologne: any;
    readonly ChaletLondon: any;
    readonly HouseScript: any;
    readonly Monospace: any;
    readonly Pricedown: any;
};

export class Gamepad {
    /** Obtained from `Gamepad.get(index)` or `varion.getGamepads()`: one gamepad's state at the time of the call; `get` returns null for an index without a pad. */
    private constructor();
    /** How many XInput controllers are connected (0..4), as of the last snapshot (up to 20 a second). */
    static readonly count: number;
    /** A snapshot of the index-th connected controller (counted among connected ones, not by XInput slot); null when there is none. The object keeps that state, so call get again for newer input. */
    static get(index: number): Gamepad | null;
    /** Left stick X, -1 (left) to 1 (right), as of the snapshot. */
    readonly axisLeftX: number;
    /** Left stick Y, -1 (down) to 1 (up), as of the snapshot. */
    readonly axisLeftY: number;
    /** Right stick X, -1 (left) to 1 (right), as of the snapshot. */
    readonly axisRightX: number;
    /** Right stick Y, -1 (down) to 1 (up), as of the snapshot. */
    readonly axisRightY: number;
    /** True for every object Gamepad.get returns: controllers that are not connected are not listed. */
    readonly connected: boolean;
    /** The same as isButtonPressed: whether the button was held at the snapshot, not the moment it went down. */
    isButtonDown(button: number): boolean;
    /** Whether the button (GamepadButton: A 0 ... DPadRight 15) was held at the snapshot; LT and RT count once the trigger passes XInput's threshold. */
    isButtonPressed(button: number): boolean;
    /** Left trigger, 0 (released) to 1 (fully pressed), as of the snapshot. */
    readonly leftTrigger: number;
    /** Right trigger, 0 (released) to 1 (fully pressed), as of the snapshot. */
    readonly rightTrigger: number;
}

export const GamepadButton: {
    readonly A: any;
    readonly B: any;
    readonly Back: any;
    readonly DPadDown: any;
    readonly DPadLeft: any;
    readonly DPadRight: any;
    readonly DPadUp: any;
    readonly L3: any;
    readonly LB: any;
    readonly LT: any;
    readonly R3: any;
    readonly RB: any;
    readonly RT: any;
    readonly Start: any;
    readonly X: any;
    readonly Y: any;
};

export class HandlingData {
    /** Creates a handling record for a model hash: handlingNameHash = hash (0 for a non-number); its handling fields read the model's handling in GTA as getForHash's do, while maxBraking, maxTraction and maxPassengers stay 0 and measured is false. getForHash and getForName give a filled one. */
    constructor(hash?: number);
    /** getForHash of the hash, or of a handling name's hash: the hash is used as a model hash, which matches for a stock vehicle, whose handling name is its model name. */
    static getForHandlingName(handlingNameHash: number | string): HandlingData;
    /** Handling of a vehicle model: acceleration, initialDriveMaxFlatVel, brakeForce, steeringLock and tractionCurveMax read from GTA through a vehicle of the model in the game (measured is then true), else the values a script set for the model or 0; maxBraking and maxTraction from GET_VEHICLE_MODEL_MAX_BRAKING and GET_VEHICLE_MODEL_MAX_TRACTION, maxPassengers from the model's seats less the driver's. A new object on each call. */
    static getForHash(modelHash: number): HandlingData;
    /** getForHash of the hash of the model name. */
    static getForName(modelName: string): HandlingData;
    /** Writes the handling values scripts set for the model into GTA again and makes every vehicle of the model the client knows (the server's in range and its own local ones) take its drive force and top speed anew, with GTA's MODIFY_VEHICLE_TOP_SPEED and 0, which also ends a top-speed change a script made on them. Resolves true when all of it went through, false when no vehicle of the model is in the game or for a hash of 0. */
    static reloadVehiclePhysics(modelHash: number): Promise<boolean>;
    /** The model's drive force (fInitialDriveForce), read from the model's handling in GTA's memory through a vehicle of the model that is in the game, else the value a script set for the model, or 0. Assigning writes it into the model's handling in GTA: a vehicle made afterwards takes it, one already in the game with HandlingData.reloadVehiclePhysics (GTA keeps a vehicle's drive force and top speed from the moment it is made). The value is kept for the model, saved for this server (written again once a vehicle of the model is in the game); GTA's own value comes back when the session ends. */
    acceleration: number;
    /** Writes this object's handling fields above 0 into the handling of a vehicle (script handle or object with scriptID) in GTA, which is its model's: every vehicle of the model takes the brake force, grip and steering lock at once, until the session ends. That vehicle also takes its drive force and top speed anew (GTA's MODIFY_VEHICLE_TOP_SPEED and 0, which ends a top-speed change made on it); the model's other vehicles take them when made, or with HandlingData.reloadVehiclePhysics. Resolves true when any field was written, false without a handle. */
    applyTo(vehicle: number | { scriptID: number }): Promise<boolean>;
    /** The model's brake force (fBrakeForce), read from the model's handling in GTA's memory through a vehicle of the model that is in the game, else the value a script set for the model, or 0. Assigning writes it into GTA: every vehicle of the model takes it at once. The value is kept for the model, saved for this server (written again once a vehicle of the model is in the game); GTA's own value comes back when the session ends. */
    brakeForce: number;
    /** The hash the object was made for (the model hash for getForHash and getForName), 0 for none. setField keeps overrides under it, and applyTo sends it to SET_VEHICLE_HANDLING_OVERRIDE. */
    handlingNameHash: number;
    /** The model's top speed on the flat in metres per second (fInitialDriveMaxFlatVel: the handling file's km/h divided by 3.6), read from the model's handling in GTA's memory through a vehicle of the model that is in the game, else the value a script set for the model, or 0. Assigning also sets the speed GTA derives from it (1.2 times as much). Assigning writes it into the model's handling in GTA: a vehicle made afterwards takes it, one already in the game with HandlingData.reloadVehiclePhysics (GTA keeps a vehicle's drive force and top speed from the moment it is made). The value is kept for the model, saved for this server (written again once a vehicle of the model is in the game); GTA's own value comes back when the session ends. */
    initialDriveMaxFlatVel: number;
    /** The greatest braking GTA gives: for a model GET_VEHICLE_MODEL_MAX_BRAKING, for a vehicle (getVehicleHandling) GET_VEHICLE_MAX_BRAKING; when GTA gives 0, the value a script set or 0. */
    maxBraking: number;
    /** Passenger seats, the driver's not counted: for a model, GET_VEHICLE_MODEL_NUMBER_OF_SEATS less one (getForHash, getForName, getForHandlingName); for a vehicle (varion.getVehicleHandling), GET_VEHICLE_MAX_NUMBER_OF_PASSENGERS. 0 when GTA gives nothing. */
    maxPassengers: number;
    /** The greatest traction GTA gives: for a model GET_VEHICLE_MODEL_MAX_TRACTION, for a vehicle (getVehicleHandling) GET_VEHICLE_MAX_TRACTION; when GTA gives 0, the value a script set or 0. */
    maxTraction: number;
    /** True when the handling fields were read from GTA, through a vehicle of the model (or the vehicle given to getVehicleHandling) in the game; false when none was, and the fields hold the values a script set or 0. */
    measured: boolean;
    /** Sets a field (the value as a number, 0 for a non-number) and keeps it as this client's value for handlingNameHash, saved for this server and given to later getForHash calls. acceleration, initialDriveMaxFlatVel, brakeForce, steeringLock and tractionCurveMax are written into GTA's handling of the model at once when a vehicle of it is in the game, else once one is (vehicles already in the game take acceleration and initialDriveMaxFlatVel with reloadVehiclePhysics). Returns this object. */
    setField(field: string, value: number): HandlingData;
    /** The model's steering lock in radians (fSteeringLock: the handling file's degrees), read from the model's handling in GTA's memory through a vehicle of the model that is in the game, else the value a script set for the model, or 0. Assigning also sets the inverse GTA keeps beside it. Assigning writes it into GTA: every vehicle of the model takes it at once. The value is kept for the model, saved for this server (written again once a vehicle of the model is in the game); GTA's own value comes back when the session ends. */
    steeringLock: number;
    /** The model's greatest grip (fTractionCurveMax), read from the model's handling in GTA's memory through a vehicle of the model that is in the game, else the value a script set for the model, or 0. Assigning also sets the inverse GTA keeps beside it. Assigning writes it into GTA: every vehicle of the model takes it at once. The value is kept for the model, saved for this server (written again once a vehicle of the model is in the game); GTA's own value comes back when the session ends. */
    tractionCurveMax: number;
}

export const Http: {
    /** A GET through the runtime's shared HttpClient (15 s timeout), limited to the server's own HTTP hosts as HttpClient is. Resolves for any status: ok is true for 2xx, status equals statusCode and text equals body; rejects as HttpClient#get does. */
    get(pathOrUrl: string): Promise<{ ok: boolean; status: number; statusCode: number; url: string; text: string; body: string; headers: Record<string, string> }>;
    /** Http.get, plus json: the body parsed. Rejects with an Error when the body is not JSON, whatever the status. */
    getJson(pathOrUrl: string): Promise<{ ok: boolean; status: number; statusCode: number; url: string; text: string; body: string; headers: Record<string, string>; json: any }>;
};

export class HttpClient {
    /** Creates an HTTP client: http and https requests only to the server's HTTP host or its asset hosts (same host and port, never port 7788), with `connectTimeout` 15000 ms and headers added by `setExtraHeader`. */
    constructor();
    /** The same as new HttpClient(). */
    static create(): HttpClient;
    /** The client with this id; null when there is none or the resource that made it stopped. */
    static getByID(id: number): HttpClient | null;
    /** A CONNECT request. The client's HTTP bridge does not allow this method (nor does a browser's fetch), so the promise always rejects (TypeError "fetch failed: request refused: method CONNECT is not allowed"). */
    connect(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** How long a request may take in milliseconds before it rejects, 15000 by default; values under 1000 (or not a number) count as 1000 or the default. */
    connectTimeout: number;
    /** A DELETE request with an optional body (sent as text); resolves and rejects as get. */
    delete(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A GET request. A path is resolved against the server's HTTP address, and only the server's own HTTP hosts and ports are allowed (never port 7788); resolves for any status with the body as text and the headers (names in lower case), without following redirects. Rejects for another host, before the server's HTTP address is known, when the request fails (a response over 16 MB too) and after connectTimeout ms (15000 by default) with an AbortError. */
    get(url: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A copy of the headers setExtraHeader added. */
    getExtraHeaders(): Record<string, string>;
    /** A HEAD request; resolves and rejects as get, with an empty body. */
    head(url: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A number of its own, counted from 1 across the HTTP clients of this game session; HttpClient.getByID finds the client by it. */
    id: number;
    /** An OPTIONS request with an optional body (sent as text); resolves and rejects as get. */
    options(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A PATCH request; a body starting with { or [ goes as application/json, other text as text/plain, unless a Content-Type header was set. Resolves and rejects as get. */
    patch(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A POST request; a body starting with { or [ goes as application/json, other text as text/plain, unless a Content-Type header was set. Resolves and rejects as get. */
    post(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** A PUT request; a body starting with { or [ goes as application/json, other text as text/plain, unless a Content-Type header was set. Resolves and rejects as get. */
    put(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
    /** Adds a header (both as text) to every later request of this client. */
    setExtraHeader(header: string, value: string): void;
    /** A TRACE request. The client's HTTP bridge does not allow this method (nor does a browser's fetch), so the promise always rejects (TypeError "fetch failed: request refused: method TRACE is not allowed"). */
    trace(url: string, body?: string): Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;
}

export const Key: {
    readonly "-": any;
    readonly ",": any;
    readonly ";": any;
    readonly ".": any;
    readonly "'": any;
    readonly "[": any;
    readonly "]": any;
    readonly "/": any;
    readonly "\\": any;
    readonly "`": any;
    readonly "=": any;
    readonly "~": any;
    readonly A: any;
    readonly Alt: any;
    readonly B: any;
    readonly Backspace: any;
    readonly C: any;
    readonly CapsLock: any;
    readonly Clear: any;
    readonly Ctrl: any;
    readonly D: any;
    readonly Delete: any;
    readonly Down: any;
    readonly E: any;
    readonly End: any;
    readonly Enter: any;
    readonly Escape: any;
    readonly F: any;
    readonly F1: any;
    readonly F10: any;
    readonly F11: any;
    readonly F12: any;
    readonly F2: any;
    readonly F3: any;
    readonly F4: any;
    readonly F5: any;
    readonly F6: any;
    readonly F7: any;
    readonly F8: any;
    readonly F9: any;
    readonly G: any;
    readonly H: any;
    readonly Home: any;
    readonly I: any;
    readonly Insert: any;
    readonly J: any;
    readonly K: any;
    readonly Key0: any;
    readonly Key1: any;
    readonly Key2: any;
    readonly Key3: any;
    readonly Key4: any;
    readonly Key5: any;
    readonly Key6: any;
    readonly Key7: any;
    readonly Key8: any;
    readonly Key9: any;
    readonly KpAdd: any;
    readonly KpDecimal: any;
    readonly KpDivide: any;
    readonly KpMultiply: any;
    readonly KpSubtract: any;
    readonly L: any;
    readonly Left: any;
    readonly M: any;
    readonly MouseLeft: any;
    readonly MouseMiddle: any;
    readonly MouseRight: any;
    readonly N: any;
    readonly NumLock: any;
    readonly Numpad0: any;
    readonly Numpad1: any;
    readonly Numpad2: any;
    readonly Numpad3: any;
    readonly Numpad4: any;
    readonly Numpad5: any;
    readonly Numpad6: any;
    readonly Numpad7: any;
    readonly Numpad8: any;
    readonly Numpad9: any;
    readonly O: any;
    readonly P: any;
    readonly PageDown: any;
    readonly PageUp: any;
    readonly Q: any;
    readonly R: any;
    readonly Return: any;
    readonly Right: any;
    readonly S: any;
    readonly ScrollLock: any;
    readonly Shift: any;
    readonly Space: any;
    readonly T: any;
    readonly Tab: any;
    readonly U: any;
    readonly Up: any;
    readonly V: any;
    readonly W: any;
    readonly X: any;
    readonly Y: any;
    readonly Z: any;
};

export const KeyCode: {
    readonly "-": any;
    readonly ",": any;
    readonly ";": any;
    readonly ".": any;
    readonly "'": any;
    readonly "[": any;
    readonly "]": any;
    readonly "/": any;
    readonly "\\": any;
    readonly "`": any;
    readonly "=": any;
    readonly "~": any;
    readonly A: any;
    readonly Alt: any;
    readonly B: any;
    readonly Backspace: any;
    readonly C: any;
    readonly CapsLock: any;
    readonly Clear: any;
    readonly Ctrl: any;
    readonly D: any;
    readonly Delete: any;
    readonly Down: any;
    readonly E: any;
    readonly End: any;
    readonly Enter: any;
    readonly Escape: any;
    readonly F: any;
    readonly F1: any;
    readonly F10: any;
    readonly F11: any;
    readonly F12: any;
    readonly F2: any;
    readonly F3: any;
    readonly F4: any;
    readonly F5: any;
    readonly F6: any;
    readonly F7: any;
    readonly F8: any;
    readonly F9: any;
    readonly G: any;
    readonly H: any;
    readonly Home: any;
    readonly I: any;
    readonly Insert: any;
    readonly J: any;
    readonly K: any;
    readonly Key0: any;
    readonly Key1: any;
    readonly Key2: any;
    readonly Key3: any;
    readonly Key4: any;
    readonly Key5: any;
    readonly Key6: any;
    readonly Key7: any;
    readonly Key8: any;
    readonly Key9: any;
    readonly KpAdd: any;
    readonly KpDecimal: any;
    readonly KpDivide: any;
    readonly KpMultiply: any;
    readonly KpSubtract: any;
    readonly L: any;
    readonly Left: any;
    readonly M: any;
    readonly MouseLeft: any;
    readonly MouseMiddle: any;
    readonly MouseRight: any;
    readonly N: any;
    readonly NumLock: any;
    readonly Numpad0: any;
    readonly Numpad1: any;
    readonly Numpad2: any;
    readonly Numpad3: any;
    readonly Numpad4: any;
    readonly Numpad5: any;
    readonly Numpad6: any;
    readonly Numpad7: any;
    readonly Numpad8: any;
    readonly Numpad9: any;
    readonly O: any;
    readonly P: any;
    readonly PageDown: any;
    readonly PageUp: any;
    readonly Q: any;
    readonly R: any;
    readonly Return: any;
    readonly Right: any;
    readonly S: any;
    readonly ScrollLock: any;
    readonly Shift: any;
    readonly Space: any;
    readonly T: any;
    readonly Tab: any;
    readonly U: any;
    readonly Up: any;
    readonly V: any;
    readonly W: any;
    readonly X: any;
    readonly Y: any;
    readonly Z: any;
};

export class Keybind {
    /** Registers a key binding of this client, heard with `on("pressed" | "released", handler)`; `key` is a key code or a `KeyCode` name (an unknown name gives 0), `hold` defaults to false. By default it fires only while game controls are on and no cursor or focused WebView is shown; it goes when the resource stops. */
    constructor(key: number | string, hold?: boolean);
    /** Stops the keybind: its handlers go and isPressed reads false (released does not fire). A resource's keybinds are destroyed when it stops. */
    destroy(): void;
    /** True between the pressed and released events of its key. */
    readonly isPressed: boolean;
    /** Removes one registration of the handler from that event. */
    off(event: "pressed" | "released", handler: () => void): void;
    /** Adds a handler: pressed fires when the key goes down while the keybind may act (by default with game controls on, no cursor and no focused visible WebView: gameControlsOnly, enableInUi), released when it comes up. Other names and non-functions are ignored; nothing is returned, so off removes it. */
    on(event: "pressed" | "released", handler: () => void): void;
}

export const LicenseType: {
    readonly Epic: any;
    readonly None: any;
    readonly Rockstar: any;
    readonly Steam: any;
    readonly Xbox: any;
};

export class LocalObject {
    /** Creates a local object only for this client from a model hash or name, rotated by `rot` in degrees (0, 0, 0 by default), frozen, in dimension 0; `dynamic` defaults to false. With `useStreaming` it exists only within `streamingDistance` metres (300 by default) of the local player. With `noOffset` GTA places it with CREATE_OBJECT_NO_OFFSET and moves it with SET_ENTITY_COORDS_NO_OFFSET: pos is the model's origin, without the offset GTA would add. */
    constructor(model: number | string, pos: Vector3Like, rot?: Vector3Like, noOffset?: boolean, dynamic?: boolean, useStreaming?: boolean, streamingDistance?: number);
    /** Every LocalObject not destroyed, of every resource; a new array on each read. */
    static readonly all: LocalObject[];
    /** How many objects LocalObject.all holds. */
    static readonly count: number;
    /** The LocalObject not destroyed with this id, given as its negative id or as the number without the sign (-3 or 3); null for none. */
    static getByID(id: number): LocalObject | null;
    /** The LocalObject whose remoteId (the same as its id) this is; null for any other id. A local object has no server id: the server's ones are found with Object.getByRemoteID. */
    static getByRemoteID(remoteId: number): LocalObject | null;
    /** The LocalObject not destroyed whose GTA handle this is; null for 0 or below and for none. */
    static getByScriptID(scriptID: number): LocalObject | null;
    /** Activates physics of its GTA object on this client (ACTIVATE_PHYSICS), at once or once it is created. */
    activatePhysics(): void;
    /** Its alpha 0–255, 255 at creation; assigning truncates and clamps the number (a non-number counts as 0) and applies it in this client's GTA (SET_ENTITY_ALPHA), at once or when it is created. It stays when frozen, collision or visible change; a hidden object is drawn with 0. */
    alpha: number;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** The same as attachTo: attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; resolves false when either has no GTA entity here. */
    attachToEntity(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Its own collision setting, true at creation; assigning applies it in this client's GTA (SET_ENTITY_COLLISION), at once or when it is created. setCollision does not change it. */
    collision: boolean;
    /** Destroys it: its GTA entity is deleted (gameEntityDestroy fires if it had one, then baseObjectRemove), valid turns false and pending waitForSpawn promises reject. A second call does nothing; a resource's local entities are destroyed when it stops. */
    destroy(): void;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** Its dimension, 0 by default; it exists in GTA only while the local player's dimension sees it: the same one, every one at -2147483648, and 0 also from a negative dimension. Assigning a finite number (anything else sets 0) creates or deletes its GTA entity at once to match. */
    dimension: number;
    /** Whether it was made dynamic (the constructor's dynamic flag), applied with SET_ENTITY_DYNAMIC when its GTA object is created. */
    readonly dynamic: boolean;
    /** The same as valid: true until destroy(), whether its GTA entity exists or not. */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Sets frozen (the same as assigning it) and, when it has a GTA entity, freezes (true) or releases it on this client with FREEZE_ENTITY_POSITION; resolves true once GTA ran it, false without a GTA entity yet (frozen applies at its creation) or when GTA refused. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Its own frozen setting, true at creation; assigning applies it in this client's GTA (FREEZE_ENTITY_POSITION), at once or when it is created. freezePosition does not change it. */
    frozen: boolean;
    /** Its speed in m/s asked of GTA (GET_ENTITY_SPEED); null when it has no GTA entity yet or the game did not answer within 150 ms. */
    getSpeedAsync(): Promise<number | null>;
    /** Always undefined: a local entity is this client's own and has no synced data. */
    getVariable(key: string): undefined;
    /** Whether gravity acts on it, true by default; assigning applies it in this client's GTA (SET_ENTITY_HAS_GRAVITY), at once or when it is created. */
    hasGravity: boolean;
    /** Always false: a local entity is this client's own and has no synced data. */
    hasVariable(key: string): boolean;
    /** Its negative id (-1, -2 ...), unique among this client's local entities; its class's getByID finds it. */
    readonly id: number;
    /** The same as collision. */
    readonly isCollisionEnabled: boolean;
    /** Asks GTA whether it is dead (IS_ENTITY_DEAD); null when it has no GTA entity yet or the game did not answer within 150 ms. */
    isDeadAsync(): Promise<boolean | null>;
    /** Always false: this client made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isSpawned: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isStreamedIn: boolean;
    /** True on an object GTA placed itself, as Utils.getClosestWorldObject gives it; false on one a script made. */
    readonly isWorldObject: boolean;
    /** Its LOD distance, 100 by default; assigning truncates and clamps to 0–65535 (a non-number counts as 0) and applies it in this client's GTA (SET_ENTITY_LOD_DIST), at once or when it is created. */
    lodDistance: number;
    /** Its model hash; assigning a name or hash (0, the same model or a destroyed entity is ignored) deletes its GTA entity (gameEntityDestroy) and creates it again with the new model. */
    get model(): number;
    set model(value: string | number);
    /** The noOffset the object was made with; kept for reading only, the object is placed at pos either way. */
    noOffset: boolean;
    /** Places its GTA object on the ground on this client (PLACE_OBJECT_ON_GROUND_PROPERLY), at once or once it is created; the pos property does not change. */
    placeOnGroundProperly(): void;
    /** Its position, a copy on each read. Assigning sets the given components (the others stay), moves its GTA entity on this client and checks streaming again, which may create or delete it. */
    get pos(): Vector3Like;
    set pos(value: Partial<Vector3Like>);
    /** The same as frozen; assigning sets frozen. */
    positionFrozen: boolean;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Sets alpha to 255. */
    resetAlpha(): void;
    /** Its rotation in degrees (z is the heading), a copy on each read. Assigning sets the given components and turns its GTA entity on this client. */
    get rot(): Vector3Like;
    set rot(value: Partial<Vector3Like>);
    /** Its GTA handle on this client; 0 until it is created, while it is out of streaming range or in another dimension, and after destroy(). */
    readonly scriptID: number;
    /** Sets alpha (0–255, a whole number; the same as assigning it) and, when it has a GTA entity, applies it with SET_ENTITY_ALPHA (skin as given); resolves true once GTA ran it, false without a GTA entity yet (alpha applies at its creation) or when GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Sets collision (the same as assigning it) and, when it has a GTA entity, turns its collision on or off on this client with SET_ENTITY_COLLISION (keepPhysics true by default); resolves true once GTA ran it, false without a GTA entity yet (collision applies at its creation) or when GTA refused. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Sets pos (the same as assigning it, so streaming and a re-creation use the new place) and, when it has a GTA entity, moves it on this client with SET_ENTITY_COORDS; resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Sets rot (the same as assigning it, so a re-creation keeps it) and, when it has a GTA entity, turns it on this client with SET_ENTITY_ROTATION (degrees); resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Sets visible (the same as assigning it) and, when it has a GTA entity, shows or hides it with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false without a GTA entity yet (visible applies at its creation) or when GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly streamed: boolean;
    /** The distance in metres within which it exists in GTA while useStreaming is true; given to the constructor, 300 by default, at least 1. */
    readonly streamingDistance: number;
    /** Its texture variation (tint index), 0 by default; assigning truncates (a negative or non-number counts as 0) and applies it in this client's GTA (SET_OBJECT_TINT_INDEX), at once or when it is created. */
    textureVariation: number;
    /** Sets collision to toggle. */
    toggleCollision(toggle: boolean): void;
    /** Always 3 (BaseObjectType.Object). */
    readonly type: number;
    /** Given to the constructor: true makes it exist in GTA only within streamingDistance of the local player (checked whenever the local player's state changes); false, while the local player is in its dimension. */
    readonly useStreaming: boolean;
    /** True until destroy(). */
    readonly valid: boolean;
    /** Its own visibility, true at creation; assigning shows or hides its GTA entity on this client, at once or when it is created (hiding also sets its alpha to 0, showing to 255). setVisible does not change it. */
    visible: boolean;
    /** Resolves once it has a GTA entity (at once when it has). Rejects when it is destroyed, when the engine gives up making it (localEntityFailed; at once while that stands, until it is requested again: a new model, or out of range or its dimension and back) and, when a timeout is given, after that many ms (0, negative or not a number counts as 1 ms); without a timeout it waits as long as it takes. */
    waitForSpawn(timeout?: number): Promise<void>;
}

export class LocalPed {
    /** Creates a local ped only for this client from a model hash or name, frozen and turned to `rot.z` degrees. A number as the second argument is its dimension; without it the ped is in dimension 0 and every later argument moves up one. With `useStreaming` it exists only within `streamingDistance` metres (300 by default) of the local player. */
    constructor(model: number | string, dimension: number, pos: Vector3Like, rot?: Vector3Like, useStreaming?: boolean, streamingDistance?: number);
    constructor(model: number | string, pos: Vector3Like, rot?: Vector3Like, useStreaming?: boolean, streamingDistance?: number);
    /** Every LocalPed not destroyed, of every resource; a new array on each read. */
    static readonly all: LocalPed[];
    /** How many peds LocalPed.all holds. */
    static readonly count: number;
    /** The LocalPed not destroyed with this id, given as its negative id or as the number without the sign (-3 or 3); null for none. */
    static getByID(id: number): LocalPed | null;
    /** The LocalPed whose remoteId (the same as its id) this is; null for any other id. A local ped has no server id: the server's ones are found with Ped.getByRemoteID. */
    static getByRemoteID(remoteId: number): LocalPed | null;
    /** The LocalPed not destroyed whose GTA handle this is; null for 0 or below and for none. */
    static getByScriptID(scriptID: number): LocalPed | null;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Its own collision setting, true at creation; assigning applies it in this client's GTA (SET_ENTITY_COLLISION), at once or when it is created. setCollision does not change it. */
    collision: boolean;
    /** Destroys it: its GTA entity is deleted (gameEntityDestroy fires if it had one, then baseObjectRemove), valid turns false and pending waitForSpawn promises reject. A second call does nothing; a resource's local entities are destroyed when it stops. */
    destroy(): void;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** Its dimension, 0 by default; it exists in GTA only while the local player's dimension sees it: the same one, every one at -2147483648, and 0 also from a negative dimension. Assigning a finite number (anything else sets 0) creates or deletes its GTA entity at once to match. */
    dimension: number;
    /** The same as valid: true until destroy(), whether its GTA entity exists or not. */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Sets frozen (the same as assigning it) and, when it has a GTA entity, freezes (true) or releases it on this client with FREEZE_ENTITY_POSITION; resolves true once GTA ran it, false without a GTA entity yet (frozen applies at its creation) or when GTA refused. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Its own frozen setting, true at creation; assigning applies it in this client's GTA (FREEZE_ENTITY_POSITION), at once or when it is created. freezePosition does not change it. */
    frozen: boolean;
    /** Its speed in m/s asked of GTA (GET_ENTITY_SPEED); null when it has no GTA entity yet or the game did not answer within 150 ms. */
    getSpeedAsync(): Promise<number | null>;
    /** Always undefined: a local entity is this client's own and has no synced data. */
    getVariable(key: string): undefined;
    /** Always false: a local entity is this client's own and has no synced data. */
    hasVariable(key: string): boolean;
    /** Its negative id (-1, -2 ...), unique among this client's local entities; its class's getByID finds it. */
    readonly id: number;
    /** Asks GTA whether it is dead (IS_ENTITY_DEAD); null when it has no GTA entity yet or the game did not answer within 150 ms. */
    isDeadAsync(): Promise<boolean | null>;
    /** Always false: this client made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isSpawned: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isStreamedIn: boolean;
    /** Its model hash; assigning a name or hash (0, the same model or a destroyed entity is ignored) deletes its GTA entity (gameEntityDestroy) and creates it again with the new model. */
    get model(): number;
    set model(value: string | number);
    /** Always false: a ped takes no noOffset. */
    noOffset: boolean;
    /** Its position, a copy on each read. Assigning sets the given components (the others stay), moves its GTA entity on this client and checks streaming again, which may create or delete it. */
    get pos(): Vector3Like;
    set pos(value: Partial<Vector3Like>);
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Keeps 255 as its alpha for the creation of its GTA entity and, when it has one, resets it on this client (RESET_ENTITY_ALPHA); resolves false without a GTA entity yet or when GTA refused. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees, a copy on each read. Assigning sets the given components; its GTA ped takes only z, the heading. */
    get rot(): Vector3Like;
    set rot(value: Partial<Vector3Like>);
    /** Its GTA handle on this client; 0 until it is created, while it is out of streaming range or in another dimension, and after destroy(). */
    readonly scriptID: number;
    /** Keeps the alpha for the creation of its GTA entity and, when it has one, sets it on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false without a GTA entity yet or when GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Sets collision (the same as assigning it) and, when it has a GTA entity, turns its collision on or off on this client with SET_ENTITY_COLLISION (keepPhysics true by default); resolves true once GTA ran it, false without a GTA entity yet (collision applies at its creation) or when GTA refused. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Sets pos (the same as assigning it, so streaming and a re-creation use the new place) and, when it has a GTA entity, moves it on this client with SET_ENTITY_COORDS; resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Sets rot (the same as assigning it, so a re-creation keeps it) and, when it has a GTA entity, turns it on this client with SET_ENTITY_ROTATION (degrees); resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Sets visible (the same as assigning it) and, when it has a GTA entity, shows or hides it with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false without a GTA entity yet (visible applies at its creation) or when GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly streamed: boolean;
    /** The distance in metres within which it exists in GTA while useStreaming is true; given to the constructor, 300 by default, at least 1. */
    readonly streamingDistance: number;
    /** Always 2 (BaseObjectType.Ped). */
    readonly type: number;
    /** Given to the constructor: true makes it exist in GTA only within streamingDistance of the local player (checked whenever the local player's state changes); false, while the local player is in its dimension. */
    readonly useStreaming: boolean;
    /** True until destroy(). */
    readonly valid: boolean;
    /** Its own visibility, true at creation; assigning shows or hides its GTA entity on this client, at once or when it is created (hiding also sets its alpha to 0, showing to 255). setVisible does not change it. */
    visible: boolean;
    /** Resolves once it has a GTA entity (at once when it has). Rejects when it is destroyed, when the engine gives up making it (localEntityFailed; at once while that stands, until it is requested again: a new model, or out of range or its dimension and back) and, when a timeout is given, after that many ms (0, negative or not a number counts as 1 ms); without a timeout it waits as long as it takes. */
    waitForSpawn(timeout?: number): Promise<void>;
}

export const LocalStorage: {
    /** Removes every key of the calling resource's store, as deleteAll; the disk changes with the next save() or auto-save. Throws outside a resource's code. */
    clear(): void;
    /** Removes the key from the calling resource's store; the disk changes with the next save() or auto-save. Throws outside a resource's code. */
    delete(key: string): void;
    /** Removes every key of the calling resource's store; the disk changes with the next save() or auto-save. Throws outside a resource's code. */
    deleteAll(): void;
    /** The value LocalStorage.set stored under the key, of the same type (a string as it is, other values through JSON); undefined when it is not set. Before the store has loaded it warns once and sees only this session's writes; throws outside a resource's code. */
    get(key: string): any;
    /** Whether the calling resource's store holds the key. Before the store has loaded it warns once and sees only this session's writes; throws outside a resource's code. */
    has(key: string): boolean;
    /** True once the calling resource's store has arrived from disk; false before, outside a resource's code, and while the store cannot be read. */
    readonly isReady: boolean;
    /** Resolves true once the calling resource's store has loaded. It never rejects and keeps waiting while the store cannot be read; throws outside a resource's code. */
    ready(): Promise<boolean>;
    /** The same as delete. */
    remove(key: string): void;
    /** Writes the calling resource's whole store for this server and returns true; before the store has loaded it returns false and saves once it loads. A write the client cannot make fires localStorageError("saveAll", detail); changed stores are also saved when the resource stops, when the session ends and on exit through the menu or the F8 quit command. */
    save(): boolean;
    /** Stores a value under the key in the calling resource's store: a string as it is; null, numbers, booleans, arrays and plain objects as JSON, so get gives the same type back. Throws a TypeError for a function, symbol, BigInt, Map, Set, binary data or nesting deeper than 32 levels; nothing reaches the disk before save() or an auto-save. */
    set(key: string, value: any): void;
};

export class LocalVehicle {
    /** Creates a local vehicle only for this client from a model hash or name, frozen and rotated by `rot` in degrees. A number as the second argument is its dimension; without it the vehicle is in dimension 0 and every later argument moves up one. With `useStreaming` it exists only within `streamingDistance` metres (300 by default) of the local player. */
    constructor(model: number | string, dimension: number, pos: Vector3Like, rot?: Vector3Like, useStreaming?: boolean, streamingDistance?: number);
    constructor(model: number | string, pos: Vector3Like, rot?: Vector3Like, useStreaming?: boolean, streamingDistance?: number);
    /** Every LocalVehicle not destroyed, of every resource; a new array on each read. */
    static readonly all: LocalVehicle[];
    /** How many vehicles LocalVehicle.all holds. */
    static readonly count: number;
    /** The LocalVehicle not destroyed with this id, given as its negative id or as the number without the sign (-3 or 3); null for none. */
    static getByID(id: number): LocalVehicle | null;
    /** The LocalVehicle whose remoteId (the same as its id) this is; null for any other id. A local vehicle has no server id: the server's ones are found with Vehicle.getByRemoteID. */
    static getByRemoteID(remoteId: number): LocalVehicle | null;
    /** The LocalVehicle not destroyed whose GTA handle this is; null for 0 or below and for none. */
    static getByScriptID(scriptID: number): LocalVehicle | null;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Body health (GET_VEHICLE_BODY_HEALTH, 0–1000) from the state its GTA vehicle reports (about every 100 ms, when it changes); 1000 before the first report. */
    readonly bodyHealth: number;
    /** Its own collision setting, true at creation; assigning applies it in this client's GTA (SET_ENTITY_COLLISION), at once or when it is created. setCollision does not change it. */
    collision: boolean;
    /** Destroys it: its GTA entity is deleted (gameEntityDestroy fires if it had one, then baseObjectRemove), valid turns false and pending waitForSpawn promises reject. A second call does nothing; a resource's local entities are destroyed when it stops. */
    destroy(): void;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** Its dimension, 0 by default; it exists in GTA only while the local player's dimension sees it: the same one, every one at -2147483648, and 0 also from a negative dimension. Assigning a finite number (anything else sets 0) creates or deletes its GTA entity at once to match. */
    dimension: number;
    /** Engine health (GET_VEHICLE_ENGINE_HEALTH, a whole number) from the state its GTA vehicle reports (about every 100 ms, when it changes); 1000 before the first report. */
    readonly engineHealth: number;
    /** Whether its engine runs (GET_IS_VEHICLE_ENGINE_RUNNING), from the state its GTA vehicle reports (about every 100 ms, when it changes); false before the first report. */
    readonly engineOn: boolean;
    /** Engine temperature, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 before the first report or when the field could not be read. */
    readonly engineTemperature: number;
    /** The same as valid: true until destroy(), whether its GTA entity exists or not. */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Sets frozen (the same as assigning it) and, when it has a GTA entity, freezes (true) or releases it on this client with FREEZE_ENTITY_POSITION; resolves true once GTA ran it, false without a GTA entity yet (frozen applies at its creation) or when GTA refused. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Its own frozen setting, true at creation; assigning applies it in this client's GTA (FREEZE_ENTITY_POSITION), at once or when it is created. freezePosition does not change it. */
    frozen: boolean;
    /** Fuel level, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 before the first report or when the field could not be read. */
    readonly fuelLevel: number;
    /** Current gear from the state its GTA vehicle reports (about every 100 ms, when it changes); assigning a number (truncated, clamped to 0–255) writes it into its GTA vehicle on this client. */
    gear: number;
    /** Resolves at once with speed: m/s from the state its GTA vehicle reports, 0 before the first report. */
    getSpeedAsync(): Promise<number | null>;
    /** Always undefined: a local entity is this client's own and has no synced data. */
    getVariable(key: string): undefined;
    /** The camber of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelCamber(wheel: number): number;
    /** The height of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelHeight(wheel: number): number;
    /** The rim radius of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelRimRadius(wheel: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index of the surface material under wheel 0–7 from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 when unknown. */
    getWheelSurfaceMaterial(wheel: number): number;
    /** The track width of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelTrackWidth(wheel: number): number;
    /** The tyre radius of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelTyreRadius(wheel: number): number;
    /** The tyre width of wheel 0–7, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 for a wheel it does not have and before the first report. */
    getWheelTyreWidth(wheel: number): number;
    /** Always false: a local entity is this client's own and has no synced data. */
    hasVariable(key: string): boolean;
    /** Its negative id (-1, -2 ...), unique among this client's local entities; its class's getByID finds it. */
    readonly id: number;
    /** Its turn indicators, 0 off, 1 left, 2 right, 3 both, read from its GTA vehicle's memory and reported about every 100 ms when they change; 0 before the first report. */
    readonly indicatorLights: number;
    /** Asks GTA whether it is dead (IS_ENTITY_DEAD); null when it has no GTA entity yet or the game did not answer within 150 ms. */
    isDeadAsync(): Promise<boolean | null>;
    /** Always false: this client made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isSpawned: boolean;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly isStreamedIn: boolean;
    /** Door lock status (GET_VEHICLE_DOOR_LOCK_STATUS, 0–10, as VehicleLockState) from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 before the first report. */
    readonly lockState: number;
    /** Its top gear, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 before the first report or when the field could not be read. */
    readonly maxGear: number;
    /** Its model hash; assigning a name or hash (0, the same model or a destroyed entity is ignored) deletes its GTA entity (gameEntityDestroy) and creates it again with the new model. */
    get model(): number;
    set model(value: string | number);
    /** Always false: a vehicle takes no noOffset. */
    noOffset: boolean;
    /** Oil level, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 before the first report or when the field could not be read. */
    readonly oilLevel: number;
    /** Petrol tank health (GET_VEHICLE_PETROL_TANK_HEALTH, a whole number) from the state its GTA vehicle reports (about every 100 ms, when it changes); 1000 before the first report. */
    readonly petrolTankHealth: number;
    /** Its position, a copy on each read. Assigning sets the given components (the others stay), moves its GTA entity on this client and checks streaming again, which may create or delete it. */
    get pos(): Vector3Like;
    set pos(value: Partial<Vector3Like>);
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Keeps 255 as its alpha for the creation of its GTA entity and, when it has one, resets it on this client (RESET_ENTITY_ALPHA); resolves false without a GTA entity yet or when GTA refused. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees (z is the heading), a copy on each read. Assigning sets the given components and turns its GTA entity on this client. */
    get rot(): Vector3Like;
    set rot(value: Partial<Vector3Like>);
    /** Engine revs 0–1 from the state its GTA vehicle reports (about every 100 ms, when it changes); assigning a number (clamped to 0–1) writes it into its GTA vehicle on this client. */
    rpm: number;
    /** Its GTA handle on this client; 0 until it is created, while it is out of streaming range or in another dimension, and after destroy(). */
    readonly scriptID: number;
    /** Its seats including the driver's (GET_VEHICLE_MAX_NUMBER_OF_PASSENGERS + 1) from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 before the first report. */
    readonly seatCount: number;
    /** Keeps the alpha for the creation of its GTA entity and, when it has one, sets it on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false without a GTA entity yet or when GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Sets collision (the same as assigning it) and, when it has a GTA entity, turns its collision on or off on this client with SET_ENTITY_COLLISION (keepPhysics true by default); resolves true once GTA ran it, false without a GTA entity yet (collision applies at its creation) or when GTA refused. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Sets pos (the same as assigning it, so streaming and a re-creation use the new place) and, when it has a GTA entity, moves it on this client with SET_ENTITY_COORDS; resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Sets rot (the same as assigning it, so a re-creation keeps it) and, when it has a GTA entity, turns it on this client with SET_ENTITY_ROTATION (degrees); resolves true once GTA ran it, false without a GTA entity yet or when GTA refused. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Sets visible (the same as assigning it) and, when it has a GTA entity, shows or hides it with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false without a GTA entity yet (visible applies at its creation) or when GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Stores the camber of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelCamber(wheel: number, value: number): void;
    /** Stores the height of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelHeight(wheel: number, value: number): void;
    /** Stores the rim radius of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelRimRadius(wheel: number, value: number): void;
    /** Stores the track width of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelTrackWidth(wheel: number, value: number): void;
    /** Stores the tyre radius of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelTyreRadius(wheel: number, value: number): void;
    /** Stores the tyre width of wheel 0–7 and writes it into its GTA vehicle on this client, at once or once it is created; ignored for a wheel outside 0–7 or a value that is not finite or beyond ±100. The next reported state reads it back from GTA. */
    setWheelTyreWidth(wheel: number, value: number): void;
    /** Its speed in m/s from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 before the first report. */
    readonly speed: number;
    /** Its velocity in m/s, a copy of what is reported with its state (about every 100 ms, when it changes); {0,0,0} before the first report. */
    readonly speedVector: Vector3Like;
    /** Steering angle in degrees from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 before the first report. */
    readonly steeringAngle: number;
    /** Whether it has a GTA entity on this client now (scriptID is not 0). */
    readonly streamed: boolean;
    /** The distance in metres within which it exists in GTA while useStreaming is true; given to the constructor, 300 by default, at least 1. */
    readonly streamingDistance: number;
    /** Suspension height, read from its GTA vehicle's memory and reported about every 100 ms when it changes; 0 before the first report or when the field could not be read. */
    readonly suspensionHeight: number;
    /** Always 1 (BaseObjectType.Vehicle). */
    readonly type: number;
    /** Given to the constructor: true makes it exist in GTA only within streamingDistance of the local player (checked whenever the local player's state changes); false, while the local player is in its dimension. */
    readonly useStreaming: boolean;
    /** True until destroy(). */
    readonly valid: boolean;
    /** Its own visibility, true at creation; assigning shows or hides its GTA entity on this client, at once or when it is created (hiding also sets its alpha to 0, showing to 255). setVisible does not change it. */
    visible: boolean;
    /** Resolves once it has a GTA entity (at once when it has). Rejects when it is destroyed, when the engine gives up making it (localEntityFailed; at once while that stands, until it is requested again: a new model, or out of range or its dimension and back) and, when a timeout is given, after that many ms (0, negative or not a number counts as 1 ms); without a timeout it waits as long as it takes. */
    waitForSpawn(timeout?: number): Promise<void>;
    /** How many wheels it has (at most 8) from the state its GTA vehicle reports (about every 100 ms, when it changes); 0 before the first report. A setWheel… call raises it. */
    readonly wheelsCount: number;
}

export const Locale: {
    readonly Arabic: any;
    readonly Belarusian: any;
    readonly BrazilianPortuguese: any;
    readonly ChineseSimplified: any;
    readonly ChineseTraditional: any;
    readonly Czech: any;
    readonly English: any;
    readonly Farsi: any;
    readonly French: any;
    readonly German: any;
    readonly Hebrew: any;
    readonly Hindi: any;
    readonly Hungarian: any;
    readonly Indonesian: any;
    readonly Italian: any;
    readonly Latvian: any;
    readonly Lithuanian: any;
    readonly Malayalam: any;
    readonly NorwegianBokmal: any;
    readonly NorwegianNynorsk: any;
    readonly Polish: any;
    readonly Portugese: any;
    readonly Romanian: any;
    readonly Russian: any;
    readonly Serbian: any;
    readonly Slovak: any;
    readonly Spanish: any;
    readonly Tamil: any;
    readonly Telugu: any;
    readonly Thai: any;
    readonly Turkish: any;
    readonly Ukrainian: any;
};

export const MValue: {
    /** A bool argument for emitServer, emitServerUnreliable or callServer: the value's truthiness. */
    bool(value: any): { t: "bool"; v: boolean };
    /** A byte-array argument made of the string's UTF-8 bytes. Binary data (an ArrayBuffer or a typed array) throws a TypeError, as the wire carries no raw bytes yet; anything else that is not a string gives an empty array. */
    byteArray(data: string): { t: "bytes"; v: string };
    /** A dictionary argument of the object's entries, sent as JSON values. */
    dict(object: Record<string, any>): { t: "dict"; v: Record<string, any> };
    /** A 64-bit float argument, also for a whole number (which from would send as an integer). */
    double(value: number): { t: "double"; v: number };
    /** A reference to a server object by the server's entity type (0 player, 1 vehicle, 2 ped, 3 object, 20 virtual entity) and id; the server reads it as its own object. */
    entity(entityType: number, id: number): { t: "entity"; entityType: number; id: number };
    /** The typed value the runtime sends for a script value: null and undefined nil, booleans bool, safe integers uint (0 and up) or int, other numbers double, strings string, a server object an entity reference, arrays list, objects with numeric x, y, z vector3, other objects dict. A value that already has a string t is returned as it is. */
    from(value: any): { t: string; [field: string]: any };
    /** A signed integer argument: the value truncated to a whole number within ±(2^53 - 1); a value that is not a finite number gives 0. */
    int(value: number): { t: "int"; v: number };
    /** A list argument of the items, sent as JSON values (server objects in it are not turned into references; from does that). */
    list(...items: any[]): { t: "list"; v: any[] };
    /** A nil argument for emitServer, emitServerUnreliable or callServer, as null and undefined are sent. */
    nil(): { t: "nil" };
    /** An RGBA argument; each component is taken modulo 256 (256 is 0, -1 is 255), and a defaults to 255. */
    rgba(r: number, g: number, b: number, a?: number): { t: "rgba"; r: number; g: number; b: number; a: number };
    /** A string argument: String(value). */
    string(value: any): { t: "string"; v: string };
    /** The plain value of a typed value: nil null, bool, int, uint, double and string their value, bytes the string, list an array and dict an object (their items unwrapped too), vector3 a Vector3, rgba an RGBA, entity the object this client knows by that reference or null. An array is unwrapped item by item; anything else comes back as it is. */
    to(value: any): any;
    /** An unsigned integer argument: as int, with a negative value as 0. */
    uint(value: number): { t: "uint"; v: number };
    /** A Vector3 argument; each component is sent as a 32-bit float. */
    vector3(x: number, y: number, z: number): { t: "vector3"; x: number; y: number; z: number };
};

export class MapZoomData {
    /** Creates the zoom data of one of GTA's nine levels, by name or number, as MapZoomData.get does: its fields read and write that level in GTA's zoom data, and reset() gives GTA's values back. Throws an Error for another name or number. */
    private constructor(zoomDataId: "ZOOM_LEVEL_0" | "ZOOM_LEVEL_1" | "ZOOM_LEVEL_2" | "ZOOM_LEVEL_3" | "ZOOM_LEVEL_4" | "ZOOM_LEVEL_GOLF_COURSE" | "ZOOM_LEVEL_INTERIOR" | "ZOOM_LEVEL_GALLERY" | "ZOOM_LEVEL_GALLERY_MAXIMIZE" | number);
    /** A MapZoomData for one of GTA's nine pause-map zoom levels, by name or by its place in this list: ZOOM_LEVEL_0..ZOOM_LEVEL_4 (0..4), ZOOM_LEVEL_GOLF_COURSE (5), ZOOM_LEVEL_INTERIOR (6), ZOOM_LEVEL_GALLERY (7), ZOOM_LEVEL_GALLERY_MAXIMIZE (8). Throws an Error for another name or number. */
    static get(zoomData: "ZOOM_LEVEL_0" | "ZOOM_LEVEL_1" | "ZOOM_LEVEL_2" | "ZOOM_LEVEL_3" | "ZOOM_LEVEL_4" | "ZOOM_LEVEL_GOLF_COURSE" | "ZOOM_LEVEL_INTERIOR" | "ZOOM_LEVEL_GALLERY" | "ZOOM_LEVEL_GALLERY_MAXIMIZE" | number): MapZoomData;
    /** Gives every level GTA's own values back and forgets every value scripts set, saved ones too. */
    static resetAll(): void;
    /** How fast the pause map scrolls at this level, read from GTA's zoom data (GTA 3889: 0.08 for ZOOM_LEVEL_0..4, 0.1 golf course and interior, 0 gallery). Assigning writes it into GTA and keeps it, saved for this server; GTA's own value comes back with reset, resetAll or the end of the session. */
    fScrollSpeed: number;
    /** How much this level enlarges the pause map, read from GTA's zoom data (GTA 3889: 2.73, 2.8, 8, 24 and 82 for ZOOM_LEVEL_0..4, 55 golf course, 450 interior, 4.5 and 11 gallery). Assigning writes it into GTA at once, so the pause map shows it, and keeps it, saved for this server; GTA's own value comes back with reset, resetAll or the end of the session. */
    fZoomScale: number;
    /** How fast the pause map zooms at this level, read from GTA's zoom data (GTA 3889: 0.9 for ZOOM_LEVEL_0..4, 0 for the others). Assigning writes it into GTA and keeps it, saved for this server; GTA's own value comes back with reset, resetAll or the end of the session. */
    fZoomSpeed: number;
    /** Gives this level GTA's own values back and forgets the values scripts set for it, saved ones too. */
    reset(): void;
    /** The pause map's tiles across at this level (vTiles x in mapzoomdata.meta), read from GTA's zoom data (GTA 3889: 0, 0, 9, 3 and 2 for ZOOM_LEVEL_0..4, 2 golf course, 1 interior, 0 and 2 gallery). Assigning writes it into GTA and keeps it, saved for this server; GTA's own value comes back with reset, resetAll or the end of the session. */
    vTilesX: number;
    /** The pause map's tiles down at this level (vTiles y in mapzoomdata.meta), read from GTA's zoom data (GTA 3889: 0, 0, 4, 2 and 1 for ZOOM_LEVEL_0..4, 1 golf course and interior, 0 and 3 gallery). Assigning writes it into GTA and keeps it, saved for this server; GTA's own value comes back with reset, resetAll or the end of the session. */
    vTilesY: number;
}

export class Marker {
    /** Creates a marker that this client alone draws every frame, in dimension 0, with scale 1 and colour 255, 255, 255, 255 by default (channels clamped to 0–255). It shows at any distance unless `useStreaming` is `true`, then within `streamingDistance` metres (300 by default). */
    constructor(type: number, position: Vector3Like, color?: { r: number; g: number; b: number; a?: number }, useStreaming?: boolean, streamingDistance?: number);
    /** The server's markers this client has, as plain objects with fewer members (drawn at any distance, without spinning or bobbing; assigning their pos, dimension, markerType, scale, rot, dir, color, visible or faceCamera changes them for this client only), then the local markers of every resource. A new array on each read. */
    static readonly all: Array<Marker | { type: 22; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; markerType: number; scale: Vector3Like; rot: Vector3Like; dir: Vector3Like; color: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; streamingDistance: 0; rotate: false; bobUpAndDown: false; isGlobal: boolean; target: Player | null; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many markers Marker.all holds. */
    static readonly count: number;
    /** A local marker by its id (negative), else the server's by its id; null for none. */
    static get(id: number): Marker | { type: 22; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; markerType: number; scale: Vector3Like; rot: Vector3Like; dir: Vector3Like; color: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; streamingDistance: 0; rotate: false; bobUpAndDown: false; isGlobal: boolean; target: Player | null; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as Marker.get. */
    static getByID(id: number): Marker | { type: 22; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; markerType: number; scale: Vector3Like; rot: Vector3Like; dir: Vector3Like; color: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; streamingDistance: 0; rotate: false; bobUpAndDown: false; isGlobal: boolean; target: Player | null; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's marker with that id, as a plain object; null for none (local markers are not searched). */
    static getByRemoteID(id: number): { type: 22; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; markerType: number; scale: Vector3Like; rot: Vector3Like; dir: Vector3Like; color: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; streamingDistance: 0; rotate: false; bobUpAndDown: false; isGlobal: boolean; target: Player | null; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Bobs the marker up and down (DRAW_MARKER), false by default. The server's markers read false: the client draws them without bobbing. */
    bobUpAndDown: boolean;
    /** Colour, each component clamped to 0..255 and truncated; on assigning a missing r, g or b becomes 0 and a missing a 255, white by default. On the server's marker, assigning recolours it for this client only (a missing component kept, unclamped). */
    get color(): { r: number; g: number; b: number; a: number };
    set color(value: { r?: number; g?: number; b?: number; a?: number });
    /** Stops drawing the marker: valid turns false and baseObjectRemove fires; later calls do nothing. A resource's markers are destroyed when it stops, and the server's ones have no destroy. */
    destroy(): void;
    /** The dimension it is drawn in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated. On the server's marker, assigning moves it for this client only. */
    dimension: number;
    /** Direction vector passed to DRAW_MARKER, a copy, {0, 0, 0} by default; on assigning a missing or non-numeric component keeps its value. On the server's marker, assigning changes it for this client only. */
    get dir(): Vector3Like;
    set dir(value: Partial<Vector3Like>);
    /** Turns the marker to face the camera, false by default. On the server's marker, assigning changes it for this client only. */
    faceCamera: boolean;
    /** A local marker's id is negative and unique on this client; the server's markers have the server's id. */
    readonly id: number;
    /** True when no target player is set: always for a local marker, which only this client draws; on the server's marker, false when the server made it for a target (target then names that player). */
    readonly isGlobal: boolean;
    /** False for a local marker; the server's markers read true. */
    readonly isRemote: boolean;
    /** Whether it is drawn now: valid, visible, in the local player's dimension and, when made with streaming, within streamingDistance of the local player. The server's marker: while it is visible and in the local player's dimension (the client draws it at any distance). */
    readonly isStreamedIn: boolean;
    /** Marker type (MarkerType), truncated, drawn with DRAW_MARKER every frame. On the server's marker, assigning changes it for this client only (sent as markerType). */
    markerType: number;
    /** Where it is drawn, a copy; on assigning a missing or non-numeric component keeps its value. On the server's marker, assigning moves it for this client only, a missing component becoming 0. */
    get pos(): Vector3Like;
    set pos(value: Partial<Vector3Like>);
    /** The server's id of a marker of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** 0 for a local marker; the server's markers read their id, as remoteId. */
    readonly remoteID: number;
    /** Rotation in degrees passed to DRAW_MARKER, a copy, {0, 0, 0} by default; on assigning a missing or non-numeric component keeps its value. On the server's marker, assigning changes it for this client only. */
    get rot(): Vector3Like;
    set rot(value: Partial<Vector3Like>);
    /** Spins the marker (DRAW_MARKER), false by default. The server's markers read false: the client draws them without spinning. */
    rotate: boolean;
    /** Size on each axis, a copy, {1, 1, 1} by default for a local marker; on assigning a missing or non-numeric component keeps its value. On the server's marker, assigning changes it for this client only. */
    get scale(): Vector3Like;
    set scale(value: Partial<Vector3Like>);
    /** 0 for a marker made without streaming (drawn at any distance); with streaming, the distance from the local player within which it is drawn: as given, at least 1, 300 by default. The server's markers read 0: the client draws them at any distance. */
    readonly streamingDistance: number;
    /** Always null for a local marker; the server's markers return the player they were made for, or null. */
    readonly target: null;
    /** BaseObjectType.Marker (22). */
    readonly type: 22;
    /** True until destroy() or the stop of its resource. The server's markers are valid while this client keeps them. */
    readonly valid: boolean;
    /** Whether it is drawn, true by default. On the server's marker, assigning hides it for this client only. */
    visible: boolean;
}

export const MarkerType: {
    readonly MarkerArrow: any;
    readonly MarkerArrowFlat: any;
    readonly MarkerBeast: any;
    readonly MarkerBikeLogo1: any;
    readonly MarkerBikeLogo2: any;
    readonly MarkerBoxes: any;
    readonly MarkerChevron1: any;
    readonly MarkerChevron2: any;
    readonly MarkerChevron3: any;
    readonly MarkerCone: any;
    readonly MarkerCylinder: any;
    readonly MarkerFlag: any;
    readonly MarkerHalo: any;
    readonly MarkerHaloPoint: any;
    readonly MarkerHaloRotate: any;
    readonly MarkerLap: any;
    readonly MarkerLines: any;
    readonly MarkerMoney: any;
    readonly MarkerNum0: any;
    readonly MarkerNum1: any;
    readonly MarkerNum2: any;
    readonly MarkerNum3: any;
    readonly MarkerNum4: any;
    readonly MarkerNum5: any;
    readonly MarkerNum6: any;
    readonly MarkerNum7: any;
    readonly MarkerNum8: any;
    readonly MarkerNum9: any;
    readonly MarkerPitLane: any;
    readonly MarkerPlane: any;
    readonly MarkerQuestionMark: any;
    readonly MarkerRing: any;
    readonly MarkerRingFlag: any;
    readonly MarkerRingFlat: any;
    readonly MarkerSphere: any;
    readonly MarkerTransformBike: any;
    readonly MarkerTransformBoat: any;
    readonly MarkerTransformCar: any;
    readonly MarkerTransformHelicopter: any;
    readonly MarkerTransformParachute: any;
    readonly MarkerTransformPlane: any;
    readonly MarkerTransformPushBike: any;
    readonly MarkerTransformThruster: any;
    readonly MarkerTransformTruck: any;
    readonly MarkerWarp: any;
};

export class MemoryBuffer {
    /** A byte buffer of 0..1024 bytes. Reads use little-endian byte order. free() clears the bytes and invalidates the storage. */
    constructor(size: number);
    /** The signed 8-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    byte(offset: number): number | null;
    /** The bytes themselves: writing into the array changes the buffer. null after free(). */
    readonly data: Uint8Array | null;
    /** The little-endian 64-bit float at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    double(offset: number): number | null;
    /** The little-endian 32-bit float at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    float(offset: number): number | null;
    /** Zeroes the bytes and lets them go: data and every read return null afterwards. True the first time, false when already freed. */
    free(): boolean;
    /** The little-endian signed 32-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    int(offset: number): number | null;
    /** The little-endian signed 64-bit integer at offset, as a BigInt; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    long(offset: number): bigint | null;
    /** The little-endian signed 16-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    short(offset: number): number | null;
    /** The size in bytes given to the constructor (0..1024); free() does not change it. */
    readonly size: number;
    /** length bytes from offset decoded as UTF-8 (NUL bytes kept, invalid bytes as U+FFFD); null after free(). A negative or fractional offset or length, or a range past the end, throws a RangeError. */
    string(offset: number, length: number): string | null;
    /** The unsigned 8-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    ubyte(offset: number): number | null;
    /** The little-endian unsigned 32-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    uint(offset: number): number | null;
    /** The little-endian unsigned 64-bit integer at offset, as a BigInt; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    ulong(offset: number): bigint | null;
    /** The little-endian unsigned 16-bit integer at offset; null after free(). A negative or fractional offset, or one that reads past the end, throws a RangeError. */
    ushort(offset: number): number | null;
}

export const ModelType: {
    readonly AmphibiousAutomobile: any;
    readonly AmphibiousQuadBike: any;
    readonly Autogyro: any;
    readonly Automobile: any;
    readonly Bike: any;
    readonly Blimp: any;
    readonly Bmx: any;
    readonly Boat: any;
    readonly Heli: any;
    readonly Invalid: any;
    readonly Object: any;
    readonly Ped: any;
    readonly Plane: any;
    readonly QuadBike: any;
    readonly Submarine: any;
    readonly SubmarineCar: any;
    readonly Trailer: any;
    readonly Train: any;
};

export class Object {
    private constructor();
    /** The server's objects this client knows (old path), streamed in or not, as new objects on each read; LocalObjects are not included. */
    static readonly all: Object[];
    /** The number of Object.all. */
    static readonly count: number;
    /** The server's object with this id; null when this client does not know it. */
    static get(id: number): Object | null;
    /** The same as Object.get. */
    static getByID(id: number): Object | null;
    /** The same as Object.get: on the client the remote id is the server id. */
    static getByRemoteID(id: number): Object | null;
    /** The object with this GTA handle: a server object streamed to this client or a LocalObject this client made; null for any other handle. */
    static getByScriptID(scriptID: number): Object | LocalObject | null;
    /** Those of Object.all that exist in this client's GTA now. */
    static readonly streamedIn: Object[];
    /** Alpha 0–255: GET_ENTITY_ALPHA of its GTA object by the newest snapshot while it is streamed in, else the alpha the server set (255 by default). */
    readonly alpha: number;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Whether the server has its collision on, by the newest snapshot; true when the server sent none. */
    readonly collision: boolean;
    /** Removes the key from this client's own data on it (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Drops the key from this client's copy of its stream-synced data (setStreamSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Drops the key from this client's copy of its synced data (setSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteSyncedMetaData(key: string): void;
    /** Deletes its GTA entity on this client (DELETE_ENTITY) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    destroy(): Promise<boolean>;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** The dimension it is in, by the newest snapshot. */
    readonly dimension: number;
    /** Whether its GTA entity exists on this client: false while it has none here (not streamed in) and once the snapshots stop listing it; otherwise what the newest snapshot found (DOES_ENTITY_EXIST). */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Freezes (true) or releases its GTA entity on this client (FREEZE_ENTITY_POSITION); resolves false when it has no GTA entity here or GTA refused. The frozen property does not change. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Whether the server has it frozen, by the newest snapshot; false when the server sent none. */
    readonly frozen: boolean;
    /** The value setMeta stored under the key on this client, the same value that was stored; undefined for none. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own data on it (setMeta). */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves at once with speed: GET_ENTITY_SPEED in m/s by the newest snapshot, 0 while it is not streamed in. */
    getSpeedAsync(): Promise<number | null>;
    /** The same as getStreamSyncedMetaData: the server's stream-synced value under the key, decoded; undefined for none. */
    getStreamSyncedMeta(key: string): any;
    /** The value the server set as stream-synced data on it (setStreamSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. A value setStreamSyncedMetaData put here reads back as it was set. Cleared when the server streams the entity out of this client. */
    getStreamSyncedMetaData(key: string): any;
    /** The keys of the stream-synced data this client has for it. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** The same as getSyncedMetaData: the server's synced value under the key, decoded; undefined for none. */
    getSyncedMeta(key: string): any;
    /** The value the server set as synced data on it (setSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. */
    getSyncedMetaData(key: string): any;
    /** The keys of the synced data (setSyncedMeta on the server) this client has for it. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta: the server's synced value under the key, decoded; undefined for none. */
    getVariable(key: string): any;
    /** Whether this client's own data on it (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** The same as hasStreamSyncedMetaData. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Whether this client has stream-synced data under the key for it. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMetaData. */
    hasSyncedMeta(key: string): boolean;
    /** Whether this client has synced data (setSyncedMeta on the server) under the key for it. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** Its heading in degrees: rot.z by the newest snapshot. */
    readonly heading: number;
    /** Its server id, by which its class's get finds it. */
    readonly id: number;
    /** Whether it is dead: IS_ENTITY_DEAD by the newest snapshot while it has a GTA entity here; false otherwise. */
    readonly isDead: boolean;
    /** Resolves at once with isDead. */
    isDeadAsync(): Promise<boolean | null>;
    /** Always true: the server made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client (scriptID is not 0), by the newest snapshot. */
    readonly isSpawned: boolean;
    /** Whether the server streams it to this client and the newest snapshot did not find its GTA entity gone; false once the snapshots stop listing it. It may still wait for its GTA entity (see isSpawned). */
    readonly isStreamedIn: boolean;
    /** Its LOD distance as the server set it, by the newest snapshot, 0 included; 100 when the snapshot has none. */
    readonly lodDistance: number;
    /** A new plain object of this client's own data on it (setMeta) on each read. */
    readonly metaData: Record<string, any>;
    /** Its model hash as the server gave it. */
    readonly model: number;
    /** GET_ENTITY_MODEL of its GTA entity by the newest snapshot, unsigned; 0 while it is not streamed in. */
    readonly nativeModel: number;
    /** The player whose client simulates it (its network owner), by the newest snapshot; null for none. */
    readonly netOwner: PlayerLocal | Player | null;
    /** Its position by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of its GTA entity on this client (RESET_ENTITY_ALPHA); resolves false when it has no GTA entity here or GTA refused. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees (z is the heading) by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly rot: Vector3Like;
    /** Its GTA handle on this client by the newest snapshot; 0 while it has no GTA entity here and once the snapshots stop listing it. */
    readonly scriptID: number;
    /** Sets the alpha of its GTA entity on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false when it has no GTA entity here or GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of its GTA entity on or off on this client (SET_ENTITY_COLLISION); keepPhysics defaults to true. Resolves false when it has no GTA entity here or GTA refused. The collision property does not change. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Stores the value under the key on this client and fires metaChange; an object given alone sets each of its entries. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Moves its GTA entity on this client (SET_ENTITY_COORDS, clearing the area) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Turns its GTA entity on this client (SET_ENTITY_ROTATION, degrees, rotation order 2) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Puts the value under the key into this client's copy of its stream-synced data, read back as it was set, without an event. A client cannot change the server's data: nothing is sent, so the server and other clients never see it; a change of the key from the server overwrites it, and it is cleared when the server streams the entity out of this client. */
    setStreamSyncedMetaData(key: string, value: any): void;
    /** Shows or hides its GTA entity on this client with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false when it has no GTA entity here or GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Its speed in m/s: GET_ENTITY_SPEED by the newest snapshot; 0 while it is not streamed in. */
    readonly speed: number;
    /** Whether the server streams it to this client, by the newest snapshot; false once the snapshots stop listing it. */
    readonly streamed: boolean;
    /** A new plain object of the stream-synced data this client has for it on each read. */
    readonly streamSyncedMetaData: Record<string, any>;
    /** Its texture variation as the server set it, by the newest snapshot; 0 by default. */
    readonly textureVariation: number;
    /** Always 3 (BaseObjectType.Object). */
    readonly type: number;
    /** Whether this client still has it: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone; a kept object turns false once the snapshots stop listing it. */
    readonly valid: boolean;
    /** Whether it is visible: IS_ENTITY_VISIBLE by the newest snapshot while it is streamed in, else the server's setting (true when none was sent). */
    readonly visible: boolean;
}

export class Ped {
    private constructor();
    /** instanceof Ped holds for every Ped and every NativePed. */
    static [Symbol.hasInstance](value: unknown): value is Ped | NativePed;
    /** The peds of the old path this client knows, streamed in or not, then the native NPCs its GTA has now; LocalPeds are not included. */
    static readonly all: Array<Ped | NativePed>;
    /** The number of Ped.all. */
    static readonly count: number;
    /** A ped of the old path by its server id, else a native NPC by the id server scripts know it by; null when this client has neither. */
    static get(id: number): Ped | NativePed | null;
    /** The same as Ped.get. */
    static getByID(id: number): Ped | NativePed | null;
    /** The same as Ped.get: on the client the remote id is the server id. */
    static getByRemoteID(id: number): Ped | NativePed | null;
    /** The ped with this GTA handle: an old-path one streamed in, a LocalPed this client made or a native NPC; null for any other handle, a player's included. */
    static getByScriptID(scriptID: number): Ped | NativePed | LocalPed | null;
    /** Those of Ped.all that exist in this client's GTA now. */
    static readonly streamedIn: Array<Ped | NativePed>;
    /** Alpha 0–255 of its GTA entity (GET_ENTITY_ALPHA) by the newest snapshot; 255 while it is not streamed in. */
    readonly alpha: number;
    /** Its armour from its last sync, by the newest snapshot. */
    readonly armour: number;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Whether the server has its collision on, by the newest snapshot; true when the server sent none. */
    readonly collision: boolean;
    /** Hash of the weapon in its hands from its last sync, unsigned, by the newest snapshot; 0 when unknown. */
    readonly currentWeapon: number;
    /** Removes the key from this client's own data on it (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Drops the key from this client's copy of its stream-synced data (setStreamSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Drops the key from this client's copy of its synced data (setSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteSyncedMetaData(key: string): void;
    /** Deletes its GTA entity on this client (DELETE_ENTITY) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    destroy(): Promise<boolean>;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** The dimension it is in, by the newest snapshot. */
    readonly dimension: number;
    /** Whether its GTA entity exists on this client: false while it has none here (not streamed in) and once the snapshots stop listing it; otherwise what the newest snapshot found (DOES_ENTITY_EXIST). */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Freezes (true) or releases its GTA entity on this client (FREEZE_ENTITY_POSITION); resolves false when it has no GTA entity here or GTA refused. The frozen property does not change. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Whether the server has it frozen, by the newest snapshot; false when the server sent none. */
    readonly frozen: boolean;
    /** The value setMeta stored under the key on this client, the same value that was stored; undefined for none. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own data on it (setMeta). */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves at once with speed: GET_ENTITY_SPEED in m/s by the newest snapshot, 0 while it is not streamed in. */
    getSpeedAsync(): Promise<number | null>;
    /** The same as getStreamSyncedMetaData: the server's stream-synced value under the key, decoded; undefined for none. */
    getStreamSyncedMeta(key: string): any;
    /** The value the server set as stream-synced data on it (setStreamSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. A value setStreamSyncedMetaData put here reads back as it was set. Cleared when the server streams the entity out of this client. */
    getStreamSyncedMetaData(key: string): any;
    /** The keys of the stream-synced data this client has for it. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** The same as getSyncedMetaData: the server's synced value under the key, decoded; undefined for none. */
    getSyncedMeta(key: string): any;
    /** The value the server set as synced data on it (setSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. */
    getSyncedMetaData(key: string): any;
    /** The keys of the synced data (setSyncedMeta on the server) this client has for it. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta: the server's synced value under the key, decoded; undefined for none. */
    getVariable(key: string): any;
    /** Whether this client's own data on it (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** The same as hasStreamSyncedMetaData. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Whether this client has stream-synced data under the key for it. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMetaData. */
    hasSyncedMeta(key: string): boolean;
    /** Whether this client has synced data (setSyncedMeta on the server) under the key for it. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** Its heading in degrees: rot.z by the newest snapshot. */
    readonly heading: number;
    /** Its health from its last sync, by the newest snapshot. */
    readonly health: number;
    /** Its server id, by which its class's get finds it. */
    readonly id: number;
    /** Whether it is dead: IS_ENTITY_DEAD by the newest snapshot while it has a GTA entity here; false otherwise. */
    readonly isDead: boolean;
    /** Resolves at once with isDead. */
    isDeadAsync(): Promise<boolean | null>;
    /** Always false: a ped of the old path (a NativePed reads true). */
    readonly isNative: false;
    /** Always true: the server made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client (scriptID is not 0), by the newest snapshot. */
    readonly isSpawned: boolean;
    /** Whether the server streams it to this client and the newest snapshot did not find its GTA entity gone; false once the snapshots stop listing it. It may still wait for its GTA entity (see isSpawned). */
    readonly isStreamedIn: boolean;
    /** Its maximum health from its last sync, by the newest snapshot; 200 when none was sent. */
    readonly maxHealth: number;
    /** A new plain object of this client's own data on it (setMeta) on each read. */
    readonly metaData: Record<string, any>;
    /** Its model hash as the server gave it. */
    readonly model: number;
    /** GET_ENTITY_MODEL of its GTA entity by the newest snapshot, unsigned; 0 while it is not streamed in. */
    readonly nativeModel: number;
    /** The player whose client simulates it (its network owner), by the newest snapshot; null for none. */
    readonly netOwner: PlayerLocal | Player | null;
    /** Its position by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of its GTA entity on this client (RESET_ENTITY_ALPHA); resolves false when it has no GTA entity here or GTA refused. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees (z is the heading) by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly rot: Vector3Like;
    /** Its GTA handle on this client by the newest snapshot; 0 while it has no GTA entity here and once the snapshots stop listing it. */
    readonly scriptID: number;
    /** Sets the alpha of its GTA entity on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false when it has no GTA entity here or GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of its GTA entity on or off on this client (SET_ENTITY_COLLISION); keepPhysics defaults to true. Resolves false when it has no GTA entity here or GTA refused. The collision property does not change. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Stores the value under the key on this client and fires metaChange; an object given alone sets each of its entries. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Moves its GTA entity on this client (SET_ENTITY_COORDS, clearing the area) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Turns its GTA entity on this client (SET_ENTITY_ROTATION, degrees, rotation order 2) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Puts the value under the key into this client's copy of its stream-synced data, read back as it was set, without an event. A client cannot change the server's data: nothing is sent, so the server and other clients never see it; a change of the key from the server overwrites it, and it is cleared when the server streams the entity out of this client. */
    setStreamSyncedMetaData(key: string, value: any): void;
    /** Shows or hides its GTA entity on this client with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false when it has no GTA entity here or GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Its speed in m/s: GET_ENTITY_SPEED by the newest snapshot; 0 while it is not streamed in. */
    readonly speed: number;
    /** Whether the server streams it to this client, by the newest snapshot; false once the snapshots stop listing it. */
    readonly streamed: boolean;
    /** A new plain object of the stream-synced data this client has for it on each read. */
    readonly streamSyncedMetaData: Record<string, any>;
    /** Always 2 (BaseObjectType.Ped). */
    readonly type: number;
    /** Whether this client still has it: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone; a kept object turns false once the snapshots stop listing it. */
    readonly valid: boolean;
    /** Whether it is visible: IS_ENTITY_VISIBLE by the newest snapshot while it is streamed in, else the server's setting (true when none was sent). */
    readonly visible: boolean;
}

export const PedConfigFlag: {
    readonly "100": any;
    readonly "101": any;
    readonly "104": any;
    readonly "105": any;
    readonly "106": any;
    readonly "107": any;
    readonly "108": any;
    readonly "109": any;
    readonly "110": any;
    readonly "113": any;
    readonly "116": any;
    readonly "117": any;
    readonly "118": any;
    readonly "119": any;
    readonly "120": any;
    readonly "121": any;
    readonly "122": any;
    readonly "123": any;
    readonly "124": any;
    readonly "125": any;
    readonly "126": any;
    readonly "127": any;
    readonly "128": any;
    readonly "129": any;
    readonly "13": any;
    readonly "130": any;
    readonly "131": any;
    readonly "132": any;
    readonly "133": any;
    readonly "134": any;
    readonly "135": any;
    readonly "136": any;
    readonly "137": any;
    readonly "138": any;
    readonly "139": any;
    readonly "140": any;
    readonly "141": any;
    readonly "144": any;
    readonly "145": any;
    readonly "146": any;
    readonly "147": any;
    readonly "148": any;
    readonly "150": any;
    readonly "151": any;
    readonly "152": any;
    readonly "153": any;
    readonly "154": any;
    readonly "155": any;
    readonly "156": any;
    readonly "157": any;
    readonly "159": any;
    readonly "166": any;
    readonly "167": any;
    readonly "169": any;
    readonly "17": any;
    readonly "170": any;
    readonly "171": any;
    readonly "172": any;
    readonly "173": any;
    readonly "174": any;
    readonly "177": any;
    readonly "179": any;
    readonly "18": any;
    readonly "180": any;
    readonly "181": any;
    readonly "182": any;
    readonly "183": any;
    readonly "184": any;
    readonly "185": any;
    readonly "186": any;
    readonly "187": any;
    readonly "188": any;
    readonly "189": any;
    readonly "193": any;
    readonly "194": any;
    readonly "195": any;
    readonly "199": any;
    readonly "2": any;
    readonly "200": any;
    readonly "202": any;
    readonly "203": any;
    readonly "204": any;
    readonly "205": any;
    readonly "206": any;
    readonly "208": any;
    readonly "209": any;
    readonly "210": any;
    readonly "211": any;
    readonly "212": any;
    readonly "213": any;
    readonly "214": any;
    readonly "215": any;
    readonly "216": any;
    readonly "217": any;
    readonly "220": any;
    readonly "221": any;
    readonly "223": any;
    readonly "224": any;
    readonly "225": any;
    readonly "226": any;
    readonly "227": any;
    readonly "229": any;
    readonly "230": any;
    readonly "236": any;
    readonly "237": any;
    readonly "24": any;
    readonly "240": any;
    readonly "241": any;
    readonly "242": any;
    readonly "243": any;
    readonly "244": any;
    readonly "245": any;
    readonly "246": any;
    readonly "248": any;
    readonly "249": any;
    readonly "250": any;
    readonly "251": any;
    readonly "252": any;
    readonly "253": any;
    readonly "255": any;
    readonly "257": any;
    readonly "261": any;
    readonly "264": any;
    readonly "268": any;
    readonly "269": any;
    readonly "270": any;
    readonly "272": any;
    readonly "273": any;
    readonly "275": any;
    readonly "276": any;
    readonly "279": any;
    readonly "281": any;
    readonly "282": any;
    readonly "285": any;
    readonly "286": any;
    readonly "287": any;
    readonly "288": any;
    readonly "29": any;
    readonly "292": any;
    readonly "294": any;
    readonly "296": any;
    readonly "299": any;
    readonly "3": any;
    readonly "301": any;
    readonly "302": any;
    readonly "305": any;
    readonly "310": any;
    readonly "311": any;
    readonly "312": any;
    readonly "314": any;
    readonly "315": any;
    readonly "317": any;
    readonly "318": any;
    readonly "32": any;
    readonly "320": any;
    readonly "321": any;
    readonly "322": any;
    readonly "324": any;
    readonly "326": any;
    readonly "327": any;
    readonly "328": any;
    readonly "329": any;
    readonly "33": any;
    readonly "330": any;
    readonly "331": any;
    readonly "332": any;
    readonly "339": any;
    readonly "34": any;
    readonly "342": any;
    readonly "345": any;
    readonly "347": any;
    readonly "348": any;
    readonly "349": any;
    readonly "35": any;
    readonly "350": any;
    readonly "356": any;
    readonly "357": any;
    readonly "358": any;
    readonly "359": any;
    readonly "36": any;
    readonly "360": any;
    readonly "361": any;
    readonly "362": any;
    readonly "363": any;
    readonly "364": any;
    readonly "365": any;
    readonly "366": any;
    readonly "372": any;
    readonly "373": any;
    readonly "374": any;
    readonly "375": any;
    readonly "380": any;
    readonly "388": any;
    readonly "389": any;
    readonly "39": any;
    readonly "391": any;
    readonly "392": any;
    readonly "394": any;
    readonly "395": any;
    readonly "396": any;
    readonly "397": any;
    readonly "398": any;
    readonly "399": any;
    readonly "4": any;
    readonly "400": any;
    readonly "401": any;
    readonly "402": any;
    readonly "404": any;
    readonly "407": any;
    readonly "408": any;
    readonly "409": any;
    readonly "410": any;
    readonly "411": any;
    readonly "412": any;
    readonly "413": any;
    readonly "414": any;
    readonly "415": any;
    readonly "416": any;
    readonly "417": any;
    readonly "418": any;
    readonly "419": any;
    readonly "42": any;
    readonly "421": any;
    readonly "422": any;
    readonly "423": any;
    readonly "424": any;
    readonly "426": any;
    readonly "427": any;
    readonly "428": any;
    readonly "429": any;
    readonly "43": any;
    readonly "430": any;
    readonly "431": any;
    readonly "432": any;
    readonly "433": any;
    readonly "434": any;
    readonly "435": any;
    readonly "436": any;
    readonly "437": any;
    readonly "438": any;
    readonly "44": any;
    readonly "441": any;
    readonly "442": any;
    readonly "443": any;
    readonly "444": any;
    readonly "445": any;
    readonly "446": any;
    readonly "447": any;
    readonly "448": any;
    readonly "449": any;
    readonly "45": any;
    readonly "450": any;
    readonly "451": any;
    readonly "452": any;
    readonly "453": any;
    readonly "454": any;
    readonly "456": any;
    readonly "457": any;
    readonly "458": any;
    readonly "47": any;
    readonly "48": any;
    readonly "52": any;
    readonly "58": any;
    readonly "59": any;
    readonly "60": any;
    readonly "61": any;
    readonly "62": any;
    readonly "63": any;
    readonly "64": any;
    readonly "65": any;
    readonly "66": any;
    readonly "67": any;
    readonly "68": any;
    readonly "69": any;
    readonly "7": any;
    readonly "70": any;
    readonly "71": any;
    readonly "72": any;
    readonly "73": any;
    readonly "75": any;
    readonly "76": any;
    readonly "78": any;
    readonly "93": any;
    readonly "97": any;
    readonly ActivateRagdollFromMinorPlayerContact: any;
    readonly AICanDrivePlayerAsRearPassenger: any;
    readonly AIDriverAllowFriendlyPassengerSeatEntry: any;
    readonly AllowAutoShuffleToDriversSeat: any;
    readonly AllowContinuousThreatResponseWantedLevelUpdates: any;
    readonly AllowedToDetachTrailer: any;
    readonly AllowLockonToFriendlyPlayers: any;
    readonly AllowMeleeReactionIfMeleeProofIsOn: any;
    readonly AllowMissionPedToUseInjuredMovement: any;
    readonly AllowNearbyCoverUsage: any;
    readonly AllowPlayerToInterruptVehicleEntryExit: any;
    readonly AllowTaskDoNothingTimeslicing: any;
    readonly AllowToBeTargetedInAVehicle: any;
    readonly Alpha: any;
    readonly AlwaysLeaveTrainUponArrival: any;
    readonly AlwaysRespondToCriesForHelp: any;
    readonly AlwaysSeeApproachingVehicles: any;
    readonly ArrestResult: any;
    readonly AttachedToVehicle: any;
    readonly AvoidanceIgnoreAll: any;
    readonly AvoidanceIgnoredByAll: any;
    readonly AvoidanceIgnoreGroup1: any;
    readonly AvoidanceIgnoreWeirdPedBuffer: any;
    readonly AvoidanceMemberOfGroup1: any;
    readonly AvoidTearGas: any;
    readonly BeingDeleted: any;
    readonly BlockAutoSwapOnWeaponPickups: any;
    readonly BlockDispatchedHelicoptersFromLanding: any;
    readonly BlockDroppingHealthSnacksOnDeath: any;
    readonly BlockNonTemporaryEvents: any;
    readonly BlockPedFromTurningInCover: any;
    readonly BlocksPathingWhenDead: any;
    readonly BlockWeaponSwitching: any;
    readonly BroadcastRepondedToThreatWhenGoingToPointShooting: any;
    readonly BumpedByPlayer: any;
    readonly CanActivateRagdollWhenVehicleUpsideDown: any;
    readonly CanAttackFriendly: any;
    readonly CanAttackNonWantedPlayerAsLaw: any;
    readonly CanBeAgitated: any;
    readonly CanBeArrested: any;
    readonly CanBeIncapacitated: any;
    readonly CanDiveAwayFromApproachingVehicles: any;
    readonly CanFlyThruWindscreen: any;
    readonly CanPerformArrest: any;
    readonly CanPerformUncuff: any;
    readonly CanPlayInCarIdles: any;
    readonly CanPunch: any;
    readonly CanSayFollowedByPlayerAudio: any;
    readonly CheckLockedBeforeWarp: any;
    readonly CheckLoSForSoundEvents: any;
    readonly ClimbedShiftedFence: any;
    readonly CowerInsteadOfFlee: any;
    readonly DiesWhenRagdoll: any;
    readonly DisableAutoEquipHelmetsInBikes: any;
    readonly DisableBlindFiringInShotReactions: any;
    readonly DisableBloodPoolCreation: any;
    readonly DisableClosingVehicleDoor: any;
    readonly DisableDeepSurfaceAnims: any;
    readonly DisableEvasiveDives: any;
    readonly DisableEventInteriorStatusCheck: any;
    readonly DisableExitToSkyDive: any;
    readonly DisableExplosionReactions: any;
    readonly DisableForcedEntryForOpenVehiclesFromTryLockedDoor: any;
    readonly DisableHelmetArmor: any;
    readonly DisableHomingMissileLockForVehiclePedInside: any;
    readonly DisableHomingMissileLockon: any;
    readonly DisableHurt: any;
    readonly DisableInjuredCryForHelpEvents: any;
    readonly DisableJumpingFromVehiclesAfterLeader: any;
    readonly DisableLadderClimbing: any;
    readonly DisableLockonToRandomPeds: any;
    readonly DisableMelee: any;
    readonly DisablePanicInVehicle: any;
    readonly DisablePedAvoidance: any;
    readonly DisablePedConstraints: any;
    readonly DisablePlayerLockon: any;
    readonly DisablePoliceInvestigatingBody: any;
    readonly DisablePotentialToBeWalkedIntoResponse: any;
    readonly DisablePropKnockOff: any;
    readonly DisableReticuleFixedLockon: any;
    readonly DisableShockingDrivingOnPavementEvents: any;
    readonly DisableShockingEvents: any;
    readonly DisableStartingVehicleEngine: any;
    readonly DisableStoppingVehicleEngine: any;
    readonly DisableTakeOffScubaGear: any;
    readonly DisableTalkTo: any;
    readonly DisableTurretOrRearSeatPreference: any;
    readonly DisableUnarmedDrivebys: any;
    readonly DisableVehicleCombat: any;
    readonly DisableWantedHelicopterSpawning: any;
    readonly DisableWeirdPedEvents: any;
    readonly DisableWritheShootFromGround: any;
    readonly DodgedPlayer: any;
    readonly DoNothingWhenOnFootByDefault: any;
    readonly DontActivateRagdollFromBulletImpact: any;
    readonly DontActivateRagdollFromElectrocution: any;
    readonly DontActivateRagdollFromExplosions: any;
    readonly DontActivateRagdollFromFire: any;
    readonly DontActivateRagdollFromVehicleImpact: any;
    readonly DontActivateRagdollOnVehicleCollisionWhenDead: any;
    readonly DontBehaveLikeLaw: any;
    readonly DontBlip: any;
    readonly DontBlipCop: any;
    readonly DontBlipNotSynced: any;
    readonly DontChangeTargetFromMelee: any;
    readonly DontClearLocalPassengersWantedLevel: any;
    readonly DontCryForHelpOnStun: any;
    readonly DontDropJetpackOnDeath: any;
    readonly DontEnterLeadersVehicle: any;
    readonly DontEnterVehiclesInPlayersGroup: any;
    readonly DontHitVehicleWithProjectiles: any;
    readonly DontInfluenceWantedLevel: any;
    readonly DontLeaveCombatIfTargetPlayerIsAttackedByPolice: any;
    readonly DontLeaveVehicleIfLeaderNotInVehicle: any;
    readonly DontRespondToRandomPedsDamage: any;
    readonly DontShoutTargetPosition: any;
    readonly DontShuffleInVehicleToMakeRoom: any;
    readonly DontTakeOffHelmet: any;
    readonly DrownsInWater: any;
    readonly EdgeDetected: any;
    readonly EnableWeaponBlocking: any;
    readonly EquipJetpack: any;
    readonly FallsLikeAircraft: any;
    readonly FiresDummyRockets: any;
    readonly FlamingFootprints: any;
    readonly ForceBlipSecurityPedsIfPlayerIsWanted: any;
    readonly ForcedAim: any;
    readonly ForceDeepSurfaceCheck: any;
    readonly ForcedToStayInCover: any;
    readonly ForcedToUseSpecificGroupSeatIndex: any;
    readonly ForceExitToSkyDive: any;
    readonly ForceHelmetVisorSwitch: any;
    readonly ForceIgnoreMaxMeleeActiveSupportCombatants: any;
    readonly ForceInitialPeekInCover: any;
    readonly ForcePedLoadCover: any;
    readonly ForcePedToBeDragged: any;
    readonly ForcePedToFaceLeftInCover: any;
    readonly ForcePedToFaceRightInCover: any;
    readonly ForcePoseCharacterCloth: any;
    readonly ForceRagdollUponDeath: any;
    readonly ForceReload: any;
    readonly ForceSkinCharacterCloth: any;
    readonly ForceStandardBumpReactionThresholds: any;
    readonly ForceThreatResponseToNonFriendToFriendMeleeActions: any;
    readonly FreezePosition: any;
    readonly GeneratesSoundEvents: any;
    readonly GetOutBurningVehicle: any;
    readonly GetOutUndriveableVehicle: any;
    readonly GiveWeaponOnGetup: any;
    readonly GoOnWithoutVehicleIfItIsUnableToGetBackToRoad: any;
    readonly HasBareFeet: any;
    readonly HasBeenInArmedCombat: any;
    readonly HasBrandishedWeapon: any;
    readonly HasClothCollisionBounds: any;
    readonly HasEstablishedDecoy: any;
    readonly HasHelmet: any;
    readonly HasHighHeels: any;
    readonly HasHurtStarted: any;
    readonly HasReserveParachute: any;
    readonly IgnoreBeingOnFire: any;
    readonly IgnoredByAutoOpenDoors: any;
    readonly IgnoreInteriorCheckForSprinting: any;
    readonly IgnoreLegIkRestrictions: any;
    readonly IgnoreNetSessionFriendlyFireCheckForAllowDamage: any;
    readonly IgnorePedTypeForIsFriendlyWith: any;
    readonly IgnoreSeenMelee: any;
    readonly InVehicle: any;
    readonly IsAgitated: any;
    readonly IsAimingGun: any;
    readonly IsAnkleCuffed: any;
    readonly IsArresting: any;
    readonly IsClimbingLadder: any;
    readonly IsDecoyPed: any;
    readonly IsDrunk: any;
    readonly IsDuckingInVehicle: any;
    readonly IsHandCuffed: any;
    readonly IsHoldingProp: any;
    readonly IsHolsteringWeapon: any;
    readonly IsInCluster: any;
    readonly IsInCustody: any;
    readonly IsInjured: any;
    readonly IsInjured2: any;
    readonly IsInTheAir: any;
    readonly IsNotRagdollAndNotPlayingAnim: any;
    readonly IsOnGround: any;
    readonly IsOnStairs: any;
    readonly IsScuba: any;
    readonly IsShooting: any;
    readonly IsSitting: any;
    readonly IsSkiing: any;
    readonly IsSniperScopeActive: any;
    readonly IsSwimming: any;
    readonly IsSwitchingHelmetVisor: any;
    readonly IsSwitchingWeapon: any;
    readonly JustGetsPulledOutWhenElectrocuted: any;
    readonly KeepRelationshipGroupAfterCleanUp: any;
    readonly KeepTargetLossResponseOnCleanup: any;
    readonly KeepWeaponHolsteredUnlessFired: any;
    readonly KilledByStealth: any;
    readonly KilledByTakedown: any;
    readonly KillWhenTrapped: any;
    readonly Knockedout: any;
    readonly LawPedsCanFleeFromNonWantedPlayer: any;
    readonly LawWillOnlyAttackIfPlayerIsWanted: any;
    readonly ListensToSoundEvents: any;
    readonly LowerPriorityOfWarpSeats: any;
    readonly MeleeCombat: any;
    readonly MutableForcedAim: any;
    readonly NeverLeavesGroup: any;
    readonly NeverLeaveTrain: any;
    readonly NeverReactToPedOnRoof: any;
    readonly NmMessage466: any;
    readonly NoCollision: any;
    readonly NoCriticalHits: any;
    readonly NoPedMelee: any;
    readonly NotAllowedToJackAnyPlayers: any;
    readonly NoWrithe: any;
    readonly OnlyAttackLawIfPlayerIsWanted: any;
    readonly OnlyRequireOnePressToExitVehicle: any;
    readonly OnlyUpdateTargetWantedIfSeen: any;
    readonly OnlyUseForcedSeatWhenEnteringHeliInGroup: any;
    readonly OnlyWritheFromWeaponDamage: any;
    readonly OnMount: any;
    readonly OnStairSlope: any;
    readonly PedIgnoresAnimInterruptEvents: any;
    readonly PedsJackingMeDontGetIn: any;
    readonly PhoneDisableCameraAnimations: any;
    readonly PhoneDisableTalkingAnimations: any;
    readonly PhoneDisableTextingAnimations: any;
    readonly PlayerCanJackFriendlyPlayers: any;
    readonly PlayerIsWeird: any;
    readonly PlayerPreferFrontSeatMP: any;
    readonly PlayersDontDragMeOutOfCar: any;
    readonly PreventAllMeleeTaunts: any;
    readonly PreventAutoShuffleToDriversSeat: any;
    readonly PreventAutoShuffleToTurretSeat: any;
    readonly PreventDraggedOutOfCarThreatResponse: any;
    readonly PreventPedFromReactingToBeingJacked: any;
    readonly PreventReactingToSilencedCloneBullets: any;
    readonly PreventUsingLowerPrioritySeats: any;
    readonly PreventVehExitDueToInvalidWeapon: any;
    readonly PutOnMotorcycleHelmet: any;
    readonly RagdollingOnBoat: any;
    readonly RemoveDeadExtraFarAway: any;
    readonly RidingTrain: any;
    readonly RunFromFiresAndExplosions: any;
    readonly ShootingAnimFlag: any;
    readonly ShouldChargeNow: any;
    readonly ShouldFixIfNoCollision: any;
    readonly ShoutToGroupOnPlayerMelee: any;
    readonly Shrink: any;
    readonly SlopeDetected: any;
    readonly StairsDetected: any;
    readonly StayInDefensiveAreaWhenInVehicle: any;
    readonly SuperDead: any;
    readonly SwatHeliSpawnWithinLastSpottedLocation: any;
    readonly TeleportToLeaderVehicle: any;
    readonly ThisPedIsATargetPriorityForAI: any;
    readonly TreatAsPlayerDuringTargeting: any;
    readonly TreatDislikeAsHateWhenInCombat: any;
    readonly TreatNonFriendlyAsHateWhenInCombat: any;
    readonly UpperBodyDamageAnimsOnly: any;
    readonly UseGoToPointForScenarioNavigation: any;
    readonly UseKinematicModeWhenStationary: any;
    readonly UseLockpickVehicleEntryAnimations: any;
    readonly UseNormalExplosionDamageWhenBlownUpInVehicle: any;
    readonly UseReserveParachute: any;
    readonly UseSloMoBloodVfx: any;
    readonly UseTargetPerceptionForCreatingAimedAtEvents: any;
    readonly UsingCoverPoint: any;
    readonly UsingScenario: any;
    readonly VaultFromCover: any;
    readonly VisibleOnScreen: any;
    readonly WaitForDirectEntryPointToBeFreeWhenExiting: any;
    readonly WaitingForPlayerControlInterrupt: any;
    readonly WasOnGround: any;
    readonly WasShooting: any;
    readonly WasSwimming: any;
    readonly WillArrestRatherThanJack: any;
    readonly WillCommandeerRatherThanJack: any;
    readonly WillJackAnyPlayer: any;
    readonly WillJackWantedPlayersRatherThanStealCar: any;
    readonly WillNotHotwireLawEnforcementVehicle: any;
    readonly WillTakeDamageWhenVehicleCrashes: any;
};

export const Permission: {
    readonly All: any;
    readonly Clipboard: any;
    readonly Microphone: any;
    readonly None: any;
    readonly ScreenCapture: any;
    readonly WebRTC: any;
};

export const PermissionState: {
    readonly Allowed: any;
    readonly Denied: any;
    readonly Failed: any;
    readonly Unspecified: any;
};

export class Player {
    private constructor();
    /** The local player first (once it has an id), then every other player in this client's snapshot; on the native path only those whose ped is in GTA. Each read makes new objects that keep the snapshot of that moment. */
    static readonly all: Array<Player | PlayerLocal>;
    /** The number of Player.all. */
    static readonly count: number;
    /** Player.local for its id, else a new Player for this player; null when this client has no such player. The object follows the player: later snapshots show in it, and valid turns false once the snapshots stop listing the player. */
    static get(id: number): Player | PlayerLocal | null;
    /** The same as Player.get. */
    static getByID(id: number): Player | PlayerLocal | null;
    /** The same as Player.get: on the client the remote id is the server id. */
    static getByRemoteID(id: number): Player | PlayerLocal | null;
    /** The player whose ped has this GTA handle: the local player or a streamed-in remote one; null for any other handle. */
    static getByScriptID(scriptID: number): Player | PlayerLocal | null;
    /** The local player: always the same object, its values updated every 50 ms while in the game. */
    static readonly local: PlayerLocal;
    /** The remote players of Player.all streamed in on this client; the local player is not included. */
    static readonly streamedIn: Player[];
    /** Where the player aims, from the newest snapshot: the point their client reports while they aim or shoot, {0, 0, 0} otherwise. Always {0, 0, 0} on the native path: its snapshot item does not carry it, and no native reads another player's aim. */
    readonly aimPos: Vector3Like;
    /** The alpha of the player's ped (GET_ENTITY_ALPHA, 0..255) by the newest snapshot; 255 when the ped is not in GTA. */
    readonly alpha: number;
    /** Armour by the newest snapshot: the synced value on the old path, the ped's GET_PED_ARMOUR on the native path; 0 when the snapshot has none. */
    readonly armour: number;
    /** Attaches the player's ped in this client's GTA to a bone of another entity (an object with scriptID, or a GTA handle) with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** The server's collision flag for the player by the newest snapshot; true when the server sent none. */
    readonly collision: boolean;
    /** Ammo of the weapon in hand: on the old path as the player's client reports it, from the newest snapshot; on the native path GET_AMMO_IN_PED_WEAPON of GTA's copy of the ped on each read while in the game. */
    readonly currentAmmo: number;
    /** The hash of the weapon in hand: on the old path from the newest snapshot, on the native path GET_SELECTED_PED_WEAPON of GTA's copy of the ped on each read while in the game. */
    readonly currentWeapon: number;
    /** Component hashes of the weapon in hand, a new array on each read: on the old path from the newest snapshot; on the native path which of eight common attachments (suppressors, flashlights, scopes) GTA's copy of the ped has, read while in the game. hasWeaponComponent asks GTA about any component. */
    readonly currentWeaponComponents: number[];
    /** The tint of the weapon in hand: on the old path from the newest snapshot, on the native path GET_PED_WEAPON_TINT_INDEX of GTA's copy of the ped on each read while in the game. */
    readonly currentWeaponTintIndex: number;
    /** Removes a key of this client's own metadata of the player (setMeta) and fires metaChange (player, key, undefined, old value); a missing key does nothing. */
    deleteMeta(key: string): void;
    /** Removes the key from this client's copy of the player's stream-synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Removes the key from this client's copy of the player's synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteSyncedMetaData(key: string): void;
    /** Resolves false and warns: a remote player's ped cannot be deleted from the client. */
    destroy(): Promise<boolean>;
    /** Detaches the player's ped in this client's GTA (DETACH_ENTITY, dynamic and with collision); resolves true once the call ran, false without a ped or when it failed. */
    detach(): Promise<boolean>;
    /** The player's dimension by the newest snapshot. On the native path it is the one of their stream-in (a change that keeps them visible is not seen), 0 without one. */
    readonly dimension: number;
    /** The entity the player aims at, from the newest snapshot: the one this client knows by that id, null for none. Always null on the native path: its snapshot item does not carry it. */
    readonly entityAimingAt: Player | PlayerLocal | Vehicle | Ped | Object | VirtualEntity | null;
    /** aimPos minus the position of entityAimingAt, from the newest snapshot; {0, 0, 0} without a target, and always on the native path, whose snapshot item carries no aim. */
    readonly entityAimOffset: Vector3Like;
    /** Whether this client's GTA has the player's ped: a ped handle that the newest snapshot found existing (DOES_ENTITY_EXIST); false while the player is not streamed in and once the snapshots stop listing them. */
    exists(): boolean;
    /** Asks GTA now whether the ped of this object's handle exists (DOES_ENTITY_EXIST): false without a handle, null when the game does not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** The voice filter this client applies to the player (getVoiceFilter); assigning an AudioFilter or its hash sets it (addVoiceFilter), null removes it. */
    get filter(): AudioFilter | null;
    set filter(value: AudioFilter | number | null);
    /** Whether the player's weapon flashlight is on: on the old path from the newest snapshot, on the native path IS_FLASH_LIGHT_ON of GTA's copy of the ped on each read while in the game. */
    readonly flashlightActive: boolean;
    /** How the player moves: 0 still, 1 walking, 2 running, 3 sprinting; not a speed (the server's forwardSpeed carries the same value). On the old path as their client reports it, from the newest snapshot; on the native path read from GTA's copy of the ped while in the game (IS_PED_SPRINTING, IS_PED_RUNNING, IS_PED_WALKING, else from its speed). */
    readonly forwardSpeed: number;
    /** Freezes or unfreezes the player's ped in this client's GTA (FREEZE_ENTITY_POSITION); resolves true once the call ran, false without a ped or when it failed. frozen does not change: it is the server's flag. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** The server's frozen flag for the player by the newest snapshot; false when the server sent none. freezePosition does not change it. */
    readonly frozen: boolean;
    /** A value of this client's own metadata of the player (setMeta) as it was set; undefined for none. Kept while the player stays in this client's snapshot; dropped when they leave it or the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own metadata of the player (setMeta); getMetaKeys is the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves speed at once (by the newest snapshot); it does not ask GTA. */
    getSpeedAsync(): Promise<number>;
    /** A value of the player's stream-synced metadata (setStreamSyncedMeta on the server), server references turned into this client's objects; undefined for none. Lost when the player leaves this client's snapshot. */
    getStreamSyncedMeta(key: string): any;
    /** The same as getStreamSyncedMeta. */
    getStreamSyncedMetaData(key: string): any;
    /** The keys of the player's stream-synced metadata on this client; getStreamSyncedMetaKeys is the same. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** A value of the player's synced metadata (setSyncedMeta on the server), server references turned into this client's objects; undefined for none. Kept while the player is out of streaming range. Emptied when the session ends. */
    getSyncedMeta(key: string): any;
    /** The same as getSyncedMeta. */
    getSyncedMetaData(key: string): any;
    /** The keys of the player's synced metadata on this client. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta. */
    getVariable(key: string): any;
    /** currentWeaponTintIndex when the weapon (a hash or name) is the one in hand, else 0. */
    getWeaponTintIndex(weapon: number | string): number;
    /** Whether this client's own metadata of the player (setMeta) has the key. */
    hasMeta(key: string): boolean;
    /** Whether the player's stream-synced metadata has the key on this client. */
    hasStreamSyncedMeta(key: string): boolean;
    /** The same as hasStreamSyncedMeta. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether the player's synced metadata has the key on this client. */
    hasSyncedMeta(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** Whether the weapon (a hash or name) is the one in hand and has the component (a hash or name): on the old path whether currentWeaponComponents lists it; on the native path HAS_PED_GOT_WEAPON_COMPONENT of GTA's copy of the ped while in the game, for any component. */
    hasWeaponComponent(weapon: number | string, component: number | string): boolean;
    /** The z rotation in degrees by the newest snapshot; 0 without one. */
    readonly heading: number;
    /** The rotation of the player's camera while they aim or shoot, as their client reports it, from the newest snapshot; {0, 0, 0} otherwise. Not the head: the name comes with what the wire carries. Always {0, 0, 0} on the native path: its snapshot item does not carry it. */
    readonly headRot: Vector3Like;
    /** Health by the newest snapshot: the synced value on the old path, the ped's GET_ENTITY_HEALTH on the native path; 0 when the snapshot has none. */
    readonly health: number;
    /** The player's server id; after this player leaves a new one may get the same id. */
    readonly id: number;
    /** Whether the server made the player invincible, from the newest snapshot; false until the server's vitals of the player have reached this client. */
    readonly invincible: boolean;
    /** Whether the player aims or shoots: on the old path as their client reports it, from the newest snapshot; on the native path an on-foot aim task (GET_IS_TASK_ACTIVE 4) or IS_PED_SHOOTING of GTA's copy of the ped on each read while in the game. */
    readonly isAiming: boolean;
    /** Whether the player crouches, which in GTA is stealth movement (the same as isStealthy): on the old path as their client reports it, from the newest snapshot; on the native path GET_PED_STEALTH_MOVEMENT of GTA's copy of the ped on each read while in the game. */
    readonly isCrouching: boolean;
    /** Whether the player's ped is dead (IS_ENTITY_DEAD) by the newest snapshot; without a ped, the dead state flag, which the native path does not carry. */
    readonly isDead: boolean;
    /** Resolves isDead at once; it does not ask GTA. */
    isDeadAsync(): Promise<boolean>;
    /** Whether the player is getting into a vehicle: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_GETTING_INTO_A_VEHICLE of GTA's copy of the ped on each read while in the game. */
    readonly isEnteringVehicle: boolean;
    /** Whether the player is in cover: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_IN_COVER of GTA's copy of the ped on each read while in the game. */
    readonly isInCover: boolean;
    /** Whether the player is in melee combat: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_IN_MELEE_COMBAT or IS_PED_PERFORMING_MELEE_ACTION of GTA's copy of the ped on each read while in the game. */
    readonly isInMelee: boolean;
    /** Whether the player is in ragdoll: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_RAGDOLL or IS_PED_RUNNING_RAGDOLL_TASK of GTA's copy of the ped on each read while in the game. */
    readonly isInRagdoll: boolean;
    /** Whether the player is jumping: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_JUMPING of GTA's copy of the ped on each read while in the game. */
    readonly isJumping: boolean;
    /** Whether the player is getting out of a vehicle: on the old path as their client reports it, from the newest snapshot; on the native path an exit task in a vehicle (GET_IS_TASK_ACTIVE 2 or 167) or IS_PED_JUMPING_OUT_OF_VEHICLE of GTA's copy of the ped on each read while in the game. */
    readonly isLeavingVehicle: boolean;
    /** Whether the player is climbing (IS_PED_CLIMBING, so climbing over a fence or wall counts too): on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_CLIMBING of GTA's copy of the ped on each read while in the game. */
    readonly isOnLadder: boolean;
    /** Whether the player is in free fall or under a parachute: on the old path as their client reports it, from the newest snapshot; on the native path GET_PED_PARACHUTE_STATE 0–2 of GTA's copy of the ped on each read while in the game. */
    readonly isParachuting: boolean;
    /** Whether the player is reloading: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_RELOADING of GTA's copy of the ped on each read while in the game. */
    readonly isReloading: boolean;
    /** False for the local player (Player.local), true for every other player. */
    readonly isRemote: boolean;
    /** Whether the player is shooting: on the old path as their client reports it, from the newest snapshot; on the native path IS_PED_SHOOTING of GTA's copy of the ped on each read while in the game. */
    readonly isShooting: boolean;
    /** Whether the player's ped is in this client's GTA (scriptID is not 0), by the newest snapshot. */
    readonly isSpawned: boolean;
    /** Whether the player moves in stealth mode: on the old path as their client reports it, from the newest snapshot; on the native path GET_PED_STEALTH_MOVEMENT of GTA's copy of the ped on each read while in the game. */
    readonly isStealthy: boolean;
    /** Whether the player is in streaming range of this client by the newest snapshot and their ped was not found gone; false once the snapshots stop listing the player. */
    readonly isStreamedIn: boolean;
    /** Whether this client hears the player talking now (a voice frame within the last 450 ms), updated with each snapshot. */
    readonly isTalking: boolean;
    /** The player's maximum armour from the newest snapshot, as the server set it; 100 until the server's vitals of the player have reached this client. */
    readonly maxArmour: number;
    /** The player's maximum health from the newest snapshot, as the server set it. Before the server's vitals of the player reach this client: 200 on the old path, and on the native path GET_ENTITY_MAX_HEALTH of GTA's copy of the ped, read on each access while in the game. */
    readonly maxHealth: number;
    /** A new plain object of this client's own metadata of the player (setMeta) on each read. */
    readonly metaData: Record<string, any>;
    /** The loudness 0..1 of the player's last voice frame this client got, 0 when none came within 150 ms; updated with each snapshot. */
    readonly micLevel: number;
    /** The player's model hash by the newest snapshot (on the native path, the model of their ped). */
    readonly model: number;
    /** The player's speed in m/s: on the old path as their client reports it, from the newest snapshot; on the native path GET_ENTITY_SPEED of GTA's copy of the ped on each read while in the game. speed reads the ped itself. */
    readonly moveSpeed: number;
    /** The player's name as the server sent it; "" when this client got none (the native path without a stream-in). */
    readonly name: string;
    /** The model of the player's ped in GTA (GET_ENTITY_MODEL) by the newest snapshot; 0 without a ped. */
    readonly nativeModel: number;
    /** The player itself, as a new object from the current snapshot (Player.get); null once the player is gone. */
    readonly netOwner: Player | null;
    /** How loud this client plays the player in non-spatial voice channels, 0..2 (1 by default); assigning is setVoiceNonSpatialVolume. */
    nonSpatialVolume: number;
    /** The position by the newest snapshot: the ped's own when it is in GTA, else the last synced one; {0, 0, 0} without one. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of the player's ped in this client's GTA (RESET_ENTITY_ALPHA); resolves true once the call ran, false without a ped or when it failed. */
    resetAlpha(): Promise<boolean>;
    /** The rotation in degrees by the newest snapshot; {0, 0, 0} without one. */
    readonly rot: Vector3Like;
    /** The GTA handle of the player's ped by the newest snapshot; 0 when it is not in this client's GTA and once the snapshots stop listing the player. */
    readonly scriptID: number;
    /** The player's seat: 1 the driver's, 2 and up the passengers', 0 outside a vehicle. On the old path from the newest snapshot; on the native path the seat of GTA's copy of the ped in the vehicle it is in, read while in the game. */
    readonly seat: number;
    /** Sets the alpha of the player's ped in this client's GTA (SET_ENTITY_ALPHA, clamped to 0–255 and made whole); resolves true once the call ran, false without a ped or when it failed. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of the player's ped in this client's GTA on or off (SET_ENTITY_COLLISION, keepPhysics true by default); resolves true once the call ran, false without a ped or when it failed. collision does not change: it is the server's flag. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Sets a key of this client's own metadata of the player, or each key of an object, and fires metaChange (player, key, value, old value). Not synced. Kept while the player stays in this client's snapshot; dropped when they leave it or the session ends. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Resolves false and warns: a remote player's position is the server's. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Resolves false and warns: a remote player's rotation is the server's. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Writes the value into this client's copy of the player's stream-synced metadata, without an event; getStreamSyncedMeta returns it as given. A client cannot change the server's data: nothing is sent, and the server's next change of the key replaces it. */
    setStreamSyncedMetaData(key: string, value: any): void;
    /** Shows or hides the player's ped in this client's GTA (SET_ENTITY_VISIBLE); resolves true once GTA ran it, false without a ped here or when GTA refused. The server's next visibility change for the player, or on the native path the sync of the ped by its owner, puts theirs back. */
    setVisible(visible: boolean): Promise<boolean>;
    /** How loud this client plays the player in spatial voice channels, 0..2 (1 by default); assigning is setVoiceSpatialVolume. */
    spatialVolume: number;
    /** Speed in m/s by the newest snapshot: the ped's GET_ENTITY_SPEED, or moveSpeed when that is 0 or the ped is not in GTA. */
    readonly speed: number;
    /** The player's velocity: on the old path as their client reports it, from the newest snapshot; on the native path GET_ENTITY_VELOCITY of GTA's copy of the ped on each read while in the game. */
    readonly speedVector: Vector3Like;
    /** Sideways speed in m/s while strafing, else 0: on the old path as the player's client reports it, from the newest snapshot; on the native path worked out the same way from GTA's copy of the ped while in the game (IS_PED_STRAFING, its velocity along the right of its heading). */
    readonly strafeSpeed: number;
    /** Whether the player is in streaming range of this client by the newest snapshot; false once the snapshots stop listing the player. */
    readonly streamed: boolean;
    /** A new plain object of the player's stream-synced metadata on this client on each read. */
    readonly streamSyncedMetaData: Record<string, any>;
    /** A JSON text of the player's state flags, animation hashes, vehicle id and seat (GTA's seat index), by the newest snapshot; on the native path the flags and hashes are 0, the vehicle null and the seat -1. */
    readonly taskData: string;
    /** 0 (BaseObjectType.Player). */
    readonly type: 0;
    /** Whether this client still has the player: the newest snapshot lists them (the same player, not another one under the id) and did not find their ped gone. It turns false once the snapshots stop listing the player. */
    readonly valid: boolean;
    /** The vehicle the player sits in, null outside one: on the old path from the newest snapshot; on the native path the server's vehicle (old-path or native) that GTA's copy of the ped is in, read while in the game. */
    readonly vehicle: Vehicle | null;
    /** Whether the player's ped is visible (IS_ENTITY_VISIBLE) by the newest snapshot; without a ped, the server's flag, true when it sent none. */
    readonly visible: boolean;
}

/** Runtime path: `varion.Player.local` */
export class PlayerLocal {
    /** Not a constructor: the type of `varion.Player.local`, the local player, the only object of its kind. */
    private constructor();
    /** A point 80 m along the gameplay camera while the local player aims or shoots, {0, 0, 0} otherwise; updated every 50 ms while in the game. */
    readonly aimPos: Vector3Like;
    /** The alpha of the local ped in GTA (GET_ENTITY_ALPHA, 0..255) on each read while in the game; 255 without a ped. */
    readonly alpha: number;
    /** Ammo in the clip of the weapon in hand (GET_AMMO_IN_CLIP); -1 while it is not read (no weapon, or the weapon just changed); updated every 50 ms while in the game. */
    readonly ammoInClip: number;
    /** Armour (GET_PED_ARMOUR, clamped to 0..maxArmour); 0 before the first snapshot, then updated every 50 ms while in the game. */
    readonly armour: number;
    /** Attaches the local player's ped in this client's GTA to a bone of another entity (an object with scriptID, or a GTA handle) with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Whether the local ped collides: in the game GTA's GET_ENTITY_COLLISION_DISABLED for it, so setCollision shows here; without a ped, and outside the game, the server's flag (true when it sent none). */
    readonly collision: boolean;
    /** Total ammo of the weapon in hand (GET_AMMO_IN_PED_WEAPON); updated every 50 ms while in the game. */
    readonly currentAmmo: number;
    /** The hash of the weapon in hand (GET_SELECTED_PED_WEAPON); 0 before the first snapshot, then updated every 50 ms while in the game. weapon is the same. */
    readonly currentWeapon: number;
    /** Which of eight common attachments (suppressors, flashlights, scopes) the weapon in hand has, as the client engine checks them at most once a second; a new array on each read. Other components never appear here; hasWeaponComponent asks GTA about any. */
    readonly currentWeaponComponents: number[];
    /** The tint of the weapon in hand (GET_PED_WEAPON_TINT_INDEX, 0..7), re-checked at most once a second. */
    readonly currentWeaponTintIndex: number;
    /** Removes a key of this client's own metadata of the local player (setMeta) and fires metaChange (Player.local, key, undefined, old value); a missing key does nothing. */
    deleteMeta(key: string): void;
    /** Removes the key from this client's copy of the player's stream-synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Removes the key from this client's copy of the player's synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteSyncedMetaData(key: string): void;
    /** Never deletes the local player's ped: resolves false and logs a warning, as for any player. */
    destroy(): Promise<boolean>;
    /** Detaches the local player's ped (DETACH_ENTITY, dynamic and with collision); resolves true once the call ran, false without a ped or when it failed. */
    detach(): Promise<boolean>;
    /** The local player's dimension as the server set it: updated with each snapshot and at once when the server changes it; 0 before. */
    readonly dimension: number;
    /** The entity the local player free-aims at (GET_ENTITY_PLAYER_IS_FREE_AIMING_AT) while aiming or shooting, if this client knows it by its id; null otherwise. */
    readonly entityAimingAt: Player | PlayerLocal | Vehicle | Ped | Object | VirtualEntity | null;
    /** aimPos minus the position of entityAimingAt; {0, 0, 0} without a target. */
    readonly entityAimOffset: Vector3Like;
    /** Whether the local player's ped exists in GTA: the local player has an id and a ped handle (scriptID is not 0). */
    exists(): boolean;
    /** Asks GTA now whether the ped of the local player exists (DOES_ENTITY_EXIST): false without a handle, null when the game does not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** The voice filter this client keeps for the local player's id (getVoiceFilter), as for every Player; assigning an AudioFilter or its hash sets it, null removes it. */
    get filter(): AudioFilter | null;
    set filter(value: AudioFilter | number | null);
    /** Whether the weapon flashlight is on (IS_FLASH_LIGHT_ON); updated every 50 ms while in the game. */
    readonly flashlightActive: boolean;
    /** How the local player moves: 0 still, 1 walking, 2 running, 3 sprinting; not a speed: the client engine sends this value to the server and other players under this name. Updated every 50 ms while in the game. */
    readonly forwardSpeed: number;
    /** Freezes or unfreezes the local player's ped (FREEZE_ENTITY_POSITION); resolves true once the call ran, false without a ped or when it failed. frozen does not change: it is the server's flag. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** The server's frozen flag for the local player, false when it sent none. GTA has no getter for a frozen position, so freezePosition here does not show in it. */
    readonly frozen: boolean;
    /** A value of this client's own metadata of the local player (setMeta) as it was set; undefined for none. Kept until the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own metadata of the local player (setMeta); getMetaKeys is the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves speed at once; it does not ask GTA. */
    getSpeedAsync(): Promise<number>;
    /** A value of the local player's stream-synced metadata (setStreamSyncedMeta on the server), server references turned into this client's objects; undefined for none. Emptied when the session ends. */
    getStreamSyncedMeta(key: string): any;
    /** The same as getStreamSyncedMeta. */
    getStreamSyncedMetaData(key: string): any;
    /** The keys of the local player's stream-synced metadata on this client; getStreamSyncedMetaKeys is the same. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** A value of the local player's synced metadata (setSyncedMeta on the server), server references turned into this client's objects; undefined for none. Emptied when the session ends. */
    getSyncedMeta(key: string): any;
    /** The same as getSyncedMeta. */
    getSyncedMetaData(key: string): any;
    /** The keys of the local player's synced metadata on this client. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta. */
    getVariable(key: string): any;
    /** Ammo of a weapon the server gave the player (a hash or name) as the client tracks it, the grant minus what GTA spent; 0 for infinite ammo or a weapon not given. */
    getWeaponAmmo(weapon: number | string): number;
    /** The components the server added to a weapon it gave the player (a hash or name); [] for a weapon not given. */
    getWeaponComponents(weapon: number | string): number[];
    /** currentWeaponTintIndex when the weapon (a hash or name) is the one in hand, else 0. */
    getWeaponTintIndex(weapon: number | string): number;
    /** Whether this client's own metadata of the local player (setMeta) has the key. */
    hasMeta(key: string): boolean;
    /** Whether the local player's stream-synced metadata has the key on this client. */
    hasStreamSyncedMeta(key: string): boolean;
    /** The same as hasStreamSyncedMeta. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether the local player's synced metadata has the key on this client. */
    hasSyncedMeta(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** Whether the server gave the player this weapon (a hash or name) and has not taken it back; weapons picked up in GTA do not count. */
    hasWeapon(weapon: number | string): boolean;
    /** Whether the weapon (a hash or name) is the one in hand and has the component (a hash or name): in the game GTA's HAS_PED_GOT_WEAPON_COMPONENT for the local ped, for any component; elsewhere whether currentWeaponComponents lists it. */
    hasWeaponComponent(weapon: number | string, component: number | string): boolean;
    /** Its heading in degrees: rot.z of the newest snapshot. */
    readonly heading: number;
    /** The gameplay camera's rotation while the local player aims or shoots, {0, 0, 0} otherwise; not the head: the name comes with what the client engine sends. Updated every 50 ms while in the game. */
    readonly headRot: Vector3Like;
    /** Health (GET_ENTITY_HEALTH, clamped to 0..maxHealth); 200 before the first snapshot, and that read warns once. Then updated every 50 ms while in the game. */
    readonly health: number;
    /** The local player's server id; 0 before the first snapshot. */
    readonly id: number;
    /** The interior the local ped is in (GET_INTERIOR_FROM_ENTITY), 0 outside; updated every 50 ms while in the game. */
    readonly interiorId: number;
    /** Whether the server made the local player invincible (its vitals of the player); false until they came. */
    readonly invincible: boolean;
    /** Whether the local player free-aims (IS_PLAYER_FREE_AIMING) or shoots; updated every 50 ms while in the game. */
    readonly isAiming: boolean;
    /** GTA's stealth movement of the local ped (GET_PED_STEALTH_MOVEMENT), the same as isStealthy: GTA's crouch is its stealth mode. Updated every 50 ms while in the game. */
    readonly isCrouching: boolean;
    /** Whether the local ped is dead (IS_ENTITY_DEAD); updated every 50 ms while in the game. */
    readonly isDead: boolean;
    /** Resolves isDead at once; it does not ask GTA. */
    isDeadAsync(): Promise<boolean>;
    /** Whether the local ped is getting into a vehicle (IS_PED_GETTING_INTO_A_VEHICLE); updated every 50 ms while in the game. */
    readonly isEnteringVehicle: boolean;
    /** Whether the local ped is in cover (IS_PED_IN_COVER); updated every 50 ms while in the game. */
    readonly isInCover: boolean;
    /** Whether the local ped is in melee combat or performs a melee action; updated every 50 ms while in the game. */
    readonly isInMelee: boolean;
    /** Whether the local ped is in ragdoll (IS_PED_RAGDOLL or a running ragdoll task); updated every 50 ms while in the game. */
    readonly isInRagdoll: boolean;
    /** Whether the local ped is jumping (IS_PED_JUMPING); updated every 50 ms while in the game. */
    readonly isJumping: boolean;
    /** Whether the local ped is in a vehicle with its exit task running or jumping out; updated every 50 ms while in the game. */
    readonly isLeavingVehicle: boolean;
    /** Whether the local ped is climbing (IS_PED_CLIMBING): a ladder, and also a fence or wall it climbs over. Updated every 50 ms while in the game. */
    readonly isOnLadder: boolean;
    /** Whether the local ped is in free fall, under an open canopy or landing (GET_PED_PARACHUTE_STATE 0..2); updated every 50 ms while in the game. */
    readonly isParachuting: boolean;
    /** Whether the local ped is reloading (IS_PED_RELOADING); updated every 50 ms while in the game. */
    readonly isReloading: boolean;
    /** Always false: this is the local player. */
    readonly isRemote: false;
    /** Whether the local ped is shooting (IS_PED_SHOOTING); updated every 50 ms while in the game. */
    readonly isShooting: boolean;
    /** Whether the local ped's GTA handle is known (scriptID is not 0). */
    readonly isSpawned: boolean;
    /** Whether the local ped moves in stealth mode (GET_PED_STEALTH_MOVEMENT); updated every 50 ms while in the game. */
    readonly isStealthy: boolean;
    /** The same as valid: whether the local player has a server id. */
    readonly isStreamedIn: boolean;
    /** Whether the first snapshot of the local player has come; before it the other values are seeded defaults (health 200, position {0, 0, 0}). */
    readonly isSynced: boolean;
    /** Whether this client sends the microphone now (a frame within the last 450 ms), updated with each snapshot. */
    readonly isTalking: boolean;
    /** The maximum armour the server set for the local player; 100 before the first snapshot. */
    readonly maxArmour: number;
    /** The maximum health the server set for the local player; 200 before the first snapshot. */
    readonly maxHealth: number;
    /** The scale of stamina: always 100. */
    readonly maxStamina: number;
    /** This client's own metadata of the local player (setMeta) as a new object on each read. */
    readonly metaData: Record<string, any>;
    /** The loudness 0..1 of the last microphone frame this client sent, 0 when none within 150 ms; updated with each snapshot. */
    readonly micLevel: number;
    /** The model hash of the local ped (GET_ENTITY_MODEL); 0 before the first snapshot, then updated every 50 ms while in the game. */
    readonly model: number;
    /** Speed in m/s (GET_ENTITY_SPEED); updated every 50 ms while in the game. speed is the same. */
    readonly moveSpeed: number;
    /** The name this client joined the server with; "" before it joined. */
    readonly name: string;
    /** The model of the local ped in GTA (GET_ENTITY_MODEL) on each read while in the game; the snapshot's model without a ped. */
    readonly nativeModel: number;
    /** The local player itself. */
    readonly netOwner: PlayerLocal;
    /** The non-spatial voice volume this client keeps for the local player's id, 0..2 (1 by default), as for every Player; a client never plays its own voice. */
    nonSpatialVolume: number;
    /** Position (GET_ENTITY_COORDS), updated every 50 ms while in the game; {0, 0, 0} before the first snapshot, and that read warns once. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of the local player's ped (RESET_ENTITY_ALPHA); resolves true once the call ran, false without a ped or when it failed. */
    resetAlpha(): Promise<boolean>;
    /** Rotation in degrees (GET_ENTITY_ROTATION); {0, 0, 0} before the first snapshot, then updated every 50 ms while in the game. */
    readonly rot: Vector3Like;
    /** The GTA handle of the local ped; 0 before it is known. */
    readonly scriptID: number;
    /** The local player's seat: 1 the driver's, 2 and up the passengers', 0 outside a vehicle; updated every 50 ms while in the game. */
    readonly seat: number;
    /** Sets the alpha of the local player's ped (SET_ENTITY_ALPHA, clamped to 0–255 and made whole); resolves true once the call ran, false without a ped or when it failed. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of the local player's ped on or off (SET_ENTITY_COLLISION, keepPhysics true by default); resolves true once the call ran, false without a ped or when it failed. collision does not change: it is the server's flag. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Sets a key of this client's own metadata of the local player, or each key of an object, and fires metaChange (Player.local, key, value, old value). Not synced. Kept until the session ends. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Teleports the local player's ped (SET_ENTITY_COORDS, clearing the area); resolves true once the call ran, false without a ped or when it failed (logging an error). */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Sets the rotation of the local player's ped in degrees (SET_ENTITY_ROTATION, order 2); resolves true once the call ran, false without a ped or when it failed (logging an error). */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Writes the value into this client's copy of the player's stream-synced metadata, without an event; getStreamSyncedMeta returns it as given. A client cannot change the server's data: nothing is sent, and the server's next change of the key replaces it. */
    setStreamSyncedMetaData(key: string, value: any): void;
    /** Shows or hides the local player's ped (SET_ENTITY_VISIBLE); resolves true once GTA ran it, false without a ped or when GTA refused. visible reads it in the game; the server's next visibility change for the player applies its own. */
    setVisible(visible: boolean): Promise<boolean>;
    /** The spatial voice volume this client keeps for the local player's id, 0..2 (1 by default), as for every Player; a client never plays its own voice. */
    spatialVolume: number;
    /** Speed in m/s (GET_ENTITY_SPEED), the same as moveSpeed; updated every 50 ms while in the game. */
    readonly speed: number;
    /** The local ped's velocity (GET_ENTITY_VELOCITY); updated every 50 ms while in the game. */
    readonly speedVector: Vector3Like;
    /** Sprint stamina left, 0..100 (GET_PLAYER_SPRINT_STAMINA_REMAINING); 100 until it is read. */
    readonly stamina: number;
    /** Sideways speed in m/s while strafing, -10..10, else 0; updated every 50 ms while in the game. */
    readonly strafeSpeed: number;
    /** The same as isStreamedIn: whether the local player has a server id. */
    readonly streamed: boolean;
    /** The local player's stream-synced metadata on this client as a new object on each read. */
    readonly streamSyncedMetaData: Record<string, any>;
    /** A JSON text of the local player's state flags (the bits this client syncs, from the same readings), animation hashes 0, and its vehicle id and GTA seat index (null and -1 on foot). */
    readonly taskData: string;
    /** 0 (BaseObjectType.Player). */
    readonly type: 0;
    /** Whether the local player has a server id (from the first snapshot on). */
    readonly valid: boolean;
    /** The vehicle the local ped sits in, an old-path Vehicle or a NativeVehicle; null outside one; updated every 50 ms while in the game. */
    readonly vehicle: Vehicle | NativeVehicle | null;
    /** Whether the local ped is visible: in the game GTA's IS_ENTITY_VISIBLE for it, so setVisible shows here; without a ped, and outside the game, the server's flag (true when it sent none). */
    readonly visible: boolean;
    /** The same as currentWeapon. */
    readonly weapon: number;
    /** The weapons the server gave the player, sorted by hash, with their tint and the components it added; a new array on each read. Weapons picked up in GTA are not listed. */
    readonly weapons: Array<{ hash: number; tintIndex: number; components: number[] }>;
}

export class PointBlip {
    /** Creates a point blip only for this client, in dimension 0, with `sprite` 1, `color` 0, `scale` 1 and `shortRange` false: at x, y, z or at a position (non-numeric values count as 0), or on an entity, attached to it (ADD_BLIP_FOR_ENTITY) when GTA has that entity here and else at its position. GTA's blip appears asynchronously (`waitForSpawn()`). */
    constructor(x: number, y: number, z: number);
    constructor(pos: Vector3Like);
    constructor(entity: Entity);
    /** The point blips: the server's ones (as plain objects with fewer members) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<PointBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many point blips PointBlip.all holds. */
    static readonly count: number;
    /** As Blip.get, but null for a blip of another kind. */
    static get(id: number): PointBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as PointBlip.get. */
    static getByID(id: number): PointBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's point blip with that id, as a plain object; null for none and for a blip of another kind. */
    static getByRemoteID(id: number): { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** As Blip.getByScriptID, for point blips only: null for 0, for none and for a blip of another kind. */
    static getByScriptID(scriptID: number): PointBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Opacity 0..255 (clamped, truncated), 255 by default; sent as SET_BLIP_ALPHA. */
    alpha: number;
    /** Sent as SET_BLIP_AS_MISSION_CREATOR_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    asMissionCreator: boolean;
    /** Destination (4) for a point blip, as BlipType; Vehicle (1), Ped (2) or Object (3) for one made on such an entity. Assigning Radius (7) or Area (11) makes it that kind where it is, and Destination turns a blip on an entity into a point where the entity was: GTA cannot change a blip's kind, so the blip is made again (a new scriptID) and given what was set on it, and the class follows; a radius without a radius gets 100 m, an area 100 x 100 m, and any other type throws a RangeError. */
    blipType: number;
    /** Sent as SET_BLIP_BRIGHT once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    bright: boolean;
    /** GTA's blip category (SET_BLIP_CATEGORY), truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    category: number;
    /** Colour index (BlipColor), 0 by default; clamped to 0..255 and truncated (SET_BLIP_COLOUR). */
    color: number;
    /** Sent as SHOW_CREW_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    crewIndicatorVisible: boolean;
    /** Removes the key from the blip's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the blip from GTA (REMOVE_BLIP): valid turns false and baseObjectRemove fires; later calls do nothing. A resource's blips are destroyed when it stops. */
    destroy(): void;
    /** The dimension it shows in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated, and checked again with each update of the local player. */
    dimension: number;
    /** GTA's display mode (SET_BLIP_DISPLAY), 2 by default, an integer of at least 0; 0 is sent instead while the blip is hidden (visible false or another dimension). */
    display: number;
    /** Fades the blip to opacity 0..255 (clamped) over duration ms, at least 0 (SET_BLIP_FADE); does nothing before GTA has the blip or after destroy(). */
    fade(opacity: number, duration: number): void;
    /** Sent as SET_BLIP_FLASHES once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashes: boolean;
    /** Sent as SET_BLIP_FLASHES_ALTERNATE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashesAlternate: boolean;
    /** Flash interval in ms (SET_BLIP_FLASH_INTERVAL), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashInterval: number;
    /** How long the blip flashes, in ms (SET_BLIP_FLASH_TIMER), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashTimer: number;
    /** Sent as SHOW_FRIEND_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key, undefined for none: the blip's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the blip's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always undefined: a local blip has no synced metadata. */
    getSyncedMeta(key: string): unknown;
    /** Always []: a local blip has no synced metadata. */
    getSyncedMetaKeys(): string[];
    /** A GTA text label to name the blip with (SET_BLIP_NAME_FROM_TEXT_FILE), empty by default; while set it wins over name, and assigning name clears it. */
    gxtName: string;
    /** Whether the blip's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always false: a local blip has no synced metadata. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees (SET_BLIP_ROTATION_WITH_FLOAT); sent again when a blipType change makes the blip anew. 0 until assigned. */
    heading: number;
    /** Sent as SHOW_HEADING_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    headingIndicatorVisible: boolean;
    /** Sent as SET_BLIP_HIGH_DETAIL once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    highDetail: boolean;
    /** Negative (-1, -2 ...), unique among this client's local blips. */
    readonly id: number;
    /** True for a point blip made on an entity GTA has here, until a blipType change; false otherwise. */
    readonly isAttached: boolean;
    /** Whether GTA shows the blip as friendly (SET_BLIP_AS_FRIENDLY), false until assigned. That native recolours the blip whatever its toggle (false leaves colour 49), so a local blip gets it only while friendly, after its colour (and again when a blipType change makes it anew); turning it off sends it with false and then the blip's colour again. */
    isFriendly: boolean;
    /** True while the dimension is -2147483648, which shows the blip in every dimension. */
    readonly isGlobal: boolean;
    /** Sent as SET_BLIP_HIDDEN_ON_LEGEND once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isHiddenOnLegend: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native shrinked uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    isMinimalOnEdge: boolean;
    /** True for a blip of the server, false for one this client made. */
    readonly isRemote: boolean;
    /** Sent as SET_BLIP_SHORT_HEIGHT_THRESHOLD once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isShortHeightThreshold: boolean;
    /** True while GTA has the blip, it is visible and its dimension matches the local player's. */
    readonly isStreamedIn: boolean;
    /** The name in the map legend, empty by default; assigning clears gxtName and names the blip with BEGIN_TEXT_COMMAND_SET_BLIP_NAME. */
    name: string;
    /** Number shown on the blip (SHOW_NUMBER_ON_BLIP), truncated; a negative one hides it (HIDE_NUMBER_ON_BLIP). -1 until assigned. */
    number: number;
    /** Sent as SHOW_OUTLINE_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    outlineIndicatorVisible: boolean;
    /** Its position, a copy; assigning moves it (SET_BLIP_COORDS), a missing or non-numeric component becoming 0. */
    pos: Vector3Like;
    /** SET_BLIP_PRIORITY, truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    priority: number;
    /** Assigning true pulses the blip once (PULSE_BLIP); false sends nothing, and the value read is only what was assigned. */
    pulse: boolean;
    /** Always 1: the runtime keeps no reference count of its objects. */
    readonly refCount: 1;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteID: number;
    /** Whether GTA draws a GPS route to the blip (SET_BLIP_ROUTE), false by default. */
    route: boolean;
    /** Colour index of the GPS route (SET_BLIP_ROUTE_COLOUR), clamped to 0..255 and truncated; 0 by default. */
    routeColor: number;
    /** Icon size (SET_BLIP_SCALE), 1 by default, at least 0. */
    scale: number;
    /** GTA's handle of the blip: 0 until GTA has made it and after destroy(); a blipType change makes the blip again with a new handle. */
    readonly scriptID: number;
    /** Secondary colour (SET_BLIP_SECONDARY_COLOUR): an {r, g, b} object, each clamped to 0..255, or a number 0xRRGGBBAA; read back as assigned, {r: 0, g: 0, b: 0, a: 255} by default. */
    secondaryColor: number | { r?: number; g?: number; b?: number; a?: number };
    /** Stores the value under the key in the blip's own metadata on this client and fires metaChange (blip, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Shown on the minimap only nearby (SET_BLIP_AS_SHORT_RANGE), false by default. */
    shortRange: boolean;
    /** Draws the blip's sight cone (SET_BLIP_SHOW_CONE, hue 0); sent again when a blipType change makes the blip anew, false until assigned. */
    showCone: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native isMinimalOnEdge uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    shrinked: boolean;
    /** {1, 1} by default; assigning sends SET_BLIP_SCALE_2D (each at least 0), which is not sent again when a blipType change makes the blip anew. */
    size: Vector2Like;
    /** Icon (BlipSprite), 1 by default; truncated, at least 0 (SET_BLIP_SPRITE). */
    sprite: number;
    /** Sent as SHOW_TICK_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4). */
    readonly type: 4;
    /** Sent as SET_BLIP_USE_HEIGHT_INDICATOR_ON_EDGE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    useHeightIndicatorOnEdge: boolean;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
    /** Shows or hides the blip (display 0 while hidden), true by default. */
    visible: boolean;
    /** Resolves once GTA has made the blip (after a blipType change, the new one); rejects with the error when making it failed. */
    waitForSpawn(): Promise<void>;
}

export class Profiler {
    /** Creates a stopwatch: `timeStart(name)` marks a moment and `timeEnd(name)` returns the milliseconds since it (0 for an unknown name). Frame statistics are static: `Profiler.fps`, `Profiler.tickMs`, `Profiler.stats`. */
    constructor();
    /** How many events this client's scripts have sent to the server since the script runtime started, as of the last snapshot (up to 20 a second); 0 before the first one. */
    static readonly clientEvents: number;
    /** How many server events have reached this client's scripts since the script runtime started, as of the last snapshot; 0 before the first one. */
    static readonly dispatchedEvents: number;
    /** GTA's frame rate, counted over about a second (at most 1000), as of the last snapshot; 0 before the first one. */
    static readonly fps: number;
    /** How many native calls the scripts have made since the script runtime started, as of the last snapshot; 0 before the first one. */
    static readonly nativeCalls: number;
    /** The last snapshot's figures in one object (fps, tickMs, nativeCalls, dispatchedEvents, clientEvents, webviews); the runtime's own object, updated in place, {} before the first snapshot. */
    static readonly stats: { fps?: number; tickMs?: number; nativeCalls?: number; dispatchedEvents?: number; clientEvents?: number; webviews?: number };
    /** The average game frame in milliseconds, 1000 / fps over about a second, from the last snapshot; 0 before the first one. Profiler.stats.tickMs is the time between the client's snapshots. */
    static readonly tickMs: number;
    /** How many WebViews of scripts the client holds, shown or not, as of the last snapshot; 0 before the first one. */
    static readonly webviews: number;
    /** Milliseconds since timeStart(name) on this Profiler, 0 when it never started. The mark stays, so later calls measure from the same start. */
    timeEnd(name: string): number;
    /** Marks the start time of name on this Profiler (performance.now()), replacing an earlier mark. */
    timeStart(name: string): void;
}

export class Quaternion {
    /** Creates a quaternion from four numbers, an array, an object with x, y, z, w, or one number for all four; a missing or non-numeric component is 0. `new Quaternion()` is 0, 0, 0, 0, not the identity rotation. */
    constructor(x: number, y: number, z?: number, w?: number);
    constructor(value?: number);
    constructor(xyzw: number[]);
    constructor(q: { x: number; y: number; z: number; w: number });
    /** Quaternion(1, 1, 1, 1): every component 1, as Vector3.one; the identity rotation is (0, 0, 0, 1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly one: Quaternion;
    /** Quaternion(0, 0, 0, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly zero: Quaternion;
    /** [x, y, z, w]. */
    toArray(): [number, number, number, number];
    /** A new Quaternion with each component rounded to precision decimals (4 by default); a precision outside 0..100 throws a RangeError. */
    toFixed(precision?: number): Quaternion;
    /** Text of the form "Quaternion{ x: 0, y: 0, z: 0, w: 1 }". */
    toString(): string;
    /** The w component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    w: number;
    /** The x component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    x: number;
    /** The y component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    y: number;
    /** The z component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    z: number;
}

export class RGBA {
    /** Creates a colour from numbers, an array [r, g, b, a] or an object with r, g, b, a. Each channel is rounded and clamped to 0–255; a missing or non-finite channel is 0, and alpha 255. */
    constructor(r?: number, g?: number, b?: number, a?: number);
    constructor(rgba: number[]);
    constructor(color: { r: number; g: number; b: number; a?: number });
    /** RGBA(0, 0, 0, 255). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly black: RGBA;
    /** RGBA(0, 0, 255, 255). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly blue: RGBA;
    /** RGBA(0, 0, 0, 0), fully transparent. A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly clear: RGBA;
    /** RGBA(0, 255, 0, 255). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly green: RGBA;
    /** RGBA(255, 0, 0, 255). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly red: RGBA;
    /** RGBA(255, 255, 255, 255). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly white: RGBA;
    /** Alpha, 0..255 (255 when the constructor got none); the constructor rounds and clamps it, assigning does not. */
    a: number;
    /** Blue, 0..255; the constructor rounds and clamps it (a non-number is 0), assigning does not. */
    b: number;
    /** Green, 0..255; the constructor rounds and clamps it (a non-number is 0), assigning does not. */
    g: number;
    /** Red, 0..255; the constructor rounds and clamps it (a non-number is 0), assigning does not. */
    r: number;
    /** A new RGBA whose r, g, b, a fields hold this colour's a, r, g, b. */
    toARGB(): RGBA;
    /** [r, g, b, a]. */
    toArray(): [number, number, number, number];
    /** A new RGBA with r and b swapped. */
    toBGRA(): RGBA;
    /** The colour as an unsigned 32-bit number 0xAABBGGRR (r in the lowest byte). */
    toInt(): number;
    /** Text of the form "RGBA{ r: 255, g: 0, b: 0, a: 255 }". */
    toString(): string;
}

export class RadiusBlip {
    /** Creates a radius blip, a circle of `radius` metres around x, y, z, only for this client, in dimension 0; non-numeric values and a negative radius count as 0. GTA's blip appears asynchronously (`waitForSpawn()`). */
    constructor(x: number, y: number, z: number, radius: number);
    /** The radius blips: the server's ones (as plain objects with fewer members) first, then every resource's local ones. A new array on each read. */
    static readonly all: Array<RadiusBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many radius blips RadiusBlip.all holds. */
    static readonly count: number;
    /** As Blip.get, but null for a blip of another kind. */
    static get(id: number): RadiusBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as RadiusBlip.get. */
    static getByID(id: number): RadiusBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's radius blip with that id, as a plain object; null for none and for a blip of another kind. */
    static getByRemoteID(id: number): { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** As Blip.getByScriptID, for radius blips only: null for 0, for none and for a blip of another kind. */
    static getByScriptID(scriptID: number): RadiusBlip | { type: 4; id: number; remoteId: number; remoteID: number; isRemote: true; scriptID: number; valid: boolean; isStreamedIn: boolean; pos: Vector3Like; dimension: number; sprite: number; color: number; scale: number; alpha: number; display: number; visible: boolean; bright: boolean; number: number; heading: number; isFriendly: boolean; size: Vector2Like; isAttached: boolean; name: string; shortRange: boolean; route: boolean; radius: number; width: number; height: number; isRadius: boolean; isArea: boolean; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Opacity 0..255 (clamped, truncated), 255 by default; sent as SET_BLIP_ALPHA. */
    alpha: number;
    /** Sent as SET_BLIP_AS_MISSION_CREATOR_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    asMissionCreator: boolean;
    /** Radius (7) for a radius blip, as BlipType. Assigning Destination (4) or Area (11) makes it that kind where it is: GTA cannot change a blip's kind, so the blip is made again (a new scriptID) and given what was set on it, and the class follows; an area gets 100 x 100 m, and any other type throws a RangeError. */
    blipType: number;
    /** Sent as SET_BLIP_BRIGHT once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    bright: boolean;
    /** GTA's blip category (SET_BLIP_CATEGORY), truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    category: number;
    /** Colour index (BlipColor), 0 by default; clamped to 0..255 and truncated (SET_BLIP_COLOUR). */
    color: number;
    /** Sent as SHOW_CREW_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    crewIndicatorVisible: boolean;
    /** Removes the key from the blip's own metadata (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the blip from GTA (REMOVE_BLIP): valid turns false and baseObjectRemove fires; later calls do nothing. A resource's blips are destroyed when it stops. */
    destroy(): void;
    /** The dimension it shows in: the local player's must see it -- the same one, every one at -2147483648, and 0 also from a negative dimension; 0 by default, truncated, and checked again with each update of the local player. */
    dimension: number;
    /** GTA's display mode (SET_BLIP_DISPLAY), 2 by default, an integer of at least 0; 0 is sent instead while the blip is hidden (visible false or another dimension). */
    display: number;
    /** Fades the blip to opacity 0..255 (clamped) over duration ms, at least 0 (SET_BLIP_FADE); does nothing before GTA has the blip or after destroy(). */
    fade(opacity: number, duration: number): void;
    /** Sent as SET_BLIP_FLASHES once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashes: boolean;
    /** Sent as SET_BLIP_FLASHES_ALTERNATE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    flashesAlternate: boolean;
    /** Flash interval in ms (SET_BLIP_FLASH_INTERVAL), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashInterval: number;
    /** How long the blip flashes, in ms (SET_BLIP_FLASH_TIMER), an integer of at least 0; sent again when a blipType change makes the blip anew. 0 until assigned. */
    flashTimer: number;
    /** Sent as SHOW_FRIEND_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key, undefined for none: the blip's own metadata on this client. */
    getMeta(key: string): unknown;
    /** The keys of the blip's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Always undefined: a local blip has no synced metadata. */
    getSyncedMeta(key: string): unknown;
    /** Always []: a local blip has no synced metadata. */
    getSyncedMetaKeys(): string[];
    /** A GTA text label to name the blip with (SET_BLIP_NAME_FROM_TEXT_FILE), empty by default; while set it wins over name, and assigning name clears it. */
    gxtName: string;
    /** Whether the blip's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Always false: a local blip has no synced metadata. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees (SET_BLIP_ROTATION_WITH_FLOAT); sent again when a blipType change makes the blip anew. 0 until assigned. */
    heading: number;
    /** Sent as SHOW_HEADING_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    headingIndicatorVisible: boolean;
    /** Sent as SET_BLIP_HIGH_DETAIL once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    highDetail: boolean;
    /** Negative (-1, -2 ...), unique among this client's local blips. */
    readonly id: number;
    /** Always false: only a point blip can be put on an entity. */
    readonly isAttached: false;
    /** Whether GTA shows the blip as friendly (SET_BLIP_AS_FRIENDLY), false until assigned. That native recolours the blip whatever its toggle (false leaves colour 49), so a local blip gets it only while friendly, after its colour (and again when a blipType change makes it anew); turning it off sends it with false and then the blip's colour again. */
    isFriendly: boolean;
    /** True while the dimension is -2147483648, which shows the blip in every dimension. */
    readonly isGlobal: boolean;
    /** Sent as SET_BLIP_HIDDEN_ON_LEGEND once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isHiddenOnLegend: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native shrinked uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    isMinimalOnEdge: boolean;
    /** True for a blip of the server, false for one this client made. */
    readonly isRemote: boolean;
    /** Sent as SET_BLIP_SHORT_HEIGHT_THRESHOLD once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    isShortHeightThreshold: boolean;
    /** True while GTA has the blip, it is visible and its dimension matches the local player's. */
    readonly isStreamedIn: boolean;
    /** The name in the map legend, empty by default; assigning clears gxtName and names the blip with BEGIN_TEXT_COMMAND_SET_BLIP_NAME. */
    name: string;
    /** Number shown on the blip (SHOW_NUMBER_ON_BLIP), truncated; a negative one hides it (HIDE_NUMBER_ON_BLIP). -1 until assigned. */
    number: number;
    /** Sent as SHOW_OUTLINE_INDICATOR_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    outlineIndicatorVisible: boolean;
    /** Its position, a copy; assigning moves it (SET_BLIP_COORDS), a missing or non-numeric component becoming 0. */
    pos: Vector3Like;
    /** SET_BLIP_PRIORITY, truncated; sent once GTA has the blip and again when a blipType change makes it anew. 0 until assigned. */
    priority: number;
    /** Assigning true pulses the blip once (PULSE_BLIP); false sends nothing, and the value read is only what was assigned. */
    pulse: boolean;
    /** The radius in metres the blip was made with, at least 0; assigning stores the number without redrawing the blip. */
    radius: number;
    /** Always 1: the runtime keeps no reference count of its objects. */
    readonly refCount: 1;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** The server's id of a blip of the server; 0 for one this client made. */
    readonly remoteID: number;
    /** Whether GTA draws a GPS route to the blip (SET_BLIP_ROUTE), false by default. */
    route: boolean;
    /** Colour index of the GPS route (SET_BLIP_ROUTE_COLOUR), clamped to 0..255 and truncated; 0 by default. */
    routeColor: number;
    /** Icon size (SET_BLIP_SCALE), 1 by default, at least 0. */
    scale: number;
    /** GTA's handle of the blip: 0 until GTA has made it and after destroy(); a blipType change makes the blip again with a new handle. */
    readonly scriptID: number;
    /** Secondary colour (SET_BLIP_SECONDARY_COLOUR): an {r, g, b} object, each clamped to 0..255, or a number 0xRRGGBBAA; read back as assigned, {r: 0, g: 0, b: 0, a: 255} by default. */
    secondaryColor: number | { r?: number; g?: number; b?: number; a?: number };
    /** Stores the value under the key in the blip's own metadata on this client and fires metaChange (blip, key, value, old value); an object sets each of its entries. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Shown on the minimap only nearby (SET_BLIP_AS_SHORT_RANGE), false by default. */
    shortRange: boolean;
    /** Draws the blip's sight cone (SET_BLIP_SHOW_CONE, hue 0); sent again when a blipType change makes the blip anew, false until assigned. */
    showCone: boolean;
    /** Sent as SET_BLIP_AS_MINIMAL_ON_EDGE, the native isMinimalOnEdge uses too, so the last assignment of either wins (shrinked when a blipType change makes the blip anew); false until assigned. */
    shrinked: boolean;
    /** {1, 1} by default; assigning sends SET_BLIP_SCALE_2D (each at least 0), which is not sent again when a blipType change makes the blip anew. */
    size: Vector2Like;
    /** Icon (BlipSprite), 1 by default; truncated, at least 0 (SET_BLIP_SPRITE). */
    sprite: number;
    /** Sent as SHOW_TICK_ON_BLIP once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4). */
    readonly type: 4;
    /** Sent as SET_BLIP_USE_HEIGHT_INDICATOR_ON_EDGE once GTA has the blip, and again when a blipType change makes it anew; false until assigned. */
    useHeightIndicatorOnEdge: boolean;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
    /** Shows or hides the blip (display 0 while hidden), true by default. */
    visible: boolean;
    /** Resolves once GTA has made the blip (after a blipType change, the new one); rejects with the error when making it failed. */
    waitForSpawn(): Promise<void>;
}

export class Resource {
    /** Cannot be constructed: `new` throws a `TypeError`. Resources come from `Resource.current`, `Resource.all` and `Resource.getByName(name)` (`Resource.get(name)`). */
    private constructor();
    /** Every client resource the server's manifest names, running or not; one that left the manifest is no longer in it (its object reads valid false). */
    static readonly all: Resource[];
    /** The resource whose code is running (its catalog object, the same on each read); null outside a resource's code. */
    static readonly current: Resource | null;
    /** The same as getByName. */
    static get(name: string): Resource | null;
    /** The client resource of that name the server's manifest names, started or not; null for none, also for one that left the manifest. */
    static getByName(name: string): Resource | null;
    /** The local path of a file of a known client resource in the client's resource cache, with forward slashes (the folder, ending in "/", without relativePath); "" for an unknown resource. Only builds the text. */
    static getPath(name: string, relativePath?: string): string;
    /** The same as varion.assetUrl: the URL of a resource's asset file on the server's HTTP address. */
    static resolveAsset(name: string, path: string): string;
    /** The resource's config table from its manifest, with the keys of its settings table also at the top level. The runtime's own object, not a copy (varion.getResourceConfig gives a deep copy). */
    readonly config: Record<string, any>;
    /** Names of the known resources that list this one among their dependencies. */
    readonly dependants: string[];
    /** Names of the resources this one depends on, from its manifest. */
    readonly dependencies: string[];
    /** What the resource's code exported through varion.exports; other resources call those functions through it. Emptied when the resource stops; a restart fills the same object again. */
    readonly exports: Record<string, any>;
    /** True from the resource's start until its stop. */
    readonly isStarted: boolean;
    /** Its client main script as the manifest names it, a path inside the resource. */
    readonly main: string;
    /** The resource's name. */
    readonly name: string;
    /** The optional-permissions list of its config (optionalPermissions is read too); [] when there is none. */
    readonly optionalPermissions: string[];
    /** The required-permissions list of its config (requiredPermissions is read too); [] when there is none. */
    readonly requiredPermissions: string[];
    /** Its client script type from the manifest, "js" by default. */
    readonly type: string;
    /** True while the server's manifest names the resource; false once a configuration from the server leaves it out (true again if the resource comes back). A stopped resource stays valid. */
    readonly valid: boolean;
}

export const StatName: {
    readonly Flying: any;
    readonly LungCapacity: any;
    readonly Shooting: any;
    readonly Stamina: any;
    readonly Stealth: any;
    readonly Strength: any;
    readonly Wheelie: any;
};

export const TextAlign: {
    readonly Center: any;
    readonly Left: any;
    readonly Right: any;
};

export class TextLabel {
    /** Creates a text label only for this client: centred, white, at `pos` (0, 0, 0 by default). A string as the second argument selects the form with a font name, one of GameFont's written any way (by default `fontSize` 18, `scale` 1, no outline, no distance limit, dimension 0); otherwise the short form takes a font id, `outline` and `dimension`. It shows in the local player's dimension, or in every one at -2147483648; it is drawn as screen text facing the camera, so `rot` and `faceCamera` change nothing. */
    constructor(text: string, fontName: string, fontSize?: number, scale?: number, pos?: Vector3Like, rot?: Vector3Like, color?: { r: number; g: number; b: number; a?: number }, outlineWidth?: number, outlineColor?: { r: number; g: number; b: number; a?: number }, useStreaming?: boolean, streamingDistance?: number);
    constructor(text: string, fontId?: number, pos?: Vector3Like, scale?: number, color?: { r: number; g: number; b: number; a?: number }, outline?: boolean, dimension?: number);
    /** The server's text labels this client has, as read-only plain objects, then the local labels of every resource. A new array on each read. */
    static readonly all: Array<TextLabel | { type: 23; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; text: string; pos: Vector3Like; rot: Vector3Like; scale: number; font: string; fontSize: number; align: number; color: { r: number; g: number; b: number; a: number }; outlineWidth: number; outlineColor: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; isGlobal: boolean; target: Player | null; streamingDistance: number; isStreamedIn: boolean; dimension: number; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] }>;
    /** How many labels TextLabel.all holds. */
    static readonly count: number;
    /** A local label by its id (negative), else the server's by its id; null for none. */
    static get(id: number): TextLabel | { type: 23; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; text: string; pos: Vector3Like; rot: Vector3Like; scale: number; font: string; fontSize: number; align: number; color: { r: number; g: number; b: number; a: number }; outlineWidth: number; outlineColor: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; isGlobal: boolean; target: Player | null; streamingDistance: number; isStreamedIn: boolean; dimension: number; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The same as TextLabel.get. */
    static getByID(id: number): TextLabel | { type: 23; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; text: string; pos: Vector3Like; rot: Vector3Like; scale: number; font: string; fontSize: number; align: number; color: { r: number; g: number; b: number; a: number }; outlineWidth: number; outlineColor: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; isGlobal: boolean; target: Player | null; streamingDistance: number; isStreamedIn: boolean; dimension: number; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** The server's label with that id; null for none (local labels are not searched). */
    static getByRemoteID(id: number): { type: 23; id: number; remoteId: number; remoteID: number; isRemote: true; valid: boolean; text: string; pos: Vector3Like; rot: Vector3Like; scale: number; font: string; fontSize: number; align: number; color: { r: number; g: number; b: number; a: number }; outlineWidth: number; outlineColor: { r: number; g: number; b: number; a: number }; visible: boolean; faceCamera: boolean; isGlobal: boolean; target: Player | null; streamingDistance: number; isStreamedIn: boolean; dimension: number; getSyncedMeta(key: string): unknown; hasSyncedMeta(key: string): boolean; getSyncedMetaKeys(): string[] } | null;
    /** Alignment as TextLabelAlignment: Left 0, Right 1, Center 2 (default), Justify 3 (drawn as Left); clamped to 0..3 and truncated. */
    align: number;
    /** Text colour, each component clamped to 0..255; on assigning a missing one keeps its value. White by default. */
    get color(): { r: number; g: number; b: number; a: number };
    set color(value: { r?: number; g?: number; b?: number; a?: number });
    /** Removes the label: valid turns false and baseObjectRemove fires; later calls do nothing. A resource's labels are destroyed when it stops, and the server's ones have no destroy. */
    destroy(): void;
    /** Its dimension, 0 by default, truncated. A label shows to the local player whose dimension sees it: the same one, every one at -2147483648, and 0 also from a negative dimension -- for local labels and the server's alike; isStreamedIn says it for a local label. */
    dimension: number;
    /** Kept and sent, true by default; the label is drawn as screen text facing the camera either way. */
    faceCamera: boolean;
    /** The font as given: a name, or a number as text. A name is one of GameFont's, written any way (Chalet London 0, House Script 1, Monospace 2, Chalet Comprime Cologne 4, Pricedown 7; any other name 0); a number is truncated, at least 0. */
    get font(): string;
    set font(value: string | number);
    /** Font size, at least 1, 18 by default; the drawn size is scale × fontSize × 0.35 / 18, clamped to 0.1..2. */
    fontSize: number;
    /** A negative number of its own for a label this client made; the server's id (a positive number) for one of the server. */
    id: number;
    /** True for a label drawn at any distance (made without streaming); false when it is drawn only within streamingDistance. */
    readonly isGlobal: boolean;
    /** True for a label of the server, false for one this client made. */
    readonly isRemote: boolean;
    /** Whether it should be drawn now: valid, visible, in the local player's dimension (or -2147483648) and, when it streams, within streamingDistance. The server's labels read their visible alone. */
    readonly isStreamedIn: boolean;
    /** Outline colour, each component clamped to 0..255; on assigning a missing one keeps its value. Opaque black by default. */
    get outlineColor(): { r: number; g: number; b: number; a: number };
    set outlineColor(value: { r?: number; g?: number; b?: number; a?: number });
    /** Outline width, a whole number of at least 0; 0 draws no outline. */
    outlineWidth: number;
    /** Where the label is, a copy; on assigning a missing or non-numeric component becomes 0. */
    pos: Vector3Like;
    /** The server's id of a label of the server; 0 for one this client made. */
    readonly remoteId: number;
    /** The server's id of a label of the server; 0 for one this client made. */
    readonly remoteID: number;
    /** Kept and sent, {0, 0, 0} by default, but not used for drawing. */
    rot: Vector3Like;
    /** Size multiplier, at least 0, 1 by default; the drawn size is scale × fontSize × 0.35 / 18, clamped to 0.1..2. */
    scale: number;
    /** Distance from the local player within which a label made with streaming is drawn (at least 0); 0 for a label without streaming and for the server's labels. */
    readonly streamingDistance: number;
    /** Always null: a text label has no target player, a local one nor the server's (the server shows its labels to every player). */
    readonly target: null;
    /** The text drawn; anything assigned is turned into text, a falsy value into the empty string. */
    text: string;
    /** BaseObjectType.TextLabel (23). */
    readonly type: 23;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
    /** Whether it is drawn, true by default. */
    visible: boolean;
}

export const TextLabelAlignment: {
    readonly Center: any;
    readonly Justify: any;
    readonly Left: any;
    readonly Right: any;
};

export const Utils: {
    /** a + b component-wise, as a plain object; a missing or non-numeric component counts as 0. */
    add(a: Vector3Like, b: Vector3Like): Vector3Like;
    /** Throws an Error with message ("Assertion failed" by default) when condition is falsy. */
    assert(condition: any, message?: string): void;
    /** value limited to min..max; a non-number counts as 0, so max must be given. When min is above max the result is max. */
    clamp(value: number, min: number, max: number): number;
    readonly ConsoleCommand: typeof UtilsConsoleCommand;
    /** The cross product a × b as a plain object; a missing or non-numeric component counts as 0. */
    cross(a: Vector3Like, b: Vector3Like): Vector3Like;
    /** Degrees to radians; a non-number counts as 0. */
    degToRad(degrees: number): number;
    /** The distance between two points; a missing or non-numeric component counts as 0. */
    distance(a: Vector3Like, b: Vector3Like): number;
    /** v / scalar as a plain object; (0, 0, 0) when the scalar's magnitude is below 0.000001, 0 included. A scalar that is not a number counts as 1, so v comes back unchanged. */
    divide(v: Vector3Like, scalar: number): Vector3Like;
    /** The dot product of a and b; a missing or non-numeric component counts as 0. */
    dot(a: Vector3Like, b: Vector3Like): number;
    /** Draws the text every frame with drawText2dThisFrame's arguments until destroy() of the returned EveryTick object; align is a varion.TextAlign. */
    drawText2d(text: string, pos?: Vector2Like, font?: number, scale?: number, color?: { r?: number; g?: number; b?: number; a?: number }, outline?: boolean, dropShadow?: boolean, align?: number): { id: number; destroy(): void };
    /** Draws text on the screen for this frame only: pos in fractions of the screen (0.5, 0.5 by default), font a GameFont (0), scale 0.5, colour white (components clamped to 0..255), outline and drop shadow unless false. align is a varion.TextAlign (Center 0 by default, Left 1, Right 2, GTA's own codes); right-aligned text ends at pos.x. Call it every frame, e.g. from everyTick. */
    drawText2dThisFrame(text: string, pos?: Vector2Like, font?: number, scale?: number, color?: { r?: number; g?: number; b?: number; a?: number }, outline?: boolean, dropShadow?: boolean, align?: number): void;
    /** Draws the text every frame with drawText3dThisFrame's arguments until destroy() of the returned EveryTick object; align is a varion.TextAlign. */
    drawText3d(text: string, pos?: Vector3Like, font?: number, scale?: number, color?: { r?: number; g?: number; b?: number; a?: number }, outline?: boolean, dropShadow?: boolean, align?: number): { id: number; destroy(): void };
    /** As drawText2dThisFrame, at a world position ((0, 0, 0) by default, through SET_DRAW_ORIGIN) and for this frame only; align is a varion.TextAlign, and right alignment keeps GTA's default wrap there. */
    drawText3dThisFrame(text: string, pos?: Vector3Like, font?: number, scale?: number, color?: { r?: number; g?: number; b?: number; a?: number }, outline?: boolean, dropShadow?: boolean, align?: number): void;
    readonly EveryTick: typeof UtilsEveryTick;
    /** The streamed-in object nearest to options.pos (the local player's position by default) within options.range metres (any distance by default); a tie goes to the lower id, null when there is none. */
    getClosestObject(options?: { pos?: Vector3Like; range?: number }): Object | null;
    /** The streamed-in remote player nearest to options.pos (the local player's position by default) within options.range metres (any distance by default); the local player is not counted, a tie goes to the lower id, null when there is none. */
    getClosestPlayer(options?: { pos?: Vector3Like; range?: number }): Player | null;
    /** The streamed-in vehicle nearest to options.pos (the local player's position by default) within options.range metres (any distance by default), native vehicles included; a tie goes to the lower id, null when there is none. */
    getClosestVehicle(options?: { pos?: Vector3Like; range?: number }): Vehicle | NativeVehicle | null;
    /** The streamed-in virtual entity nearest to options.pos (the local player's position by default) within options.range metres (any distance by default); a tie goes to the lower id, null when there is none. */
    getClosestVirtualEntity(options?: { pos?: Vector3Like; range?: number }): VirtualEntity | null;
    /** The object GTA placed itself (a prop of the map or a piece of one, not an object a server or a script made) nearest to options.pos (the local player's position by default) within options.range metres (any distance by default), as a LocalObject with isWorldObject true: the same one while the object lasts, its pos and rot GTA's, and destroy() only forgets it. null when there is none, and in the browser runtime. */
    getClosestWorldObject(options?: { pos?: Vector3Like; range?: number }): LocalObject | null;
    /** varion.getEntitiesInDimension: the players (the local one once valid), vehicles, objects, peds and virtual entities this client knows in that dimension; native vehicles and NPCs only for the local player's dimension. */
    getEntitiesInDimension(dimension: number): Array<Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity>;
    /** varion.getObjectsInDimension: the server's objects this client knows in that dimension. */
    getObjectsInDimension(dimension: number): Object[];
    /** varion.getPedsInDimension: the peds this client knows in that dimension, plus the native NPCs when it is the local player's. */
    getPedsInDimension(dimension: number): Array<Ped | NativePed>;
    /** varion.getPlayersInDimension: the players this client knows in that dimension, the local player included once valid. */
    getPlayersInDimension(dimension: number): Player[];
    /** varion.getVehiclesInDimension: the vehicles this client knows in that dimension, plus the native ones when it is the local player's. */
    getVehiclesInDimension(dimension: number): Array<Vehicle | NativeVehicle>;
    /** value as JSON indented by 2 spaces; an object inside itself is written as "[Circular]", while one met again on another branch is written in full; undefined for undefined or a function, and a BigInt throws a TypeError. */
    inspect(value: any): string | undefined;
    readonly Interval: typeof UtilsInterval;
    /** Whether Number(value) is NaN: true for undefined and text that is not a number, false for null and "". */
    isNaN(value: any): boolean;
    readonly Keybind: typeof UtilsKeybind;
    /** a + (b - a) * t for numbers, t not clamped; a non-number counts as 0. */
    lerp(a: number, b: number, t: number): number;
    /** Loads the map around pos with GTA's load scene (radius in metres, at least 1, default 50), resolves once it is loaded and stops the scene either way. Rejects with code VARION_SCENE_LOAD_BUSY while another loadMapArea runs, VARION_SCENE_LOAD_REFUSED when GTA refuses, VARION_TIMEOUT after timeoutMs (default 5000) or VARION_RESOURCE_STOPPED. */
    loadMapArea(pos: Vector3Like, radius?: number, timeoutMs?: number): Promise<void>;
    readonly Marker: typeof UtilsMarker;
    /** v * scalar as a plain object; a non-number scalar or component counts as 0. */
    mul(v: Vector3Like, scalar: number): Vector3Like;
    /** (-x, -y, -z) as a plain object; a non-numeric component counts as 0. */
    neg(v: Vector3Like): Vector3Like;
    readonly NextTick: typeof UtilsNextTick;
    /** v scaled to length 1 as a plain object; (0, 0, 0) when its length is below 0.000001. */
    normalize(v: Vector3Like): Vector3Like;
    /** Radians to degrees; a non-number counts as 0. */
    radToDeg(radians: number): number;
    /** A random whole number from ceil(min) to floor(max), both included (Math.random); ceil(min) when max is below it. */
    randomInt(min: number, max: number): number;
    /** Takes a high-resolution headshot (REGISTER_PEDHEADSHOT_HIRES) of a ped or player, by script handle or an object whose scriptID is read again until it is set, and resolves its PNG as base64; the headshot is unregistered afterwards. Rejects when no headshot is ready within 10 s or its capture fails, and with a TypeError for a number that is not a positive whole number. */
    registerPedheadshot3Base64(ped: number | { scriptID: number }): Promise<string>;
    /** Takes a headshot (REGISTER_PEDHEADSHOT) of a ped or player, by script handle or an object whose scriptID is read again until it is set, and resolves its PNG as base64; the headshot is unregistered afterwards. Rejects when no headshot is ready within 10 s or its capture fails, and with a TypeError for a number that is not a positive whole number. */
    registerPedheadshotBase64(ped: number | { scriptID: number }): Promise<string>;
    /** Takes a headshot on a transparent background (REGISTER_PEDHEADSHOT_TRANSPARENT) of a ped or player, by script handle or an object whose scriptID is read again until it is set, and resolves its PNG as base64; the headshot is unregistered afterwards. Rejects when no headshot is ready within 10 s or its capture fails, and with a TypeError for a number that is not a positive whole number. */
    registerPedheadshotTransparentBase64(ped: number | { scriptID: number }): Promise<string>;
    /** Requests an animation dictionary and resolves once GTA has loaded it, checking about once a frame. Rejects after timeoutMs (default 5000; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    requestAnimDict(name: string, timeoutMs?: number): Promise<void>;
    /** Requests an animation set (REQUEST_ANIM_SET) and resolves once GTA has loaded it, checking about once a frame. Rejects after timeoutMs (default 5000; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    requestAnimSet(name: string, timeoutMs?: number): Promise<void>;
    /** Requests a clip set (REQUEST_CLIP_SET) and resolves once GTA has loaded it, checking about once a frame. Rejects after timeoutMs (default 5000; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    requestClipSet(name: string, timeoutMs?: number): Promise<void>;
    /** Requests a cutscene (REQUEST_CUTSCENE with flags, 8 by default) and resolves once HAS_CUTSCENE_LOADED reports it loaded. Rejects after timeoutMs (default 5000; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    requestCutscene(name: string, flags?: number, timeoutMs?: number): Promise<void>;
    /** Requests a model by name or hash and resolves once GTA has loaded it (waitForModel without the hash). Rejects after timeoutMs (default 5000, at least 500; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    requestModel(model: string | number, timeoutMs?: number): Promise<void>;
    /** The squared distance between two points; a missing or non-numeric component counts as 0. */
    squaredDistance(a: Vector3Like, b: Vector3Like): number;
    /** a - b component-wise, as a plain object; a missing or non-numeric component counts as 0. */
    sub(a: Vector3Like, b: Vector3Like): Vector3Like;
    readonly Timeout: typeof UtilsTimeout;
    readonly Timer: typeof UtilsTimer;
    /** The length of v; a missing or non-numeric component counts as 0. */
    vectorLength(v: Vector3Like): number;
    /** Resolves after that many milliseconds (default 0: the next frame); timers are checked once a frame. Rejects with code VARION_RESOURCE_STOPPED when the resource stops first. */
    wait(milliseconds?: number): Promise<void>;
    /** Calls predicate now and then about once a frame, awaiting a Promise it returns, and resolves to its first truthy value. Rejects when it throws, after timeoutMs (default 5000; code VARION_TIMEOUT) or when the resource stops (VARION_RESOURCE_STOPPED); a predicate that is not a function rejects with a TypeError. */
    waitFor<T>(predicate: () => T, timeoutMs?: number): Promise<Exclude<Awaited<T>, false | 0 | "" | null | undefined>>;
};

/** Runtime path: `varion.Utils.ConsoleCommand` */
export class UtilsConsoleCommand {
    /** Registers a command of this client's F8 console: `callback` gets the words after the name as strings. The name is compared in lower case; a callback that is not a function throws a `TypeError`. */
    constructor(name: string, callback: (...args: string[]) => void);
    /** Stops answering the command; later calls do nothing. */
    destroy(): void;
    /** The command name in lower case. Assigning another changes which command it answers (give it in lower case). */
    name: string;
}

/** Runtime path: `varion.Utils.EveryTick` */
export class UtilsEveryTick {
    constructor(...args: any[]);
    /** Stops the calls every frame; later calls do nothing. */
    destroy(): void;
    /** The id varion.everyTick gave this callback: clearEveryTick and clearTimer take it too. */
    id: number;
}

/** Runtime path: `varion.Utils.Interval` */
export class UtilsInterval {
    constructor(...args: any[]);
    /** Stops the repeated calls; later calls do nothing. */
    destroy(): void;
    /** The id varion.setInterval gave this timer: clearInterval and clearTimer take it too. */
    id: number;
}

/** Runtime path: `varion.Utils.Keybind` */
export class UtilsKeybind {
    /** Calls `callback` when one of the keys goes up, or down with `eventType` "keydown" (any other value means "keyup"); `destroy()` removes it. A callback that is not a function throws a `TypeError`. */
    constructor(keyCode: number | number[], callback: () => void, eventType?: "keydown" | "keyup");
    /** Stops listening, through the event eventType names at that moment; later calls do nothing. */
    destroy(): void;
    /** The event it listens to, "keyup" or "keydown" (anything else counts as "keyup"). Assigning moves the listener to the new event, and destroy() then removes it from there. */
    eventType: "keydown" | "keyup";
    /** The virtual key codes it answers to; adding to or removing from the set changes that. */
    keys: Set<number>;
}

/** Runtime path: `varion.Utils.Marker` */
export class UtilsMarker {
    /** Draws a GTA marker every frame only for this client, in every dimension, until destroy(). Defaults: type 1, scale 1, colour 255, 255, 255, 180, no direction or rotation; a type or scale component of 0 is kept, as only a missing or non-numeric one takes the default. */
    constructor(pos: Vector3Like, options?: { type?: number; dir?: Vector3Like; rot?: Vector3Like; scale?: Vector3Like | number; color?: { r: number; g: number; b: number; a?: number }; bobUpAndDown?: boolean; faceCamera?: boolean; p19?: number; rotate?: boolean; textureDict?: string; textureName?: string; drawOnEnts?: boolean; visible?: boolean });
    /** Bobs the marker up and down; options.bobUpAndDown, false by default. */
    bobUpAndDown: boolean;
    /** Colour, read every frame and clamped to 0..255 when drawn (a missing alpha draws as 255); options.color, {r: 255, g: 255, b: 255, a: 180} by default. */
    color: { r: number; g: number; b: number; a?: number };
    /** Stops drawing it for good and sets visible to false. */
    destroy(): void;
    /** Direction vector passed to DRAW_MARKER, read every frame; options.dir, {0, 0, 0} by default. A non-numeric component draws as 0. */
    dir: Vector3Like;
    /** DRAW_MARKER's drawOnEnts flag; options.drawOnEnts, false by default. */
    drawOnEnts: boolean;
    /** Draws the marker once now (DRAW_MARKER) when visible; the marker already calls it every frame until destroy(), so a call of your own draws it twice in that frame. */
    drawThisFrame(): void;
    /** Turns the marker to face the camera; options.faceCamera, false by default. */
    faceCamera: boolean;
    /** DRAW_MARKER's p19 argument; options.p19, 2 by default. */
    p19: number;
    /** Where it is drawn, read every frame and in every dimension; a non-numeric component draws as 0. */
    pos: Vector3Like;
    /** Rotation in degrees passed to DRAW_MARKER, read every frame; options.rot, {0, 0, 0} by default. */
    rot: Vector3Like;
    /** Spins the marker; options.rotate, false by default. */
    rotate: boolean;
    /** Size on each axis; options.scale may be a vector or one number for all three, {1, 1, 1} by default. A component of 0 is drawn as 0; one missing or not a number draws as 1. */
    scale: Vector3Like;
    /** Texture dictionary for DRAW_MARKER, null for the marker's own texture; options.textureDict. */
    textureDict: string | null;
    /** Texture name for DRAW_MARKER, null for the marker's own texture; options.textureName. */
    textureName: string | null;
    /** Marker type (MarkerType); options.type, 1 when missing or not a number, so 0 (a cone) is kept. */
    type: number;
    /** Whether it is drawn; options.visible, true by default. destroy() sets it to false. */
    visible: boolean;
}

/** Runtime path: `varion.Utils.NextTick` */
export class UtilsNextTick {
    constructor(...args: any[]);
    /** Cancels the call if it has not run yet; later calls do nothing. */
    destroy(): void;
    /** The id varion.nextTick gave this callback: clearNextTick and clearTimer take it too. */
    id: number;
}

/** Runtime path: `varion.Utils.Timeout` */
export class UtilsTimeout {
    constructor(...args: any[]);
    /** Cancels the call if it has not run yet; later calls do nothing. */
    destroy(): void;
    /** The id varion.setTimeout gave this timer: clearTimeout and clearTimer take it too. */
    id: number;
}

/** Runtime path: `varion.Utils.Timer` */
export class UtilsTimer {
    /** Starts a timer that calls `callback` every `ms` milliseconds, or once when `once` is true; a negative or non-numeric `ms` is 0. A callback that is not a function throws a `TypeError`; `destroy()` stops it. */
    constructor(callback: () => void, ms: number, once?: boolean);
    /** Cancels the timer; later calls do nothing. */
    destroy(): void;
    /** The id varion.setTimeout or varion.setInterval gave it; varion.clearTimer(id) cancels it too. */
    id: number;
}

export class Vector2 {
    /** Creates a 2D vector from two numbers, an array, an object with x, y, or one number for both; a missing or non-numeric component is 0, so `new Vector2()` is 0, 0. */
    constructor(x: number, y: number);
    constructor(value?: number);
    constructor(xy: number[]);
    constructor(v: Vector2Like);
    /** Vector2(0, -1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly down: Vector2;
    /** Vector2(-1, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly left: Vector2;
    /** Vector2(-Infinity, -Infinity). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly negativeInfinity: Vector2;
    /** Vector2(1, 1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly one: Vector2;
    /** Vector2(Infinity, Infinity). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly positiveInfinity: Vector2;
    /** Vector2(1, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly right: Vector2;
    /** Vector2(0, 1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly up: Vector2;
    /** Vector2(0, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly zero: Vector2;
    /** The sum with the argument, component-wise, as a new Vector2. The argument is x, y; an array; an object with x, y; or one number for both; a non-numeric component counts as 0. */
    add(x: number, y: number): Vector2;
    add(value: Vector2Like | number[] | number): Vector2;
    /** The angle to the other vector in radians, 0..π; 0 when either has length 0. Only the first argument is read: an object, an array or one number for both components. */
    angleTo(value: Vector2Like | number[] | number): number;
    /** angleTo in degrees, 0..180. */
    angleToDegrees(value: Vector2Like | number[] | number): number;
    /** The distance to the point. Only the first argument is read (an object, an array or one number for both components), so distanceTo(x, y) uses x for both. */
    distanceTo(value: Vector2Like | number[] | number): number;
    /** The squared distance to the point; the argument is read as distanceTo reads it. */
    distanceToSquared(value: Vector2Like | number[] | number): number;
    /** This divided by the argument, component-wise, as a new Vector2 (division by 0 gives Infinity or NaN). The argument is x, y; an array; an object with x, y; or one number for both. */
    div(x: number, y: number): Vector2;
    div(value: Vector2Like | number[] | number): Vector2;
    /** The dot product with the argument: x, y; an array; an object with x, y; or one number for both components. */
    dot(x: number, y: number): number;
    dot(value: Vector2Like | number[] | number): number;
    /** (1 / x, 1 / y) as a new Vector2 (1 / 0 is Infinity). */
    inverse(): Vector2;
    /** Whether the distance to value is at most range. */
    isInRange(value: Vector2Like | number[] | number, range: number): boolean;
    /** Its length, Math.hypot(x, y). */
    readonly length: number;
    /** this + (value - this) * ratio as a new Vector2; ratio is not clamped. */
    lerp(value: Vector2Like | number[] | number, ratio: number): Vector2;
    /** This multiplied by the argument, component-wise, as a new Vector2 (one number scales the vector). The argument is x, y; an array; an object with x, y; or one number for both. */
    mul(x: number, y: number): Vector2;
    mul(value: Vector2Like | number[] | number): Vector2;
    /** (-x, -y) as a new Vector2. */
    negative(): Vector2;
    /** A new Vector2 of length 1 in the same direction; for a zero vector, a new zero vector. */
    normalize(): Vector2;
    /** The difference with the argument, component-wise, as a new Vector2. The argument is x, y; an array; an object with x, y; or one number for both; a non-numeric component counts as 0. */
    sub(x: number, y: number): Vector2;
    sub(value: Vector2Like | number[] | number): Vector2;
    /** [x, y]. */
    toArray(): [number, number];
    /** Each component multiplied by 180 / π (radians to degrees), as a new Vector2. */
    toDegrees(): Vector2;
    /** A new Vector2 with each component rounded to precision decimals (4 by default); a precision outside 0..100 throws a RangeError. */
    toFixed(precision?: number): Vector2;
    /** Each component multiplied by π / 180 (degrees to radians), as a new Vector2. */
    toRadians(): Vector2;
    /** Text of the form "Vector2{ x: 1, y: 2 }". */
    toString(): string;
    /** The x component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    x: number;
    /** The y component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    y: number;
}

export class Vector3 {
    /** Creates a 3D vector from three numbers, an array, an object with x, y, z (another Vector3 among them), or one number for all three; a missing or non-numeric component is 0, so `new Vector3()` is 0, 0, 0. */
    constructor(x: number, y: number, z?: number);
    constructor(value?: number);
    constructor(xyz: number[]);
    constructor(v: Vector3Like);
    /** Vector3(0, -1, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly back: Vector3;
    /** Vector3(0, 0, -1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly down: Vector3;
    /** Vector3(0, 1, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly forward: Vector3;
    /** Vector3(-1, 0, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly left: Vector3;
    /** Vector3(-Infinity, -Infinity, -Infinity). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly negativeInfinity: Vector3;
    /** Vector3(1, 1, 1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly one: Vector3;
    /** Vector3(Infinity, Infinity, Infinity). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly positiveInfinity: Vector3;
    /** Vector3(1, 0, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly right: Vector3;
    /** Vector3(0, 0, 1). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly up: Vector3;
    /** Vector3(0, 0, 0). A new instance on every read; assigning the constant itself throws in strict code. */
    static readonly zero: Vector3;
    /** The sum with the argument, component-wise, as a new Vector3. The argument is x, y, z; an array; an object with x, y, z; or one number for all three; a non-numeric component counts as 0. */
    add(x: number, y: number, z: number): Vector3;
    add(value: Vector3Like | number[] | number): Vector3;
    /** The angle to the other vector in radians, 0..π; 0 when either has length 0. Only the first argument is read: an object, an array or one number for all components. */
    angleTo(value: Vector3Like | number[] | number): number;
    /** angleTo in degrees, 0..180. */
    angleToDegrees(value: Vector3Like | number[] | number): number;
    /** The cross product of this vector and the argument as a new Vector3. The argument is x, y, z; an array; an object with x, y, z; or one number for all three. */
    cross(x: number, y: number, z: number): Vector3;
    cross(value: Vector3Like | number[] | number): Vector3;
    /** The distance to the point. Only the first argument is read (an object, an array or one number for all components), so distanceTo(x, y, z) uses x for all three. */
    distanceTo(value: Vector3Like | number[] | number): number;
    /** The squared distance to the point; the argument is read as distanceTo reads it. */
    distanceToSquared(value: Vector3Like | number[] | number): number;
    /** This divided by the argument, component-wise, as a new Vector3 (division by 0 gives Infinity or NaN). The argument is x, y, z; an array; an object with x, y, z; or one number for all three. */
    div(x: number, y: number, z: number): Vector3;
    div(value: Vector3Like | number[] | number): Vector3;
    /** The dot product with the argument: x, y, z; an array; an object with x, y, z; or one number for all three components. */
    dot(x: number, y: number, z: number): number;
    dot(value: Vector3Like | number[] | number): number;
    /** (1 / x, 1 / y, 1 / z) as a new Vector3 (1 / 0 is Infinity). */
    inverse(): Vector3;
    /** Whether the distance to value is at most range. */
    isInRange(value: Vector3Like | number[] | number, range: number): boolean;
    /** Its length, Math.hypot(x, y, z). */
    readonly length: number;
    /** this + (value - this) * ratio as a new Vector3; ratio is not clamped. */
    lerp(value: Vector3Like | number[] | number, ratio: number): Vector3;
    /** This multiplied by the argument, component-wise, as a new Vector3 (one number scales the vector). The argument is x, y, z; an array; an object with x, y, z; or one number for all three. */
    mul(x: number, y: number, z: number): Vector3;
    mul(value: Vector3Like | number[] | number): Vector3;
    /** (-x, -y, -z) as a new Vector3. */
    negative(): Vector3;
    /** A new Vector3 of length 1 in the same direction; for a zero vector, a new zero vector. */
    normalize(): Vector3;
    /** The difference with the argument, component-wise, as a new Vector3. The argument is x, y, z; an array; an object with x, y, z; or one number for all three; a non-numeric component counts as 0. */
    sub(x: number, y: number, z: number): Vector3;
    sub(value: Vector3Like | number[] | number): Vector3;
    /** [x, y, z]. */
    toArray(): [number, number, number];
    /** Each component multiplied by 180 / π (radians to degrees), as a new Vector3. */
    toDegrees(): Vector3;
    /** A new Vector3 with each component rounded to precision decimals (4 by default); a precision outside 0..100 throws a RangeError. */
    toFixed(precision?: number): Vector3;
    /** Each component multiplied by π / 180 (degrees to radians), as a new Vector3. */
    toRadians(): Vector3;
    /** Text of the form "Vector3{ x: 1, y: 2, z: 3 }". */
    toString(): string;
    /** The x component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    x: number;
    /** The y component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    y: number;
    /** The z component, a plain number: the constructor turns a non-number into 0, assigning does not check it. */
    z: number;
}

export class Vehicle {
    private constructor();
    /** instanceof Vehicle holds for every Vehicle and every NativeVehicle. */
    static [Symbol.hasInstance](value: unknown): value is Vehicle | NativeVehicle;
    /** The vehicles of the old path this client knows, streamed in or not, then the native vehicles its GTA has now; LocalVehicles are not included. */
    static readonly all: Array<Vehicle | NativeVehicle>;
    /** The number of Vehicle.all. */
    static readonly count: number;
    /** A vehicle of the old path by its server id, else a native vehicle by the id server scripts know it by; null when this client has neither. */
    static get(id: number): Vehicle | NativeVehicle | null;
    /** The same as Vehicle.get. */
    static getByID(id: number): Vehicle | NativeVehicle | null;
    /** The same as Vehicle.get: on the client the remote id is the server id. */
    static getByRemoteID(id: number): Vehicle | NativeVehicle | null;
    /** The vehicle with this GTA handle: an old-path one streamed in, a LocalVehicle this client made or a native one; null for any other handle. */
    static getByScriptID(scriptID: number): Vehicle | NativeVehicle | LocalVehicle | null;
    /** Those of Vehicle.all that exist in this client's GTA now. */
    static readonly streamedIn: Array<Vehicle | NativeVehicle>;
    /** Alpha 0–255 of its GTA entity (GET_ENTITY_ALPHA) by the newest snapshot; 255 while it is not streamed in. */
    readonly alpha: number;
    /** Attaches its GTA entity to a bone of another entity (an object with scriptID, or a GTA handle) on this client with ATTACH_ENTITY_TO_ENTITY; useSoftPinning and collision default to false, fixedRot to true. Resolves true once GTA ran it, false when either has no GTA entity here or GTA refused (logged). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Whether the server has its collision on, by the newest snapshot; true when the server sent none. */
    readonly collision: boolean;
    /** Removes the key from this client's own data on it (setMeta) and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Drops the key from this client's copy of its stream-synced data (setStreamSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Drops the key from this client's copy of its synced data (setSyncedMeta on the server), without an event. A client cannot change the server's data: nothing is sent, and the server's next change of the key brings it back. */
    deleteSyncedMetaData(key: string): void;
    /** Deletes its GTA entity on this client (DELETE_ENTITY) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    destroy(): Promise<boolean>;
    /** Detaches its GTA entity on this client (DETACH_ENTITY, dynamic, with collision); resolves false when it has no GTA entity here or GTA refused. */
    detach(): Promise<boolean>;
    /** The dimension it is in, by the newest snapshot. */
    readonly dimension: number;
    /** Engine health (GET_VEHICLE_ENGINE_HEALTH, a whole number) by its last sync; 1000 before the first. */
    readonly engineHealth: number;
    /** Whether its engine runs (GET_IS_VEHICLE_ENGINE_RUNNING on the client that simulates it), by its last sync. */
    readonly engineOn: boolean;
    /** Engine temperature read from this client's GTA copy of it; 0 while it is not streamed in or the field could not be read. */
    readonly engineTemperature: number;
    /** Whether its GTA entity exists on this client: false while it has none here (not streamed in) and once the snapshots stop listing it; otherwise what the newest snapshot found (DOES_ENTITY_EXIST). */
    exists(): boolean;
    /** Asks GTA whether its handle exists (DOES_ENTITY_EXIST): false at once when it has no GTA entity here, null when the game did not answer within 150 ms. */
    existsAsync(): Promise<boolean | null>;
    /** Freezes (true) or releases its GTA entity on this client (FREEZE_ENTITY_POSITION); resolves false when it has no GTA entity here or GTA refused. The frozen property does not change. */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Whether the server has it frozen, by the newest snapshot; false when the server sent none. */
    readonly frozen: boolean;
    /** Fuel level read from this client's GTA copy of it; 0 while it is not streamed in or the field could not be read. */
    readonly fuelLevel: number;
    /** Current gear by its last sync. */
    readonly gear: number;
    /** The value setMeta stored under the key on this client, the same value that was stored; undefined for none. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own data on it (setMeta). */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves at once with speed: GET_ENTITY_SPEED in m/s by the newest snapshot, 0 while it is not streamed in. */
    getSpeedAsync(): Promise<number | null>;
    /** The same as getStreamSyncedMetaData: the server's stream-synced value under the key, decoded; undefined for none. */
    getStreamSyncedMeta(key: string): any;
    /** The value the server set as stream-synced data on it (setStreamSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. A value setStreamSyncedMetaData put here reads back as it was set. Cleared when the server streams the entity out of this client. */
    getStreamSyncedMetaData(key: string): any;
    /** The keys of the stream-synced data this client has for it. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** The same as getSyncedMetaData: the server's synced value under the key, decoded; undefined for none. */
    getSyncedMeta(key: string): any;
    /** The value the server set as synced data on it (setSyncedMeta), decoded, with a server object in it resolved to this client's object; undefined for none. */
    getSyncedMetaData(key: string): any;
    /** The keys of the synced data (setSyncedMeta on the server) this client has for it. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta: the server's synced value under the key, decoded; undefined for none. */
    getVariable(key: string): any;
    /** The camber of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelCamber(wheel: number): number;
    /** The height of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelHeight(wheel: number): number;
    /** The rim radius of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelRimRadius(wheel: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index of the surface material under wheel 0–7, read from this client's GTA copy; 0 when unknown. */
    getWheelSurfaceMaterial(wheel: number): number;
    /** The track width of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelTrackWidth(wheel: number): number;
    /** The tyre radius of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelTyreRadius(wheel: number): number;
    /** The tyre width of wheel 0–7 as this client's GTA copy has it (else the server's synced value); 0 for a wheel it does not have or does not know. */
    getWheelTyreWidth(wheel: number): number;
    /** A new HandlingData on each read, the same as varion.getVehicleHandling for its model and GTA handle (see there which fields come from GTA); its handlingNameHash is the model hash. */
    readonly handling: HandlingData;
    /** Whether this client's own data on it (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** The same as hasStreamSyncedMetaData. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Whether this client has stream-synced data under the key for it. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMetaData. */
    hasSyncedMeta(key: string): boolean;
    /** Whether this client has synced data (setSyncedMeta on the server) under the key for it. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** Its heading in degrees: rot.z by the newest snapshot. */
    readonly heading: number;
    /** Its server id, by which its class's get finds it. */
    readonly id: number;
    /** Its turn indicators as this client's copy shows them (the blinker byte GET_VEHICLE_INDICATOR_LIGHTS reads): 0 off, 1 left, 2 right, 3 both, as VehicleIndicatorLights.BlinkLeft and BlinkRight. Assigning is SET_VEHICLE_INDICATOR_LIGHTS here: on the car this client simulates (its driver's) the server takes it and every copy blinks it; on a copy of someone else's car the server's state is set back within a moment. Anything but 0..3 throws a RangeError. */
    indicatorLights: number;
    /** Whether it is wrecked: IS_ENTITY_DEAD by the newest snapshot while it has a GTA entity here, else the destroyed flag of its owner's sync. */
    readonly isDead: boolean;
    /** Asks the game whether the vehicle is wrecked (IS_ENTITY_DEAD) through its GTA entity; null without a GTA entity here or when the game does not answer within 150 ms. */
    isDeadAsync(): Promise<boolean | null>;
    /** Whether its last sync marks it destroyed: the client that simulates it read engine health -4000 or below or body health 0. */
    readonly isDestroyed: boolean;
    /** Always false: a vehicle of the old path (a NativeVehicle reads true). */
    readonly isNative: false;
    /** Always true: the server made it. */
    readonly isRemote: boolean;
    /** Whether it has a GTA entity on this client (scriptID is not 0), by the newest snapshot. */
    readonly isSpawned: boolean;
    /** Whether the server streams it to this client and the newest snapshot did not find its GTA entity gone; false once the snapshots stop listing it. It may still wait for its GTA entity (see isSpawned). */
    readonly isStreamedIn: boolean;
    /** Door lock status by its last sync (GET_VEHICLE_DOOR_LOCK_STATUS, 0–10, as VehicleLockState). */
    readonly lockState: number;
    /** Its top gear read from this client's GTA copy of it; 0 while it is not streamed in or the field could not be read. */
    readonly maxGear: number;
    /** A new plain object of this client's own data on it (setMeta) on each read. */
    readonly metaData: Record<string, any>;
    /** Its model hash as the server gave it. */
    readonly model: number;
    /** GET_ENTITY_MODEL of its GTA entity by the newest snapshot, unsigned; 0 while it is not streamed in. */
    readonly nativeModel: number;
    /** The player whose client simulates it (its network owner), by the newest snapshot; null for none. */
    readonly netOwner: PlayerLocal | Player | null;
    /** Oil level read from this client's GTA copy of it; 0 while it is not streamed in or the field could not be read. */
    readonly oilLevel: number;
    /** Petrol tank health (GET_VEHICLE_PETROL_TANK_HEALTH, a whole number) by its last sync; 1000 before the first. */
    readonly petrolTankHealth: number;
    /** Its position by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly pos: Vector3Like;
    /** The same as id. */
    readonly remoteId: number;
    /** The same as id. */
    readonly remoteID: number;
    /** Resets the alpha of its GTA entity on this client (RESET_ENTITY_ALPHA); resolves false when it has no GTA entity here or GTA refused. */
    resetAlpha(): Promise<boolean>;
    /** Its rotation in degrees (z is the heading) by the newest snapshot: read from GTA while it is streamed in, else the last synced one. */
    readonly rot: Vector3Like;
    /** Engine revs 0–1 by its last sync, in steps of 1/255. */
    readonly rpm: number;
    /** Its GTA handle on this client by the newest snapshot; 0 while it has no GTA entity here and once the snapshots stop listing it. */
    readonly scriptID: number;
    /** Its seats including the driver's (GET_VEHICLE_MAX_NUMBER_OF_PASSENGERS + 1), read when this client created it in GTA; 0 before that. */
    readonly seatCount: number;
    /** Sets the alpha of its GTA entity on this client (SET_ENTITY_ALPHA): alpha is clamped to 0–255 and made whole (a non-number counts as 0) and skin is passed on as the native's skin flag. Resolves false when it has no GTA entity here or GTA refused. */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Turns collision of its GTA entity on or off on this client (SET_ENTITY_COLLISION); keepPhysics defaults to true. Resolves false when it has no GTA entity here or GTA refused. The collision property does not change. */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Stores the value under the key on this client and fires metaChange; an object given alone sets each of its entries. The data never leaves the client; an entity's is cleared when the server streams it out of this client and when the session ends. */
    setMeta(key: string, value: any): void;
    setMeta(values: Record<string, any>): void;
    /** Moves its GTA entity on this client (SET_ENTITY_COORDS, clearing the area) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Turns its GTA entity on this client (SET_ENTITY_ROTATION, degrees, rotation order 2) and resolves true once that ran; false when it has no GTA entity here or GTA refused. The server is not told. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Puts the value under the key into this client's copy of its stream-synced data, read back as it was set, without an event. A client cannot change the server's data: nothing is sent, so the server and other clients never see it; a change of the key from the server overwrites it, and it is cleared when the server streams the entity out of this client. */
    setStreamSyncedMetaData(key: string, value: any): void;
    /** Shows or hides its GTA entity on this client with SET_ENTITY_VISIBLE; resolves true once GTA ran it, false when it has no GTA entity here or GTA refused. */
    setVisible(visible: boolean): Promise<boolean>;
    /** Writes the camber of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelCamber(wheel: number, value: number): void;
    /** Writes the height of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelHeight(wheel: number, value: number): void;
    /** Writes the rim radius of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelRimRadius(wheel: number, value: number): void;
    /** Writes the track width of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelTrackWidth(wheel: number, value: number): void;
    /** Writes the tyre radius of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelTyreRadius(wheel: number, value: number): void;
    /** Writes the tyre width of wheel 0–7 into its GTA copy on this client only; ignored for a wheel outside 0–7, a value that is not finite or beyond ±100, and while it has no GTA entity here. The next snapshot reads the value back from GTA. */
    setWheelTyreWidth(wheel: number, value: number): void;
    /** Its speed in m/s: GET_ENTITY_SPEED by the newest snapshot; 0 while it is not streamed in. */
    readonly speed: number;
    /** Its velocity in m/s from its last sync, by the newest snapshot. */
    readonly speedVector: Vector3Like;
    /** Steering angle in degrees by its last sync. */
    readonly steeringAngle: number;
    /** Whether the server streams it to this client, by the newest snapshot; false once the snapshots stop listing it. */
    readonly streamed: boolean;
    /** A new plain object of the stream-synced data this client has for it on each read. */
    readonly streamSyncedMetaData: Record<string, any>;
    /** Always 1 (BaseObjectType.Vehicle). */
    readonly type: number;
    /** Whether this client still has it: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone; a kept object turns false once the snapshots stop listing it. */
    readonly valid: boolean;
    /** Whether it is visible: IS_ENTITY_VISIBLE by the newest snapshot while it is streamed in, else the server's setting (true when none was sent). */
    readonly visible: boolean;
    /** How many wheels its GTA copy on this client has (at most 8), else as the server's wheel layout says; 0 when unknown. A setWheel… call raises it on this object. */
    readonly wheelsCount: number;
}

export const VehicleIndicatorLights: {
    readonly BlinkLeft: any;
    readonly BlinkPermBoth: any;
    readonly BlinkRight: any;
    readonly Interior: any;
    readonly None: any;
    readonly StaticBoth: any;
};

export const VehicleLockState: {
    readonly CanBeBrokenInto: any;
    readonly CanBeBrokenIntoPersist: any;
    readonly CannotBeTriedToEnter: any;
    readonly Locked: any;
    readonly LockedForPlayer: any;
    readonly None: any;
    readonly StickPlayerInside: any;
    readonly Unlocked: any;
};

export class VirtualEntity {
    private constructor();
    /** The server's virtual entities streamed in to this client now (it holds no others); a new array on each read. */
    static readonly all: VirtualEntity[];
    /** The virtual entity with this server id among those streamed in; null for none. */
    static get(id: number): VirtualEntity | null;
    /** The same as VirtualEntity.get. */
    static getByRemoteID(id: number): VirtualEntity | null;
    /** The same entities as VirtualEntity.all: this client holds only the streamed-in ones. */
    static readonly streamedIn: VirtualEntity[];
    /** Always 255: a virtual entity has no GTA entity, so there is no alpha to read. */
    readonly alpha: number;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    attachTo(entity: { scriptID: number } | number, bone?: number, offset?: Partial<Vector3Like>, rotation?: Partial<Vector3Like>, useSoftPinning?: boolean, collision?: boolean, fixedRot?: boolean): Promise<boolean>;
    /** Always true: a virtual entity has no GTA entity whose collision could change. */
    readonly collision: boolean;
    /** Removes the key from this client's own metadata of the entity and fires metaChange with the value undefined; nothing happens when the key is not there. */
    deleteMeta(key: string): void;
    /** Removes the key from this client's copy of its stream-synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the key comes back when the server sets it again. */
    deleteStreamSyncedMetaData(key: string): void;
    /** Removes the key from this client's copy of its synced metadata, without an event. A client cannot change the server's data: nothing is sent, and the key comes back when the server sets it again. */
    deleteSyncedMetaData(key: string): void;
    /** Resolves false without doing anything: a virtual entity is the server's, and only the server removes it. */
    destroy(): Promise<boolean>;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    detach(): Promise<boolean>;
    /** Its dimension, as the server sent it. */
    readonly dimension: number;
    /** The same as valid. */
    exists(): boolean;
    /** Resolves whether this client still knows the virtual entity (it is in the server's latest snapshot); a virtual entity never has a GTA handle to ask about. */
    existsAsync(): Promise<boolean>;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    freezePosition(frozen: boolean): Promise<boolean>;
    /** Always false: a virtual entity has no GTA entity to freeze. */
    readonly frozen: boolean;
    /** The value setMeta stored under the key on this client, undefined for none; this own metadata is dropped when the entity streams out. */
    getMeta(key: string): unknown;
    /** The keys of its own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The same as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** Resolves 0: a virtual entity has no GTA entity and no speed. */
    getSpeedAsync(): Promise<number>;
    /** The stream-synced value the server set under the key, server objects in it as this client's; undefined for none. */
    getStreamSyncedMeta(key: string): unknown;
    /** The same as getStreamSyncedMeta. */
    getStreamSyncedMetaData(key: string): unknown;
    /** The keys of the stream-synced metadata; getStreamSyncedMetaKeys returns the same. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The same as getStreamSyncedMetaDataKeys. */
    getStreamSyncedMetaKeys(): string[];
    /** The synced value the server set under the key, server objects in it as this client's; undefined for none. */
    getSyncedMeta(key: string): unknown;
    /** The same as getSyncedMeta. */
    getSyncedMetaData(key: string): unknown;
    /** The keys of the synced metadata the server set. */
    getSyncedMetaKeys(): string[];
    /** The same as getSyncedMeta: the synced value of the key, undefined for none. */
    getVariable(key: string): unknown;
    /** Its group; null when this client does not know it. */
    readonly group: VirtualEntityGroup | null;
    /** The id of its group, 0 for none. */
    readonly groupId: number;
    /** Whether its own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether the stream-synced metadata holds the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** The same as hasStreamSyncedMeta. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether the server set the key in the synced metadata. */
    hasSyncedMeta(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasSyncedMetaData(key: string): boolean;
    /** The same as hasSyncedMeta. */
    hasVariable(key: string): boolean;
    /** rot.z as the server sent it. */
    readonly heading: number;
    /** Its server id. */
    readonly id: number;
    /** Always false: a virtual entity has no GTA entity, so no health. */
    readonly isDead: boolean;
    /** Resolves false: a virtual entity cannot die. */
    isDeadAsync(): Promise<boolean>;
    /** Always true: virtual entities are the server's. */
    readonly isRemote: true;
    /** Always false: a virtual entity has no GTA entity. */
    readonly isSpawned: boolean;
    /** True while the newest snapshot lists it, which holds only streamed-in virtual entities; a kept object turns false once it streams out. */
    readonly isStreamedIn: boolean;
    /** A new plain object of its own metadata (setMeta) on each read. */
    readonly metaData: Record<string, unknown>;
    /** Always 0: a virtual entity has no GTA entity, so no model. */
    readonly nativeModel: number;
    /** Its position by the newest snapshot; a kept object moves with it. */
    readonly pos: Vector3Like;
    /** Its server id, as id. */
    readonly remoteId: number;
    /** Its server id, as id. */
    readonly remoteID: number;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    resetAlpha(): Promise<boolean>;
    /** Its rotation by the newest snapshot; a kept object follows it. */
    readonly rot: Vector3Like;
    /** Always 0: a virtual entity has no GTA entity. */
    readonly scriptID: number;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    setAlpha(alpha: number, skin?: boolean): Promise<boolean>;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    setCollision(enabled: boolean, keepPhysics?: boolean): Promise<boolean>;
    /** Stores the value under the key in this client's own metadata of the entity and fires metaChange (entity, key, value, old value); an object sets each of its entries. Dropped when the entity streams out. */
    setMeta(key: string, value: unknown): void;
    setMeta(values: Record<string, unknown>): void;
    /** Resolves false without doing anything: a virtual entity has no GTA entity to move (scriptID 0), and its position is the server's. */
    setPos(x: number, y: number, z: number): Promise<boolean>;
    /** Resolves false without doing anything: a virtual entity has no GTA entity to turn (scriptID 0), and its rotation is the server's. */
    setRot(x: number, y: number, z: number): Promise<boolean>;
    /** Writes the value into this client's copy only, without an event. A client cannot change the server's data: nothing is sent, and the server's next value for the key replaces it. */
    setStreamSyncedMetaData(key: string, value: unknown): void;
    /** Resolves false without doing anything: a virtual entity has no GTA entity (scriptID 0). */
    setVisible(visible: boolean): Promise<boolean>;
    /** Always 0: a virtual entity has no GTA entity whose speed could be read. */
    readonly speed: number;
    /** The same as isStreamedIn. */
    readonly streamed: boolean;
    /** Its own streaming distance when the server set one, else its group's maxStreamingDistance (400 when the group is unknown). */
    readonly streamingDistance: number;
    /** A new plain object of its stream-synced metadata on each read. */
    readonly streamSyncedMetaData: Record<string, unknown>;
    /** BaseObjectType.VirtualEntity (9). */
    readonly type: 9;
    /** Whether this client still has it: the newest snapshot lists it, which holds only streamed-in virtual entities; a kept object turns false once it streams out, and true again when it streams back in. */
    readonly valid: boolean;
    /** The server's visible flag of it, true by default. */
    readonly visible: boolean;
}

export class VirtualEntityGroup {
    /** No instances of its own: the server makes the groups, and this client gets them with get and all; new throws a TypeError. */
    private constructor();
    /** The groups of virtual entities this client was sent in this session; a new array on each read. */
    static readonly all: VirtualEntityGroup[];
    /** The grid cell of a point as "cx:cy": x and y divided by cellSize (at least 1, 100 by default) and floored. A helper that touches no group. */
    static cellKey(x: number, y: number, cellSize?: number): string;
    /** The group with this id; null when this client does not know it. */
    static get(id: number): VirtualEntityGroup | null;
    /** The group id. */
    readonly id: number;
    /** How many of its entities the server streams to a player at most, 128 by default. */
    readonly maxEntitiesInStream: number;
    /** Its streaming distance in metres, 400 by default. */
    readonly maxStreamingDistance: number;
    /** Its entities streamed in to this client now. */
    readonly streamedIn: VirtualEntity[];
}

export const Voice: {
    /** Virtual key code of the push-to-talk key, from the client's settings (78, the N key, until the first update). */
    readonly activationKey: number;
    /** Voice-activation sensitivity 0..100 (higher triggers more easily), 37 by default; assigning is clamped and truncated. */
    activationLevel: number;
    /** Id of the voice channel this player talks in now, 0 for none: of the channels it is a member of and not muted in, the one of the highest priority. */
    readonly activeChannel: number;
    /** Voice activation: while true the microphone transmits when it is loud enough instead of on push-to-talk. */
    activityInputEnabled: boolean;
    /** Unmutes every player muted with mutePlayer. */
    clearLocallyMuted(): void;
    /** The microphones Windows reports, as frozen {name, uuid}: uuid is the endpoint id for inputDevice, null for the default one. */
    getAvailableInputDevices(): Array<{ name: string; uuid: string | null }>;
    /** The voice channel with this id, the active one when omitted; null for none. */
    getChannel(channelId?: number): VoiceChannel | null;
    /** The players of that channel this client knows, the active channel's when omitted; [] for none. */
    getPlayersInChannel(channelId?: number): Player[];
    /** The microphone in use by its endpoint id (a uuid of getAvailableInputDevices); null for the system default, which assigning null selects. */
    inputDevice: string | null;
    /** The same as muteInput, read-only. */
    readonly inputMuted: boolean;
    /** Whether mutePlayer muted that player on this client; a change shows after the next update from the game. */
    isPlayerLocallyMuted(player: { id: number } | number): boolean;
    /** Whether the server muted that player in the active voice channel; false without one. */
    isPlayerMuted(player: { id: number } | number): boolean;
    /** Whether voice from that player arrived within the last 450 ms; for the local player, whether its microphone transmits. */
    isPlayerTalking(player: { id: number } | number): boolean;
    /** While true the microphone sends nothing. */
    muteInput: boolean;
    /** Stops playing that player's voice on this client; others still hear them. A player or an id; 0 is ignored. */
    mutePlayer(player: { id: number } | number): void;
    /** Noise suppression of the microphone, from the client's settings until assigned. */
    noiseSuppressionEnabled: boolean;
    /** Whether the push-to-talk key is held now. */
    readonly pushToTalk: boolean;
    /** true makes the microphone transmit continuously, as if push-to-talk were held, while the player is in a voice channel and input is not muted; false returns to push-to-talk or voice activation. */
    toggleInput(enabled: boolean): void;
    /** Plays that player's voice again after mutePlayer. A player or an id; 0 is ignored. */
    unmutePlayer(player: { id: number } | number): void;
    /** False after varion.toggleVoiceControls(false): push-to-talk and voice activation then send nothing (toggleInput still does). */
    readonly voiceControlsEnabled: boolean;
    /** Volume of other players' voices, 0..2 (clamped; a non-number counts as 0), starting from the client's settings; 0 reads back as 0. */
    volume: number;
};

export class VoiceChannel {
    /** Obtained from `VoiceChannel.getByID(id)` or `varion.Voice.getChannel(channelId)`: this client's view of a server voice channel (members, `spatial`, `maxDistance`, `volume`); channels are created on the server. */
    private constructor();
    /** The voice channel with this id; null when this client has no such channel. */
    static getByID(id: number): VoiceChannel | null;
    /** The channel's audio filter, null for none. */
    readonly filter: AudioFilter | null;
    /** The members this client knows, as Player objects. */
    getPlayers(): Player[];
    /** Whether it is the channel this player talks in now (Voice.activeChannel). */
    isActive(): boolean;
    /** Hearing distance in metres of a spatial channel: voices fade to silence there. 50 by default (0 reads as 50). */
    readonly maxDistance: number;
    /** Ids of its members, as of when this object was made. */
    readonly members: number[];
    /** Ids of the members the server muted in it, as of when this object was made. */
    readonly muted: number[];
    /** Whether voices in it fade with distance, up to maxDistance. */
    readonly spatial: boolean;
    /** 1 unless assigned: this client's volume of the channel (0..2, clamped), multiplied into every voice heard through it with the player's volume and Voice.volume; kept by channel id until the session ends. */
    volume: number;
}

export const VoiceConnectionState: {
    readonly Connected: any;
    readonly Connecting: any;
    readonly Disconnected: any;
};

export const WatermarkPosition: {
    readonly BottomCenter: any;
    readonly BottomRight: any;
    readonly TopCenter: any;
    readonly TopLeft: any;
    readonly TopRight: any;
};

export class WeaponObject {
    /** Creates a weapon object only for this client with GTA's natives: it loads the weapon's model (REQUEST_WEAPON_ASSET, up to 10 s), makes the object at `pos` (CREATE_WEAPON_OBJECT) and turns it to `rot` in degrees. `model` is a weapon hash or name; `ammo` 0 and `showWorldModel` true by default. GTA's object appears asynchronously (`waitForSpawn()`, `scriptID`). */
    constructor(model: number | string, pos: Vector3Like, rot?: Vector3Like, ammo?: number, showWorldModel?: boolean);
    /** Removes its GTA object (DELETE_OBJECT), or the one GTA is still making as soon as it comes; valid turns false and scriptID 0. A second call does nothing; a resource's weapon objects are destroyed when it stops. */
    destroy(): void;
    /** GTA's handle of the weapon object: 0 until GTA has made it, when making it failed and after destroy(). */
    readonly scriptID: number;
    /** True until destroy() or the stop of its resource. */
    readonly valid: boolean;
    /** Resolves once GTA has made the weapon object; rejects when making it failed (the weapon's model did not load in 10 s, or CREATE_WEAPON_OBJECT gave no handle) or it was destroyed first. */
    waitForSpawn(): Promise<void>;
}

export class WebSocketClient {
    constructor(url: string);
    /** Every WebSocketClient not yet destroyed, of every resource. */
    static readonly all: WebSocketClient[];
    /** The number of WebSocketClient.all. */
    static readonly count: number;
    /** The socket with this id; null when there is none or it was destroyed. */
    static getByID(id: number): WebSocketClient | null;
    /** Always null: a WebSocketClient is this client's own and has no remote id. getByID finds one by its id. */
    static getByRemoteID(remoteId: number): null;
    /** Adds a subprotocol to offer at the next start(); a duplicate is ignored. Throws a TypeError for an empty one and an Error unless the socket is closed (readyState 3). */
    addSubProtocol(protocol: string): void;
    /** When true, a connection that closes or fails to open without stop() is started again after 1 s; default false. */
    autoReconnect: boolean;
    /** stop(), then removes the socket: valid turns false, its listeners go and baseObjectRemove fires; later calls do nothing. A resource's sockets are destroyed when it stops. */
    destroy(): void;
    /** The listeners of that event, or of every event when no name is given. */
    getEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** A copy of the subprotocols added. */
    getSubProtocols(): string[];
    /** Its id for WebSocketClient.getByID, unique on this client. */
    readonly id: number;
    /** Removes the listener from that event, every registration of it this resource made; with no listener, every listener this resource added for the event. */
    off(eventName: string, callback?: (...args: any[]) => void): void;
    /** Adds a listener: open, message (text; binary frames are decoded as UTF-8), error (message) or close (code, reason). Adding the same function again does nothing; the handle's destroy() removes it. */
    on<E extends string>(eventName: E, callback: E extends keyof WebSocketEventHandlers ? WebSocketEventHandlers[E] : (...args: any[]) => void): VarionEventHandle;
    /** Like on, for the next such event only. */
    once<E extends string>(eventName: E, callback: E extends keyof WebSocketEventHandlers ? WebSocketEventHandlers[E] : (...args: any[]) => void): VarionEventHandle;
    /** Stored only, true by default: the client's socket transports do not choose compression, and false only causes a warning at start(). */
    perMessageDeflate: boolean;
    /** Stored only, 0 by default: the client sends no ping frames of its own, and a value above 0 only causes a warning at start(). */
    pingInterval: number;
    /** 0 connecting, 1 open, 2 closing, 3 closed (WebSocketReadyState); 3 before start() and from stop() on. */
    readonly readyState: number;
    /** Sends a text or binary message; true when it was handed to the open socket, false when the socket is not open, refused it, or the message is over 4 MiB (UTF-8 bytes for text), which the client would drop. */
    send(message: string | ArrayBuffer | ArrayBufferView): boolean;
    /** Adds a header (both as text) to the handshake of this socket's next connections. In the game the client sends it, leaving out a header that would break the request (a name with a colon, space or line break or over 256 characters, a value with a line break or over 8192 characters) and the handshake's own (Host, Upgrade, Connection, Sec-WebSocket-*, Content-Length). A browser's WebSocket cannot send headers: there start() warns once. Throws a TypeError for an empty name. */
    setExtraHeader(header: string, value: string): void;
    /** Opens the connection to url, doing nothing while it is connecting or open; at most 8 sockets are open on the client at once. Throws an Error once destroyed and a TypeError for a URL that is not ws:// or wss://; a refused open fires error, then close with code 1006 and the reason. */
    start(): void;
    /** Closes the connection (code 1000, "client stop") and turns auto-reconnect off until the next start(); readyState is 3 at once and no open, message or error follows, but close still fires with the closing handshake's code and reason unless start() comes first. */
    stop(): void;
    /** The URL given. Assigning another closes the connection and, if it was started, opens the new one (start() then throws for a URL that is not ws:// or wss://). */
    url: string;
    /** True until destroy(). */
    readonly valid: boolean;
}

export const WebSocketReadyState: {
    readonly Closed: any;
    readonly CLOSED: any;
    readonly Closing: any;
    readonly CLOSING: any;
    readonly Connecting: any;
    readonly CONNECTING: any;
    readonly Open: any;
    readonly OPEN: any;
};

export class WebView {
    /** Creates a WebView for an absolute http(s) URL on the server's HTTP or asset host (throws otherwise). It starts hidden, its page loading anyway, at 0.15 × 0.1 of the screen at (0, 0) until visible = true, which shows and focuses it; pos and size given here apply when it is shown. With isOverlay false it stays on the screen until attachTo places it over an entity. A number as the second argument throws: a view on a game texture is made with WebView.create({ drawable }). */
    constructor(url: string, isOverlay?: boolean, pos?: Vector2Like, size?: Vector2Like);
    constructor(url: string, pos: Vector2Like, size?: Vector2Like);
    /** Every WebView not yet destroyed, of every resource. */
    static readonly all: WebView[];
    /** The number of WebView.all. */
    static readonly count: number;
    /** Makes a WebView from options, like new WebView(url, overlay, pos, size), with headers sent along with its requests; it starts hidden unless visible is true, which also focuses it. Throws for options that are not an object or a url that is not an absolute http(s) URL on the server's HTTP or asset host. */
    static create(options: WebViewOptions): WebView;
    /** The view with this id; null when there is none or it was destroyed. */
    static getByID(id: number): WebView | null;
    /** Whether the last page frame reached the screen through the GPU, as a texture the web engine shares with GTA (true), rather than copied through the CPU (false); false until a page is drawn. */
    static readonly gpuAccelerationActive: boolean;
    /** The same as gpuAccelerationActive. */
    static readonly isGpuAccelerationActive: boolean;
    /** Plays the page's sound through this AudioOutput; once it has had one, the page is heard only through its outputs. A destroyed view or output, or one already added, is ignored. */
    addOutput(output: AudioOutput): void;
    /** Shows the view as a screen box centred on an entity (script handle or object with scriptID) plus offset in metres, following it while that point is on screen; isOverlay turns false. The page is not drawn into the world; a target without a handle only logs a warning. */
    attachTo(target: number | { scriptID: number }, offset?: Vector3Like): void;
    /** Removes the key from this view's own metadata (setMeta). */
    deleteMeta(key: string): void;
    /** Closes the page and removes the view: its handlers and outputs go and webViewDestroyed fires with its id. The game controls follow: off while another visible view has focus or a script turned them off. */
    destroy(): void;
    /** Undoes attachTo: the view is an overlay again (isOverlay true) and goes back to its pos and size. */
    detach(): void;
    /** Sends an event to the page; it arrives there through window.varion.trigger(name, ...). */
    emit(eventName: string, ...args: any[]): void;
    /** The same as emit; there is no separate raw encoding. */
    emitRaw(eventName: string, ...args: any[]): void;
    /** Runs the code in the page; empty code is ignored. Code sent before the page exists waits for it. */
    execJS(code: string): void;
    /** Gives this view keyboard focus (focused becomes true): other views lose it and game controls go off while it is visible. On a hidden view it only marks it focused. */
    focus(): void;
    /** Whether the view has keyboard focus; a focused visible view takes keyboard and mouse from GTA. Assigning true takes focus from any other view and false gives it up (loading unfocusedUrl if one is set); game controls follow, off while a visible view has focus. */
    focused: boolean;
    /** The handlers of that page event, or, without a name, an object mapping each event name to its handlers. */
    getEventListeners(eventName: string): Array<(...args: any[]) => void>;
    getEventListeners(): Record<string, Array<(...args: any[]) => void>>;
    /** The value setMeta stored under the key; undefined when there is none. */
    getMeta(key: string): any;
    /** A copy of the outputs addOutput added; a destroyed output leaves the list. */
    getOutputs(): AudioOutput[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Its id, 1000 or more, unique on this client and fixed. */
    readonly id: number;
    /** True for a view WebView.create made with a drawable or targetTexture option: it is shown as a screen box at that entity (attachTo), not as a texture in the world. */
    readonly isDuiCompat: boolean;
    /** The same as focused. */
    readonly isFocused: boolean;
    /** True once the page fired its load event; false again after reload(), a url change or a load error. */
    readonly isLoaded: boolean;
    /** True from creation, reload() or a new url until the page loads or fails to load, whether the view is shown or hidden (a hidden view loads its page too); false once destroyed. */
    readonly isLoading: boolean;
    /** True for a view on the screen, false after attachTo or for new WebView(url, false). Where the view is drawn follows attachTo and detach only: a view without an entity is drawn on the screen whatever isOverlay says, and isStreamedIn and worldOnScreen treat it so. */
    isOverlay: boolean;
    /** As isLoaded: true once the page fired its load event, false again after reload(), a url change or a load error. */
    readonly isReady: boolean;
    /** False when the view is destroyed or hidden; for an attached view, whether its entity is streamed in; any other visible view is on the screen, so true. */
    readonly isStreamedIn: boolean;
    /** The same as visible. */
    readonly isVisible: boolean;
    /** Removes the handler from that page event: every registration of it this resource made with on or once. */
    off(eventName: string, handler: (...args: any[]) => void): void;
    /** Events the page sends with window.varion.emit(name, ...). */
    on(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** Like on, for the next event of that name the page sends with window.varion.emit; then the handler is removed. */
    once(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** 0..1, 1 by default; an assigned value is clamped, a non-number gives 1. */
    opacity: number;
    /** Opens the page's developer tools in a separate window. */
    openDevTools(): void;
    /** The top-left corner in fractions of the screen (0..1), (0, 0) by default; reading gives a copy, and assigning (a non-number as 0) moves the view. An attached view is placed by its entity instead. */
    pos: Vector2Like;
    /** Loads the page again, bypassing the cache when ignoreCache is true; isLoaded and isReady are false until it loads. */
    reload(ignoreCache?: boolean): void;
    /** Stops playing the page's sound through this output; a page left without outputs is silent. */
    removeOutput(output: AudioOutput): void;
    /** Sends a key down (the default) or up to the page, as a virtual key code or varion.KeyCode name. It is dropped while the view is hidden, another view has focus or the web engine is not ready; an unknown name sends nothing. */
    sendKey(key: number | string, down?: boolean): void;
    /** Sets a cookie in the web engine for url (the view's URL by default): text "name=value" with its attributes (Domain, Path, Secure, HttpOnly, SameSite, Priority, Expires, and Max-Age, which wins) or an object with name, value, domain, path ("/" by default), secure, httpOnly, expires in seconds since 1970, sameSite (varion.CookieSameSite, or None, Lax, Strict) and priority (varion.CookiePriority, or Low, Medium, High). An unknown sameSite leaves it unspecified, an unknown priority is medium. Anything else only logs a warning. */
    setCookie(cookie: string | { name?: string; value?: string; raw?: string; url?: string; domain?: string; path?: string; secure?: boolean; httpOnly?: boolean; expires?: number; sameSite?: string; priority?: string }): void;
    /** Adds a header to the page's requests; the page loads again with it. */
    setExtraHeader(name: string, value: string): void;
    /** Stores a value under the key in this view's own metadata; the page does not see it, and destroy() clears it. */
    setMeta(key: string, value: any): void;
    /** The page's zoom as a factor (1 = 100%); 0 or a non-number is 1, and a negative value is ignored. */
    setZoomLevel(level: number): void;
    /** Width and height in fractions of the screen, 0.15 × 0.1 by default; reading gives a copy. Assigning a component that is not above 0 makes it 1 (the whole screen). */
    size: Vector2Like;
    /** Always 5, BaseObjectType.WebView. */
    readonly type: number;
    /** Takes keyboard focus from this view (focused becomes false); when unfocusedUrl is set and differs from url, the page loads it. */
    unfocus(): void;
    /** "" by default. When set, giving up focus through unfocus(), focused = false or hiding loads this URL into the view (focus taken by another view does not); it is checked only then, and a URL the view may not load throws there. */
    unfocusedUrl: string;
    /** The page's URL. Assigning another checks it as the constructor does (an absolute http(s) URL on the server's own hosts, without traversal or credentials; otherwise it throws) and loads it, shown or not. */
    url: string;
    /** True until destroy(); a resource's views are destroyed when the resource stops. */
    readonly valid: boolean;
    /** Whether the view is shown. A new view starts hidden, its page loading anyway, at 0.15 × 0.1 of the screen at (0, 0) unless pos or size was set; showing it applies pos and size and focuses it, so it takes keyboard and mouse from GTA until it is unfocused or hidden. */
    visible: boolean;
    /** Whether the view is on screen: for an attached view, whether its entity's point is on screen by the client's last snapshot (false until the snapshot says so); for any other view, visible. */
    readonly worldOnScreen: boolean;
    /** Drawing order among visible views, higher on top, as a whole number; 0 (the default) leaves the order to the client. */
    z: number;
}

export class Worker {
    /** Creates a worker of this resource for a client file of the resource (in the game) or an allowed URL; it runs after `start()` and goes when the resource stops. A resource holds at most `Worker.maxWorkers` (8) workers: one more throws an `Error`. */
    constructor(filePath: string);
    /** Throws in the game: its workers share no memory (an Error with code worker-shared-memory-refused, or a TypeError for anything but a SharedArrayBuffer). */
    static addSharedArrayBuffer(buffer: SharedArrayBuffer): number;
    /** The buffer added under the id, null for none; in the game always null, since nothing can be added. */
    static getSharedArrayBuffer(id: number): SharedArrayBuffer | null;
    /** 8: how many live Workers one resource may have; the next new Worker throws. The client itself allows at most 8 per resource and 16 in all, whatever this says. */
    static readonly maxWorkers: number;
    /** Forgets the buffer and tells every worker; in the game each worker only gets that notice as a plain message. */
    static removeSharedArrayBuffer(id: number): void;
    /** Terminates the worker and drops its queued messages and handlers; valid turns false. A resource's workers are destroyed when it stops. */
    destroy(): void;
    /** Sends a named event to the worker, whose varion.on handlers get the arguments; it waits in a queue before start() and while paused. Throws once destroyed, and for arguments a message cannot carry (functions, Map, Set, binary data, cycles: a DataCloneError with code worker-message-not-cloneable). */
    emit(eventName: string, ...args: any[]): void;
    /** The path given. In the game it names a client file of the resource that is among its client files: "/<path>" from the resource root, "@<resource>/<path>", anything else from the folder of its client main script. */
    readonly filePath: string;
    /** True between pause() and resume(). */
    readonly isPaused: boolean;
    /** Removes the handler from that event, also one added with once, or every handler of the event when none is given. */
    off(eventName: string, handler?: (...args: any[]) => void): void;
    /** Adds a handler for an event the worker sends with varion.emit, for message (its plain postMessage data) or for error (message, { reason, filename, lineno, colno, stack }). The same function is kept once; a non-function throws a TypeError, and nothing is returned. */
    on(eventName: string, handler: (...args: any[]) => void): void;
    /** Like on, for the next such event only. */
    once(eventName: string, handler: (...args: any[]) => void): void;
    /** Holds the worker's events and this side's messages until resume(); the worker itself keeps running. */
    pause(): void;
    /** Sends the messages queued while paused and delivers the held events, in order. */
    resume(): void;
    /** Starts the worker once; later calls and a destroyed worker do nothing. In the game it runs the resource's file at filePath in its own engine without natives, fetch or WebSocket, and a file that cannot start is reported to error. */
    start(): void;
    /** True until destroy(). */
    readonly valid: boolean;
}

export class WorldObject {
    /** Only a base class for `instanceof`: the blips, markers, checkpoints and colshapes this client creates, and all entities, extend it. The objects come from their own classes. */
    private constructor();
    /** BaseObject.getByID for the world objects: a player, vehicle, ped, object, virtual entity, blip, checkpoint, colshape or marker of that type and id; null for a text label, which is no WorldObject, and for none. */
    static getByID(type: number, id: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | Blip | Checkpoint | ColShape | Marker | null;
    /** BaseObject.getByRemoteID for the world objects: the server's player, vehicle, ped, object, virtual entity, blip, checkpoint, colshape or marker of that type and id; null for a text label, which is no WorldObject, and for none. */
    static getByRemoteID(type: number, remoteId: number): PlayerLocal | Player | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity | Blip | Checkpoint | ColShape | Marker | null;
    /** Removes what this client made itself (a local entity, blip, marker, checkpoint, colshape). What the server made is the server's to remove: see the class of the object for what its destroy does. */
    destroy(): void | Promise<boolean>;
    /** The dimension it is in: a player's or server entity's by the newest snapshot (0 when not known), a native vehicle's or NPC's the local player's (the server sends only those), the local player's own; a local entity's own setting, which assigning changes (-2147483648: every dimension). A blip, marker, checkpoint or colshape this client made has its own. */
    readonly dimension: number;
    /** Its id: a player's or server entity's server id (a native vehicle's or NPC's is the id server scripts know it by, 65536 and up), the local player's own (0 before its first state), a local entity's negative id. A blip, marker, checkpoint or colshape this client made has a negative id of its own kind. */
    readonly id: number;
    /** True for what the server made: other players, server vehicles, peds, objects and virtual entities, native vehicles and NPCs; false for the local player and for what this client made. Blips, markers, checkpoints and colshapes this client made read false. */
    readonly isRemote: boolean;
    /** Its position: a player's or server entity's by the newest snapshot (read from GTA while it is streamed in, else the last synced one); the local player's from its own state (the world origin before the first one, with a warning logged once); a native vehicle's or NPC's read from GTA on each read ({0,0,0} while it has none); a local entity's own, which assigning moves. A blip, marker, checkpoint or colshape this client made: where it is. */
    readonly pos: Vector3Like;
    /** The same as id. A blip, marker, checkpoint or colshape this client made reads 0. */
    readonly remoteId: number;
    /** The same as id. A blip, marker, checkpoint or colshape this client made reads 0. */
    readonly remoteID: number;
    /** Its BaseObjectType: Player 0, Vehicle 1, Ped 2, Object 3, VirtualEntity 9; a local entity has its kind's (1, 2 or 3). Blip 4, ColShape 7, Checkpoint 8, Marker 22 for those this client made. */
    readonly type: number;
    /** Whether this client still has it. A player or server entity: the newest snapshot lists it (the same entity, not another under its id) and did not find its GTA entity gone, so a kept object turns false once it leaves; the local player: it has an id; a native vehicle or NPC: the server still binds it to this client; a local entity: until destroy(). */
    readonly valid: boolean;
}

export const game: {
    /** The same function as natives.invoke: calls a GTA native now by name or hash and returns its result, throwing when it is unknown, blocked or fails. */
    invoke(native: string | number | bigint, ...args: any[]): any;
    /** The same function as natives.invokeAsync: invoke wrapped in a Promise. */
    invokeAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** The same function as natives.invokeFloat: the native's result as a number. */
    invokeFloat(native: string | number | bigint, ...args: any[]): any;
    /** The same function as natives.invokeFloatAsync: the native's result as a number, in a Promise. */
    invokeFloatAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** The same function as natives.invokeString: the native's result as a string. */
    invokeString(native: string | number | bigint, ...args: any[]): any;
    /** The same function as natives.invokeStringAsync: the native's result as a string, in a Promise. */
    invokeStringAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** The same function as natives.invokeVector3: the native's result as {x, y, z}. */
    invokeVector3(native: string | number | bigint, ...args: any[]): any;
    /** The same function as natives.invokeVector3Async: the native's result as {x, y, z}, in a Promise. */
    invokeVector3Async(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** GTA's joaat hash of the text in lower case, as an unsigned 32-bit number; an array gives an array of hashes. Anything else is hashed as its text, a falsy value as "" (0). */
    joaat(text: string): number;
    joaat(texts: string[]): number[];
};

export const natives: {
    /** Calls a GTA native now, by name (GET_ENTITY_COORDS or getEntityCoords) or hash, and returns its result: a number, boolean, string or {x, y, z}, null for a void native, [result, ...outValues] for one with pointer arguments. Throws when the native is unknown, blocked (saves, the shop, raw memory and the like) or fails; give a 64-bit hash as a BigInt or a "0x..." string, and note BigInt arguments are cut to their low 32 bits. */
    invoke(native: string | number | bigint, ...args: any[]): any;
    /** invoke wrapped in a Promise: in the game the native runs at once, and the promise resolves with its result or rejects with invoke's error. */
    invokeAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** Calls a GTA native now, as invoke, and gives its result as a number (Number of it, 0 when that is not a finite number); a native with pointer arguments gives [result, ...outValues] as invoke does. */
    invokeFloat(native: string | number | bigint, ...args: any[]): any;
    /** invokeFloat wrapped in a Promise: resolves with the result as a number ([result, ...outValues] kept as it is) or rejects with invoke's error. */
    invokeFloatAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** Calls a GTA native now, as invoke, and gives its result as a string ("" for null or no result); a native with pointer arguments gives [result, ...outValues] as invoke does. */
    invokeString(native: string | number | bigint, ...args: any[]): any;
    /** invokeString wrapped in a Promise: resolves with the result as a string ([result, ...outValues] kept as it is) or rejects with invoke's error. */
    invokeStringAsync(native: string | number | bigint, ...args: any[]): Promise<any>;
    /** Calls a GTA native now, as invoke, and gives its result as {x, y, z} numbers ({0, 0, 0} when the result is not a vector); a native with pointer arguments gives [result, ...outValues] as invoke does. */
    invokeVector3(native: string | number | bigint, ...args: any[]): any;
    /** invokeVector3 wrapped in a Promise: resolves with the result as {x, y, z} ([result, ...outValues] kept as it is) or rejects with invoke's error. */
    invokeVector3Async(native: string | number | bigint, ...args: any[]): Promise<any>;
};

/** Every event name the runtime emits. */
export type VarionEventName =
    | "anyResourceError"
    | "anyResourceStart"
    | "anyResourceStop"
    | "baseObjectCreate"
    | "baseObjectRemove"
    | "changedVehicleSeat"
    | "connection:complete"
    | "connection:queue"
    | "connection:state"
    | "connectionComplete"
    | "consoleCommand"
    | "disconnect"
    | "discord:activityCleared"
    | "discord:activityUpdate"
    | "discord:disconnect"
    | "discord:ready"
    | "discord:userChange"
    | "enteredVehicle"
    | "entityEnterColshape"
    | "entityHitEntity"
    | "entityLeaveColshape"
    | "entityStreamIn"
    | "entityStreamOut"
    | "everyTick"
    | "gameEntityCreate"
    | "gameEntityDestroy"
    | "gamepadButtonDown"
    | "gamepadButtonUp"
    | "gamepadConnected"
    | "gamepadDisconnected"
    | "globalMetaChange"
    | "globalSyncedMetaChange"
    | "headshotBase64"
    | "incomingDamage"
    | "keydown"
    | "keyup"
    | "leftVehicle"
    | "localEntityFailed"
    | "localMetaChange"
    | "localStorageError"
    | "locale:change"
    | "metaChange"
    | "netOwnerChange"
    | "playerAnimationChange"
    | "playerBulletHit"
    | "playerDeath"
    | "playerDimensionChange"
    | "playerEnterCheckpoint"
    | "playerEnterColShape"
    | "playerExitCheckpoint"
    | "playerExitColShape"
    | "playerInteriorChange"
    | "playerSpawn"
    | "playerStartTalking"
    | "playerStopTalking"
    | "playerWeaponChange"
    | "playerWeaponShoot"
    | "removeEntity"
    | "resourceError"
    | "resourceStart"
    | "resourceStop"
    | "spawn:success"
    | "spawned"
    | "startEnteringVehicle"
    | "startLeavingVehicle"
    | "stream:mounted"
    | "streamSyncedMetaChange"
    | "syncedMetaChange"
    | "virtualEntityPositionChange"
    | "virtualEntityStreamIn"
    | "virtualEntityStreamOut"
    | "voice:channelChange"
    | "voice:channelCreate"
    | "voice:channelDestroy"
    | "voice:playerStartTalking"
    | "voice:playerStopTalking"
    | "voice:pushToTalk"
    | "voiceConnection"
    | "weaponDamage"
    | "webViewDestroyed"
    | "windowFocusChange"
    | "windowResolutionChange"
    | "worldObjectPositionChange"
    | "worldObjectStreamIn"
    | "worldObjectStreamOut"
    | (string & {});

/** Handler parameters of the documented events. */
export interface VarionEvents {
    /** A client resource failed to load or run; it gets resourceError first. */
    anyResourceError(resourceName: string): void;
    /** A client resource started. */
    anyResourceStart(resourceName: string): void;
    /** A client resource stopped. */
    anyResourceStop(resourceName: string): void;
    /** An object appeared on this client: an entity got its GTA entity, or a blip, marker, colshape or another object was made. */
    baseObjectCreate(baseObject: BaseObject): void;
    /** An object went from this client; it is still readable in the handler. */
    baseObjectRemove(baseObject: BaseObject): void;
    /** The local player moved to another seat. Seats: 1 = driver, 2 = front passenger, 3-4 = rear. */
    changedVehicleSeat(vehicle: Vehicle, oldSeat: number, newSeat: number): void;
    /** The client is in the game: connected, loaded and spawned. connectionComplete comes right after. */
    "connection:complete"(): void;
    /** The server holds the client in its connection queue. */
    "connection:queue"(position: number, total: number): void;
    /** The connection moved to another step; `message` comes with some steps, an error's text among them. */
    "connection:state"(phase: "idle" | "connecting" | "authenticated" | "resources" | "waiting" | "spawning" | "ready" | "error", message?: string): void;
    /** The twin of connection:complete; `hasMapChanged` is always false. */
    connectionComplete(hasMapChanged: boolean): void;
    /** A line typed in the F8 console: the command in lower case and the words after it. Built-in commands come here too. */
    consoleCommand(name: string, ...args: string[]): void;
    /** The connection to the server ended. The resources keep running. */
    disconnect(): void;
    /** A script cleared the Discord status (Discord.clearActivity). */
    "discord:activityCleared"(): void;
    /** A script set the Discord status (Discord.updateActivity). */
    "discord:activityUpdate"(activity: DiscordActivityOptions): void;
    /** The Discord account is no longer known: Discord was closed or logged out. */
    "discord:disconnect"(): void;
    /** The Discord account of the player is known: the one the Discord app on this computer runs. */
    "discord:ready"(user: DiscordUser): void;
    /** The Discord account changed; the new user and the previous one. */
    "discord:userChange"(user: DiscordUser, previous: DiscordUser): void;
    /** The local player got into a vehicle. Seats: 1 = driver, 2 = front passenger, 3-4 = rear. */
    enteredVehicle(vehicle: Vehicle, seat: number): void;
    /** The local player entered a colshape. */
    entityEnterColshape(colshape: Colshape, entity: Player): void;
    /** The local player hit an entity. */
    entityHitEntity(source: Player, target: Entity, weaponHash: number): void;
    /** The local player left a colshape. */
    entityLeaveColshape(colshape: Colshape, entity: Player): void;
    /** The server streamed an entity to this client. Raw data, not the entity: gameEntityCreate gives the entity once GTA has it. */
    entityStreamIn(info: { entityId: number; generation: number; entityType: number; model: number; scriptId: number }): void;
    /** The server took an entity away from this client. Raw data, not the entity: gameEntityDestroy gives the entity. */
    entityStreamOut(info: { entityId: number; generation: number; entityType: number; model: number; scriptId: number }): void;
    /** Every frame. */
    everyTick(): void;
    /** GTA created the entity on this client: it streamed in, or a local entity was made. `scriptID` is set. */
    gameEntityCreate(entity: Entity): void;
    /** GTA removed the entity on this client. */
    gameEntityDestroy(entity: Entity): void;
    /** A gamepad button went down. */
    gamepadButtonDown(index: number, button: number): void;
    /** A gamepad button went up. */
    gamepadButtonUp(index: number, button: number): void;
    /** A gamepad was connected; its index and state. */
    gamepadConnected(index: number, gamepad: { connected: boolean; [key: string]: any }): void;
    /** A gamepad was disconnected; its index and state. */
    gamepadDisconnected(index: number, gamepad: { connected: boolean; [key: string]: any }): void;
    /** `varion.setMeta` data of this client changed; it never reaches the server. `value` is undefined after a delete. */
    globalMetaChange(key: string, value: any, oldValue: any): void;
    /** The server changed `varion.setSyncedMeta` data. `value` is undefined after a delete. */
    globalSyncedMetaChange(key: string, value: any, oldValue: any): void;
    /** A headshot picture is ready: PNG data in base64. */
    headshotBase64(base64Png: string): void;
    /** Someone hit the local player. weaponDamage comes right after. */
    incomingDamage(attacker: Player | null, weaponHash: number, damage: number, bodyPart: number): void;
    /** Virtual key code (113 = F2). */
    keydown(keyCode: number): void;
    /** Virtual key code (113 = F2). */
    keyup(keyCode: number): void;
    /** The local player got out of a vehicle. Seats: 1 = driver, 2 = front passenger, 3-4 = rear. */
    leftVehicle(vehicle: Vehicle, seat: number): void;
    /** The player's language changed. */
    "locale:change"(locale: string): void;
    /** GTA could not create a local entity; the client stopped trying. */
    localEntityFailed(entity: Entity, reason: string): void;
    /** The server changed data only this player gets (`player.setLocalMeta`). `value` is undefined after a delete. */
    localMetaChange(key: string, value: any, oldValue: any): void;
    /** Saving or loading this resource's LocalStorage failed. */
    localStorageError(operation: string, detail: string): void;
    /** `entity.setMeta` data of this client changed; it never reaches the server. `value` is undefined after a delete. */
    metaChange(entity: BaseObject, key: string, value: any, oldValue: any): void;
    /** The local player started or stopped simulating an entity. `owner` null: nobody simulates it now. */
    netOwnerChange(entity: Entity, owner: Player | null, oldOwner: Player | null): void;
    /** The animation a player plays changed: hashes of the old and new dictionary and name. */
    playerAnimationChange(player: Player, oldAnimDict: number, newAnimDict: number, oldAnimName: number, newAnimName: number): void;
    /** A bullet of the local player hit an entity; not for melee. */
    playerBulletHit(weaponHash: number, target: Entity, position: Vector3): void;
    /** A player died. `killer` is null when nobody killed the player. */
    playerDeath(player: Player | null, killer: Player | null, weaponHash: number): void;
    /** The local player moved to another dimension. */
    playerDimensionChange(player: Player, oldDimension: number, newDimension: number): void;
    /** The local player entered a checkpoint. Its id, not the Checkpoint. */
    playerEnterCheckpoint(info: { checkpointId: number }): void;
    /** The twin of entityEnterColshape. */
    playerEnterColShape(colshape: Colshape): void;
    /** The local player left a checkpoint. Its id, not the Checkpoint. */
    playerExitCheckpoint(info: { checkpointId: number }): void;
    /** The twin of entityLeaveColshape. */
    playerExitColShape(colshape: Colshape): void;
    /** The local player entered or left an interior; 0 is outside. */
    playerInteriorChange(player: Player, oldInterior: number, newInterior: number): void;
    /** A player spawned: the local player once GTA shows the new ped, another player when the server says so or when it first streams in. */
    playerSpawn(player: Player): void;
    /** A player started talking on voice chat. */
    playerStartTalking(player: Player): void;
    /** A player stopped talking on voice chat. */
    playerStopTalking(player: Player): void;
    /** The local player switched weapons; the hashes, 0 for none. */
    playerWeaponChange(oldWeapon: number, newWeapon: number): void;
    /** The local player fired: once per shot, counted from the ammo. */
    playerWeaponShoot(weaponHash: number, totalAmmo: number, ammoInClip: number): void;
    /** The twin of gameEntityDestroy, right after it. */
    removeEntity(entity: Entity): void;
    /** This resource failed to load or run. On the client `file` is empty and `line` 0; the client log has the details. */
    resourceError(error: Error, file: string, line: number, stack: string): void;
    /** Delivered to the resource being started, with its name. */
    resourceStart(resourceName: string): void;
    /** Delivered to the resource being stopped, with its name. */
    resourceStop(resourceName: string): void;
    /** The twin of playerSpawn. */
    "spawn:success"(player: Player): void;
    /** The local player spawned; right after its playerSpawn. */
    spawned(): void;
    /** The local player started getting into a vehicle; the seat it heads for (0 if GTA does not say). */
    startEnteringVehicle(vehicle: Vehicle, seat: number, player: Player): void;
    /** The local player started getting out of a vehicle. */
    startLeavingVehicle(vehicle: Vehicle, seat: number, player: Player): void;
    /** The client mounted the server's packs (clothes, maps): counts of what loaded and failed, `mountFailed` among them. */
    "stream:mounted"(report: Record<string, number | boolean | string>): void;
    /** The server changed stream-synced data of an object this client has. `value` is undefined after a delete. */
    streamSyncedMetaChange(entity: BaseObject, key: string, value: any, oldValue: any): void;
    /** The server changed synced data of an object this client has. `value` is undefined after a delete. */
    syncedMetaChange(entity: BaseObject, key: string, value: any, oldValue: any): void;
    /** A streamed virtual entity moved; worldObjectPositionChange gives its old position. */
    virtualEntityPositionChange(entity: VirtualEntity): void;
    /** A virtual entity streamed in. */
    virtualEntityStreamIn(entity: VirtualEntity): void;
    /** A virtual entity streamed out. */
    virtualEntityStreamOut(entity: VirtualEntity): void;
    /** The local player's voice channel changed: the old and new channel ids. */
    "voice:channelChange"(oldChannel: number, newChannel: number): void;
    /** A voice channel appeared. */
    "voice:channelCreate"(channel: VoiceChannel): void;
    /** A voice channel went; its id. */
    "voice:channelDestroy"(channelId: number): void;
    /** The twin of playerStartTalking. */
    "voice:playerStartTalking"(player: Player): void;
    /** The twin of playerStopTalking. */
    "voice:playerStopTalking"(player: Player): void;
    /** The push-to-talk key went down or up. */
    "voice:pushToTalk"(pressed: boolean): void;
    /** The voice connection changed state: a VoiceConnectionState. */
    voiceConnection(state: number): void;
    /** A hit the local player took (`target` is the local player) or made (`sourceEntity` is). It cannot be cancelled here: the server decides. */
    weaponDamage(target: Entity, weaponHash: number, damage: number, offset: Vector3, bodyPart: number, sourceEntity: Player | null): void;
    /** A WebView was destroyed; its id. */
    webViewDestroyed(id: number): void;
    /** The game window gained or lost focus. */
    windowFocusChange(focused: boolean): void;
    /** The game window changed size. */
    windowResolutionChange(oldResolution: { x: number; y: number; measured: boolean }, newResolution: { x: number; y: number; measured: boolean }): void;
    /** A streamed virtual entity moved; its old position. */
    worldObjectPositionChange(object: WorldObject, oldPos: Vector3Like): void;
    /** An entity or a virtual entity streamed in. */
    worldObjectStreamIn(object: WorldObject): void;
    /** An entity or a virtual entity streamed out. */
    worldObjectStreamOut(object: WorldObject): void;
}

declare const varion: {
    /** GTA's own text lookup answers the label with this text (shop names of add-on vehicles and clothes, help and notification labels); case does not matter. One table for the whole game, emptied when the session ends. An empty label throws. */
    addGxtText(label: string, text: string): void;
    /** Applies a voice filter to how this client hears the player, given as an AudioFilter or its hash; only walkietalkie, phone and underwater change the sound. False for a player id outside 1..65534 or a hash of 0. removeVoiceFilter, removeVoicePlayer or the end of the session drop it. */
    addVoiceFilter(player: Player | PlayerLocal | number, filter: AudioFilter | number): boolean;
    /** Replaces this client's table of HandlingData values by model hash (a decimal string key) and saves it for this server, as setField does. The handling fields in it reach GTA once a vehicle of the model is in the game and stay there (checked once a second); an argument that is not an object is ignored. */
    applyHandlingOverrides(overrides: Record<string, Record<string, number>>): void;
    /** Takes the given fields of each named level (ZOOM_LEVEL_0 ... ZOOM_LEVEL_GALLERY_MAXIMIZE, as MapZoomData.get names them) as if a script had assigned them: written into GTA's zoom data and saved for this server. A name GTA does not have is left out; an argument that is not an object is ignored. */
    applyMapZoomOverrides(overrides: Record<string, { fZoomScale?: number; fZoomSpeed?: number; fScrollSpeed?: number; vTilesX?: number; vTilesY?: number }>): void;
    AreaBlip: typeof AreaBlip;
    /** URL of a file of a resource's client files, for WebView pages. */
    assetUrl(resourceName: string, path: string): string;
    Audio: typeof Audio;
    AudioCategories: typeof AudioCategories;
    AudioCategory: typeof AudioCategory;
    AudioFilter: typeof AudioFilter;
    AudioOutput: typeof AudioOutput;
    AudioOutputAttached: typeof AudioOutputAttached;
    AudioOutputFrontend: typeof AudioOutputFrontend;
    AudioOutputWorld: typeof AudioOutputWorld;
    BaseObject: typeof BaseObject;
    BaseObjectType: typeof BaseObjectType;
    Blip: typeof Blip;
    BlipColor: typeof BlipColor;
    BlipSprite: typeof BlipSprite;
    BlipType: typeof BlipType;
    BodyPart: typeof BodyPart;
    /** The release channel this client was built for, such as "rc". */
    branch: string;
    /** Calls varion.onRpc(rpcName) on the server. Resolves with its result, rejects with its error, or after 30 s without an answer (error code VARION_RPC_TIMEOUT). */
    callServer(rpcName: string, ...args: any[]): Promise<any>;
    Checkpoint: typeof Checkpoint;
    CheckpointType: typeof CheckpointType;
    /** Stops the everyTick or nextTick callback with this id; an unknown id is ignored. */
    clearEveryTick(id: number): void;
    /** Stops the setInterval with this id; an unknown id is ignored. */
    clearInterval(id: number): void;
    /** Unmutes every player this client muted for itself (Voice.mutePlayer, removeVoicePlayer); mutes in the server's voice channels stay. */
    clearLocallyMuted(): void;
    /** Cancels a nextTick callback that has not run yet; the same function as clearEveryTick. */
    clearNextTick(id: number): void;
    /** Removes a ped's prop of that slot (CLEAR_PED_PROP), the ped given as an entity or its GTA handle; without a handle nothing happens. In the game a refused native call throws. */
    clearPedProp(ped: { scriptID: number } | number, component: number): void;
    /** Cancels the pending setTimeout with this id; an unknown id is ignored. */
    clearTimeout(id: number): void;
    /** Cancels the setTimeout, setInterval, everyTick or nextTick with this id (they share one numbering); an unknown id is ignored. */
    clearTimer(id: number): void;
    Colshape: typeof Colshape;
    ColShape: typeof ColShape;
    ColshapeCircle: typeof ColshapeCircle;
    ColshapeCuboid: typeof ColshapeCuboid;
    ColshapeCylinder: typeof ColshapeCylinder;
    ColshapePolygon: typeof ColshapePolygon;
    ColshapeRectangle: typeof ColshapeRectangle;
    ColshapeSphere: typeof ColshapeSphere;
    ColShapeType: typeof ColShapeType;
    ConfigFlag: typeof ConfigFlag;
    CookiePriority: typeof CookiePriority;
    CookieSameSite: typeof CookieSameSite;
    /** Puts the text on the Windows clipboard once the player allows it (Permission.Clipboard, asked once). A refusal, or more than three writes at once and then one per 2 s, drops it silently; of several calls in one frame only the last is written. */
    copyToClipboard(text: string): void;
    /** True in a development build of the client (the one the developer kit runs), false in the release build players have. */
    debug: boolean;
    /** 0, the dimension a player is in by default. */
    defaultDimension: number;
    /** Removes a key of this client's local metadata here only and fires localMetaChange (key, undefined, old value); nothing goes to the server. A missing key does nothing. */
    deleteLocalMeta(key: string): void;
    /** Removes a key of this client's own global metadata (setMeta) and fires globalMetaChange (key, undefined, old value); a missing key does nothing. */
    deleteMeta(key: string): void;
    /** Asks the server to delete the key (prefixed client: when it lacks it) from the local player's stream-synced data, as setStreamSyncedMeta sets one and on the same terms; this client's copy changes when the server's change arrives. False before the local player has an id. */
    deleteStreamSyncedMeta(key: string): boolean;
    Discord: typeof Discord;
    /** Whether the name is one of the values of varion.ConfigFlag ("DISABLE_IDLE_CAMERA" ...). */
    doesConfigFlagExist(flag: string): boolean;
    /** A local event for this client's own handlers. Names of the runtime's own events (keydown, resourceStart, playerDeath, connection:* and others) and names starting with varion: are refused with a warning. */
    emit(eventName: string, ...args: any[]): void;
    /** Fires a local event for every resource's handlers, as varion.emit does but without refusing the runtime's own event names, so it can fake keydown or playerSpawn; a handler that throws is logged. */
    emitRaw(eventName: string, ...args: any[]): void;
    /** The same function as callServer: calls the server's onRpc handler and resolves with its result. Rejects with its error, after 30 s without an answer (code VARION_RPC_TIMEOUT), when the session ends (VARION_SESSION_RESET) or the resource stops (VARION_RESOURCE_STOPPED), and with a TypeError for an argument that cannot be sent. */
    emitRpc(rpcName: string, ...args: any[]): Promise<any>;
    /** A server object among the arguments goes as a reference; a value that cannot be sent (a cycle, a BigInt, a Map or Set, binary data) throws here. */
    emitServer(eventName: string, ...args: any[]): void;
    /** The same path as emitServer (JSON with entity references); there is no separate raw codec, so a Map or Set, binary data or a BigInt beyond 2^53 throws here instead of arriving changed. */
    emitServerRaw(eventName: string, ...args: any[]): void;
    /** Like emitServer, but sent unreliably: it may never arrive. A server object among the arguments goes as a reference; a value that cannot be sent throws a TypeError here. */
    emitServerUnreliable(eventName: string, ...args: any[]): void;
    Entity: typeof Entity;
    /** The same function as logError: a line at error level in the F8 console and the client's script log, under the calling resource's name. */
    error(...args: any[]): void;
    /** Calls callback every frame until clearEveryTick or clearTimer gets the returned id, or the resource stops. A callback that is not a function throws a TypeError. */
    everyTick(callback: () => void): number;
    /** The calling resource's exports, which other resources get through varion.require(name) or Resource.getByName(name).exports; {} outside a resource's code. Assigning an object copies its properties in; the exports are emptied when the resource stops. */
    exports: Record<string, any>;
    /** An HTTP request (GET by default) to the server's own HTTP, asset or stream host; a path is taken relative to the server's HTTP address. Resolves with the status and the body as text (text and body are strings); rejects for another host, port 7788, before the address is known, or after 15 s. */
    fetch(pathOrUrl: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<{ ok: boolean; status: number; statusCode: number; url: string; text: string; body: string; headers: Record<string, string> }>;
    File: typeof File;
    FileEncoding: typeof FileEncoding;
    FocusData: typeof FocusData;
    game: typeof game;
    /** Whether GTA gets keyboard and mouse now: false while a script turned the controls off (toggleGameControls) or a visible WebView has focus. The client confirms the state with each input snapshot. */
    gameControlsEnabled(): boolean;
    GameFont: typeof GameFont;
    Gamepad: typeof Gamepad;
    GamepadButton: typeof GamepadButton;
    /** Every client resource the server's manifest names, started or not; the same as getResources and Resource.all. */
    getAllResources(): Resource[];
    /** The unit vector the camera on screen looks along, from getCamRot; {x: 0, y: 1, z: 0} while the snapshot has no camera (getCamPos().measured false). */
    getCamForwardVector(): Vector3Like;
    /** The vertical field of view in degrees of the camera on screen from the last snapshot: the gameplay camera's (GET_GAMEPLAY_CAM_FOV), or GTA's final rendered camera's while a script camera renders; 50 before a snapshot, under another camera and before the world is up. */
    getCamFov(): number;
    /** The position of the camera on screen from the last snapshot (up to 20 a second) with measured true: the gameplay camera's, or GTA's final rendered camera's while a script camera renders (RENDER_SCRIPT_CAMS). Under another camera (cinematic, cutscene) and before the world is up it reads {0, 0, 0} with measured false. */
    getCamPos(): { x: number; y: number; z: number; measured: boolean };
    /** The rotation in degrees (order 2) of the camera on screen from the last snapshot: the gameplay camera's, or GTA's final rendered camera's while a script camera renders; {0, 0, 0} under another camera and before the world is up. order is ignored. */
    getCamRot(order?: number): Vector3Like;
    /** The value setConfigFlag gave the flag, once the client confirms it (until then the previous one). A flag never set, and every flag after the session ends, reads as GTA's own behaviour: true for DISABLE_SP_ENTER_VEHICLE_CLIPSET, false for the others. */
    getConfigFlag(flag: string): boolean;
    /** The connection's current step: idle, connecting, authenticated, resources, waiting, spawning, ready or error, as connection:state names them. */
    getConnectionPhase(): string;
    /** The mouse cursor in the game window's client area: pixels, or 0..1 of its size with normalized true. Updated once a frame while in the game; {0, 0} before. */
    getCursorPos(normalized?: boolean): Vector2Like;
    /** The entities this client knows in that dimension: the local player once it has an id, other players, old-path vehicles, peds and objects, virtual entities, and the native vehicles and NPCs when it is the local player's dimension. */
    getEntitiesInDimension(dimension: number): Array<Player | PlayerLocal | Vehicle | NativeVehicle | Ped | NativePed | Object | VirtualEntity>;
    /** The same as getLocalEventListeners: the handlers on and once added for that event, every resource's; all of them when no name is given. */
    getEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** GTA's frame rate as a whole number, counted over about a second (at most 1000); 60 before the first count. */
    getFps(): number;
    /** The XInput controllers connected now (up to four), each holding the state of the last snapshot; [] without any. */
    getGamepads(): Gamepad[];
    /** The text GTA shows for a label, a varion.addGxtText one included; a label GTA does not have reads as "NULL", as GTA shows it. An empty label reads as the empty string. */
    getGxtText(label: string): string;
    /** The picture of a registered ped headshot (the id REGISTER_PEDHEADSHOT returns) as a base64 PNG; the headshotBase64 event fires with it too. Rejects with a TypeError for an id that is not a whole number of 0 or more, when the capture fails, after 10 s or when the resource stops. */
    getHeadshotBase64(headshotId: number): Promise<string>;
    /** SHA-256 (64 lowercase hex digits) of the Rockstar account GTA signed in with: the same on every server and in every session of the account. "" until GTA has signed in to Rockstar's services, some seconds after it starts. The client reports it; a server cannot check it. */
    getLicenseHash(): string;
    /** The store of this copy of GTA as a LicenseType: Steam, Epic or Xbox when GTA was started with that store's launch parameter (useSteam, useEpic, useXboxPc, read in GTA), Rockstar for the Rockstar Games Launcher's own copy (none of them), None when the client cannot read them. */
    getLicenseType(): number;
    /** The language the launcher gave the client, else the one Windows shows its interface in ("ru-RU"), up to 16 characters; "en" when neither is known. locale:change fires when it changes. */
    getLocale(): string;
    /** The handlers on and once added for that local event, every resource's; all of them when no name is given. */
    getLocalEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** This client's own metadata (setLocalMeta); undefined when the key is not set. */
    getLocalMeta(key: string): any;
    /** The keys of this client's local metadata: those the server set for this player (setLocalMeta there) and those setLocalMeta set here. */
    getLocalMetaKeys(): string[];
    /** A value of this client's own global metadata (setMeta) as it was set; undefined for none. Not synced, and emptied when the session ends. */
    getMeta(key: string): any;
    /** The keys of this client's own global metadata (setMeta). */
    getMetaKeys(): string[];
    /** How many real milliseconds a game minute lasts in GTA now (GET_MILLISECONDS_PER_GAME_MINUTE); where the game does not answer, the value last given to setMsPerGameMinute, 2000 by default. */
    getMsPerGameMinute(): number;
    /** The native NPCs this client's GTA has now, as the server reports them: Ped.all without the old path. */
    getNativePeds(): NativePed[];
    /** The native vehicles this client's GTA has now, its own and other clients', as the server reports them: Vehicle.all without the old path. */
    getNativeVehicles(): NativeVehicle[];
    /** The server's network clock in milliseconds as this client estimates it, from the last snapshot; 0 without a connection. */
    getNetTime(): number;
    /** Object.all: the server's objects this client knows, streamed in or not; LocalObjects are not included. */
    getObjects(): Object[];
    /** The server's objects this client knows that are in that dimension. */
    getObjectsInDimension(dimension: number): Object[];
    /** A packed integer stat of the character slot (0 by default) through GET_PACKED_STAT_INT_CODE; null when the native call fails. */
    getPackedStat(index: number, characterSlot?: number): Promise<number | null>;
    /** A packed bool stat of the character slot (0 by default) through GET_PACKED_STAT_BOOL_CODE; null when the native call fails. */
    getPackedStatBool(index: number, characterSlot?: number): Promise<boolean | null>;
    /** Ped.all: the old-path peds this client knows, then the native NPCs its GTA has now. */
    getPeds(): Array<Ped | NativePed>;
    /** The old-path peds this client knows in that dimension, plus the native NPCs when it is the local player's dimension (the server sends them for no other). */
    getPedsInDimension(dimension: number): Array<Ped | NativePed>;
    /** The player's answer for a Permission as a PermissionState: 0 Allowed, 1 Denied, 2 Unspecified (not asked yet), 3 Failed; an unknown permission reads 2. Microphone reads the WebRTC answer (the client asks for microphone and camera together), and All gives the worst of ScreenCapture, WebRTC and Clipboard. */
    getPermissionState(permission: number): number;
    /** The round-trip time to the server in milliseconds from the last snapshot; 0 without a connection. */
    getPing(): number;
    /** Player.all: the local player first (once it has an id), then every other player this client knows. */
    getPlayers(): Player[];
    /** The players this client knows in that dimension, the local player included once it is valid and there. */
    getPlayersInDimension(dimension: number): Player[];
    /** The handlers onServer and onceServer added for that event, every resource's; all of them when no name is given. */
    getRemoteEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** The [config] table of a resource's resource.toml (this resource's by default) as a copy, nested tables included; {} for an unknown resource. */
    getResourceConfig(resourceName?: string): Record<string, any>;
    /** That resource's exports object, empty while it is stopped; undefined for a resource this client does not know. */
    getResourceExports(name: string): Record<string, any> | undefined;
    /** Where a client resource's files lie in the stream cache, path appended, in forward slashes ("<cache>/<name>/<path>", only "<name>/<path>" before the cache folder is known); "" for an unknown resource. */
    getResourcePath(name: string, path?: string): string;
    /** Every client resource the server's manifest names, started or not; the same as getAllResources and Resource.all. */
    getResources(): Resource[];
    /** The game's screen resolution in pixels (GET_ACTUAL_SCREEN_RESOLUTION) from the last snapshot. Until the client has read it: 1920 x 1080 with measured false, and the first such call warns once. */
    getScreenResolution(): { x: number; y: number; measured: boolean };
    /** The server address this client connected to, as it was given (a host name or an IP); "" before the server accepted the login. */
    getServerHost(): string;
    /** The IPv4 or IPv6 address the client's connection resolved the server's host to; the host as given (getServerHost) until the connection has resolved one. */
    getServerIp(): string;
    /** The name the server sent when it accepted the login; "" before. */
    getServerName(): string;
    /** The server port this client connected to; 0 before the server accepted the login. */
    getServerPort(): number;
    /** The server's Unix time in milliseconds: the value it sent at login, advanced by this client's clock, from the last snapshot; 0 before. */
    getServerTime(): number;
    /** An integer stat by name (hashed as varion.hash) through STAT_GET_INT, character slot -1 by default. Resolves null, warning once for the stat, when the read fails or the game does not answer within 150 ms. */
    getStat(name: string, slot?: number): Promise<number | null>;
    /** A bool stat by name through STAT_GET_BOOL, character slot -1 by default; null, warning once, when the read fails or the game does not answer within 150 ms. */
    getStatBool(name: string, slot?: number): Promise<boolean | null>;
    /** A float stat by name through STAT_GET_FLOAT, character slot -1 by default; null, warning once, when the read fails or the game does not answer within 150 ms. */
    getStatFloat(name: string, slot?: number): Promise<number | null>;
    /** A value of the server's global synced metadata (setSyncedMeta there), server references turned into this client's objects; undefined for none. It follows the server's changes (globalSyncedMetaChange fires) and is emptied when the session ends. */
    getSyncedMeta(key: string): any;
    /** The keys of the server's global synced metadata on this client. */
    getSyncedMetaKeys(): string[];
    /** Packets to the server ENet judged lost since this runtime first saw the connection: ENet clears its counter every 10 s and the runtime adds up those windows, missing what was counted after the last snapshot before each clearing (under 50 ms). null while there is no connection; a new connection starts a new total. */
    getTotalPacketsLost(): number | null;
    /** Packets sent to the server since this runtime first saw the connection: ENet clears its counter every 10 s and the runtime adds up those windows, missing what was counted after the last snapshot before each clearing (under 50 ms). null while there is no connection; a new connection starts a new total. */
    getTotalPacketsSent(): number | null;
    /** The handlers onServerUnreliable and onceServerUnreliable added for that event, every resource's; all of them when no name is given. */
    getUnreliableRemoteEventListeners(eventName?: string): Array<(...args: any[]) => void>;
    /** A new HandlingData for the vehicle (an object, or its GTA handle, whose model is read with GET_ENTITY_MODEL): the handling fields read from GTA through that vehicle, maxBraking, maxTraction and maxPassengers from GET_VEHICLE_MAX_BRAKING, GET_VEHICLE_MAX_TRACTION and GET_VEHICLE_MAX_NUMBER_OF_PASSENGERS. A vehicle uses its model's handling, so assigning a field changes every vehicle of the model. */
    getVehicleHandling(vehicle: Vehicle | NativeVehicle | LocalVehicle | number): HandlingData;
    /** Vehicle.all: the old-path vehicles this client knows, then the native vehicles its GTA has now. */
    getVehicles(): Array<Vehicle | NativeVehicle>;
    /** The old-path vehicles this client knows in that dimension, plus the native ones when it is the local player's dimension (the server sends them for no other). */
    getVehiclesInDimension(dimension: number): Array<Vehicle | NativeVehicle>;
    /** A VoiceConnectionState from the last snapshot: 0 Disconnected (also while voice is off), 1 Connecting, 2 Connected, following the game connection. */
    getVoiceConnectionState(): number;
    /** The AudioFilter that addVoiceFilter last set on the player on this client; null for none, after removeVoiceFilter or removeVoicePlayer, and once the session ends, when the client drops it too. */
    getVoiceFilter(player: Player | PlayerLocal | number): AudioFilter | null;
    /** The non-spatial voice volume setVoiceNonSpatialVolume last set for the player on this client in this session, 1 by default; the end of the session resets it, as it does on the client. */
    getVoiceNonSpatialVolume(player: Player | PlayerLocal | number): number;
    /** The players in any voice channel this client knows, each once, from the last snapshot; members this client has no Player for are left out. */
    getVoicePlayers(): Array<Player | PlayerLocal>;
    /** The spatial voice volume setVoiceSpatialVolume last set for the player on this client in this session, 1 by default; the end of the session resets it, as it does on the client. */
    getVoiceSpatialVolume(player: Player | PlayerLocal | number): number;
    /** The dimension every player sees, -2147483648. */
    globalDimension: number;
    HandlingData: typeof HandlingData;
    /** GTA's hash of a name; a number is returned as its uint32. */
    hash(value: string | number): number;
    /** Whether this client's local metadata has the key (set by the server for this player or by setLocalMeta here). */
    hasLocalMeta(key: string): boolean;
    /** Whether this client's own global metadata (setMeta) has the key. */
    hasMeta(key: string): boolean;
    /** Whether getPermissionState(permission) is Allowed (0). */
    hasPermission(permission: number): boolean;
    /** Whether this client knows a client resource of that name, started or not. */
    hasResource(name: string): boolean;
    /** Whether the server's global synced metadata has the key on this client. */
    hasSyncedMeta(key: string): boolean;
    Http: typeof Http;
    HttpClient: typeof HttpClient;
    /** An http://, https:// or file:// URL as it is; anything else appended to the server's HTTP address, with a / added before it. Before the address is known the path comes back unchanged. */
    httpUrl(path: string): string;
    /** Whether setCamFrozen(true) is in force. */
    isCamFrozen(): boolean;
    /** Always true on the client. */
    isClient: true;
    /** True when the connection phase is ready, else whether the network connection to the server is up, from the last snapshot. */
    isConnected(): boolean;
    /** Whether the F8 console is open, from the last snapshot. */
    isConsoleOpen(): boolean;
    /** Whether the cursor the scripts asked for is on screen: a showCursor(true) request stands (false at start) and a WebView is visible, as the client draws that cursor only over its web views. The client's own menus and console are not counted. */
    isCursorVisible(): boolean;
    /** Whether the game window covers its whole monitor without a window frame, from the last snapshot; false before one. */
    isFullScreen(): boolean;
    /** Whether a window of the game's process is in the foreground, from the last snapshot; true before one. */
    isGameFocused(): boolean;
    /** Whether a key is held now, by Windows virtual-key code or varion.KeyCode name ("F2", "Shift"); an unknown name reads false. Updated once a frame while in the game; mouse buttons count only while the game window is in front. */
    isKeyDown(key: number | string): boolean;
    /** Whether Caps Lock, Num Lock or Scroll Lock is on, by Windows virtual-key code or varion.KeyCode name; any other key reads false. Updated once a frame while in the game. */
    isKeyToggled(key: number | string): boolean;
    /** The same function as isPaused: whether GTA's pause menu is open. */
    isMenuOpen(): boolean;
    /** Whether GTA has the model loaded (HAS_MODEL_LOADED), by name or hash; rejects when the native call fails. */
    isModelLoaded(model: number | string): Promise<boolean>;
    /** Whether GTA's pause menu is open (IS_PAUSE_MENU_ACTIVE), from the last snapshot. */
    isPaused(): boolean;
    /** Whether the radar is hidden (IS_RADAR_HIDDEN), from the last snapshot. */
    isRadarHidden(): boolean;
    /** Always false on the client. */
    isServer: false;
    /** The same function as varion.hash: GTA's joaat hash of the text in lower case; a number comes back as its uint32. */
    joaat(value: string | number): number;
    Key: typeof Key;
    Keybind: typeof Keybind;
    KeyCode: typeof KeyCode;
    LicenseType: typeof LicenseType;
    /** Asks GTA to load a model by name or hash (REQUEST_MODEL) and returns at once; waitForModel waits until it is loaded. In the game a refused native call throws. */
    loadModel(model: number | string): void;
    /** The same as waitForModel: requests the model and resolves to its hash once GTA has loaded it. Rejects after timeoutMs (default 10000, at least 500; code VARION_TIMEOUT), when a native call fails, or when the resource stops (VARION_RESOURCE_STOPPED). */
    loadModelAsync(model: number | string, timeoutMs?: number): Promise<number>;
    /** Loads a .ytyp now: GTA's DLC_ITYP_REQUEST for it, then the load, so the models it defines are in GTA when the call returns. path is "@resource/stream/x.ytyp", "/stream/x.ytyp" (from the calling resource's root), "stream/x.ytyp" (from the folder of its client-main) or a name, "x" or "x.ytyp"; GTA knows a ytyp by its file name alone, without case, so the server's stream file of that name is loaded, else GTA's own, and a path must name one of that resource's stream files. True when GTA holds the request afterwards or held it already (every stream .ytyp is requested at the start of the session; GTA's and its DLCs' own; a permanent #typ), so a second call is true. False when GTA has no ytyp of that name, the path names no .ytyp of a resource, the session is not loaded or its stream files are being mounted or released, the ytyp is not loaded and its slot still holds archetypes while the stale archetype guard is off, GTA did not take the request, and in the browser runtime or a Worker. What a script loads stays until unloadYtyp or the end of the session. */
    loadYtyp(path: string): boolean;
    /** The language the launcher gave the client, else the one Windows shows its interface in ("ru-RU"), up to 16 characters; "en" until the configuration arrives. locale:change fires when it changes; assigning only changes what getLocale returns until the next configuration. */
    locale: string;
    Locale: typeof Locale;
    LocalObject: typeof LocalObject;
    LocalPed: typeof LocalPed;
    LocalStorage: typeof LocalStorage;
    LocalVehicle: typeof LocalVehicle;
    /** Writes a line to the F8 console and the client's script log under the calling resource's name: strings as they are, other values as JSON (an Error with its stack, a bigint as 123n), joined by spaces. */
    log(...args: any[]): void;
    /** Like log, at debug level. */
    logDebug(...args: any[]): void;
    /** Like log, at error level; the same function as varion.error. */
    logError(...args: any[]): void;
    /** Like log, at warning level; the same function as varion.warn. */
    logWarning(...args: any[]): void;
    MapZoomData: typeof MapZoomData;
    Marker: typeof Marker;
    MarkerType: typeof MarkerType;
    MemoryBuffer: typeof MemoryBuffer;
    ModelType: typeof ModelType;
    /** Stops (true, the default) or resumes capturing and sending the local player's microphone; Voice.muteInput reads the state. */
    muteInput(muted?: boolean): void;
    MValue: typeof MValue;
    natives: typeof natives;
    /** Calls callback once, on the next frame; clearNextTick with the returned id cancels it. A callback that is not a function throws a TypeError. */
    nextTick(callback: () => void): number;
    Object: typeof Object;
    /** Removes the handler from that local event: every registration of it this resource made with on or once. */
    off<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): void;
    /** Removes that onRpc handler, every registration of it this resource made; with none left the server's calls fail with "unknown_rpc". */
    offRpc(rpcName: string, handler: (...args: any[]) => any): void;
    /** Removes the handler from that server event: every registration of it this resource made with onServer or onceServer. */
    offServer(eventName: string, handler: (...args: any[]) => void): void;
    /** Removes the handler from that unreliable server event: every registration of it this resource made with onServerUnreliable or onceServerUnreliable. */
    offServerUnreliable(eventName: string, handler: (...args: any[]) => void): void;
    /** The same as varion.off: removes the handler from that local event. Events a page sends are handled with WebView#on and removed with WebView#off. */
    offWebView(eventName: string, handler: (...args: any[]) => void): void;
    /** Adds a handler for a local event: one the runtime fires on this client (everyTick, keydown, playerSpawn and the rest) or one varion.emit sends. Returns a handle whose destroy() removes it; a handler that throws is logged and the others still run. */
    on<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): VarionEventHandle;
    /** Like on, but the handler runs for the next such event only and is then removed. */
    once<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): VarionEventHandle;
    /** Like onServer, for the next such event only. */
    onceServer(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** Like onServerUnreliable, for the next such event only. */
    onceServerUnreliable(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** The same as varion.once: the handler runs for the next local event of that name. Events a page sends (window.varion.emit) do not reach it; they arrive through WebView#on and WebView#once. */
    onceWebView(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** Answers the server's player.emitRpc(rpcName, ...args) with what the handler returns, a Promise awaited; a throw, or a result that cannot be sent, rejects the server's call. With several handlers each runs in turn and the last result answers; with none the call fails with "unknown_rpc". */
    onRpc(rpcName: string, handler: (...args: any[]) => any): VarionEventHandle;
    /** Adds a handler for an event the server sends this client (player.emit, emitAllClients); a Player, Vehicle, Ped or Object among the arguments arrives as this client's object of that id, null where it has none. Returns a handle whose destroy() removes it. */
    onServer(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** Adds a handler for an event the server sends unreliably (player.emitUnreliable, emitAllClientsUnreliable), which may never arrive; arguments arrive as with onServer. Returns a handle whose destroy() removes it. */
    onServerUnreliable(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    /** The same as varion.on: a handler for local events of that name. Events a page sends (window.varion.emit) do not reach it; they arrive through WebView#on. */
    onWebView(eventName: string, handler: (...args: any[]) => void): VarionEventHandle;
    Ped: typeof Ped;
    PedConfigFlag: typeof PedConfigFlag;
    Permission: typeof Permission;
    PermissionState: typeof PermissionState;
    Player: typeof Player;
    PointBlip: typeof PointBlip;
    Profiler: typeof Profiler;
    Quaternion: typeof Quaternion;
    RadiusBlip: typeof RadiusBlip;
    /** Reads a text file: "cache:<path>" or "<path>" in this server's script-files folder, "resource:<name>/<path>" in a loaded client resource. Rejects with the reason ("invalid_path", "unknown_resource" ...) or after 8 s; encoding is not used. */
    readFile(path: string, encoding?: string): Promise<string>;
    /** Takes back a label varion.addGxtText set: GTA shows its own text again. An empty label throws. */
    removeGxtText(label: string): void;
    /** Unloads an IPL (REMOVE_IPL). In the game a refused native call throws. */
    removeIpl(ipl: string): void;
    /** Removes the voice filter addVoiceFilter set on the player; false for a player id outside 1..65534. */
    removeVoiceFilter(player: Player | PlayerLocal | number): boolean;
    /** Stops playing the player's voice on this client: mutes them here (clearLocallyMuted undoes it) and drops their playback, filter and talking state, so getVoiceFilter reads null for them; false for a player id outside 1..65534. */
    removeVoicePlayer(player: Player | PlayerLocal | number): boolean;
    /** Loads an IPL (REQUEST_IPL). In the game a refused native call throws. */
    requestIpl(ipl: string): void;
    /** Asks the player for a Permission in a Windows dialog naming the server and resolves the PermissionState; an answered permission resolves at once and a "no" stays. Microphone is the WebRTC permission (the client asks for microphone and camera together), and All asks for ScreenCapture, WebRTC and Clipboard. Rejects for an unknown permission or after 60 s. */
    requestPermission(permission: number): Promise<number>;
    /** The same function as setStreamSyncedMeta. */
    requestStreamSyncedMetaSet(key: string, value: any): boolean;
    /** That resource's exports object, as getResourceExports; throws an Error for a resource this client does not know. A known but stopped resource gives its empty exports. */
    require(name: string): Record<string, any>;
    /** Resets every online stat of the character slot (0 by default) through STAT_RESET_ALL_ONLINE_CHARACTER_STATS; false when the native call throws. */
    resetAllStats(characterSlot?: number): boolean;
    /** Puts a minimap component ("minimap", "minimap_mask", "minimap_blur" ...) back where GTA had it. In the game an unknown component throws. */
    resetMinimapComponentPosition(name: string): void;
    /** setStat(name, 0, true): writes 0 into the integer stat and saves it. */
    resetStat(name: string): Promise<boolean>;
    Resource: typeof Resource;
    /** The name of the resource whose code is running. */
    readonly resourceName: string;
    RGBA: typeof RGBA;
    /** The flag toggleRmlControls set, false by default. */
    rmlControlsEnabled(): boolean;
    /** A point depth metres (100 by default, at least 1) from the camera on screen along the ray through a screen point given as 0..1 of the screen, using the camera's field of view and the screen's aspect from the last snapshot; roll is not counted. A non-numeric coordinate counts as 0.5. Without a camera in the snapshot (getCamPos().measured false) the ray starts at (0, 0, 0). */
    screenToWorld(screenX: number, screenY: number, depth?: number): Vector3Like;
    /** Casts a ray from the camera on screen through the screen point (depth 500 by default), with the camera's field of view and the screen's aspect, through GTA's line-of-sight test, and resolves its first hit with hit true, else the ray's end with hit false; when the game does not answer within 120 ms it resolves screenToWorld's point with hit false. */
    screenToWorldAsync(screenX: number, screenY: number, depth?: number): Promise<{ x: number; y: number; z: number; hit: boolean }>;
    /** The same as version: the version of this client, such as "1.0.83". */
    sdkVersion: string;
    /** true: the view stays where the camera on screen is (a script camera is put there) whatever the player does, and GTA's look controls are off; false: the camera that had the screen before (a script's own, or the gameplay camera) gets it back. The end of the session unfreezes it. */
    setCamFrozen(state: boolean): void;
    /** Turns a varion.ConfigFlag on or off for this client; GTA follows from the next frame, and when the session ends every flag goes back to GTA's own behaviour. An unknown name does nothing. DISABLE_AUTO_WEAPON_SWAP: the local player keeps an empty weapon in hand instead of GTA switching to another (the weapon picked on entering a vehicle is GTA's). DISABLE_PED_PROP_KNOCK_OFF: a melee attack no longer knocks a ped's hat or glasses off. DISABLE_IDLE_CAMERA: no cinematic idle camera, on foot or in a vehicle (where GTA starts it only for a passenger). DISABLE_VEHICLE_ENGINE_SHUTDOWN_ON_LEAVE: getting out leaves the engine running. DISABLE_SP_ENTER_VEHICLE_CLIPSET (true by default, as GTA in a network game): false gives a ped whose personality is not male (mp_f_freemode_01, for one) the single-player enter animations where the entry point has them; a male ped enters the same way either way. FORCE_RENDER_SNOW: snow on the ground in any weather. FORCE_HIDE_NIGHT_PROPS / FORCE_SHOW_NIGHT_PROPS: the models GTA shows by the hour (night lights, signs) hidden or shown at any hour, hide winning. DISABLE_EMISSIVE_LIGHTS_RENDERING: lit windows and glowing signs dark (street and vehicle lights stay). FORCE_VEHICLE_TYRE_BURST: a hit that does no damage still bursts a tyre. SWAP_ALLOW_HEAD_PROP_IN_VEHICLE_FLAG: a hat GTA takes off when a ped gets into a vehicle stays on, and ped reset flag 337, which keeps such a hat on in GTA, takes it off instead. */
    setConfigFlag(flag: string, state: boolean): void;
    /** Moves the Windows cursor to that point of the game window's client area: pixels, or 0..1 of its size with normalized true; clamped to the area. */
    setCursorPos(pos: Vector2Like, normalized?: boolean): void;
    /** Calls callback every delayMs (default 0: every frame), checked once a frame, each run counted from the frame the last one ran. Returns an id for clearInterval or clearTimer; it ends when the resource stops, and a callback that is not a function throws a TypeError. */
    setInterval(callback: (...args: any[]) => void, delayMs?: number): number;
    /** Sets a key of this client's local metadata here only: getLocalMeta returns the value as given, and localMetaChange fires (key, value, old value). Nothing goes to the server, whose next change of the key replaces it. */
    setLocalMeta(key: string, value: any): void;
    /** Sets a key of this client's own global metadata, not synced: getMeta returns the value as given, and globalMetaChange fires (key, value, old value). Emptied when the session ends. */
    setMeta(key: string, value: any): void;
    /** Moves and sizes a minimap component ("minimap", "minimap_mask", "minimap_blur" ...) in GTA's frontend layout; only the first letter of alignX and alignY is used and a negative size counts as 0. In the game an unknown component or an empty alignment throws. */
    setMinimapComponentPosition(name: string, alignX: string, alignY: string, posX: number, posY: number, sizeX: number, sizeY: number): void;
    setMinimapComponentPosition(name: string, alignX: string, alignY: string, pos: Vector2Like, size: Vector2Like): void;
    /** Makes the minimap rectangular (true) or round (false). In the game it throws when the client cannot find GTA's setting. */
    setMinimapIsRectangle(state: boolean): void;
    /** Sets how many real milliseconds a game minute lasts on this client (NETWORK_OVERRIDE_CLOCK_RATE), truncated and clamped to 1..2147483647; getMsPerGameMinute reads GTA's value back. */
    setMsPerGameMinute(milliseconds: number): void;
    /** Writes a packed integer stat of the character slot (0 by default) through SET_PACKED_STAT_INT_CODE; false when the native call fails. */
    setPackedStat(index: number, value: number, characterSlot?: number): Promise<boolean>;
    /** Writes a packed bool stat of the character slot (0 by default) through SET_PACKED_STAT_BOOL_CODE; false when the native call fails. */
    setPackedStatBool(index: number, value: boolean, characterSlot?: number): Promise<boolean>;
    /** Puts a clothing component of a DLC collection on a ped (SET_PED_COLLECTION_COMPONENT_VARIATION), the collection given by the hash of its name, palette 0 by default. It runs in the background: an unknown collection or a failed call is only logged. */
    setPedDlcClothes(ped: { scriptID: number } | number, dlc: number, component: number, drawable: number, texture: number, palette?: number): void;
    /** Puts a prop of a DLC collection on a ped (SET_PED_COLLECTION_PROP_INDEX), the collection given by the hash of its name. It runs in the background: an unknown collection or a failed call is only logged. */
    setPedDlcProp(ped: { scriptID: number } | number, dlc: number, component: number, drawable: number, texture: number): void;
    /** Sets the angular velocity of an entity (SET_ENTITY_ANGULAR_VELOCITY), given as an object or its GTA handle; without a handle nothing happens. In the game a refused native call throws. */
    setRotationVelocity(entity: { scriptID: number } | number, x: number, y: number, z: number): void;
    setRotationVelocity(entity: { scriptID: number } | number, velocity: Vector3Like): void;
    /** Writes an integer stat by name (hashed as varion.hash) through STAT_SET_INT, saved unless save is false. Resolves false when the write fails or the game does not answer within 150 ms. */
    setStat(name: string, value: number, save?: boolean): Promise<boolean>;
    /** Writes a bool stat by name through STAT_SET_BOOL, saved unless save is false; false when the write fails or the game does not answer within 150 ms. */
    setStatBool(name: string, value: boolean, save?: boolean): Promise<boolean>;
    /** Writes a float stat by name through STAT_SET_FLOAT, saved unless save is false; false when the write fails or the game does not answer within 150 ms. */
    setStatFloat(name: string, value: number, save?: boolean): Promise<boolean>;
    /** Asks the server to set the local player's stream-synced data under the key (prefixed client: when it lacks it) to the value, as the server's player.setStreamSyncedMeta would: this client and the clients that stream the player read it, and server scripts hear streamSyncedMetaChange. The server takes it only for this client's own player and only under client:, within the client event limits; server.toml clientStreamSyncedMeta = false refuses it. This client's copy changes when the server's change arrives. False before the local player has an id. */
    setStreamSyncedMeta(key: string, value: any): boolean;
    /** Calls callback once after delayMs (default 0, negative counts as 0), checked once a frame, so never before the next frame. Returns an id for clearTimeout or clearTimer; it ends when the resource stops, and a callback that is not a function throws a TypeError. */
    setTimeout(callback: (...args: any[]) => void, delayMs?: number): number;
    /** Sets how loud this client plays the player in non-spatial voice channels, 0..2 (clamped; not a number counts as 1); false for a player id outside 1..65534. */
    setVoiceNonSpatialVolume(player: Player | PlayerLocal | number, volume: number): boolean;
    /** Sets how loud this client plays the player in spatial voice channels, 0..2 (clamped; not a number counts as 1); false for a player id outside 1..65534. */
    setVoiceSpatialVolume(player: Player | PlayerLocal | number, volume: number): boolean;
    /** Sets the weather cycle this client shows while setWeatherSyncActive(true) is in force: weathers by id (0 EXTRASUNNY ... 14 HALLOWEEN, as varion.WeatherType) or name, paired with the multipliers in order, each shown for its multiplier times GTA's cycle unit (two minutes in GTA 3889, read from the game) and blending into the next, then from the start again. Up to the first 256 pairs; a pair with an unknown weather or a multiplier of 0 is left out. The cycle runs on the server's clock, so clients with the same cycle show the same weather. */
    setWeatherCycle(weathers: Array<string | number>, multipliers: number[]): void;
    /** true: GTA shows the cycle setWeatherCycle set instead of the server's weather; false (the default): the server's weather again. */
    setWeatherSyncActive(active: boolean): void;
    /** Shows (true) or hides (false) the mouse cursor; while it shows, keyboard and mouse go to the WebViews instead of GTA. It needs a visible WebView to show, and it is one switch for every resource: the last call wins. */
    showCursor(state: boolean): void;
    /** Ends the server's loading screen (resource.toml `loadscreen`). With `loadscreen-manual-shutdown = true` the page stays after the player is in the game until this is called, 60 s at most; without it the page goes on entry by itself. */
    shutdownLoadingScreen(): void;
    StatName: typeof StatName;
    /** The local path of a file of that resource in the stream cache ("<cache>/<resourceName>/<path>"); "" before the cache folder is known or for an empty name. */
    streamCachePath(resourceName: string, path: string): string;
    /** The server URL of a stream file of that resource: its stream base ("/stream/<resourceName>/" when the server names none) plus path, through httpUrl. */
    streamUrl(resourceName: string, path: string): string;
    /** The SHA-256 of the text's UTF-8 bytes as 64 lowercase hex digits; anything else is turned into text first. */
    stringToSHA256(value: string): string;
    /** A PNG of the next frame in base64; with gameOnly true it is taken before WebViews and overlays are drawn. Calls wait for each other, one capture at a time. Needs Permission.ScreenCapture (the player is asked once): rejects with "screen_capture_denied", a capture error, or 8 s after its own request goes out. */
    takeScreenshot(gameOnly?: boolean): Promise<string>;
    /** takeScreenshot(true): the next frame without WebViews and overlays. */
    takeScreenshotGameOnly(): Promise<string>;
    TextAlign: typeof TextAlign;
    TextLabel: typeof TextLabel;
    TextLabelAlignment: typeof TextLabelAlignment;
    /** Starts a timer of that name ("default" by default) for timeEnd; the names are shared by every resource. */
    time(name?: string): void;
    /** Ends that timer, logs "<name>: <ms>ms" and returns the elapsed milliseconds; for a name that was not started it returns 0 and logs nothing. */
    timeEnd(name?: string): number;
    /** false stops push-to-talk and gameControlsOnly Keybinds and, while a WebView is visible, takes keyboard and mouse from GTA; true gives them back. A visible WebView with focus also turns them off; one that shows, hides or loses focus does not undo a script's false. */
    toggleGameControls(state: boolean): void;
    /** Sets the flag rmlControlsEnabled reads. true while an RmlDocument is shown also turns the game controls off (toggleGameControls(false)); false gives nothing back. */
    toggleRmlControls(state: boolean): void;
    /** false stops the push-to-talk key and voice activation from sending the microphone (Voice.toggleInput(true) still sends); true restores them. */
    toggleVoiceControls(enabled: boolean): void;
    /** Lets GTA unload a model by name or hash (SET_MODEL_AS_NO_LONGER_NEEDED). In the game a refused native call throws. */
    unloadModel(model: number | string): void;
    /** Withdraws the DLC_ITYP_REQUEST of a .ytyp that the server's stream files or a script made; path as in loadYtyp. True when GTA no longer holds the request: GTA removes the ytyp with its models at once, or keeps it while a map or an interior placed from it uses it. False while an object of one of its models stands in the game (GTA would free the model under it), for a ytyp neither of them requested (GTA's and its DLCs' own stay; a second call), a permanent #typ, a name GTA does not have or a path that names no .ytyp of a resource, while the session is not loaded or its stream files are being mounted or released, when GTA still holds the request after the call, and in the browser runtime or a Worker. */
    unloadYtyp(path: string): boolean;
    Utils: typeof Utils;
    Vector2: typeof Vector2;
    Vector3: typeof Vector3;
    Vehicle: typeof Vehicle;
    VehicleIndicatorLights: typeof VehicleIndicatorLights;
    VehicleLockState: typeof VehicleLockState;
    /** The version of this client, such as "1.0.83"; sdkVersion is the same. */
    version: string;
    VirtualEntity: typeof VirtualEntity;
    VirtualEntityGroup: typeof VirtualEntityGroup;
    Voice: typeof Voice;
    VoiceChannel: typeof VoiceChannel;
    VoiceConnectionState: typeof VoiceConnectionState;
    /** Requests a model and resolves its hash once loaded. Rejects on timeout, native lookup failure, or resource stop (code VARION_RESOURCE_STOPPED). */
    waitForModel(model: number | string, timeoutMs?: number): Promise<number>;
    /** The same function as logWarning: a line at warning level in the F8 console and the client's script log, under the calling resource's name. */
    warn(...args: any[]): void;
    WatermarkPosition: typeof WatermarkPosition;
    WeaponObject: typeof WeaponObject;
    WebSocketClient: typeof WebSocketClient;
    WebSocketReadyState: typeof WebSocketReadyState;
    WebView: typeof WebView;
    Worker: typeof Worker;
    WorldObject: typeof WorldObject;
    /** Projects a world point through the camera on screen of the last snapshot (its field of view and the screen's aspect): x and y as 0..1 of the screen, z 1, known true. A point behind the camera or off the screen gives the centre {0.5, 0.5} with known false. Without a camera in the snapshot (getCamPos().measured false) it gives worldToScreenAsync's answer for the point (rounded to 0.01) while that is under 250 ms old and asks for the next; else the centre with known false. */
    worldToScreen(x: number, y: number, z: number): { x: number; y: number; z: number; known: boolean };
    /** Projects a world point onto the screen (GET_SCREEN_COORD_FROM_WORLD_COORD): x and y as 0..1 of the screen with known true. A point off screen, or no answer within 150 ms, gives the centre {0.5, 0.5} with known false. */
    worldToScreenAsync(x: number, y: number, z: number): Promise<{ x: number; y: number; z: number; known: boolean }>;
    /** Writes text (data through String()) to "cache:<path>" or "<path>" in this server's script-files folder and resolves true; "resource:" paths are read-only. Rejects with the reason or after 8 s; encoding is not used. */
    writeFile(path: string, data: string, encoding?: string): Promise<boolean>;
};

/** The type of the VARION API object. */
export type VarionApi = typeof varion;
export { varion };
export default varion;

// Resource scripts use the API as globals, without importing anything.
declare global {
    const varion: VarionApi;
}
