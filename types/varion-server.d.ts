// GENERATED FILE -- do not edit by hand.
// Varion server API, reflected out of the running runtime by tools/extract-varion-server-api.cjs.
// Regenerate with: node tools/generate-varion-types.cjs
//
// Reflection recovers names, ownership and kind, not signatures: parameters and
// return types are permissive, except the documented API (DEVELOPER-KIT.md section 5),
// typed from tools/sdk-signatures.cjs and checked against the runtime on every run.
// `readonly` marks what the runtime does not let a script assign (a getter without
// a setter, a non-writable property), class constants and fields the API never assigns.

/** Anything with numeric x, y, z: a Vector3 or a plain object. */
export interface Vector3Like { x: number; y: number; z: number; }
/**
 * What the server measured about a hit, the last argument of weaponDamage. It comes from where the server
 * holds the shooter and the target and from the bullets the shooter's game reported; nothing is refused by
 * these numbers, the handler decides. Positions on the server lag behind the game by the players' ping, so a
 * moving player adds a few metres.
 */
export interface WeaponDamageShot {
    /** Metres from the shooter to the target. */
    readonly distance: number;
    /** Whether the shooter's game reported a bullet of this weapon in the 1.5 s before the hit. A blow and a thrown or launched weapon have none. */
    readonly bullet: boolean;
    /** Milliseconds from that bullet to the hit; 0 without a bullet. */
    readonly bulletAge: number;
    /** Metres from the shooter to where the bullet started, measured when the bullet came; 0 without a bullet. */
    readonly shooterToStart: number;
    /** Metres from the target to the bullet's path; 0 without a bullet. */
    readonly targetToPath: number;
}
/** RGBA colour; `a` defaults to 255. */
export interface RGBALike { r: number; g: number; b: number; a?: number; }
/** Options of createBlip. Other properties are passed to the core as given. */
export interface BlipOptions {
    pos?: Vector3Like; x?: number; y?: number; z?: number;
    sprite?: number; color?: number; scale?: number; shortRange?: boolean; name?: string;
    dimension?: number;
    [option: string]: any;
}
/** Options of createMarker. Other properties are passed to the core as given. */
export interface MarkerOptions {
    pos?: Vector3Like; x?: number; y?: number; z?: number;
    type?: number; scale?: Vector3Like; color?: RGBALike;
    dimension?: number; streamingDistance?: number;
    [option: string]: any;
}
/**
 * What came of a change to a native vehicle (its methods). From its owner: "done" (its GTA ran it),
 * "not-found" (no such car there, or another lifetime of its id), "not-owner" (it no longer controls
 * the car), "refused" (GTA would not take it: no such extra, a native that did not run), "unsupported",
 * "busy". From the server: "queued" (a car the server made waits for its owner; the change goes once
 * the owner has it -- and a property (colours, plate, mods, extras, livery, tint, dirt, locks, engine,
 * doors) whose owner did not run it: it left, did not answer, did not control the car yet; the server
 * sends it to the car's owner again until its GTA ran it), "gone", "invalid", "no-answer" (none in
 * 3 s: an older client, or a busy one -- then the change may still happen),
 * "owner-left", "not-sent", "full" (64 changes for the car already wait or travel), "sent". A
 * property hears "queued" for "not-found", "not-owner", "busy", "no-answer", "owner-left" and
 * "not-sent"; an action (setPosition, a NativePed's task) hears them: it never goes twice.
 * A NativePed's tasks end the same way (its owner refuses a task GTA would not take, or one for
 * a dictionary GTA does not have).
 */
export type NativeVehicleCommandOutcome = "done" | "not-found" | "not-owner" | "refused" | "unsupported" | "busy" | "queued" | "gone" | "invalid" | "no-answer" | "owner-left" | "not-sent" | "full" | "sent";
/**
 * What came of a change to the dimension, streaming distance or network owner of a native vehicle or NPC
 * (setDimension, setStreamingDistance, setNetOwner, resetNetOwner): "done", "gone" (no such
 * entity now), "waiting" (one the server made has no owner yet to give or keep), "not-native" (that
 * player is not on the native path), "refused" (the server log says why), "invalid", "no-answer".
 */
export type NativeEntityControlOutcome = "done" | "gone" | "waiting" | "not-native" | "refused" | "invalid" | "no-answer";
/**
 * Which cars, NPCs and objects a client may create: "inactive" all,
 * "no_dummy" all but map objects GTA networked, "relaxed" only GTA's own population (its random
 * ambient, parked, patrol, permanent and scenario vehicles and peds), "strict" none. Exploded map
 * objects pass every lockdown, parachutes too.
 */
export type EntityLockdownMode = "inactive" | "no_dummy" | "relaxed" | "strict";
/**
 * A train carriage's place in its train and the train's state (NativeVehicle.train), as the server
 * natives read its owner's CTrainGameStateDataNode. Carriages are NativeVehicles of vehicleType "train".
 */
export interface NativeTrainState {
    /** The engine of its train (the carriage itself for the engine); null while the server has none (GET_TRAIN_CARRIAGE_ENGINE). */
    readonly engine: NativeVehicle | null;
    readonly isEngine: boolean;
    /** 0 for the engine, then 1, 2 ... back along the train; -1 for none (GET_TRAIN_CARRIAGE_INDEX). */
    readonly carriageIndex: number;
    /** The carriage in front of this one; null for the engine (GET_TRAIN_FORWARD_CARRIAGE). */
    readonly forward: NativeVehicle | null;
    /** The carriage behind this one; null for the last (GET_TRAIN_BACKWARD_CARRIAGE). */
    readonly backward: NativeVehicle | null;
    /** The last carriage (IS_TRAIN_CABOOSE). */
    readonly caboose: boolean;
    /** GTA's track: 0 the main line, 3 the metro ...; -1 none yet (GET_TRAIN_TRACK_INDEX). */
    readonly track: number;
    /** Its train config in trains.xml (the variation of CREATE_MISSION_TRAIN); -1 none. */
    readonly config: number;
    /** 0 moving, 1 slowing down, 2 doors opening, 3 stopped, 4 doors closing, 5 before departing (GET_TRAIN_STATE). */
    readonly state: number;
    /** m/s (GET_TRAIN_CRUISE_SPEED). */
    readonly cruiseSpeed: number;
    /** m/s, as its owner's GTA last wrote it. */
    readonly speed: number;
    /** GET_TRAIN_DIRECTION. */
    readonly direction: boolean;
    /** DOES_TRAIN_STOP_AT_STATIONS. */
    readonly stopsAtStations: boolean;
    /** The engine first, then each carriage behind it by index. */
    readonly carriages: NativeVehicle[];
}
/** A client's new car, NPC or object in entityCreating, before anybody else gets it. */
export interface EntityCreatingInfo {
    /** "vehicle", "ped" or "object" (doors and pickups too). */
    readonly type: "vehicle" | "ped" | "object";
    /** Its network id (GTA object id), as NativeVehicle.netId. */
    readonly netId: number;
    /** GTA's entity type number (NetObjEntityType: 0 automobile ... 5 ped, 6 object ...). */
    readonly entityType: number;
    /** The player whose client created it and owns it. */
    readonly owner: Player;
    readonly model: number;
    /** The owner's dimension. */
    readonly dimension: number;
    /** GTA's population type (ePopType: 1-5 GTA's own population, 7 a script's), null for objects. */
    readonly population: number | null;
    readonly pos: Vector3;
}
/** Handler of event E: typed for the documented events and the keys of ICustomEmitEvent, any arguments for the rest. */
export type VarionEventHandler<E extends string> =
    E extends keyof VarionEvents ? VarionEvents[E] :
    E extends keyof ICustomEmitEvent ? ICustomEmitEvent[E] : (...args: any[]) => void;
/**
 * Keys a project declares for its metadata, events and RPCs: these interfaces are empty;
 * add to them in a global .d.ts of the project (interface ICustomPlayerMeta { job: string }), and
 * getMeta/setMeta, emit/on and the client-server events check those keys. A key not declared stays any.
 */
declare global {
    interface ICustomGlobalMeta {}
    interface ICustomGlobalSyncedMeta {}
    interface ICustomBaseObjectMeta {}
    interface ICustomBaseObjectSyncedMeta {}
    interface ICustomEntitySyncedMeta {}
    interface ICustomEntityStreamSyncedMeta {}
    interface ICustomPlayerSyncedMeta {}
    interface ICustomPlayerStreamSyncedMeta {}
    interface ICustomPlayerLocalMeta {}
    interface ICustomVehicleSyncedMeta {}
    interface ICustomVehicleStreamSyncedMeta {}
    interface ICustomVirtualEntityStreamSyncedMeta {}
    interface ICustomPedSyncedMeta {}
    interface ICustomPedStreamSyncedMeta {}
    interface ICustomCheckpointStreamSyncedMeta {}
    interface ICustomServerClientEvent {}
    interface ICustomClientServerEvent {}
    interface ICustomServerClientRpc {}
    interface ICustomClientServerRpc {}
    interface ICustomBlipMeta {}
    interface ICustomColshapeMeta {}
    interface ICustomCheckpointMeta {}
    interface ICustomEntityMeta {}
    interface ICustomPlayerMeta {}
    interface ICustomVehicleMeta {}
    interface ICustomEmitEvent {}
    interface ICustomVoiceChannelMeta {}
}
/** The value of key K in metadata interface M: its declared type, else Fallback. */
export type CustomMetaValue<M, K extends string, Fallback = any> = K extends keyof M ? M[K] : Fallback;
/** setMeta({ ... }): a declared key takes its declared type, any other Fallback. */
export type CustomMetaValues<M, Fallback = any> = { [K in keyof M]?: M[K] } & { [key: string]: Fallback };
/** The arguments of event or RPC K in M: its declared parameters, else any arguments. */
export type CustomEventArgs<M, K extends string> =
    K extends keyof M ? (M[K] extends (...args: infer A) => any ? A : any[]) : any[];
/** What RPC K of M answers: its declared result, else any. */
export type CustomRpcResult<M, K extends string> =
    K extends keyof M ? (M[K] extends (...args: any[]) => infer R ? Awaited<R> : any) : any;
/** Another name of the event map: the parameters of the documented events (VarionEvents). */
export interface IServerEvent extends VarionEvents {}
/** Another name of a varion.Utils.Timer instance. */
export interface Timer extends UtilsTimer {}
/** Another name of a varion.Utils.Timeout instance. */
export interface Timeout extends UtilsTimeout {}
/** Another name of a varion.Utils.Interval instance. */
export interface Interval extends UtilsInterval {}
/** Another name of a varion.Utils.NextTick instance. */
export interface NextTick extends UtilsNextTick {}
/** Another name of a varion.Utils.EveryTick instance. */
export interface EveryTick extends UtilsEveryTick {}
/** Another name of a varion.Utils.ConsoleCommand instance. */
export interface ConsoleCommand extends UtilsConsoleCommand {}
/** Options of Utils.inspect (Node's util.inspect): the server applies them all, the client those its doc names. */
export interface IInspectOptions {
    getters?: "get" | "set" | boolean | undefined; showHidden?: boolean | undefined;
    depth?: number | null | undefined; colors?: boolean | undefined; customInspect?: boolean | undefined;
    maxArrayLength?: number | null | undefined; maxStringLength?: number | null | undefined;
    breakLength?: number | undefined; compact?: boolean | number | undefined;
    sorted?: boolean | ((a: string, b: string) => number) | undefined;
}
/** A fire of startFire. */
export interface IFireInfo { pos: Vector3; weapon: number; }
/** Seat -> player (Vehicle.passengers). */
export interface IVehiclePassenger { [seat: number]: Player; }
/** A clothing component (Player.getClothes). */
export interface ICloth { drawable: number; texture: number; palette: number; }
/** A DLC clothing component (Player.getDlcClothes). */
export interface IDlcCloth { drawable: number; texture: number; palette: number; dlc: number; }
/** A prop (Player.getProp). */
export interface IProp { drawable: number; texture: number; }
/** A DLC prop (Player.getDlcProp). */
export interface IDlcProp { drawable: number; texture: number; dlc: number; }
/** A head overlay (Player.getHeadOverlay). */
export interface IHeadOverlay { index: number; opacity: number; colorType: number; colorIndex: number; secondColorIndex: number; }
/** Head blend ids and mixes (Player.getHeadBlendData). */
export interface IHeadBlendData {
    shapeFirstID: number; shapeSecondID: number; shapeThirdID: number;
    skinFirstID: number; skinSecondID: number; skinThirdID: number;
    shapeMix: number; skinMix: number; thirdMix: number;
}
/** A bone of a model. */
export interface IBoneInfo { readonly id: number; readonly index: number; readonly name: string; }
/** getVehicleModelInfoByHash. */
export interface IVehicleModel {
    readonly modelHash: number; readonly title: string; readonly type: number; readonly wheelsCount: number;
    readonly hasArmoredWindows: boolean; readonly primaryColor: number; readonly secondaryColor: number;
    readonly pearlColor: number; readonly wheelsColor: number; readonly interiorColor: number;
    readonly dashboardColor: number; readonly hasAutoAttachTrailer: boolean;
    readonly availableModkits: readonly [boolean, boolean];
    hasExtra(extraId: number): boolean; hasDefaultExtra(extraId: number): boolean;
    readonly bones: ReadonlyArray<IBoneInfo>; readonly canAttachCars: boolean; readonly handlingNameHash: number;
}
/** getPedModelInfoByHash, PedModelInfo.get. */
export interface IPedModel {
    readonly hash: number; readonly name: string; readonly type: string; readonly dlcName: string;
    readonly defaultUnarmedWeapon: string; readonly movementClipSet: string; readonly bones: ReadonlyArray<IBoneInfo>;
}
/** getWeaponModelInfoByHash. */
export interface IWeaponModel {
    readonly hash: number; readonly name: string; readonly modelName: string; readonly modelHash: number;
    readonly ammoTypeHash: number; readonly ammoType: string; readonly ammoModelName: string; readonly ammoModelHash: number;
    readonly defaultMaxAmmoMp: number; readonly skillAbove50MaxAmmoMp: number; readonly maxSkillMaxAmmoMp: number;
    readonly bonusMaxAmmoMp: number; readonly damageType: string;
}
/** Player.getAmmoFlags. */
export interface IAmmoFlags { infiniteAmmo: boolean; addSmokeOnExplosion: boolean; fuse: boolean; fixedAfterExplosion: boolean; }
/** A tattoo (Player.getDecorations). Varion does not report count. */
export interface IDecoration { collection: number; overlay: number; count: number; }
/** A weapon a player has (Player.weapons); ammo is Varion's own field. */
export interface IWeapon { hash: number; ammo: number; tintIndex: number; components: number[]; }
/** A command of the F8 console: its name as typed, and what the console says of it while a player types. */
export interface ConsoleCommandOptions {
    name: string;
    /** Shown after the name while it is typed: "<model>", "[player]". */
    arguments?: string;
    description?: string;
    /** "everyone" (the default), or "developer": only for a player who has the developer's console. */
    access?: "everyone" | "developer";
}
/**
 * The terms a sold resource runs under: what its buyer has from the platform. The server renews them every
 * ten minutes; when the right ends the resource is stopped, and started again when the right is back.
 */
export interface ResourceLicense {
    /** The resource's name on the platform. */
    readonly resource: string;
    /** The version that runs. */
    readonly version: string;
    /** The newest version this right reaches; it loads when the server starts next. */
    readonly latest: string;
    /** The plan's id as the author named it; "free" for a free resource. */
    readonly plan: string;
    /** True for a trial. */
    readonly trial: boolean;
    /** True when the buyer is let into beta versions. */
    readonly beta: boolean;
    /** How many servers the right covers. */
    readonly servers: number;
    /** When the right ends; null for one without an end. */
    readonly until: Date | null;
    /** Until when new versions reach this right; null for always. */
    readonly updatesUntil: Date | null;
    /** Whole days left, rounded up; null for a right without an end. */
    readonly daysLeft: number | null;
    /** The fields the author set for the plan and for this buyer, as a copy. */
    readonly fields: Record<string, string | number | boolean>;
    /** A field's value, or the fallback when the terms do not have it. */
    get<T extends string | number | boolean>(key: string, fallback?: T): string | number | boolean | T | undefined;
    /** True when the field is exactly true: a feature the plan turns on. */
    has(key: string): boolean;
    /** A numeric field, or the fallback (Infinity unless given) when it is not a number: a limit of the plan. */
    limit(key: string, fallback?: number): number;
    /** A copy of a data file of the package by its path in it (a Node Buffer); null when the package has no such file. */
    file(path: string): Uint8Array | null;
    /** Calls the handler when the platform changes the terms (another plan, a new term, a new version out). */
    on(event: "change", handler: (license: ResourceLicense) => void): this;
    off(event: "change", handler: (license: ResourceLicense) => void): this;
}

export const AmmoSpecialType: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly ArmorPiercing: any;
    readonly Explosive: any;
    readonly FullMetalJacket: any;
    readonly HollowPoint: any;
    readonly Incendiary: any;
    readonly None: any;
    readonly Tracer: any;
};

export class AreaBlip {
    /** Creates an area blip, a rectangle of `width` × `height` metres around x, y, z, in dimension 0. Every player there sees it; with `global` false (default true) only the players added with `addTarget` do. */
    constructor(x: number, y: number, z: number, width: number, height: number, global?: boolean);
    /** Every valid area blip of every resource; a new array on each read. A blip whose kind blipType changes moves to that class's list. */
    static readonly all: AreaBlip[];
    /** How many valid area blips there are now. */
    static readonly count: number;
    /** The valid area blip with that id; null for none or for a blip of another kind. */
    static getByID(id: number): AreaBlip | null;
    /** Adds a player to its targets (they get it while isGlobal is false) and re-sends the blip; nothing happens for one already there. Throws a TypeError for a player who is not connected. */
    addTarget(player: Player): void;
    /** Opacity 0..255, 255 by default; truncated to an integer, and clients clamp it to 0..255. After fade it reads the opacity faded to. */
    alpha: number;
    /** SET_BLIP_AS_MISSION_CREATOR_BLIP; false by default. */
    asMissionCreator: boolean;
    /** The player, vehicle, ped or object it was given, while that one exists; null for none or once it is gone. Clients do not attach a area blip (GTA makes an area only at a position): assigning moves the blip to where the entity is now. Anything else, an invalid entity or a native vehicle or NPC throws a TypeError. */
    attachedTo: Player | Vehicle | Ped | Object | VirtualEntity | null;
    /** BlipType.Area (11). Assigning Destination (4) makes it a point blip (detached) and Radius (7) a radius blip (100 m where it has no radius); the object becomes a PointBlip or RadiusBlip. Any other type throws a RangeError. Its size follows the new kind: scale for a point or radius blip, width and height for an area. */
    blipType: number;
    /** SET_BLIP_BRIGHT; false by default. */
    bright: boolean;
    /** SET_BLIP_CATEGORY, 0 by default. Truncated to an integer. */
    category: number;
    /** Colour index, as BlipColor; 0 by default. The cone (showCone) uses it too, and so does the route while routeColor is black. Truncated to an integer. */
    color: number;
    /** SHOW_CREW_INDICATOR_ON_BLIP; false by default. */
    crewIndicatorVisible: boolean;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the blip from every client and from Blip.all; valid turns false and baseObjectRemove fires. After it its setters and methods change and send nothing (an update would make it anew); later calls do nothing, and a resource's blips go when it stops. */
    destroy(): void;
    /** Clients show it to players whose dimension sees it: in this dimension, 0 by default; in every one at -2147483648; and at 0 also to players in a negative dimension. The blip still reaches its players in other dimensions, hidden. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** Display mode (SET_BLIP_DISPLAY), 4 by default; clients use 0 while visible is false. Truncated to an integer. */
    display: number;
    /** Fades it on clients to opacity 0..255 (truncated and clamped) over duration milliseconds (SET_BLIP_FADE); a negative duration is 0. The fade runs once: alpha then reads that opacity, and a later change shows the blip at it (a change during the fade ends it there). */
    fade(opacity: number, duration: number): void;
    /** SET_BLIP_FLASHES; false by default. */
    flashes: boolean;
    /** SET_BLIP_FLASHES_ALTERNATE; false by default. */
    flashesAlternate: boolean;
    /** SET_BLIP_FLASH_INTERVAL in milliseconds, 0 by default. Truncated to an integer. */
    flashInterval: number;
    /** SET_BLIP_FLASH_TIMER in milliseconds, 0 by default. Truncated to an integer. */
    flashTimer: number;
    /** SHOW_FRIEND_INDICATOR_ON_BLIP; false by default. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBlipMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** GXT label of the name (SET_BLIP_NAME_FROM_TEXT_FILE), used while name is empty; '' by default. Assigning converts to text, null gives ''. */
    gxtName: string;
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees, 0 by default; NaN is 0. */
    heading: number;
    /** SHOW_HEADING_INDICATOR_ON_BLIP; false by default. */
    headingIndicatorVisible: boolean;
    /** Height of the area (along y) in metres (ADD_BLIP_FOR_AREA), 100 when not given at creation. It sets size too, so clients draw the area at the new height; NaN is 0. */
    get height(): number | undefined;
    set height(value: number);
    /** SET_BLIP_HIGH_DETAIL; false by default. */
    highDetail: boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether attachedTo names an entity: false once that entity is gone. Clients do not attach an area blip. */
    readonly isAttached: boolean;
    /** SET_BLIP_AS_FRIENDLY; false by default. */
    isFriendly: boolean;
    /** True (the default): every player gets it; false: only its targets. Assigning re-sends it, and players who no longer get it lose it. */
    isGlobal: boolean;
    /** Always "blip". */
    readonly kind: "blip";
    /** Name shown for it on the map; undefined until set. It wins over gxtName. Assigning converts to text, null or '' clears it; quotes, backslashes and line breaks reach the clients as they are. */
    get name(): string | undefined;
    set name(value: string);
    /** Number shown on it (SHOW_NUMBER_ON_BLIP), at most 99; a negative one hides it, -1 by default. Truncated to an integer. */
    number: number;
    /** SHOW_OUTLINE_INDICATOR_ON_BLIP; false by default. */
    outlineIndicatorVisible: boolean;
    /** Centre of the area. Assigning moves it for every player who gets the blip; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** SET_BLIP_PRIORITY, 0 by default. Truncated to an integer. */
    priority: number;
    /** PULSE_BLIP each time a client creates the blip: when it arrives and after every change to it; false by default. */
    pulse: boolean;
    /** Not used by an area blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the radius when blipType makes the blip a radius blip. */
    get radius(): number | undefined;
    set radius(value: number);
    /** Removes a player from its targets and re-sends the blip; anything not among them is ignored. A player who leaves is removed from every blip. */
    removeTarget(player: Player): void;
    /** GPS route to it (SET_BLIP_ROUTE); false by default. */
    route: boolean;
    /** Colour of its route: clients take the HUD colour nearest to r, g, b (black, the default: the blip's colour; alpha is not used). Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get routeColor(): RGBA;
    set routeColor(value: RGBALike | number);
    /** SET_BLIP_SCALE, 1 by default; NaN is 0. Not used by an area blip, which clients draw at its width and height: assigning only keeps it and sends nothing; it sets size when blipType makes the blip a point or radius blip. */
    scale: number;
    /** SET_BLIP_SECONDARY_COLOUR with r, g, b (alpha is not used); black by default. Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get secondaryColor(): RGBA;
    set secondaryColor(value: RGBALike | number);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBlipMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBlipMeta, any>): void;
    /** Metadata the server sends to every player who gets the blip (everyone, or only its targets when it is not global), later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the blip changes later (they make it anew and the server does not send it again) and keep none for a blip they do not show (another dimension). Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Short-range blip (SET_BLIP_AS_SHORT_RANGE); true by default. */
    shortRange: boolean;
    /** A cone in the blip's colour (SET_BLIP_SHOW_CONE); false by default. */
    showCone: boolean;
    /** Drawn small at the edge of the minimap (SET_BLIP_AS_MINIMAL_ON_EDGE); false by default. */
    shrinked: boolean;
    /** The area's width and height as clients draw it (SET_BLIP_SCALE_2D, applied after the area is made): width and height set it, and assigning sets them. Takes { x, y }; a missing or non-numeric component is 0. */
    get size(): Vector2;
    set size(value: { x: number; y: number });
    /** Icon, as BlipSprite; 1 by default. Truncated to an integer. */
    sprite: number;
    /** The connected players among its targets: while isGlobal is false only they get it. A new array on each read. */
    readonly targets: Player[];
    /** A tick on the blip (SHOW_TICK_ON_BLIP); false by default. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4); the GTA blip type is blipType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** False hides it on clients (SET_BLIP_DISPLAY 0) without removing it; true by default. */
    visible: boolean;
    /** Width of the area (along x) in metres (ADD_BLIP_FOR_AREA), 100 when not given at creation. It sets size too, so clients draw the area at the new width; NaN is 0. */
    get width(): number | undefined;
    set width(value: number);
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

export class BaseObject {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid object of the API: players, old-path vehicles, peds, objects and virtual entities, blips, markers, colshapes, checkpoints, text labels, voice channels, virtual entity groups, then native vehicles and NPCs. A new array on each read. */
    static readonly all: BaseObject[];
    /** How many objects BaseObject.all holds now. */
    static readonly count: number;
    /** With a BaseObjectType and an id, that object of that type; with an id alone, the player, old-path entity or native vehicle or NPC of that id (blips, markers, colshapes and the rest need the type). Null for none, one destroyed or being destroyed, or a non-integer id. */
    static getByID(type: number, id: number): BaseObject | null;
    static getByID(id: number): BaseObject | null;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Its id within its kind: the network id of a player or old-path entity (a removed one's id is reused), the script id of a native vehicle or NPC (from 65536); blips, markers, colshapes, checkpoints and text labels share one counter, voice channels have their own. Ids of different kinds can be equal. */
    readonly id: number;
    /** Its kind by name; native vehicles and NPCs read "vehicle" and "ped". "entity" only while the server has not named an entity's kind yet. */
    readonly kind: "player" | "vehicle" | "ped" | "object" | "virtualEntity" | "blip" | "marker" | "colshape" | "checkpoint" | "textlabel" | "voiceChannel" | "virtualEntityGroup" | "entity";
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. A copy is stored and a copy read back: arrays and plain objects are copied, a Vector3 or RGBA made anew, an entity or function the same object. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Synced metadata the clients get with it (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the object is gone only this host's copy changes. A voice channel's or virtual entity group's stays on this host. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Its BaseObjectType: Player 0, Vehicle 1, Ped 2, Object 3, Blip 4, VoiceChannel 6, Colshape 7, Checkpoint 8, VirtualEntity 20, VirtualEntityGroup 21, Marker 22, TextLabel 23; -1 while the server has not named an entity's kind. */
    readonly type: number;
    /** False once it is gone: a player left, an old-path entity from its destroy() on (true again if the server refused the removal), a blip, marker, colshape, voice channel or group once destroyed or its resource stopped, a native vehicle or NPC once the server removed it. Once gone every member but valid (and a player's or entity's id) throws "Invalid base object". */
    readonly valid: boolean;
}

export const BaseObjectFilterType: {
    readonly Object: any;
    readonly Ped: any;
    readonly Player: any;
    readonly Vehicle: any;
    readonly VirtualEntity: any;
};

export const BaseObjectType: {
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
    readonly "18": any;
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
    readonly "29": any;
    readonly "3": any;
    readonly "30": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
    readonly Audio: any;
    readonly AudioFilter: any;
    readonly AudioOutput: any;
    readonly AudioOutputAttached: any;
    readonly AudioOutputFrontend: any;
    readonly AudioOutputWorld: any;
    readonly Blip: any;
    readonly Checkpoint: any;
    readonly Colshape: any;
    readonly ConnectionInfo: any;
    readonly CustomTexture: any;
    readonly Font: any;
    readonly HttpClient: any;
    readonly LocalObject: any;
    readonly LocalPed: any;
    readonly LocalPlayer: any;
    readonly LocalVehicle: any;
    readonly Marker: any;
    readonly Object: any;
    readonly Ped: any;
    readonly Player: any;
    readonly RmlDocument: any;
    readonly RmlElement: any;
    readonly Size: any;
    readonly TextLabel: any;
    readonly Vehicle: any;
    readonly VirtualEntity: any;
    readonly VirtualEntityGroup: any;
    readonly VoiceChannel: any;
    readonly WebSocketClient: any;
    readonly WebView: any;
};

export const Benefit: {
    readonly "0": any;
    readonly "1": any;
    readonly CloudAuth: any;
    readonly None: any;
};

export class Blip {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid blip of every resource, point, radius and area alike; a new array on each read. */
    static readonly all: Blip[];
    /** How many blips Blip.all holds now. */
    static readonly count: number;
    /** The valid blip with that id, of any kind; null for none. */
    static getByID(id: number): Blip | null;
    /** Adds a player to its targets (they get it while isGlobal is false) and re-sends the blip; nothing happens for one already there. Throws a TypeError for a player who is not connected. */
    addTarget(player: Player): void;
    /** Opacity 0..255, 255 by default; truncated to an integer, and clients clamp it to 0..255. After fade it reads the opacity faded to. */
    alpha: number;
    /** SET_BLIP_AS_MISSION_CREATOR_BLIP; false by default. */
    asMissionCreator: boolean;
    /** For a point blip: the player, vehicle, ped or object it follows, while that one exists; a client that has it shows the blip on it (ADD_BLIP_FOR_ENTITY), others at the position it had when attached; null for none. Once the entity is gone it reads null and the blip stays where the entity was last seen. Assigning copies the entity's position, null detaches; anything else, an invalid entity or a native vehicle or NPC throws a TypeError. */
    attachedTo: Player | Vehicle | Ped | Object | VirtualEntity | null;
    /** GTA's blip type, as BlipType: Radius (7) and Area (11) by the kind, Vehicle (1), Ped (2) and Object (3) by what it is attached to, else Destination (4). Assigning Destination, Radius or Area makes it that kind where it is (the class follows; a radius or area without a size gets 100 m; a destination is detached); any other type throws a RangeError unless the blip already has it. */
    blipType: number;
    /** SET_BLIP_BRIGHT; false by default. */
    bright: boolean;
    /** SET_BLIP_CATEGORY, 0 by default. Truncated to an integer. */
    category: number;
    /** Colour index, as BlipColor; 0 by default. The cone (showCone) uses it too, and so does the route while routeColor is black. Truncated to an integer. */
    color: number;
    /** SHOW_CREW_INDICATOR_ON_BLIP; false by default. */
    crewIndicatorVisible: boolean;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the blip from every client and from Blip.all; valid turns false and baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too); a resource's blips go when it stops. */
    destroy(): void;
    /** Clients show it to players whose dimension sees it: in this dimension, 0 by default; in every one at -2147483648; and at 0 also to players in a negative dimension. The blip still reaches its players in other dimensions, hidden. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** Display mode (SET_BLIP_DISPLAY), 4 by default; clients use 0 while visible is false. Truncated to an integer. */
    display: number;
    /** Fades it on clients to opacity 0..255 (truncated and clamped) over duration milliseconds (SET_BLIP_FADE); a negative duration is 0. The fade runs once: alpha then reads that opacity, and a later change shows the blip at it (a change during the fade ends it there). */
    fade(opacity: number, duration: number): void;
    /** SET_BLIP_FLASHES; false by default. */
    flashes: boolean;
    /** SET_BLIP_FLASHES_ALTERNATE; false by default. */
    flashesAlternate: boolean;
    /** SET_BLIP_FLASH_INTERVAL in milliseconds, 0 by default. Truncated to an integer. */
    flashInterval: number;
    /** SET_BLIP_FLASH_TIMER in milliseconds, 0 by default. Truncated to an integer. */
    flashTimer: number;
    /** SHOW_FRIEND_INDICATOR_ON_BLIP; false by default. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBlipMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** GXT label of the name (SET_BLIP_NAME_FROM_TEXT_FILE), used while name is empty; '' by default. Assigning converts to text, null gives ''. */
    gxtName: string;
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees, 0 by default; NaN is 0. */
    heading: number;
    /** SHOW_HEADING_INDICATOR_ON_BLIP; false by default. */
    headingIndicatorVisible: boolean;
    /** Height (along y) in metres of an area blip (ADD_BLIP_FOR_AREA), 100 for an area made without one; it sets the area's size. Point and radius blips do not use it: undefined until given there, and assigning sends nothing. */
    get height(): number | undefined;
    set height(value: number);
    /** SET_BLIP_HIGH_DETAIL; false by default. */
    highDetail: boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether attachedTo names an entity: false once that entity is gone. */
    readonly isAttached: boolean;
    /** SET_BLIP_AS_FRIENDLY; false by default. */
    isFriendly: boolean;
    /** True (the default): every player gets it; false: only its targets. Assigning re-sends it, and players who no longer get it lose it. */
    isGlobal: boolean;
    /** Always "blip". */
    readonly kind: "blip";
    /** The blip's name on the map, '' by default. */
    get name(): string | undefined;
    set name(value: string);
    /** Number shown on it (SHOW_NUMBER_ON_BLIP), at most 99; a negative one hides it, -1 by default. Truncated to an integer. */
    number: number;
    /** SHOW_OUTLINE_INDICATOR_ON_BLIP; false by default. */
    outlineIndicatorVisible: boolean;
    /** Where it is (for an attached point blip, where its entity was when attached, and once that entity is gone where it was last seen). Assigning moves it for every player who gets the blip; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** SET_BLIP_PRIORITY, 0 by default. Truncated to an integer. */
    priority: number;
    /** PULSE_BLIP each time a client creates the blip: when it arrives and after every change to it; false by default. */
    pulse: boolean;
    /** Radius in metres of a radius blip (ADD_BLIP_FOR_RADIUS); clients use 50 for a radius blip made without one (it reads undefined then). Point and area blips do not use it: there assigning sends nothing. */
    get radius(): number | undefined;
    set radius(value: number);
    /** Removes a player from its targets and re-sends the blip; anything not among them is ignored. A player who leaves is removed from every blip. */
    removeTarget(player: Player): void;
    /** GPS route to it (SET_BLIP_ROUTE); false by default. */
    route: boolean;
    /** Colour of its route: clients take the HUD colour nearest to r, g, b (black, the default: the blip's colour; alpha is not used). Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get routeColor(): RGBA;
    set routeColor(value: RGBALike | number);
    /** The drawn size's x (size.x); assigning sets a point or radius blip's size to it. */
    scale: number;
    /** SET_BLIP_SECONDARY_COLOUR with r, g, b (alpha is not used); black by default. Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get secondaryColor(): RGBA;
    set secondaryColor(value: RGBALike | number);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBlipMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBlipMeta, any>): void;
    /** Metadata the server sends to every player who gets the blip (everyone, or only its targets when it is not global), later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the blip changes later (they make it anew and the server does not send it again) and keep none for a blip they do not show (another dimension). Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Short-range blip (SET_BLIP_AS_SHORT_RANGE); true by default. */
    shortRange: boolean;
    /** A cone in the blip's colour (SET_BLIP_SHOW_CONE); false by default. */
    showCone: boolean;
    /** Drawn small at the edge of the minimap (SET_BLIP_AS_MINIMAL_ON_EDGE); false by default. */
    shrinked: boolean;
    /** SET_BLIP_SCALE_2D, which clients apply last: on a point or radius blip scale sets it on both axes; on an area it is the width and height, which set it and which assigning sets. Assigning takes { x, y }; a missing or non-numeric component is 0. */
    get size(): Vector2;
    set size(value: { x: number; y: number });
    /** Icon, as BlipSprite; 1 by default. Truncated to an integer. */
    sprite: number;
    /** The connected players among its targets: while isGlobal is false only they get it. A new array on each read. */
    readonly targets: Player[];
    /** A tick on the blip (SHOW_TICK_ON_BLIP); false by default. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4); the GTA blip type is blipType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** False hides it on clients (SET_BLIP_DISPLAY 0) without removing it; true by default. */
    visible: boolean;
    /** Width (along x) in metres of an area blip (ADD_BLIP_FOR_AREA), 100 for an area made without one; it sets the area's size. Point and radius blips do not use it: undefined until given there, and assigning sends nothing. */
    get width(): number | undefined;
    set width(value: number);
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
    readonly "1": any;
    readonly "11": any;
    readonly "12": any;
    readonly "13": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
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
    readonly "-1": any;
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
    readonly "18": any;
    readonly "19": any;
    readonly "2": any;
    readonly "20": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
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
    /** Creates a checkpoint in dimension 0 that clients draw as GTA's own checkpoint of its type (CREATE_CHECKPOINT); a player entering or leaving it raises `entityEnterColshape`/`entityLeaveColshape`. Defaults: radius 2, height 1, colour 255, 200, 0, 180 (also when the numbers form leaves out r, g, b and a; alpha 255 for a colour without `a`), streaming distance 0, which means any distance. */
    constructor(type: number, pos: Vector3Like, radius?: number, height?: number, color?: RGBALike, streamingDistance?: number);
    constructor(type: number, x: number, y: number, z: number, radius?: number, height?: number, r?: number, g?: number, b?: number, a?: number, streamingDistance?: number);
    /** Every valid checkpoint of every resource; a new array on each read. */
    static readonly all: Checkpoint[];
    /** How many checkpoints Checkpoint.all holds now. */
    static readonly count: number;
    /** The valid checkpoint with that id; null for none. */
    static getByID(id: number): Checkpoint | null;
    /** GTA's checkpoint type, as CheckpointType; 0 by default; truncated to an integer. Clients draw the checkpoint as GTA's own of this type (CREATE_CHECKPOINT); a change makes it again. */
    checkpointType: number;
    /** Colour clients draw it in, RGBA(255, 200, 0, 180) by default. Assigning takes { r, g, b, a }; each component is rounded and kept to 0..255, as clients take it, and a missing alpha is 255. */
    get color(): RGBA;
    set color(value: RGBALike);
    /** ColShapeType.CheckpointCylinder (5). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on every client: true; false when it was not there. No event fires here. streamSyncedMetaChange fires (checkpoint, key, value, old value), as for an entity. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the checkpoint on the server and every client: players inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too); a resource's checkpoints go when it stops. */
    destroy(): void;
    /** Players in this dimension enter it and see it, 0 by default (one in a negative dimension also enters a checkpoint in dimension 0); -2147483648 works in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomCheckpointMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setStreamSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomCheckpointStreamSyncedMeta, K, any>;
    /** The keys setStreamSyncedMeta stored. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Height in metres above pos.z, 1 by default; NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. Only players enter a checkpoint. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within radius of pos on x and y and between pos.z and pos.z + height; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "checkpoint", though a checkpoint is a Colshape too. */
    readonly kind: "checkpoint";
    /** Highest corner of its bounds: pos plus radius on x and y, at pos.z + height. */
    readonly max: Vector3;
    /** Its top, pos.z + height. Assigning moves the top and keeps the bottom: height follows, at least 0; NaN is 0. */
    maxZ: number;
    /** Lowest corner of its bounds: pos minus radius on x and y, at pos.z. */
    readonly min: Vector3;
    /** Its bottom, pos.z. Assigning moves the bottom and keeps the top: height follows (0 when the bottom goes above the top); NaN is 0. */
    minZ: number;
    /** Always true: only players enter a checkpoint (the server tests no other entity). Assigning true does nothing, false throws a RangeError. */
    playersOnly: boolean;
    /** Always []: a checkpoint is a cylinder. */
    readonly points: Vector2[];
    /** Centre of its base. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Radius in metres, 2 by default: a player within it on x and y, between pos.z and pos.z + height, is inside; clients draw it 2 × radius wide. NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomCheckpointMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomCheckpointMeta, any>): void;
    /** Metadata every connected player's client gets (checkpointStreamSyncedMeta and streamSyncedMetaChange there), later ones included, whatever their distance or dimension: the server streams no checkpoints. No event fires here. Throws a TypeError for a key outside 1..256 UTF-8 bytes or a value that cannot be sent. streamSyncedMetaChange fires (checkpoint, key, value, old value), as for an entity. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomCheckpointStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomCheckpointStreamSyncedMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Distance in metres within which clients draw it; 0 (the default) draws it at any distance. Set at creation only; entering does not depend on it. */
    readonly streamingDistance: number;
    /** BaseObjectType.Checkpoint (8); the GTA checkpoint type is checkpointType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** Whether clients draw it, true by default; a hidden checkpoint still reports players entering and leaving. */
    visible: boolean;
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

export const CloudAuthResult: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly NoBenefit: any;
    readonly Success: any;
    readonly VerifyFailed: any;
};

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
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid colshape of every resource and kind (checkpoints are not in it); a new array on each read. */
    static readonly all: Colshape[];
    /** How many colshapes Colshape.all holds now. */
    static readonly count: number;
    /** The valid colshape with that id, of any kind; null for none (a checkpoint's id gives null). */
    static getByID(id: number): Colshape | null;
    /** The shape, as ColShapeType: Sphere 0, Cylinder 1, Circle 2, Cuboid 3 (boxes and cuboids), Rectangle 4, Polygon 6. */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too); a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** A cylinder's height; undefined for every other kind. */
    height: number | undefined;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is inside the shape, as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** "colshape"; "checkpoint" on a checkpoint, which is a Colshape too (entityEnterColshape and entityLeaveColshape name it). */
    readonly kind: "colshape" | "checkpoint";
    /** A box's highest corner (Vector3) or a rectangle's (Vector2); undefined for every other kind. */
    readonly max: Vector3 | Vector2 | undefined;
    /** Highest z of a polygon, 2 by default; other kinds do not use it, and on them assigning sends nothing. Assigning re-sends a colshape that uses it; NaN is 0. */
    maxZ: number;
    /** A box's lowest corner (Vector3) or a rectangle's (Vector2); undefined for every other kind. */
    readonly min: Vector3 | Vector2 | undefined;
    /** Lowest z of a polygon, 0 by default; other kinds do not use it, and on them assigning sends nothing. Assigning re-sends a colshape that uses it; NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** A polygon's corners as Vector2; undefined for every other kind. */
    readonly points: Vector2[] | undefined;
    /** Centre of the shape (the base of a cylinder; z does not count for circles and rectangles; polygons do not use it). Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** The radius of a sphere, cylinder or circle; undefined for every other kind. */
    radius: number | undefined;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeBox {
    /** Creates a box colshape centred at x, y, z with half-sizes `halfX`, `halfY`, `halfZ` (1 by default), in dimension 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x: number, y: number, z: number, halfX?: number, halfY?: number, halfZ?: number);
    /** Every valid box colshape of every resource; a new array on each read. ColshapeBox and ColshapeCuboid are one kind: both list the colshapes either made, and createColshape's with kind 'box'. */
    static readonly all: ColshapeBox[];
    /** How many valid box colshapes there are now (ColshapeBox and ColshapeCuboid alike). */
    static readonly count: number;
    /** The valid box colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeBox | null;
    /** ColShapeType.Cuboid (3), as for every box and cuboid. */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a box: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within the half-extents of pos on every axis, as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** The box's highest corner: pos plus its half-extents. */
    readonly max: Vector3;
    /** Not used by a box: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** The box's lowest corner: pos minus its half-extents. */
    readonly min: Vector3;
    /** Not used by a box: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a box: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the box. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Not used by a box: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeCircle {
    /** Creates a circle colshape of `radius` metres (2 by default) around x, y at any height, in dimension 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x: number, y: number, radius?: number);
    /** Every valid circle colshape of every resource; a new array on each read. */
    static readonly all: ColshapeCircle[];
    /** How many valid circle colshapes there are now. */
    static readonly count: number;
    /** The valid circle colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeCircle | null;
    /** ColShapeType.Circle (2). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a circle: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within radius of pos on x and y (z does not count), as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** pos plus the radius on x and y; z is pos.z: a circle is tested on x and y only. */
    readonly max: Vector3;
    /** Not used by a circle: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** pos minus the radius on x and y; z is pos.z: a circle is tested on x and y only. */
    readonly min: Vector3;
    /** Not used by a circle: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a circle: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the circle; z does not count. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Radius of the circle in metres, 2 by default; only x and y count. Assigning re-sends the colshape; NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeCuboid {
    /** Creates a box colshape between two opposite corners given in any order, in dimension 0; a non-numeric coordinate counts as 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number);
    /** Every valid box colshape of every resource; a new array on each read. ColshapeBox and ColshapeCuboid are one kind: both list the colshapes either made, and createColshape's with kind 'box'. */
    static readonly all: ColshapeCuboid[];
    /** How many valid box colshapes there are now (ColshapeBox and ColshapeCuboid alike). */
    static readonly count: number;
    /** The valid box colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeCuboid | null;
    /** ColShapeType.Cuboid (3), as for every box and cuboid. */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a cuboid: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within the half-extents of pos on every axis, as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** The cuboid's highest corner: pos plus its half-extents. */
    readonly max: Vector3;
    /** Not used by a cuboid: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** The cuboid's lowest corner: pos minus its half-extents. */
    readonly min: Vector3;
    /** Not used by a cuboid: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a cuboid: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the cuboid (made from its two corners). Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Not used by a cuboid: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeCylinder {
    /** Creates a cylinder colshape of `radius` metres around x, y, from z up to z + `height` (both 2 by default), in dimension 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x: number, y: number, z: number, radius?: number, height?: number);
    /** Every valid cylinder colshape of every resource; a new array on each read. */
    static readonly all: ColshapeCylinder[];
    /** How many valid cylinder colshapes there are now. */
    static readonly count: number;
    /** The valid cylinder colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeCylinder | null;
    /** ColShapeType.Cylinder (1). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Height in metres above pos.z: the cylinder reaches from z to z + height; 2 by default. Assigning re-sends the colshape; NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within radius of pos on x and y and between pos.z and pos.z + height, as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** pos plus the radius on x and y, and its top, pos.z + height, on z. */
    readonly max: Vector3;
    /** Not used by a cylinder: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** pos minus the radius on x and y, and its base, pos.z, on z. */
    readonly min: Vector3;
    /** Not used by a cylinder: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a cylinder: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the cylinder's base. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Radius of the cylinder in metres, 2 by default. Assigning re-sends the colshape; NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapePolygon {
    /** Creates a polygon colshape from its corners (objects with x, y, or a flat list x1, y1, x2, y2, …) between heights `minZ` and `maxZ`, in dimension 0; with fewer than 3 corners it contains nothing. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(minZ: number, maxZ: number, points: { x: number; y: number }[]);
    constructor(minZ: number, maxZ: number, points: number[]);
    /** Every valid polygon colshape of every resource; a new array on each read. */
    static readonly all: ColshapePolygon[];
    /** How many valid polygon colshapes there are now. */
    static readonly count: number;
    /** The valid polygon colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapePolygon | null;
    /** ColShapeType.Polygon (6). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a polygon: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is inside the points on x and y and between minZ and maxZ (never with fewer than 3 points), as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** The largest x and y of its points, and maxZ (pos.x and pos.y without points). */
    readonly max: Vector3;
    /** Highest z inside the polygon, 2 by default. Assigning re-sends the colshape; NaN is 0. */
    maxZ: number;
    /** The smallest x and y of its points, and minZ (pos.x and pos.y without points). */
    readonly min: Vector3;
    /** Lowest z inside the polygon, 0 by default. Assigning re-sends the colshape; NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Its points as Vector2 (x, y) in world coordinates; with fewer than 3 it contains nothing. A new array on each read. */
    readonly points: Vector2[];
    /** Not used by a polygon: its points are in world coordinates; (0, 0, 0) unless assigned. Assigning stores it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Not used by a polygon: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeRectangle {
    /** Creates a rectangle colshape between two opposite corners given in any order, at any height, in dimension 0; a non-numeric coordinate counts as 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x1: number, y1: number, x2: number, y2: number);
    /** Every valid rectangle colshape of every resource; a new array on each read. */
    static readonly all: ColshapeRectangle[];
    /** How many valid rectangle colshapes there are now. */
    static readonly count: number;
    /** The valid rectangle colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeRectangle | null;
    /** ColShapeType.Rectangle (4). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a rectangle: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within the half-extents of pos on x and y (z does not count), as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** pos plus its half-extents on x and y; z is pos.z: a rectangle is tested on x and y only. */
    readonly max: Vector3;
    /** Not used by a rectangle: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** pos minus its half-extents on x and y; z is pos.z: a rectangle is tested on x and y only. */
    readonly min: Vector3;
    /** Not used by a rectangle: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a rectangle: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the rectangle; z does not count. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Not used by a rectangle: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class ColshapeSphere {
    /** Creates a sphere colshape of `radius` metres (2 by default) around x, y, z, in dimension 0. The server checks players, vehicles, peds and objects in it and raises `entityEnterColshape`/`entityLeaveColshape`. */
    constructor(x: number, y: number, z: number, radius?: number);
    /** Every valid sphere colshape of every resource; a new array on each read. */
    static readonly all: ColshapeSphere[];
    /** How many valid sphere colshapes there are now. */
    static readonly count: number;
    /** The valid sphere colshape with that id; null for none or for a colshape of another kind. */
    static getByID(id: number): ColshapeSphere | null;
    /** ColShapeType.Sphere (0). */
    readonly colshapeType: number;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the colshape on the server and every client: entities inside get their leave event first, then no more enter or leave events. valid turns false and baseObjectRemove fires; after it its setters and methods change and send nothing. Later calls do nothing, and a resource's colshapes go when it stops. */
    destroy(): void;
    /** Entities in this dimension trigger it, 0 by default (one in a negative dimension also triggers a colshape in dimension 0); -2147483648 makes it react in every dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomColshapeMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Not used by a sphere: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    height: number;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether the entity, or the entity with this id, is inside: what the entityEnterColshape and entityLeaveColshape events delivered so far say, so the answer agrees with them. The server tests about every 150 ms, by the dimension rule and playersOnly. false for null, an entity no longer valid or one never reported. */
    isEntityIn(entity: Player | Vehicle | Ped | Object | NativeVehicle | NativePed | VirtualEntity | number | null): boolean;
    /** Whether its dimension is -2147483648 (every dimension). Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Whether the point is within radius of pos (in 3D), as this host computes it; no dimension check, and a non-finite component counts as 0. */
    isPointIn(point: Vector3Like): boolean;
    /** Always "colshape", for every kind. */
    readonly kind: "colshape";
    /** pos plus the radius on every axis. */
    readonly max: Vector3;
    /** Not used by a sphere: kept to read only, and assigning sends nothing; 2 by default, NaN is 0. */
    maxZ: number;
    /** pos minus the radius on every axis. */
    readonly min: Vector3;
    /** Not used by a sphere: kept to read only, and assigning sends nothing; 0 by default, NaN is 0. */
    minZ: number;
    /** True: only players trigger entityEnterColshape and entityLeaveColshape; false (the default): vehicles, peds and objects too, native ones included. */
    playersOnly: boolean;
    /** Always [] for a sphere: only polygons have points. */
    readonly points: Vector2[];
    /** Centre of the sphere. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Radius of the sphere in metres, 2 by default. Assigning re-sends the colshape; NaN is 0. */
    radius: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomColshapeMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomColshapeMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the colshape changes later: they make it anew and the server does not send it again. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.Colshape (7); the shape is colshapeType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export const ConnectDeniedReason: {
    readonly DEBUG_NOT_ALLOWED: any;
    readonly WRONG_BRANCH: any;
    readonly WRONG_CDN_URL: any;
    readonly WRONG_PASSWORD: any;
    readonly WRONG_VERSION: any;
};

export class ConnectionInfo {
    /** Cannot be constructed: `new` throws a `TypeError`. A connection waiting in the queue comes to `connectionQueueAdd` and `connectionQueueRemove` handlers and from `ConnectionInfo.all` and `ConnectionInfo.getByID(id)`. */
    private constructor();
    /** Every connection that waits in the queue now (server.toml connectionQueue = true); a new array on each read. */
    static readonly all: ConnectionInfo[];
    /** The waiting connection with this id, or null. */
    static getByID(id: number): ConnectionInfo | null;
    /** Lets the client in, in queue order once a player slot is free; sendNames false (true by default) keeps the other players' names from it. Nothing for a connection that left the queue. */
    accept(sendNames?: boolean): void;
    /** The token the client got from the server's early-auth page (useEarlyAuth); empty without one. */
    readonly authToken: string;
    /** The client's release channel. */
    readonly branch: string;
    /** The client's build number. */
    readonly build: number;
    /** Always empty: the client's join request carries no CDN address. */
    readonly cdnUrl: string;
    /** The cloud check of the client's identity, a CloudAuthResult: 0 verified, 1 nothing checked (no cloud auth or no ticket), 2 refused. */
    readonly cloudAuthResult: number;
    /** The account id the client gave for the cloud check; empty without one. */
    readonly cloudID: string;
    /** Refuses the connection: the client is disconnected with the reason (cut to 512 characters, "connection declined" by default). Nothing for a connection that left the queue. */
    decline(reason?: string): void;
    /** Always empty: the client's join request carries no Discord id. */
    readonly discordUserID: string;
    /** Always empty: the client's join request carries no third hardware id. */
    readonly hwid3: string;
    /** Always empty: the client's join request carries only the first hardware hash (hwidHash). */
    readonly hwidExHash: string;
    /** A 64-bit hash of the client's C: volume serial and computer name as decimal text, empty for 0; the client reports it unverified. */
    readonly hwidHash: string;
    /** The connection's id; the player gets the same id once admitted. */
    readonly id: number;
    /** The client's IP address as text. */
    readonly ip: string;
    /** True once accept() was called, and as the server reports it when the connection leaves the queue. */
    readonly isAccepted: boolean;
    /** Always false: the client's join request does not say whether it is a debug build. */
    readonly isDebug: boolean;
    /** The player name the client gave (up to 64 bytes). */
    readonly name: string;
    /** The client's password digest: SHA-256 hex of the password and this connection's transport key, so it differs on every connection; empty without a password. */
    readonly passwordHash: string;
    /** Always empty: the client's join request carries no Social Club name. */
    readonly socialClubName: string;
    /** Always empty: the client's join request carries no Social Club id. */
    readonly socialID: string;
    /** The text the waiting client sees beside its queue position; assigning sends it, cut to 512 characters. Ignored once the connection left the queue. */
    get text(): string;
    set text(value: string);
    /** True while the connection waits in the queue; false once connectionQueueRemove's handlers ran. */
    readonly valid: boolean;
}

export class Entity {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every connected player, then every valid old-path vehicle, ped and object, then native vehicles and NPCs. A new array on each read. A virtual entity is a WorldObject, not an Entity: VirtualEntity.all lists it, and getEntities and the spatial queries still take it. */
    static readonly all: (Player | Vehicle | Ped | Object | NativeVehicle | NativePed)[];
    /** The length of Entity.all: players and entities, no virtual entities. */
    static readonly count: number;
    /** The valid player or old-path vehicle, ped or object of that network id, else the native vehicle or NPC of that script id; null for none, for a virtual entity and for an entity whose destroy() is pending, as Entity.all. */
    static getByID(id: number): Player | Vehicle | Ped | Object | NativeVehicle | NativePed | null;
    /** Players, peds, objects and virtual entities: whether attachTo attached it and it still is, by this host's record: false after detach() and once its parent is gone (the server then detaches it itself). On an old-path vehicle it is the old-path vehicle attached to this one, or null. */
    readonly attached: boolean | Vehicle | null;
    /** The parent attachTo attached it to, of any kind, while it is attached: null before an attach, after detach() and once that parent is gone (the server then detaches it itself). On a blip it is the entity the blip follows, assignable there. */
    readonly attachedTo: Player | Vehicle | Ped | Object | VirtualEntity | null;
    /** Five arguments: GTA's bone index of the parent, offset in metres, rotation in degrees. Seven arguments (told by the third, a bone): rot in radians (turned into degrees), noFixedRotation the opposite of fixedRotation. Bone names, an own bone other than 0 (the root) and a ped parent's bone id other than 0 throw: not supported yet. These, an invalid entity or parent and a native vehicle or NPC as parent throw at the call; the promise rejects only for the server's refusal. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** Whether it collides, by the server's record (true by default). Assigning sends it to the clients that have it; for one that is gone it throws. */
    collision: boolean;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: clients lose it and streamSyncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes; a checkpoint fires no event. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Detaches it and resolves true once the server started the detach; false when it was not attached on the server or is invalid. On true this host's record (attached, attachedTo) clears; rejects when the server does not answer in 5 s. */
    detach(): Promise<boolean>;
    /** The dimension it is in (0 by default); assigning moves it there. Old-path entities take a 32-bit integer (else a RangeError; the fraction is dropped) and lose their owner, a vehicle its occupants too; native ones go through setDimension; blips, markers and colshapes truncate the value. */
    dimension: number;
    /** Whether it is frozen in place, by the server's record (false by default). Assigning sends it to the clients that have it; freezing a ped or object also takes its owner away. */
    frozen: boolean;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setStreamSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomEntitySyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomEntitySyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key, as this host keeps them. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** Its id within its kind: the network id of a player or old-path entity (a removed one's id is reused), the script id of a native vehicle or NPC (from 65536); blips, markers, colshapes, checkpoints and text labels share one counter, voice channels have their own. Ids of different kinds can be equal. */
    readonly id: number;
    /** Its kind by name; native vehicles and NPCs read "vehicle" and "ped". "entity" only while the server has not named an entity's kind yet. */
    readonly kind: "player" | "vehicle" | "ped" | "object" | "virtualEntity" | "blip" | "marker" | "colshape" | "checkpoint" | "textlabel" | "voiceChannel" | "virtualEntityGroup" | "entity";
    /** Its model hash. Assigning a name (hashed) or a hash changes it, and clients that have an old-path entity get it anew with the new model; a bad model throws a TypeError or RangeError. A native vehicle's or NPC's cannot be assigned. */
    get model(): number;
    set model(value: number | string);
    /** On a vehicle, ped or object: true while a script keeps its owner from changing (setNetOwner or resetNetOwner with disableMigration), by the server's record. On a player it means something else and is assignable: the server never makes that player an owner. */
    readonly netOwnershipDisabled: boolean;
    /** Its position. Assigning moves it: a player or old-path entity throws a TypeError for a non-finite component and a RangeError for one beyond 100000 m; a native vehicle is teleported through its owner; a blip, marker or colshape moves at once (non-finite components become 0). A native NPC's cannot be assigned. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Takes its owner away: without disableMigration the ordinary hand-overs give it to a player again, with it the server alone places it. Old-path entities return nothing and read netOwner as null at once (a removed one is ignored); native ones resolve to the outcome. A player (GTA keeps his ped with his own client) and a virtual entity have no owner on the server: nothing is sent. */
    resetNetOwner(disableMigration?: boolean): void | Promise<NativeEntityControlOutcome>;
    /** Its rotation in radians (a marker's and a virtual entity's stay in degrees). Assigning: an old-path entity turns on the server and its clients (non-finite components become 0, the server ignores a component beyond 36000); a player turns to z; a marker takes it at once. A native vehicle's cannot be assigned. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. A copy is stored and a copy read back: arrays and plain objects are copied, a Vector3 or RGBA made anew, an entity or function the same object. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomEntityMeta, any>): void;
    /** Asks the server to make the player its owner; with disableMigration it then stays with that player. An old-path entity returns nothing: netOwner and netOwnershipDisabled change when the server hands it over (netOwnerChange), at once for the player who owns it already, and not at all when the server passes the player over (out of range, another dimension, not spawned, dead). A native one resolves to the outcome. A player and a virtual entity have no owner on the server: nothing is sent. An invalid player throws a TypeError. */
    setNetOwner(player: Player, disableMigration?: boolean): void | Promise<NativeEntityControlOutcome>;
    /** Stream-synced metadata the clients that have it streamed in get (getStreamSyncedMeta there); streamSyncedMetaChange fires here unless the value is the same. Limits as setSyncedMeta (key 1..1024 UTF-8 bytes, value within 512 KiB); a checkpoint takes keys of up to 256 bytes and fires no event. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomEntityStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomEntityStreamSyncedMeta, any>): void;
    /** Synced metadata the clients get with it (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the object is gone only this host's copy changes. A voice channel's or virtual entity group's stays on this host. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntitySyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomEntitySyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomEntitySyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomEntitySyncedMeta, any>): void;
    /** Whether clients may have it at all (true by default). Assigning false takes it from every client and takes away its owner (a vehicle's occupants are put out); true lets clients in range get it again. A virtual entity's cannot be assigned. */
    streamed: boolean;
    /** Metres within which clients get it; 0 (the default) is the server's distance. Assigning is clamped to 0..20000 with the fraction dropped (a native one goes through setStreamingDistance); a virtual entity's and a checkpoint's cannot be assigned. */
    streamingDistance: number;
    /** The server's time in milliseconds (unsigned 32-bit) of the last state the host got for it; 0 until the first one, and a virtual entity's stays 0. */
    readonly timestamp: number;
    /** Its BaseObjectType: Player 0, Vehicle 1, Ped 2, Object 3, Blip 4, VoiceChannel 6, Colshape 7, Checkpoint 8, VirtualEntity 20, VirtualEntityGroup 21, Marker 22, TextLabel 23; -1 while the server has not named an entity's kind. */
    readonly type: number;
    /** False once it is gone: a player left, an old-path entity from its destroy() on (true again if the server refused the removal), a blip, marker, colshape, voice channel or group once destroyed or its resource stopped, a native vehicle or NPC once the server removed it. Once gone every member but valid (and a player's or entity's id) throws "Invalid base object". */
    readonly valid: boolean;
    /** Whether clients show it (true by default), by the server's record; assigning sends it to the clients that have it. Blips, markers and checkpoints take it as one of their options. */
    visible: boolean;
}

export const Event: {
    /** The name of the event anyResourceError. */
    readonly anyResourceError: "anyResourceError";
    /** The name of the event anyResourceStart. */
    readonly anyResourceStart: "anyResourceStart";
    /** The name of the event anyResourceStop. */
    readonly anyResourceStop: "anyResourceStop";
    /** The name of the event baseObjectCreate. */
    readonly baseObjectCreate: "baseObjectCreate";
    /** The name of the event baseObjectRemove. */
    readonly baseObjectRemove: "baseObjectRemove";
    /** The name of the event clientDeleteObject. */
    readonly clientDeleteObject: "clientDeleteObject";
    /** The name of the event clientRequestObject. */
    readonly clientRequestObject: "clientRequestObject";
    /** The name of the event connectionQueueAdd. */
    readonly connectionQueueAdd: "connectionQueueAdd";
    /** The name of the event connectionQueueRemove. */
    readonly connectionQueueRemove: "connectionQueueRemove";
    /** The name of the event consoleCommand. */
    readonly consoleCommand: "consoleCommand";
    /** The name of the event entityCreating. */
    readonly entityCreating: "entityCreating";
    /** The name of the event entityEnterColshape. */
    readonly entityEnterColshape: "entityEnterColshape";
    /** The name of the event entityLeaveColshape. */
    readonly entityLeaveColshape: "entityLeaveColshape";
    /** The name of the event entityModelMissing. */
    readonly entityModelMissing: "entityModelMissing";
    /** The name of the event entityStreamIn. */
    readonly entityStreamIn: "entityStreamIn";
    /** The name of the event entityStreamOut. */
    readonly entityStreamOut: "entityStreamOut";
    /** The name of the event explosion. */
    readonly explosion: "explosion";
    /** The name of the event givePedScriptedTask. */
    readonly givePedScriptedTask: "givePedScriptedTask";
    /** The name of the event globalMetaChange. */
    readonly globalMetaChange: "globalMetaChange";
    /** The name of the event globalSyncedMetaChange. */
    readonly globalSyncedMetaChange: "globalSyncedMetaChange";
    /** The name of the event localMetaChange. */
    readonly localMetaChange: "localMetaChange";
    /** The name of the event metaChange. */
    readonly metaChange: "metaChange";
    /** The name of the event nativeVehicleCreated. */
    readonly nativeVehicleCreated: "nativeVehicleCreated";
    /** The name of the event nativeVehicleOwnerChanged. */
    readonly nativeVehicleOwnerChanged: "nativeVehicleOwnerChanged";
    /** The name of the event nativeVehicleRemoved. */
    readonly nativeVehicleRemoved: "nativeVehicleRemoved";
    /** The name of the event netOwnerChange. */
    readonly netOwnerChange: "netOwnerChange";
    /** The name of the event pedDamage. */
    readonly pedDamage: "pedDamage";
    /** The name of the event pedDeath. */
    readonly pedDeath: "pedDeath";
    /** The name of the event pedHeal. */
    readonly pedHeal: "pedHeal";
    /** The name of the event playerAnimationChange. */
    readonly playerAnimationChange: "playerAnimationChange";
    /** The name of the event playerChangedNativeVehicleSeat. */
    readonly playerChangedNativeVehicleSeat: "playerChangedNativeVehicleSeat";
    /** The name of the event playerChangedVehicleSeat. */
    readonly playerChangedVehicleSeat: "playerChangedVehicleSeat";
    /** The name of the event playerChangeVehicleSeat. */
    readonly playerChangeVehicleSeat: "playerChangeVehicleSeat";
    /** The name of the event playerConnect. */
    readonly playerConnect: "playerConnect";
    /** The name of the event playerConnectDenied. */
    readonly playerConnectDenied: "playerConnectDenied";
    /** The name of the event playerDamage. */
    readonly playerDamage: "playerDamage";
    /** The name of the event playerDeath. */
    readonly playerDeath: "playerDeath";
    /** The name of the event playerDimensionChange. */
    readonly playerDimensionChange: "playerDimensionChange";
    /** The name of the event playerDisconnect. */
    readonly playerDisconnect: "playerDisconnect";
    /** The name of the event playerEnteredNativeVehicle. */
    readonly playerEnteredNativeVehicle: "playerEnteredNativeVehicle";
    /** The name of the event playerEnteredVehicle. */
    readonly playerEnteredVehicle: "playerEnteredVehicle";
    /** The name of the event playerEnteringVehicle. */
    readonly playerEnteringVehicle: "playerEnteringVehicle";
    /** The name of the event playerEnterVehicle. */
    readonly playerEnterVehicle: "playerEnterVehicle";
    /** The name of the event playerHeal. */
    readonly playerHeal: "playerHeal";
    /** The name of the event playerInteriorChange. */
    readonly playerInteriorChange: "playerInteriorChange";
    /** The name of the event playerLeaveVehicle. */
    readonly playerLeaveVehicle: "playerLeaveVehicle";
    /** The name of the event playerLeftNativeVehicle. */
    readonly playerLeftNativeVehicle: "playerLeftNativeVehicle";
    /** The name of the event playerLeftVehicle. */
    readonly playerLeftVehicle: "playerLeftVehicle";
    /** The name of the event playerReady. */
    readonly playerReady: "playerReady";
    /** The name of the event playerRequestControl. */
    readonly playerRequestControl: "playerRequestControl";
    /** The name of the event playerSpawn. */
    readonly playerSpawn: "playerSpawn";
    /** The name of the event playerWeaponChange. */
    readonly playerWeaponChange: "playerWeaponChange";
    /** The name of the event removeEntity. */
    readonly removeEntity: "removeEntity";
    /** The name of the event requestSyncedScene. */
    readonly requestSyncedScene: "requestSyncedScene";
    /** The name of the event resourceError. */
    readonly resourceError: "resourceError";
    /** The name of the event resourceStart. */
    readonly resourceStart: "resourceStart";
    /** The name of the event resourceStop. */
    readonly resourceStop: "resourceStop";
    /** The name of the event serverStarted. */
    readonly serverStarted: "serverStarted";
    /** The name of the event startFire. */
    readonly startFire: "startFire";
    /** The name of the event startProjectile. */
    readonly startProjectile: "startProjectile";
    /** The name of the event startSyncedScene. */
    readonly startSyncedScene: "startSyncedScene";
    /** The name of the event stopSyncedScene. */
    readonly stopSyncedScene: "stopSyncedScene";
    /** The name of the event streamSyncedMetaChange. */
    readonly streamSyncedMetaChange: "streamSyncedMetaChange";
    /** The name of the event syncedMetaChange. */
    readonly syncedMetaChange: "syncedMetaChange";
    /** The name of the event updateSyncedScene. */
    readonly updateSyncedScene: "updateSyncedScene";
    /** The name of the event vehicleAttach. */
    readonly vehicleAttach: "vehicleAttach";
    /** The name of the event vehicleDamage. */
    readonly vehicleDamage: "vehicleDamage";
    /** The name of the event vehicleDestroy. */
    readonly vehicleDestroy: "vehicleDestroy";
    /** The name of the event vehicleDetach. */
    readonly vehicleDetach: "vehicleDetach";
    /** The name of the event vehicleHorn. */
    readonly vehicleHorn: "vehicleHorn";
    /** The name of the event vehicleSiren. */
    readonly vehicleSiren: "vehicleSiren";
    /** The name of the event voiceConnection. */
    readonly voiceConnection: "voiceConnection";
    /** The name of the event weaponDamage. */
    readonly weaponDamage: "weaponDamage";
};

export const ExplosionType: {
    readonly Barrel: any;
    readonly Bike: any;
    readonly Blimp: any;
    readonly Boat: any;
    readonly Bullet: any;
    readonly BzGas: any;
    readonly Car: any;
    readonly DirFlame: any;
    readonly DirFlameExplode: any;
    readonly DirGasCanister: any;
    readonly DirSteam: any;
    readonly DirWaterHydrant: any;
    readonly Extinguisher: any;
    readonly Firework: any;
    readonly Flare: any;
    readonly GasCanister: any;
    readonly GasTank: any;
    readonly Grenade: any;
    readonly GrenadeLauncher: any;
    readonly HiOctane: any;
    readonly Molotov: any;
    readonly PetrolPump: any;
    readonly Plane: any;
    readonly PlaneRocket: any;
    readonly ProgrammableAr: any;
    readonly Propane: any;
    readonly ProxMine: any;
    readonly Rocket: any;
    readonly ShipDestroy: any;
    readonly SmokeGrenade: any;
    readonly SmokeGrenadeLauncher: any;
    readonly Snowball: any;
    readonly StickyBomb: any;
    readonly Tanker: any;
    readonly TankShell: any;
    readonly Train: any;
    readonly Truck: any;
    readonly Unknown: any;
    readonly ValkyrieCannon: any;
    readonly VehicleBullet: any;
};

export const File: {
    /** Whether a file or folder exists at the path, relative to this resource's folder. Throws outside a resource's code and for a path that leads out of the resource's folder. */
    exists(filename: string): boolean;
    /** Reads a file of this resource: text as UTF-8 (default), "utf-16" as UTF-16 LE, "binary" as an ArrayBuffer; names ignore case, any other reads UTF-8. Throws for a missing file, outside a resource's code and for a path out of the resource's folder. */
    read(filename: string, encoding: "binary"): ArrayBuffer;
    read(filename: string, encoding?: "utf-8" | "utf-16"): string;
};

export const FileEncoding: {
    readonly Binary: any;
    readonly Utf16: any;
    readonly Utf8: any;
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
    readonly "1": any;
    readonly "100": any;
    readonly "101": any;
    readonly "102": any;
    readonly "103": any;
    readonly "104": any;
    readonly "105": any;
    readonly "106": any;
    readonly "107": any;
    readonly "109": any;
    readonly "110": any;
    readonly "111": any;
    readonly "112": any;
    readonly "113": any;
    readonly "114": any;
    readonly "115": any;
    readonly "116": any;
    readonly "117": any;
    readonly "118": any;
    readonly "119": any;
    readonly "12": any;
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
    readonly "16": any;
    readonly "17": any;
    readonly "18": any;
    readonly "186": any;
    readonly "187": any;
    readonly "188": any;
    readonly "189": any;
    readonly "190": any;
    readonly "191": any;
    readonly "192": any;
    readonly "2": any;
    readonly "20": any;
    readonly "219": any;
    readonly "220": any;
    readonly "221": any;
    readonly "222": any;
    readonly "27": any;
    readonly "32": any;
    readonly "33": any;
    readonly "34": any;
    readonly "35": any;
    readonly "36": any;
    readonly "37": any;
    readonly "38": any;
    readonly "39": any;
    readonly "4": any;
    readonly "40": any;
    readonly "45": any;
    readonly "46": any;
    readonly "48": any;
    readonly "49": any;
    readonly "50": any;
    readonly "51": any;
    readonly "52": any;
    readonly "53": any;
    readonly "54": any;
    readonly "55": any;
    readonly "56": any;
    readonly "57": any;
    readonly "65": any;
    readonly "66": any;
    readonly "67": any;
    readonly "68": any;
    readonly "69": any;
    readonly "70": any;
    readonly "71": any;
    readonly "72": any;
    readonly "73": any;
    readonly "74": any;
    readonly "75": any;
    readonly "76": any;
    readonly "77": any;
    readonly "78": any;
    readonly "79": any;
    readonly "8": any;
    readonly "80": any;
    readonly "81": any;
    readonly "82": any;
    readonly "83": any;
    readonly "84": any;
    readonly "85": any;
    readonly "86": any;
    readonly "87": any;
    readonly "88": any;
    readonly "89": any;
    readonly "9": any;
    readonly "90": any;
    readonly "96": any;
    readonly "97": any;
    readonly "98": any;
    readonly "99": any;
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
    readonly F13: any;
    readonly F14: any;
    readonly F15: any;
    readonly F16: any;
    readonly F17: any;
    readonly F18: any;
    readonly F19: any;
    readonly F2: any;
    readonly F20: any;
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

export class Marker {
    /** Creates a marker that every player in dimension 0 sees, with scale 1 and no rotation. Without `color` it is 255, 255, 255, 120; a colour without `a` gets alpha 255. Clients draw it within `streamingDistance` metres of their player: 300 by default, 0 for any distance. */
    constructor(type: number, position: Vector3Like, color?: RGBALike, streamingDistance?: number);
    /** Every valid marker of every resource; a new array on each read. */
    static readonly all: Marker[];
    /** How many markers Marker.all holds now. */
    static readonly count: number;
    /** The valid marker with that id; null for none. */
    static getByID(id: number): Marker | null;
    /** Colour, RGBA(255, 255, 255, 120) by default. Assigning takes { r, g, b, a }; each component is rounded and kept to 0..255, as clients take it, and a missing alpha is 255. */
    get color(): RGBA;
    set color(value: RGBALike);
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the marker from every client and from Marker.all; valid turns false and baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too); a resource's markers go when it stops. */
    destroy(): void;
    /** Clients draw it for players whose dimension sees it: in this dimension, 0 by default; in every one at -2147483648; and at 0 also for players in a negative dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** Direction passed to DRAW_MARKER, (0, 0, 0) by default; a non-finite component becomes 0. */
    get dir(): Vector3;
    set dir(value: Vector3Like);
    /** Turns to face the camera (DRAW_MARKER); false by default. */
    faceCamera: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** True when it has no target: every player gets it (clients draw it in its dimension). It cannot be changed after creation. */
    isGlobal: boolean;
    /** Always "marker". */
    readonly kind: "marker";
    /** GTA's marker type for DRAW_MARKER, as MarkerType; 1 by default. Truncated to an integer. */
    markerType: number;
    /** Where it is drawn. Assigning moves it for every player who gets it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Rotation in degrees passed to DRAW_MARKER, (0, 0, 0) by default; a non-finite component becomes 0. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** Size on x, y and z (DRAW_MARKER), (1, 1, 1) by default; a number given at creation sets all three, a number assigned later gives (0, 0, 0). A non-finite component becomes 0. */
    get scale(): Vector3;
    set scale(value: Vector3Like);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Metadata the server sends to every player who gets the marker (everyone, or only its target), later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Distance in metres from a player within which his client draws it: 300 by default, 0 for any distance. Set at creation only (the streamingDistance option, the constructor's fourth argument); a negative or non-numeric one gives 300. A client draws at most 96 of the server's markers in a frame: when more are in range, the nearest to its player. */
    readonly streamingDistance: number;
    /** The player who alone gets it (the target option at creation), kept as that player: null for a marker every player gets, or once he left. When he leaves nobody gets the marker any more, not the next player with his id; a target not connected at creation gives a marker nobody gets. */
    readonly target: Player | null;
    /** BaseObjectType.Marker (22); the marker's own type is markerType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** Whether clients draw it; true by default. */
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

export const ModelType: {
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
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
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

export class NativePed {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every NPC createNativePed made, by any resource, that this host still holds as valid; a new array on each read (getNativePeds returns the same). */
    static readonly all: NativePed[];
    /** How many NPCs NativePed.all holds now. */
    static readonly count: number;
    /** The NPC of that script id (NativePed#id); null for none or one no longer valid. Ped.getByID and BaseObject.getByID find it too. */
    static getByID(id: number): NativePed | null;
    /** GET_PED_ARMOUR, as health. Assigning sends SET_PED_ARMOUR to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    armour: number | null;
    /** CLEAR_PED_TASKS on its owner; CLEAR_PED_TASKS_IMMEDIATELY with `immediately`. */
    clearTasks(immediately?: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Whether it collides, from its owner's script game state node; true before it came. Assigning sends SET_ENTITY_COLLISION to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    collision: boolean;
    /** The hash of the weapon in its hands, unsigned, from its owner's game state node (GET_SELECTED_PED_WEAPON); 0 before the node came. Assigning sends GIVE_WEAPON_TO_PED (when it has none) and SET_CURRENT_PED_WEAPON; a name is hashed to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    currentWeapon: number;
    /** Removes the key from this host's own metadata of it: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: the clients whose GTA has it lose it and streamSyncedMetaChange fires with the value undefined; false when the key was not there. Once the NPC is no longer valid, only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: the clients whose GTA has it lose it and syncedMetaChange fires with the value undefined; false when the key was not there. Once the NPC is no longer valid, only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone, as destroyNativePed (DELETE_ENTITY); valid is false from the call on. True once it is gone (baseObjectRemove fires); false when it is gone or its owner's client did not negotiate owner migration. */
    destroy(): Promise<boolean>;
    /** Assigning moves it (setDimension) and reads back at once; a refusal puts the old value back. fetch() reads the server's value. */
    dimension: number;
    /** The server's current reading of it; null once it is gone (it is then no longer valid). */
    fetch(): Promise<NativePed | null>;
    /** Whether its position is frozen, from its owner's script game state node. Assigning sends FREEZE_ENTITY_POSITION to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    frozen: boolean;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata of it, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityMeta, K, any>;
    /** The keys of this host's own metadata of it (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata of it (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setStreamSyncedMeta stored under the key, as this host keeps it (not read back from a client); undefined for none. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as this host keeps it (not read back from a client); undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPedSyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPedSyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata of it (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** Degrees, 0..360 (GET_ENTITY_HEADING), as fetch() last read it. */
    readonly heading: number;
    /** Its health as fetch() last read it from its owner's tree (GET_ENTITY_HEALTH); while it waits, as its last owner left it; null before the server read its health node. Assigning sends SET_ENTITY_HEALTH to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    health: number | null;
    /** Its script id, of the native range (from 65536, shared with NativeVehicle; never a legacy entity's id): unique while the server runs. Ped.getByID and BaseObject.getByID find it. */
    readonly id: number;
    /** GTA's own death state (dying or dead) from its owner's tree, as fetch() last read it; null before it was read. */
    readonly isDead: boolean | null;
    /** Always "ped", as for any Ped. */
    readonly kind: "ped";
    /** GET_ENTITY_MAX_HEALTH, as health. Assigning sends SET_PED_MAX_HEALTH to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    maxHealth: number | null;
    /** Its model hash as an unsigned 32-bit number: what createNativePed was given, a name hashed as varion.hash. */
    readonly model: number;
    /** Its GTA network object id, as the server last mirrored it (a changed record every 100 ms at most) or fetch() read it; 0 while it waits for an owner. */
    readonly netId: number;
    /** Another name for owner. */
    readonly netOwner: Player | null;
    /** True while a script keeps it with its owner (setNetOwner or resetNetOwner with disableMigration). */
    readonly netOwnershipDisabled: boolean;
    /** The player whose client simulates it, as fetch() last read it; null while it waits. */
    readonly owner: Player | null;
    /** TASK_PLAY_ANIM on its owner, which loads the dictionary first ("refused" for one GTA does not have). Names: 1-64 printable ASCII characters without spaces. */
    playAnim(dict: string, name: string, blendInSpeed?: number, blendOutSpeed?: number, duration?: number, flag?: number, playbackRate?: number, lockX?: boolean, lockY?: boolean, lockZ?: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Where its owner's tree puts it (GET_ENTITY_COORDS), as fetch() last read it. Assigning a finite place within 100000 of the origin (else a RangeError) moves it through its owner (SET_ENTITY_COORDS, as setPosition without a heading) and reads back at once, until the owner's next report. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** The ordinary hand-overs again, or with disableMigration its current owner kept. */
    resetNetOwner(disableMigration?: boolean): Promise<NativeEntityControlOutcome>;
    /** The size clients draw the NPC at: 1 is GTA's own, from 0.1 to 10. Assigning sends it to every client that has the NPC, and to the ones that get it later; a value out of the range throws a RangeError. Only the drawing changes: its collision body stays as at size 1, and its position reads the same. */
    scale: number;
    /** Moves it to a dimension: the players that can see that dimension get it, the others lose it, and its owner hands it to one of them that holds it. One the server made whose owner cannot see that dimension starts over there at once: its owner lets it go and it waits there for an owner with its state (a new netId). A client's car stays with its owner until a player there holds it. */
    setDimension(dimension: number): Promise<NativeEntityControlOutcome>;
    /** SET_PED_INTO_VEHICLE on its owner, into a native vehicle (or the one of that network id); seat -1 is the driver's, -2 any free one. */
    setIntoVehicle(vehicle: NativeVehicle | number, seat?: number): Promise<NativeVehicleCommandOutcome>;
    /** This host's own metadata of it: no client sees it; metaChange fires on a change. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomEntityMeta, any>): void;
    /** Hands it to the player: the player takes it over once its GTA holds it (its CREATE acknowledged, 1.5 s), as a hand-over, whether its owner still sees it or not; with disableMigration it keeps it then. "not-native": that player is not on the native path; "refused": its client cannot own it; "waiting": one the server made has no owner yet. */
    setNetOwner(player: Player, disableMigration?: boolean): Promise<NativeEntityControlOutcome>;
    /** SET_ENTITY_COORDS on its owner, then SET_ENTITY_HEADING when a heading (degrees) is given. */
    setPosition(pos: Vector3Like, heading?: number): Promise<NativeVehicleCommandOutcome>;
    /** Sets streamed; "waiting" for one the server made that has no owner yet. */
    setStreamed(streamed: boolean): Promise<NativeEntityControlOutcome>;
    /** Sets streamingDistance; one the server made keeps it for each of its lifetimes. */
    setStreamingDistance(distance: number): Promise<NativeEntityControlOutcome>;
    /** Stream-synced metadata: the clients whose GTA has it now read it (getStreamSyncedMeta, streamSyncedMetaChange there). */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomPedStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomPedStreamSyncedMeta, any>): void;
    /** Synced metadata: every client whose GTA has it reads it (getSyncedMeta, syncedMetaChange there), one that gets it later gets it with it; the getters here read the scripts' own values. Throws for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPedSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomPedSyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPedSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomPedSyncedMeta, any>): void;
    /** Whether players other than its owner get it; true by default. Assigning false takes it from every player but its owner, whose GTA simulates it, until it is true again. */
    streamed: boolean;
    /** Metres within which players see it, in place of the server's; 0 is the server's. Assigning sends it (0..20000, as the legacy entities'). */
    streamingDistance: number;
    /** TASK_GO_STRAIGHT_TO_COORD on its owner: speed 1 walks, 2 runs, 3 sprints; timeout in ms (-1 none); heading 40000 keeps the one the walk ends with. */
    taskGoStraightToCoord(pos: Vector3Like, speed?: number, timeout?: number, heading?: number, slide?: number): Promise<NativeVehicleCommandOutcome>;
    /** TASK_GO_TO_COORD_ANY_MEANS on its owner. */
    taskGoToCoordAnyMeans(pos: Vector3Like, speed?: number, p5?: number, p6?: boolean, walkingStyle?: number, p8?: number): Promise<NativeVehicleCommandOutcome>;
    /** TASK_WANDER_STANDARD on its owner; GTA's own scripts pass 10 and 10. Not an RPC native. */
    taskWanderStandard(p1?: number, p2?: number): Promise<NativeVehicleCommandOutcome>;
    /** When its owner captured the last update the server accepted, in the server's clock (ms), as of the last record the host got; 0 before one. */
    readonly timestamp: number;
    /** BaseObjectType.Ped (2), as any Ped. */
    readonly type: number;
    /** False once destroyed, or once fetch() found it gone. */
    readonly valid: boolean;
    /** Whether it is visible, from its owner's physical game state node; true before it came. Assigning sends SET_ENTITY_VISIBLE to its owner; the getter returns the value set until its node shows it (at most 3 s). */
    visible: boolean;
    /** No owner yet, or one whose client has not synced it yet: its tasks are queued until then. */
    readonly waiting: boolean;
}

export class NativeVehicle {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every native vehicle the host mirrors and holds as valid, a client script's car and a train carriage too; a new array on each read (getNativeVehicles returns the same). */
    static readonly all: NativeVehicle[];
    /** How many native vehicles NativeVehicle.all holds now. */
    static readonly count: number;
    /** The native vehicle of that script id (NativeVehicle#id); null for none or one that is gone. Vehicle.getByID and BaseObject.getByID find it too. */
    static getByID(id: number): NativeVehicle | null;
    /** By its GTA network object id (what a client script sees); null for none. */
    static getByNetId(netId: number): NativeVehicle | null;
    /** The native vehicle attached to it, from that vehicle's attach node; null for none. */
    readonly attached: NativeVehicle | null;
    /** The native vehicle it is attached to (a trailer to its truck, a car to a cargobob), from its owner's attach node; null for none. vehicleAttach and vehicleDetach tell the change. */
    readonly attachedTo: NativeVehicle | null;
    /** GET_VEHICLE_BODY_HEALTH, as engineHealth: the body health GTA syncs. GTA's health node carries what SET_VEHICLE_BODY_HEALTH set, not what a crash took off (bench 10.11: after a crash the owner's GTA read 956, its node 1000), so collision damage shows in engineHealth and petrolTankHealth only -- as every other client's copy shows it. Assigning (clamped to -4000..10000) sends SET_VEHICLE_BODY_HEALTH to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    bodyHealth: number;
    /** SET_VEHICLE_DOOR_BROKEN on its owner; `remove` takes the door away. */
    breakDoor(door: number, remove?: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Whether it collides, from its owner's script game state node; true before it came. Assigning sends SET_ENTITY_COLLISION to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    collision: boolean;
    /** GET_VEHICLE_CUSTOM_PRIMARY_COLOUR; null while it has none. Assigning null clears it. */
    get customPrimaryColor(): RGBA | null;
    set customPrimaryColor(value: RGBALike | null);
    /** GET_VEHICLE_CUSTOM_SECONDARY_COLOUR from its owner's appearance node, alpha 255; null while it has none. Assigning {r, g, b} (whole numbers 0..255, else a RangeError; alpha is not used) sends SET_VEHICLE_CUSTOM_SECONDARY_COLOUR to its owner, and null clears it. */
    get customSecondaryColor(): RGBA | null;
    set customSecondaryColor(value: RGBALike | null);
    /** SET_VEHICLE_ENVEFF_SCALE's scale 0..255 from its owner's appearance node (rust, snow on some models); 0 before the node came. Assigning (clamped to 0..255, truncated) sends SET_VEHICLE_ENVEFF_SCALE to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    darkness: number;
    /** Removes the key from this host's own metadata of it: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: the clients whose GTA has it lose it and streamSyncedMetaChange fires with the value undefined; false when the key was not there. Once the vehicle is gone, only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: the clients whose GTA has it lose it and syncedMetaChange fires with the value undefined; false when the key was not there. Once the vehicle is gone, only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone, a client script's car too, as destroyNativeVehicle (DELETE_ENTITY); valid is false from the call on. True once the server removed it; false (and valid again) when it is gone, its owner's client did not negotiate owner migration, or it is a train carriage behind its engine. */
    destroy(): Promise<boolean>;
    /** Assigning moves it (setDimension) and reads back at once; a refusal puts the old value back. */
    dimension: number;
    /** The dirt level its owner's appearance node carries (GET_VEHICLE_DIRT_LEVEL, a whole number); 0 until the server read it. Assigning a whole number 0..15 (else a RangeError) sends SET_VEHICLE_DIRT_LEVEL to its owner. */
    dirtLevel: number;
    /** Another name of getWheelHasTire: false once wheel 0..7 runs on its rim, from its owner's health node. */
    doesWheelHasTire(wheelId: number): boolean;
    /** The player in seat 1 by its occupants as the server last mirrored them; null when no player drives. */
    readonly driver: Player | null;
    /** Its owner's health node, as GET_VEHICLE_ENGINE_HEALTH: 1000 undamaged (also before the node came), below 0 on fire. Assigning (clamped to -4000..10000) sends SET_VEHICLE_ENGINE_HEALTH to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    engineHealth: number;
    /** GET_IS_VEHICLE_ENGINE_RUNNING. Assigning is SET_VEHICLE_ENGINE_ON(value, instantly, disableAutoStart) on its owner. */
    engineOn: boolean;
    /** Whether its position is frozen, from its owner's script game state node (FREEZE_ENTITY_POSITION). Assigning sends FREEZE_ENTITY_POSITION to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    frozen: boolean;
    /** Its appearance values as the legacy vehicle writes them (base64 of the varion.vehicle-state JSON), read through this vehicle's own getters; a value it has no getter for is left out. */
    getAppearanceDataBase64(): string;
    /** Armoured window 0..7's health from its owner's damage status node (CVehicleDamageStatusDataNode): 100 whole (also without armoured windows). Setting it keeps the value on the server, which it returns from then on: GTA has no native for it, so the car in the game does not change. */
    getArmoredWindowHealth(windowId: number): number;
    /** The hits armoured window 0..7 took, from its owner's damage status node (CVehicleDamageStatusDataNode). */
    getArmoredWindowShootCount(windowId: number): number;
    /** VehicleBumperDamage of bumper 0 (front) or 1 (rear) from its owner's damage status node (CVehicleDamageStatusDataNode). */
    getBumperDamageLevel(bumperId: number): number;
    /** Its damage values as the legacy vehicle writes them (base64 of the varion.vehicle-state JSON), read through this vehicle's own getters; a value it has no getter for is left out. */
    getDamageStatusBase64(): string;
    /** 0 closed, otherwise how far open, from its game state node (GET_VEHICLE_DOOR_STATUS); doors 0..6. */
    getDoorState(door: number): number;
    /** IS_VEHICLE_EXTRA_TURNED_ON. */
    getExtra(extraId: number): boolean;
    /** Its gamestate values as the legacy vehicle writes them (base64 of the varion.vehicle-state JSON), read through this vehicle's own getters; a value it has no getter for is left out. */
    getGamestateDataBase64(): string;
    /** Its health values as the legacy vehicle writes them (base64 of the varion.vehicle-state JSON), read through this vehicle's own getters; a value it has no getter for is left out. Wheels: as many as its model has (8 for a model the catalog does not know). */
    getHealthDataBase64(): string;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata of it, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleMeta, K, any>;
    /** The keys of this host's own metadata of it (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata of it (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The bullet holes in part 0..5 (VehiclePart) from its owner's damage status node (CVehicleDamageStatusDataNode). */
    getPartBulletHoles(partId: number): number;
    /** VehiclePartDamage 0..3 of part 0..5 (VehiclePart) from its owner's damage status node (CVehicleDamageStatusDataNode). */
    getPartDamageLevel(partId: number): number;
    /** Its script values as the legacy vehicle writes them (base64 of the varion.vehicle-state JSON), read through this vehicle's own getters; a value it has no getter for is left out. */
    getScriptDataBase64(): string;
    /** The value setStreamSyncedMeta stored under the key, as this host keeps it (not read back from a client); undefined for none. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as this host keeps it (not read back from a client); undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleSyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomVehicleSyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** The ammo a script allowed vehicle weapon 0..15 (-1 unlimited, the default). */
    getWeaponCapacity(weaponIndex: number): number;
    /** What a script set for wheel 0..7 (setWheelCamber); 0 before. GTA's sync tree does not carry it. */
    getWheelCamber(wheel: number): number;
    /** False once wheel 0..7 runs on its rim, from its owner's health node. */
    getWheelHasTire(wheelId: number): boolean;
    /** What a script set for wheel 0..7 (setWheelHealth); 1000 before. GTA's sync tree does not carry it. */
    getWheelHealth(wheel: number): number;
    /** What a script set for wheel 0..7 (setWheelHeight); 0 before. GTA's sync tree does not carry it. */
    getWheelHeight(wheel: number): number;
    /** What a script set for wheel 0..7 (setWheelRimRadius); 0 before. GTA's sync tree does not carry it. */
    getWheelRimRadius(wheel: number): number;
    /** What a script set for wheel 0..7 (setWheelTrackWidth); 0 before. GTA's sync tree does not carry it. */
    getWheelTrackWidth(wheel: number): number;
    /** What a script set for wheel 0..7 (setWheelTyreRadius); 0 before. GTA's sync tree does not carry it. */
    getWheelTyreRadius(wheel: number): number;
    /** What a script set for wheel 0..7 (setWheelTyreWidth); 0 before. GTA's sync tree does not carry it. */
    getWheelTyreWidth(wheel: number): number;
    /** Whether its owner's damage status node (CVehicleDamageStatusDataNode) carries armoured windows. */
    readonly hasArmoredWindows: boolean;
    /** Whether this host's own metadata of it (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** True after setTimedExplosion(true, ...) until it is set false (the server's record). */
    readonly hasTimedExplosion: boolean;
    /** Degrees, 0..360. */
    readonly heading: number;
    /** Whether its high beams are on, from its owner's game state node (GET_VEHICLE_LIGHTS_STATE's highbeamsOn). */
    readonly highbeamsOn: boolean;
    /** Its script id, of the native range (from 65536, shared with NativePed; never a legacy entity's id): unique while the server runs. Vehicle.getByID and BaseObject.getByID find it. */
    readonly id: number;
    /** Its turn indicators: 0 off, 1 left, 2 right, 3 both (hazard lights). Not in GTA's sync trees: the server holds what its owner's client reports (its driver, a client script, GTA's driving task) and sets it on every copy; assigning does that at once, the owner's car included -- a car the server made takes it once it has an owner. Anything but 0..3 throws a RangeError. */
    indicatorLights: number;
    /** Whether light 0..21 (GTA's 22) is broken, from its owner's damage status node (CVehicleDamageStatusDataNode); another index throws a RangeError. */
    isLightDamaged(lightId: number): boolean;
    /** Whether its train is a script's (CREATE_MISSION_TRAIN). From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    isMissionTrain: boolean;
    /** True while it has a custom primary colour (customPrimaryColor is not null), as its owner's appearance node says. */
    readonly isPrimaryColorRGB: boolean;
    /** True while it has a custom secondary colour (customSecondaryColor is not null), as its owner's appearance node says. */
    readonly isSecondaryColorRGB: boolean;
    /** Whether siren light 0..19 is broken, from its owner's damage status node (CVehicleDamageStatusDataNode). */
    isSpecialLightDamaged(specialLightId: number): boolean;
    /** Whether it is its train's last carriage. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    isTrainCaboose: boolean;
    /** Whether it is its train's engine. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    isTrainEngine: boolean;
    /** Whether wheel 0..7's tyre is burst, from its owner's health node. */
    isWheelBurst(wheelId: number): boolean;
    /** Whether wheel 0..7 is off: setWheelDetached broke it off, or its owner's health node says GTA lost it (a crash too). */
    isWheelDetached(wheelId: number): boolean;
    /** The server's record of setWheelOnFire for wheel 0..7. */
    isWheelOnFire(wheelId: number): boolean;
    /** Whether window 0..7 is smashed, from its owner's damage status node (CVehicleDamageStatusDataNode). */
    isWindowDamaged(windowId: number): boolean;
    /** Whether a script rolled window 0..7 down (setWindowOpened); the sync tree does not carry it. */
    isWindowOpened(windowId: number): boolean;
    /** Always "vehicle", as for any Vehicle. */
    readonly kind: "vehicle";
    /** -1 without one. */
    livery: number;
    /** VehicleLockState (GET_VEHICLE_DOOR_LOCK_STATUS). */
    lockState: number;
    /** Model hash; 0 until the server read it. */
    readonly model: number;
    /** The kit field of its owner's appearance node: 0 without a kit, else 1..3, not the index SET_VEHICLE_MOD_KIT was given. Assigning a whole number 0..255 (else a RangeError) sends SET_VEHICLE_MOD_KIT to its owner; setMod needs a kit. */
    modKit: number;
    /** Which neon sides are on, from its owner's appearance node, a new object on each read. Assigning sends SET_VEHICLE_NEON_ENABLED for each side (a side left out is off) to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    neon: { left: boolean; right: boolean; front: boolean; back: boolean };
    /** Its neon colour from its owner's appearance node, alpha 255; GTA's default 255, 0, 255 before the node came. Assigning sends SET_VEHICLE_NEON_COLOUR ({r, g, b}) to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    neonColor: RGBA;
    /** Its GTA network object id; 0 while a car the server made waits for an owner. */
    readonly netId: number;
    /** Another name for owner. */
    readonly netOwner: Player | null;
    /** True while a script keeps it with its owner (setNetOwner or resetNetOwner with disableMigration). */
    readonly netOwnershipDisabled: boolean;
    /** Whether its lights are on, from its owner's game state node (GET_VEHICLE_LIGHTS_STATE's lightsOn). */
    readonly nightlightOn: boolean;
    /** Up to eight characters, as its owner's appearance node carries them (GET_VEHICLE_NUMBER_PLATE_TEXT); compare it trimmed. Assigned text is cut to 8 printable ASCII characters. */
    numberPlateText: string;
    /** The player whose client simulates it (NETWORK_GET_ENTITY_OWNER); null while a car the server made waits. */
    readonly owner: Player | null;
    /** Seat -> player for every occupied seat, the driver (seat 1) included. */
    readonly passengers: IVehiclePassenger;
    /** GET_VEHICLE_EXTRA_COLOURS. */
    pearlColor: number;
    /** GET_VEHICLE_PETROL_TANK_HEALTH, as engineHealth. Assigning (clamped to -4000..10000) sends SET_VEHICLE_PETROL_TANK_HEALTH to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    petrolTankHealth: number;
    /** Assigning teleports it (SET_ENTITY_COORDS through its owner), its heading kept. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Palette colour from its owner's appearance node (GET_VEHICLE_COLOURS); 0 until the server read it. Assigning sends SET_VEHICLE_COLOURS to its owner without waiting; this reads the new colour once the owner's next sync arrives. So do the other assignable properties. */
    primaryColor: number;
    /** Its rotation (rot, from its owner's orientation) as a unit quaternion { x, y, z, w }, a new object on each read. Assigning sends SET_ENTITY_QUATERNION (normalised) to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    quaternion: { x: number; y: number; z: number; w: number };
    /** SET_VEHICLE_FIXED and SET_VEHICLE_DEFORMATION_FIXED on its owner. */
    repair(): Promise<NativeVehicleCommandOutcome>;
    /** The ordinary hand-overs again, or with disableMigration its current owner kept. */
    resetNetOwner(disableMigration?: boolean): Promise<NativeEntityControlOutcome>;
    /** The rocket boost recharge time a script set, seconds (0 before). Assigning (clamped to 0..1000) sends SET_SCRIPT_ROCKET_BOOST_RECHARGE_TIME to its owner. */
    rocketRefuelSpeed: number;
    /** roofState under its older name. */
    roofClosed: boolean;
    /** Whether the convertible roof is closed: what a script set (true before), since GTA's sync tree does not carry the roof. Assigning sends RAISE_CONVERTIBLE_ROOF or LOWER_CONVERTIBLE_ROOF to its owner. */
    roofState: boolean;
    /** Radians; GTA's GET_ENTITY_ROTATION gives degrees in steps of about 0.9 degrees. heading is in degrees. */
    readonly rot: Vector3;
    /** The top speed a script set, m/s (0: GTA's own). Assigning (clamped to 0..1000) sends SET_VEHICLE_MAX_SPEED to its owner. */
    scriptMaxSpeed: number;
    /** Secondary palette colour from its owner's appearance node (GET_VEHICLE_COLOURS); 0 until the server read it. Assigning a whole number 0..255 (else a RangeError) sends SET_VEHICLE_COLOURS to its owner, the primary colour kept. */
    secondaryColor: number;
    /** True for a car createNativeVehicle made; false for one a client made, a client script's car or a createNativeTrain carriage. */
    readonly serverMade: boolean;
    /** Applies appearance values written by getAppearanceDataBase64 of a legacy or native vehicle through this vehicle's own setters (owner commands, or values kept on the server where GTA has no native); a value it has no setter for is skipped. Another category or format throws a TypeError. */
    setAppearanceDataBase64(data: string): void;
    /** Keeps health 0..100 for armoured window 0..7 on the server: getArmoredWindowHealth returns it from then on, until the owner's node reports another value for that window than when it was set (the game changed it). GTA has no native for it. A car the server made gets it in the CREATE the server makes of it: at once while it waits for an owner, otherwise when it waits again (its owner left with nobody to hand it to). The game of a car with an owner, and of a car a client made, does not change. */
    setArmoredWindowHealth(windowId: number, health: number): void;
    /** Keeps 0..255 hits for armoured window 0..7 on the server, as setArmoredWindowHealth. GTA carries the hits of a window only while its health is below 100. */
    setArmoredWindowShootCount(windowId: number, count: number): void;
    /** Keeps VehicleBumperDamage 0..2 of bumper 0..1 on the server, as setArmoredWindowHealth. */
    setBumperDamageLevel(bumperId: number, level: number): void;
    /** Applies damage values written by getDamageStatusBase64 of a legacy or native vehicle through this vehicle's own setters (owner commands, or values kept on the server where GTA has no native); a value it has no setter for is skipped. Another category or format throws a TypeError. */
    setDamageStatusBase64(data: string): void;
    /** Moves it to a dimension: the players that can see that dimension get it, the others lose it, and its owner hands it to one of them that holds it. One the server made whose owner cannot see that dimension starts over there at once: its owner lets it go and it waits there for an owner with its state (a new netId). A client's car stays with its owner until a player there holds it. */
    setDimension(dimension: number): Promise<NativeEntityControlOutcome>;
    /** VehicleDoorState: 0 shuts the door (SET_VEHICLE_DOOR_SHUT), any other value opens it (SET_VEHICLE_DOOR_OPEN; GTA opens it fully). Doors 0..7. */
    setDoorState(door: number, state: number): Promise<NativeVehicleCommandOutcome>;
    /** SET_VEHICLE_ENGINE_ON on its owner; both flags default to true. */
    setEngineOn(on: boolean, instantly?: boolean, disableAutoStart?: boolean): Promise<NativeVehicleCommandOutcome>;
    /** SET_VEHICLE_EXTRA on its owner; "refused" where the model has no such extra. */
    setExtra(extraId: number, enabled: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Applies gamestate values written by getGamestateDataBase64 of a legacy or native vehicle through this vehicle's own setters (owner commands, or values kept on the server where GTA has no native); a value it has no setter for is skipped. Another category or format throws a TypeError. */
    setGamestateDataBase64(data: string): void;
    /** Applies health values written by getHealthDataBase64 of a legacy or native vehicle through this vehicle's own setters (owner commands, or values kept on the server where GTA has no native); a value it has no setter for is skipped. Another category or format throws a TypeError. */
    setHealthDataBase64(data: string): void;
    /** Keeps light 0..21 broken or not on the server, as setArmoredWindowHealth. */
    setLightDamaged(lightId: number, damaged: boolean): void;
    /** This host's own metadata of it: no client sees it; metaChange fires on a change. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomVehicleMeta, any>): void;
    /** SET_VEHICLE_MOD on its owner. modIndex is 0..255 (else a RangeError): 0 is stock and GTA's mod n is n + 1. GTA needs the mod kit set first (modKit = 0). There is no getMod: the server reads no mod type/index from the tree. */
    setMod(modType: number, modIndex: number): Promise<NativeVehicleCommandOutcome>;
    /** Hands it to the player: the player takes it over once its GTA holds it (its CREATE acknowledged, 1.5 s), as a hand-over, whether its owner still sees it or not; with disableMigration it keeps it then. "not-native": that player is not on the native path; "refused": its client cannot own it; "waiting": one the server made has no owner yet. */
    setNetOwner(player: Player, disableMigration?: boolean): Promise<NativeEntityControlOutcome>;
    /** Keeps 0..255 bullet holes of part 0..5 on the server, as setArmoredWindowHealth. */
    setPartBulletHoles(partId: number, count: number): void;
    /** Keeps VehiclePartDamage 0..3 of part 0..5 on the server, as setArmoredWindowHealth. */
    setPartDamageLevel(partId: number, level: number): void;
    /** SET_ENTITY_COORDS on its owner, then SET_ENTITY_HEADING when a heading (degrees) is given. */
    setPosition(pos: Vector3Like, heading?: number): Promise<NativeVehicleCommandOutcome>;
    /** Applies script values written by getScriptDataBase64 of a legacy or native vehicle through this vehicle's own setters (owner commands, or values kept on the server where GTA has no native); a value it has no setter for is skipped. Another category or format throws a TypeError. */
    setScriptDataBase64(data: string): void;
    /** SET_VEHICLE_SEARCHLIGHT on its owner, as the legacy vehicle's clients run it: GTA aims the light itself, so the target (a valid entity or null, else a TypeError) is not used. */
    setSearchLightTo(entity: Entity | null, state: boolean): void;
    /** Keeps siren light 0..19 broken or not on the server, as setArmoredWindowHealth. */
    setSpecialLightDamaged(specialLightId: number, damaged: boolean): void;
    /** Sets streamed; "waiting" for one the server made that has no owner yet. */
    setStreamed(streamed: boolean): Promise<NativeEntityControlOutcome>;
    /** Sets streamingDistance; one the server made keeps it for each of its lifetimes. */
    setStreamingDistance(distance: number): Promise<NativeEntityControlOutcome>;
    /** Stream-synced metadata: the clients whose GTA has it now read it (getStreamSyncedMeta, streamSyncedMetaChange there). */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomVehicleStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomVehicleStreamSyncedMeta, any>): void;
    /** Synced metadata: every client whose GTA has it reads it (getSyncedMeta, syncedMetaChange there), one that gets it later gets it with it; the getters here read the scripts' own values. Throws for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomVehicleSyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomVehicleSyncedMeta, any>): void;
    /** SET_VEHICLE_TIMED_EXPLOSION(car, the culprit's ped, state) on its owner. Enabling takes a valid player (else a TypeError); time is kept for timedExplosionTime only. */
    setTimedExplosion(state: boolean, culprit?: Player | null, time?: number): Promise<NativeVehicleCommandOutcome>;
    /** SET_TRAIN_CRUISE_SPEED on its owner, for the train's engine: the speed GTA's train keeps to, m/s, -100 to 100 (a negative one backwards). "refused" for a vehicle that is no train. */
    setTrainCruiseSpeed(speed: number): Promise<NativeVehicleCommandOutcome>;
    /** Keeps a vehicle (or null) as trainEngineId on the server, which trainEngineId returns from then on: GTA links carriages only as it makes a train. Anything but a valid vehicle or null throws a TypeError. */
    setTrainEngineId(vehicle: Vehicle | null): void;
    /** Keeps a vehicle (or null) as trainLinkedToBackwardId on the server, which trainLinkedToBackwardId returns from then on: GTA links carriages only as it makes a train. Anything but a valid vehicle or null throws a TypeError. */
    setTrainLinkedToBackwardId(vehicle: Vehicle | null): void;
    /** Keeps a vehicle (or null) as trainLinkedToForwardId on the server, which trainLinkedToForwardId returns from then on: GTA links carriages only as it makes a train. Anything but a valid vehicle or null throws a TypeError. */
    setTrainLinkedToForwardId(vehicle: Vehicle | null): void;
    /** SET_TRAIN_SPEED on its owner, for the train's engine (any carriage names its train): m/s, -100 to 100; a negative speed runs the train backwards -- set the cruise speed the same way, or GTA brakes it back towards its cruise speed. "refused" for a vehicle that is no train. */
    setTrainSpeed(speed: number): Promise<NativeVehicleCommandOutcome>;
    /** SET_VEHICLE_WEAPON_RESTRICTED_AMMO on its owner: vehicle weapon 0..15, capacity -1 (unlimited) to 32767. */
    setWeaponCapacity(weaponIndex: number, capacity: number): Promise<NativeVehicleCommandOutcome>;
    /** SET_VEHICLE_TYRE_BURST (on the rim when the tyre is gone too) or, with false, SET_VEHICLE_TYRE_FIXED on its owner for wheel 0..7. */
    setWheelBurst(wheelId: number, state: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Clamps the value to -10..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelCamber(wheel: number, value: number): void;
    /** true breaks wheel 0..7 off on its owner with GTA's own break-off (alight if setWheelOnFire said so); GTA cannot put a wheel back, so false only changes the server's record and resolves to "refused". */
    setWheelDetached(wheelId: number, detached: boolean): Promise<NativeVehicleCommandOutcome>;
    /** false bursts the tyre of wheel 0..7 to the rim on its owner (SET_VEHICLE_TYRE_BURST onRim); true fixes it, burst if isWheelBurst says so. */
    setWheelHasTire(wheelId: number, state: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Clamps the value to -100000..100000 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelHealth(wheel: number, value: number): void;
    /** Clamps the value to -10..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelHeight(wheel: number, value: number): void;
    /** Keeps wheel 0..7 alight or not on the server: GTA sets a wheel alight only as it breaks off (setWheelDetached). */
    setWheelOnFire(wheelId: number, onFire: boolean): void;
    /** Clamps the value to 0..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelRimRadius(wheel: number, value: number): void;
    /** Clamps the value to -10..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelTrackWidth(wheel: number, value: number): void;
    /** Clamps the value to 0..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelTyreRadius(wheel: number, value: number): void;
    /** Clamps the value to 0..10 and has its owner write it into wheel 0..7's memory, as the legacy vehicle's clients do: GTA has neither a native nor a node for it, so the owner's copy changes (its physics) and the other players' copies keep their own wheels. A new owner gets it again. */
    setWheelTyreWidth(wheel: number, value: number): void;
    /** SMASH_VEHICLE_WINDOW (or FIX_VEHICLE_WINDOW with false) on its owner for window 0..7. Until the owner's node shows the change (at most 3 s) isWindowDamaged returns the value set, then what the game shows. */
    setWindowDamaged(windowId: number, damaged?: boolean): Promise<NativeVehicleCommandOutcome>;
    /** ROLL_DOWN_WINDOW (or ROLL_UP_WINDOW with false) on its owner for window 0..7. */
    setWindowOpened(windowId: number, state: boolean): Promise<NativeVehicleCommandOutcome>;
    /** Whether its siren is on, from its owner's game state node (IS_VEHICLE_SIREN_ON); vehicleSiren tells the change. Assigning sends SET_VEHICLE_SIREN to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    sirenActive: boolean;
    /** The angle of its front wheels in degrees, from its owner's steering node; 0 before it came. A change under 1 degree waits for the next record. */
    readonly steeringAngle: number;
    /** Whether players other than its owner get it; true by default. Assigning false takes it from every player but its owner, whose GTA simulates it, until it is true again. */
    streamed: boolean;
    /** Metres within which players see it, in place of the server's; 0 is the server's. Assigning sends it (0..20000, as the legacy entities'). */
    streamingDistance: number;
    /** The player setTimedExplosion named, while connected; null for none. */
    readonly timedExplosionCulprit: Player | null;
    /** The time setTimedExplosion was given; GTA's timer has no length, so the game does not use it. */
    readonly timedExplosionTime: number;
    /** When its owner captured the last update the server accepted, in the server's clock (ms), as of the last record the host got: a record goes on a change, not on every update. 0 before one. */
    readonly timestamp: number;
    /** Its tyre smoke colour from its owner's appearance node, alpha 255; GTA's default white before the node came. Assigning sends SET_VEHICLE_TYRE_SMOKE_COLOR ({r, g, b}) to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    tireSmokeColor: RGBA;
    /** TOGGLE_VEHICLE_MOD on its owner (turbo 18, tyre smoke 20, xenon 22). */
    toggleMod(modType: number, enabled: boolean): Promise<NativeVehicleCommandOutcome>;
    /** A train carriage's place in its train and the train's state, as the server natives read it; null for any other vehicle, or until its owner's train node arrived. */
    readonly train: NativeTrainState | null;
    /** This carriage's index in its train (GET_TRAIN_CARRIAGE_INDEX), a signed byte (-128..127; -1 none). From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainCarriageConfigIndex: number;
    /** The train's config index in trains.xml, a signed byte (-128..127; -1 none). From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainConfigIndex: number;
    /** The cruise speed in m/s its owner's train node reports, 0 for a vehicle that is no train. Assigning it is setTrainCruiseSpeed. */
    trainCruiseSpeed: number;
    /** GET_TRAIN_DIRECTION. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainDirection: boolean;
    /** Its distance along the track from the engine, in metres. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainDistanceFromEngine: number;
    /** Its train's engine (itself for the engine) from its owner's train node (CTrainGameStateDataNode), as a vehicle; null for none. */
    readonly trainEngineId: NativeVehicle | null;
    /** Whether its doors are held open. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainForceDoorsOpen: boolean;
    /** The carriage behind it from its owner's train node (CTrainGameStateDataNode), as a vehicle; null for none. */
    readonly trainLinkedToBackwardId: NativeVehicle | null;
    /** The carriage in front of it from its owner's train node (CTrainGameStateDataNode), as a vehicle; null for none. */
    readonly trainLinkedToForwardId: NativeVehicle | null;
    /** Whether its train has passenger carriages. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainPassengerCarriages: boolean;
    /** Whether GTA draws it derailed, from its owner's train node (CTrainGameStateDataNode); false for a vehicle that is no train carriage. Assigning sends SET_RENDER_TRAIN_AS_DERAILED to its owner (nothing for a vehicle that is no train). Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    trainRenderDerailed: boolean;
    /** The track: 0 the main line, 3 the metro. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainTrackId: number;
    /** The first flag the node leaves unnamed, in its bit order: allowRemovalByPopulation. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainUnk1: boolean;
    /** The second unnamed flag: whether it stops at stations (DOES_TRAIN_STOP_AT_STATIONS). From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainUnk2: boolean;
    /** The third unnamed flag: high precision blending. From its owner's train node (CTrainGameStateDataNode); false, 0 or null for a vehicle that is no train carriage. Setting it keeps the value on the server, which this getter returns from then on: GTA has no native for it, so the car in the game does not change. */
    trainUnk3: boolean;
    /** BaseObjectType.Vehicle (1), as any Vehicle. */
    readonly type: number;
    /** False once the server removed it: its owner or a script deleted it, or its owner left and nobody could take it over. It stays readable. */
    readonly valid: boolean;
    /** GET_VEHICLE_TYPE. */
    readonly vehicleType: "automobile" | "bike" | "boat" | "heli" | "plane" | "submarine" | "trailer" | "train" | "unknown";
    /** Its velocity in m/s, from its owner's velocity node (1/16 m/s steps), a new Vector3 on each read. A change under 0.5 m/s waits for the next record. */
    readonly velocity: Vector3;
    /** Whether it is visible, from its owner's physical game state node (IS_ENTITY_VISIBLE); true before it came. Assigning sends SET_ENTITY_VISIBLE to its owner. Until the owner's node shows the change (at most 3 s) this getter returns the value set, then what the game shows. */
    visible: boolean;
    /** Wheel palette colour from its owner's appearance node (GET_VEHICLE_EXTRA_COLOURS); 0 until the server read it. Assigning a whole number 0..255 (else a RangeError) sends SET_VEHICLE_EXTRA_COLOURS to its owner, the pearl colour kept. */
    wheelColor: number;
    /** -1 for none (GET_VEHICLE_WINDOW_TINT). */
    windowTint: number;
}

export const NumberPlateStyle: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly BlueWhite: any;
    readonly BlueWhite2: any;
    readonly BlueWhite3: any;
    readonly Yankton: any;
    readonly YellowBlack: any;
    readonly YellowBlue: any;
};

export class Object {
    /** Runtime-created object. Use `await varion.createObject(model, pos, rot)`. */
    private constructor();
    /** Every valid object of the old path (varion.createObject). A new array on each read. */
    static readonly all: Object[];
    /** How many objects Object.all holds now. */
    static readonly count: number;
    /** The valid object of that network id; null for none. */
    static getByID(id: number): Object | null;
    /** Asks the clients that have it, and its owner, to activate its physics; once its physics is active a player in reach may own it. Throws for a removed object. */
    activatePhysics(): void;
    /** Opacity 0..255, 255 by default. Assigning is clamped to 0..255 and truncated and sent to the clients that have it. */
    alpha: number;
    /** Whether attachTo attached it and it still is, by this host's record: false after detach() and once its parent is gone, as the server then detaches it itself. */
    readonly attached: boolean;
    /** The parent attachTo attached it to, while it is attached: null before an attach, after detach() and once that parent is gone (the server then detaches it itself). */
    readonly attachedTo: Player | Vehicle | Ped | Object | null;
    /** Five arguments: GTA's bone index of the parent, offset in metres, rotation in degrees. Seven arguments (told by the third, a bone): rot in radians (turned into degrees), noFixedRotation the opposite of fixedRotation. Bone names, an own bone other than 0 (the root) and a ped parent's bone id other than 0 throw: not supported yet. These, an invalid entity or parent and a native vehicle or NPC as parent throw at the call; the promise rejects only for the server's refusal. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** Whether it collides, by the server's record (true by default). Assigning sends it to the clients that have it; for one that is gone it throws. */
    collision: boolean;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: clients lose it and streamSyncedMetaChange fires with undefined; false when the key was not there. Once the entity is gone only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone and resolves true once the server took the removal; valid is false from the call on. While the server's removal queue is full it resolves false and the object is valid again; a second call, or one on a removed object, resolves false. */
    destroy(): Promise<boolean>;
    /** Detaches it and resolves true once the server started the detach; false when it was not attached on the server or is invalid. On true this host's record (attached, attachedTo) clears; rejects when the server does not answer in 5 s. */
    detach(): Promise<boolean>;
    /** The dimension it is in (0 by default). Assigning a 32-bit integer (else a RangeError; the fraction is dropped) moves it there and takes its owner away. */
    dimension: number;
    /** Whether it is frozen in place, by the server's record (false by default). Assigning sends it to the clients that have it; freezing also takes its owner away, so the server alone places it. */
    frozen: boolean;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setStreamSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomEntitySyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomEntitySyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key, as this host keeps them. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** Its network id, which clients know it by; after it is removed, a new entity may get the same id. */
    readonly id: number;
    /** An object (varion.createObject) with no owner and no migration: the server alone places it, a static entity (otherwise, once its physics is active, the nearest player in reach owns it). Assigning true takes its owner away for good, false lets a player own it again. */
    isStaticEntity: boolean;
    /** Always "object". */
    readonly kind: "object";
    /** LOD distance 0..65535, 100 by default. Assigning is clamped to 0..65535 and truncated and sent to the clients that have it. */
    lodDistance: number;
    /** Its model hash. Assigning a name (hashed) or a 32-bit hash makes the clients that have it get it anew with the new model; an empty name or a non-integer throws a TypeError, 0 a RangeError, and nothing changes. */
    get model(): number;
    set model(value: number | string);
    /** The player whose client simulates it, by the server's last record; null with none. It changes when the server hands it over (netOwnerChange; setNetOwner does not change it before that) and at once with resetNetOwner. */
    readonly netOwner: Player | null;
    /** True while a script keeps its owner from changing (setNetOwner or resetNetOwner with disableMigration), by the server's record. */
    readonly netOwnershipDisabled: boolean;
    /** Asks the clients that have it, and its owner, to place it properly on the ground. Throws for a removed object. */
    placeOnGroundProperly(): void;
    /** Its position as the server last synced it. Assigning moves it on the server and the clients that have it: a component that is not a finite number throws a TypeError, and one beyond 100000 m a RangeError; nothing moves then. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Takes its owner away: without disableMigration the ordinary hand-overs give it to a player again, with it the server alone places it. netOwner reads null at once; a removed entity is ignored. */
    resetNetOwner(disableMigration?: boolean): void;
    /** Its rotation in radians, as the server last synced it. Assigning sets it on the server and the clients that have it: non-finite components become 0, and the server ignores a rotation with a component beyond 36000. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** The same as rot (radians): reading gives rot, assigning assigns it. */
    get rotation(): Vector3;
    set rotation(value: Vector3Like);
    /** The size clients draw it at: 1 is GTA's own, 2 twice as large, from 0.1 to 10. Assigning sends it to every client that has the object, and to the ones that get it later; a value out of the range throws a RangeError. The object is sized around its origin, the zero point of its model. Only the drawing changes: its collision body stays as at size 1, and its position reads the same. */
    scale: number;
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomEntityMeta, any>): void;
    /** Asks the server to make the player its owner; with disableMigration it then stays with that player. Returns nothing: netOwner and netOwnershipDisabled change when the server hands it over (netOwnerChange), at once for the player who owns it already, and not at all when the server passes the player over (out of range, another dimension, not spawned, dead). Throws for a removed entity or an invalid player. */
    setNetOwner(player: Player, disableMigration?: boolean): void;
    /** Stream-synced metadata the clients that have it streamed in get (getStreamSyncedMeta there); streamSyncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomEntityStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomEntityStreamSyncedMeta, any>): void;
    /** Synced metadata every connected client gets (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntitySyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomEntitySyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomEntitySyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomEntitySyncedMeta, any>): void;
    /** Whether clients may have it at all (true by default). Assigning false takes it from every client and takes its owner away; true lets clients in range get it again; an equal value sends nothing. */
    streamed: boolean;
    /** Metres within which clients get it; 0 (the default) is the server's distance. Assigning is clamped to 0..20000 with the fraction dropped; an equal value sends nothing. */
    streamingDistance: number;
    /** Texture variation 0..255, 0 by default. Assigning is clamped to 0..255 and truncated and sent to the clients that have it. */
    textureVariation: number;
    /** The server's time in milliseconds (unsigned 32-bit) of the last state the host got for it; 0 until the first one. */
    readonly timestamp: number;
    /** BaseObjectType.Object (3). */
    readonly type: number;
    /** False from destroy() on (true again if the server refused the removal) and once the server removed it; changes to it then throw an Error. */
    readonly valid: boolean;
    /** Whether clients show it, by the server's record (true by default); assigning sends it to the clients that have it, and throws for a removed one. */
    visible: boolean;
}

export class Ped {
    /** Runtime-created NPC. Use `await varion.createNativePed(model, pos, heading)`. */
    private constructor();
    /** instanceof Ped holds for every Ped and every NativePed. */
    static [Symbol.hasInstance](value: unknown): value is Ped | NativePed;
    /** Every valid old-path ped, then every valid NPC createNativePed made. A new array on each read. */
    static readonly all: (Ped | NativePed)[];
    /** How many peds Ped.all holds now, native NPCs included. */
    static readonly count: number;
    /** The valid old-path ped of that network id, else the native NPC of that script id; null for none. */
    static getByID(id: number): Ped | NativePed | null;
    /** Armour by the server's record, 0 by default. Assigning is clamped to 0..100 and truncated and reaches clients with the server's next state of the ped; pedHeal fires when it rose. */
    armour: number;
    /** Whether attachTo attached it and it still is, by this host's record: false after detach() and once its parent is gone, as the server then detaches it itself. */
    readonly attached: boolean;
    /** The parent attachTo attached it to, while it is attached: null before an attach, after detach() and once that parent is gone (the server then detaches it itself). */
    readonly attachedTo: Player | Vehicle | Ped | Object | null;
    /** Five arguments: GTA's bone index of the parent, offset in metres, rotation in degrees. Seven arguments (told by the third, a bone): rot in radians (turned into degrees), noFixedRotation the opposite of fixedRotation. Bone names, an own bone other than 0 (the root) and a ped parent's bone id other than 0 throw: not supported yet. These, an invalid entity or parent and a native vehicle or NPC as parent throw at the call; the promise rejects only for the server's refusal. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** Whether it collides, by the server's record (true by default). Assigning sends it to the clients that have it; for one that is gone it throws. */
    collision: boolean;
    /** The weapon hash it holds by the server's record, 0 by default. Assigning takes a hash (as an unsigned 32-bit number) or a weapon name, hashed as varion.hash does. */
    currentWeapon: number;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: clients lose it and streamSyncedMetaChange fires with undefined; false when the key was not there. Once the entity is gone only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone and resolves true once the server took the removal; valid is false from the call on. While the server's removal queue is full it resolves false and the ped is valid again; a second call, or one on a removed ped, resolves false. A native NPC resolves as destroyNativePed. */
    destroy(): Promise<boolean>;
    /** Detaches it and resolves true once the server started the detach; false when it was not attached on the server or is invalid. On true this host's record (attached, attachedTo) clears; rejects when the server does not answer in 5 s. */
    detach(): Promise<boolean>;
    /** The dimension it is in (0 by default). Assigning a 32-bit integer (else a RangeError; the fraction is dropped) moves it there and takes its owner away. */
    dimension: number;
    /** Whether it is frozen in place, by the server's record (false by default). Assigning sends it to the clients that have it; freezing also takes its owner away, so the server alone places it. */
    frozen: boolean;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomEntityMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setStreamSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPedSyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPedSyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key, as this host keeps them. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** Health by the server's record, 200 by default. Assigning is clamped to 0..65535 and truncated (the server then caps it at maxHealth) and reaches clients with the server's next state of the ped; pedHeal fires when it rose. */
    health: number;
    /** Its network id, which clients know it by; after it is removed, a new entity may get the same id. */
    readonly id: number;
    /** A ped of the old path (varion.createPed) with no owner and no migration: the server alone places it, a static entity (otherwise the nearest player in range owns it). Assigning true takes its owner away for good, false lets the nearest player own it again. */
    isStaticEntity: boolean;
    /** Always "ped", a native NPC's too. */
    readonly kind: "ped";
    /** Maximum health by the server's record, 200 by default. Assigning is clamped to 1..65535 and truncated; a higher health drops to it. */
    maxHealth: number;
    /** Its model hash. Assigning a name (hashed) or a 32-bit hash makes the clients that have it get it anew with the new model; an empty name or a non-integer throws a TypeError, 0 a RangeError, and nothing changes. */
    get model(): number;
    set model(value: number | string);
    /** The player whose client simulates it, by the server's last record; null with none. It changes when the server hands it over (netOwnerChange; setNetOwner does not change it before that) and at once with resetNetOwner. */
    readonly netOwner: Player | null;
    /** True while a script keeps its owner from changing (setNetOwner or resetNetOwner with disableMigration), by the server's record. */
    readonly netOwnershipDisabled: boolean;
    /** Its position as the server last synced it. Assigning moves it on the server and the clients that have it: a component that is not a finite number throws a TypeError, and one beyond 100000 m a RangeError; nothing moves then. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Takes its owner away: without disableMigration the ordinary hand-overs give it to a player again, with it the server alone places it. netOwner reads null at once; a removed entity is ignored. */
    resetNetOwner(disableMigration?: boolean): void;
    /** Its rotation in radians, as the server last synced it. Assigning sets it on the server and the clients that have it: non-finite components become 0, and the server ignores a rotation with a component beyond 36000. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** The same as rot (radians): reading gives rot, assigning assigns it. */
    get rotation(): Vector3;
    set rotation(value: Vector3Like);
    /** The size clients draw it at: 1 is GTA's own, from 0.1 to 10. Assigning sends it to every client that has the ped, and to the ones that get it later; a value out of the range throws a RangeError. Only the drawing changes: its collision body stays as at size 1, and its position reads the same. */
    scale: number;
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomEntityMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomEntityMeta, any>): void;
    /** Asks the server to make the player its owner; with disableMigration it then stays with that player. Returns nothing: netOwner and netOwnershipDisabled change when the server hands it over (netOwnerChange), at once for the player who owns it already, and not at all when the server passes the player over (out of range, another dimension, not spawned, dead). Throws for a removed entity or an invalid player. */
    setNetOwner(player: Player, disableMigration?: boolean): void;
    /** Stream-synced metadata the clients that have it streamed in get (getStreamSyncedMeta there); streamSyncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomPedStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPedStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomPedStreamSyncedMeta, any>): void;
    /** Synced metadata every connected client gets (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPedSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomPedSyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPedSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomPedSyncedMeta, any>): void;
    /** Whether clients may have it at all (true by default). Assigning false takes it from every client and takes its owner away; true lets clients in range get it again; an equal value sends nothing. */
    streamed: boolean;
    /** Metres within which clients get it; 0 (the default) is the server's distance. Assigning is clamped to 0..20000 with the fraction dropped; an equal value sends nothing. */
    streamingDistance: number;
    /** The server's time in milliseconds (unsigned 32-bit) of the last state the host got for it; 0 until the first one. */
    readonly timestamp: number;
    /** BaseObjectType.Ped (2), a native NPC's too. */
    readonly type: number;
    /** False from destroy() on (true again if the server refused the removal) and once the server removed it; changes to it then throw an Error. */
    readonly valid: boolean;
    /** Whether clients show it, by the server's record (true by default); assigning sends it to the clients that have it, and throws for a removed one. */
    visible: boolean;
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

export const PedModelInfo: {
    /** A ped model of the built-in GTA catalog by hash or name (hashed): name, ped type, DLC, default unarmed weapon, movement clip set and bones; the same frozen object on each call. Throws Error for a model the catalog lacks. */
    get(model: number | string): IPedModel;
};

export const Permission: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly All: any;
    readonly CLIPBOARD_ACCESS: any;
    readonly EXTENDED_VOICE_API: any;
    readonly NONE: any;
    readonly SCREEN_CAPTURE: any;
    readonly WEBRTC: any;
};

export class Player {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every connected player; a new array on each read. */
    static readonly all: Player[];
    /** How many players are connected. */
    static readonly count: number;
    /** The connected player with this id (converted with Number), or null. */
    static getByID(id: number): Player | null;
    /** The first connected player whose name equals it exactly (case matters), or null. */
    static getByName(name: string): Player | null;
    /** The same as Player.getByID. */
    static getByRemoteID(id: number): Player | null;
    /** Adds a tattoo or badge for the player and those who see them: collection and overlay by name (hashed) or hash, count copies (1–32), at most 32 decorations in all; a zero hash is ignored, as the server ignores it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    addDecoration(collection: number | string, overlay: number | string, count?: number): void;
    /** Adds a component, given by name (hashed) or hash, to a weapon he has; nothing for a weapon he lacks, a component he has or past 8 components. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    addWeaponComponent(weapon: number | string, component: number | string): void;
    /** The server's id of this player's admission, a uint64 as decimal text. Every player call carries it; a reconnect is a new admission and a new Player. */
    readonly admissionEpoch: string;
    /** The point 80 m along his camera's view, as his client reports while he aims or shoots. */
    readonly aimPos: Vector3;
    /** Ammo of the weapon in his hands: 0–65535 as his client reports; after the server changes that ammo type, its count (-1: infinite). */
    readonly ammo: number;
    /** His armour from the server's record; assigning truncates to 0–65535, and the server keeps it within maxArmour and tells his client. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    armour: number;
    /** Whether attachTo attached him and he still is, by this host's record: false after detach() and once his parent is gone, as the server then detaches him itself. */
    readonly attached: boolean;
    /** What attachTo attached him to, while he is attached: null before an attach, after detach() and once that parent is gone (the server then detaches him itself). */
    readonly attachedTo: Player | Vehicle | Ped | Object | null;
    /** Five arguments: GTA's bone index of the parent, offset in metres, rotation in degrees. Seven arguments (told by the third, a bone): rot in radians (turned into degrees), noFixedRotation the opposite of fixedRotation. Bone names, an own bone other than 0 (the root) and a ped parent's bone id other than 0 throw: not supported yet. These, an invalid entity or parent and a native vehicle or NPC as parent throw at the call; the promise rejects only for the server's refusal. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** The token the client got from the server's early-auth page (useEarlyAuth); empty without one. */
    readonly authToken: string;
    /** Clears the blood damage of his ped on his own client. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    clearBloodDamage(): void;
    /** Resets clothing component 0–11 to drawable 0, texture 0, palette 0. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    clearClothes(component: number): void;
    /** Removes all his decorations. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    clearDecorations(): void;
    /** Removes the prop of slot 0–9. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    clearProp(component: number): void;
    /** Clears his ped's tasks (CLEAR_PED_TASKS) on his client and for the players who see him, ending what playAnimation started. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    clearTasks(): void;
    /** The cloud check of the player's identity, a CloudAuthResult: 0 verified, 1 nothing checked (no cloud auth or no ticket), 2 refused. A value the server did not send reads 1. */
    readonly cloudAuthResult: number;
    /** The Varion account id the player's client sent, '' without one. It is verified only when cloudAuthResult is 0 (server.toml useCloudAuth = true); otherwise a client can send any id. */
    readonly cloudID: string;
    /** Whether his ped collides (true by default) for him and the players who see him; assigning sends it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    collision: boolean;
    /** The same as valid: true while this object is the connected player of its id. */
    readonly connected: boolean;
    /** The F8 console this player has: "player" (the lines written for players and the commands meant for them), "developer" (everything: engine states, script errors with their files, the developer's commands) or "off". A player whose game runs on the server's own PC has "developer"; any other has what server.toml playerConsole gives (left out: "player"). A script assigns another; assigning null takes that back. The platform knows no roles: who is a developer here is the server's to say. */
    get consoleAccess(): "off" | "player" | "developer";
    set consoleAccess(value: "off" | "player" | "developer" | null);
    /** The hash of the dictionary of the animation his client reports: the one its engine last started on his ped -- this server's playAnimation, or a client script's TASK_PLAY_ANIM -- while GTA still plays it, 0 otherwise. An animation GTA started itself (a scenario, a reaction) reads 0: GTA has no native that names the playing clip. */
    readonly currentAnimationDict: number;
    /** The hash of the name of the animation his client reports: the one its engine last started on his ped -- this server's playAnimation, or a client script's TASK_PLAY_ANIM -- while GTA still plays it, 0 otherwise. An animation GTA started itself (a scenario, a reaction) reads 0: GTA has no native that names the playing clip. */
    readonly currentAnimationName: number;
    /** The interior id as his client reports, 0 outside; playerInteriorChange fires on a change. */
    readonly currentInterior: number;
    /** The weapon hash the player holds. Assigning (a hash or a name) selects a weapon the player has, or fists (weapon_unarmed): no ammo is added; a weapon the player does not have is not given (logged) -- giveWeapon gives one. A read right after the assignment returns the weapon just selected. */
    get currentWeapon(): number;
    set currentWeapon(value: number | string);
    /** The component hashes this host's record has for the weapon in his hands (addWeaponComponent); a new array on each read. */
    readonly currentWeaponComponents: number[];
    /** The tint this host's record has for the weapon in his hands (setWeaponTintIndex); 0 without one. */
    readonly currentWeaponTintIndex: number;
    /** Removes a key of his local metadata, at his client too; false when it was not set. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    deleteLocalMeta(key: string): boolean;
    /** Removes a key of his own metadata; false when it was not set. metaChange fires with value undefined. */
    deleteMeta(key: string): boolean;
    /** Removes a key of his stream-synced metadata, at the clients too; false when it was not set. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name for deleteStreamSyncedMeta. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes a key of his synced metadata, at the clients too; false when it was not set. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name for deleteSyncedMeta. */
    deleteSyncedMetaData(key: string): boolean;
    /** Takes his body out of the world: his client removes the ped, the others stream him out, his seat and what he owns are released, isSpawned turns false; ignored when he is not spawned. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    despawn(): void;
    /** Detaches him from what attachTo attached him to; false when he is not attached or has left. Rejects after 5 s without an answer. */
    detach(): Promise<boolean>;
    /** The dimension the player is in; assigning moves the player there. */
    dimension: number;
    /** Always "0": the client's join request carries no Discord id, so the server has none to give. */
    readonly discordID: string;
    /** Sends an event to this player's client (onServer there), reliably; a Player, Vehicle, Ped or Object among the arguments arrives as the client's own object of that id (null where it has none). A value that cannot be sent throws, as does a player who left; an event over server.toml maxServerScriptEventSize is dropped with a warning. */
    emit<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emit, but a Map, Set, Date, BigInt, undefined, NaN and the infinities arrive as they left; a cycle or nesting past 32 levels throws here. */
    emitRaw<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** Calls an RPC his client registered and resolves to its answer. Rejects with the text of the client's error (a string); with an Error after 10 s, when he leaves, or for arguments that cannot be sent. Throws at once for a player who left. */
    emitRpc<K extends string>(rpcName: K, ...args: CustomEventArgs<ICustomServerClientRpc, K>): Promise<CustomRpcResult<ICustomServerClientRpc, K>>;
    /** As emit, but over the unreliable channel: the event may be lost or arrive out of order. Arguments that cannot be sent, or a player who left, throw; before playerReady it waits and is sent then, in call order. */
    emitUnreliable<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** The player or entity he aims at, as his client reports while he aims or shoots; null for none or one this host does not know. */
    readonly entityAimingAt: Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed | null;
    /** aimPos minus the position of entityAimingAt; a zero vector without a target. */
    readonly entityAimOffset: Vector3;
    /** True while his weapon's flashlight is on, as his client reports; the same as isFlashlightActive. */
    readonly flashlightActive: boolean;
    /** Not a speed: how he moves, 0 standing, 1 walking, 2 running, 3 sprinting, as his client reports (GTA's move blend ratio, which the client API reads the same way); his speed is the length of velocity. */
    readonly forwardSpeed: number;
    /** Whether his ped is frozen in place (false by default) for him and the players who see him; assigning sends it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    frozen: boolean;
    /** The ammo of an ammo type (an AMMO_* hash or name; getAmmoHashForWeaponHash gives a weapon's) as the server last knew it; 0 for an unknown type, -1 for infinite. */
    getAmmo(ammoType: number | string): number;
    /** The flags setAmmoFlags last set for that ammo type (a hash, or a name hashed as varion.hash) on this player, as this host keeps them; all false when never set. Not read from the game. */
    getAmmoFlags(ammoHash: string | number): IAmmoFlags;
    /** Returns the configured limit; 0 if no override was set. */
    getAmmoMax(ammoHash: string | number): number;
    /** Returns the configured limit; 0 if no override was set. */
    getAmmoMax100(ammoHash: string | number): number;
    /** Returns the configured limit; 0 if no override was set. */
    getAmmoMax50(ammoHash: string | number): number;
    /** The special type setAmmoSpecialType last set for that ammo type on this player, as this host keeps it; 0 when never set. Not read from the game. */
    getAmmoSpecialType(ammoHash: string | number): number;
    /** A copy of what this host set for clothing component 0–11 (dlc or collection when set that way); null for another component. */
    getClothes(component: number): (ICloth & { dlc?: number; collection?: string }) | null;
    /** The decorations this host gave the player, as hashes: one entry per decoration with count, how many copies it has. */
    getDecorations(): IDecoration[];
    /** What this host set for clothing component 0–11 with its DLC hash (0 when not set by setDlcClothes); null for another component. */
    getDlcClothes(component: number): IDlcCloth | null;
    /** What this host set for prop slot 0–9 with its DLC hash (0 when not set by setDlcProp); null for another slot. */
    getDlcProp(component: number): IDlcProp | null;
    /** The eye colour this host set (setEyeColor), 0–255; 0 before one. */
    getEyeColor(): number;
    /** The scale this host set for face feature 0–19; 0 when unset or out of range. */
    getFaceFeatureScale(index: number): number;
    /** The hair colour this host set; 0 before one. */
    getHairColor(): number;
    /** The hair highlight colour this host set; 0 before one. */
    getHairHighlightColor(): number;
    /** A copy of the head blend this host last set (setHeadBlendData); every field 0 before one. */
    getHeadBlendData(): IHeadBlendData;
    /** A copy of the palette colour this host set (alpha 255); RGBA 0, 0, 0, 0 when unset. */
    getHeadBlendPaletteColor(paletteId: number): RGBA;
    /** A copy of what this host set for head overlay 0–12 (index 255: none); null for another overlay. */
    getHeadOverlay(overlayID: number): IHeadOverlay | null;
    /** A value of his local metadata as this host set it; undefined when unset. */
    getLocalMeta<K extends string>(key: K): CustomMetaValue<ICustomPlayerLocalMeta, K, any>;
    /** The keys of his local metadata. */
    getLocalMetaKeys(): string[];
    /** A value of his own metadata (setMeta); undefined when unset. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomPlayerMeta, K, any>;
    /** Another name for getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys of his own metadata. */
    getMetaKeys(): string[];
    /** A copy of what this host set for prop slot 0–9 (drawable -1: none); null for another slot. */
    getProp(component: number): (IProp & { dlc?: number; collection?: string; attach?: boolean }) | null;
    /** A value of his stream-synced metadata as this host set it; undefined when unset. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPlayerStreamSyncedMeta, K, any>;
    /** Another name for getStreamSyncedMeta. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPlayerStreamSyncedMeta, K, any>;
    /** Another name for getStreamSyncedMetaKeys. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys of his stream-synced metadata. */
    getStreamSyncedMetaKeys(): string[];
    /** A value of his synced metadata as this host set it; undefined when unset. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomPlayerSyncedMeta, K, any>;
    /** Another name for getSyncedMeta. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomPlayerSyncedMeta, K, any>;
    /** Another name for getSyncedMetaKeys. */
    getSyncedMetaDataKeys(): string[];
    /** The keys of his synced metadata. */
    getSyncedMetaKeys(): string[];
    /** The ammo of the weapon's ammo type as the server last knew it; 0 when he lacks the weapon, -1 for a melee weapon or infinite ammo. */
    getWeaponAmmo(weapon: number | string): number;
    /** Gives a weapon by name (hashed) or hash and adds ammo to its ammo type (truncated; negative: infinite ammo); equipNow (true by default) puts it in their hands, and currentWeapon reads it at once. Weapon 0 is ignored, as the server ignores it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    giveWeapon(weapon: number | string, ammo?: number, equipNow?: boolean): void;
    /** Whether his local metadata has the key. */
    hasLocalMeta(key: string): boolean;
    /** Whether his own metadata has the key. */
    hasMeta(key: string): boolean;
    /** Whether his stream-synced metadata has the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name for hasStreamSyncedMeta. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether his synced metadata has the key. */
    hasSyncedMeta(key: string): boolean;
    /** Another name for hasSyncedMeta. */
    hasSyncedMetaData(key: string): boolean;
    /** Whether this host's record has the weapon: one giveWeapon gave or his client reported in his hands. */
    hasWeapon(weapon: number | string): boolean;
    /** Whether this host's record has the component on that weapon. */
    hasWeaponComponent(weapon: number | string, component: number | string): boolean;
    /** His heading in degrees: rot.z as his client reports, not brought to 0–360. */
    readonly heading: number;
    /** The rotation of his gameplay camera in radians, as every rotation, as his client reports it with every update (aiming or not). */
    readonly headRot: Vector3;
    /** Health as the server holds it (200 by default). Assigning is clamped to 0..maxHealth: 0 kills the player, a dead player keeps 0 until spawn, and a player who left throws. */
    health: number;
    /** Always empty: the client's join request carries no third hardware id, and playerCreate has no such field. */
    readonly hwid3: string;
    /** Always "0": no client sends a second hardware hash. */
    readonly hwidExHash: string;
    /** A number the player's client computes from its C: volume serial and computer name, as decimal text ("0" for none). The client sends it itself, so a modified client can send any value. */
    readonly hwidHash: string;
    /** The player's network id; after the player leaves, a new player may get the same id. */
    readonly id: number;
    /** While true the server refuses every hit on him; his client is told too. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    invincible: boolean;
    /** The player's IP address as text. */
    readonly ip: string;
    /** True while he free-aims or shoots, as his client reports. */
    readonly isAiming: boolean;
    /** True in stealth movement (GET_PED_STEALTH_MOVEMENT), as his client reports; the same as isStealthy. */
    readonly isCrouching: boolean;
    /** The server's death state: true from his death until player.spawn. */
    readonly isDead: boolean;
    /** True while he gets into a vehicle (IS_PED_GETTING_INTO_A_VEHICLE), as his client reports. */
    readonly isEnteringVehicle: boolean;
    /** Whether his client has the entity now: the old path's by the server's stream set, a native vehicle or NPC by whether its GTA has it. False for an invalid entity. */
    isEntityInStreamRange(entity: Entity | NativeVehicle | NativePed): boolean;
    /** True while his weapon's flashlight is on, as his client reports; the same as flashlightActive. */
    readonly isFlashlightActive: boolean;
    /** True while he is in cover (IS_PED_IN_COVER), as his client reports. */
    readonly isInCover: boolean;
    /** True in melee combat or during a melee action, as his client reports. */
    readonly isInMelee: boolean;
    /** True while his ped is a ragdoll or runs a ragdoll task, as his client reports. */
    readonly isInRagdoll: boolean;
    /** True while he is in any vehicle (IS_PED_IN_ANY_VEHICLE), as his client reports. */
    readonly isInVehicle: boolean;
    /** True while his ped is in water (IS_ENTITY_IN_WATER), as his client reports. */
    readonly isInWater: boolean;
    /** True while he jumps (IS_PED_JUMPING), as his client reports. */
    readonly isJumping: boolean;
    /** True while he gets out of a vehicle or jumps out, as his client reports. */
    readonly isLeavingVehicle: boolean;
    /** True while his ped burns (IS_ENTITY_ON_FIRE), as his client reports. */
    readonly isOnFire: boolean;
    /** True while IS_PED_CLIMBING holds for his ped, as his client reports. */
    readonly isOnLadder: boolean;
    /** True while he stands on a vehicle (IS_PED_ON_VEHICLE), as his client reports. */
    readonly isOnVehicle: boolean;
    /** True in parachute free fall, before the canopy opens, as his client reports. */
    readonly isParachuteFreeFall: boolean;
    /** True while his parachute canopy is open, as his client reports. */
    readonly isParachuteOpen: boolean;
    /** True from the free fall to the landing of a parachute jump (parachute state 0–2), as his client reports. */
    readonly isParachuting: boolean;
    /** True while he performs a melee action (IS_PED_PERFORMING_MELEE_ACTION), as his client reports. */
    readonly isPerformingMeleeAction: boolean;
    /** The client reported that it is ready: playerReady has fired. */
    readonly isReady: boolean;
    /** True while he reloads (IS_PED_RELOADING), as his client reports. */
    readonly isReloading: boolean;
    /** True while he shoots (IS_PED_SHOOTING), as his client reports. */
    readonly isShooting: boolean;
    /** True once his client spawned his ped; despawn clears it. */
    readonly isSpawned: boolean;
    /** True in stealth movement (GET_PED_STEALTH_MOVEMENT), as his client reports; the same as isCrouching. */
    readonly isStealthy: boolean;
    /** Whether his GTA reports super jump on, from his ped's player game state node (CPlayerGameStateDataNode). GTA gives super jump one frame at a time (SET_SUPER_JUMP_THIS_FRAME), so it reads true only while his client's script keeps it on. */
    readonly isSuperJumpEnabled: boolean;
    /** Disconnects the player: the client gets the reason ("KICKED_OUT" without one) and playerDisconnect follows. A reason that is not a string throws a TypeError; so does a player who already left. */
    kick(reason?: string): void;
    /** Always "player". */
    readonly kind: "player";
    /** The body part the last damage hit (-1: none), as the damage events report it. Assigning a whole number from -1 to 255 sets the server's record; the next damage overwrites it. */
    get lastDamagedBodyPart(): number;
    set lastDamagedBodyPart(value: number);
    /** The most armour he can have (100 by default); assigning truncates to 0–65535, and armour above it drops to it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    maxArmour: number;
    /** The most health he can have (200 by default); assigning truncates to 1–65535, and health above it drops to it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    maxHealth: number;
    /** Its model hash. Assigning takes a name (hashed) or a hash; the mirror holds the hash the core gets. A bad model throws and changes nothing. */
    get model(): number;
    set model(value: number | string);
    /** His speed in m/s (GET_ENTITY_SPEED), as his client reports. */
    readonly moveSpeed: number;
    /** The name the player's client sent when it connected; it does not change while the player is connected. */
    readonly name: string;
    /** True: the server never makes this player the network owner of a vehicle, ped or object, on either path: the hand-overs pass it by, what it owns goes to a player that sees it and can take it (a native entity nobody else can take stays with it: a GTA network object always has an owner), and a car another player's GTA passes it (taking the wheel) is refused. A script's setNetOwner(player) still gives it one, and an owner pinned with disableMigration stays. A driver that may not own the car cannot drive it. */
    netOwnershipDisabled: boolean;
    /** The acceptance-run id of this server process (VARION_P0_RUN_ID), the same for every player; empty on a server that runs no acceptance profile. */
    readonly p0RunID: string;
    /** The round-trip time of his connection in milliseconds. */
    readonly ping: number;
    /** Plays ambient speech on his ped for him and the players who see him; name and parameter non-empty, under 64 bytes; the dictionary as a hash or a name (hashed), 0 by default. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    playAmbientSpeech(speechName: string, speechParam: string, speechDictHash?: number | string): void;
    /** Plays an animation on his ped for everyone who sees him, a late joiner too: names under 64 bytes, blend speeds 8 and 8 by default, duration -1 or 0 (the task's own length) or 1–3600000 ms; flag 16 (upper body) and 32 (secondary) pick the layer; playbackRate (0–1, 1 by default) and lockX/Y/Z go to TASK_PLAY_ANIM; the server drops bad arguments. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    playAnimation(dict: string, name: string, blendIn?: number, blendOut?: number, duration?: number, flag?: number, playbackRate?: number, lockX?: boolean, lockY?: boolean, lockZ?: boolean): void;
    /** Starts a GTA scenario (under 64 bytes) on his ped, for him and the players who see him; it replaces an animation of playAnimation. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    playScenario(name: string): void;
    /** Where the server last accepted the player. Assigning teleports the player's ped there (SET_ENTITY_COORDS on their client, heading kept; a driver of an old-path vehicle takes it along): a component that is not a finite number throws a TypeError, and a point beyond 100000 m a RangeError, and nothing moves; a player who left throws. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** A 32-character hex token the server minted for this authenticated session; a reconnect gets a new one. */
    readonly probeSessionID: string;
    /** Takes every weapon and, unless removeAllAmmo is false, all ammo; fists stay. With false the ammo of each type stays on the server and goes back to the player's GTA, which drops it with the weapons. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeAllWeapons(removeAllAmmo?: boolean): void;
    /** Removes every copy of that decoration. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeDecoration(collection: number | string, overlay: number | string): void;
    /** Sets face feature 0–19 back to 0; false for another index. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeFaceFeature(index: number): boolean;
    /** Asks the player's client to leave the vehicle. A Vehicle: playerLeftVehicle, player.vehicle and the other players follow when the player is really out; without the player's confirmation the server releases the seat after 4 s. A NativeVehicle: TASK_LEAVE_ANY_VEHICLE on the player's own client: the RPC native goes to the ped's owner; the others see the exit through his ped's sync. A passenger of a car another player's client controls gets out without the exit animation (CLEAR_PED_TASKS_IMMEDIATELY, Varion's own): GTA's exit waits for the owner's door grant (VEHICLE_COMPONENT_CONTROL_EVENT), which Varion does not relay yet. */
    removeFromVehicle(): void;
    /** Sets every head blend id and mix to 0 (setHeadBlendData with zeros); getHeadBlendData then reads those zeros, not null. GTA has no native that takes a head blend away. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeHeadBlendData(): void;
    /** Clears all four head blend palette colours. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeHeadBlendPaletteColor(): void;
    /** Removes the style of head overlay 0–12 (index 255, opacity 0); false for another overlay. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeHeadOverlay(overlayID: number): boolean;
    /** Takes a weapon away, given by name (hashed) or hash; if he held it, he gets fists. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeWeapon(weapon: number | string): void;
    /** Removes a component this host gave the weapon; nothing when the record has no such component. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    removeWeaponComponent(weapon: number | string, component: number | string): void;
    /** No effect and nothing is sent: GTA keeps a player's ped with his own client. Does nothing after he left either. */
    resetNetOwner(disableMigration?: boolean): void;
    /** Radians (heading gives z in degrees). Assigning turns a player on foot to z (x and y are not used) by the correction player.pos uses: the player's client puts the ped where the server last accepted it, facing z. A player in a vehicle is not turned (logged). The next spawn faces it, also when set before the spawn. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** The size clients draw him at: 1 is GTA's own, 0.8 a fifth shorter, from 0.1 to 10. Assigning sends it to every client that has him, his own included, and to the ones that get him later; a value out of the range throws a RangeError. Only the drawing changes: his collision body stays as at size 1, and his position reads the same. */
    scale: number;
    /** Seat in Player#vehicle: 1 = driver, 2 = front passenger, 3-4 = rear; 0 outside a vehicle. */
    readonly seat: number;
    /** Whether this player's client gets the other players' names (set by accept, true by default); assigning sends the change. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    sendNames: boolean;
    /** Sets the ammo of an ammo type (an AMMO_* hash or name), shared by every weapon of that type: truncated, clamped to 0–2147483647. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setAmmo(ammoType: number | string, ammo: number): void;
    /** Sets the four flags of that ammo type (the low bits of GTA's ammo info) in this player's game until they disconnect; getAmmoFlags reads them back. Throws for an ammo hash of 0 or a player who left. */
    setAmmoFlags(ammoHash: string | number, infiniteAmmo: boolean, addSmokeOnExplosion: boolean, fuse: boolean, fixedAfterExplosion: boolean): void;
    /** Sets the local client ammo limit. Clamped to 0..65535. Overrides are restored on disconnect. */
    setAmmoMax(ammoHash: string | number, amount: number): void;
    /** Sets the local client ammo limit. Clamped to 0..65535. Overrides are restored on disconnect. */
    setAmmoMax100(ammoHash: string | number, amount: number): void;
    /** Sets the local client ammo limit. Clamped to 0..65535. Overrides are restored on disconnect. */
    setAmmoMax50(ammoHash: string | number, amount: number): void;
    /** Sets GTA's special type of that ammo type (0..6, clamped and truncated) in this player's game until they disconnect; getAmmoSpecialType reads it back. Throws for an ammo hash of 0 or a player who left. */
    setAmmoSpecialType(ammoHash: string | number, specialType: number): void;
    /** Sets clothing component 0–11 (drawable and texture integers 0–65534, palette 0–255, 2 by default) for him and the players who see him; returns true. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setClothes(component: number, drawable: number, texture?: number, palette?: number): boolean;
    /** As setClothes, with the drawable counted inside the named collection (ASCII letters, digits and _, else TypeError; under 128 bytes); returns true. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setClothesByCollection(component: number, collection: string, drawable: number, texture?: number, palette?: number): boolean;
    /** Sends a date and time to this player's client only: day 0–30 and month 0–11 (both from 0: 0 is the 1st, 0 is January), year 1–9999, values truncated; an invalid date is ignored. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setDateTime(day: number, month: number, year: number, hour: number, minute: number, second?: number): void;
    /** As setClothes (palette 2 by default), with the drawable counted inside the DLC collection whose hash is dlc (a number, not 0); returns true. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setDlcClothes(dlc: number, component: number, drawable: number, texture?: number, palette?: number): boolean;
    /** As setProp, with the drawable counted inside the DLC collection whose hash is dlc (a number, not 0); returns true. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setDlcProp(dlc: number, component: number, drawable: number, texture?: number): boolean;
    /** GTA keeps a freemode ped's eye colour in its head blend data: without setHeadBlendData the ped has none (GTA reads -1). Varion keeps the colour and applies it once a blend is set, and after later blends. Returns true. */
    setEyeColor(eyeColor: number): boolean;
    /** Sets face feature 0–19 to a scale clamped to -1..1 (not a number: 0) for him and the players who see him; false for another index. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setFaceFeature(index: number, scale: number): boolean;
    /** Sets his hair colour for him and the players who see him, truncated and clamped to 0–255; the highlight colour is sent with it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHairColor(hairColor: number): void;
    /** Sets his hair highlight colour for him and the players who see him, truncated and clamped to 0–255; the hair colour is sent with it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHairHighlightColor(hairHighlightColor: number): void;
    /** Sets the freemode head blend for him and the players who see him: parent ids truncated (the server keeps them in -1..32767), the three mixes clamped to 0–1. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHeadBlendData(shapeFirstID: number, shapeSecondID: number, shapeThirdID: number, skinFirstID: number, skinSecondID: number, skinThirdID: number, shapeMix: number, skinMix: number, thirdMix: number): void;
    /** Sets head blend palette colour 0–3 for him and the players who see him, channels truncated and clamped to 0–255; false for another palette id. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHeadBlendPaletteColor(paletteId: number, red: number, green: number, blue: number): boolean;
    /** Sets head overlay 0–12 (beard, make-up...) to a style index (255 or -1 is none) and opacity 0–1 (1 by default) for him and the players who see him; false for another overlay. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHeadOverlay(overlayID: number, index: number, opacity?: number): boolean;
    /** Sets the colour type and colours of head overlay 0–12 for him and the players who see him, truncated (the server keeps them in 0–255); false for another overlay. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setHeadOverlayColor(overlayID: number, colorType: number, colorIndex: number, secondColorIndex?: number): boolean;
    /** Warps into the seat (1 = driver). A Vehicle: at once; throws for an invalid vehicle or a seat outside 1..32. A NativeVehicle: SET_PED_INTO_VEHICLE on the player's own client: the RPC native goes to the ped's owner (seats 1..17); the outcome is what its GTA made of it, "not-found" while a car the server made has no owner yet. */
    setIntoVehicle(vehicle: Vehicle, seat?: number): void;
    setIntoVehicle(vehicle: NativeVehicle, seat?: number): Promise<NativeVehicleCommandOutcome>;
    /** Data only this player's client gets (getLocalMeta there); localMetaChange fires here on a change. Key 1–1024 UTF-8 bytes, value up to 512 KiB as JSON; throws for a value that cannot be sent and for a player who left; before playerReady it waits and is sent then, in call order. */
    setLocalMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerLocalMeta, K, any>): void;
    setLocalMeta(values: CustomMetaValues<ICustomPlayerLocalMeta, any>): void;
    /** This host's own data on the player: no client sees it; metaChange fires on a change (not for the same value). A copy is stored and a copy read back: arrays and plain objects are copied, a Vector3 or RGBA made anew, an entity or function the same object. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomPlayerMeta, any>): void;
    /** No effect and nothing is sent: GTA keeps a player's ped with his own client, and the server gives only vehicles, peds and objects to an owner. Throws for a player who left and a TypeError for an invalid player argument. */
    setNetOwner(player: Player, disableMigration?: boolean): void;
    /** What the cabinet's players tab shows for this player while server.toml sets panelAgent = true: the role and the key (as your resource names them; up to 32 and 64 bytes) and up to 8 actions. Each action is a button there; pressing it runs its command as a console line, exactly as if typed in the server window, so the cabinet and the game do the same thing (e.g. { id: 'role-admin', label: 'Make admin', command: 'access allow <key> admin' }). The cabinet only names the action; the command stays on the server. Call again whenever the role or the actions change; throws on text over the limits or with control characters. */
    setPanelInfo(info: { role?: string; key?: string; actions?: Array<{ id: string; label: string; command: string }> }): void;
    /** Sets prop slot 0–9 (hat, glasses...) to a drawable and texture, integers 0–65534, for him and the players who see him; returns true. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setProp(component: number, drawable: number, texture?: number): boolean;
    /** As setProp, with the drawable counted inside the named collection (ASCII letters, digits and _, else TypeError; under 128 bytes); attach true by default. Throws RangeError for a value out of range and Error for a player who left; before playerReady it waits and is sent then, in call order. */
    setPropByCollection(component: number, collection: string, drawable: number, texture?: number, attach?: boolean): boolean;
    /** Stream-synced metadata: his own client and the clients that stream him in read it (getStreamSyncedMeta there); streamSyncedMetaChange fires here. Key 1–1024 UTF-8 bytes, value up to 512 KiB as JSON; throws for a value that cannot be sent, and after he left only this object changes. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomPlayerStreamSyncedMeta, any>): void;
    /** Another name for setStreamSyncedMeta. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomPlayerStreamSyncedMeta, any>): void;
    /** Synced metadata: every client reads it (getSyncedMeta on the player there); syncedMetaChange fires here. Key 1–1024 UTF-8 bytes, value up to 512 KiB as JSON; throws for a value that cannot be sent, and after he left only this object changes. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomPlayerSyncedMeta, any>): void;
    /** Another name for setSyncedMeta. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomPlayerSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomPlayerSyncedMeta, any>): void;
    /** Sets the ammo of the weapon's ammo type, shared by every weapon of that type: truncated, clamped to 0–2147483647; nothing for a weapon he lacks. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setWeaponAmmo(weapon: number | string, ammo: number): void;
    /** Sets the tint of a weapon he has, truncated and clamped to 0–255; nothing for a weapon he lacks. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setWeaponTintIndex(weapon: number | string, tintIndex: number): void;
    /** Sends a WeatherType (0–14; another value is ignored) to this player's client only; the server's world weather stays. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    setWeather(weatherType: number): void;
    /** Always empty: the client's join request carries no Social Club name, so the server has none to give. */
    readonly socialClubName: string;
    /** Always "0": the server gives the host no Social Club id. */
    readonly socialID: string;
    /** (pos, delay in ms), (x, y, z, delay in ms) and (model, pos), told apart by their arguments' types. There is no heading argument: the player faces player.rot when the spawn runs (set it before the spawn). A bad position, delay or model, or a third argument after pos, throws and sends nothing. */
    spawn(pos: Vector3Like, delay?: number): void;
    spawn(x: number, y: number, z: number, delay?: number): void;
    spawn(model: number | string, pos: Vector3Like): void;
    /** While he strafes, his velocity along his right side in m/s, clamped to -10..10; 0 otherwise, as his client reports. */
    readonly strafeSpeed: number;
    /** False takes the player away from every other client: they stream him out, he leaves his vehicle seat and loses what he owns; true shows him again. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    streamed: boolean;
    /** The entities his client has now (the old path's by the server's stream set, native ones by their delivery), each with its distance from him in whole metres (cut); a new array on each read. */
    readonly streamedEntities: { entity: Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed; distance: number }[];
    /** Metres within which others see him, in place of the server's (0: the server's); assigning truncates and clamps to 0–20000. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    streamingDistance: number;
    /** The client's sync counter of his last state the server took: +1 per sync, not a time. */
    readonly timestamp: number;
    /** BaseObjectType.Player (0). */
    readonly type: number;
    /** False once the player left (after playerDisconnect) or another connection took their id; once it is gone every member but valid and id throws "Invalid base object"; while the host waits for the removal, calls that change the player throw. The stand-in the host makes for a player it does not hold, such as an event's argument for one who left, reads false too. */
    readonly valid: boolean;
    /** The vehicle by the server's record of the last confirmed entry (playerEnteredVehicle); a native vehicle by its occupants, as its driver and passengers read them. */
    readonly vehicle: Vehicle | NativeVehicle | null;
    /** His velocity in m/s (GET_ENTITY_VELOCITY), as his client reports. */
    readonly velocity: Vector3;
    /** Whether his ped is visible (true by default) for him and the players who see him; assigning sends it. Throws for a player who left; before playerReady it waits and is sent then, in call order. */
    visible: boolean;
    /** This host's record of his weapons (given by giveWeapon or reported in his hands): ammo of its ammo type, -1 for a melee weapon or infinite ammo. A new array of copies on each read. */
    readonly weapons: IWeapon[];
    /** The id of the player's world inside the admission, a uint64 as decimal text; player calls carry it and the server refuses those of another world. */
    readonly worldEpoch: string;
}

export class PointBlip {
    /** Creates a point blip at x, y, z, at a position or on an entity (attached to it), in dimension 0; every player there sees it, or with `global` false (default true) only the players added with `addTarget`. A non-numeric coordinate counts as 0; any other server object than a valid player, vehicle, ped or object, and a native vehicle or NPC, throws a `TypeError`. */
    constructor(x: number, y: number, z: number, global?: boolean);
    constructor(pos: Vector3Like, global?: boolean);
    constructor(entity: Player | Vehicle | Ped | Object, global?: boolean);
    /** Every valid point blip of every resource, attached ones included; a new array on each read. A blip whose kind blipType changes moves to that class's list. */
    static readonly all: PointBlip[];
    /** How many valid point blips there are now. */
    static readonly count: number;
    /** The valid point blip with that id; null for none or for a blip of another kind. */
    static getByID(id: number): PointBlip | null;
    /** Adds a player to its targets (they get it while isGlobal is false) and re-sends the blip; nothing happens for one already there. Throws a TypeError for a player who is not connected. */
    addTarget(player: Player): void;
    /** Opacity 0..255, 255 by default; truncated to an integer, and clients clamp it to 0..255. After fade it reads the opacity faded to. */
    alpha: number;
    /** SET_BLIP_AS_MISSION_CREATOR_BLIP; false by default. */
    asMissionCreator: boolean;
    /** The player, vehicle, ped or object it follows, while that one exists; a client that has it shows the blip on it (ADD_BLIP_FOR_ENTITY), others at the position it had when attached; null for none. Once the entity is gone it reads null and the blip stays where the entity was last seen. Assigning copies the entity's position, null detaches; anything else, an invalid entity or a native vehicle or NPC throws a TypeError. */
    attachedTo: Player | Vehicle | Ped | Object | VirtualEntity | null;
    /** GTA's blip type, as BlipType: Vehicle (1), Ped (2) or Object (3) by what it is attached to, else Destination (4). Assigning Radius (7) or Area (11) makes it that kind where it is and the object a RadiusBlip or AreaBlip (100 m where it has no size); Destination detaches it. Any other type throws a RangeError unless the blip already has it. Its size follows the new kind: scale for a point or radius blip, width and height for an area. */
    blipType: number;
    /** SET_BLIP_BRIGHT; false by default. */
    bright: boolean;
    /** SET_BLIP_CATEGORY, 0 by default. Truncated to an integer. */
    category: number;
    /** Colour index, as BlipColor; 0 by default. The cone (showCone) uses it too, and so does the route while routeColor is black. Truncated to an integer. */
    color: number;
    /** SHOW_CREW_INDICATOR_ON_BLIP; false by default. */
    crewIndicatorVisible: boolean;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the blip from every client and from Blip.all; valid turns false and baseObjectRemove fires. After it its setters and methods change and send nothing (an update would make it anew); later calls do nothing, and a resource's blips go when it stops. */
    destroy(): void;
    /** Clients show it to players whose dimension sees it: in this dimension, 0 by default; in every one at -2147483648; and at 0 also to players in a negative dimension. The blip still reaches its players in other dimensions, hidden. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** Display mode (SET_BLIP_DISPLAY), 4 by default; clients use 0 while visible is false. Truncated to an integer. */
    display: number;
    /** Fades it on clients to opacity 0..255 (truncated and clamped) over duration milliseconds (SET_BLIP_FADE); a negative duration is 0. The fade runs once: alpha then reads that opacity, and a later change shows the blip at it (a change during the fade ends it there). */
    fade(opacity: number, duration: number): void;
    /** SET_BLIP_FLASHES; false by default. */
    flashes: boolean;
    /** SET_BLIP_FLASHES_ALTERNATE; false by default. */
    flashesAlternate: boolean;
    /** SET_BLIP_FLASH_INTERVAL in milliseconds, 0 by default. Truncated to an integer. */
    flashInterval: number;
    /** SET_BLIP_FLASH_TIMER in milliseconds, 0 by default. Truncated to an integer. */
    flashTimer: number;
    /** SHOW_FRIEND_INDICATOR_ON_BLIP; false by default. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBlipMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** GXT label of the name (SET_BLIP_NAME_FROM_TEXT_FILE), used while name is empty; '' by default. Assigning converts to text, null gives ''. */
    gxtName: string;
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees, 0 by default; NaN is 0. */
    heading: number;
    /** SHOW_HEADING_INDICATOR_ON_BLIP; false by default. */
    headingIndicatorVisible: boolean;
    /** Not used by a point blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the area's height when blipType makes the blip an area. */
    get height(): number | undefined;
    set height(value: number);
    /** SET_BLIP_HIGH_DETAIL; false by default. */
    highDetail: boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether attachedTo names an entity: false once that entity is gone. */
    readonly isAttached: boolean;
    /** SET_BLIP_AS_FRIENDLY; false by default. */
    isFriendly: boolean;
    /** True (the default): every player gets it; false: only its targets. Assigning re-sends it, and players who no longer get it lose it. */
    isGlobal: boolean;
    /** Always "blip". */
    readonly kind: "blip";
    /** Name shown for it on the map; undefined until set. It wins over gxtName. Assigning converts to text, null or '' clears it; quotes, backslashes and line breaks reach the clients as they are. */
    get name(): string | undefined;
    set name(value: string);
    /** Number shown on it (SHOW_NUMBER_ON_BLIP), at most 99; a negative one hides it, -1 by default. Truncated to an integer. */
    number: number;
    /** SHOW_OUTLINE_INDICATOR_ON_BLIP; false by default. */
    outlineIndicatorVisible: boolean;
    /** Where it is (for an attached point blip, where its entity was when attached, and once that entity is gone where it was last seen). Assigning moves it for every player who gets the blip; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** SET_BLIP_PRIORITY, 0 by default. Truncated to an integer. */
    priority: number;
    /** PULSE_BLIP each time a client creates the blip: when it arrives and after every change to it; false by default. */
    pulse: boolean;
    /** Not used by a point blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the radius when blipType makes the blip a radius blip. */
    get radius(): number | undefined;
    set radius(value: number);
    /** Removes a player from its targets and re-sends the blip; anything not among them is ignored. A player who leaves is removed from every blip. */
    removeTarget(player: Player): void;
    /** GPS route to it (SET_BLIP_ROUTE); false by default. */
    route: boolean;
    /** Colour of its route: clients take the HUD colour nearest to r, g, b (black, the default: the blip's colour; alpha is not used). Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get routeColor(): RGBA;
    set routeColor(value: RGBALike | number);
    /** SET_BLIP_SCALE, 1 by default; NaN is 0. Assigning sets size too (clients apply SET_BLIP_SCALE_2D after it), so the blip is drawn at the new scale. */
    scale: number;
    /** SET_BLIP_SECONDARY_COLOUR with r, g, b (alpha is not used); black by default. Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get secondaryColor(): RGBA;
    set secondaryColor(value: RGBALike | number);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBlipMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBlipMeta, any>): void;
    /** Metadata the server sends to every player who gets the blip (everyone, or only its targets when it is not global), later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the blip changes later (they make it anew and the server does not send it again) and keep none for a blip they do not show (another dimension). Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Short-range blip (SET_BLIP_AS_SHORT_RANGE); true by default. */
    shortRange: boolean;
    /** A cone in the blip's colour (SET_BLIP_SHOW_CONE); false by default. */
    showCone: boolean;
    /** Drawn small at the edge of the minimap (SET_BLIP_AS_MINIMAL_ON_EDGE); false by default. */
    shrinked: boolean;
    /** SET_BLIP_SCALE_2D, which clients apply last; scale sets it on both axes. Assigning takes { x, y } (its own scale on each axis); a missing or non-numeric component is 0. */
    get size(): Vector2;
    set size(value: { x: number; y: number });
    /** Icon, as BlipSprite; 1 by default. Truncated to an integer. */
    sprite: number;
    /** The connected players among its targets: while isGlobal is false only they get it. A new array on each read. */
    readonly targets: Player[];
    /** A tick on the blip (SHOW_TICK_ON_BLIP); false by default. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4); the GTA blip type is blipType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** False hides it on clients (SET_BLIP_DISPLAY 0) without removing it; true by default. */
    visible: boolean;
    /** Not used by a point blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the area's width when blipType makes the blip an area. */
    get width(): number | undefined;
    set width(value: number);
}

export class Quaternion {
    /** Creates a quaternion from four numbers, an array, an object with x, y, z, w, or one number for all four; a missing or non-numeric component is 0. `new Quaternion()` is 0, 0, 0, 0, not the identity rotation. */
    constructor(x: number, y: number, z?: number, w?: number);
    constructor(value?: number);
    constructor(xyzw: number[]);
    constructor(q: { x: number; y: number; z: number; w: number });
    /** (1, 1, 1, 1): every component 1, as Vector3.one, not the identity rotation (0, 0, 0, 1). A new Quaternion on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly one: Quaternion;
    /** (0, 0, 0, 0) as a new Quaternion on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly zero: Quaternion;
    /** [x, y, z, w] as a new array. */
    toArray(): [number, number, number, number];
    /** A new Quaternion with every component rounded to precision decimals (4 by default; outside 0–100 throws RangeError). */
    toFixed(precision?: number): Quaternion;
    /** Text such as "Quaternion{ x: 0, y: 0, z: 0, w: 1 }". */
    toString(): string;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    w: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    x: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    y: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    z: number;
}

export class RGBA {
    /** Creates a colour from numbers, an array [r, g, b, a] or an object with r, g, b, a. Each channel is rounded and clamped to 0–255; a missing or non-finite channel is 0, and alpha 255. */
    constructor(r?: number, g?: number, b?: number, a?: number);
    constructor(rgba: number[]);
    constructor(color: RGBALike);
    /** (0, 0, 0, 255) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly black: RGBA;
    /** (0, 0, 255, 255) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly blue: RGBA;
    /** (0, 0, 0, 0) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly clear: RGBA;
    /** (0, 255, 0, 255) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly green: RGBA;
    /** (255, 0, 0, 255) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly red: RGBA;
    /** (255, 255, 255, 255) as a new RGBA on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly white: RGBA;
    /** Alpha (255 by default): the constructor rounds it and clamps it to 0–255 (not a finite number: 0, alpha 255); assigning stores the value as given. */
    a: number;
    /** Blue: the constructor rounds it and clamps it to 0–255 (not a finite number: 0, alpha 255); assigning stores the value as given. */
    b: number;
    /** Green: the constructor rounds it and clamps it to 0–255 (not a finite number: 0, alpha 255); assigning stores the value as given. */
    g: number;
    /** Red: the constructor rounds it and clamps it to 0–255 (not a finite number: 0, alpha 255); assigning stores the value as given. */
    r: number;
    /** A new RGBA with the channels moved: its r holds alpha, g red, b green, a blue. */
    toARGB(): RGBA;
    /** [r, g, b, a] as a new array. */
    toArray(): [number, number, number, number];
    /** A new RGBA with red and blue swapped: its r holds blue, its b red. */
    toBGRA(): RGBA;
    /** The colour packed as 0xAABBGGRR (alpha in the high byte, red in the low byte), unsigned 32-bit. Channels outside 0–255 spill into each other. */
    toInt(): number;
    /** Text such as "RGBA{ r: 255, g: 0, b: 0, a: 255 }". */
    toString(): string;
}

export const RadioStation: {
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
    readonly "18": any;
    readonly "2": any;
    readonly "255": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
    readonly BlaineCountyRadio: any;
    readonly ChannelX: any;
    readonly EastLosFm: any;
    readonly FlyloFm: any;
    readonly LosSantosRockRadio: any;
    readonly NonStopPopFm: any;
    readonly RadioLosSantos: any;
    readonly RadioMirrorPark: any;
    readonly RadioOff: any;
    readonly RebelRadio: any;
    readonly SelfRadio: any;
    readonly SoulwaxFm: any;
    readonly Space: any;
    readonly TheBlueArk: any;
    readonly TheLab: any;
    readonly TheLowdown: any;
    readonly VinewoodBoulevardRadio: any;
    readonly WestCoastClassics: any;
    readonly WestCoastTalkRadio: any;
    readonly WorldWideFm: any;
};

export class RadiusBlip {
    /** Creates a radius blip, a circle of `radius` metres around x, y, z, in dimension 0. Every player there sees it; with `global` false (default true) only the players added with `addTarget` do. */
    constructor(x: number, y: number, z: number, radius: number, global?: boolean);
    /** Every valid radius blip of every resource; a new array on each read. A blip whose kind blipType changes moves to that class's list. */
    static readonly all: RadiusBlip[];
    /** How many valid radius blips there are now. */
    static readonly count: number;
    /** The valid radius blip with that id; null for none or for a blip of another kind. */
    static getByID(id: number): RadiusBlip | null;
    /** Adds a player to its targets (they get it while isGlobal is false) and re-sends the blip; nothing happens for one already there. Throws a TypeError for a player who is not connected. */
    addTarget(player: Player): void;
    /** Opacity 0..255, 255 by default; truncated to an integer, and clients clamp it to 0..255. After fade it reads the opacity faded to. */
    alpha: number;
    /** SET_BLIP_AS_MISSION_CREATOR_BLIP; false by default. */
    asMissionCreator: boolean;
    /** The player, vehicle, ped or object it was given, while that one exists; null for none or once it is gone. Clients do not attach a radius blip (GTA makes a radius only at a position): assigning moves the blip to where the entity is now. Anything else, an invalid entity or a native vehicle or NPC throws a TypeError. */
    attachedTo: Player | Vehicle | Ped | Object | VirtualEntity | null;
    /** BlipType.Radius (7). Assigning Destination (4) makes it a point blip (detached, radius 0) and Area (11) an area (100 m where it has no width or height); the object becomes a PointBlip or AreaBlip. Any other type throws a RangeError. Its size follows the new kind: scale for a point or radius blip, width and height for an area. */
    blipType: number;
    /** SET_BLIP_BRIGHT; false by default. */
    bright: boolean;
    /** SET_BLIP_CATEGORY, 0 by default. Truncated to an integer. */
    category: number;
    /** Colour index, as BlipColor; 0 by default. The cone (showCone) uses it too, and so does the route while routeColor is black. Truncated to an integer. */
    color: number;
    /** SHOW_CREW_INDICATOR_ON_BLIP; false by default. */
    crewIndicatorVisible: boolean;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the blip from every client and from Blip.all; valid turns false and baseObjectRemove fires. After it its setters and methods change and send nothing (an update would make it anew); later calls do nothing, and a resource's blips go when it stops. */
    destroy(): void;
    /** Clients show it to players whose dimension sees it: in this dimension, 0 by default; in every one at -2147483648; and at 0 also to players in a negative dimension. The blip still reaches its players in other dimensions, hidden. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** Display mode (SET_BLIP_DISPLAY), 4 by default; clients use 0 while visible is false. Truncated to an integer. */
    display: number;
    /** Fades it on clients to opacity 0..255 (truncated and clamped) over duration milliseconds (SET_BLIP_FADE); a negative duration is 0. The fade runs once: alpha then reads that opacity, and a later change shows the blip at it (a change during the fade ends it there). */
    fade(opacity: number, duration: number): void;
    /** SET_BLIP_FLASHES; false by default. */
    flashes: boolean;
    /** SET_BLIP_FLASHES_ALTERNATE; false by default. */
    flashesAlternate: boolean;
    /** SET_BLIP_FLASH_INTERVAL in milliseconds, 0 by default. Truncated to an integer. */
    flashInterval: number;
    /** SET_BLIP_FLASH_TIMER in milliseconds, 0 by default. Truncated to an integer. */
    flashTimer: number;
    /** SHOW_FRIEND_INDICATOR_ON_BLIP; false by default. */
    friendIndicatorVisible: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBlipMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** GXT label of the name (SET_BLIP_NAME_FROM_TEXT_FILE), used while name is empty; '' by default. Assigning converts to text, null gives ''. */
    gxtName: string;
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Rotation of the icon in degrees, 0 by default; NaN is 0. */
    heading: number;
    /** SHOW_HEADING_INDICATOR_ON_BLIP; false by default. */
    headingIndicatorVisible: boolean;
    /** Not used by a radius blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the area's height when blipType makes the blip an area. */
    get height(): number | undefined;
    set height(value: number);
    /** SET_BLIP_HIGH_DETAIL; false by default. */
    highDetail: boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether attachedTo names an entity: false once that entity is gone. Clients do not attach a radius blip. */
    readonly isAttached: boolean;
    /** SET_BLIP_AS_FRIENDLY; false by default. */
    isFriendly: boolean;
    /** True (the default): every player gets it; false: only its targets. Assigning re-sends it, and players who no longer get it lose it. */
    isGlobal: boolean;
    /** Always "blip". */
    readonly kind: "blip";
    /** Name shown for it on the map; undefined until set. It wins over gxtName. Assigning converts to text, null or '' clears it; quotes, backslashes and line breaks reach the clients as they are. */
    get name(): string | undefined;
    set name(value: string);
    /** Number shown on it (SHOW_NUMBER_ON_BLIP), at most 99; a negative one hides it, -1 by default. Truncated to an integer. */
    number: number;
    /** SHOW_OUTLINE_INDICATOR_ON_BLIP; false by default. */
    outlineIndicatorVisible: boolean;
    /** Centre of the circle. Assigning moves it for every player who gets the blip; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** SET_BLIP_PRIORITY, 0 by default. Truncated to an integer. */
    priority: number;
    /** PULSE_BLIP each time a client creates the blip: when it arrives and after every change to it; false by default. */
    pulse: boolean;
    /** Radius of the circle in metres (ADD_BLIP_FOR_RADIUS); clients use 50 when none was given at creation (it reads undefined then). Assigning re-creates the blip on clients; NaN is 0. */
    get radius(): number | undefined;
    set radius(value: number);
    /** Removes a player from its targets and re-sends the blip; anything not among them is ignored. A player who leaves is removed from every blip. */
    removeTarget(player: Player): void;
    /** GPS route to it (SET_BLIP_ROUTE); false by default. */
    route: boolean;
    /** Colour of its route: clients take the HUD colour nearest to r, g, b (black, the default: the blip's colour; alpha is not used). Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get routeColor(): RGBA;
    set routeColor(value: RGBALike | number);
    /** SET_BLIP_SCALE, 1 by default; NaN is 0. Assigning sets size too (clients apply SET_BLIP_SCALE_2D after it), so the blip is drawn at the new scale. */
    scale: number;
    /** SET_BLIP_SECONDARY_COLOUR with r, g, b (alpha is not used); black by default. Assigning takes an RGBA or a number 0xRRGGBB; components are clamped to 0..255. */
    get secondaryColor(): RGBA;
    set secondaryColor(value: RGBALike | number);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBlipMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBlipMeta, any>): void;
    /** Metadata the server sends to every player who gets the blip (everyone, or only its targets when it is not global), later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Clients lose it when the blip changes later (they make it anew and the server does not send it again) and keep none for a blip they do not show (another dimension). Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Short-range blip (SET_BLIP_AS_SHORT_RANGE); true by default. */
    shortRange: boolean;
    /** A cone in the blip's colour (SET_BLIP_SHOW_CONE); false by default. */
    showCone: boolean;
    /** Drawn small at the edge of the minimap (SET_BLIP_AS_MINIMAL_ON_EDGE); false by default. */
    shrinked: boolean;
    /** SET_BLIP_SCALE_2D, which clients apply last; scale sets it on both axes. Assigning takes { x, y } (its own scale on each axis); a missing or non-numeric component is 0. */
    get size(): Vector2;
    set size(value: { x: number; y: number });
    /** Icon, as BlipSprite; 1 by default. Truncated to an integer. */
    sprite: number;
    /** The connected players among its targets: while isGlobal is false only they get it. A new array on each read. */
    readonly targets: Player[];
    /** A tick on the blip (SHOW_TICK_ON_BLIP); false by default. */
    tickVisible: boolean;
    /** BaseObjectType.Blip (4); the GTA blip type is blipType. */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
    /** False hides it on clients (SET_BLIP_DISPLAY 0) without removing it; true by default. */
    visible: boolean;
    /** Not used by a radius blip: kept to read only, undefined until given, and assigning sends nothing; it becomes the area's width when blipType makes the blip an area. */
    get width(): number | undefined;
    set width(value: number);
}

export class Resource {
    constructor(...args: any[]);
    /** A new snapshot of every resource the server knows, started or not (as getAllResources). */
    static readonly all: Resource[];
    /** The resource whose code is running, as a new snapshot on each read (name, path, main, a copy of its config, started, exports, dependencies, dependants); null outside a resource's code. */
    static readonly current: Resource;
    /** A new snapshot of the resource of that name (name, path, main, type, a copy of its config, started, exports, dependencies, dependants); null for an unknown one. */
    static get(resourceName: string): Resource | null;
    /** The same as Resource.get. */
    static getByName(resourceName: string): Resource | null;
    /** A copy of its resource.toml [config] table, a field of the snapshot, fixed when it was taken. */
    readonly config: Record<string, any>;
    /** Names of the known resources that list it as a dependency. */
    readonly dependants: string[];
    /** Names of the resources it depends on (resource.toml). */
    readonly dependencies: string[];
    /** What the resource's main file exports (module.exports), read when asked; an empty object while it is not running. */
    readonly exports: Record<string, any>;
    /** The same as started: whether it is running now, read when asked. */
    readonly isStarted: boolean;
    /** Its main file as resource.toml names it, relative to the resource (main.js, not a full path). */
    readonly main: string;
    /** The resource's name. */
    readonly name: string;
    /** optional-permissions from its [config] table as Permission numbers, as requiredPermissions; [] without one. Informational only: neither the server nor the client asks a player for these or checks them. */
    readonly optionalPermissions: string[];
    /** The absolute path of the resource's folder on the server; a field of the snapshot, so assigning it changes nothing else. */
    readonly path: string;
    /** required-permissions from its [config] table as Permission numbers: 'Screen Capture' 1, 'WebRTC' 2, 'Clipboard Access' 3, 'Extended Voice API' 4, any other name 0; [] without one. Informational only: neither the server nor the client asks a player for these or checks them; a client script asks with requestPermission. */
    readonly requiredPermissions: string[];
    /** Whether it is running now, read when asked: an object taken during its load reads true once it has started. */
    readonly started: boolean;
    /** Its type as resource.toml gives it ("js" by default). */
    readonly type: string;
    /** Whether the resource is still loaded as the instance this snapshot saw: false once it stops or loads again (take a new snapshot then), and for a snapshot of a resource that was not loaded. Unlike the other fields it is read live. */
    readonly valid: boolean;
}

export const SortOrderEnum: {
    readonly Ascending: any;
    readonly Descending: any;
    readonly NoSorting: any;
};

export class TextLabel {
    /** Creates a text label: `new TextLabel(options)` is `varion.createTextLabel(options)` (`text`, `pos`, `scale`, `font`, `color`, `outline`, `dimension`), and both make a `TextLabel`. A non-object argument throws a `TypeError`. Players see it by its dimension (0 by default), as every world object. */
    private constructor(options?: { text?: string; pos?: Vector3Like; x?: number; y?: number; z?: number; scale?: number; font?: number; color?: RGBALike; outline?: boolean; dimension?: number; [option: string]: any });
    /** Every valid text label of every resource, from new TextLabel and createTextLabel alike; a new array on each read. */
    static readonly all: TextLabel[];
    /** How many text labels TextLabel.all holds now. */
    static readonly count: number;
    /** The valid text label with that id; null for none. */
    static getByID(id: number): TextLabel | null;
    /** Text colour, white (255, 255, 255, 255) by default. Assigning takes { r, g, b, a }; each component is rounded and kept to 0..255, as clients take it, and a missing alpha is 255. */
    get color(): RGBA;
    set color(value: RGBALike);
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key here and on the clients that have it: true, and syncedMetaChange fires with the value undefined; false when it was not there. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the text label from every client; valid turns false and baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too); a resource's text labels go when it stops. */
    destroy(): void;
    /** Clients draw it for players whose dimension sees it, as every world object: in this dimension, 0 by default; in every one at -2147483648 (isGlobal); and at 0 also for players in a negative dimension. Assigning truncates to an integer (NaN is 0). */
    dimension: number;
    /** GTA font index, 0 by default; truncated to an integer. */
    font: number;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Its id: blips, markers, checkpoints, colshapes and text labels take their ids from one counter, so none of them share one while the host runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Whether it is in every dimension (-2147483648), where every player sees it. Assigning true sets that dimension, false sets dimension 0. */
    isGlobal: boolean;
    /** Always "textlabel". */
    readonly kind: "textlabel";
    /** Draws an outline around the text; false by default. */
    outline: boolean;
    /** Where the text is drawn: clients draw it whenever that point is on their screen, with no distance or line-of-sight check. Assigning moves it; a non-finite component becomes 0. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Text size: clients draw it at 0.35 × scale, kept within 0.1..2.0; 1 by default. The size does not change with distance. */
    scale: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Metadata the server sends to every connected player, later ones included (getSyncedMeta and syncedMetaChange there); syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** The text drawn at pos; an empty or missing value becomes ' '. Quotes, backslashes and line breaks reach the clients as they are. */
    text: string;
    /** BaseObjectType.TextLabel (23). */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export const Utils: {
    /** Throws Error(message), or Error("Assertion failed"), when the value is falsy. */
    assert(assertion: unknown, message?: string): asserts assertion;
    readonly ConsoleCommand: typeof UtilsConsoleCommand;
    readonly EveryTick: typeof UtilsEveryTick;
    /** The player nearest to pos (0, 0, 0 when missing) within range metres (0 or missing: any distance), in any dimension; null for none. */
    getClosestPlayer(options?: { pos?: Vector3Like; range?: number }): Player | null;
    /** The vehicle (either path) nearest to pos (0, 0, 0 when missing) within range metres (0 or missing: any distance), in any dimension; null for none. */
    getClosestVehicle(options?: { pos?: Vector3Like; range?: number }): Vehicle | NativeVehicle | null;
    /** A readable text of any value: Node's util.inspect. */
    inspect(value: any, options?: IInspectOptions): string;
    readonly Interval: typeof UtilsInterval;
    readonly NextTick: typeof UtilsNextTick;
    readonly Timeout: typeof UtilsTimeout;
    readonly Timer: typeof UtilsTimer;
    /** Resolves after the milliseconds (negative or not a number: 0). */
    wait(milliseconds: number): Promise<void>;
    /** Checks the condition now and every 10 ms; resolves once it returns a truthy value, rejects with Error("waitFor timed out") after timeout ms (2000 by default) or with what it throws. A non-function rejects with TypeError. */
    waitFor(condition: () => any, timeout?: number): Promise<void>;
};

/** Runtime path: `varion.Utils.ConsoleCommand` */
export class UtilsConsoleCommand {
    /** Registers a server console command: `callback` gets the words after the name as strings. The name is trimmed and compared in lower case; an empty name or a callback that is not a function throws a `TypeError`. */
    constructor(name: string, callback: (...args: string[]) => void);
    /** Stops answering the command; calling it again does nothing. */
    destroy(): void;
    /** The command name, trimmed and in lower case; assigning another lower-case name makes it answer that one. */
    name: string;
}

/** Runtime path: `varion.Utils.EveryTick` */
export class UtilsEveryTick {
    constructor(...args: any[]);
    /** Stops the calls every 16 ms; later calls do nothing. */
    destroy(): void;
    /** A number of its own, counted from 1 across every Utils timer of the server. */
    readonly id: number;
}

/** Runtime path: `varion.Utils.Interval` */
export class UtilsInterval {
    constructor(...args: any[]);
    /** Stops the repeated calls; later calls do nothing. */
    destroy(): void;
    /** A number of its own, counted from 1 across every Utils timer of the server; not a handle for clearInterval. */
    readonly id: number;
}

/** Runtime path: `varion.Utils.NextTick` */
export class UtilsNextTick {
    constructor(...args: any[]);
    /** Cancels the call if it has not run yet; later calls do nothing. */
    destroy(): void;
    /** A number of its own, counted from 1 across every Utils timer of the server. */
    readonly id: number;
}

/** Runtime path: `varion.Utils.Timeout` */
export class UtilsTimeout {
    constructor(...args: any[]);
    /** Cancels the call if it has not run yet; later calls do nothing. */
    destroy(): void;
    /** A number of its own, counted from 1 across every Utils timer of the server; not a handle for clearTimeout. */
    readonly id: number;
}

/** Runtime path: `varion.Utils.Timer` */
export class UtilsTimer {
    /** Starts a timer that calls `callback` every `milliseconds` ms, or once when `once` is true; `destroy()` or the resource stopping ends it. A callback that is not a function throws a `TypeError`. */
    constructor(callback: () => void, milliseconds: number, once?: boolean);
    /** Stops the timer; calling it again does nothing. */
    destroy(): void;
    /** A number from 1, unique among the timers of the host. */
    readonly id: number;
}

export class Vector2 {
    /** Creates a 2D vector from two numbers, an array, an object with x, y, or one number for both; a missing or non-numeric component is 0, so `new Vector2()` is 0, 0. */
    constructor(x: number, y: number);
    constructor(value?: number);
    constructor(xy: number[]);
    constructor(v: { x: number; y: number });
    /** (0, -1) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly down: Vector2;
    /** (-1, 0) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly left: Vector2;
    /** (-Infinity on both axes) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly negativeInfinity: Vector2;
    /** (1, 1) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly one: Vector2;
    /** (Infinity on both axes) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly positiveInfinity: Vector2;
    /** (1, 0) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly right: Vector2;
    /** (0, 1) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly up: Vector2;
    /** (0, 0) as a new Vector2 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly zero: Vector2;
    /** A new Vector2: this plus (x, y), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    add(x: number, y: number): Vector2;
    add(value: { x: number; y: number } | number[] | number): Vector2;
    /** The angle to another vector in radians, 0–π; 0 when either has zero length. */
    angleTo(value: { x: number; y: number } | number[]): number;
    /** The angle to another vector in degrees, 0–180; 0 when either has zero length. */
    angleToDegrees(value: { x: number; y: number } | number[]): number;
    /** The distance to a vector or array. */
    distanceTo(value: { x: number; y: number } | number[]): number;
    /** The squared distance to a vector or array, cheaper than distanceTo. */
    distanceToSquared(value: { x: number; y: number } | number[]): number;
    /** A new Vector2: this divided by (x, y), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. A zero divisor component throws an Error "Division by zero". */
    div(x: number, y: number): Vector2;
    div(value: { x: number; y: number } | number[] | number): Vector2;
    /** The dot product with (x, y), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    dot(x: number, y: number): number;
    dot(value: { x: number; y: number } | number[] | number): number;
    /** A new Vector2 of the reciprocals (1/x, 1/y); a zero component gives Infinity. Not the negation. */
    inverse(): Vector2;
    /** Whether every axis differs by at most range and the distance is at most range; a negative range is never in range. */
    isInRange(value: { x: number; y: number } | number[], range: number): boolean;
    /** The Euclidean length. */
    readonly length: number;
    /** A new Vector2 ratio of the way from this to the other: 0 this, 1 the other; ratio is not clamped. */
    lerp(value: { x: number; y: number } | number[], ratio: number): Vector2;
    /** A new Vector2: this times (x, y), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    mul(x: number, y: number): Vector2;
    mul(value: { x: number; y: number } | number[] | number): Vector2;
    /** A new Vector2 with every component negated. */
    negative(): Vector2;
    /** A new Vector2 of length 1 in the same direction; for a zero vector a new (0, 0). */
    normalize(): Vector2;
    /** A new Vector2: this minus (x, y), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    sub(x: number, y: number): Vector2;
    sub(value: { x: number; y: number } | number[] | number): Vector2;
    /** [x, y] as a new array. */
    toArray(): [number, number];
    /** A new Vector2: every component multiplied by 180/π. */
    toDegrees(): Vector2;
    /** A new Vector2 with every component rounded to precision decimals (4 by default; outside 0–100 throws RangeError). */
    toFixed(precision?: number): Vector2;
    /** A new Vector2: every component multiplied by π/180. */
    toRadians(): Vector2;
    /** Text such as "Vector2{ x: 1.0000, y: 2.0000 }", four decimals per component. */
    toString(): string;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    x: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    y: number;
}

export class Vector3 {
    /** Creates a 3D vector from three numbers, an array, an object with x, y, z (another Vector3 among them), or one number for all three; a missing or non-numeric component is 0, so `new Vector3()` is 0, 0, 0. */
    constructor(x: number, y: number, z?: number);
    constructor(value?: number);
    constructor(xyz: number[]);
    constructor(v: Vector3Like);
    /** (0, -1, 0) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly back: Vector3;
    /** (0, 0, -1) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly down: Vector3;
    /** (0, 1, 0) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly forward: Vector3;
    /** (-1, 0, 0) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly left: Vector3;
    /** (-Infinity on every axis) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly negativeInfinity: Vector3;
    /** (1, 1, 1) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly one: Vector3;
    /** (Infinity on every axis) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly positiveInfinity: Vector3;
    /** (1, 0, 0) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly right: Vector3;
    /** (0, 0, 1) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly up: Vector3;
    /** (0, 0, 0) as a new Vector3 on every read, so changing it affects nothing else; the property itself is read-only. */
    static readonly zero: Vector3;
    /** A new Vector3: this plus (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    add(x: number, y: number, z?: number): Vector3;
    add(value: Vector3Like | number[] | number): Vector3;
    /** The angle to another vector in radians, 0–π; 0 when either has zero length. */
    angleTo(value: Vector3Like | number[]): number;
    /** The angle to another vector in degrees, 0–180; 0 when either has zero length. */
    angleToDegrees(value: Vector3Like | number[]): number;
    /** A new Vector3: the cross product of this and (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    cross(x: number, y: number, z?: number): Vector3;
    cross(value: Vector3Like | number[] | number): Vector3;
    /** The distance to a vector or array. */
    distanceTo(value: Vector3Like | number[]): number;
    /** The squared distance to a vector or array, cheaper than distanceTo. */
    distanceToSquared(value: Vector3Like | number[]): number;
    /** A new Vector3: this divided by (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. A zero divisor component throws an Error "Division by zero". */
    div(x: number, y: number, z?: number): Vector3;
    div(value: Vector3Like | number[] | number): Vector3;
    /** The dot product with (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    dot(x: number, y: number, z?: number): number;
    dot(value: Vector3Like | number[] | number): number;
    /** A new Vector3 of the reciprocals (1/x, 1/y, 1/z); a zero component gives Infinity. Not the negation. */
    inverse(): Vector3;
    /** Whether every axis differs by at most range and the distance is at most range; a negative range is never in range. */
    isInRange(value: Vector3Like | number[], range: number): boolean;
    /** The Euclidean length. */
    readonly length: number;
    /** A new Vector3 ratio of the way from this to the other: 0 this, 1 the other; ratio is not clamped. */
    lerp(value: Vector3Like | number[], ratio: number): Vector3;
    /** A new Vector3: this times (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    mul(x: number, y: number, z?: number): Vector3;
    mul(value: Vector3Like | number[] | number): Vector3;
    /** A new Vector3 with every component negated. */
    negative(): Vector3;
    /** A new Vector3 of length 1 in the same direction; for a zero vector a new (0, 0, 0). */
    normalize(): Vector3;
    /** A new Vector3: this minus (x, y, z), a vector or array component-wise, or one number on every component; a missing or non-numeric component counts as 0. */
    sub(x: number, y: number, z?: number): Vector3;
    sub(value: Vector3Like | number[] | number): Vector3;
    /** [x, y, z] as a new array. */
    toArray(): [number, number, number];
    /** A new Vector3: every component multiplied by 180/π. */
    toDegrees(): Vector3;
    /** A new Vector3 with every component rounded to precision decimals (4 by default; outside 0–100 throws RangeError). */
    toFixed(precision?: number): Vector3;
    /** A new Vector3: every component multiplied by π/180. */
    toRadians(): Vector3;
    /** Text such as "Vector3{ x: 1.0000, y: 2.0000, z: 3.0000 }", four decimals per component. */
    toString(): string;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    x: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    y: number;
    /** A plain field: assigning stores the value as given (the constructor turns NaN into 0). */
    z: number;
}

export class Vehicle {
    /** Runtime-created vehicle. Use `await varion.createNativeVehicle(model, pos, heading)` to create a networked vehicle. */
    private constructor();
    /** instanceof Vehicle holds for every Vehicle and every NativeVehicle. */
    static [Symbol.hasInstance](value: unknown): value is Vehicle | NativeVehicle;
    /** Every valid old-path vehicle, then every native vehicle the host mirrors. A new array on each read. */
    static readonly all: (Vehicle | NativeVehicle)[];
    /** How many vehicles Vehicle.all holds now, native ones included. */
    static readonly count: number;
    /** The valid old-path vehicle of that network id, else the native vehicle of that script id; null for none. */
    static getByID(id: number): Vehicle | NativeVehicle | null;
    /** Throttle 0..1 as its owner's client reports it: the drive force of its wheels, averaged; 0 until reported, and not reported by a client that cannot read the wheels. */
    readonly accelerationLevel: number;
    /** Integer station index 0..18, or 255 to disable the radio. */
    activeRadioStation: number;
    /** The old-path vehicle that attachTo attached to this one, by this host's record; null for none. Not a boolean, unlike attached on players, peds and objects: whether this vehicle is attached itself reads attachedTo. */
    readonly attached: Vehicle | null;
    /** The parent attachTo attached it to, of any kind (a player, vehicle, ped or object), while it is attached: null before an attach, after detach() and once that parent is gone (the server then detaches it itself). */
    readonly attachedTo: Player | Vehicle | Ped | Object | null;
    /** Five arguments: GTA's bone index of the parent, offset in metres, rotation in degrees. Seven arguments (told by the third, a bone): rot in radians (turned into degrees), noFixedRotation the opposite of fixedRotation. Bone names, an own bone other than 0 (the root) and a ped parent's bone id other than 0 throw: not supported yet. These, an invalid entity or parent and a native vehicle or NPC as parent throw at the call; the promise rejects only for the server's refusal. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** Whether its boat anchor is down, by the server's record (false by default); assigning sends it to the clients that have it (SET_BOAT_ANCHOR). Only scripts change it: an owner's sync keeps it. */
    boatAnchorActive: boolean;
    /** Requires a finite value, clamped to 0..1000 and truncated to an integer. */
    bodyAdditionalHealth: number;
    /** Requires a finite value, clamped to 0..1000 and truncated to an integer. */
    bodyHealth: number;
    /** Brake 0..1 as its owner's client reports it: the brake pressure of its wheels, averaged; 0 until reported. */
    readonly brakeLevel: number;
    /** Whether it collides, by the server's record (true by default). Assigning sends it to the clients that have it; for one that is gone it throws. */
    collision: boolean;
    /** Requires a finite value, clamped to 0..255 and truncated to an integer. */
    counterMeasureCount: number;
    /** Its custom primary colour as an RGBA: (0, 0, 0, 255) while none is set (isPrimaryColorRGB tells). Assigning {r, g, b} sets it; null clears it. */
    get customPrimaryColor(): RGBA;
    set customPrimaryColor(value: RGBALike | null);
    /** Its custom secondary colour as an RGBA: (0, 0, 0, 255) while none is set (isSecondaryColorRGB tells). Assigning {r, g, b} sets it; null clears it. */
    get customSecondaryColor(): RGBA;
    set customSecondaryColor(value: RGBALike | null);
    /** Whether it has custom tyres (false by default), as its appearance on the server says: its owner's report or a script's change. Assigning sends it to the clients that have it with its appearance. */
    customTires: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to 0..255 and truncated to an integer. Only the server's record: no client applies it to GTA. */
    darkness: number;
    /** Dashboard palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    dashboardColor: number;
    /** Whether its lights are on, as its owner reports them; assigning makes the clients that have it force the lights on or off (SET_VEHICLE_LIGHTS) until the owner's next sync reports GTA's state. */
    daylightOn: boolean;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key: clients lose it and streamSyncedMetaChange fires with undefined; false when the key was not there. Once the entity is gone only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Another name of deleteStreamSyncedMeta: the same function. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Another name of deleteSyncedMeta: the same function. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone and resolves true once the server took the removal; valid is false from the call on, and removeEntity and baseObjectRemove follow. While its removal queue is full the server refuses: then it resolves false and the vehicle is valid again. A second call, or one on a removed vehicle, resolves false. */
    destroy(): Promise<boolean>;
    /** Whether it is wrecked, by the server's record: set once its owner reports engine health -4000 or body health 0, cleared only by repair(). */
    readonly destroyed: boolean;
    /** Detaches it and resolves true once the server started the detach; false when it was not attached on the server or is invalid. On true this host's record (attached, attachedTo) clears; rejects when the server does not answer in 5 s. */
    detach(): Promise<boolean>;
    /** The dimension it is in (0 by default). Assigning a 32-bit integer (else a RangeError; the fraction is dropped) moves it there: its occupants are put out and it loses its owner. */
    dimension: number;
    /** Dirt level 0..15 (0 by default); an assigned value is clamped to 0..15 (a non-number reads 0) and sent to the clients that have it (SET_VEHICLE_DIRT_LEVEL). */
    dirtLevel: number;
    /** Index must be an integer from 0 to 7. */
    doesWheelHasTire(index: number): boolean;
    /** Drift mode (reduced grip: SET_VEHICLE_REDUCE_GRIP on the clients that have it), by the server's record, false by default. Only scripts change it: an owner's sync keeps it. */
    driftModeEnabled: boolean;
    /** The connected player in seat 1 by the server's record of confirmed entries; null when nobody drives. */
    readonly driver: Player | null;
    /** Requires a finite value, clamped to -4000..1000 and truncated to an integer. */
    engineHealth: number;
    /** Whether its engine runs, as its owner reports it (GET_IS_VEHICLE_ENGINE_RUNNING); assigning sets it on the clients that have it (SET_VEHICLE_ENGINE_ON) until the owner's next sync. */
    engineOn: boolean;
    /** Always false: nothing sets it, neither a script (there is no setter) nor its owner's sync, and GTA has no native that reads it. */
    readonly flamethrowerActive: boolean;
    /** The front wheel part (mod slot 23) as its owner reports it: 0 for stock or unknown, GTA's mod n is n + 1; setMod(23, ...) and setWheels change it too. */
    readonly frontWheels: number;
    /** Whether it is frozen in place, by the server's record (false by default); assigning sends it to the clients that have it, and throws for a removed one. */
    frozen: boolean;
    /** Its gear as its owner reports it (0..15); 0 until reported. */
    readonly gear: number;
    /** Its colours, plate, mods, extras, liveries, tint, neon, tyre smoke and dirt by the server's record, as base64 of Varion's own JSON (not GTA's format); setAppearanceDataBase64 takes it back. */
    getAppearanceDataBase64(): string;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    getArmoredWindowHealth(index: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    getArmoredWindowShootCount(index: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 1. */
    getBumperDamageLevel(index: number): number;
    /** Its light, window, bumper and part damage and armoured windows by the server's record, as base64 of Varion's own JSON (not GTA's format); setDamageStatusBase64 takes it back. */
    getDamageStatusBase64(): string;
    /** Door 0..7 as a VehicleDoorState number by the server's record: 0 closed, else the level setDoorState gave while the door is open, 7 otherwise. Only setDoorState and repair() change it (a door opened in GTA does not); a door outside 0..7 throws a RangeError. */
    getDoorState(door: number): number;
    /** Whether extra 0..15 is on by the server's record (setExtra, or its owner's appearance report); false for one never reported. Outside 0..15 throws a RangeError. */
    getExtra(extraId: number): boolean;
    /** Engine, siren, handbrake, roof, lights, lock state, lights multiplier, headlight colour, radio, light state and horn by the server's record, as base64 of Varion's own JSON (not GTA's format); setGamestateDataBase64 takes it back. */
    getGamestateDataBase64(): string;
    /** Engine, petrol tank and body health, wheel health and the tyre, detached and on-fire wheel masks by the server's record, as base64 of Varion's own JSON (not GTA's format); setHealthDataBase64 takes it back. */
    getHealthDataBase64(): string;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The part in slot 0..49 by the server's record (setMod, or its owner's appearance report): 0 for stock or unknown, GTA's mod n is n + 1. A slot outside 0..49 throws a RangeError. */
    getMod(slot: number): number;
    /** How many mods its model has in slot 0..49 (GET_NUM_VEHICLE_MODS on its owner's client); 0 until reported. A slot outside 0..49 throws a RangeError. */
    getModsCount(slot: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 5. */
    getPartBulletHoles(index: number): number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 5. */
    getPartDamageLevel(index: number): number;
    /** Manual engine control, drift mode, boat anchor, script max speed, countermeasures, weapon capacities and the hybrid and rocket values by the server's record, as base64 of Varion's own JSON (not GTA's format); setScriptDataBase64 takes it back. */
    getScriptDataBase64(): string;
    /** The value setStreamSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMeta: the same function. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>;
    /** Another name of getStreamSyncedMetaKeys: the same function. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored, as this host keeps them. */
    getStreamSyncedMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomVehicleSyncedMeta, K, any>;
    /** Another name of getSyncedMeta: the same function. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomVehicleSyncedMeta, K, any>;
    /** Another name of getSyncedMetaKeys: the same function. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Index must be an integer from 0 to 7. -1 is no limit, GTA's default for every slot. */
    getWeaponCapacity(index: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelCamber(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. 1000 (whole, as GTA starts a wheel) until a client that has the car reports it or a script sets it. */
    getWheelHealth(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelHeight(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelRimRadius(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelTrackWidth(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelTyreRadius(wheel: number): number;
    /** Wheel index must be an integer from 0 to 7. */
    getWheelTyreWidth(wheel: number): number;
    /** Whether its handbrake is on, as its owner's client reports it: whether the player who drives it holds the handbrake control (false for a vehicle nobody of that client drives). Assigning sets it on the clients that have it (SET_VEHICLE_HANDBRAKE) until the owner's next sync reports it again. */
    handbrakeActive: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. */
    readonly hasArmoredWindows: boolean;
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key, as this host keeps them. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Another name of hasStreamSyncedMeta: the same function. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Another name of hasSyncedMeta: the same function. */
    hasSyncedMetaData(key: string): boolean;
    /** True after setTimedExplosion(true, ...) until it is set false; the server holds it, its owner does not report it. */
    readonly hasTimedExplosion: boolean;
    /** Requires a finite value, clamped to 0..255 and truncated to an integer. */
    headlightColor: number;
    /** Main rotor health as its owner reports it, 1000 by default. The server takes only lower values from the owner; repair() sets it back to 1000. A vehicle that is no helicopter reads 0 once its owner synced. */
    readonly heliMainRotorHealth: number;
    /** Tail rotor health as its owner reports it, 1000 by default. The server takes only lower values from the owner; repair() sets it back to 1000. A vehicle that is no helicopter reads 0 once its owner synced. */
    readonly heliTailRotorHealth: number;
    /** Whether its horn sounds, as the server holds it; assigning true makes the other clients that have it sound the horn in short pulses until it is false. */
    hornActive: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Only the server's record: no client applies it to GTA. */
    hybridExtraActive: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to -2147483648..2147483647 and truncated to an integer. Only the server's record: no client applies it to GTA. */
    hybridExtraState: number;
    /** Its network id, which clients know it by; after it is removed, a new entity may get the same id. */
    readonly id: number;
    /** Its turn indicators: 0 off, 1 left, 2 right, 3 both (hazard lights), as VehicleIndicatorLights.BlinkLeft and BlinkRight. GTA does not send them, Varion does: every player whose GTA has the car sees the same blink. Its owner's client reports what the car shows (its driver, a client script, GTA's driving task); assigning sets it on every copy at once, the owner's included. Anything but 0..3 throws a RangeError. */
    indicatorLights: number;
    /** Interior palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    interiorColor: number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    isLightDamaged(index: number): boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Whether it is a mission train, false by default. Only the server's record: no client applies it to GTA, where a train is a mission train from its creation (CREATE_MISSION_TRAIN). */
    isMissionTrain: boolean;
    /** Whether a custom primary colour is set (customPrimaryColor). */
    readonly isPrimaryColorRGB: boolean;
    /** Whether a custom secondary colour is set (customSecondaryColor). */
    readonly isSecondaryColorRGB: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    isSpecialLightDamaged(index: number): boolean;
    /** A vehicle of the old path (varion.createVehicle) with no owner and no migration: the server alone places it, a static entity. Assigning true takes its owner away for good (resetNetOwner(true)), false lets the nearest player own it again. An owner kept with setNetOwner(player, true) is not static. */
    isStaticEntity: boolean;
    /** Whether the toggle mod of slot 0..49 is on (turbo 18, tyre smoke 20, xenon 22) by the server's record (toggleMod, or its owner's report); false when unknown. A slot outside 0..49 throws a RangeError. */
    isToggleModOn(slot: number): boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Whether it is the last carriage of a train, false by default. Only the server's record: no client applies it to GTA, which fixes a train's carriages when it creates it. */
    isTrainCaboose: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Whether it is a train's engine, false by default. Only the server's record: no client applies it to GTA, which fixes a train's carriages when it creates it. */
    isTrainEngine: boolean;
    /** Whether the tyre of wheel 0..7 is burst: its owner's GTA or setWheelBurst bursts one, and only setWheelBurst(wheel, false), setWheelFixed or repair() fix it. A wheel outside 0..7 throws a RangeError. */
    isWheelBurst(wheel: number): boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    isWheelDetached(index: number): boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    isWheelOnFire(index: number): boolean;
    /** Whether window 0..7 is smashed by the server's record, which only setWindowDamaged and repair() change (a window broken in GTA does not). A window outside 0..7 throws a RangeError. */
    isWindowDamaged(window: number): boolean;
    /** Whether window 0..7 is rolled down by the server's record, which only setWindowOpened and repair() change. A window outside 0..7 throws a RangeError. */
    isWindowOpened(window: number): boolean;
    /** Always "vehicle", a native vehicle's too. */
    readonly kind: "vehicle";
    /** Landing gear state 0..4 as its owner reports it (GET_LANDING_GEAR_STATE); 0 for a vehicle without landing gear or until reported. */
    readonly landingGearState: number;
    /** Requires a finite value, clamped to 0..100 with float32 precision. */
    lightsMultiplier: number;
    /** Requires a finite value, clamped to 0..255 and truncated to an integer. */
    lightState: number;
    /** Livery index, -1 for none (the default); assigning sends it to the clients that have it (a negative value is none, the server caps others at 254). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    livery: number;
    /** Requires a finite value, clamped to 0..10 and truncated to an integer. */
    lockState: number;
    /** The server's record only (false by default): no client applies it. Only scripts change it: an owner's sync keeps it. */
    manualEngineControl: boolean;
    /** Its model hash. Assigning a name (hashed) or a 32-bit hash makes the clients that have it get it anew with the new model; an empty name or a non-integer throws a TypeError, 0 a RangeError, and nothing changes. */
    get model(): number;
    set model(value: number | string);
    /** Mod kit index, 0 by default, -1 for none; assigning sends it to the clients that have it (a negative value is none, the server caps others at 255). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    modKit: number;
    /** How many mod kits its model has (GET_NUM_MOD_KITS on its owner's client, at most 2); 0 until reported. */
    readonly modKitsCount: number;
    /** Its neon tubes as { left, right, front, back } by the server's record, a copy. Assigning takes that object (a side it leaves out keeps its state; an array of four in GTA's order left, right, front, back is taken too) and sends each to the clients that have it. */
    get neon(): { left: boolean; right: boolean; front: boolean; back: boolean };
    set neon(value: { left?: boolean; right?: boolean; front?: boolean; back?: boolean } | boolean[]);
    /** Neon colour, white by default, alpha 255. Assigning {r, g, b} (each clamped to 0..255 and rounded; a missing one is 0) sends it to the clients that have it. */
    get neonColor(): RGBA;
    set neonColor(value: RGBALike);
    /** The player whose client simulates it, by the server's last record; null with none. It changes when the server hands it over (netOwnerChange; setNetOwner does not change it before that) and at once with resetNetOwner. */
    readonly netOwner: Player | null;
    /** True while a script keeps its owner from changing (setNetOwner or resetNetOwner with disableMigration), by the server's record. */
    readonly netOwnershipDisabled: boolean;
    /** Whether its high beams are on, as its owner reports them; assigning sets them on the clients that have it (SET_VEHICLE_FULLBEAM) until the owner's next sync. */
    nightlightOn: boolean;
    /** Number plate style, -1 by default; assigning sends it to the clients that have it (a negative value is none, the server caps others at 255). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    numberPlateIndex: number;
    /** Its plate text, up to 8 characters. Assigning cuts the text to 8 (null or undefined is empty, 0 is "0"), and the server turns characters outside printable ASCII into "?". */
    numberPlateText: string;
    /** Seat -> player for every occupied seat, the driver (seat 1) included. */
    readonly passengers: IVehiclePassenger;
    /** Pearlescent palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    pearlColor: number;
    /** Requires a finite value, clamped to -1000..1000 and truncated to an integer. */
    petrolTankHealth: number;
    /** Its position as the server last synced it. Assigning moves it on the server and every client; a component that is not a finite number throws a TypeError, and one beyond 100000 m a RangeError; nothing moves then. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Primary palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    primaryColor: number;
    /** Its rotation as a quaternion, computed from rot (degrees). Assigning converts the quaternion (normalised; a zero one is no rotation) to degrees and assigns rot. */
    get quaternion(): Quaternion;
    set quaternion(value: { x: number; y: number; z: number; w: number });
    /** The rear wheel part (mod slot 24) as its owner reports it: 0 for stock or unknown, GTA's mod n is n + 1; setMod(24, ...) and setRearWheels change it too. */
    readonly rearWheels: number;
    /** Fixes it on every client that has it (SET_VEHICLE_FIXED) and in the server's state: health 1000, doors shut, tyres, wheels, lights and bodywork whole, windows whole and up. repairsCount goes up (at most 255), and damage its owner reports in the next 1.5 s is ignored. */
    repair(): void;
    /** How many times repair() fixed it, at most 255; the server counts it. */
    readonly repairsCount: number;
    /** Takes its owner away: without disableMigration the ordinary hand-overs give it to a player again, with it the server alone places it. netOwner reads null at once; a removed entity is ignored. */
    resetNetOwner(disableMigration?: boolean): void;
    /** Requires a finite value, clamped to 0..10000 with float32 precision. */
    rocketRefuelSpeed: number;
    /** Whether its convertible roof is up, by the server's record (false by default); assigning raises or lowers it on the clients that have it. Only scripts change it: an owner's sync keeps it. */
    roofClosed: boolean;
    /** Roof livery index, -1 for none (the default); assigning sends it to the clients that have it (a negative value is none, the server caps others at 255). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    roofLivery: number;
    /** The same as roofClosed: reading gives it, assigning assigns it. */
    roofState: boolean;
    /** Its rotation in radians, as the server last synced it. Assigning sets it on the server and the clients that have it: non-finite components become 0, and the server ignores a rotation with a component beyond 36000. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** The same as rot (radians): reading gives rot, assigning assigns it. */
    get rotation(): Vector3;
    set rotation(value: Vector3Like);
    /** Engine rpm 0..1 as its owner reports it; 0 until reported. */
    readonly rpm: number;
    /** Requires a finite value, clamped to 0..10000 with float32 precision. */
    scriptMaxSpeed: number;
    /** Secondary palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    secondaryColor: number;
    /** Applies what getAppearanceDataBase64 returned through the setters, each of which may throw as it would; invalid base64 or JSON, or a payload of another kind, throws a TypeError. */
    setAppearanceDataBase64(data: string): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. Finite values are clamped to 0..65535 and truncated. */
    setArmoredWindowHealth(index: number, value: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. Finite values are clamped to 0..255 and truncated. */
    setArmoredWindowShootCount(index: number, value: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 1. Finite values are clamped to 0..2 and truncated. */
    setBumperDamageLevel(index: number, value: number): void;
    /** Applies what getDamageStatusBase64 returned through the setters; invalid base64 or JSON, or a payload of another kind, throws a TypeError. Armoured window values are applied only from a vehicle with armoured windows (they then mark this one as having them); an older payload without that flag counts as such with a value above zero. */
    setDamageStatusBase64(data: string): void;
    /** Takes a VehicleDoorState number (0 shuts, 1..7 opens, 255 changes nothing) or a boolean, and opens (SET_VEHICLE_DOOR_OPEN) or shuts door 0..7 on every client that has it. getDoorState reads the level back, but clients open the door fully for any level: the wire carries open or shut alone. A door outside 0..7 throws a RangeError. */
    setDoorState(door: number, state: number | boolean): void;
    /** Turns extra 0..15 on or off on every client that has it, and for those that get it later. Outside 0..15 throws a RangeError. */
    setExtra(extraId: number, enabled: boolean): void;
    /** Applies what getGamestateDataBase64 returned through the setters, each of which may throw as it would; invalid base64 or JSON, or a payload of another kind, throws a TypeError. */
    setGamestateDataBase64(data: string): void;
    /** Applies what getHealthDataBase64 returned through the setters, each of which may throw as it would (the tyre, detached and fire masks go to all 8 wheels); invalid base64 or JSON, or a payload of another kind, throws a TypeError. */
    setHealthDataBase64(data: string): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    setLightDamaged(index: number, state: boolean): void;
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomVehicleMeta, any>): void;
    /** Sets the part of slot 0..49 on every client that has it: 0 is stock and n is GTA's mod n - 1; 0..255, clamped and truncated. A slot outside 0..49 throws a RangeError, a non-finite value a TypeError. */
    setMod(slot: number, value: number): void;
    /** Asks the server to make the player its owner; with disableMigration it then stays with that player. Returns nothing: netOwner and netOwnershipDisabled change when the server hands it over (netOwnerChange), at once for the player who owns it already, and not at all when the server passes the player over (out of range, another dimension, not spawned, dead). Throws for a removed entity or an invalid player. */
    setNetOwner(player: Player, disableMigration?: boolean): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 5. Finite values are clamped to 0..255 and truncated. */
    setPartBulletHoles(index: number, value: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 5. Finite values are clamped to 0..3 and truncated. */
    setPartDamageLevel(index: number, value: number): void;
    /** setMod(24, wheelId): the rear wheel part, 0 for stock, GTA's mod n is n + 1; wheelId is truncated to an integer. */
    setRearWheels(wheelId: number): void;
    /** Applies what getScriptDataBase64 returned through the setters, each of which may throw as it would; invalid base64 or JSON, or a payload of another kind, throws a TypeError. */
    setScriptDataBase64(data: string): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Turns its searchlight on or off on the clients that have it (SET_VEHICLE_SEARCHLIGHT). The entity must be valid or null (else a TypeError; a native one too) but is not used: GTA's searchlight takes no target, so the light is not aimed at it. */
    setSearchLightTo(entity: Player | Vehicle | Ped | Object | null, state: boolean): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. */
    setSpecialLightDamaged(index: number, state: boolean): void;
    /** Stream-synced metadata the clients that have it streamed in get (getStreamSyncedMeta there); streamSyncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomVehicleStreamSyncedMeta, any>): void;
    /** Another name of setStreamSyncedMeta: the same function. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomVehicleStreamSyncedMeta, any>): void;
    /** Synced metadata every connected client gets (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the entity is gone only this host's copy changes. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomVehicleSyncedMeta, any>): void;
    /** Another name of setSyncedMeta: the same function. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomVehicleSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomVehicleSyncedMeta, any>): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Enabling requires a valid player. Finite time is clamped to 0..4294967295 and truncated. Applying the configured delay in GTA remains partial. */
    setTimedExplosion(state: boolean, culprit?: Player | null, time?: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Names its train's engine in the server's record: a valid old-path vehicle (else a TypeError; a native one too) or null. Takes a vehicle despite the name; no client applies it, as GTA links carriages only when it creates a train. */
    setTrainEngineId(vehicle: Vehicle | null): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Names the carriage behind it in the server's record: a valid old-path vehicle (else a TypeError; a native one too) or null. Takes a vehicle despite the name; no client applies it, as GTA links carriages only when it creates a train. */
    setTrainLinkedToBackwardId(vehicle: Vehicle | null): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Names the carriage in front of it in the server's record: a valid old-path vehicle (else a TypeError; a native one too) or null. Takes a vehicle despite the name; no client applies it, as GTA links carriages only when it creates a train. */
    setTrainLinkedToForwardId(vehicle: Vehicle | null): void;
    /** Index must be an integer from 0 to 7. A value below 0 is -1, no limit; others are clamped to 0..65534 and truncated. */
    setWeaponCapacity(index: number, value: number): void;
    /** Bursts the tyre of wheel 0..7 to the rim (SET_VEHICLE_TYRE_BURST) on every client that has it, or with burst false fixes it; burst defaults to true. A wheel outside 0..7 throws a RangeError. */
    setWheelBurst(wheel: number, burst?: boolean): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to -10..10 and stored as float32. */
    setWheelCamber(wheel: number, value: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. A client that has the car breaks the wheel off its copy with GTA’s own break-off (alight if setWheelOnFire says so); GTA cannot put a wheel back, so false only changes the server’s record. */
    setWheelDetached(index: number, state: boolean): void;
    /** GTA's SET_VEHICLE_TYRE_FIXED for wheel 0..7: setWheelBurst(wheel, false) and setWheelHasTire(wheel, true). Wheel health, fire and a detached wheel stay as they are; repair() restores those. */
    setWheelFixed(wheel: number): void;
    /** Index must be an integer from 0 to 7. */
    setWheelHasTire(index: number, state: boolean): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to -100000..100000 and stored as float32. */
    setWheelHealth(wheel: number, value: number): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to -10..10 and stored as float32. */
    setWheelHeight(wheel: number, value: number): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Index must be an integer from 0 to 7. A client sets the wheel alight only as it breaks off (setWheelDetached); GTA has no fire for a wheel that stays on. */
    setWheelOnFire(index: number, state: boolean): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to 0..10 and stored as float32. */
    setWheelRimRadius(wheel: number, value: number): void;
    /** Sets wheelType and the front wheel part (setMod(23, wheelId): 0 for stock, GTA's mod n is n + 1); both are truncated to integers. */
    setWheels(wheelType: number, wheelId: number): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to -10..10 and stored as float32. */
    setWheelTrackWidth(wheel: number, value: number): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to 0..10 and stored as float32. */
    setWheelTyreRadius(wheel: number, value: number): void;
    /** Wheel index must be an integer from 0 to 7. Finite values are clamped to 0..10 and stored as float32. */
    setWheelTyreWidth(wheel: number, value: number): void;
    /** Smashes window 0..7 (SMASH_VEHICLE_WINDOW) on every client that has it, or with false repairs it (FIX_VEHICLE_WINDOW); damaged defaults to true. A window outside 0..7 throws a RangeError. */
    setWindowDamaged(window: number, damaged?: boolean): void;
    /** Rolls window 0..7 down (ROLL_DOWN_WINDOW) on every client that has it, or with false up again (ROLL_UP_WINDOW); opened defaults to true. A window outside 0..7 throws a RangeError. */
    setWindowOpened(window: number, opened?: boolean): void;
    /** Whether its siren is on, as its owner reports it (IS_VEHICLE_SIREN_ON); assigning sets it on the clients that have it (SET_VEHICLE_SIREN) until the owner's next sync. */
    sirenActive: boolean;
    /** Requires a finite value, clamped to -180..180 with float32 precision. */
    steeringAngle: number;
    /** Whether clients may have it at all (true by default). Assigning false takes it from every client, puts its occupants out and takes its owner away; true lets clients in range get it again; an equal value sends nothing. */
    streamed: boolean;
    /** Metres within which clients get it; 0 (the default) is the server's distance. Assigning is clamped to 0..20000 with the fraction dropped; an equal value sends nothing. */
    streamingDistance: number;
    /** The player setTimedExplosion named, while connected; null for none. */
    readonly timedExplosionCulprit: Player | null;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. */
    readonly timedExplosionTime: number;
    /** The server's time in milliseconds (unsigned 32-bit) of the last state the host got for it; 0 until the first one. */
    readonly timestamp: number;
    /** Tyre smoke colour, white by default, alpha 255. Assigning {r, g, b} (each clamped to 0..255 and rounded; a missing one is 0) sends it to the clients that have it. */
    get tireSmokeColor(): RGBA;
    set tireSmokeColor(value: RGBALike);
    /** Turns the toggle mod of slot 0..49 on or off on every client that has it (turbo 18, tyre smoke 20, xenon 22). A slot outside 0..49 throws a RangeError. */
    toggleMod(slot: number, enabled: boolean): void;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to 0..255 and truncated to an integer. */
    trainCarriageConfigIndex: number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to 1..25 and truncated to an integer. */
    trainConfigIndex: number;
    /** Requires a finite value, clamped to -1000..1000 with float32 precision. */
    trainCruiseSpeed: number;
    /** The server's record (false by default); while it is true, clients apply trainCruiseSpeed as a negative speed. */
    trainDirection: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to -3.4028234663852886e+38..3.4028234663852886e+38 with float32 precision. */
    trainDistanceFromEngine: number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. The vehicle setTrainEngineId named as its train's engine, while it is a valid vehicle; null for none. Despite the name a Vehicle, not an id; only the server's record, no client applies it. */
    readonly trainEngineId: Vehicle | null;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Whether its train doors are forced open, false by default. Only the server's record: no client applies it to GTA. */
    trainForceDoorsOpen: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. The vehicle setTrainLinkedToBackwardId named as the carriage behind it, while it is a valid vehicle; null for none. Despite the name a Vehicle, not an id; only the server's record, no client applies it. */
    readonly trainLinkedToBackwardId: Vehicle | null;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. The vehicle setTrainLinkedToForwardId named as the carriage in front of it, while it is a valid vehicle; null for none. Despite the name a Vehicle, not an id; only the server's record, no client applies it. */
    readonly trainLinkedToForwardId: Vehicle | null;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Whether it has passenger carriages, false by default. Only the server's record: no client applies it to GTA. */
    trainPassengerCarriages: boolean;
    /** Whether clients draw it as a derailed train (SET_RENDER_TRAIN_AS_DERAILED), by the server's record; false by default. */
    trainRenderDerailed: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. Requires a finite value, clamped to 0..11 and truncated to an integer. It is kept and read back, but clients do not move the train to that track: GTA has no native for it, and SWITCH_TRAIN_TRACK would switch the track for the whole world. */
    trainTrackId: number;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. An unnamed train flag, false by default. Only the server's record: no client applies it to GTA. */
    trainUnk1: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. An unnamed train flag, false by default. Only the server's record: no client applies it to GTA. */
    trainUnk2: boolean;
    /** Partially implemented in VARION; some behavior is not applied or reported by the runtime. An unnamed train flag, false by default. Only the server's record: no client applies it to GTA. */
    trainUnk3: boolean;
    /** BaseObjectType.Vehicle (1), a native vehicle's too. */
    readonly type: number;
    /** False from destroy() on, and once the server removed it. Its setters and methods throw then: its id may name another entity already. Once removed every member but valid and id throws "Invalid base object". */
    readonly valid: boolean;
    /** Its velocity as its owner's GTA reports it (GET_ENTITY_VELOCITY). Assigning: non-finite components become 0, the server clamps each to -500..500, and the clients that have it apply it (SET_ENTITY_VELOCITY) until its owner's next sync. */
    get velocity(): Vector3;
    set velocity(value: Vector3Like);
    /** Whether clients show it, by the server's record (true by default); assigning sends it to the clients that have it, and throws for a removed one. */
    visible: boolean;
    /** Wheel palette colour; assigning sends it to the clients that have it, the server clamping it to 0..255 (the fraction is dropped). It reads back clamped to 0..255, as the server keeps it. */
    wheelColor: number;
    /** How many wheels it has, at most 8, as its owner's client reads them from GTA; 0 until reported. A per-wheel setter does not change it. */
    readonly wheelsCount: number;
    /** Wheel type, -1 by default; assigning sends it to the clients that have it (a negative value is none, the server caps others at 255). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    wheelType: number;
    /** Window tint index, -1 for none (the default); assigning sends it to the clients that have it (a negative value is none, the server caps others at 255). It reads back as the server keeps it: -1 for a negative value, others capped at 254. */
    windowTint: number;
}

export const VehicleBumper: {
    readonly "0": any;
    readonly "1": any;
    readonly Front: any;
    readonly Rear: any;
};

export const VehicleBumperDamage: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly Damaged: any;
    readonly None: any;
    readonly NotDamaged: any;
};

export const VehicleDoor: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly DriverFront: any;
    readonly DriverRear: any;
    readonly Hood: any;
    readonly PassengerFront: any;
    readonly PassengerRear: any;
    readonly Trunk: any;
};

export const VehicleDoorState: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "255": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly Closed: any;
    readonly OpenedLevel1: any;
    readonly OpenedLevel2: any;
    readonly OpenedLevel3: any;
    readonly OpenedLevel4: any;
    readonly OpenedLevel5: any;
    readonly OpenedLevel6: any;
    readonly OpenedLevel7: any;
    readonly Unknown: any;
};

export const VehicleLockState: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly ForceDoorsShut: any;
    readonly InitiallyLocked: any;
    readonly Locked: any;
    readonly LockedCanBeDamaged: any;
    readonly LockoutPlayerOnly: any;
    readonly LockPlayerInside: any;
    readonly None: any;
    readonly Unlocked: any;
};

export const VehicleModType: {
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
    readonly "18": any;
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
    readonly "29": any;
    readonly "3": any;
    readonly "30": any;
    readonly "31": any;
    readonly "32": any;
    readonly "33": any;
    readonly "34": any;
    readonly "35": any;
    readonly "36": any;
    readonly "37": any;
    readonly "38": any;
    readonly "39": any;
    readonly "4": any;
    readonly "40": any;
    readonly "41": any;
    readonly "42": any;
    readonly "43": any;
    readonly "44": any;
    readonly "45": any;
    readonly "46": any;
    readonly "47": any;
    readonly "48": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
    readonly Aerials: any;
    readonly AirFilter: any;
    readonly ArchCover: any;
    readonly Armor: any;
    readonly BackWheels: any;
    readonly Brakes: any;
    readonly ColumnShifterLeavers: any;
    readonly Dashboard: any;
    readonly Dial: any;
    readonly DoorSpeaker: any;
    readonly Engine: any;
    readonly EngineBlock: any;
    readonly Exhaust: any;
    readonly Fender: any;
    readonly Frame: any;
    readonly FrontBumper: any;
    readonly FrontWheels: any;
    readonly Grille: any;
    readonly Hood: any;
    readonly Horn: any;
    readonly Hydraulics: any;
    readonly Livery: any;
    readonly Ornaments: any;
    readonly Plaques: any;
    readonly Plateholder: any;
    readonly RearBumper: any;
    readonly RightFender: any;
    readonly Roof: any;
    readonly Seats: any;
    readonly SideSkirt: any;
    readonly Speakers: any;
    readonly Spoiler: any;
    readonly SteeringWheel: any;
    readonly Struts: any;
    readonly Suspension: any;
    readonly Tank: any;
    readonly TireSmoke: any;
    readonly Transmission: any;
    readonly Trim: any;
    readonly TrimDesign: any;
    readonly Trunk: any;
    readonly Turbo: any;
    readonly Unk1: any;
    readonly Unk2: any;
    readonly Unk3: any;
    readonly Unk4: any;
    readonly VanityPlates: any;
    readonly Windows: any;
    readonly XenonLights: any;
};

export const VehicleModelInfo: {
    /** A vehicle of the built-in GTA catalog by hash or name (hashed): its ModelType, default colours, mod kits, extras as bit masks (extra ids 1–31), bones and handling hash. Throws Error for a model the catalog lacks, add-on vehicles included. */
    get(model: number | string): { readonly model: number; readonly modelHash: number; readonly title: string; readonly modelType: number; readonly wheelsCount: number; readonly hasArmoredWindows: boolean; readonly primaryColor: number; readonly secondaryColor: number; readonly pearlColor: number; readonly wheelsColor: number; readonly interiorColor: number; readonly dashboardColor: number; readonly modkits: readonly [boolean, boolean]; readonly extras: number; readonly defaultExtras: number; readonly hasAutoAttachTrailer: boolean; readonly bones: ReadonlyArray<IBoneInfo>; readonly canAttachCars: boolean; readonly handlingNameHash: number; doesExtraExist(extraId: number): boolean; isExtraDefault(extraId: number): boolean };
    /** Not what the server loaded: the model hashes of every vehicle in the built-in catalog of GTA's own vehicles, sorted ascending; the same frozen array on each read. Add-on vehicles of server packs are not in it. */
    readonly loadedVehicleModels: ReadonlyArray<number>;
};

export const VehiclePart: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly FrontLeft: any;
    readonly FrontRight: any;
    readonly MiddleLeft: any;
    readonly MiddleRight: any;
    readonly RearLeft: any;
    readonly RearRight: any;
};

export const VehiclePartDamage: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly DamagedLevel1: any;
    readonly DamagedLevel2: any;
    readonly DamagedLevel3: any;
    readonly NotDamaged: any;
};

export class VirtualEntity {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid virtual entity of every resource; a new array on each read. */
    static readonly all: VirtualEntity[];
    /** How many virtual entities VirtualEntity.all holds now. */
    static readonly count: number;
    /** The valid virtual entity with that id; null for none. */
    static getByID(id: number): VirtualEntity | null;
    /** Always false: the server attaches players, vehicles, peds and objects only. */
    readonly attached: boolean;
    /** Always null: the server attaches players, vehicles, peds and objects only. */
    readonly attachedTo: Player | Vehicle | Ped | Object | null;
    /** Rejects at once with an Error, without asking the server: it attaches players, vehicles, peds and objects only. */
    attachTo(parent: Entity, boneIndex?: number, offset?: Vector3Like, rotation?: Vector3Like, useSoftPinning?: boolean, collision?: boolean, fixedRotation?: boolean): Promise<boolean>;
    attachTo(parent: Entity, entityBone: number, ownBone: number, pos: Vector3Like, rot: Vector3Like, enableCollisions: boolean, noFixedRotation: boolean): Promise<boolean>;
    /** Kept on the server only, false for a virtual entity: clients do not use it. A destroyed entity throws. */
    collision: boolean;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the stream-synced key here and on the clients: true, and streamSyncedMetaChange fires with the value undefined; false when it was not there. On a destroyed entity only this host's copy goes. */
    deleteStreamSyncedMeta(key: string): boolean;
    /** Removes the stream-synced key here and on the clients: true, and streamSyncedMetaChange fires with the value undefined; false when it was not there. On a destroyed entity only this host's copy goes. The same function as deleteStreamSyncedMeta. */
    deleteStreamSyncedMetaData(key: string): boolean;
    /** Removes the synced key here and on the clients: true, and syncedMetaChange fires with the value undefined; false when it was not there. On a destroyed entity only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the synced key here and on the clients: true, and syncedMetaChange fires with the value undefined; false when it was not there. On a destroyed entity only this host's copy goes. The same function as deleteSyncedMeta. */
    deleteSyncedMetaData(key: string): boolean;
    /** Removes it for everyone and resolves true once the server took the removal; valid is false from the call on, and removeEntity and baseObjectRemove follow. While the server's removal queue is full it resolves false and the entity is valid again; a second call, or one on a removed entity, resolves false. */
    destroy(): Promise<boolean>;
    /** Resolves false at once: a virtual entity is never attached. */
    detach(): Promise<boolean>;
    /** Players whose dimension sees it stream it: those in the same dimension, everyone for -2147483648, and a player in a negative dimension also sees dimension 0. Assigning needs a 32-bit integer (RangeError otherwise; truncated), and a destroyed entity throws. */
    dimension: number;
    /** Kept on the server only, false by default: a virtual entity has nothing to freeze and clients do not use it. A destroyed entity throws. */
    frozen: boolean;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value under the key: the script's own until the server confirms it, then the copy as sent (an entity as a reference object, a Vector3 or RGBA as one); undefined for none. */
    getStreamSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomVirtualEntityStreamSyncedMeta, K, any>;
    /** The value under the key: the script's own until the server confirms it, then the copy as sent (an entity as a reference object, a Vector3 or RGBA as one); undefined for none. The same function as getStreamSyncedMeta. */
    getStreamSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomVirtualEntityStreamSyncedMeta, K, any>;
    /** The keys setStreamSyncedMeta stored. The same function as getStreamSyncedMetaKeys. */
    getStreamSyncedMetaDataKeys(): string[];
    /** The keys setStreamSyncedMeta stored. */
    getStreamSyncedMetaKeys(): string[];
    /** The value under the key: the script's own until the server confirms it, then the copy as sent (an entity as a reference object, a Vector3 or RGBA as one); undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The value under the key: the script's own until the server confirms it, then the copy as sent (an entity as a reference object, a Vector3 or RGBA as one); undefined for none. The same function as getSyncedMeta. */
    getSyncedMetaData<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. The same function as getSyncedMetaKeys. */
    getSyncedMetaDataKeys(): string[];
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** The group it was created in. */
    readonly group: VirtualEntityGroup;
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key. */
    hasStreamSyncedMeta(key: string): boolean;
    /** Whether setStreamSyncedMeta stored a value under the key. The same function as hasStreamSyncedMeta. */
    hasStreamSyncedMetaData(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. The same function as hasSyncedMeta. */
    hasSyncedMetaData(key: string): boolean;
    /** Its network id, from the range players, vehicles, peds and objects share; the server may give it to another entity once this one is gone. */
    readonly id: number;
    /** Always "virtualEntity". */
    readonly kind: "virtualEntity";
    /** A model hash kept on the server, 0 by default; clients never get it. Assigning takes a name (hashed as varion.hash) or a hash; 0, an empty name or another type throws. Players who have the entity streamed in keep it. */
    get model(): number;
    set model(value: number | string);
    /** Always null: the server gives a virtual entity no owner, and setNetOwner does not change it. */
    readonly netOwner: Player | null;
    /** Always false: the server keeps no owner for a virtual entity, and setNetOwner and resetNetOwner do not change it. */
    readonly netOwnershipDisabled: boolean;
    /** Its position. Assigning moves it on the server and for the players who have it streamed in; a non-finite component throws a TypeError, a destroyed entity throws, and a component beyond 100000 m is ignored by the server. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Does nothing and sends nothing: the server gives a virtual entity no owner. */
    resetNetOwner(disableMigration?: boolean): void;
    /** Rotation in degrees, data for client scripts (a virtual entity has no GTA entity). Assigning sends it to the players who have it streamed in; a non-finite component becomes 0, one beyond 36000 is ignored by the server, and a destroyed entity throws. */
    get rot(): Vector3;
    set rot(value: Vector3Like);
    /** The same as rot. */
    get rotation(): Vector3;
    set rotation(value: Vector3Like);
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Changes nothing and sends nothing: the server gives a virtual entity no owner. Throws an Error for a destroyed entity and a TypeError for a player who is not connected. */
    setNetOwner(player: Player, disableMigration?: boolean): void;
    /** Metadata the players who have it streamed in get (getStreamSyncedMeta, streamSyncedMetaChange there); one that streams it in later gets it then. streamSyncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent; on a destroyed entity only this host's copy changes. */
    setStreamSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVirtualEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMeta(values: CustomMetaValues<ICustomVirtualEntityStreamSyncedMeta, any>): void;
    /** Metadata the players who have it streamed in get (getStreamSyncedMeta, streamSyncedMetaChange there); one that streams it in later gets it then. streamSyncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent; on a destroyed entity only this host's copy changes. The same function as setStreamSyncedMeta. */
    setStreamSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomVirtualEntityStreamSyncedMeta, K, any>): void;
    setStreamSyncedMetaData(values: CustomMetaValues<ICustomVirtualEntityStreamSyncedMeta, any>): void;
    /** Metadata the server sends to every connected client; one that streams it in later gets it then. syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent; on a destroyed entity only this host's copy changes. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Metadata the server sends to every connected client; one that streams it in later gets it then. syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent; on a destroyed entity only this host's copy changes. The same function as setSyncedMeta. */
    setSyncedMetaData<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMetaData(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Always true for a virtual entity: it does not tell whether any player has it streamed in. */
    readonly streamed: boolean;
    /** Its streaming distance in metres as created: 1 up to its group's maxStreamingDistance, 1 when not given. A player whose dimension sees it streams it within that 3D distance, up to the group's per-player limit. */
    readonly streamingDistance: number;
    /** Always 0 for a virtual entity: no state update carries one. */
    readonly timestamp: number;
    /** BaseObjectType.VirtualEntity (20). */
    readonly type: number;
    /** False from destroy() on and once the server removed it (its group destroyed, its resource stopped); true again if the server refused the removal. */
    readonly valid: boolean;
    /** A flag client scripts read (visible there), true by default; a virtual entity has nothing to show or hide. A change reaches the players who have it streamed in at once, and later ones when they stream it in. A destroyed entity throws. */
    visible: boolean;
}

export class VirtualEntityGroup {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid virtual entity group of every resource; a new array on each read. */
    static readonly all: VirtualEntityGroup[];
    /** How many groups VirtualEntityGroup.all holds now. */
    static readonly count: number;
    /** The group with that id while it is valid; null for none. */
    static getByID(id: number): VirtualEntityGroup | null;
    /** Removes the key: true, and metaChange fires with the value undefined; false when it was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the key: true, and syncedMetaChange fires with the value undefined; false when it was not there. No client is involved. */
    deleteSyncedMeta(key: string): boolean;
    /** Destroys every virtual entity in it (each through its destroy()) and then the group; valid turns false and baseObjectRemove fires. Later calls do nothing; a resource's groups go when it stops. */
    destroy(): void;
    /** The value setMeta stored under the key; undefined for none. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys setMeta stored, as getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys setMeta stored, as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script gave it; undefined for none. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored. */
    getSyncedMetaKeys(): string[];
    /** Whether setMeta stored a value under the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key. */
    hasSyncedMeta(key: string): boolean;
    /** Its group id from the server; ids are not reused while the server runs. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** Always "virtualEntityGroup". */
    readonly kind: "virtualEntityGroup";
    /** How many of its entities one player streams at most: the number asked for at creation (truncated, 1 when not given), kept to 1–512, the server's cap per group; by default a player streams at most 1024 virtual entities over all groups. */
    readonly maxEntitiesInStream: number;
    /** The largest streaming distance of its entities in metres: 1..20000, truncated, 20000 by default; createVirtualEntity caps an entity's distance by it. */
    readonly maxStreamingDistance: number;
    /** Stores the value under the key in this host's own metadata, which no client sees; an object sets each of its keys. metaChange fires when a value changes. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Kept on this host only: no client gets it; syncedMetaChange fires here and an object sets each of its keys. Throws a RangeError for a key outside 1..1024 UTF-8 bytes or a value over 512 KiB as JSON, a TypeError for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.VirtualEntityGroup (21). */
    readonly type: number;
    /** True until destroy() or until the resource that made it stops. */
    readonly valid: boolean;
}

export class VoiceChannel {
    /** Creates a voice channel of the resource for the players added with `addPlayer`; a spatial one (`isSpatial` true) has a range of `maxDistance` metres (50 when that is not a positive number), a non-spatial one 0. Outside a resource it throws an `Error`; it is removed when the resource stops. */
    constructor(isSpatial?: boolean, maxDistance?: number);
    /** Every live voice channel, of any resource; a new array on each read. */
    static readonly all: VoiceChannel[];
    /** How many live voice channels there are. */
    static readonly count: number;
    /** The live channel with this id (of any resource), or null. */
    static getByID(id: number): VoiceChannel | null;
    /** Adds a player (or the id 1–65534 of a connected player) to the channel; nothing for a destroyed channel, a member, an id no connected player has or a player already in 32 channels of this host, whom the server refuses too. A Player who left throws "Invalid base object": their id may already be the next player's. */
    addPlayer(player: Player | number): void;
    /** Removes a key of its own metadata; false when it was not set. metaChange fires with value undefined. */
    deleteMeta(key: string): boolean;
    /** Removes a key setSyncedMeta set; false when it was not set. syncedMetaChange fires with value undefined. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes the channel for every member; baseObjectRemove fires. After it every member but valid throws "Invalid base object" (destroy again too). */
    destroy(): void;
    /** The audio filter members hear the channel through, as a hash (0: none); assigning takes a name (hashed: 'walkietalkie', 'phone', 'underwater') or a hash. On a client whose scripts gave an AudioFilter of that name effects, those shape the voice instead. Ignored after destroy. */
    get filter(): number;
    set filter(value: number | string);
    /** A value of its own metadata; undefined when unset. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomVoiceChannelMeta, K, any>;
    /** Another name for getMetaKeys. */
    getMetaDataKeys(): string[];
    /** The keys of its own metadata. */
    getMetaKeys(): string[];
    /** A value set by setSyncedMeta; undefined when unset. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta set. */
    getSyncedMetaKeys(): string[];
    /** Whether its own metadata has the key. */
    hasMeta(key: string): boolean;
    /** Whether the player (or id) is a member. */
    hasPlayer(player: Player | number): boolean;
    /** Whether setSyncedMeta set the key. */
    hasSyncedMeta(key: string): boolean;
    /** A number from 1, unique while the host runs; channels of every resource share the counter. Read-only: assigning changes nothing (a TypeError in strict mode). */
    readonly id: number;
    /** The same as hasPlayer. */
    isPlayerInChannel(player: Player | number): boolean;
    /** Whether the member is muted in this channel. */
    isPlayerMuted(player: Player | number): boolean;
    /** True when members hear each other only within maxDistance and in the same dimension; false: every member hears all. */
    readonly isSpatial: boolean;
    /** Always "voiceChannel". */
    readonly kind: "voiceChannel";
    /** Metres within which members of a spatial channel hear each other, as the server keeps it: 1–10000 (a smaller positive value reads 1, a larger one 10000), 50 when not given or not above 0.01; 0 for a non-spatial one. */
    readonly maxDistance: number;
    /** Mutes a member in this channel, so the others do not hear him through it; muted false unmutes. Nothing for a non-member or a destroyed channel. */
    mutePlayer(player: Player | number, muted?: boolean): void;
    /** How many members the channel has. */
    readonly playerCount: number;
    /** The connected members; a new array on each read. */
    readonly players: Player[];
    /** When a speaker and a listener share several channels, the one with the highest priority carries the voice (ties: non-spatial first, then the lower id). Assigning truncates to an integer; ignored after destroy. */
    priority: number;
    /** Takes a member out of the channel (and out of its muted list); nothing for a non-member or a destroyed channel. */
    removePlayer(player: Player | number): void;
    /** The same as assigning filter. */
    setFilter(filter: number | string): void;
    /** This host's own data on the channel; metaChange fires on a change (not for the same value). */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomVoiceChannelMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomVoiceChannelMeta, any>): void;
    /** Kept on this host only: no client receives it (a voice channel has no metadata path to clients); syncedMetaChange fires here and an object sets each of its keys. Key 1–1024 UTF-8 bytes, value up to 512 KiB as JSON; throws for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** BaseObjectType.VoiceChannel (6). */
    readonly type: number;
    /** Lets the other members hear a muted member again; nothing when he is not muted or the channel is destroyed. */
    unmutePlayer(player: Player | number): void;
    /** False once destroyed (destroy, or its resource stopped). */
    readonly valid: boolean;
}

export const VoiceConnectionState: {
    readonly Connected: any;
    readonly Connecting: any;
    readonly Disconnected: any;
};

export const WeaponModelInfo: {
    /** A weapon of the built-in GTA catalog by hash or name (hashed): its model, ammo type and model, the online maximum ammo by skill, and damage type. Throws Error for a weapon the catalog lacks. */
    get(weapon: number | string): { readonly hash: number; readonly name: string; readonly model: string; readonly modelHash: number; readonly ammoTypeHash: number; readonly ammoType: string; readonly ammoModelName: string; readonly ammoModelHash: number; readonly defaultMaxAmmoMp: number; readonly skillAbove50MaxAmmoMp: number; readonly maxSkillMaxAmmoMp: number; readonly bonusMaxAmmoMp: number; readonly damageType: string };
};

export const WeatherType: {
    readonly "0": any;
    readonly "1": any;
    readonly "10": any;
    readonly "11": any;
    readonly "12": any;
    readonly "13": any;
    readonly "14": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly "7": any;
    readonly "8": any;
    readonly "9": any;
    readonly Blizzard: any;
    readonly Clear: any;
    readonly Clearing: any;
    readonly Clouds: any;
    readonly ExtraSunny: any;
    readonly Foggy: any;
    readonly Halloween: any;
    readonly Neutral: any;
    readonly Overcast: any;
    readonly Rain: any;
    readonly Smog: any;
    readonly Snow: any;
    readonly Snowlight: any;
    readonly Thunder: any;
    readonly Xmas: any;
};

export const WindowTint: {
    readonly "0": any;
    readonly "1": any;
    readonly "2": any;
    readonly "3": any;
    readonly "4": any;
    readonly "5": any;
    readonly "6": any;
    readonly DarkSmoke: any;
    readonly Green: any;
    readonly LightSmoke: any;
    readonly Limo: any;
    readonly None: any;
    readonly PureBlack: any;
    readonly Stock: any;
};

export class WorldObject {
    /** Instances are created by the VARION runtime and cannot be constructed directly. */
    private constructor();
    /** Every valid object with a place in the world: players, old-path vehicles, peds, objects and virtual entities, blips, markers, colshapes, checkpoints, text labels, then native vehicles and NPCs. No voice channels or virtual entity groups. A new array on each read. */
    static readonly all: WorldObject[];
    /** How many objects WorldObject.all holds now. */
    static readonly count: number;
    /** BaseObject.getByID, but only a WorldObject: with a type, a voice channel or a virtual entity group reads null; with an id alone, the player, old-path entity or native vehicle or NPC of that id. Null for none. */
    static getByID(type: number, id: number): WorldObject | null;
    static getByID(id: number): WorldObject | null;
    /** Removes the key from this host's own metadata: true, and metaChange fires with the value undefined; false when the key was not there. */
    deleteMeta(key: string): boolean;
    /** Removes the synced key: clients lose it and syncedMetaChange fires with undefined; false when the key was not there. Once the object is gone only this host's copy goes. */
    deleteSyncedMeta(key: string): boolean;
    /** The dimension it is in (0 by default); assigning moves it there. Old-path entities take a 32-bit integer (else a RangeError; the fraction is dropped) and lose their owner, a vehicle its occupants too; native ones go through setDimension; blips, markers and colshapes truncate the value. */
    dimension: number;
    /** The value setMeta stored under the key, undefined for none: this host's own metadata, which no client sees. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectMeta, K, any>;
    /** The keys of this host's own metadata (setMeta); getMetaKeys returns the same. */
    getMetaDataKeys(): string[];
    /** The keys of this host's own metadata (setMeta), as getMetaDataKeys. */
    getMetaKeys(): string[];
    /** The value setSyncedMeta stored under the key, as the script set it (an entity stays that entity); undefined for none. On a player or old-path entity a change a C# resource made arrives through the server, its entity references turned into this host's objects. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>;
    /** The keys setSyncedMeta stored, as this host keeps them. */
    getSyncedMetaKeys(): string[];
    /** Whether this host's own metadata (setMeta) holds the key. */
    hasMeta(key: string): boolean;
    /** Whether setSyncedMeta stored a value under the key, as this host keeps them. */
    hasSyncedMeta(key: string): boolean;
    /** Its id within its kind: the network id of a player or old-path entity (a removed one's id is reused), the script id of a native vehicle or NPC (from 65536); blips, markers, colshapes, checkpoints and text labels share one counter, voice channels have their own. Ids of different kinds can be equal. */
    readonly id: number;
    /** Its kind by name; native vehicles and NPCs read "vehicle" and "ped". "entity" only while the server has not named an entity's kind yet. */
    readonly kind: "player" | "vehicle" | "ped" | "object" | "virtualEntity" | "blip" | "marker" | "colshape" | "checkpoint" | "textlabel" | "voiceChannel" | "virtualEntityGroup" | "entity";
    /** Its position. Assigning moves it: a player or old-path entity throws a TypeError for a non-finite component and a RangeError for one beyond 100000 m; a native vehicle is teleported through its owner; a blip, marker or colshape moves at once (non-finite components become 0). A native NPC's cannot be assigned. */
    get pos(): Vector3;
    set pos(value: Vector3Like);
    /** Stores a value under the key in this host's own metadata, which no client sees; an object alone sets each of its keys. metaChange fires unless the value is the same (Object.is); the key is turned into a string. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectMeta, K, any>): void;
    setMeta(values: CustomMetaValues<ICustomBaseObjectMeta, any>): void;
    /** Synced metadata the clients get with it (getSyncedMeta there); syncedMetaChange fires here unless the value is the same. The key must be 1..1024 UTF-8 bytes (RangeError) and the value serializable within 512 KiB (TypeError, RangeError); once the object is gone only this host's copy changes. A voice channel's or virtual entity group's stays on this host. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomBaseObjectSyncedMeta, K, any>): void;
    setSyncedMeta(values: CustomMetaValues<ICustomBaseObjectSyncedMeta, any>): void;
    /** Its BaseObjectType: Player 0, Vehicle 1, Ped 2, Object 3, Blip 4, VoiceChannel 6, Colshape 7, Checkpoint 8, VirtualEntity 20, VirtualEntityGroup 21, Marker 22, TextLabel 23; -1 while the server has not named an entity's kind. */
    readonly type: number;
    /** False once it is gone: a player left, an old-path entity from its destroy() on (true again if the server refused the removal), a blip, marker, colshape, voice channel or group once destroyed or its resource stopped, a native vehicle or NPC once the server removed it. */
    readonly valid: boolean;
}

export const WorldPropState: {
    readonly Deleted: any;
};

export const WorldStateKind: {
    readonly BrokenGlass: any;
    readonly Door: any;
    readonly Glass: any;
    readonly Prop: any;
};

export const console: {
    /** Adds a command to the players' F8 console: it is offered while a player types and runs here, with the player and what he typed after the name. A string the handler returns (or resolves with) is printed under the command. A command for "developer" runs only for a player whose consoleAccess is "developer". The command goes with its resource. */
    addCommand(options: string | ConsoleCommandOptions, handler: (player: Player, ...args: string[]) => string | void | Promise<string | void>): void;
    /** Takes a command of this resource out of the console; false when there is none by that name. */
    removeCommand(name: string): boolean;
};

export const worldObjects: {
    /** The map objects players moved or broke (a bin, a traffic light, a hydrant) within the radius of a point in a dimension that have a network object now or a memory (server.toml worldObjectMemory): model (0 until its owner's client named it), placement (where the map has it), fragment (-1: the whole object), position, rotation (degrees), broken, live (someone networks it now; owner: that player's id), remembered, pinned, changedAt and nearAt (server ms). */
    list(position: Vector3Like, radius?: number, dimension?: number): Promise<{ model: number; placement: Vector3Like; fragment: number; dimension: number; position: Vector3Like; rotation: Vector3Like; broken: boolean; live: boolean; remembered: boolean; pinned: boolean; owner: number | null; changedAt: number; nearAt: number }[]>;
    /** The term as server.toml worldObjectMemory names it: "30s", "5m", "2h", "restart" or "off". */
    memory(): Promise<string>;
    /** Their memories are kept for good (until reset), whatever the term -- also with worldObjectMemory = "off" for what they say from now on. How many. */
    pin(position: Vector3Like, radius?: number, dimension?: number): Promise<number>;
    /** Their memories are forgotten at once: whoever comes later sees the map's placement; a player who sees one now keeps seeing it as it is until its GTA streams it out. A live one stays its map object's. How many. */
    reset(position: Vector3Like, radius?: number, dimension?: number): Promise<number>;
    /** Their memories are forgotten by the term again. How many. */
    unpin(position: Vector3Like, radius?: number, dimension?: number): Promise<number>;
};

/** Every event name the runtime emits. */
export type VarionEventName =
    | "anyResourceError"
    | "anyResourceStart"
    | "anyResourceStop"
    | "baseObjectCreate"
    | "baseObjectRemove"
    | "clientDeleteObject"
    | "clientRequestObject"
    | "connectionQueueAdd"
    | "connectionQueueRemove"
    | "consoleCommand"
    | "entityCreating"
    | "entityEnterColshape"
    | "entityLeaveColshape"
    | "entityModelMissing"
    | "entityStreamIn"
    | "entityStreamOut"
    | "explosion"
    | "givePedScriptedTask"
    | "globalMetaChange"
    | "globalSyncedMetaChange"
    | "localMetaChange"
    | "metaChange"
    | "nativeVehicleCreated"
    | "nativeVehicleOwnerChanged"
    | "nativeVehicleRemoved"
    | "netOwnerChange"
    | "pedDamage"
    | "pedDeath"
    | "pedHeal"
    | "playerAnimationChange"
    | "playerChangeVehicleSeat"
    | "playerChangedNativeVehicleSeat"
    | "playerChangedVehicleSeat"
    | "playerConnect"
    | "playerConnectDenied"
    | "playerDamage"
    | "playerDeath"
    | "playerDimensionChange"
    | "playerDisconnect"
    | "playerEnterVehicle"
    | "playerEnteredNativeVehicle"
    | "playerEnteredVehicle"
    | "playerEnteringVehicle"
    | "playerHeal"
    | "playerInteriorChange"
    | "playerLeaveVehicle"
    | "playerLeftNativeVehicle"
    | "playerLeftVehicle"
    | "playerReady"
    | "playerRequestControl"
    | "playerSpawn"
    | "playerWeaponChange"
    | "removeEntity"
    | "requestSyncedScene"
    | "resourceError"
    | "resourceStart"
    | "resourceStop"
    | "serverStarted"
    | "startFire"
    | "startProjectile"
    | "startSyncedScene"
    | "stopSyncedScene"
    | "streamSyncedMetaChange"
    | "syncedMetaChange"
    | "updateSyncedScene"
    | "vehicleAttach"
    | "vehicleDamage"
    | "vehicleDestroy"
    | "vehicleDetach"
    | "vehicleHorn"
    | "vehicleSiren"
    | "voiceConnection"
    | "weaponDamage"
    | (string & {});

/** Handler parameters of the documented events. */
export interface VarionEvents {
    /** A resource threw an uncaught error or failed to start. Every loaded resource hears it; the failed one gets resourceError with the details first. */
    anyResourceError(resourceName: string): void;
    /** A resource started, of any kind (JavaScript, C#, client-only, assets). Running resources hear it, the started one too; the ones the server started with it come after the JavaScript ones. */
    anyResourceStart(resourceName: string): void;
    /** A resource stopped, of any kind (JavaScript, C#, client-only, assets). Running resources hear it, the stopped one too; when the server stops, the other kinds come before the JavaScript ones. */
    anyResourceStop(resourceName: string): void;
    /** A base object appeared. Also a native vehicle (just before nativeVehicleCreated) and an NPC createNativePed made (as the call resolves). */
    baseObjectCreate(baseObject: BaseObject | NativeVehicle | NativePed): void;
    /** A base object went; it is still readable in the handler. Also a native vehicle (just before nativeVehicleRemoved) and an NPC createNativePed made, once the host learns it is gone (destroyNativePed, the mirror or fetch()). */
    baseObjectRemove(baseObject: BaseObject | NativeVehicle | NativePed): void;
    /** A client deleted a networked prop it owns; the others still have it. The second argument says which: its netId, model and last position. Return false (synchronously) to cancel: the prop stays for the others, the nearest of them who has it takes it over, and the player sees it again. With nobody else holding it, or no answer within a second, it is removed. */
    clientDeleteObject(player: Player, object: { readonly netId: number; readonly model: number; readonly pos: Vector3 }): boolean | void;
    /** A client created a networked object (doors and pickups too); nobody else has it yet. Return false (synchronously) to cancel it, as from entityCreating, which follows. */
    clientRequestObject(player: Player, model: number, pos: Vector3): boolean | void;
    /** Only with `connectionQueue = true` in server.toml: a client waits to be let in. Answer with `info.accept()` or `info.decline(reason)`. */
    connectionQueueAdd(info: ConnectionInfo): void;
    /** The client left the queue: accepted, declined or disconnected. `info` stops being valid after the handlers. */
    connectionQueueRemove(info: ConnectionInfo): void;
    /** A line typed in the server console: the command and the words after it. The built-in `restart`, `start` and `stop <resource>` come here too. */
    consoleCommand(name: string, ...args: string[]): void;
    /** A client created a networked car, NPC or object; nobody else has it yet: return false from a handler (synchronously) to cancel it -- the server removes it, at its owner too. With no verdict within 1 s it goes through. Only while a resource host runs; the entity lockdown (setEntityLockdown) has refused some before this. */
    entityCreating(entity: EntityCreatingInfo): boolean | void;
    /** Players, vehicles, peds and objects; players only when `colshape.playersOnly` is true (default false). */
    entityEnterColshape(colshape: Colshape, entity: Player | Vehicle | Ped | Object): void;
    /** Players, vehicles, peds and objects; players only when `colshape.playersOnly` is true (default false). A player who disconnects inside leaves, before playerDisconnect; destroying the colshape or checkpoint makes everyone inside leave, while it is still valid. A vehicle, ped or object that is destroyed inside leaves without this event. */
    entityLeaveColshape(colshape: Colshape, entity: Player | Vehicle | Ped | Object): void;
    /** GTA on `player`'s client cannot show `entity` -- or, when `entity` is `player`, cannot take the model the server gave it. `reason`: `not-in-game` (GTA has no such model: not one of GTA's and not declared by any pack the client mounted), `wrong-type` (not a vehicle or ped model, as the entity needs) or `not-loaded` (GTA has it but did not load it in 15 s: a pack that declares it without its files). Once per player, entity and model; the entity itself does not change. */
    entityModelMissing(entity: Player | Vehicle | Ped | Object, player: Player, model: number, reason: "not-in-game" | "wrong-type" | "not-loaded"): void;
    /** The client of player `playerId` now streams an entity. Ids, not objects: the entity id and its type (0 player, 1 vehicle, 2 ped, 3 object). */
    entityStreamIn(playerId: number, entityId: number, entityType: number): void;
    /** The client of player `playerId` no longer streams an entity. Ids, not objects: the entity id and its type (0 player, 1 vehicle, 2 ped, 3 object). */
    entityStreamOut(playerId: number, entityId: number, entityType: number): void;
    /** A client reports an explosion: GTA's explosion type and effect hash. Return false (synchronously) and other players do not get it. `target` is null for an entity scripts do not know. */
    explosion(source: Player, type: number, pos: Vector3, fx: number, target: BaseObject | NativeVehicle | NativePed | null): boolean | void;
    /** A client gives a task to an NPC another client simulates. Return false (synchronously) to refuse. */
    givePedScriptedTask(source: Player, target: Ped | NativePed, taskType: number): boolean | void;
    /** A script changed `varion.setMeta` data; `value` is undefined after a delete. */
    globalMetaChange(key: string, value: any, oldValue: any): void;
    /** A script changed `varion.setSyncedMeta` data; `value` is undefined after a delete. */
    globalSyncedMetaChange(key: string, value: any, oldValue: any): void;
    /** A script changed `player.setLocalMeta` data; `value` is undefined after a delete. */
    localMetaChange(player: Player, key: string, value: any, oldValue: any): void;
    /** A script changed `entity.setMeta` data; `value` is undefined after a delete. */
    metaChange(entity: BaseObject | NativeVehicle | NativePed, key: string, value: any, oldValue: any): void;
    /** A native vehicle appeared: one a client script made (when the server first reports it), or one createNativeVehicle made (at once, still without an owner). One made and removed within 50 ms is never reported. */
    nativeVehicleCreated(vehicle: NativeVehicle): void;
    /** Another client simulates the vehicle: a car the server made got its first owner (oldOwner null), or the server handed it over (its owner left or went out of its range). netOwnerChange comes first with the same arguments. */
    nativeVehicleOwnerChanged(vehicle: NativeVehicle, owner: Player | null, oldOwner: Player | null): void;
    /** A native vehicle went: its owner or a script deleted it, or its owner left and nobody could take it over. The vehicle is still readable in the handler. */
    nativeVehicleRemoved(vehicle: NativeVehicle): void;
    /** Another client simulates the entity. Also for a native vehicle (before nativeVehicleOwnerChanged) and for an NPC the server made (the NPC already reads the new owner). `owner` null: nobody simulates it now. */
    netOwnerChange(entity: Entity | NativeVehicle | NativePed, owner: Player | null, oldOwner: Player | null): void;
    /** A player hit an NPC of the old path, told after the server applied the hit (ped.health is the new value). It cannot be cancelled; weaponDamage can. */
    pedDamage(ped: Ped, attacker: Player, healthDamage: number, armourDamage: number, weaponHash: number): void;
    /** A hit killed an NPC of the old path, told after pedDamage. It cannot be cancelled; weaponDamage can. */
    pedDeath(ped: Ped, killer: Player, weaponHash: number): void;
    /** An NPC of the old path got health or armour back, a script's ped.health or ped.armour too: told after the change, to every resource. It cannot be cancelled. */
    pedHeal(ped: Ped, oldHealth: number, newHealth: number, oldArmour: number, newArmour: number): void;
    /** The animation the player plays changed: hashes of the old and new dictionary and name. */
    playerAnimationChange(player: Player, oldAnimDict: number, newAnimDict: number, oldAnimName: number, newAnimName: number): void;
    /** Seats: 1 = driver, 2 = front passenger, 3-4 = rear. */
    playerChangedNativeVehicleSeat(player: Player, vehicle: NativeVehicle, oldSeat: number, newSeat: number): void;
    /** Seats: 1 = driver, 2 = front passenger, 3-4 = rear. Also for a native vehicle, before playerChangedNativeVehicleSeat. */
    playerChangedVehicleSeat(player: Player, vehicle: Vehicle | NativeVehicle, oldSeat: number, newSeat: number): void;
    /** The low-level twin of playerChangedVehicleSeat: the vehicle id and GTA's seat indexes (-1 = driver, 0 = front passenger). */
    playerChangeVehicleSeat(player: Player, vehicleId: number, oldSeat: number, newSeat: number): void;
    playerConnect(player: Player): void;
    /** The server refused a connection before admission; `reason` is a ConnectDeniedReason. `discordId` is the Discord id as text, empty without one. */
    playerConnectDenied(reason: number, name: string, ip: string, passwordHash: string, isDebug: boolean, branch: string, clientBuild: number, cdnUrl: string, discordId: string): void;
    /** The player lost health or armour. `attacker` is null when the server does not know who did it. */
    playerDamage(player: Player, attacker: Player | null, healthDamage: number, armourDamage: number, weaponHash: number): void;
    /** `killer` is null when nobody killed the player. */
    playerDeath(victim: Player, killer: Player | null, weaponHash: number): void;
    /** The player moved to another dimension. */
    playerDimensionChange(player: Player, oldDimension: number, newDimension: number): void;
    playerDisconnect(player: Player, reason: string): void;
    /** From the player's own native tree (CPedGameStateDataNode). Seats as that node holds them: 1 = driver, 2 = front passenger, 3-4 = rear. */
    playerEnteredNativeVehicle(player: Player, vehicle: NativeVehicle, seat: number): void;
    /** Seats: 1 = driver, 2 = front passenger, 3-4 = rear. Also for a native vehicle, before playerEnteredNativeVehicle; player.vehicle and seat already read the new ones. */
    playerEnteredVehicle(player: Player, vehicle: Vehicle | NativeVehicle, seat: number): void;
    /** The player started getting into a vehicle. Seats: 1 = driver, 2 = front passenger, 3-4 = rear. For a native vehicle the player’s own game state node tells it (in the vehicle, not yet seated), once per vehicle; it does not name the seat, so `seat` is 0. */
    playerEnteringVehicle(player: Player, vehicle: Vehicle, seat: number): void;
    /** The low-level twin of playerEnteredVehicle: the vehicle id and GTA's seat index (-1 = driver, 0 = front passenger). */
    playerEnterVehicle(player: Player, vehicleId: number, seat: number): void;
    /** Health or armour went up. */
    playerHeal(player: Player, oldHealth: number, newHealth: number, oldArmour: number, newArmour: number): void;
    /** Interior ids from GTA; 0 is outside. A player starts outside: one who joins in an interior gets it from 0. */
    playerInteriorChange(player: Player, oldInterior: number, newInterior: number): void;
    /** The low-level twin of playerLeftVehicle: the vehicle id and GTA's seat index (-1 = driver, 0 = front passenger). */
    playerLeaveVehicle(player: Player, vehicleId: number, seat: number): void;
    /** Seats: 1 = driver, 2 = front passenger, 3-4 = rear. Also when the vehicle goes with the player in it (before nativeVehicleRemoved); not when the player leaves the server. */
    playerLeftNativeVehicle(player: Player, vehicle: NativeVehicle, seat: number): void;
    /** Seats: 1 = driver, 2 = front passenger, 3-4 = rear. Also for a native vehicle, before playerLeftNativeVehicle; not for a player who left the server. */
    playerLeftVehicle(player: Player, vehicle: Vehicle | NativeVehicle, seat: number): void;
    playerReady(player: Player): void;
    /** A client asks to control an entity another client simulates. Return false (synchronously) to refuse. */
    playerRequestControl(player: Player, target: BaseObject | NativeVehicle | NativePed): boolean | void;
    /** The server carried out `player.spawn`: position, model and health already read the new values. Before the client shows the character. */
    playerSpawn(player: Player): void;
    /** The player switched weapons; the hashes, 0 for none. */
    playerWeaponChange(player: Player, oldWeapon: number, newWeapon: number): void;
    /** An entity went: one of the old path, a native vehicle or a native NPC; it is still readable in the handler. Before baseObjectRemove. */
    removeEntity(entity: BaseObject): void;
    /** A client asks for a synchronised scene. Every handler must return true (synchronously), or the scene is refused; with no handler it passes. */
    requestSyncedScene(source: Player, sceneId: number): boolean | void;
    /** This resource threw: an uncaught error, or a throw or rejection in one of its event handlers or timers. `error` is the thrown value, usually an Error. A throw in a resourceError handler is only logged. */
    resourceError(error: any, file: string, line: number, stack: string): void;
    /** This resource started. errored, is always false here: a resource whose top-level code failed does not start. */
    resourceStart(errored: boolean): void;
    resourceStop(): void;
    /** Once, after the resources of server.toml started. */
    serverStarted(): void;
    /** A client started fires. Return false (synchronously) and other players do not get them. */
    startFire(source: Player, fires: IFireInfo[]): boolean | void;
    /** A client fired a projectile, such as a rocket or a grenade. Return false (synchronously) and other players do not get it. */
    startProjectile(player: Player, pos: Vector3, dir: Vector3, ammoHash: number, weaponHash: number): boolean | void;
    /** Refused unless every handler returns true (synchronously); with no handler it passes. `entity` is null for one scripts do not know. */
    startSyncedScene(source: Player, sceneId: number, pos: Vector3, rot: Vector3, animDictHash: number, entities: { entity: BaseObject | NativeVehicle | NativePed | null; animHash: number }[]): boolean | void;
    /** Refused unless every handler returns true (synchronously); with no handler it passes. */
    stopSyncedScene(source: Player, sceneId: number): boolean | void;
    /** A script changed `entity.setStreamSyncedMeta` data; `value` is undefined after a delete. */
    streamSyncedMetaChange(entity: BaseObject | NativeVehicle | NativePed, key: string, value: any, oldValue: any): void;
    /** A script changed `entity.setSyncedMeta` data; `value` is undefined after a delete. */
    syncedMetaChange(entity: BaseObject | NativeVehicle | NativePed, key: string, value: any, oldValue: any): void;
    /** Refused unless every handler returns true (synchronously); with no handler it passes. */
    updateSyncedScene(source: Player, rate: number, sceneId: number): boolean | void;
    /** A vehicle took another in tow, such as a truck and its trailer; for native vehicles as the attached one’s attach node tells. */
    vehicleAttach(vehicle: Vehicle, attachedVehicle: Vehicle): void;
    /** A vehicle lost health: how much its body, extra body (its own health), engine and fuel tank lost. For a native vehicle, between two health nodes of its owner, with the attacker and weapon that node names (the player whose ped did it, else the native vehicle or NPC, else null). For one of the old path the server does not know who did it: `attacker` is always null and `weaponHash` 0. */
    vehicleDamage(vehicle: Vehicle, attacker: BaseObject | null, bodyDamage: number, additionalBodyDamage: number, engineDamage: number, petrolTankDamage: number, weaponHash: number): void;
    /** A vehicle of the old path was wrecked: the server's state turned destroyed (vehicle.destroyed, its owner's GTA reporting engine health -4000 or body health 0). The vehicle is still there; removing it is the script's call. Once per wreck, again after a repair; not for a vehicle already wrecked when the server first reports it, nor for a removal (removeEntity). */
    vehicleDestroy(vehicle: Vehicle): void;
    /** A vehicle let go of the one it towed; for native vehicles as the attached one’s attach node tells. */
    vehicleDetach(vehicle: Vehicle, detachedVehicle: Vehicle): void;
    /** A driver pressed or released the horn. Return false (synchronously) and other players do not hear it. */
    vehicleHorn(vehicle: Vehicle, player: Player, state: boolean): boolean | void;
    /** A vehicle turned its siren on or off: one of the old path, or a native vehicle as its owner’s game state node tells. */
    vehicleSiren(vehicle: Vehicle, state: boolean): void;
    /** The voice service state, a VoiceConnectionState: 2 once the resource host is ready, 0 when the server shuts down. */
    voiceConnection(state: number): void;
    /** A player hit someone. Return false (synchronously) to cancel the hit or a number to set its damage. `target` is null for an entity scripts do not know. `shot` is what the server measured: how far the two are apart, whether the shooter's game reported a bullet for the hit, how far the shooter was from where it started and how far the target is from its path. */
    weaponDamage(source: Player, target: Player | Ped | NativeVehicle | NativePed | null, weaponHash: number, damage: number, offset: Vector3, bodyPart: number, sourceEntity: Player, shot: WeaponDamageShot | null): number | boolean | void;
}

declare const varion: {
    /** Lets clients read this key of the resource's [config]; a key the config does not have is refused (logged). Throws outside a resource's code, and TypeError for an empty key, one over 256 bytes or with control characters. */
    addClientConfigKey(key: string): void;
    AmmoSpecialType: typeof AmmoSpecialType;
    AreaBlip: typeof AreaBlip;
    AudioCategories: typeof AudioCategories;
    BaseObject: typeof BaseObject;
    BaseObjectFilterType: typeof BaseObjectFilterType;
    BaseObjectType: typeof BaseObjectType;
    Benefit: typeof Benefit;
    Blip: typeof Blip;
    BlipColor: typeof BlipColor;
    BlipSprite: typeof BlipSprite;
    BlipType: typeof BlipType;
    BodyPart: typeof BodyPart;
    /** The engine's release channel, such as "rc". */
    readonly branch: string;
    Checkpoint: typeof Checkpoint;
    CheckpointType: typeof CheckpointType;
    /** Removes the timer of that number, whichever kind it is (setTimeout, setInterval, everyTick, nextTick, a Timer's id); an unknown number does nothing. A handle of Node's own timers is cleared as Node clears it. */
    clearEveryTick(id: number): void;
    /** Removes the timer of that number, whichever kind it is (setTimeout, setInterval, everyTick, nextTick, a Timer's id); an unknown number does nothing. A handle of Node's own timers is cleared as Node clears it. */
    clearInterval(id: number): void;
    /** Removes the timer of that number, whichever kind it is (setTimeout, setInterval, everyTick, nextTick, a Timer's id); an unknown number does nothing. A handle of Node's own timers is cleared as Node clears it. */
    clearNextTick(id: number): void;
    /** Removes the timer of that number, whichever kind it is (setTimeout, setInterval, everyTick, nextTick, a Timer's id); an unknown number does nothing. A handle of Node's own timers is cleared as Node clears it. */
    clearTimeout(id: number): void;
    /** Removes the timer of that number, whichever kind it is (setTimeout, setInterval, everyTick, nextTick, a Timer's id); an unknown number does nothing. A handle of Node's own timers is cleared as Node clears it. */
    clearTimer(id: number): void;
    /** Removes the state a door or prop got at that place (setDoorState, setPropState); kind "door"/"prop" or 1/3, subject a model name or hash. Throws for glass (use the Rayfire calls), subject 0, a bad position or dimension. */
    clearWorldState(kind: number | string, subject: number | string, position: Vector3Like, dimension?: number): void;
    CloudAuthResult: typeof CloudAuthResult;
    Colshape: typeof Colshape;
    ColshapeBox: typeof ColshapeBox;
    ColshapeCircle: typeof ColshapeCircle;
    ColshapeCuboid: typeof ColshapeCuboid;
    ColshapeCylinder: typeof ColshapeCylinder;
    ColshapePolygon: typeof ColshapePolygon;
    ColshapeRectangle: typeof ColshapeRectangle;
    ColshapeSphere: typeof ColshapeSphere;
    ColShapeType: typeof ColShapeType;
    ConnectDeniedReason: typeof ConnectDeniedReason;
    ConnectionInfo: typeof ConnectionInfo;
    console: typeof console;
    /** An area blip of width × height metres (100 each when missing) centred on the point; color is a BlipColor, dimension 0 by default. Removed when the resource stops. */
    createAreaBlip(x: number, y: number, z: number, width: number, height: number, color?: number, dimension?: number): AreaBlip;
    /** A blip of the calling resource, removed when it stops: kind "radius" makes a RadiusBlip, "area" an AreaBlip, anything else a PointBlip. By default sprite 1, colour 0, scale 1, short-range and in dimension 0 (-2147483648: every dimension), and every player sees it; with global false only its targets do. */
    createBlip(options: BlipOptions): PointBlip | RadiusBlip | AreaBlip;
    /** A checkpoint: by default CheckpointType 0, radius 2 m, height 1 m, colour 255, 200, 0, 180, visible, dimension 0. It is also a colshape: entering and leaving it fire entityEnterColshape and entityLeaveColshape. */
    createCheckpoint(options: { pos?: Vector3Like; x?: number; y?: number; z?: number; type?: number; radius?: number; height?: number; color?: RGBALike; streamingDistance?: number; visible?: boolean; dimension?: number; [option: string]: any }): Checkpoint;
    /** A colshape of that kind, matched without regard to case and handed to the server in lower case (a sphere by default and for an unknown kind): radius 2, half sizes 1, height 2, minZ 0, maxZ 2, dimension 0 unless given. It reports every entity kind unless playersOnly is true. */
    createColshape(options: { kind?: "sphere" | "box" | "cylinder" | "circle" | "rectangle" | "polygon"; pos?: Vector3Like; x?: number; y?: number; z?: number; radius?: number; halfX?: number; halfY?: number; halfZ?: number; height?: number; minZ?: number; maxZ?: number; points?: ({ x: number; y: number } | number)[]; playersOnly?: boolean; dimension?: number; [option: string]: any }): ColshapeSphere | ColshapeBox | ColshapeCylinder | ColshapeCircle | ColshapeRectangle | ColshapePolygon;
    /** A box centred on the point with half sizes along x, y and z in metres (1 for a missing one); dimension 0 by default. */
    createColshapeBox(x: number, y: number, z: number, halfX: number, halfY: number, halfZ: number, dimension?: number): ColshapeBox;
    /** A circle on the map: any height counts as inside. Radius in metres (2 when missing); dimension 0 by default. */
    createColshapeCircle(x: number, y: number, radius: number, dimension?: number): ColshapeCircle;
    /** A cylinder standing on the point, from z up to z + height: radius and height in metres (2 each when missing); dimension 0 by default. */
    createColshapeCylinder(x: number, y: number, z: number, radius: number, height: number, dimension?: number): ColshapeCylinder;
    /** A polygon of x, y points (objects, or a flat list of numbers) between minZ and maxZ (0 and 2 when missing); dimension 0 by default. */
    createColshapePolygon(points: ({ x: number; y: number } | number)[], minZ: number, maxZ: number, dimension?: number): ColshapePolygon;
    /** A rectangle centred on x, y with half sizes in metres (1 when missing); any height counts as inside. Unlike new ColshapeRectangle(x1, y1, x2, y2), which takes two corners. */
    createColshapeRectangle(x: number, y: number, halfX: number, halfY: number, dimension?: number): ColshapeRectangle;
    /** A sphere colshape of the calling resource, removed when it stops: entityEnterColshape and entityLeaveColshape fire for players, vehicles, peds and objects in its dimension (0 by default, -2147483648 every one), checked every colShapeTickRate ms (150 by default). */
    createColshapeSphere(x: number, y: number, z: number, radius: number, dimension?: number): ColshapeSphere;
    /** A marker of the calling resource, removed when it stops; by default type 1, scale 1, white at alpha 120 and in dimension 0 (-2147483648: every dimension). Every player in its dimension sees it, or only `target` (a player) when one is given. Clients draw it within `streamingDistance` metres of their player: 300 by default, 0 for any distance. */
    createMarker(options: MarkerOptions): Marker;
    /** An NPC on the native path: the nearest player in range that can own one creates it as its own and runs its tasks; until then it waits without an owner. When its last owner leaves with nobody in range, it waits where it was left and the next player near gets it with its health, armour, clothes and weapons, on foot and without a task: a new netId (fetch()) means a new lifetime, give it its task again. Resolves to its NativePed, null when refused. Destroyed when the resource stops. */
    createNativePed(model: number | string, pos: Vector3Like, heading?: number, dimension?: number): Promise<NativePed | null>;
    /** A train on the native path (a client makes it, CREATE_MISSION_TRAIN): the nearest player in range of pos, in that dimension, that can own native vehicles makes the engine and every carriage of GTA's train config `variation` (trains.xml: 0..28 in the base game; 0 a freight engine with two cars, 28 the metro) on the nearest train track node, and owns it; the train changes owner as one. Resolves to the engine's NativeVehicle (its carriages: engine.train.carriages); null when no such player is in range now, or its GTA could not make the train. Destroyed when the resource stops. */
    createNativeTrain(variation: number, pos: Vector3Like, direction?: boolean, dimension?: number): Promise<NativeVehicle | null>;
    /** A car on the native path: the nearest player in range that can own it creates it as its own; until then it waits without an owner. When its last owner leaves with nobody in range, it waits where it was left and the next player near gets it as that owner left it: engine, locks, colours, plate, mods, damage and health (a new netId: a new lifetime of the same vehicle). Resolves to its NativeVehicle, which also reads as its id number; null when refused. Destroyed when the resource stops. A trailer of the game is told by its model; for a trailer model of your own (an add-on) pass "trailer" as kind. */
    createNativeVehicle(model: number | string, pos: Vector3Like, heading?: number, dimension?: number, kind?: 'trailer'): Promise<NativeVehicle | null>;
    /** An object of the old path, created without an owner in dimension 0; rot in radians, a non-finite coordinate counts as 0. A bad model throws at once; when the server creates none (its entity pool is full) the promise rejects with Error. It is removed when the resource stops. */
    createObject(model: number | string, pos: Vector3Like, rot?: Vector3Like): Promise<Object>;
    /** An NPC of the old path, created without an owner in dimension 0; rot in radians, a non-finite coordinate counts as 0. A bad model throws at once; when the server creates none (its entity pool is full) the promise rejects with Error. createNativePed makes an NPC GTA syncs. */
    createPed(model: number | string, pos: Vector3Like, rot?: Vector3Like): Promise<Ped>;
    /** A radius blip of radius metres (50 when missing) around the point; color is a BlipColor, dimension 0 by default. Removed when the resource stops. */
    createRadiusBlip(x: number, y: number, z: number, radius: number, color?: number, dimension?: number): RadiusBlip;
    /** A 3D text label at the point: by default scale 1, font 0, white, no outline, dimension 0; empty text becomes a space. Removed when the resource stops. */
    createTextLabel(options: { text?: string; pos?: Vector3Like; x?: number; y?: number; z?: number; scale?: number; font?: number; color?: RGBALike; outline?: boolean; dimension?: number; [option: string]: any }): TextLabel;
    /** The model is a name (hashed as varion.hash) or a hash; an int32 hash is its uint32, a hash written as text ("0x705E61F2", "1885233650") that hash. 0, an empty name or another type throws. rot is in radians. Rejects when the server does not create it (its entity pool is full). */
    createVehicle(model: number | string, pos: Vector3Like, rot?: Vector3Like): Promise<Vehicle>;
    /** A virtual entity of the group in dimension 0: streamingDistance is truncated and clamped to 1..group.maxStreamingDistance, data becomes its stream-synced metadata with the creation, so no player gets the entity without it, and fires no streamSyncedMetaChange; data that cannot be sent rejects the call. Rejects with TypeError for an invalid group, and with Error when the server creates none (its entity pool is full, or it no longer has the group). Removed when the resource stops. */
    createVirtualEntity(group: VirtualEntityGroup, pos: Vector3Like, streamingDistance: number, data?: { [key: string]: any }): Promise<VirtualEntity>;
    /** A group of virtual entities: a player streams at most maxEntitiesInStream of them (truncated, 1–512, the server's cap per group; 0 or missing: 1) within maxStreamingDistance metres (truncated, 1–20000, 20000 by default), and at most 1024 virtual entities over all groups. Rejects with Error when the server creates none. Destroyed with its entities when the resource stops. */
    createVirtualEntityGroup(maxEntitiesInStream: number, maxStreamingDistance?: number): Promise<VirtualEntityGroup>;
    /** A voice channel of this resource: in a spatial one members hear each other within maxDistance metres (50 when missing or not positive; the server keeps it to 1–10000), in a non-spatial one every member hears all. Throws outside a resource's code; destroyed when the resource stops. */
    createVoiceChannel(spatial: boolean, maxDistance?: number): VoiceChannel;
    /** True when server.toml sets debug = true; also when this resource's [config] table sets debug = true. logDebug writes only then. */
    readonly debug: boolean;
    /** Always 0: the dimension players and created entities start in. */
    readonly defaultDimension: number;
    /** Another name for deleteSyncedMeta: removes the key from every client; false when it was not set. */
    deleteGlobalMeta(key: string): boolean;
    /** Removes a key of the server's own global metadata; false when it was not set. globalMetaChange fires with value undefined. */
    deleteMeta(key: string): boolean;
    /** Removes a key of the global synced metadata, from every client too; false when it was not set. globalSyncedMetaChange fires with value undefined. */
    deleteSyncedMeta(key: string): boolean;
    /** Removes an NPC createNativePed made, for everyone (DELETE_ENTITY): its owner lets its copy go, the others remove the clone. It reads invalid from the call on, and valid again when the answer is false. False when it is gone, or when its owner's client did not negotiate owner migration. */
    destroyNativePed(ped: NativePed | number): Promise<boolean>;
    /** Removes any native vehicle for everyone, a client script's too (DELETE_ENTITY): its owner lets its copy go, the others remove the clone. It reads invalid from the call on, and valid again when the answer is false. False when it is gone, or when its owner's client did not negotiate owner migration. A train's engine takes every carriage of its train with it; a carriage behind its engine is not removed alone (false). */
    destroyNativeVehicle(vehicle: NativeVehicle | number): Promise<boolean>;
    /** A local event for this server's own handlers (varion.on); it does not reach clients. Handlers get copies: arrays and plain objects copied, a Vector3 or RGBA made anew, an entity or function the same object. */
    emit<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomEmitEvent, K>): void;
    /** A Player, Vehicle, Ped or Object among the arguments (or inside them) reaches each client as its own object of that id, null where it has none; a value that cannot be sent (a cycle, a BigInt beyond 2^53, binary data, a Map or Set, nesting past 32 levels) throws here. */
    emitAllClients<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emitAllClients, but a Map, Set, Date, BigInt, undefined, NaN and the infinities arrive as they left; a cycle or nesting past 32 levels throws here. */
    emitAllClientsRaw<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emitAllClients, but over the unreliable channel: an event may be lost or arrive out of order. One larger than server.toml maxServerScriptEventSize is not sent (logged). */
    emitAllClientsUnreliable<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** Sends an event to one player or to each player of a list. A Player that is no longer valid throws 'Invalid base object' alone and is skipped in a list, so the event never reaches whoever took its number. To reach every player use emitAllClients: a null target sends to nobody. */
    emitClient<K extends string>(target: Player | Player[], eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emitClient, but a Map, Set, Date, BigInt, undefined, NaN and the infinities arrive as they left; a cycle or nesting past 32 levels throws here. */
    emitClientRaw<K extends string>(target: Player | Player[], eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emitClient, but over the unreliable channel: the event may be lost or arrive out of order. A Player no longer valid throws alone and is skipped in a list; duplicates and ids outside 1..65534 are skipped; arguments that cannot be sent throw. */
    emitClientUnreliable<K extends string>(target: Player | Player[], eventName: K, ...args: CustomEventArgs<ICustomServerClientEvent, K>): void;
    /** As emit, a local event for this server's own handlers, but each value is a structured copy: Map, Set, Date and binary data are copied too and a value shared between arguments stays shared. Server objects (players, vehicles, ...) and class instances are handed on as they are. Nothing goes to clients. */
    emitRaw<K extends string>(eventName: K, ...args: CustomEventArgs<ICustomEmitEvent, K>): void;
    Entity: typeof Entity;
    Event: typeof Event;
    /** Runs the handler every 16 ms, in the calling resource's context (a throw is logged), unless a clear function or the resource's stop comes first. Returns its number, one sequence for every kind of timer. */
    everyTick(handler: () => void): number;
    ExplosionType: typeof ExplosionType;
    /** The server's current list: it publishes every change to the mirror first, then answers. */
    fetchNativeVehicles(): Promise<NativeVehicle[]>;
    File: typeof File;
    FileEncoding: typeof FileEncoding;
    /** A new snapshot of every resource the server knows, started or not (as Resource.get gives one). */
    getAllResources(): Resource[];
    /** The ammo type hash of a weapon from GTA's weapon data; 0 for a weapon without ammo (melee) or one the table lacks. The hash is read as uint32. */
    getAmmoHashForWeaponHash(weaponHash: number): number;
    /** The limit entities nearest to the position (negative or missing limit: all) within range metres (0 or less: everywhere) in the dimension (globalDimension: any), filtered by BaseObjectFilterType bits. sortOrder only orders them: SortOrderEnum.Ascending or Descending by distance; the default NoSorting keeps the order of the entity list. */
    getClosestEntities(position: Vector3Like, range: number, dimension: number, limit: number, allowedTypes?: number, sortOrder?: number): (Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed)[];
    /** Milliseconds between the server's colshape checks (server.toml colShapeTickRate, 150 by default). */
    getColShapeTickRate(): number;
    /** Every valid entity: players, the old path's vehicles, NPCs, objects and virtual entities, then native vehicles and NPCs. A new array on each call. */
    getEntities(): (Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed)[];
    /** Every entity in that dimension (globalDimension: in any), filtered by BaseObjectFilterType bits (all by default); unsorted. */
    getEntitiesInDimension(dimension: number, allowedTypes?: number): (Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed)[];
    /** Entities within range metres of the position (0 or less: everywhere) in the dimension (globalDimension: any), filtered by BaseObjectFilterType bits (all by default); unsorted. */
    getEntitiesInRange(position: Vector3Like, range: number, dimension: number, allowedTypes?: number): (Player | Vehicle | Ped | Object | VirtualEntity | NativeVehicle | NativePed)[];
    /** The entity lockdown of the server, or of one dimension (its own, else the server's): which cars, NPCs and objects a client may create; server.toml entityLockdown. */
    getEntityLockdown(dimension?: number): EntityLockdownMode;
    /** The handlers of a server event this resource registered (null or none: the generic ones of on(handler)); outside a resource's code, every resource's. */
    getEventListeners(eventName?: string | null): ((...args: any[]) => any)[];
    /** Another name for getSyncedMeta. */
    getGlobalMeta<K extends string>(key: K): CustomMetaValue<ICustomGlobalMeta, K, any>;
    /** Another name for getSyncedMetaKeys. */
    getGlobalMetaKeys(): string[];
    /** Not what the server loaded: the model hashes of every vehicle in the built-in catalog of GTA's own vehicles, sorted ascending; a new array on each call. Add-on vehicles of server packs are not in it. */
    getLoadedVehicleModels(): number[];
    /** The most objects of the old path one player streams at once (server.toml maxStreamingObjects, 512 by default). */
    getMaxStreamingObjects(): number;
    /** The most NPCs of the old path one player streams at once (server.toml maxStreamingPeds, 512 by default). */
    getMaxStreamingPeds(): number;
    /** The most other players one player streams at once (server.toml maxStreamingPlayers, 128 by default). */
    getMaxStreamingPlayers(): number;
    /** The most vehicles of the old path one player streams at once (server.toml maxStreamingVehicles, 512 by default). */
    getMaxStreamingVehicles(): number;
    /** A value of the server's own global metadata (setMeta); undefined when unset. No client sees it. A copy is stored and a copy read back: arrays and plain objects are copied, a Vector3 or RGBA made anew, an entity or function the same object. */
    getMeta<K extends string>(key: K): CustomMetaValue<ICustomGlobalMeta, K, any>;
    /** The keys of the server's own global metadata. */
    getMetaKeys(): string[];
    /** The legacy path's migration distance (server.toml migrationDistance, 150 m by default): a legacy vehicle's network owner moves to a nearer player when it is farther than this. Native vehicles and NPCs do not use it: they change owner when the owner no longer sees them (their streaming distance and the stream-out margin) or changes dimension; setNetOwner chooses one. */
    getMigrationDistance(): number;
    /** The threads that hand entities to new owners: 1, the server’s tick. */
    getMigrationThreadCount(): number;
    /** Milliseconds between the server's ownership passes on the old path (server.toml migrationTickRate, 100 by default). */
    getMigrationTickRate(): number;
    /** Every NPC createNativePed made that this host still holds as valid. */
    getNativePeds(): NativePed[];
    /** Every native vehicle, as the host mirrors them (owner and occupant changes at once, positions at most every 100 ms). */
    getNativeVehicles(): NativeVehicle[];
    /** The server's network time: milliseconds since it started, at once. The host keeps the core's net time it was last told (at its start, then with each entity batch) and adds the time since on its own clock. */
    getNetTime(): number;
    /** Every valid object of the old path (createObject). A new array on each call. */
    getObjects(): Object[];
    /** The same as PedModelInfo.get: a ped model of the built-in GTA catalog by hash or name. Throws Error for a model the catalog lacks. */
    getPedModelInfoByHash(model: number | string): IPedModel;
    /** Every valid NPC: the old path's, then those createNativePed made. A new array on each call. */
    getPeds(): (Ped | NativePed)[];
    /** The connected player with this id, or null. */
    getPlayer(id: number): Player | null;
    /** How many players are connected now, as getPlayers().length. */
    getPlayerCount(): number;
    /** Every connected player, ready or not (isReady), from playerConnect through playerDisconnect; a new array on each call. */
    getPlayers(): Player[];
    /** The connected players whose dimension equals it exactly (truncated to a 32-bit integer); globalDimension finds only players in that very dimension. */
    getPlayersInDimension(dimension: number): Player[];
    /** The handlers of a client event (onClient) this resource registered; null or none: the generic ones. Outside a resource's code, every resource's. */
    getRemoteEventListeners(eventName?: string | null): ((...args: any[]) => any)[];
    /** The [config] table of resource.toml (a copy); {} for an unknown resource. */
    getResourceConfig(resourceName?: string): Record<string, any>;
    /** A copy of the running server configuration. */
    getServerConfig(): Record<string, any>;
    /** The threads that decide what each player sees: 1, the server’s tick. */
    getStreamerThreadCount(): number;
    /** The server's streaming distance in metres (server.toml streamingDistance, 300 by default). */
    getStreamingDistance(): number;
    /** Milliseconds between the server's streaming passes, which decide who sees what (server.toml streamingTickRate, 50 by default). */
    getStreamingTickRate(): number;
    /** A value of the global synced metadata, as this host set it; undefined when unset. */
    getSyncedMeta<K extends string>(key: K): CustomMetaValue<ICustomGlobalSyncedMeta, K, any>;
    /** The keys of the global synced metadata. */
    getSyncedMetaKeys(): string[];
    /** The threads that receive the sync: 1, the server’s network thread (the uploads are then decoded on the sync pool). */
    getSyncReceiveThreadCount(): number;
    /** The threads that send the sync: the server’s sync pool (server.toml syncThreads; by default half the machine’s hardware threads, at most 12), which also relays and decodes uploads. */
    getSyncSendThreadCount(): number;
    /** A vehicle of the built-in GTA catalog by hash or name (hashed), in older field names than VehicleModelInfo.get (type is a ModelType). Throws Error for a model the catalog lacks, add-on vehicles included. */
    getVehicleModelInfoByHash(model: number | string): IVehicleModel;
    /** Every valid vehicle: the old path's, then native ones. A new array on each call. */
    getVehicles(): (Vehicle | NativeVehicle)[];
    /** Every valid virtual entity. A new array on each call. */
    getVirtualEntities(): VirtualEntity[];
    /** The voice service state, a VoiceConnectionState: 1 (connecting) until the server reports it ready (2); 0 once the server shuts down. */
    getVoiceConnectionState(): number;
    /** A weapon of the built-in GTA catalog by hash or name, as WeaponModelInfo.get but with modelName for its model. Throws Error for a weapon the catalog lacks. */
    getWeaponModelInfoByHash(weapon: number | string): IWeaponModel;
    /** The dimension every player sees, -2147483648. */
    readonly globalDimension: number;
    /** Whether the server has a paid feature (Benefit): a Varion server has none, so always false. */
    hasBenefit(benefit: number): boolean;
    /** Another name for hasSyncedMeta. */
    hasGlobalMeta(key: string): boolean;
    /** GTA's joaat hash of the text in lower case, as an unsigned 32-bit number (GET_HASH_KEY for an ASCII name); anything else is turned into text first. */
    hash(name: string): number;
    /** SHA-256 of the text as 64 lowercase hex characters, the same as stringToSHA256. Not comparable with a ConnectionInfo passwordHash or the hash in playerConnectDenied: the client binds those to its connection's transport key, which scripts do not get. The server checks its password itself: a connection scripts see has passed it, a wrong one arrives as playerConnectDenied. */
    hashServerPassword(password: string): string;
    /** Whether the server's own global metadata has the key. */
    hasMeta(key: string): boolean;
    /** Whether a resource of that name is loaded and not stopped; false for one that is stopped or failed to load. */
    hasResource(resourceName: string): boolean;
    /** Whether the global synced metadata has the key. */
    hasSyncedMeta(key: string): boolean;
    /** Always false on the server. */
    readonly isClient: boolean;
    /** Always true on the server. */
    readonly isServer: boolean;
    KeyCode: typeof KeyCode;
    /** In a resource bought on the platform: the terms it runs under. null in every other resource. */
    license: ResourceLicense | null;
    /** Writes one line to the server console at info level: a string as it is, anything else as util.inspect shows it ({ a: 1 }), joined by spaces; a line over 8192 bytes is cut. */
    log(...args: any[]): void;
    /** Writes a debug line, a string as it is and anything else as util.inspect shows it, only while debug is true: server.toml's debug, or this resource's [config] debug = true. */
    logDebug(...args: any[]): void;
    /** As log, at error level. */
    logError(...args: any[]): void;
    /** As log, at warning level. */
    logWarning(...args: any[]): void;
    Marker: typeof Marker;
    MarkerType: typeof MarkerType;
    ModelType: typeof ModelType;
    NativePed: typeof NativePed;
    NativeVehicle: typeof NativeVehicle;
    /** Runs the handler once on the next turn of the host's loop, in the calling resource's context (a throw is logged), unless a clear function or the resource's stop comes first. Returns its number, one sequence for every kind of timer. */
    nextTick(handler: (...args: any[]) => void, ...args: any[]): number;
    NumberPlateStyle: typeof NumberPlateStyle;
    Object: typeof Object;
    /** Removes this resource's registrations of the handler for the event, once() ones included; off(handler) removes one that on(handler) registered for every event. Without a handler nothing is removed. Another resource's handlers are never touched. */
    off<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): void;
    off(handler: (event: string, ...args: any[]) => void): void;
    /** Removes this resource's onClient registrations of the handler for the event; offClient(handler) removes one registered for every client event. Without a handler nothing is removed. Another resource's handlers are never touched. */
    offClient<K extends string>(eventName: K, handler: (player: Player, ...args: CustomEventArgs<ICustomClientServerEvent, K>) => void): void;
    offClient(handler: (eventName: string, player: Player, ...args: any[]) => void): void;
    /** Removes the RPC handler of that name if this resource registered it (with a handler: only if it is that one). There is one handler per name. */
    offRpc<K extends string>(rpcName: K, handler?: (player: Player, ...args: CustomEventArgs<ICustomClientServerRpc, K>) => CustomRpcResult<ICustomClientServerRpc, K> | Promise<CustomRpcResult<ICustomClientServerRpc, K>>): void;
    /** Calls the handler on each such event, from the server or varion.emit; on(handler) gets every event a script emits (not the built-in ones), its name first. It runs only while its resource runs and goes when it stops, a throw in it is logged, and registering outside a resource's code throws. */
    on<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): void;
    on(handler: (event: string, ...args: any[]) => void): void;
    /** As on, but the handler is removed before its first call. */
    once<E extends VarionEventName>(event: E, handler: VarionEventHandler<E>): void;
    once(handler: (event: string, ...args: any[]) => void): void;
    /** As onClient, but the handler is removed after its first call. Throws outside a resource's code; a non-function handler is ignored. */
    onceClient<K extends string>(eventName: K, handler: (player: Player, ...args: CustomEventArgs<ICustomClientServerEvent, K>) => void): void;
    onceClient(handler: (eventName: string, player: Player, ...args: any[]) => void): void;
    /** Calls the handler with the sending player and the arguments when a client sends the event (emitServer there); onClient(handler) gets every client event, its name first. Entity references arrive as this server's objects (null where it has none), a byte array (MValue.byteArray there) as an ArrayBuffer; registering outside a resource's code throws. */
    onClient<K extends string>(eventName: K, handler: (player: Player, ...args: CustomEventArgs<ICustomClientServerEvent, K>) => void): void;
    onClient(handler: (eventName: string, player: Player, ...args: any[]) => void): void;
    /** The handler's result (or the value its Promise resolves to) is the client's answer; a throw, or a returned Error, rejects the client's callServer with its message. One handler per name: a second throws while the first's resource runs. */
    onRpc<K extends string>(rpcName: K, handler: (player: Player, ...args: CustomEventArgs<ICustomClientServerRpc, K>) => CustomRpcResult<ICustomClientServerRpc, K> | Promise<CustomRpcResult<ICustomClientServerRpc, K>>): void;
    Ped: typeof Ped;
    PedConfigFlag: typeof PedConfigFlag;
    PedModelInfo: typeof PedModelInfo;
    Permission: typeof Permission;
    Player: typeof Player;
    PointBlip: typeof PointBlip;
    Quaternion: typeof Quaternion;
    RadioStation: typeof RadioStation;
    RadiusBlip: typeof RadiusBlip;
    /** Registers a Rayfire map object (such as breakable glass) by its exact GTA name at a place, radius 0.25–10 m (3 by default); with allowReports clients' reports of it are accepted. Names: 1–63 of A–Z a–z 0–9 _ . -; a bad name, radius, position, dimension or non-boolean allowReports throws. */
    registerRayfireTarget(exactName: string, position: Vector3Like, radius?: number, dimension?: number, allowReports?: boolean): void;
    /** Registers a door ("door", 1) or prop ("prop", 3) of a model name or hash at a place as a world-state target; with allowClientReports clients' reports of its state are accepted. Throws for glass, subject 0, coordinates beyond ±100000, a non-integer dimension or a non-boolean allowClientReports. */
    registerWorldStateTarget(kind: number | string, subject: number | string, position: Vector3Like, dimension?: number, allowClientReports?: boolean): void;
    Resource: typeof Resource;
    /** The name of the resource whose code is running. */
    readonly resourceName: string;
    /** Stops and starts a resource. Queued. */
    restartResource(resourceName: string): void;
    RGBA: typeof RGBA;
    /** The server's root folder (the folder of server.toml) when the core names it to the script host; otherwise the host's working directory (process.cwd()), which is the server's root on Linux and the bundled Node runtime's folder on Windows. */
    readonly rootDir: string;
    /** The same text as version, the engine version: the engine's SDK (types and client runtime) carries the engine's version. It is not the version of the varion command-line tools. */
    readonly sdkVersion: string;
    /** "local" (or 1): each GTA makes its own ambient NPCs and cars at these densities, 0–1 (1 by default; scenarioPeds follows peds, parkedVehicles follows vehicles), not synced between players. Any other mode: only server entities, random events suppressed; a density outside 0–1 makes the server ignore the call. */
    setAmbientPopulation(mode?: "server" | "local" | 0 | 1, densities?: { peds?: number; scenarioPeds?: number; vehicles?: number; parkedVehicles?: number }): void;
    /** Turns the city's artificial lights off for every player (SET_ARTIFICIAL_LIGHTS_STATE); affectsVehicles (true by default) takes vehicle lights too. */
    setBlackout(enabled: boolean, affectsVehicles?: boolean): void;
    /** How fast the world clock runs for every player: game seconds per real second, 0–3600; another value is ignored. */
    setClockRate(gameSecondsPerRealSecond: number): void;
    /** Sets the milliseconds between the server's colshape checks: truncated and clamped to 1–60000; a value that is not a finite number keeps the current one. */
    setColShapeTickRate(rate: number): void;
    /** Sets the world date and time for every player: month 0–11 (0 is January), day 1–31 within that month, year 1–9999, values truncated to integers. An invalid date is ignored. */
    setDateTime(day: number, month: number, year: number, hour: number, minute: number, second?: number): void;
    /** Sets a map door's door-system state (an integer 0–6) and, when given, its open ratio (-1 to 1) for the players of the dimension (worldStateGlobalDimension: all). A bad door, state, ratio, position or dimension throws. */
    setDoorState(doorHash: number | string, position: Vector3Like, systemState: number, openRatio?: number | null, dimension?: number): void;
    /** Sets the entity lockdown of the server, or of one dimension; null with a dimension gives it the server's mode again. A client's new entity is judged by its owner's dimension; one the mode refuses is removed at once, at its owner too. */
    setEntityLockdown(mode: EntityLockdownMode): void;
    setEntityLockdown(mode: EntityLockdownMode | null, dimension: number): void;
    /** Breaks (true, the default) or mends (false) the glass of a Rayfire target that registerRayfireTarget made under the same exact name, position and dimension, for the players of the dimension; the server ignores a target it does not have. A bad name, position or dimension, or a non-boolean broken throws. */
    setGlassState(exactName: string, position: Vector3Like, broken?: boolean, dimension?: number): void;
    /** Another name for setSyncedMeta: every client reads the value. Key 1–1024 UTF-8 bytes, value up to 512 KiB as JSON; throws for a value that cannot be sent. */
    setGlobalMeta<K extends string>(key: K, value: CustomMetaValue<ICustomGlobalMeta, K, any>): void;
    setGlobalMeta(values: CustomMetaValues<ICustomGlobalMeta, any>): void;
    /** GTA's gravity preset for every player (SET_GRAVITY_LEVEL), 0–3, truncated to an integer; another value is ignored. */
    setGravity(level: number): void;
    /** Runs the handler every delay ms with the extra arguments, in the calling resource's context (a throw is logged), unless a clear function or the resource's stop comes first. Returns its number, one sequence for every kind of timer. */
    setInterval(handler: (...args: any[]) => void, delay?: number, ...args: any[]): number;
    /** Marks a static map object of that model within radius metres (0.05–50, 1 by default) of the position as destroyed, or restores it with destroyed false, for every player, later ones too. A bad call (model 0, radius or coordinates out of range, over 4096 objects) is logged and ignored. */
    setMapObjectDestroyed(model: number | string, position: Vector3Like, radius?: number, destroyed?: boolean): void;
    /** Sets how many objects of the old path one player streams at most: truncated and clamped to 0–512; a value that is not a finite number keeps the current one. */
    setMaxStreamingObjects(limit: number): void;
    /** Sets how many NPCs of the old path one player streams at most: truncated and clamped to 0–512; a value that is not a finite number keeps the current one. */
    setMaxStreamingPeds(limit: number): void;
    /** Sets how many other players one player streams at most: truncated and clamped to 0–128 (0 counts as 1); a value that is not a finite number keeps the current one. */
    setMaxStreamingPlayers(limit: number): void;
    /** Sets how many vehicles of the old path one player streams at most: truncated and clamped to 0–512; a value that is not a finite number keeps the current one. */
    setMaxStreamingVehicles(limit: number): void;
    /** The server's own global metadata: no client sees it; globalMetaChange fires on a change. */
    setMeta<K extends string>(key: K, value: CustomMetaValue<ICustomGlobalMeta, K, any>): void;
    /** Sets the legacy path's migration distance (1..20000 m); native vehicles and NPCs do not use it (getMigrationDistance). */
    setMigrationDistance(distance: number): void;
    /** Changes nothing and says so in the log: they are fixed while the server runs (server.toml syncThreads sets the sync pool at the start). */
    setMigrationThreadCount(count: number): void;
    /** Sets the milliseconds between the server's ownership passes on the old path: truncated and clamped to 1–60000; a value that is not a finite number keeps the current one. */
    setMigrationTickRate(rate: number): void;
    /** Sets the server password for the next connections; an empty string turns it off. Throws TypeError for a non-string and RangeError past 1024 UTF-8 bytes. */
    setPassword(password: string): void;
    /** Deletes a map prop of that model at the position for the players of the dimension (worldStateGlobalDimension: all). flags must be WorldPropState.Deleted (2), the default; another flag, a bad model, position or dimension throws. */
    setPropState(model: number | string, position: Vector3Like, flags?: number, dimension?: number): void;
    /** Turns GTA's random events off (true) or back on for every player; turning them on works only in setAmbientPopulation("local"). */
    setRandomEventsSuppressed(suppressed: boolean): void;
    /** Changes nothing and says so in the log: they are fixed while the server runs (server.toml syncThreads sets the sync pool at the start). */
    setStreamerThreadCount(count: number): void;
    /** Sets the server's streaming distance: truncated and clamped to 1–20000 m; a value that is not a finite number keeps the current one. */
    setStreamingDistance(distance: number): void;
    /** Sets the milliseconds between the server's streaming passes, which decide who sees what: truncated and clamped to 1–60000; a value that is not a finite number keeps the current one. */
    setStreamingTickRate(rate: number): void;
    /** Global synced metadata: every client reads it (getSyncedMeta there); globalSyncedMetaChange fires on a change. Throws for a value that cannot be sent. */
    setSyncedMeta<K extends string>(key: K, value: CustomMetaValue<ICustomGlobalSyncedMeta, K, any>): void;
    /** Changes nothing and says so in the log: they are fixed while the server runs (server.toml syncThreads sets the sync pool at the start). */
    setSyncReceiveThreadCount(count: number): void;
    /** Changes nothing and says so in the log: they are fixed while the server runs (server.toml syncThreads sets the sync pool at the start). */
    setSyncSendThreadCount(count: number): void;
    /** Sets the world clock for every player: hour 0–23, minute and second 0–59, each truncated to an integer; a call with a value out of range is ignored. */
    setTime(hour: number, minute: number, second?: number): void;
    /** Runs the handler once after delay ms with the extra arguments, in the calling resource's context (a throw is logged), unless a clear function or the resource's stop comes first. Returns its number, one sequence for every kind of timer. */
    setTimeout(handler: (...args: any[]) => void, delay?: number, ...args: any[]): number;
    /** The game speed for every player, 0.05–1 (1 is normal); another value is ignored. */
    setTimeScale(scale: number): void;
    /** The server's traffic-light cycle, restarted now: green 1000–120000 ms, yellow 500–30000 ms, truncated; out of range is ignored. Clients follow it while setTrafficLightsAuthoritative(true). */
    setTrafficLightCycle(greenMs: number, yellowMs: number): void;
    /** True: each client drives the traffic lights near it by the server's cycle (setTrafficLightCycle), so every player sees the same lights; false gives them back to GTA. */
    setTrafficLightsAuthoritative(enabled: boolean): void;
    /** An external voice server: a Varion server’s voice chat is built in, so none is used; the call changes nothing and says so in the log. */
    setVoiceExternal(host: string, port: number): void;
    /** An external voice server (its public address): a Varion server’s voice chat is built in, so none is used; the call changes nothing and says so in the log. */
    setVoiceExternalPublic(host: string, port: number): void;
    /** A WeatherType value; transitionMs blends from the current weather (0: at once). */
    setWeather(weather: number, transitionMs?: number): void;
    SortOrderEnum: typeof SortOrderEnum;
    /** Starts a resource. Queued: resourceStart follows when it runs. */
    startResource(resourceName: string): void;
    /** Stops a resource. Queued: resourceStop follows when it stops. */
    stopResource(resourceName: string): void;
    /** Asks the server to shut down in order; it stops at its next tick. */
    stopServer(): void;
    /** SHA-256 of the text in UTF-8, as 64 lowercase hex characters; a non-string is converted with String. */
    stringToSHA256(value: string): string;
    TextLabel: typeof TextLabel;
    /** Starts a timer under the label ("default" by default); timeEnd logs it. Labels are shared by every resource of the host. */
    time(label?: string): void;
    /** Logs "label: N.NNNms" since time(label) and forgets the label; does nothing for a label time did not start. */
    timeEnd(label?: string): void;
    /** Switches the world sync profiler (server.toml worldProfiler) on or off while the server runs: its report goes to the server log every worldProfilerIntervalMs, the first one a period after it is switched on. */
    toggleWorldProfiler(state: boolean): void;
    /** Removes a Rayfire target that registerRayfireTarget made, with its state. Throws for a bad name, position or dimension. */
    unregisterRayfireTarget(exactName: string, position: Vector3Like, dimension?: number): void;
    Utils: typeof Utils;
    Vector2: typeof Vector2;
    Vector3: typeof Vector3;
    Vehicle: typeof Vehicle;
    VehicleBumper: typeof VehicleBumper;
    VehicleBumperDamage: typeof VehicleBumperDamage;
    VehicleDoor: typeof VehicleDoor;
    VehicleDoorState: typeof VehicleDoorState;
    VehicleLockState: typeof VehicleLockState;
    VehicleModelInfo: typeof VehicleModelInfo;
    VehicleModType: typeof VehicleModType;
    VehiclePart: typeof VehiclePart;
    VehiclePartDamage: typeof VehiclePartDamage;
    /** The engine version as "major.minor.patch" text. */
    readonly version: string;
    VirtualEntity: typeof VirtualEntity;
    VirtualEntityGroup: typeof VirtualEntityGroup;
    VoiceChannel: typeof VoiceChannel;
    VoiceConnectionState: typeof VoiceConnectionState;
    WeaponModelInfo: typeof WeaponModelInfo;
    WeatherType: typeof WeatherType;
    WindowTint: typeof WindowTint;
    WorldObject: typeof WorldObject;
    worldObjects: typeof worldObjects;
    WorldPropState: typeof WorldPropState;
    /** -2147483648: the dimension to give setDoorState, setPropState and the Rayfire calls for a state every dimension shares. */
    worldStateGlobalDimension: number;
    WorldStateKind: typeof WorldStateKind;
};

/** The type of the VARION API object. */
export type VarionApi = typeof varion;
export { varion };
export default varion;

// Resource scripts use the API as globals, without importing anything.
declare global {
    const varion: VarionApi;
}
