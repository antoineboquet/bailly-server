/**
 * Requêtes préformatées renvoyant des faits divers sur le dictionnaire.
 */
async function getFacts (connection, title) {
    switch (title) {
        // Quinze plus longs mots (35-24 lettres)
        case 'longest-words':
            let query = `
                SELECT uri, word, LENGTH(word) as length FROM dictionary
                ORDER BY LENGTH(word) DESC LIMIT 15
            `
            return await connection.all(query)
            break

        default: break
    }
}

export { getFacts }
