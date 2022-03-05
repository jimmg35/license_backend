import './pre-start'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import https from 'https'
import express, { Router } from 'express'
import { IController } from './controllers/BaseController'
import { autoInjectSubRoutes } from './controllers/BaseController'

interface IServerParam {
    controllers: Array<IController>
}

export class Server {
    private app: express.Application
    private routerBundler: Router

    /**
     * 建構子內的方法須按順序執行
     * @param controllers 要註冊的controller陣列
     */
    constructor(options: IServerParam) {


        this.app = express()
        this.addMiddlewares()

        this.routerBundler = Router()
        this.registerControllers(
            options.controllers
        )
        this.bindRouter()
    }

    /**
     * 註冊middlewares
     */
    private addMiddlewares = (): void => {
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(express.json())
        this.app.use(cors())
    }

    /**
     * 用於註冊router
     */
    private bindRouter = (): void => {
        this.app.set('port', process.env.PORT || 5000)
        this.app.use('/api', this.routerBundler)
    }

    /**
     * 註冊controller與其方法至router上
     * @param controllers 
     */
    public registerControllers = (controllers: Array<IController>): void => {
        // 註冊controller與其方法至router上
        controllers.forEach((controller: IController, index: number) => {
            autoInjectSubRoutes(controller)
            this.routerBundler.use(controller.routerName, controller.getRouter())
        })
    }

    public start = (): void => {

        if (process.env.PROTOCOL == 'https') {
            https.createServer({
                key: fs.readFileSync(path.join(__dirname, `../envConfig/https/agent2-key.pem`)),
                cert: fs.readFileSync(path.join(__dirname, `../envConfig/https/agent2-cert.pem`))
            }, this.app).listen(this.app.get("port"), () => {
                console.log(`server is listening at ${process.env.PROTOCOL}://${process.env.DOMAIN_NAME}:${this.app.get('port')}`)
            })
        } else {
            this.app.listen(this.app.get("port"), () => {
                console.log(`server is listening at ${process.env.PROTOCOL}://${process.env.DOMAIN_NAME}:${this.app.get('port')}`)
            })
        }
    }
}
