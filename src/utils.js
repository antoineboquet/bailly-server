import chalk from 'chalk'

// Nombre maximum de lignes qu'une requête doit retourner.
// 2500 +/- = 45 requêtes pour récupérer l'ensemble du dictionnaire.
export const QUERY_MAX_LIMIT = 2500

// Colonnes par défaut utilisés par les différentes méthodes.
export const COMMON_FIELDS = 'uri,word,excerpt'

export function checkFields (fields) {
    const allowedFields = [
        'uri',
        'searchable',
        'searchableCaseInsensitive',
        'word',
        'htmlDefinition',
        'excerpt'
    ]

    try {
        fields = fields.replace(/\s/g, '').split(',')
        if (fields.every(field => allowedFields.includes(field))) return true

        throw new Error(
            chalk.bold('Unauthorized columns were passed to the query.\n') +
            'fields = "' + chalk.red(fields) + '"\n' +
            'allowedFields = "' + chalk.green(allowedFields) + '"\n'
        )
    } catch (e) {
        console.log(e)
    }
}
