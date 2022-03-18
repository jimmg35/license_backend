import { BaseController, HTTPMETHOD } from "./BaseController"
import { Request, Response } from 'express'
import { PostgreSQLContext } from "../dbcontext"
import { autoInjectable } from "tsyringe"
import { User } from "../entity/authentication/User"
import { Application } from "../entity/licenseApplication/application"
import StatusCodes from 'http-status-codes'
import JwtAuthenticator from "../lib/JwtAuthenticator"
import LicenseSender from "../lib/LicenseSender"

const { OK, UNAUTHORIZED, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = StatusCodes

@autoInjectable()
export default class LicenseController extends BaseController {


    public dbcontext: PostgreSQLContext
    public jwtAuthenticator: JwtAuthenticator
    public licenseSender: LicenseSender
    public routeHttpMethod: { [methodName: string]: HTTPMETHOD; } = {
        "approveLicense": "PUT",
        "listAll": "GET",
        "listByUser": "GET",
        "new": "POST"
    }

    constructor(dbcontext: PostgreSQLContext, jwtAuthenticator: JwtAuthenticator, licenseSender: LicenseSender) {
        super()
        this.dbcontext = dbcontext
        this.dbcontext.connect()
        this.jwtAuthenticator = jwtAuthenticator
        this.licenseSender = licenseSender
    }

    public approveLicense = async (req: Request, res: Response) => {
        const params_set = { ...req.body }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const application_repository = this.dbcontext.connection.getRepository(Application)
            const user = await user_repository.createQueryBuilder("user")
                .where("user.userId = :userId", { userId: params_set._userId })
                .leftJoinAndSelect("user.application", "application").getOne()
            const user_application = user?.application
            if (user_application && user) {

                const response = await this.licenseSender.sendMail({
                    email: user.email,
                    firstname: user_application.firstName,
                    lastname: user_application.lastName,
                    username: user_application.arcGisUsername,
                    fullname: user_application.fullname
                })
                if (response.status === 200) {
                    console.log(await response.json())
                    user_application.approved = true
                    await application_repository.save(user_application)
                    return res.status(OK).json({
                        "status": "application approved"
                    })
                }

                return res.status(INTERNAL_SERVER_ERROR).json({
                    "status": "ArcGIS online license failed"
                })

            }
            return res.status(NOT_FOUND).json({
                "status": "application not found"
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
    }

    public listAll = async (req: Request, res: Response) => {
        const params_set = { ...req.query }
        const { status, payload } = this.jwtAuthenticator.isTokenValid(params_set.token as string)
        if (status) {
            const user_repository = this.dbcontext.connection.getRepository(User)
            const users = await user_repository.createQueryBuilder("user")
                .leftJoinAndSelect("user.application", "application").getMany()
            const response: User[] = users
            // for (let i = 0; i < users.length; i++) {
            //     if (users[i].application === null) {
            //         continue
            //     }
            //     if (users[i].application.approved === false) {
            //         response.push(users[i])
            //     }
            // }
            return res.status(OK).json({
                response
            })
        }
        return res.status(UNAUTHORIZED).json({
            "status": "token is not valid"
        })
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
                ...user
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
