import { checkFields, COMMON_FIELDS } from './../utils.js'

/**
 * Cherche une définition dans la base de données et, si requis, un jeu
 * de données minimal concernant les mots adjacents (`siblings`).
 * @param {Object} connection Connexion à la base de données.
 * @param {String} uri Identifiant unique de la définition à retourner.
 * @param {Object} params Contraintes de recherche.
 * @param {String} params.fields Champs à retourner.
 * @param {null} params.siblings Retourner les mots adjacents.
 * @returns {Definition|DefinitionWithSiblings}
 */
async function getDefinitionByURI (connection, uri, params = {}) {
    if (params.fields && !checkFields(params.fields)) return false
    if (!uri) return false

    if (params.siblings !== undefined) {
        let query = `SELECT ${params.fields || COMMON_FIELDS },orderedID FROM dictionary WHERE uri = ?`
        const definition = await connection.get(query, uri) || {}

        if (definition) {
            query = `SELECT uri,word,orderedID FROM dictionary WHERE orderedID = ? OR orderedID = ? ORDER BY orderedID`
            let params = [definition.orderedID - 1, definition.orderedID + 1]

            const siblings = await connection.all(query, params) || []

            let previous = {}, next = {}

            if (siblings.length === 1) {
                if (siblings[0].orderedID === params[0]) {
                    previous = siblings[0]
                }

                if (siblings[0].orderedID === params[1]) {
                    next = siblings[0]
                }
            } else {
                previous = siblings[0]
                next = siblings[1]
            }

            delete definition.orderedID
            delete previous.orderedID
            delete next.orderedID

            return {
                definition: definition,
                siblings: {
                    previous: previous,
                    next: next
                }
            }
        }
    } else {
        let query = `SELECT ${params.fields || COMMON_FIELDS } FROM dictionary WHERE uri = ?`
        return await connection.get(query, uri)
    }
}

async function getDefinitionByWord (connection, word, params = {}) {
    if (params.fields && !checkFields(params.fields)) return false
    if (!word) return false

    let query = `SELECT ${params.fields || COMMON_FIELDS } FROM dictionary WHERE word = ?`
    return await connection.get(query, word)
}

export { getDefinitionByURI, getDefinitionByWord }
