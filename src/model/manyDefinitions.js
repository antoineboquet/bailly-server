import { checkFields, COMMON_FIELDS, QUERY_MAX_LIMIT } from './../utils.js'

// Tableaux servant à la mémorisation des recherches nulles
// renvoyées par getDefinitionsBySearchable(). (La sensibilité
// à la casse induit deux branches pour les résultats.)
let nullCaseSensitiveQueries = []
let nullCaseInsensitiveQueries = []

// Ajoute des recherches aux tableaux précédents et vérifie que
// leur taille respective ne dépasse pas 1.000.000 de cases, auquel
// cas les tableaux sont écrasés.
function pushNullQueries (str, caseSensitive) {
    if (caseSensitive) {
        if (nullCaseSensitiveQueries.length >= 1000000) {
            nullCaseSensitiveQueries = []
        }

        nullCaseSensitiveQueries.push(str)
    } else {
        if (nullCaseInsensitiveQueries.length >= 1000000) {
            nullCaseInsensitiveQueries = []
        }

        nullCaseInsensitiveQueries.push(str)
    }
}

/**
 * Vérifie si la valeur de la recherche est acceptable.
 * @param searchValue Saisie utilisateur.
 * @returns {Boolean}
 */
 function isSearchValueAcceptable (str) {
    const truth = (
        // les mots mesurent 35 caractères max.
        str.length > 35 ||
        // = 4 caractères identiques à suivre (3 max.)
        /(.)\1{3,}/.test(str) ||
        // la recherche porte seulement sur des lettres grecques (digamma inclus)
        /[^αβγδεζηθικλμνξοπρστυφχψωϝ\s]/i.test(str) ||
        // pas d'espace initial ni de multiples `h` ou espaces consécutifs
        /^\s|[h\s]{2,}/.test(str)
    )

    return truth ? false : true
}

/**
 * Renvoie une liste de définitions en interrogeant la colonne `searchable`
 * à partir d'une chaîne grecque normalisée. Prend en compte différentes contraintes
 * passées dans l'objet `params`.
 *
 * @param {Connection} connection - connexion à la base de données.
 * @param {String} searchable - chaîne de caractères grecque normalisée.
 * @param {Object} [params] - ensemble de contraintes applicables à la recherche.
 * @param {String} params.fields - colonnes à retourner (par ex. `uri,word,excerpt`).
 * @param caseSensitive - sensibilité à la casse (désactivée par défaut).
 * @param exact - recherche exacte (par ressemblance des premiers caractères par défaut).
 * @param {Number} limit - nombre maximum de résultats à retourner.
 * @param {Number} offset - décalage des résultats à retourner.
 *
 * @returns {Definition[]}
 */
async function getDefinitionsBySearchable(connection, searchable, params = {}) {
    if (!isSearchValueAcceptable(searchable)) return false
    if (params.fields && !checkFields(params.fields)) return false

    if (!params.limit) {
        return 'La requête doit comporter un paramètre `limit`. ' +
            'Par ex. /definitions/αν?limit=' + (QUERY_MAX_LIMIT - 5)
    }
    else if (params.limit > QUERY_MAX_LIMIT) {
        return 'La requête dépasse la limite fixée à ' + QUERY_MAX_LIMIT + ' ' +
            'lignes (veuillez corriger `?limit=' + params.limit + ').'
    }

    params = {
        fields: params.fields || COMMON_FIELDS,
        exact: (params.exact !== undefined) ? true : false,
        caseSensitive: (params.caseSensitive !== undefined) ? true : false,
        limit: params.limit, // déjà testé ci-dessus
        offset: params.offset || undefined
    }

    if (params.caseSensitive) {
        if (nullCaseSensitiveQueries.includes(searchable)) return false
    } else {
        if (nullCaseInsensitiveQueries.includes(searchable)) return false
    }

    let query = []
    let queryParams = {}

    query.push(`SELECT ${params.fields}`)
    query.push('FROM dictionary')

    if (params.exact) {
        if (params.caseSensitive) {
            query.push('WHERE searchable = $searchable')
            queryParams.$searchable = searchable
        } else {
            query.push('WHERE searchableCaseInsensitive = $searchableCaseInsensitive')
            queryParams.$searchableCaseInsensitive = searchable.toLowerCase()
        }
    } else { // !params.exact
        if (params.caseSensitive) {
            query.push('WHERE searchable LIKE $searchableLike')
            queryParams.$searchableLike = searchable + '%'

        } else {
            query.push('WHERE searchableCaseInsensitive LIKE $searchableLikeCaseInsensitive')
            queryParams.$searchableLikeCaseInsensitive = searchable.toLowerCase() + '%'
        }
    }

    query.push('ORDER BY orderedID')

    query.push('LIMIT $limit')
    queryParams.$limit = params.limit

    if (params.offset) {
        query.push('OFFSET $offset')
        queryParams.$offset = params.offset
    }

    if (params.exact || params.limit || params.offset) {
        // Seconde requête pour obtenir l'ensemble des résultats (`countAll`)
        // par ressemblance du début de la chaîne recherchée dans le cas où
        // les paramètres de recherches filtrent les résultats. N.B. la contrainte
        // `caseSensitive` n'est pas prise en compte.
        query[0] += ',(SELECT COUNT(orderedID) FROM dictionary'

        if (params.caseSensitive) {
            query[0] += ' WHERE searchable LIKE $searchableLike'
            queryParams.$searchableLike = searchable + '%'
        } else {
            query[0] += ' WHERE searchableCaseInsensitive LIKE $searchableLikeCaseInsensitive'
            queryParams.$searchableLikeCaseInsensitive = searchable.toLowerCase() + '%'
        }

        query[0] += ') AS countAll'
    }

    const data = await connection.all(query.join(' '), queryParams)

    // countAll est reproduit dans chaque élément retourné
    const countAll = (data[0] && data[0].countAll) ? data[0].countAll : undefined

    if (!countAll) pushNullQueries (searchable, params.caseSensitive)

    for (let i = 0; i < data.length; i++) {
        delete data[i].countAll
    }

    return {
        count: data.length,
        countAll: countAll, // résultats par ressemblance
        definitions: data
    }
}

export { getDefinitionsBySearchable }
