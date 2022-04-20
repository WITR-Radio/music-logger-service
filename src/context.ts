import {createContext} from "react";
import {TrackHandler} from "./track-handler";

const TrackHandlerContext = createContext<TrackHandler>({} as TrackHandler)

export default TrackHandlerContext
