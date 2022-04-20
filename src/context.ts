import {createContext} from "react";
import {TrackHandler} from "./track-handler";

export const TrackHandlerContext = createContext<TrackHandler>({} as TrackHandler)
