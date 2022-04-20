import {Track} from "./objects";

/**
 * A handler to allow for the invoker to receive live updates on when tracks are added.
 */
export class TrackReceiver {

    /**
     * The URL to the websocket listening for new tracks. If this is undefined, websockets will not be enabled.
     */
    readonly websocketURL?: string

    /**
     * Invoked when a track is received from the websocket.
     */
    readonly receiveTrack: (track: Track) => void

    /**
     * Creates a `TrackReceiver` object to handle receiving tracks when they are added.
     *
     * @param websocketURL The URL to the websocket connecting to the backend. If not present, a websocket will never
     *                     be established.
     * @param receiveTrack The handler to be invoked when a track is received
     */
    constructor(websocketURL: string, receiveTrack: (track: Track) => void) {
        this.websocketURL = websocketURL
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
                const webSocket = new WebSocket(this.websocketURL)

                webSocket.onmessage = (event: MessageEvent) => {
                    // if (!this.searching()) {
                        // this.manualAddTrack(Track.fromJSON(JSON.parse(event.data)))
                        this.receiveTrack(Track.fromJSON(JSON.parse(event.data)))
                    // }
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
