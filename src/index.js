import chalk from 'chalk'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import morgan from 'morgan'
import Connection from './Connection.js'
import router from './router.js'

dotenv.config()

const connection = new Connection(
    process.env.DB_FILE_PATH,
    process.env.NODE_ENV !== 'production',
    process.env.NODE_ENV !== 'production'
)

const app = express()

if (process.env.NODE_ENV !== 'production') {
    const display =
        `${chalk.bgYellow(' :method ')} ` +
        `${chalk.inverse(' :status ')} ` +
        `${chalk.dim(':url')} ` +
        `has returned ${chalk.bold(':res[content-length] o')} ` +
        `in ${chalk.bold(':response-time ms')}`

    app.use(morgan(`${display}\n`))

    app.use(express.static(import.meta.path + '/../dist'))
}

app.use(cors({
    methods: 'GET',
    origin: 'https://bailly.app'
}))

app.use(router(connection))

/* eslint-disable-next-line */
app.use((error, req, res, next) => {
    console.log(chalk.red.bold(error.toString()))
    return res.sendStatus(500)
})

const port = process.env.PORT ?? 3000

const server = app.listen(port, () => {
    console.clear()
    console.log(chalk.green.bold('🏇 Server is running\n'))
})

if (process.env.NODE_ENV !== 'production') {
    app.use('*', (req, res) => res.sendFile(import.meta.path + '/../dist/index.html'))
}

process.on('SIGTERM', () => {
    server.close(async () => {
        await connection.close()
    })
})

process.on('SIGINT', () => {
    server.close(async () => {
        await connection.close()
    })
})
