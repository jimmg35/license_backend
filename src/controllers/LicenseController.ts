import { BaseController, HTTPMETHOD } from "./BaseController"
import { Request, Response } from 'express'
import { PostgreSQLContext } from "../dbcontext"
import { autoInjectable } from "tsyringe"
import { User } from "../entity/authentication/User"
import { Application } from "../entity/licenseApplication/Application"
import StatusCodes from 'http-status-codes'
import JwtAuthenticator from "../lib/JwtAuthenticator"

const { OK, UNAUTHORIZED, BAD_REQUEST, NOT_FOUND } = StatusCodes

@autoInjectable()
export default class LicenseController extends BaseController {


    public dbcontext: PostgreSQLContext
    public jwtAuthenticator: JwtAuthenticator
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD; } = {
        "listByUser": "GET",
        "new": "POST"
    }

    constructor(dbcontext: PostgreSQLContext, jwtAuthenticator: JwtAuthenticator) {
        super()
        this.dbcontext = dbcontext
        this.dbcontext.connect()
        this.jwtAuthenticator = jwtAuthenticator
    }

    public listByUser = async (req: Request, res: Response) => {
        const params_set = { ...req.query }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token as string)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const user = await user_repository.createQueryBuilder("user")
                .where("user.userId = :userId", { userId: payload._userId })
                .leftJoinAndSelect("user.application", "application").getOne()
            if (user?.application === null) {
                return res.status(NOT_FOUND).json({
                    "status": "application record not found"
                })
            }
            return res.status(OK).json({
                ...user?.application
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }

    public new = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const application_repository = this.dbcontext.connection.getRepository(Application)
            const user = await user_repository.createQueryBuilder("user")
                .where("user.userId = :userId", { userId: payload._userId })
                .leftJoinAndSelect("user.application", "application").getOne()
            if (user?.application !== null) {
                return res.status(BAD_REQUEST).json({
                    "status": "submit duplicate"
                })
            }
            const application = new Application()
            application.user = user as User
            application.firstName = params_set.firstName
            application.lastName = params_set.lastName
            application.arcGisUsername = params_set.username
            application.grade = params_set.grade
            application.course = params_set.course
            application.fullname = params_set.firstName + ' ' + params_set.lastName
            await application_repository.save(application)
            return res.status(OK).json({
                "status": "success"
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }
}
