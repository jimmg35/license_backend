import { BaseController, HTTPMETHOD } from "./BaseController"
import { Request, Response } from 'express'
import { PostgreSQLContext } from "../dbcontext"
import { autoInjectable } from "tsyringe"
import StatusCodes from 'http-status-codes'
import JwtAuthenticator from "../lib/JwtAuthenticator"

const { OK, UNAUTHORIZED } = StatusCodes

@autoInjectable()
export default class LicenseController extends BaseController {


    public dbcontext: PostgreSQLContext
    public jwtAuthenticator: JwtAuthenticator
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD; } = {
        "new": "POST"
    }

    constructor(dbcontext: PostgreSQLContext, jwtAuthenticator: JwtAuthenticator) {
        super()
        this.dbcontext = dbcontext
        this.dbcontext.connect()
        this.jwtAuthenticator = jwtAuthenticator
    }

    public new = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token)
        console.log(payload)
        console.log(params_set)
        if (status) {
            return res.status(OK).json({
                "status": "success"
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }

}
