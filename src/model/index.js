export * from './facts.js'
export * from './manyDefinitions.js'
export * from './oneDefinition.js'

/**
 * @typedef  {Object} Definition
 * @property {Number} orderedID
 * @property {String} uri
 * @property {String} searchable
 * @property {String} searchableCaseInsensitive
 * @property {String} word
 * @property {String} htmlDefinition
 * @property {String} excerpt
 */

/**
 * @typedef  {Object} Siblings
 * @property {Object} previous
 * @property {String} previous.uri
 * @property {String} previous.word
 * @property {Object} next
 * @property {String} next.uri
 * @property {String} next.word
 */

/**
 * @typedef {Object} DefinitionWithSiblings
 * @property {Object} Definition
 * @property {Object} Siblings
 */
