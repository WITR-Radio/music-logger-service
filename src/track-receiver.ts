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
    underground: boolean

    /**
     * Invoked when a track is received from the websocket.
     */
    readonly receiveTrack: (track: Track) => void

    private webSocket: WebSocket | undefined

    // The type is any to replace the NodeJS.Timeout type
    private heartbeatInterval?: any

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
     * Connects to the websocket. If `websocketUrl` is undefined or {@link webSocket} is defined, this will do nothing.
     *
     * @param autoReconnect If `true`, if the connection is closed it will reinvoke this method after 3 seconds
     * @return A promise of the open status (`true` indicated connected, false if no `websocketURL` is present)
     */
    connectWebsocket(autoReconnect: boolean = false): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.websocketURL == undefined || this.webSocket != undefined) {
                resolve(false)
                return
            }

            try {
                let urlQuery = new URLSearchParams({underground: `${this.underground}`})
                this.webSocket = new WebSocket(`${this.websocketURL}/api/tracks/stream?${urlQuery}`)

                this.webSocket.onmessage = (event: MessageEvent) => {
                    this.receiveTrack(Track.fromJSON(JSON.parse(event.data)))
                };

                this.webSocket.onerror = (error) => {
                    console.error(error);
                    reject()
                }

                this.webSocket.onopen = (_) => {
                    console.debug('Connected to websocket!')
                    resolve(true)
                }

                // Heartbeat every 50 seconds
                this.heartbeatInterval = setInterval(() => {
                    if (this.webSocket != undefined) {
                        this.heartbeat(this.webSocket);
                    }
                }, 50000)

                if (autoReconnect) {
                    this.webSocket.onclose = (_) => {
                        setTimeout(() => {
                            this.connectWebsocket(autoReconnect)
                        }, 3000)
                    }
                }
            } catch (e) {
                console.error(e)
                reject()
            }
        })
    }

    /**
     * Sends a heartbeat message to the websocket, if it is open.
     *
     * @param websocket The websocket to send the heartbeat to
     */
    private heartbeat(websocket: WebSocket): void {
        if (websocket.readyState == WebSocket.OPEN) {
            websocket.send(JSON.stringify({'heartbeat': ''}));
        }
    }

    /**
     * If the websocket is open, the currently playing track is requested. This will be sent to {@link receiveTrack}.
     *
     * @return If the track could be requested. This gives no indication if the track was actually received, just if it
     *         was requested
     */
    requestCurrentTrack(): boolean {
        if (this.webSocket == undefined || this.webSocket.readyState != WebSocket.OPEN) {
            return false
        }

        this.webSocket.send(JSON.stringify({'request': 'current'}))
        return true
    }

    /**
     * Sets the receiver to listen to underground or FM. An update will send the currently playing track on the stream.
     *
     * @param underground `true` if underground should be listened to
     */
    setUnderground(underground: boolean): void {
        if (this.underground == underground) {
            return
        }

        console.log('setUndg ' + underground);
        this.underground = underground

        clearInterval(this.heartbeatInterval)
        this.webSocket?.close()
    }
}
