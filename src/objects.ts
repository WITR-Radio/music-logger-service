export enum Type {
    Track,
    Event
}

export enum Service {
    Spotify
}

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

function serviceFromName(service: string): Service {
    if (service == 'spotify') {
        return Service.Spotify
    }

    // TODO

    return Service.Spotify
}

export class StreamingLink {
    link: string
    service: Service

    constructor(links: string, service: Service) {
        this.link = links;
        this.service = service;
    }
}

export class Track {
    id: number
    artist: string
    title: string
    time: Date
    group: string // This will be a value of getGroups
    type: Type
    streaming: StreamingLink[]

    constructor(id: number, artist: string, title: string, time: Date, group: string, type: Type, streaming: StreamingLink[]) {
        this.id = id;
        this.artist = artist;
        this.title = title;
        this.time = time;
        this.group = group;
        this.type = type;
        this.streaming = streaming;
    }

    static fromJSON(json: any): Track {
        return new Track(json['id'], json['artist'], json['title'], new Date(Date.parse(json['time'])), json['group'], typeFromName(json['type']), Track.parseStreaming(json['streaming']))
    }

    static parseStreaming(services: any[]): StreamingLink[] {
        return services.map(json => new StreamingLink(json['link'], serviceFromName(json['service'])))
    }

    isEvent(): boolean {
        return this.group == 'Event'
    }
}
