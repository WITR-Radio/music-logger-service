/**
 * Fetches the possible groups
 * @param underground If this is for underground
 */
import {fetchUrl} from "./requests";

/**
 * Gets the groups available for tracks.
 *
 * @param requestURL The URl of the backend server to start requests from
 * @param underground If requests should be sent to the underground database
 */
export async function getGroups(requestURL: string, underground: boolean): Promise<string[]> {
    return fetchUrl(`${requestURL}/api/groups/list`, {underground: `${underground}`}).then(res => {
        if (res.status != 200) {
            console.log(`[groups/list] Erroneous status of ${res.status}: ${res.json()}`)
            return []
        }

        return res.json()
    })
}
