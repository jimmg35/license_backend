import { BaseController, HTTPMETHOD } from "./BaseController"
import { Request, Response } from 'express'
import { PostgreSQLContext } from "../dbcontext"
import { autoInjectable } from "tsyringe"
import StatusCodes from 'http-status-codes'

const { OK } = StatusCodes

@autoInjectable()
export default class HomeController extends BaseController {


    public dbcontext: PostgreSQLContext
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD; } = {
        "get": "GET",
        "post": "POST"
    }

    constructor(dbcontext: PostgreSQLContext) {
        super()
        this.dbcontext = dbcontext
        this.dbcontext.connect()
    }

    public get = async (req: Request, res: Response) => {
        const params_set = { ...req.query }
        return res.status(OK).json({
            ...params_set
        })
    }

    public post = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        return res.status(OK).json({
            ...params_set
        })
    }

}
