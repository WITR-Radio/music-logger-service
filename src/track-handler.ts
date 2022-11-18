import {Track} from "./objects";
import {fetchUrl} from "./requests";

/**
 * A handler to fetch, manipulate and delete tracks.
 */
export class TrackHandler {

    /**
     * Sets a new list of tracks for the UI to display.
     * This should generally be a `React.Dispatch` (from a `useState<Track>` controlling the displayed tracks)
     */
    readonly setTracks: (set: (oldTracks: Track[]) => Track[]) => void

    /**
     * The base server URL to create all requests off of.
     */
    readonly requestURL: string

    /**
     * If tracks should be fetched from the underground playlist.
     */
    readonly underground: boolean

    /**
     * The amount of tracks to get each request.
     */
    readonly listCount: number

    /**
     * The base URL to add query parameters onto for track listing.
     */
    readonly baseListUrl: string

    /**
     * The first listing URL requested, stored for resetting.
     */
    readonly originalURL: string

    /**
     * The next URL that will be fetched to list tracks
     */
    nextURL: string

    /**
     * If tracks are actively being searched. This will disable websocket song adding.
     */
    searching: boolean = false

    /**
     * Creates a `TrackHandler` object to manage track processing.
     *
     * @param setTracks A callback method to set the tracks' state in the UI
     * @param requestURL The URl of the backend server to start requests from
     * @param underground If requests should be sent to the underground database
     * @param listCount The amount of tracks to fetch in each listing
     */
    constructor(setTracks: (setTracks: (oldTracks: Track[]) => Track[]) => void, requestURL: string, underground: boolean, listCount: number) {
        this.setTracks = setTracks
        this.requestURL = requestURL
        this.underground = underground
        this.listCount = listCount
        this.baseListUrl = `${this.requestURL}/api/tracks/list`
        this.nextURL = `${this.baseListUrl}?count=${listCount}&underground=${this.underground}`
        this.originalURL = this.nextURL
    }

    /**
     * Resets the current page.
     */
    reset(): void {
        this.nextURL = this.originalURL
    }

    /**
     * Loads more tracks (Setting new ones via `setTracks`). This may be used for initial loading as well.
     */
    loadMoreTracks(): Promise<void> {
        return this.loadTracksFromUrl(this.nextURL)
    }

    /**
     * Loads tracks from the given URL, setting them with `setTracks`.
     *
     * @param url The URL to request tracks from
     * @param overrideList If previous tracks should be ignored when invoking `setTracks` (`true` sets all tracks to
     *                     the fetched collection)
     * @param searching If this is a searching request (ignores incoming websocket tracks if true)
     */
    loadTracksFromUrl(url: string, overrideList: boolean = false, searching: boolean = false): Promise<void> {
        this.searching = searching
        return fetchUrl(url)
            .then(async res => {
                if (res.status != 200) {
                    console.error(`[tracks/list] Erroneous status of ${res.status}: ${await res.json()}`)
                    return
                }

                let json = await res.json()

                this.nextURL = json['_links']['next']

                let tracks = json['tracks'].map((track: any) => Track.fromJSON(track))

                if (overrideList) {
                    this.setTracks(tracks)
                } else {
                    this.setTracks(old => [...old, ...tracks])
                }
            })
    }

    /**
     * Deletes a track from the system, updating the UI with `setTracks`.
     *
     * @param track The track to delete
     */
    deleteTrack(track: Track): Promise<void> {
        return fetchUrl(`${this.requestURL}/api/tracks/delete`, {
            id: track.id.toString(),
            underground: `${this.underground}`
        }, {
            method: 'DELETE'
        }).then(async res => {
            if (res.status != 200) {
                console.error(`[tracks/remove] Erroneous status of ${res.status}: ${await res.json()}`)
                return
            }

            this.setTracks(old => old.filter(oldTrack => oldTrack.id != track.id))
        })
    }

    /**
     * Adds a track to the system, updating the UI with `setTracks`.
     *
     * @param title The title of the track
     * @param artist The artist name of the track
     * @param group The group of the track
     * @param date The date the track was played
     * @param event If this is adding an event
     */
    submitAdd(title: string | undefined, artist: string | undefined, group: string | undefined, date: Date, event: boolean): Promise<void> {
        return fetchUrl(`${this.requestURL}/api/tracks/add`, {underground: `${this.underground}`}, {
            method: 'POST',
            body: JSON.stringify({
                'title': event ? '' : title, // TODO: Make this null when the backend is updated!
                'artist': artist,
                'group': event ? 'Event' : group,
                'time': date.getTime()
            })
        }).then(async res => {
            if (res.status != 200) {
                console.error(`[tracks/add] Erroneous status of ${res.status}: ${await res.json()}`)
                return
            }

            this.manualAddTrack(Track.fromJSON(await res.json()))
        })
    }

    /**
     * Searches for tracks with the given parameters. All are optional, if no search parameters can be used, this
     * defaults to an initial track listing.
     *
     * To filter between dates, both `startDate` and `endDate` must be defined.
     *
     * @param artist The artist to search
     * @param title The title to search
     * @param startDate The inclusive start date to filter tracks by
     * @param endDate The inclusive end date to filter tracks by
     */
    searchTracks(artist: string | undefined, title: string | undefined, startDate: Date | undefined, endDate: Date | undefined): Promise<void> {
        let urlQuery = new URLSearchParams({count: `${this.listCount}`, underground: `${this.underground}`})
        let searching = false

        artist ??= ''
        if (artist != '') {
            searching = true
            urlQuery.append('artist', artist)
        }

        title ??= ''
        if (title != '') {
            searching = true
            urlQuery.append('song', title)
        }

        if (startDate != undefined && endDate != undefined) {
            searching = true
            urlQuery.append('start', startDate.getTime().toString())
            urlQuery.append('end', endDate.getTime().toString())
        }

        return this.loadTracksFromUrl(`${this.baseListUrl}?${urlQuery}`, true, searching)
    }

    /**
     * Updates the `Track` with the given information, updating the UI with `setTracks`.
     *
     * @param id The original ID of the track
     * @param track The `Track` object
     * @param title The new title of the track
     * @param artist The new artist of the track
     * @param group The new group of the track
     * @param date The new date of the track
     */
    updateTrack(id: number, track: Track, title: string, artist: string, group: string, date: Date): Promise<void> {
        return fetchUrl(`${this.requestURL}/api/tracks/update`, {underground: `${this.underground}`}, {
            method: 'PATCH',
            body: JSON.stringify({
                'id': id,
                'title': title,
                ...(!track.isEvent() && {
                    'artist': artist,
                    'group': group
                }),
                'time': date.getTime()
            })
        }).then(async res => {
            if (res.status != 200) {
                console.error(`[tracks/update] Erroneous status of ${res.status}: ${await res.json()}`)
                return
            }

            this.setTracks(old => {
                let editedTrack = old.find(track => track.id == id)
                if (editedTrack == undefined) {
                    console.error('Edited track not found!');
                    return old
                }

                editedTrack.title = title
                editedTrack.artist = artist
                editedTrack.group = group
                editedTrack.time = date
                return old
            })
        })
    }

    /**
     * Allows the UI caller to add a track manually. This is used for admin UI.
     * This invokes `setTracks`, ensuring the track is not a duplicate.
     *
     * @param track The track being added
     */
    manualAddTrack(track: Track): void {
        // Don't add if a duplicate
        this.setTracks(old => {
            if (old.findIndex(t => t.id == track.id) === -1) {
                return [track, ...old]
            } else {
                return old
            }
        })
    }
}
