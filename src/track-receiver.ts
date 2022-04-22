import {Track} from "./objects";

/**
 * A handler to allow for the invoker to receive live updates on when tracks are added.
 */
export class TrackReceiver {

    /**
     * The URL to the websocket listening for new tracks. If this is undefined, websockets will not be enabled.
     * URL queries should not be included in this URL, things like underground will be handled internally.
     */
    readonly websocketURL?: string

    /**
     * If this should only broadcast tracks on the underground station.
     */
    readonly underground: boolean

    /**
     * Invoked when a track is received from the websocket.
     */
    readonly receiveTrack: (track: Track) => void

    /**
     * Creates a `TrackReceiver` object to handle receiving tracks when they are added.
     *
     * @param websocketURL The URL to the websocket connecting to the backend. If not present, a websocket will never
     *                     be established.
     * @param underground If `true`, only tracks on the underground station will be broadcasted. If `false`, only FM
     *                    tracks will be sent.
     * @param receiveTrack The handler to be invoked when a track is received
     */
    constructor(websocketURL: string, underground: boolean, receiveTrack: (track: Track) => void) {
        this.websocketURL = websocketURL
        this.underground = underground
        this.receiveTrack = receiveTrack
    }

    /**
     * Connects to the websocket. If `websocketUrl` is undefined, this will do nothing.
     *
     * @return A promise of the open status (`true` indicated connected, false if no `websocketURL` is present)
     */
    connectWebsocket(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.websocketURL == undefined) {
                resolve(false)
                return
            }

            try {
                let urlQuery = new URLSearchParams({underground: `${this.underground}`})
                const webSocket = new WebSocket(`${this.websocketURL}?${urlQuery}`)

                webSocket.onmessage = (event: MessageEvent) => {
                    this.receiveTrack(Track.fromJSON(JSON.parse(event.data)))
                };

                webSocket.onerror = (error) => {
                    console.log(error);
                    reject()
                }

                webSocket.onopen = (_) => {
                    console.log('Connected to websocket!')
                    resolve(true)
                }
            } catch (e) {
                console.error(e)
                reject()
            }
        })
    }
}