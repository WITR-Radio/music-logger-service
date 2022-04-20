import {createContext} from "react";
import {TrackHandler} from "./track-handler";
import {TrackReceiver} from "./track-receiver";

/**
 * Holds the track handler and receivers.
 */
interface TrackState {

    /**
     * The track handler, for general track managing.
     */
    trackHandler: TrackHandler

    /**
     * The track receiver, for receiving new tracks live.
     */
    trackReceiver: TrackReceiver
}

/**
 * A context to provide a single instance of `TrackHandler` and `TrackReceiver` to wherever the context is used.
 * This defaults to both internal objects being undefined.
 */
export const TrackContext = createContext<TrackState>({} as TrackState)
