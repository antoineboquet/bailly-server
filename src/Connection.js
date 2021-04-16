import chalk from 'chalk'
import sqlite3 from 'sqlite3'

class Connection {
    constructor (filePath, verbose = false, trace = false) {
        let tmp = sqlite3
        if (verbose) {
            tmp = tmp.verbose()
        }
        this.Connection = new tmp.Database(filePath, sqlite3.OPEN_READONLY)
        if (trace) {
            this.Connection.on('trace', (query) => {
                console.log(`${chalk.bgCyanBright.black(' QUERY ')} ${chalk.cyanBright.bold(query)}\n`)
            })
        }
    }

    get (query, params) {
        return new Promise((resolve, reject) => {
            this.Connection.get(query, params, function (err, row) {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    }

    all (query, params) {
        return new Promise((resolve, reject) => {
            this.Connection.all(query, params, function (err, rows) {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }

    async close () {
        await new Promise((resolve, reject) => {
            this.Connection.close(err => {
                if (err) {
                    reject(err)
                } else {
                    this.Connection = null
                    resolve()
                }
            })
        })
    }
}

export default Connection
