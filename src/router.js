import express from 'express'
import * as model from './model/index.js'

const router = express.Router()

const routerFunction = (Connection) => {
    const prefix = process.env.URL_PREFIX

    /**
     * Renvoie une définition à partir d'une URI.
     * @example /definition/anthrôpos?siblings
     * @queryparam {String} fields Colonnes à retourner (par ex. `uri,word,excerpt`).
     * @queryparam { null } siblings Retourner les mots adjacents.
     * @returns {Definition|DefinitionWithSiblings} Définition unique.
     */
    router.get(`${prefix}/definition/:uri`, async (req, res) => {
        try
        {
            const response = await model.getDefinitionByURI(
                Connection,
                req.params.uri,
                req.query
            )

            res.json(response)
        }
        catch (error)
        {
            console.log(error)
            res.status(500)
        }
    })

    /**
     * Renvoie une définition à partir d'un mot grec (colonne `word`).
     * @example /definition/word/ἄνθρωπος?siblings
     * @queryparam {String} fields Colonnes à retourner (par ex. `uri,word,excerpt`).
     * @queryparam {null} siblings Retourner les mots adjacents.
     * @returns {Definition|DefinitionWithSiblings} Définition unique.
     */
     router.get(`${prefix}/definition/word/:word`, async (req, res) => {
        try
        {
            const response = await model.getDefinitionByWord(
                Connection,
                req.params.word,
                req.query
            )

            res.json(response)
        }
        catch (error)
        {
            console.log(error)
            res.status(500)
        }
    })

    /**
     * Renvoie une liste de définitions à partir d'une chaîne
     * grecque normalisée (non accentuée, sans beta médian ni sigma final).
     * @example /definitions/ανθρωπ?fields=uri,word&exact&caseSensitive&limit=10&offset=0
     * @queryparam {String} fields Colonnes à retourner (par ex. `uri,word,excerpt`).
     * @queryparam {null} caseSensitive Sensibilité à la casse (désactivée par défaut).
     * @queryparam {null} exact Recherche exacte (par ressemblance des premiers caractères par défaut).
     * @queryparam {Number} limit Nombre maximum de résultats à retourner.
     * @queryparam {Number} offset Décalage des résultats à retourner.
     * @returns {Definition[]} Jeu de définitions.
     */
    router.get(`${prefix}/definitions/:searchable`, async (req, res) => {
        try
        {
            const response = await model.getDefinitionsBySearchable(
                Connection,
                req.params.searchable,
                req.query
            )

            res.json(response)
        }
        catch (error)
        {
            console.log(error)
            res.status(500)
        }
    })

    /**
     * Renvoie des jeux de données préformatés.
     * ex. Les quinze plus longs mots du dictionnaire (`longest-words`)
     */
    router.get(`${prefix}/facts/:title`, async (req, res) => {
        try
        {
            const response = await model.getFacts(
                Connection,
                req.params.title
            )

            res.json(response)
        }
        catch (error)
        {
            console.log(error)
            res.status(500)
        }
    })

    router.get(`${prefix}/`, (req, res) => res.sendStatus(200))

    return router
}

export default routerFunction
