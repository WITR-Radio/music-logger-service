/**
 * The type of track this is
 */
export enum Type {
    /**
     * A normal song
     */
    Track,

    /**
     * An event, containing only the `artist` column and no `title`. TODO: Should these be switched?
     */
    Event
}

/**
 * The available streaming services that may be linked.
 */
export enum Service {

    /**
     * Spotify, using the WITR Spotify account for credentials.
     */
    Spotify
}

/**
 * Gets the track type from a string.
 *
 * @param type The lowercase type
 */
function typeFromName(type: string): Type {
    if (type == 'track') {
        return Type.Track
    } else if (type == 'event') {
        return Type.Event
    }

    return Type.Track

    // TODO
    // throw 'Invalid type: ' + type
}

/**
 * Gets the streaming service from its name
 *
 * @param service The lowercase service name
 */
function serviceFromName(service: string): Service {
    if (service == 'spotify') {
        return Service.Spotify
    }

    // TODO

    return Service.Spotify
}

/**
 * Data for a track collected from a specific streaming service.
 */
export class StreamingLink {

    /**
     * The link to play the track from the service.
     */
    link: string | undefined

    /**
     * A link to a low-res album art image (this should be used only for icons, generally well under 100x100 pixels big).
     */
    artwork: string | undefined

    /**
     * The service this data is for.
     */
    service: Service | undefined

    /**
     * Creates a StreamingLink.
     *
     * @param link The link to the song on the streaming service
     * @param albumArt A link to the album art
     * @param service The service this object is for
     */
    constructor(link: string | undefined, albumArt: string | undefined, service: Service | undefined) {
        this.link = link;
        this.artwork = albumArt
        this.service = service;
    }
}

/**
 * Either a song or event that may be displayed as a line in a logger instance.
 */
export class Track {

    /**
     * The unique ID of the track.
     */
    id: number

    /**
     * The artist name of the track (If the type is `Type.Event` is an event, this will be the event description).
     */
    artist: string

    /**
     * The title of the track (Blank if an event).
     */
    title: string

    /**
     * The Date this track was played at.
     */
    time: Date

    /**
     * The group this track belongs to.
     */
    group: string // This will be a value of getGroups

    /**
     * The type of the track.
     */
    type: Type

    /**
     * All available `StreamingLink`s for the track. If a streaming service couldn't find the track by its artist and
     * title, it will not be present in the array.
     */
    streaming: StreamingLink[]

    /**
     * Creates a Track.
     *
     * @param id The track's ID
     * @param artist The artist name
     * @param title The title
     * @param time The time this was played at
     * @param group The track's group
     * @param type The type of track
     * @param streaming Any available streaming links
     */
    constructor(id: number, artist: string, title: string, time: Date, group: string, type: Type, streaming: StreamingLink[]) {
        this.id = id;
        this.artist = artist;
        this.title = title;
        this.time = time;
        this.group = group;
        this.type = type;
        this.streaming = streaming;
    }

    /**
     * Creates a `Track` from given JSON input (generally provided by the server).
     *
     * @param json The JSON input
     */
    static fromJSON(json: any): Track {
        return new Track(json['id'], json['artist'], json['title'], new Date(Date.parse(json['time'])), json['group'], typeFromName(json['type']), Track.parseStreaming(json['streaming']))
    }

    /**
     * Parses a JSON array into an array of `StreamingLink`s.
     *
     * @param services The JSON array
     */
    static parseStreaming(services: any[]): StreamingLink[] {
        return services.map(json => new StreamingLink(json['link'], json['artwork'], serviceFromName(json['service'])))
    }

    /**
     * Checks if the track is an event (checking by its group).
     */
    isEvent(): boolean {
        return this.group == 'Event'
    }

    /**
     * Gets the album art (if found) from the Spotify service.
     */
    getAlbumArt(): string | undefined {
        if (this.streaming.length == 0) {
            return undefined
        }

        return this.streaming.find(streaming => streaming.artwork != undefined)?.artwork
    }
}

/**
 * A track that has been sent from the server.
 */
export class TrackBroadcast {

    /**
     * The track this object holds.
     */
    readonly track: Track

    /**
     * If the track was manually requested. `false` means this was a normal broadcast track that is currently being
     * played.
     */
    readonly requested: boolean

    constructor(track: Track, requested: boolean) {
        this.track = track;
        this.requested = requested;
    }

    /**
     * Creates a {@link TrackBroadcast} from given JSON input.
     *
     * @param json The JSON input
     */
    static fromJSON(json: any): TrackBroadcast {
        return new TrackBroadcast(Track.fromJSON(json['track']), json['requested'])
    }
}
